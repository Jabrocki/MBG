import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { divIcon, type LatLngLiteral } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { navigate } from '../navigation'
import { illustrations } from '../data'
import {
  api,
  ApiError,
  getStoredSession,
  type GeographicMap,
  type GeographicMarker,
  type Innovation,
  type InnovationMatch,
  type InstitutionAdaptation,
  type Pilot,
  type ProblemCandidate,
  type Report,
} from '../api'
import { InnovationDocument, InnovationPreview } from '../components/InnovationText'
import { getInnovationPreview, getSafeExternalUrl, toReadableInnovationText } from '../innovation-content'
import {
  Badge,
  ButtonLink,
  DemoStatus,
  Empty,
  Fact,
  Field,
  Heading,
  Icon,
  Link,
  Notice,
  Panel,
  Tabs,
  type Notify,
} from '../ui'

type Props = { path: string; state: string; notify: Notify }

const MALOPOLSKA_MAP_CENTER: LatLngLiteral = { lat: 50.0619, lng: 19.9368 }
// Commercial-friendly provider configured at deploy time; no Google or OSM tiles.
const MAP_TILE_URL = import.meta.env.VITE_MAP_TILE_URL
  ?? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
const MAP_ATTRIBUTION = import.meta.env.VITE_MAP_ATTRIBUTION
  ?? '© Esri, HERE, Garmin'

type ChosenLocation = {
  lat: number
  lon: number
  source: 'map' | 'gps' | 'manual'
}

const selectedLocationIcon = divIcon({
  className: 'mbg-leaflet-pin mbg-leaflet-pin--selected',
  html: '<span aria-hidden="true">●</span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

function MapViewport({ center, zoom }: { center: LatLngLiteral; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center.lat, center.lng, map, zoom])
  return null
}

function MapPointPicker({ onPick }: { onPick: (point: LatLngLiteral) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng)
    },
  })
  return null
}

function LocationPicker({
  value,
  onChange,
  onError,
}: {
  value: ChosenLocation
  onChange: (location: ChosenLocation) => void
  onError: (message: string) => void
}) {
  const [locating, setLocating] = useState(false)
  const [localityQuery, setLocalityQuery] = useState('')
  const [localities, setLocalities] = useState<Awaited<ReturnType<typeof api.searchLocalities>>>([])
  useEffect(() => {
    const query = localityQuery.trim()
    if (query.length < 2) {
      setLocalities([])
      return
    }
    const timer = window.setTimeout(() => {
      api.searchLocalities(query).then(setLocalities).catch(() => setLocalities([]))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [localityQuery])
  const position: LatLngLiteral = { lat: value.lat, lng: value.lon }
  function pick(point: LatLngLiteral, source: ChosenLocation['source'] = 'map') {
    onChange({ lat: point.lat, lon: point.lng, source })
  }
  function useDeviceLocation() {
    if (!navigator.geolocation) {
      onError('Ta przeglądarka nie udostępnia geolokalizacji. Wskaż punkt na mapie lub wpisz współrzędne ręcznie.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        pick({ lat: position.coords.latitude, lng: position.coords.longitude }, 'gps')
        onError('')
        setLocating(false)
      },
      () => {
        onError('Nie udało się pobrać lokalizacji urządzenia. Wskaż miejsce na mapie albo wpisz współrzędne ręcznie.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }
  return (
    <section className="geographic-picker" aria-label="Wybór lokalizacji problemu">
      <Field label="Miejscowość w Małopolsce" hint="Wyszukiwanie korzysta z geokodera ArcGIS, bez Google Maps i kafelków OSM.">
        <input
          value={localityQuery}
          onChange={(event) => setLocalityQuery(event.target.value)}
          placeholder="np. Limanowa, Krynica-Zdrój, Brzesko"
          autoComplete="off"
        />
        {localities.length > 0 && (
          <div className="locality-results" role="listbox">
            {localities.map((locality) => (
              <button
                type="button"
                className="locality-result"
                key={`${locality.latitude}:${locality.longitude}:${locality.name}`}
                onClick={() => {
                  onChange({ lat: locality.latitude, lon: locality.longitude, source: 'manual' })
                  setLocalityQuery(locality.name)
                  setLocalities([])
                  onError('')
                }}
              >
                <strong>{locality.name}</strong><span>{locality.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </Field>
      <MapContainer center={position} zoom={10} className="leaflet-map" scrollWheelZoom>
        <MapViewport center={position} zoom={value.source === 'gps' ? 14 : 10} />
        <TileLayer
          attribution={MAP_ATTRIBUTION}
          url={MAP_TILE_URL}
        />
        <MapPointPicker onPick={(point) => pick(point)} />
        <Marker
          position={position}
          icon={selectedLocationIcon}
          draggable
          eventHandlers={{
            dragend(event) {
              const marker = event.target
              pick(marker.getLatLng())
            },
          }}
        >
          <Popup>To będzie lokalizacja zgłoszenia.</Popup>
        </Marker>
      </MapContainer>
      <div className="geographic-picker-actions">
        <button type="button" className="button secondary" onClick={useDeviceLocation} disabled={locating}>
          <Icon name="MapPin" />
          {locating ? 'Pobieranie lokalizacji…' : 'Użyj lokalizacji urządzenia'}
        </button>
        <p>
          Kliknij mapę albo przeciągnij znacznik. Wybrany punkt: {value.lat.toFixed(5)}, {value.lon.toFixed(5)}.
        </p>
      </div>
    </section>
  )
}

export function Citizen({ path, state, notify }: Props) {
  if (path === '/start') return <Home />
  if (path === '/zgloszenia/nowe') return <ReportForm state={state} />
  if (/^\/zgloszenia\/[^/]+\/potwierdzenie$/.test(path))
    return <Confirmation reportId={Number(path.split('/')[2])} state={state} />
  if (/^\/zgloszenia\/[^/]+\/wyniki$/.test(path))
    return <Results problemId={Number(path.split('/')[2])} state={state} />
  if (path === '/zgloszenia') return <Reports />
  if (/^\/zgloszenia\/[^/]+$/.test(path)) return <ReportDetail reportId={Number(path.split('/')[2])} />
  if (path === '/innowacje') return <Catalogue />
  if (/^\/innowacje\/(?:api\/)?\d+$/.test(path)) return <ApiInnovation id={Number(path.split('/').at(-1))} />
  if (path.startsWith('/innowacje/')) return <Empty title="Nie znaleźliśmy innowacji." text="Wybierz pozycję z aktualnego katalogu." to="/innowacje" action="Wróć do katalogu" />
  if (path === '/potrzeby' || path === '/potrzeby/najczestsze')
    return <Needs frequent={path.endsWith('najczestsze')} />
  if (path.startsWith('/potrzeby/')) return <NeedDetail id={path.split('/')[2]} />
  if (/^\/potrzeby\/\d+\/pomysl$/.test(path)) return <IdeaForm problemId={Number(path.split('/')[2])} />
  if (path === '/pomysly/nowy') return <Empty title="Wybierz problem, który chcesz rozwiązać." text="Każdy pomysł musi być przypisany do konkretnego problemu. Otwórz jego kartę i wybierz „Zaproponuj pomysł” tam, gdzie ma pomagać." to="/potrzeby" action="Przejdź do problemów" />
  if (path === '/pomysly') return <Ideas />
  if (/^\/pomysly\/\d+\/dyskusja$/.test(path)) return <Discussion ideaId={Number(path.split('/')[2])} notify={notify} />
  if (/^\/pomysly\/\d+$/.test(path)) return <IdeaDetail ideaId={Number(path.split('/')[2])} notify={notify} />
  if (path.startsWith('/pomysly/')) return <Empty title="Nie znaleźliśmy pomysłu." text="Wybierz pozycję z dostępnej listy pomysłów." to="/pomysly" action="Wróć do pomysłów" />
  if (path === '/poparcie') return <Support notify={notify} />
  if (path === '/adaptacje/nowa') return <AdaptForm />
  if (path.startsWith('/adaptacje/')) return <Adaptation />
  if (path === '/pilotaze') return <Pilots />
  if (path.startsWith('/pilotaze/')) return <PilotPage path={path} notify={notify} />
  if (path === '/powiadomienia') return <Notifications notify={notify} />
  if (path === '/moje-aktywnosci') return <Activities />
  if (['/pomoc', '/prywatnosc', '/dostepnosc'].includes(path)) return <Information path={path} />
  return (
    <>
      <Heading title="Nie znaleźliśmy tej strony." />
      <Empty
        title="Wróć do swoich spraw."
        to="/start"
        action="Wróć do strony głównej"
        text="Skorzystaj z menu, aby przejść do dostępnych części aplikacji."
      />
    </>
  )
}
function Home() {
  const [reports, setReports] = useState<Report[]>([])
  const [nearby, setNearby] = useState<GeographicMarker[]>([])
  useEffect(() => {
    let active = true
    Promise.all([api.listMyReports(), api.getMapMarkers(MALOPOLSKA_MAP_CENTER.lat, MALOPOLSKA_MAP_CENTER.lng, 40)])
      .then(([loadedReports, map]) => {
        if (!active) return
        setReports(loadedReports)
        setNearby(map.markers.filter((marker) => marker.entity_type === 'problem').slice(0, 2))
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])
  const latestConfirmed = reports.find((report) => report.canonical_problem_id)
  return (
    <>
      <section className="home-welcome">
        <div>
          <h1 tabIndex={-1}>Dzień dobry.</h1>
          <p>
            Sprawy blisko Ciebie.
            <br />
            Pomysły, które mogą pomóc.
          </p>
          <span className="location">
            <Icon name="MapPin" size={17} />
            Małopolska · dane z Twojej sesji
          </span>
        </div>
        <img src="/images/community.webp" alt="" />
      </section>
      <div className="quick-actions">
        {[
          [
            '/zgloszenia/nowe',
            'Zgłoś potrzebę',
            'Opisz sprawę. Znajdź możliwe rozwiązania.',
            'Plus',
            'green',
          ],
          [
            '/innowacje',
            'Odkryj innowacje',
            'Poznaj metody i narzędzia z biblioteki.',
            'Books',
            'blue',
          ],
          [
            '/poparcie',
            'Wesprzyj propozycję',
            'Pokaż, co ma znaczenie w Twojej okolicy.',
            'Heart',
            'yellow',
          ],
        ].map(([url, title, text, icon, tone]) => (
          <Link className={`quick-action ${tone}`} href={url} key={url}>
            <span className="quick-icon">
              <Icon name={icon as 'Plus'} size={25} />
            </span>
            <h2>{title}</h2>
            <p>{text}</p>
            <Icon name="ArrowRight" />
          </Link>
        ))}
      </div>
      <div className="split-grid">
        <section>
          <div className="section-heading">
            <h2>Twoja sprawa ma dalszy ciąg.</h2>
            <Link href="/zgloszenia">
              Moje zgłoszenia
              <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
          {latestConfirmed ? (
            <Panel>
              <Badge>Potwierdzona potrzeba</Badge>
              <h3>{latestConfirmed.text_raw.slice(0, 90)}{latestConfirmed.text_raw.length > 90 ? '…' : ''}</h3>
              <p>{latestConfirmed.location_name}</p>
              <ButtonLink to={`/zgloszenia/${latestConfirmed.canonical_problem_id}/wyniki`} secondary>
                Zobacz rozwiązania
              </ButtonLink>
            </Panel>
          ) : (
            <Empty title="Nie masz jeszcze potwierdzonej potrzeby." text="Dodaj zgłoszenie, aby otrzymać dopasowania." to="/zgloszenia/nowe" action="Zgłoś potrzebę" />
          )}
        </section>
        <section>
          <div className="section-heading">
            <h2>Możesz dołączyć.</h2>
            <Link href="/pilotaze">
              Pilotaże
              <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
          <PilotTeaser />
        </section>
      </div>
      <section className="home-needs">
        <div className="section-heading">
          <h2>O czym mówi Twoja okolica?</h2>
          <Link href="/potrzeby">
            Zobacz potrzeby
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
        {nearby.length ? nearby.map((problem) => (
          <Link href={`/potrzeby/${problem.entity_id}`} className="need-row" key={problem.id}>
            <span className="row-icon">
              <Icon name="Users" size={25} />
            </span>
            <div>
              <h3>{problem.title}</h3>
              <p>
                {problem.location_name} · {problem.reporter_count ?? 0} unikalnych zgłaszających
              </p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        )) : <Empty title="Brak potrzeb w pobranym obszarze." text="Po potwierdzeniu zgłoszenia pojawią się tutaj zagregowane potrzeby." to="/zgloszenia/nowe" action="Dodaj zgłoszenie" />}
      </section>
    </>
  )
}

function PilotTeaser() {
  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .listPilots()
      .then((items) => {
        if (!active) return
        setPilot(items.find((item) => item.status === 'recruitment_funding') ?? items[0] ?? null)
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać pilotaży.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="photo-teaser" aria-busy="true">
        <span>Wczytywanie dostępnych pilotaży…</span>
      </div>
    )
  }
  if (error) {
    return (
      <Panel>
        <p>{error}</p>
        <ButtonLink to="/pilotaze" secondary>
          Otwórz pilotaże
        </ButtonLink>
      </Panel>
    )
  }
  if (!pilot) {
    return (
      <Panel>
        <p>Nie ma obecnie pilotaży dostępnych do udziału.</p>
        <ButtonLink to="/pilotaze" secondary>
          Zobacz pilotaże
        </ButtonLink>
      </Panel>
    )
  }
  return (
    <Link href={`/pilotaze/${pilot.id}`} className="photo-teaser">
      <img src={illustrations.people} alt="" />
      <div>
        <Badge tone={pilotStatusTone(pilot.status)}>{pilotStatusLabel(pilot.status)}</Badge>
        <h3>{pilot.title}</h3>
        <span>
          Zobacz szczegóły i możliwość udziału
          <Icon name="ArrowRight" size={16} />
        </span>
      </div>
    </Link>
  )
}

function ReportForm({ state }: { state: string }) {
  const [step, setStep] = useState(state === 'poza-regionem' ? 2 : 1),
    [text, setText] = useState(sessionStorage.getItem('mbg-report') ?? ''),
    [location, setLocation] = useState<ChosenLocation>({
      lat: MALOPOLSKA_MAP_CENTER.lat,
      lon: MALOPOLSKA_MAP_CENTER.lng,
      source: 'map',
    }),
    [audience, setAudience] = useState('Bliskich / innych osób'),
    [error, setError] = useState(
      state === 'poza-regionem' ? 'Wybierz punkt w Małopolsce.' : '',
    ),
    [submitting, setSubmitting] = useState(false)
  const errorSummary = useRef<HTMLDivElement>(null)
  const descriptionField = useRef<HTMLTextAreaElement>(null)
  const locationField = useRef<HTMLInputElement>(null)
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (step === 1) {
      if (text.trim().length < 30) {
      setError('Opisz sprawę przynajmniej jednym pełnym zdaniem (minimum 30 znaków).')
        requestAnimationFrame(() => errorSummary.current?.focus())
        return
      }
      setError('')
      setStep(2)
      return
    }
    setSubmitting(true)
    try {
      const submission = await api.createReport({
        text,
        location_lat: location.lat,
        location_lon: location.lon,
        location_name:
          location.source === 'gps'
            ? 'Lokalizacja wskazana przez urządzenie'
            : location.source === 'manual'
              ? 'Współrzędne wpisane ręcznie'
              : 'Punkt wskazany na mapie',
        location_type: location.source,
      })
      sessionStorage.setItem(`mbg-report-${submission.report.id}`, JSON.stringify(submission.report))
      sessionStorage.setItem(`mbg-candidates-${submission.report.id}`, JSON.stringify(submission.suggested_candidates))
      navigate(`/zgloszenia/${submission.report.id}/potwierdzenie`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się zapisać zgłoszenia.')
      requestAnimationFrame(() => errorSummary.current?.focus())
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <>
      <Heading
        title="Co warto zmienić w Twojej okolicy?"
        description="Nie musisz znać rozwiązania. Zacznij od opisania potrzeby."
        back="/start"
      />
      <ol className="stepper">
        {['Opis potrzeby', 'Miejsce i widoczność', 'Potwierdzenie', 'Rozwiązania'].map((s, i) => (
          <li key={s} className={i + 1 === step ? 'current' : ''}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="detail-layout">
        <Panel>
          <form onSubmit={submit}>
            {step === 1 ? (
              <>
                <h2>Powiedz nam, czego brakuje.</h2>
                <Field
                  label="Opis potrzeby"
                  hint="Wpisuj wyłącznie dane przykładowe. Pomiń nazwiska, numery telefonów i dane medyczne konkretnych osób."
                >
                  <textarea
                    id="report-description"
                    ref={descriptionField}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'report-error' : undefined}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    required
                    maxLength={2000}
                  />
                </Field>
                <div className="counter">{text.length}/2000</div>
                <fieldset className="choice-fieldset">
                  <legend>Kogo dotyczy ta sprawa?</legend>
                  <div className="choice-grid">
                    {['Mnie', 'Bliskich / innych osób', 'Organizacji', 'Lokalnej społeczności'].map(
                      (a) => (
                        <label className={audience === a ? 'selected' : ''} key={a}>
                          <input
                            type="radio"
                            name="audience"
                            value={a}
                            checked={audience === a}
                            onChange={() => setAudience(a)}
                          />
                          <Icon name="Users" />
                          {a}
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>
              </>
            ) : (
              <>
                <h2>Gdzie potrzebna jest zmiana?</h2>
                <p className="muted">Wskaż dokładne miejsce na mapie, użyj lokalizacji urządzenia albo wpisz współrzędne ręcznie.</p>
                <LocationPicker
                  value={location}
                  onChange={(next) => {
                    setLocation(next)
                    setError('')
                  }}
                  onError={setError}
                />
                <div className="form-grid geographic-coordinate-inputs">
                  <Field label="Szerokość geograficzna">
                    <input
                      ref={locationField}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={location.lat}
                      onChange={(event) => setLocation((current) => ({ ...current, lat: Number(event.target.value), source: 'manual' }))}
                      aria-invalid={!!error}
                      aria-describedby={error ? 'report-error' : undefined}
                      required
                    />
                  </Field>
                  <Field label="Długość geograficzna">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={location.lon}
                      onChange={(event) => setLocation((current) => ({ ...current, lon: Number(event.target.value), source: 'manual' }))}
                      aria-invalid={!!error}
                      aria-describedby={error ? 'report-error' : undefined}
                      required
                    />
                  </Field>
                </div>
                <label className="checkbox-line">
                  <input type="checkbox" defaultChecked />
                  Ukryj autora przed innymi użytkownikami
                </label>
                <small>
                  Administrator widzi syntetyczną tożsamość autora. To ustawienie nie anonimizuje
                  wszystkich informacji zawartych w opisie.
                </small>
              </>
            )}
            {error && (
              <div id="report-error" ref={errorSummary} tabIndex={-1} className="error-summary">
                <Notice tone="error">
                  {error}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() =>
                      step === 1 ? descriptionField.current?.focus() : locationField.current?.focus()
                    }
                  >
                    {step === 1 ? 'Popraw opis potrzeby' : 'Popraw miejsce potrzeby'}
                  </button>
                </Notice>
              </div>
            )}
            <div className="form-actions">
              {step > 1 ? (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                >
                  Wróć do opisu
                </button>
              ) : (
                <Link href="/start">Anuluj</Link>
              )}
              <button className="button" type="submit" disabled={submitting}>
                {step === 1 ? 'Dalej: miejsce potrzeby' : submitting ? 'Zapisywanie…' : 'Przejdź do potwierdzenia'}
                <Icon name="ArrowRight" />
              </button>
            </div>
          </form>
        </Panel>
        <aside className="context-aside">
          <img src="/images/community.webp" alt="" />
          <h2>Najpierw zrozummy potrzebę.</h2>
          <p>
            Krótko opisz sytuację, odbiorców i przeszkodę. Potem sprawdzisz podpowiedzi i
            wybierzesz, czy podobna sprawa pasuje do Twojej.
          </p>
          <Notice>
            Dane identyfikujące są usuwane przed przekazaniem opisu do modułu AI. Wynik klasyfikacji
            sprawdzisz przed potwierdzeniem powiązania.
          </Notice>
        </aside>
      </div>
    </>
  )
}
function Confirmation({ reportId, state }: { reportId: number; state: string }) {
  const storedReport = sessionStorage.getItem(`mbg-report-${reportId}`)
  const storedCandidates = sessionStorage.getItem(`mbg-candidates-${reportId}`)
  const [report, setReport] = useState<Report | null>(storedReport ? (JSON.parse(storedReport) as Report) : null)
  const [candidates] = useState<ProblemCandidate[]>(
    storedCandidates ? (JSON.parse(storedCandidates) as ProblemCandidate[]) : [],
  )
  const [categories, setCategories] = useState<string[]>(report?.categories ?? ['Społeczność lokalna'])
  const [selected, setSelected] = useState<string>('new')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (report) return
    api.getReport(reportId).then(setReport).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać zgłoszenia.')
    })
  }, [report, reportId])
  async function confirm() {
    setSaving(true)
    setError('')
    try {
      await api.updateReportCategories(reportId, categories)
      const selectedCandidate = candidates.find((candidate) => String(candidate.problem_id) === selected)
      const problem = await api.confirmGrouping(
        reportId,
        selectedCandidate?.problem_id ?? null,
        !selectedCandidate,
      )
      navigate(`/zgloszenia/${problem.id}/wyniki`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się potwierdzić powiązania.')
    } finally {
      setSaving(false)
    }
  }
  if (!report && !error) {
    return <DemoStatus state="ladowanie" />
  }
  return (
    <>
      <Heading
        title="Czy dobrze rozumiemy Twoją potrzebę?"
        description="Sprawdź podpowiedzi. Żadne powiązanie nie powstaje bez Twojego potwierdzenia."
        back="/zgloszenia/nowe"
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <h2>Podpowiedzi do sprawdzenia</h2>
            <Badge tone="blue">Szacunki AI</Badge>
            <fieldset className="chip-fieldset">
              <legend>Kategorie — możesz wybrać kilka</legend>
              {[...new Set([...categories, 'Seniorzy', 'Edukacja', 'Dostępność', 'Społeczność lokalna'])].map((c) => (
                <label className={categories.includes(c) ? 'selected' : ''} key={c}>
                  <input
                    type="checkbox"
                    checked={categories.includes(c)}
                    onChange={() =>
                      setCategories(
                        categories.includes(c)
                          ? categories.filter((x) => x !== c)
                          : [...categories, c],
                      )
                    }
                  />
                  {c}
                </label>
              ))}
            </fieldset>
            <div className="facts">
              <Field label="Odbiorcy · szacunek AI">
                <input value={report?.audience ?? ''} readOnly />
              </Field>
              <Field label="Pilność · szacunek AI">
                <input value={report?.urgency ?? ''} readOnly />
              </Field>
              <Field label="Czas trwania · szacunek AI">
                <input value={report?.duration ?? ''} readOnly />
              </Field>
            </div>
          </Panel>
          {state === 'pilne' && (
            <Notice tone="warning" title="Pilna sprawa wymaga bezpośredniego kontaktu.">
              MBG nie jest kanałem alarmowym. Nie wysłaliśmy powiadomienia do służb.{' '}
              <Badge tone="yellow">Symulacja skierowania</Badge> Szczegółowe kontakty i odbiorcy
              zostaną ustalone przed integracją.
            </Notice>
          )}
          {report?.is_urgent && report.urgent_guidance && (
            <Notice tone="warning" title="Potencjalnie pilna sprawa.">{report.urgent_guidance}</Notice>
          )}
          <Panel>
            <h2>Podobna potrzeba w okolicy</h2>
            {candidates.map((candidate) => (
              <label className={`candidate ${selected === String(candidate.problem_id) ? 'selected' : ''}`} key={candidate.problem_id}>
                <input type="radio" name="match" checked={selected === String(candidate.problem_id)} onChange={() => setSelected(String(candidate.problem_id))} />
                <div>
                  <Badge>Do Twojego potwierdzenia · {Math.round(candidate.confidence * 100)}%</Badge>
                  <h3>{candidate.title}</h3>
                  <p>To podpowiedź na podstawie opisu i miejsca. Możesz zamiast niej utworzyć nową potrzebę.</p>
                </div>
              </label>
            ))}
            <label className={`candidate ${selected === 'new' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="match"
                checked={selected === 'new'}
                onChange={() => setSelected('new')}
              />
              <div>
                <h3>Żadna potrzeba nie pasuje</h3>
                <p>
                  Utwórz nową potrzebę. Będzie widoczna od razu i podlega późniejszej moderacji.
                </p>
              </div>
            </label>
            {error && <Notice tone="error">{error}</Notice>}
            <button className="button" onClick={() => void confirm()} disabled={saving || !report}>
              {saving ? 'Zapisywanie…' : selected === 'new' ? 'Utwórz nową potrzebę' : 'Potwierdzam tę potrzebę'}
              <Icon name="ArrowRight" />
            </button>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Twoje zgłoszenie</h2>
          <p>{report?.text_raw ?? ''}</p>
          <span className="location">
            <Icon name="MapPin" />
            {report?.location_name ?? 'Małopolska'}
          </span>
          <hr />
          <p>Podobieństwo tekstu jest wskazówką. Sprawdź także miejsce i kontekst.</p>
          <small>
            Zmiana promienia odkrywania później nie zmieni tego powiązania. Powtórne zgłoszenie tej
            samej osoby nie zwiększa licznika.
          </small>
        </aside>
      </div>
    </>
  )
}
function Results({ problemId, state }: { problemId: number; state: string }) {
  const [view, setView] = useState('Lista'),
    [angle, setAngle] = useState(0),
    [matches, setMatches] = useState<InnovationMatch[]>([]),
    [coordinates, setCoordinates] = useState<Awaited<ReturnType<typeof api.getCoordinates>> | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true)
  useEffect(() => {
    api.getMatches(problemId)
      .then((result) => {
        setMatches(result.matches)
        return api.getCoordinates(problemId).then(setCoordinates).catch(() => undefined)
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać dopasowań.'))
      .finally(() => setLoading(false))
  }, [problemId])
  const semanticPoints = coordinates?.solution_coords ?? matches.map((match) => ({
    id: match.solution_id,
    title: match.title,
    x: match.coord_x,
    y: match.coord_y,
    z: match.coord_z,
  }))
  const xValues = [0, ...semanticPoints.map((point) => point.x)]
  const yValues = [0, ...semanticPoints.map((point) => point.y)]
  const minX = Math.min(...xValues), maxX = Math.max(...xValues)
  const minY = Math.min(...yValues), maxY = Math.max(...yValues)
  const percentage = (value: number, min: number, max: number) =>
    max === min ? 50 : 16 + ((value - min) / (max - min)) * 68
  if (loading) return <DemoStatus state="ladowanie" />
  return (
    <>
      <Heading
        title={
          !error && matches.length === 0
            ? 'Nie znaleźliśmy trafnego rozwiązania.'
            : 'Jedno rozwiązanie warte sprawdzenia.'
        }
        description="Dopasowanie to punkt wyjścia. Zobacz źródło, odbiorców i ograniczenia przed podjęciem decyzji."
        back="/zgloszenia"
      />
      {error ? (
        <Notice tone="error" title="Nie udało się pobrać wyników.">{error}</Notice>
      ) : matches.length === 0 ? (
        <>
          <Notice>
            Nie uzupełniamy listy przypadkowymi innowacjami. W docelowej aplikacji wynik może
            zawierać od 0 do 10 trafnych pozycji.
          </Notice>
          <Empty
            title="Sprawdźmy inną drogę."
            text="Możesz doprecyzować opis, przeszukać katalog albo opracować własny pomysł."
            to="/innowacje"
            action="Przejrzyj katalog"
          />
          <div className="actions">
            <ButtonLink to="/zgloszenia/nowe" secondary>
              Zmień opis
            </ButtonLink>
            <ButtonLink to={`/potrzeby/${problemId}/pomysl`} secondary>
              Rozwijaj pomysł
            </ButtonLink>
          </div>
        </>
      ) : (
        <>
          <Notice
            tone="success"
            title="Potwierdzono powiązanie zgłoszenia."
          >
            Poniższe propozycje pochodzą z backendu. Przed wdrożeniem sprawdź źródło i ograniczenia.
          </Notice>
          <div className="toolbar">
            <div className="segmented">
              {['Lista', 'Przestrzeń 3D'].map((v) => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v}>
                  {v === 'Lista' ? <Icon name="List" /> : <Icon name="Cube" />}
                  {v}
                </button>
              ))}
            </div>
            <span>{matches.length} {matches.length === 1 ? 'trafna innowacja' : 'trafne innowacje'}</span>
          </div>
          {(view === 'Przestrzeń 3D' || state === 'brak-webgl') && (
            <Panel>
              {state === 'brak-webgl' ? (
                <Notice>
                  Wizualizacja jest niedostępna. Wszystkie informacje pozostają dostępne w liście
                  poniżej.
                </Notice>
              ) : (
                <>
                  <h2>Bliskość znaczeń, nie odległość na mapie.</h2>
                  <p>Wizualizacja korzysta ze współrzędnych semantycznych zwróconych przez backend. Układ nie wyznacza rankingu.</p>
                  <div className="semantic-stage">
                    <div
                      className="semantic-plane"
                      style={{ transform: `rotateX(52deg) rotateZ(${angle}deg)` }}
                    >
                      <span className="semantic-axis" />
                      <span className="semantic-axis other" />
                      <span className="semantic-point problem">Potrzeba</span>
                      {semanticPoints.slice(0, 10).map((point) => (
                        <span
                          className="semantic-point solution"
                          key={point.id}
                          style={{
                            left: `${percentage(point.x, minX, maxX)}%`,
                            top: `${percentage(point.y, minY, maxY)}%`,
                          }}
                        >
                          {point.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Field label="Obróć przestrzeń poglądową">
                    <input
                      type="range"
                      min="-35"
                      max="35"
                      value={angle}
                      onChange={(e) => setAngle(+e.target.value)}
                    />
                  </Field>
                  <small>
                    Punkty pokazują współrzędne zwrócone przez backend. Lista poniżej pozostaje
                    równoważną, dostępną alternatywą.
                  </small>
                </>
              )}
            </Panel>
          )}
          <div className="result-list">
            {matches.map((match) => {
              const sourceUrl = getSafeExternalUrl(match.source_url)
              const title = toReadableInnovationText(match.title)
              return (
                <article className="innovation-row" key={match.solution_id}>
                  <div className="innovation-letter green" aria-hidden="true">{title.slice(0, 1)}</div>
                  <div>
                    <Badge>Pozycja {match.rank} · dopasowanie {Math.round(match.score * 100)}%</Badge>
                    <h2><Link href={apiInnovationHref({ id: match.solution_id })}>{title}</Link></h2>
                    <InnovationPreview description={match.description} />
                    <div className="match-explanation">
                      <strong>Dlaczego może pasować</strong><p>{toReadableInnovationText(match.explanation)}</p>
                      <strong>Co trzeba sprawdzić</strong><p>{toReadableInnovationText(match.limitations)}</p>
                    </div>
                    {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">Źródło innowacji <Icon name="ArrowSquareOut" size={16} /></a>}
                  </div>
                </article>
              )
            })}
          </div>
          <section className="next-action">
            <h2>A jeśli potrzeba jest inna?</h2>
            <p>Możesz dalej szukać lub uporządkować nowy pomysł.</p>
            <div className="actions">
              <ButtonLink to="/innowacje" secondary>
                Przejrzyj bibliotekę
              </ButtonLink>
              <ButtonLink to={`/potrzeby/${problemId}/pomysl`} secondary>
                Rozwijaj pomysł dla tej potrzeby
              </ButtonLink>
            </div>
          </section>
        </>
      )}
    </>
  )
}
function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.listMyReports()
      .then(setReports)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać zgłoszeń.'))
      .finally(() => setLoading(false))
  }, [])
  return (
    <>
      <Heading
        title="Twoje zgłoszenia."
        description="Wróć do sprawy i sprawdź jej dalszy ciąg."
        action={<ButtonLink to="/zgloszenia/nowe">Nowe zgłoszenie</ButtonLink>}
      />
      {loading ? <DemoStatus state="ladowanie" /> : error ? <Notice tone="error">{error}</Notice> : !reports.length ? (
        <Empty title="Nie masz jeszcze zgłoszeń." text="Opis pierwszej potrzeby trafi do Twojej prywatnej listy." to="/zgloszenia/nowe" action="Nowe zgłoszenie" />
      ) : (
        <Panel>
          {reports.map((report) => (
            <Link href={`/zgloszenia/${report.id}`} className="activity-row" key={report.id}>
              <span className="row-icon green"><Icon name="ClipboardText" size={26} /></span>
              <div>
                <Badge>{report.status === 'confirmed' ? 'Potrzeba potwierdzona' : 'Czeka na potwierdzenie'}</Badge>
                <h2>{report.text_raw.slice(0, 90)}{report.text_raw.length > 90 ? '…' : ''}</h2>
                <p>{report.location_name} · zapisane na Twoim koncie</p>
              </div>
              <Icon name="ArrowRight" />
            </Link>
          ))}
        </Panel>
      )}
    </>
  )
}
function ReportDetail({ reportId }: { reportId: number }) {
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.getReport(reportId).then(setReport).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać zgłoszenia.')
    })
  }, [reportId])
  if (!report && !error) return <DemoStatus state="ladowanie" />
  if (error) return <Notice tone="error">{error}</Notice>
  return (
    <>
      <Heading
        title={report?.text_raw.slice(0, 80) ?? 'Zgłoszenie'}
        back="/zgloszenia"
        description={`Zgłoszenie MBG-${reportId} · zapisane na Twoim koncie`}
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge>Potrzeba potwierdzona</Badge>
            <h2>Twój opis</h2>
            <p>{report?.text_raw}</p>
            <dl className="facts">
              <Fact label="Miejsce">{report?.location_name}</Fact>
              <Fact label="Widoczność">Autor ukryty przed innymi użytkownikami</Fact>
              <Fact label="Kategorie">{report?.categories.join(' · ')}</Fact>
            </dl>
          </Panel>
          <Panel>
            <h2>Co wydarzyło się dalej?</h2>
            <ol className="timeline">
              <li>
                <strong>Zapis zgłoszenia</strong>
                <span>Opis i lokalizacja zostały zapisane na Twoim koncie.</span>
              </li>
              <li>
                <strong>Potwierdzenie potrzeby</strong>
                <span>{report?.canonical_problem_id ? 'Powiązanie zostało potwierdzone przez użytkownika.' : 'Zgłoszenie czeka na Twoje potwierdzenie grupowania.'}</span>
              </li>
              <li>
                <strong>Rozwiązanie do sprawdzenia</strong>
                <span>{report?.canonical_problem_id ? 'Dopasowania są dostępne dla potwierdzonej potrzeby.' : 'Dopasowania pojawią się po potwierdzeniu potrzeby.'}</span>
              </li>
            </ol>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Twoja potrzeba</h2>
          <p>{report?.canonical_problem_id ? 'Powiązana potrzeba została potwierdzona.' : 'Zgłoszenie czeka na potwierdzenie.'}</p>
          {report?.canonical_problem_id && <ButtonLink to={`/zgloszenia/${report.canonical_problem_id}/wyniki`}>Zobacz rozwiązania</ButtonLink>}
          <small>
            Powtórne zgłoszenie przez to samo konto liczy się raz. Decyzje moderacji wymagają
            backendu.
          </small>
        </aside>
      </div>
    </>
  )
}
function Catalogue() {
  const params = new URLSearchParams(window.location.search),
    [query, setQuery] = useState(params.get('q') ?? ''),
    [category, setCategory] = useState(params.get('kategoria') ?? 'Wszystkie'),
    [catalogue, setCatalogue] = useState<Awaited<ReturnType<typeof api.searchCatalogue>>>([]),
    [catalogueError, setCatalogueError] = useState(''),
    [catalogueLoading, setCatalogueLoading] = useState(true)
  const categories = [...new Set(catalogue.map((item) => item.category))].filter(Boolean)
  const hasResults = catalogue.length > 0
  function updateFilters(q: string, c: string) {
    setQuery(q)
    setCategory(c)
    setCatalogueLoading(true)
    setCatalogueError('')
    const search = new URLSearchParams()
    if (q) search.set('q', q)
    if (c !== 'Wszystkie') search.set('kategoria', c)
    window.history.replaceState({}, '', `/innowacje${search.size ? '?' + search.toString() : ''}`)
  }
  useEffect(() => {
    api.searchCatalogue(query, category)
      .then((results) => {
        setCatalogue(results)
        setCatalogueError('')
      })
      .catch((caught: unknown) => setCatalogueError(caught instanceof Error ? caught.message : 'Nie udało się pobrać katalogu.'))
      .finally(() => setCatalogueLoading(false))
  }, [category, query])
  return (
    <>
      <Heading
        title="Nie wszystko trzeba wymyślać od nowa."
        description="Poznaj istniejące innowacje społeczne. Wybierz rozwiązanie, sprawdź źródło i rozważ lokalną adaptację."
      />
      <div className="catalogue-intro">
        <div>
          <Icon name="Books" size={40} />
          <h2>Wiedza, od której można zacząć.</h2>
          <p>Wyniki pochodzą z katalogu innowacji zapisanego w bazie danych.</p>
        </div>
        <img src={illustrations.people} alt="Rysunkowa scena wspólnego działania mieszkańców." />
      </div>
      <div className="toolbar">
        <label className="search">
          <Icon name="MagnifyingGlass" />
          <input
            value={query}
            onChange={(e) => updateFilters(e.target.value, category)}
            placeholder="Szukaj innowacji lub potrzeb"
            aria-label="Szukaj w bibliotece"
          />
        </label>
        <Field label="Kategoria">
          <select value={category} onChange={(e) => updateFilters(query, e.target.value)}>
            {['Wszystkie', ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <p className="muted">
        {catalogue.length} wyników · treści z biblioteki ROPS
      </p>
      {catalogueError && <Notice tone="error">{catalogueError}</Notice>}
      {!catalogueLoading && !catalogueError && !hasResults ? (
        <Empty
          title="Brak wyników dla tych filtrów."
          text="Zmień kategorię albo użyj krótszego zapytania."
          to="/innowacje"
          action="Wyczyść filtry"
        />
      ) : (
        <>
          {catalogue.map((item) => <ApiInnovationRow item={item} key={`api-${item.id}`} />)}
        </>
      )}
    </>
  )
}
function apiInnovationHref(item: Pick<Innovation, 'id'>): string {
  return `/innowacje/${item.id}`
}
function ApiInnovationRow({ item }: { item: Innovation }) {
  const sourceUrl = getSafeExternalUrl(item.source_url)
  const title = toReadableInnovationText(item.title)
  return (
    <article className="innovation-row">
      <div className="innovation-letter blue" aria-hidden="true">{title.slice(0, 1)}</div>
      <div>
        <Badge>{toReadableInnovationText(item.category)}</Badge>
        <h2><Link href={apiInnovationHref(item)}>{title}</Link></h2>
        <InnovationPreview description={item.description} />
        <p><strong>Dla kogo:</strong> {toReadableInnovationText(item.target_audience)}</p>
        <p><strong>Ograniczenia:</strong> {toReadableInnovationText(item.limitations)}</p>
        <div className="row-meta">
          {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">Źródło <Icon name="ArrowSquareOut" size={16} /></a>}
          <Link href={apiInnovationHref(item)}>Poznaj rozwiązanie <Icon name="ArrowRight" size={16} /></Link>
        </div>
      </div>
    </article>
  )
}
function ApiInnovation({ id }: { id: number }) {
  const [item, setItem] = useState<Innovation | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCatalogueItem(id)
      .then((result) => {
        setItem(result)
        setError('')
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać innowacji.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <DemoStatus state="ladowanie" />
  if (error) return <Notice tone="error" title="Nie udało się pobrać innowacji.">{error}</Notice>
  if (!item) {
    return <Empty title="Nie znaleźliśmy tej innowacji." text="Wróć do katalogu i wybierz pozycję ponownie." to="/innowacje" action="Wróć do katalogu" />
  }

  const sourceUrl = getSafeExternalUrl(item.source_url)
  const readableTitle = toReadableInnovationText(item.title)
  return (
    <>
      <Heading title={readableTitle} description={getInnovationPreview(item.description)} back="/innowacje" />
      <div className="detail-layout">
        <div>
          <div className="innovation-feature">
            <div className="innovation-letter large">{readableTitle.slice(0, 1)}</div>
            <div>
              <Badge>{toReadableInnovationText(item.category)}</Badge>
              <h2>Opis źródłowy w czytelnej formie.</h2>
              {sourceUrl ? (
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  Otwórz źródło
                  <Icon name="ArrowSquareOut" size={17} />
                </a>
              ) : (
                <p className="muted">Materiały są zapisane w lokalnie zaimportowanym katalogu.</p>
              )}
            </div>
          </div>
          <Panel>
            <InnovationDocument description={item.description} />
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Sprawdź przed adaptacją.</h2>
          <p>{toReadableInnovationText(item.limitations)}</p>
          <ButtonLink to="/pomysly" secondary>Wybierz problem, aby zaproponować pomysł</ButtonLink>
          <dl>
            <Fact label="Dla kogo">{toReadableInnovationText(item.target_audience)}</Fact>
            <Fact label="Szacowany koszt">{toReadableInnovationText(item.cost_estimate)}</Fact>
            <Fact label="Pochodzenie">{sourceUrl ? 'Link do źródła jest dostępny powyżej.' : 'Katalog lokalny'}</Fact>
          </dl>
        </aside>
      </div>
    </>
  )
}
function geographicMarkerIcon(marker: GeographicMarker) {
  const label = marker.entity_type === 'problem' ? 'P' : marker.entity_type === 'report' ? 'Z' : marker.entity_type === 'pilot' ? 'T' : 'I'
  return divIcon({
    className: `mbg-leaflet-pin mbg-leaflet-pin--${marker.entity_type}`,
    html: `<span aria-hidden="true">${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function GeographicMapView({
  data,
  center,
  radius,
  selectedId,
  onSelect,
}: {
  data: GeographicMap
  center: LatLngLiteral
  radius: number
  selectedId?: string
  onSelect: (marker: GeographicMarker) => void
}) {
  return (
    <div className="geographic-map" aria-label="Mapa zgłoszeń, potrzeb i innowacji z bazy danych">
      <MapContainer center={center} zoom={11} className="leaflet-map" scrollWheelZoom>
        <MapViewport center={center} zoom={11} />
          <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILE_URL} />
        <Circle center={center} radius={radius * 1000} pathOptions={{ color: '#00834a', fillOpacity: 0.06 }} />
        {data.markers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.lat, lng: marker.lon }}
            icon={geographicMarkerIcon(marker)}
            eventHandlers={{ click: () => onSelect(marker) }}
            opacity={selectedId && selectedId !== marker.id ? 0.72 : 1}
          >
            <Popup>
              <strong>{marker.title}</strong>
              <br />
              {marker.location_name}
              {marker.distance_km !== null && <><br />{marker.distance_km.toFixed(1)} km od środka mapy</>}
              {marker.reporter_count !== null && <><br />{marker.reporter_count} unikalnych zgłaszających</>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="map-legend" aria-label="Legenda mapy">
        <span><b>P</b> potrzeba zagregowana</span>
        <span><b>Z</b> własne zgłoszenie</span>
        <span><b>I</b> innowacja z rozpoznaną miejscowością</span>
        <span><b>T</b> pilotaż z zapisaną lokalizacją</span>
      </div>
      <p className="map-disclaimer">{data.privacy_note}</p>
    </div>
  )
}

function Needs({ frequent }: { frequent: boolean }) {
  const params = new URLSearchParams(window.location.search),
    [radius, setRadius] = useState(+(params.get('promien') ?? 20)),
    [center, setCenter] = useState<LatLngLiteral>(MALOPOLSKA_MAP_CENTER),
    [selected, setSelected] = useState<string | undefined>(),
    [mode, setMode] = useState(frequent ? 'Lista' : 'Mapa'),
    [data, setData] = useState<GeographicMap | null>(null),
    [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    api.getMapMarkers(center.lat, center.lng, radius)
      .then((result) => {
        if (!active) return
        setData(result)
        setError('')
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać danych mapy.')
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [center.lat, center.lng, radius])
  const problems = (data?.markers ?? [])
    .filter((marker) => marker.entity_type === 'problem')
    .sort((left, right) => frequent
      ? (right.reporter_count ?? 0) - (left.reporter_count ?? 0)
      : (left.distance_km ?? Infinity) - (right.distance_km ?? Infinity))
  function useDeviceLocation() {
    if (!navigator.geolocation) {
      setError('Ta przeglądarka nie udostępnia geolokalizacji. Przesuń mapę do wybranego miejsca.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setCenter({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setError('Nie udało się pobrać lokalizacji urządzenia. Możesz nadal przeglądać obszar ustawiony na mapie.'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  }
  return (
    <>
      <Heading
        title={frequent ? 'Najczęściej zgłaszane potrzeby.' : 'Blisko Ciebie. Ważne dla innych.'}
        description={
          frequent
            ? 'Kolejność według liczby unikalnych zgłaszających w wybranym obszarze. To nie jest pomiar wzrostu.'
            : 'Zobacz, czego brakuje w Twojej okolicy i gdzie możesz włączyć się w zmianę.'
        }
      />
      <Tabs
        active={frequent ? '/potrzeby/najczestsze' : '/potrzeby'}
        items={[
          ['/potrzeby', 'W okolicy'],
          ['/potrzeby/najczestsze', 'Najczęściej zgłaszane'],
        ]}
      />
      <div className="toolbar">
        <button type="button" className="button secondary" onClick={useDeviceLocation}>
          <Icon name="MapPin" />
          Ustaw środek na mojej lokalizacji
        </button>
        <Field label="Promień odkrywania">
          <select
            value={radius}
            onChange={(e) => {
              setRadius(+e.target.value)
              window.history.replaceState(
                {},
                '',
                `${window.location.pathname}?promien=${e.target.value}`,
              )
            }}
          >
            {[5, 10, 20, 40].map((r) => (
              <option value={r} key={r}>
                {r} km
              </option>
            ))}
          </select>
        </Field>
        <div className="segmented">
          {['Lista', 'Mapa'].map((m) => (
            <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <small>Promień służy odkrywaniu. Nie zmienia grupowania zgłoszeń.</small>
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? <DemoStatus state="ladowanie" /> : !problems.length ? (
        <Empty
          title="W tym obszarze nie ma jeszcze potrzeb."
          text="Zwiększ promień lub opisz pierwszą sprawę w tej okolicy."
        />
      ) : (
        <div className={mode === 'Mapa' ? 'map-layout' : 'needs-list'}>
          {mode === 'Mapa' && data && <GeographicMapView data={data} center={center} radius={radius} selectedId={selected} onSelect={(marker) => setSelected(marker.id)} />}
          <div>
            {problems.map((problem, i) => (
              <article
                key={problem.id}
                className={`need-item ${selected === problem.id ? 'selected' : ''}`}
              >
                <div className="row-meta">
                  <Badge>{problem.category ?? 'Potrzeba społeczna'}</Badge>
                  <span>{frequent ? `${i + 1}. miejsce` : `${problem.distance_km?.toFixed(1) ?? '—'} km`}</span>
                </div>
                <h2>
                  <Link href={`/potrzeby/${problem.entity_id}`}>{problem.title}</Link>
                </h2>
                <p>
                  {problem.location_name} · {problem.reporter_count ?? 0} unikalnych zgłaszających
                </p>
                <div className="row-meta">
                  <span>{problem.precision === 'aggregate' ? 'Obszar zagregowany' : 'Obszar przybliżony'}</span>
                  <Link href={`/potrzeby/${problem.entity_id}`} aria-label={`Poznaj potrzebę: ${problem.title}`}>
                    <Icon name="ArrowRight" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
function NeedDetail({ id }: { id: string }) {
  const problemId = Number(id)
  const [problem, setProblem] = useState<Awaited<ReturnType<typeof api.getProblem>> | null>(null)
  const [matches, setMatches] = useState<InnovationMatch[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    Promise.all([api.getProblem(problemId), api.getMatches(problemId)])
      .then(([loadedProblem, loadedMatches]) => {
        setProblem(loadedProblem)
        setMatches(loadedMatches.matches)
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać potrzeby.'))
  }, [problemId])
  if (!problem && !error) return <DemoStatus state="ladowanie" />
  if (error) return <Notice tone="error">{error}</Notice>
  return (
    <>
      <Heading title={problem?.title ?? 'Potrzeba'} description={problem?.generated_description ?? ''} back="/potrzeby" />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge>{problem?.status}</Badge>
            <dl className="facts">
              <Fact label="Obszar">{problem?.location_centroid_lat.toFixed(4)}, {problem?.location_centroid_lon.toFixed(4)}</Fact>
              <Fact label="Unikalni zgłaszający">{problem?.reporter_count}</Fact>
              <Fact label="Status">{problem?.status}</Fact>
            </dl>
            <p>
              Opis jest agregatem potrzeby. Nie pokazujemy oryginalnych opisów ani tożsamości innych zgłaszających.
            </p>
          </Panel>
          <section>
            <div className="section-heading">
              <h2>Możliwe rozwiązanie</h2>
              <Link href="/innowacje">
                Biblioteka
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
            {!matches.length ? (
              <Empty
                title="Brak pasujących innowacji."
                text="Dla tej potrzeby sprawdź pomysły społeczności lub zaproponuj własne rozwiązanie."
                to="/pomysly"
                action="Poznaj pomysły społeczności"
              />
            ) : (
              <article className="innovation-row">
                <div className="innovation-letter blue" aria-hidden="true">{matches[0].title.slice(0, 1)}</div>
                <div>
                  <Badge>Najwyżej dopasowana innowacja</Badge>
                  <h3>{matches[0].title}</h3>
                  <InnovationPreview description={matches[0].description} />
                  <Link href={`/zgloszenia/${problemId}/wyniki`}>Zobacz wszystkie dopasowania <Icon name="ArrowRight" size={16} /></Link>
                </div>
              </article>
            )}
          </section>
          <Panel>
            <h2>Pomysły w okolicy</h2>
            <p>Propozycje publikowane po potwierdzeniu autora i decyzji administratora.</p>
            <ButtonLink to="/pomysly" secondary>
              Poznaj pomysły społeczności
            </ButtonLink>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Ta sprawa dotyczy też Ciebie?</h2>
          <p>Opisz swoją sytuację. Samo otwarcie karty nie zwiększa liczby zgłaszających.</p>
          <ButtonLink to="/zgloszenia/nowe">Zgłoś swoją potrzebę</ButtonLink>
          <ButtonLink to={`/potrzeby/${problemId}/pomysl`} secondary>
            Zaproponuj pomysł
          </ButtonLink>
          <ButtonLink to="/pilotaze" secondary>
            Sprawdź pilotaże
          </ButtonLink>
        </aside>
      </div>
    </>
  )
}
function ideaTitle(item: { text_refined: string | null; text_raw: string }): string {
  const text = toReadableInnovationText(item.text_refined || item.text_raw)
  const ending = text.search(/[.!?]/u)
  const title = ending > 0 ? text.slice(0, ending + 1) : text
  return title.length > 100 ? `${title.slice(0, 97).trimEnd()}…` : title
}
function ideaStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    private_draft: 'Szkic prywatny',
    queued: 'Oczekuje na przetworzenie AI',
    pending_author: 'Czeka na potwierdzenie autora',
    pending_admin: 'Czeka na decyzję administratora',
    public: 'Opublikowany pomysł',
  }
  return labels[status] ?? status
}
function ideaStatusTone(status: string): string {
  if (status === 'public') return 'green'
  if (status === 'pending_author') return 'yellow'
  return 'blue'
}
function LoadingState({ label = 'Ładowanie danych…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="loader" />
      <strong>{label}</strong>
    </div>
  )
}
function IdeaForm({ problemId }: { problemId: number }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedIdeaId, setSavedIdeaId] = useState<number | null>(null)
  const [problem, setProblem] = useState<Awaited<ReturnType<typeof api.getProblem>> | null>(null)
  const [problemError, setProblemError] = useState('')
  useEffect(() => {
    api.getProblem(problemId).then(setProblem).catch((caught: unknown) => setProblemError(caught instanceof Error ? caught.message : 'Nie udało się pobrać problemu.'))
  }, [problemId])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (savedIdeaId !== null) return
    const form = new FormData(event.currentTarget)
    const textRaw = String(form.get('text_raw') ?? '').trim()
    setSaving(true)
    setError('')
    let createdIdeaId: number | null = null
    try {
      const saved = await api.createIdea({
        text_raw: textRaw,
        canonical_problem_id: problemId,
      })
      createdIdeaId = saved.id
      setSavedIdeaId(saved.id)
      const job = await api.submitIdea(saved.id)
      if (job.status === 'failed') {
        setError('Nie udało się przekazać szkicu do przetworzenia AI. Szkic pozostaje zapisany i nie zostanie opublikowany.')
        return
      }
      navigate(`/pomysly/${saved.id}`)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Nie udało się zapisać pomysłu.'
      setError(
        createdIdeaId === null
          ? message
          : `Szkic został zapisany, ale nie udało się przekazać go do przetworzenia AI. ${message}`,
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <>
      <Heading
        title="Opisz swój pomysł własnymi słowami."
        description={problem ? `Pomysł zostanie przypisany do problemu: „${problem.title}”. Jedno pole wystarczy; potem porozmawiasz z AI.` : 'Ładowanie wybranego problemu…'}
        back={problem ? `/potrzeby/${problemId}` : '/potrzeby'}
      />
      <div className="detail-layout">
        <Panel>
          {problemError ? <Notice tone="error">{problemError}</Notice> : <Notice title="Wybrany problem">{problem?.title ?? 'Ładowanie…'}</Notice>}
          <form onSubmit={submit}>
            <h2>Co chcesz zmienić?</h2>
            <Field label="Opis pomysłu" hint="Napisz swobodnie: dla kogo, gdzie i co mogłoby się zmienić. Nie musisz znać budżetu ani planu.">
              <textarea name="text_raw" rows={10} required minLength={10} maxLength={5000} autoFocus />
            </Field>
            {error && <Notice tone="error">{error}</Notice>}
            {savedIdeaId !== null && (
              <Notice tone="warning" title="Szkic jest bezpiecznie zapisany.">
                Otwórz jego kartę, aby sprawdzić status przetwarzania i nie tworzyć kolejnego szkicu.
                <ButtonLink to={`/pomysly/${savedIdeaId}`} secondary>Otwórz zapisany szkic</ButtonLink>
              </Notice>
            )}
            <button className="button" type="submit" disabled={saving || savedIdeaId !== null || !problem}>
              {saving ? 'Zapisywanie…' : 'Rozpocznij rozmowę z AI'}
              <Icon name="ArrowRight" />
            </button>
          </form>
        </Panel>
        <aside className="context-aside">
          <h2>Od szkicu do propozycji.</h2>
          <ol className="timeline">
            <li>
              <strong>AI porządkuje opis</strong>
              <span>Model wyodrębni potrzebę, odbiorców, rozwiązanie, zasoby i koszty.</span>
            </li>
            <li>
              <strong>Twoja rozmowa z AI</strong>
              <span>Dopytaj o założenia i popraw wersję roboczą.</span>
            </li>
            <li>
              <strong>Decyzja administratora</strong>
              <span>Dopiero potem publikacja i możliwość poparcia.</span>
            </li>
          </ol>
        </aside>
      </div>
    </>
  )
}
function Ideas() {
  const [tab, setTab] = useState<'public' | 'mine'>('public')
  const [publicIdeas, setPublicIdeas] = useState<Awaited<ReturnType<typeof api.getPublicIdeas>>>([])
  const [myIdeas, setMyIdeas] = useState<Awaited<ReturnType<typeof api.listMyIdeas>>>([])
  const [publicError, setPublicError] = useState('')
  const [myError, setMyError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    Promise.allSettled([api.getPublicIdeas(), api.listMyIdeas()]).then(([publicResult, mineResult]) => {
      if (!active) return
      if (publicResult.status === 'fulfilled') {
        setPublicIdeas(publicResult.value)
        setPublicError('')
      } else {
        setPublicError('Nie udało się pobrać opublikowanych pomysłów.')
      }
      if (mineResult.status === 'fulfilled') {
        setMyIdeas(mineResult.value)
        setMyError('')
      } else {
        setMyError('Nie udało się pobrać Twoich szkiców.')
      }
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [refreshKey])

  const activeIdeas = tab === 'public' ? publicIdeas : myIdeas
  const activeError = tab === 'public' ? publicError : myError
  return (
    <>
      <Heading
        title="Pomysły, które warto rozwijać."
        description="Opublikowane propozycje społeczności oraz Twoje prywatne szkice."
        action={<ButtonLink to="/potrzeby">Najpierw wybierz problem</ButtonLink>}
      />
      <div className="segmented section-tabs">
        <button aria-pressed={tab === 'public'} onClick={() => setTab('public')}>Społeczność</button>
        <button aria-pressed={tab === 'mine'} onClick={() => setTab('mine')}>Moje szkice</button>
      </div>
      {loading ? (
        <LoadingState label="Ładowanie pomysłów…" />
      ) : activeError ? (
        <Notice tone="error" title="Nie udało się pobrać danych.">
          {activeError}{' '}
          <button className="text-button" onClick={() => setRefreshKey((value) => value + 1)}>Spróbuj ponownie</button>
        </Notice>
      ) : !activeIdeas.length ? (
        <Empty
          title={tab === 'public' ? 'Nie ma jeszcze opublikowanych pomysłów.' : 'Nie masz jeszcze szkiców.'}
          text={tab === 'public' ? 'Nowe propozycje pojawią się po potwierdzeniu autora i decyzji administratora.' : 'Dodaj pierwszy pomysł, aby rozpocząć jego przetwarzanie.'}
          to="/potrzeby"
          action="Wybierz problem"
        />
      ) : tab === 'public' ? (
        <div className="idea-grid">
          {publicIdeas.map((item) => <IdeaCard key={item.id} item={item} />)}
        </div>
      ) : (
        <Panel>
          {myIdeas.map((item) => (
            <Link className="activity-row" href={`/pomysly/${item.id}`} key={item.id}>
              <Icon name={item.status === 'queued' ? 'Clock' : 'Lightbulb'} size={28} />
              <div>
                <Badge tone={ideaStatusTone(item.status)}>{ideaStatusLabel(item.status)}</Badge>
                <h2>{ideaTitle(item)}</h2>
                <p>{toReadableInnovationText(item.solution || item.text_refined || item.text_raw)}</p>
              </div>
              <Icon name="ArrowRight" />
            </Link>
          ))}
        </Panel>
      )}
    </>
  )
}
function IdeaCard({ item }: { item: Awaited<ReturnType<typeof api.getPublicIdeas>>[number] }) {
  return (
    <Link href={`/pomysly/${item.id}`} className="idea-card">
      <div>
        <Badge tone={ideaStatusTone(item.status)}>{ideaStatusLabel(item.status)}</Badge>
        <h2>{ideaTitle(item)}</h2>
        <p>{toReadableInnovationText(item.solution || item.text_refined || item.text_raw)}</p>
        <div className="row-meta">
          <span>{item.beneficiaries ? `Dla: ${toReadableInnovationText(item.beneficiaries)}` : 'Odbiorcy do sprawdzenia'}</span>
          <span>{item.costs ? `Koszty: ${toReadableInnovationText(item.costs)}` : 'Koszty do sprawdzenia'}</span>
        </div>
      </div>
    </Link>
  )
}
function IdeaDetail({ ideaId, notify }: { ideaId: number; notify: Notify }) {
  const [item, setItem] = useState<Awaited<ReturnType<typeof api.getIdea>> | null>(null)
  const [error, setError] = useState('')
  const [notFoundIdeaId, setNotFoundIdeaId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    api.getIdea(ideaId)
      .then((result) => {
        if (!active) return
        setItem(result)
        setError('')
        setNotFoundIdeaId(null)
      })
      .catch((caught: unknown) => {
        if (!active) return
        if (caught instanceof ApiError && caught.status === 404) {
          setItem(null)
          setNotFoundIdeaId(ideaId)
          setError('')
          return
        }
        setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać pomysłu.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [ideaId, refreshKey])

  function retryLoad() {
    setLoading(true)
    setError('')
    setNotFoundIdeaId(null)
    setRefreshKey((value) => value + 1)
  }

  async function submitForAi() {
    if (!item) return
    setSaving(true)
    setError('')
    try {
      const job = await api.submitIdea(item.id)
      if (job.status === 'failed') {
        setError('Nie udało się przekazać pomysłu do przetworzenia AI. Pomysł nie został opublikowany.')
        return
      }
      setRefreshKey((value) => value + 1)
      notify('Pomysł został przekazany do przetworzenia AI.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się przekazać pomysłu do AI.')
    } finally {
      setSaving(false)
    }
  }
  async function confirmAuthor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item) return
    const form = new FormData(event.currentTarget)
    const get = (field: string) => String(form.get(field) ?? '').trim()
    setSaving(true)
    setError('')
    try {
      const confirmed = await api.authorConfirmIdea(item.id, {
        text_refined: get('text_refined'),
        need: get('need'),
        beneficiaries: get('beneficiaries'),
        solution: get('solution'),
        partners: get('partners'),
        costs: get('costs'),
        resources: get('resources'),
        stages: get('stages'),
      })
      setItem(confirmed)
      notify('Potwierdziłeś treść. Pomysł oczekuje teraz na decyzję administratora.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się potwierdzić pomysłu.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Ładowanie pomysłu…" />
  if (notFoundIdeaId === ideaId) return <Empty title="Nie znaleźliśmy pomysłu." to="/pomysly" action="Wróć do pomysłów" />
  if (error && !item) {
    return <Notice tone="error" title="Nie udało się pobrać pomysłu.">{error} <button className="text-button" onClick={retryLoad}>Spróbuj ponownie</button></Notice>
  }
  if (!item) return <Empty title="Nie znaleźliśmy pomysłu." to="/pomysly" action="Wróć do pomysłów" />

  const text = item.text_refined || item.text_raw
  const canConfirm = item.status === 'pending_author'
  return (
    <>
      <Heading title={ideaTitle(item)} back="/pomysly" description={ideaStatusLabel(item.status)} />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge tone={ideaStatusTone(item.status)}>{ideaStatusLabel(item.status)}</Badge>
            <h2>Propozycja</h2>
            <p>{toReadableInnovationText(text)}</p>
            {!canConfirm && (
              <dl className="facts">
                <Fact label="Potrzeba">{toReadableInnovationText(item.need) || 'Nie określono'}</Fact>
                <Fact label="Odbiorcy">{toReadableInnovationText(item.beneficiaries) || 'Nie określono'}</Fact>
                <Fact label="Rozwiązanie">{toReadableInnovationText(item.solution) || 'Nie określono'}</Fact>
                <Fact label="Partnerzy">{toReadableInnovationText(item.partners) || 'Nie określono'}</Fact>
                <Fact label="Koszty">{toReadableInnovationText(item.costs) || 'Nie określono'}</Fact>
                <Fact label="Zasoby">{toReadableInnovationText(item.resources) || 'Nie określono'}</Fact>
                <Fact label="Etapy">{toReadableInnovationText(item.stages) || 'Nie określono'}</Fact>
              </dl>
            )}
          </Panel>
          {canConfirm && (
            <Panel>
              <h2>Sprawdź i potwierdź redakcję AI</h2>
              <form onSubmit={confirmAuthor}>
                <Field label="Treść uporządkowana przez AI"><textarea name="text_refined" rows={5} defaultValue={text} required /></Field>
                <Field label="Potrzeba"><textarea name="need" rows={3} defaultValue={item.need ?? ''} required /></Field>
                <Field label="Odbiorcy"><textarea name="beneficiaries" rows={2} defaultValue={item.beneficiaries ?? ''} required /></Field>
                <Field label="Rozwiązanie"><textarea name="solution" rows={3} defaultValue={item.solution ?? ''} required /></Field>
                <Field label="Partnerzy"><input name="partners" defaultValue={item.partners ?? ''} required /></Field>
                <Field label="Koszty"><input name="costs" defaultValue={item.costs ?? ''} required /></Field>
                <Field label="Zasoby"><input name="resources" defaultValue={item.resources ?? ''} required /></Field>
                <Field label="Etapy"><textarea name="stages" rows={3} defaultValue={item.stages ?? ''} required /></Field>
                <button className="button" disabled={saving}>{saving ? 'Zapisywanie…' : 'Potwierdzam i przekazuję do oceny'} <Icon name="Check" /></button>
              </form>
            </Panel>
          )}
          {item.status === 'private_draft' && (
            <Notice tone="warning" title="Szkic nie został jeszcze przekazany do AI.">
              <button className="text-button" disabled={saving} onClick={() => void submitForAi()}>Przekaż do przetworzenia AI</button>
            </Notice>
          )}
          {item.status === 'queued' && (
            <Notice tone="warning" title="Pomysł oczekuje na wynik przetwarzania AI.">
              <button className="text-button" onClick={retryLoad}>Odśwież status</button>
            </Notice>
          )}
          {item.status === 'pending_admin' && <Notice tone="success" title="Pomysł oczekuje na decyzję administratora.">Publikacja nastąpi wyłącznie po zatwierdzeniu.</Notice>}
          {item.status === 'public' && (
            <Panel>
              <h2>Pomysł jest widoczny dla społeczności.</h2>
              <p>Poparcie jest sygnałem zainteresowania, a nie decyzją o rozpoczęciu pilotażu.</p>
              <ButtonLink to="/poparcie">Przejdź do poparcia</ButtonLink>
              <ButtonLink to={`/pomysly/${item.id}/dyskusja`} secondary>Otwórz dyskusję</ButtonLink>
            </Panel>
          )}
          {item.status !== 'public' && (
            <Panel>
              <h2>Dyskusja o pomyśle</h2>
              <p>Wątek jest dostępny dla autora, administratora oraz osób uprawnionych do tego pomysłu.</p>
              <ButtonLink to={`/pomysly/${item.id}/dyskusja`} secondary>Otwórz dyskusję</ButtonLink>
            </Panel>
          )}
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <aside className="context-aside">
          <h2>Ścieżka publikacji</h2>
          <ol className="timeline">
            <li><strong>AI</strong><span>{item.status === 'private_draft' ? 'Przetwarzanie jeszcze nie zostało uruchomione.' : 'Treść jest w procesie lub po redakcji.'}</span></li>
            <li><strong>Autor</strong><span>{canConfirm ? 'Czeka na Twoje potwierdzenie.' : 'Etap autora został zakończony albo nie jest jeszcze dostępny.'}</span></li>
            <li><strong>Administrator</strong><span>{item.status === 'public' ? 'Pomysł został opublikowany.' : 'Publikacja wymaga decyzji administratora.'}</span></li>
          </ol>
        </aside>
      </div>
    </>
  )
}
function Discussion({ ideaId, notify }: { ideaId: number; notify: Notify }) {
  const [thread, setThread] = useState<Awaited<ReturnType<typeof api.getIdeaThread>> | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [askingAi, setAskingAi] = useState(false)
  const [error, setError] = useState('')
  const [notFoundIdeaId, setNotFoundIdeaId] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    api.getIdeaThread(ideaId)
      .then((result) => {
        if (!active) return
        setThread(result)
        setError('')
        setNotFoundIdeaId(null)
      })
      .catch((caught: unknown) => {
        if (!active) return
        if (caught instanceof ApiError && caught.status === 404) {
          setThread(null)
          setNotFoundIdeaId(ideaId)
          setError('')
          return
        }
        setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać dyskusji.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [ideaId, refreshKey])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = text.trim()
    if (!thread || !content) return
    setSending(true)
    setError('')
    try {
      const created = await api.postThreadMessage(thread.id, content)
      setThread((current) => current && current.id === thread.id
        ? { ...current, messages: [...current.messages, created] }
        : current)
      setText('')
      notify('Wiadomość została dodana do dyskusji.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się wysłać wiadomości.')
    } finally {
      setSending(false)
    }
  }

  async function askAi() {
    const content = text.trim()
    if (!thread || !content) return
    setAskingAi(true)
    setError('')
    try {
      const created = await api.postAIThreadMessage(thread.id, content)
      setThread((current) => current && current.id === thread.id ? { ...current, messages: [...current.messages, created] } : current)
      setText('')
      notify('Odpowiedź AI została dodana do tego pomysłu.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się uzyskać odpowiedzi AI.')
    } finally {
      setAskingAi(false)
    }
  }

  function retry() {
    setLoading(true)
    setError('')
    setNotFoundIdeaId(null)
    setRefreshKey((value) => value + 1)
  }

  const currentThread = thread?.idea_id === ideaId ? thread : null
  if (notFoundIdeaId === ideaId) return <Empty title="Nie znaleźliśmy dyskusji." to={`/pomysly/${ideaId}`} action="Wróć do pomysłu" />
  if (loading || (!currentThread && !error)) return <LoadingState label="Ładowanie dyskusji…" />
  if (error && !currentThread) {
    return (
      <Notice tone="error" title="Nie udało się pobrać dyskusji.">
        {error} <button className="text-button" onClick={retry}>Spróbuj ponownie</button>
      </Notice>
    )
  }
  if (!currentThread) return <Empty title="Nie znaleźliśmy dyskusji." to={`/pomysly/${ideaId}`} action="Wróć do pomysłu" />

  const threadTitle = toReadableInnovationText(currentThread.title).replace(/^Dyskusja:\s*/u, '') || 'Pomysł społeczności'
  return (
    <>
      <Heading
        title={`Dyskusja o: ${threadTitle}`}
        back={`/pomysly/${ideaId}`}
        description="Wątek jest przypięty do tego pomysłu i dostępny dla osób uprawnionych przez platformę."
      />
      <div className="detail-layout">
        <Panel>
          <h2>Rozmowa o pomyśle</h2>
          {currentThread.messages.length === 0 ? (
            <Notice>Wątek nie zawiera jeszcze wiadomości. Możesz rozpocząć rozmowę.</Notice>
          ) : currentThread.messages.map((message) => (
            <article className="comment" key={message.id}>
              <span className="avatar">{message.author_name.slice(0, 1).toLocaleUpperCase('pl-PL')}</span>
              <div>
                <strong>{message.author_name}</strong>
                <p>{toReadableInnovationText(message.content)}</p>
                <small>{formatDiscussionDate(message.created_at)}</small>
              </div>
            </article>
          ))}
          <form onSubmit={sendMessage}>
            <Field label="Dodaj komentarz">
              <textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} required />
            </Field>
            <button className="button" disabled={sending || !text.trim()}>
              {sending ? 'Wysyłanie…' : 'Dodaj komentarz'}
              <Icon name="ChatCircle" />
            </button>
            <button type="button" className="button secondary" disabled={sending || askingAi || !text.trim()} onClick={() => void askAi()}>
              {askingAi ? 'AI analizuje…' : 'Zapytaj AI o ten pomysł'}
              <Icon name="ChatCircle" />
            </button>
          </form>
          {error && <Notice tone="error">{error}</Notice>}
        </Panel>
        <aside className="context-aside">
          <Badge tone="lavender">Wątek pomysłu</Badge>
          <h2>{threadTitle}</h2>
          <p>Możesz podzielić się uwagą albo odpowiedzieć na wiadomość widoczną w tym wątku.</p>
          <ButtonLink to={`/pomysly/${ideaId}`} secondary>
            Wróć do pomysłu
          </ButtonLink>
        </aside>
      </div>
    </>
  )
}
function formatDiscussionDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data wiadomości niedostępna'
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}
function supportCardKey(card: Pick<Awaited<ReturnType<typeof api.getSupportCards>>[number], 'problem_id' | 'solution_id'>): string {
  return `${card.problem_id}:${card.solution_id}`
}
function Support({ notify }: { notify: Notify }) {
  const queryProblemId = Number(new URLSearchParams(window.location.search).get('problem'))
  const [problems, setProblems] = useState<GeographicMarker[]>([])
  const [problemId, setProblemId] = useState<number | null>(Number.isInteger(queryProblemId) && queryProblemId > 0 ? queryProblemId : null)
  const [cards, setCards] = useState<Awaited<ReturnType<typeof api.getSupportCards>>>([])
  const [voteIds, setVoteIds] = useState<Record<string, number>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [problemsLoading, setProblemsLoading] = useState(true)
  const [cardsLoading, setCardsLoading] = useState(true)
  const [problemsError, setProblemsError] = useState('')
  const [cardsError, setCardsError] = useState('')
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
  const [actingOn, setActingOn] = useState<Record<string, true>>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({})
  const swipeStart = useRef<{ key: string; x: number } | null>(null)

  useEffect(() => {
    let active = true
    api.getMapMarkers()
      .then((map) => {
        if (!active) return
        const availableProblems = map.markers.filter((marker) => marker.entity_type === 'problem')
        setProblems(availableProblems)
        setProblemId((current) =>
          current !== null && availableProblems.some((problem) => problem.entity_id === current)
            ? current
            : availableProblems[0]?.entity_id ?? null,
        )
        setProblemsError('')
      })
      .catch((caught: unknown) => {
        if (active) setProblemsError(caught instanceof Error ? caught.message : 'Nie udało się pobrać potrzeb.')
      })
      .finally(() => {
        if (active) setProblemsLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  useEffect(() => {
    if (problemId === null) return
    let active = true
    api.getSupportCards(problemId)
      .then((result) => {
        if (!active) return
        setCards(result)
        setCardsError('')
      })
      .catch((caught: unknown) => {
        if (active) setCardsError(caught instanceof Error ? caught.message : 'Nie udało się pobrać kart poparcia.')
      })
      .finally(() => {
        if (active) setCardsLoading(false)
      })
    return () => {
      active = false
    }
  }, [problemId, refreshKey])

  function selectProblem(nextProblemId: number) {
    setProblemId(nextProblemId)
    setVoteIds({})
    setReasons({})
    setCardsLoading(true)
    setCardsError('')
    window.history.replaceState({}, '', `/poparcie?problem=${nextProblemId}`)
  }
  async function castVote(card: Awaited<ReturnType<typeof api.getSupportCards>>[number], voteType: 'support' | 'skip') {
    const cardKey = supportCardKey(card)
    setActingOn((current) => ({ ...current, [cardKey]: true }))
    setActionErrors((current) => {
      const next = { ...current }
      delete next[cardKey]
      return next
    })
    try {
      const vote = await api.castVote({
        solution_id: card.solution_id,
        local_problem_id: card.problem_id,
        vote_type: voteType,
        rejection_reason: voteType === 'skip' ? reasons[cardKey]?.trim() || undefined : undefined,
      })
      setVoteIds((current) => ({ ...current, [cardKey]: vote.id }))
      setCards((current) => current.map((candidate) => {
        if (candidate.solution_id !== card.solution_id || candidate.problem_id !== card.problem_id) return candidate
        const countChange = (voteType === 'support' ? 1 : 0) - (candidate.my_vote === 'support' ? 1 : 0)
        return {
          ...candidate,
          my_vote: voteType,
          my_vote_id: vote.id,
          support_count: Math.max(0, candidate.support_count + countChange),
        }
      }))
      notify(voteType === 'support' ? 'Dodano poparcie dla tej propozycji.' : 'Pominięto propozycję.')
    } catch (caught) {
      setActionErrors((current) => ({
        ...current,
        [cardKey]: caught instanceof Error ? caught.message : 'Nie udało się zapisać głosu.',
      }))
    } finally {
      setActingOn((current) => {
        const next = { ...current }
        delete next[cardKey]
        return next
      })
    }
  }

  function beginSwipe(event: ReactPointerEvent<HTMLElement>, cardKey: string) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    swipeStart.current = { key: cardKey, x: event.clientX }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function moveSwipe(event: ReactPointerEvent<HTMLElement>, cardKey: string) {
    if (!swipeStart.current || swipeStart.current.key !== cardKey) return
    setSwipeOffsets((current) => ({ ...current, [cardKey]: event.clientX - swipeStart.current!.x }))
  }
  function endSwipe(event: ReactPointerEvent<HTMLElement>, card: Awaited<ReturnType<typeof api.getSupportCards>>[number]) {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start || start.key !== supportCardKey(card)) return
    const delta = event.clientX - start.x
    const key = supportCardKey(card)
    setSwipeOffsets((current) => ({ ...current, [key]: 0 }))
    if (Math.abs(delta) >= 110 && !actingOn[key]) void castVote(card, delta > 0 ? 'support' : 'skip')
  }
  async function undoVote(card: Awaited<ReturnType<typeof api.getSupportCards>>[number]) {
    const cardKey = supportCardKey(card)
    const voteId = card.my_vote_id ?? voteIds[cardKey]
    if (!voteId) {
      setActionErrors((current) => ({ ...current, [cardKey]: 'Brakuje identyfikatora głosu potrzebnego do cofnięcia wyboru.' }))
      return
    }
    setActingOn((current) => ({ ...current, [cardKey]: true }))
    setActionErrors((current) => {
      const next = { ...current }
      delete next[cardKey]
      return next
    })
    try {
      await api.undoVote(voteId)
      setVoteIds((current) => {
        const next = { ...current }
        delete next[cardKey]
        return next
      })
      setCards((current) => current.map((candidate) => candidate.solution_id === card.solution_id && candidate.problem_id === card.problem_id ? {
        ...candidate,
        my_vote: null,
        my_vote_id: null,
        support_count: Math.max(0, candidate.support_count - (candidate.my_vote === 'support' ? 1 : 0)),
      } : candidate))
      notify('Cofnięto Twój wybór.')
    } catch (caught) {
      setActionErrors((current) => ({
        ...current,
        [cardKey]: caught instanceof Error ? caught.message : 'Nie udało się cofnąć głosu.',
      }))
    } finally {
      setActingOn((current) => {
        const next = { ...current }
        delete next[cardKey]
        return next
      })
    }
  }

  const selectedProblem = problems.find((problem) => problem.entity_id === problemId)
  return (
    <>
      <Heading
        title="Co zasługuje na wspólny krok?"
        description="Poparcie jest sygnałem zainteresowania konkretną propozycją dla wybranej potrzeby. Nie jest decyzją o rozpoczęciu pilotażu."
      />
      {problemsLoading ? <LoadingState label="Ładowanie potrzeb…" /> : problemsError ? (
        <Notice tone="error" title="Nie udało się pobrać potrzeb.">{problemsError} <button className="text-button" onClick={() => { setProblemsLoading(true); setRefreshKey((value) => value + 1) }}>Spróbuj ponownie</button></Notice>
      ) : !problems.length ? (
        <Empty title="Nie ma jeszcze potrzeb, dla których można wyrazić poparcie." text="Po potwierdzeniu potrzeby pojawią się tu dostępne propozycje." to="/zgloszenia/nowe" action="Zgłoś potrzebę" />
      ) : (
        <>
          <Field label="Wybierz potrzebę">
            <select value={problemId ?? ''} onChange={(event) => selectProblem(Number(event.target.value))}>
              {problems.map((problem) => <option value={problem.entity_id} key={problem.id}>{problem.title} · {problem.location_name}</option>)}
            </select>
          </Field>
          <div className="support-layout">
            <div className="stack">
              {cardsLoading ? <LoadingState label="Ładowanie kart poparcia…" /> : cardsError ? (
                <Notice tone="error" title="Nie udało się pobrać kart poparcia.">{cardsError} <button className="text-button" onClick={() => { setCardsLoading(true); setRefreshKey((value) => value + 1) }}>Spróbuj ponownie</button></Notice>
              ) : !cards.length ? (
                <Empty title="Nie ma jeszcze propozycji dla tej potrzeby." text="Gdy pojawią się rozwiązania, będzie można wyrazić poparcie lub je pominąć." />
              ) : cards.map((card) => {
                const cardKey = supportCardKey(card)
                const currentVote = card.my_vote
                const actionInProgress = Boolean(actingOn[cardKey])
                return (
                  <article
                    className="support-card support-card--swipeable"
                    key={cardKey}
                    style={{ transform: `translateX(${swipeOffsets[cardKey] ?? 0}px) rotate(${(swipeOffsets[cardKey] ?? 0) / 18}deg)` }}
                    onPointerDown={(event) => beginSwipe(event, cardKey)}
                    onPointerMove={(event) => moveSwipe(event, cardKey)}
                    onPointerUp={(event) => endSwipe(event, card)}
                    onPointerCancel={(event) => endSwipe(event, card)}
                  >
                    <div>
                      <div className="row-meta">
                        <Badge tone="lavender">{supportBadgeLabel(card.badge)}</Badge>
                        <span><Icon name="Heart" /> {card.support_count} {card.support_count === 1 ? 'poparcie' : 'poparcia'}</span>
                      </div>
                      <h2>{toReadableInnovationText(card.title)}</h2>
                      <p>{getInnovationPreview(card.description)}</p>
                      <p className="support-context">Potrzeba: {selectedProblem?.title ?? `#${card.problem_id}`}</p>
                      <Link href={`/innowacje/api/${card.solution_id}?tytul=${encodeURIComponent(toReadableInnovationText(card.title))}`}>Szczegóły i ograniczenia <Icon name="ArrowRight" size={16} /></Link>
                      {currentVote === 'skip' && (
                        <Field label="Powód pominięcia (opcjonalnie)">
                          <textarea value={reasons[cardKey] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [cardKey]: event.target.value }))} rows={2} />
                        </Field>
                      )}
                      <div className="vote-actions">
                        <button className="button secondary" disabled={actionInProgress} onClick={() => void castVote(card, 'skip')}><Icon name="X" /> Pomijam</button>
                        <button className="button" disabled={actionInProgress} onClick={() => void castVote(card, 'support')}><Icon name="Heart" /> Popieram</button>
                        {currentVote && <button className="button secondary" disabled={actionInProgress} onClick={() => void undoVote(card)}><Icon name="ArrowCounterClockwise" /> Cofnij wybór</button>}
                      </div>
                      {currentVote && <small>Twój bieżący wybór: {currentVote === 'support' ? 'Popieram' : 'Pomijam'}.</small>}
                      {actionErrors[cardKey] && <Notice tone="error">{actionErrors[cardKey]}</Notice>}
                    </div>
                  </article>
                )
              })}
            </div>
            <aside className="context-aside">
              <h2>Przesuń jak w Tinderze.</h2>
              <p>Przeciągnij kartę w prawo, aby poprzeć propozycję, albo w lewo, aby ją pominąć. Przyciski pozostają dostępne na każdym urządzeniu.</p>
              <small>Jedno bieżące poparcie przypada na propozycję w konkretnej potrzebie. Liczby nie opisują satysfakcji ani skuteczności.</small>
            </aside>
          </div>
        </>
      )}
    </>
  )
}
function supportBadgeLabel(badge: Awaited<ReturnType<typeof api.getSupportCards>>[number]['badge']): string {
  if (badge === 'proposed_idea') return 'Pomysł użytkownika'
  if (badge === 'being_tested') return 'W trakcie testowania'
  return 'Istniejąca innowacja'
}
function AdaptForm() {
  const requestedId = Number(new URLSearchParams(window.location.search).get('innowacja'))
  const [catalogue, setCatalogue] = useState<Innovation[]>([])
  const [selectedId, setSelectedId] = useState(Number.isInteger(requestedId) && requestedId > 0 ? requestedId : 0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    api.searchCatalogue().then((items) => {
      setCatalogue(items)
      setSelectedId((current) => current || items[0]?.id || 0)
    }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać katalogu.')).finally(() => setLoading(false))
  }, [])
  const item = catalogue.find((candidate) => candidate.id === selectedId) ?? null
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedId) return
    const form = new FormData(event.currentTarget)
    setSaving(true)
    setError('')
    try {
      const adaptation = await api.createAdaptation({
        solution_id: selectedId,
        beneficiaries: String(form.get('beneficiaries') ?? '').trim(),
        location: String(form.get('location') ?? '').trim(),
        resources: String(form.get('resources') ?? '').trim(),
        budget: String(form.get('budget') ?? '').trim(),
        constraints: String(form.get('constraints') ?? '').trim(),
      })
      navigate(`/adaptacje/${adaptation.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się przygotować adaptacji.')
    } finally {
      setSaving(false)
    }
  }
  if (loading) return <DemoStatus state="ladowanie" />
  return (
    <>
      <Heading title="Dobre rozwiązanie. Twoje warunki." description="Przygotuj adaptację istniejącej innowacji dla swojej placówki lub organizacji." back="/innowacje" />
      <div className="detail-layout">
        <Panel>
          <form onSubmit={(event) => void submit(event)}>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Innowacja z katalogu">
              <select value={selectedId || ''} onChange={(event) => setSelectedId(Number(event.target.value))} required>
                <option value="" disabled>Wybierz innowację</option>
                {catalogue.map((candidate) => <option value={candidate.id} key={candidate.id}>{toReadableInnovationText(candidate.title)}</option>)}
              </select>
            </Field>
            <Field label="Odbiorcy"><textarea name="beneficiaries" rows={3} required /></Field>
            <Field label="Miejscowość / lokalizacja"><input name="location" required /></Field>
            <Field label="Deklarowany budżet"><input name="budget" required /></Field>
            <Field label="Dostępne zasoby"><textarea name="resources" rows={3} required /></Field>
            <Field label="Ograniczenia"><textarea name="constraints" rows={3} required /></Field>
            <button className="button" disabled={saving || !item}>{saving ? 'Przygotowywanie…' : 'Przygotuj adaptację'} <Icon name="ArrowRight" /></button>
          </form>
        </Panel>
        <aside className="context-aside">
          <Badge>Źródło z bazy</Badge>
          <h2>{item ? toReadableInnovationText(item.title) : 'Wybierz innowację'}</h2>
          <p>{item ? getInnovationPreview(item.description) : 'Katalog nie zawiera jeszcze pozycji.'}</p>
        </aside>
      </div>
    </>
  )
}
function Adaptation() {
  const id = Number(window.location.pathname.split('/')[2])
  const [item, setItem] = useState<InstitutionAdaptation | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.getAdaptation(id).then(setItem).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać adaptacji.'))
  }, [id])
  if (error) return <Notice tone="error" title="Nie udało się pobrać adaptacji.">{error}</Notice>
  if (!item) return <DemoStatus state="ladowanie" />
  return (
    <>
      <Heading title={`${item.solution_title ?? 'Innowacja'} w Twojej placówce.`} description="Szkic adaptacji wygenerowany na podstawie zapisanych warunków." back="/innowacje" />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge tone="yellow">Szkic adaptacji</Badge>
            <h2>Warunki zapisane w bazie</h2>
            <dl className="facts">
              <Fact label="Odbiorcy">{item.beneficiaries}</Fact>
              <Fact label="Miejsce">{item.location}</Fact>
              <Fact label="Budżet deklarowany">{item.budget}</Fact>
              <Fact label="Zasoby">{item.resources}</Fact>
              <Fact label="Ograniczenia">{item.constraints}</Fact>
            </dl>
            <h2>Proponowana adaptacja AI</h2>
            <p>{item.draft_adaptation || 'AI nie zwróciło jeszcze treści adaptacji.'}</p>
          </Panel>
        </div>
        <aside className="context-aside">
          {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">Otwórz źródło <Icon name="ArrowSquareOut" size={16} /></a>}
          <ButtonLink to={`/adaptacje/nowa?innowacja=${item.solution_id}`} secondary>Zmień warunki</ButtonLink>
          <small>Adaptacja pozostaje szkicem. Pilotaż i budżet zatwierdza administrator.</small>
        </aside>
      </div>
    </>
  )
}
const pilotFilters = ['Wszystkie', 'Rekrutacja', 'W testach', 'Ewaluacja'] as const

function pilotStatusLabel(status: Pilot['status']) {
  return {
    draft: 'Szkic',
    review: 'Ocena',
    recruitment_funding: 'Rekrutacja i zasoby',
    pilot: 'W testach',
    evaluation: 'Ewaluacja',
    dissemination: 'Upowszechnienie',
    unavailable: 'Niedostępny',
  }[status]
}

function pilotStatusTone(status: Pilot['status']) {
  if (status === 'unavailable') return 'neutral'
  if (status === 'evaluation' || status === 'review') return 'blue'
  if (status === 'recruitment_funding') return 'yellow'
  return 'green'
}

function currency(value: number | null) {
  return value === null ? 'Nie podano' : `${value.toLocaleString('pl-PL')} zł`
}

function pilotTabs(id: number): [string, string][] {
  return [
    [`/pilotaze/${id}`, 'O pilotażu'],
    [`/pilotaze/${id}/zasoby`, 'Zasoby'],
    [`/pilotaze/${id}/udzial`, 'Twój udział'],
    [`/pilotaze/${id}/ewaluacja`, 'Ewaluacja'],
  ]
}

function Pilots() {
  const [filter, setFilter] = useState<(typeof pilotFilters)[number]>('Wszystkie')
  const [items, setItems] = useState<Pilot[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api
      .listPilots()
      .then((pilots) => {
        if (active) setItems(pilots)
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać pilotaży.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const visible = items.filter((item) => {
    if (filter === 'Rekrutacja') return item.status === 'recruitment_funding'
    if (filter === 'W testach') return item.status === 'pilot'
    if (filter === 'Ewaluacja') return item.status === 'evaluation'
    return true
  })

  return (
    <>
      <Heading
        title="Sprawdźmy pomysły w codzienności."
        description="Wybierz inicjatywę, zobacz jej plan i dołącz, gdy rekrutacja jest otwarta."
      />
      <div className="filter-pills section-tabs">
        {pilotFilters.map((item) => (
          <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="loading" role="status">
          <span className="loader" />
          <strong>Wczytywanie pilotaży…</strong>
        </div>
      ) : error ? (
        <Notice tone="error" title="Nie udało się pobrać pilotaży.">
          {error}
        </Notice>
      ) : !visible.length ? (
        <Empty
          title="Brak pilotaży w tym widoku."
          text="Zmień filtr lub wróć później, gdy administrator opublikuje kolejną inicjatywę."
          to="/pilotaze"
          action="Pokaż wszystkie"
        />
      ) : (
        <div className="stack">
          {visible.map((pilot) => (
            <article className="pilot-feature" key={pilot.id}>
              <img src={illustrations.people} alt="" />
              <div>
                <Badge tone={pilotStatusTone(pilot.status)}>{pilotStatusLabel(pilot.status)}</Badge>
                <h2>{pilot.title}</h2>
                <p>{pilot.description || 'Opis pilotażu nie został jeszcze uzupełniony.'}</p>
                <dl className="facts">
                  <Fact label="Zapisani wolontariusze">
                    {pilot.registered_volunteers_count} / {pilot.max_volunteers}
                  </Fact>
                  <Fact label="Lista oczekujących">{pilot.waiting_list_count}</Fact>
                </dl>
                <ButtonLink to={`/pilotaze/${pilot.id}`}>Poznaj pilotaż</ButtonLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

function PilotPage({ path, notify }: Pick<Props, 'path' | 'notify'>) {
  const pilotId = Number(path.split('/')[2])
  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      setPilot(await api.getPilot(pilotId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać pilotażu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!Number.isInteger(pilotId) || pilotId < 1) {
      setLoading(false)
      setError('Nieprawidłowy identyfikator pilotażu.')
      return
    }
    void refresh()
  }, [pilotId])

  if (loading) {
    return (
      <div className="loading" role="status">
        <span className="loader" />
        <strong>Wczytywanie pilotażu…</strong>
      </div>
    )
  }
  if (error || !pilot) {
    return (
      <>
        <Heading title="Pilotaż jest niedostępny." back="/pilotaze" />
        <Notice tone="error">{error || 'Nie znaleziono pilotażu.'}</Notice>
      </>
    )
  }

  const participationHref = `/pilotaze/${pilot.id}/udzial`
  const resourcesHref = `/pilotaze/${pilot.id}/zasoby`
  return (
    <>
      <Heading
        title={pilot.title}
        description={pilotStatusLabel(pilot.status)}
        back="/pilotaze"
      />
      <Tabs items={pilotTabs(pilot.id)} active={path} />
      {path.endsWith('/zasoby') ? (
        <Resources pilot={pilot} />
      ) : path.endsWith('/udzial') ? (
        <Participation pilot={pilot} onRefresh={refresh} notify={notify} />
      ) : path.endsWith('/ewaluacja') ? (
        <Evaluation pilot={pilot} notify={notify} />
      ) : (
        <div className="detail-layout">
          <div className="stack">
            <div className="pilot-photo">
              <img src={illustrations.people} alt="" />
              <Badge tone={pilotStatusTone(pilot.status)}>{pilotStatusLabel(pilot.status)}</Badge>
            </div>
            <Panel>
              <h2>Co chcemy sprawdzić?</h2>
              <p>{pilot.description || 'Opis pilotażu nie został jeszcze uzupełniony.'}</p>
              <h3>Plan testów</h3>
              <p>{pilot.test_plan || 'Plan testów nie został jeszcze opublikowany.'}</p>
              <dl className="facts">
                <Fact label="Właściciel">{pilot.accountable_owner || 'Nie wskazano'}</Fact>
                <Fact label="Partnerzy">{pilot.partners || 'Nie wskazano'}</Fact>
                <Fact label="Źródło rozwiązania">
                  {pilot.solution_id ? (
                    <Link href={`/innowacje/api/${pilot.solution_id}`}>Otwórz kartę innowacji</Link>
                  ) : (
                    'Nie wskazano'
                  )}
                </Fact>
              </dl>
            </Panel>
          </div>
          <aside className="context-aside">
            <h2>Możesz pomóc na swój sposób.</h2>
            <dl>
              <Fact label="Maksymalna liczba wolontariuszy">{pilot.max_volunteers}</Fact>
              <Fact label="Zapisani">{pilot.registered_volunteers_count}</Fact>
              <Fact label="Oczekujący">{pilot.waiting_list_count}</Fact>
            </dl>
            <ButtonLink to={participationHref}>Sprawdź możliwość udziału</ButtonLink>
            <ButtonLink to={resourcesHref} secondary>
              Zobacz warunki i zasoby
            </ButtonLink>
            <Notice>
              Status oraz warunki pilotażu są aktualizowane przez administratora i pobierane z
              systemu przy każdym otwarciu strony.
            </Notice>
          </aside>
        </div>
      )}
    </>
  )
}

function Resources({ pilot }: { pilot: Pilot }) {
  return (
    <div className="detail-layout">
      <div className="stack">
        <Panel>
          <h2>Warunki i zasoby</h2>
          <div className="resource-row">
            <Icon name="House" />
            <div>
              <strong>Partnerzy wdrożeniowi</strong>
              <p>{pilot.partners || 'Nie wskazano partnerów.'}</p>
            </div>
          </div>
          <div className="resource-row">
            <Icon name="Gear" />
            <div>
              <strong>Plan testów</strong>
              <p>{pilot.test_plan || 'Nie opublikowano jeszcze planu testów.'}</p>
            </div>
          </div>
        </Panel>
        <Notice>
          Moduł deklarowania czasu, sprzętu, lokalu lub środków nie jest jeszcze dostępny w API.
          Formularz nie jest wyświetlany, aby nie sprawiał wrażenia, że deklaracja została zapisana.
        </Notice>
      </div>
      <aside className="context-aside">
        <h2>Budżet</h2>
        <dl>
          <Fact label="Budżet deklarowany">{currency(pilot.budget_declared)}</Fact>
          <Fact label="Budżet zatwierdzony">{currency(pilot.budget_approved)}</Fact>
        </dl>
        <small>Budżet zatwierdza administrator w ramach obsługi pilotażu.</small>
      </aside>
    </div>
  )
}

function Participation({
  pilot,
  onRefresh,
  notify,
}: {
  pilot: Pilot
  onRefresh: () => Promise<void>
  notify: Notify
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const volunteerStatus = pilot.my_volunteer_status

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true)
    setError('')
    try {
      await action()
      await onRefresh()
      notify(successMessage)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się zapisać zmiany.')
    } finally {
      setBusy(false)
    }
  }

  const canCancel = volunteerStatus && volunteerStatus !== 'cancelled'
  return (
    <div className="detail-layout">
      <Panel>
        <h2>Udział w pilotażu</h2>
        <dl className="facts">
          <Fact label="Limit miejsc">{pilot.max_volunteers}</Fact>
          <Fact label="Zapisani wolontariusze">{pilot.registered_volunteers_count}</Fact>
          <Fact label="Lista oczekujących">{pilot.waiting_list_count}</Fact>
        </dl>
        {error && <Notice tone="error">{error}</Notice>}
        {(!volunteerStatus || volunteerStatus === 'cancelled') && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (!confirmed) return
              void run(
                () => api.registerPilotVolunteer(pilot.id),
                'Zgłoszenie do pilotażu zostało zapisane.',
              )
            }}
          >
            <p>Po zapisie system przydzieli miejsce albo pozycję na liście oczekujących.</p>
            <label className="checkbox-line">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              Chcę zgłosić swój udział w tym pilotażu.
            </label>
            <button className="button" disabled={busy}>
              {busy ? 'Zapisywanie…' : 'Zgłoś udział'}
              <Icon name="ArrowRight" />
            </button>
          </form>
        )}
        {volunteerStatus === 'waiting' && (
          <Notice tone="warning" title="Jesteś na liście oczekujących.">
            {pilot.my_volunteer_position ? `Twoja pozycja: ${pilot.my_volunteer_position}. ` : ''}
            Gdy zwolni się miejsce, otrzymasz ofertę w aplikacji.
          </Notice>
        )}
        {volunteerStatus === 'offered' && (
          <>
            <Notice tone="success" title="Czeka na Ciebie wolne miejsce.">
              Przyjmij ofertę, aby potwierdzić udział.
            </Notice>
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => api.acceptPilotOffer(pilot.id),
                  'Miejsce zostało przyjęte. Twój udział jest potwierdzony.',
                )
              }
            >
              {busy ? 'Zapisywanie…' : 'Przyjmuję miejsce'}
              <Icon name="Check" />
            </button>
          </>
        )}
        {volunteerStatus === 'registered' && (
          <>
            <Notice title="Zgłoszenie jest zarejestrowane.">
              Możesz potwierdzić udział, gdy jesteś gotowy/gotowa do rozpoczęcia pilotażu.
            </Notice>
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                void run(
                  () => api.acceptPilotOffer(pilot.id),
                  'Udział w pilotażu został potwierdzony.',
                )
              }
            >
              {busy ? 'Zapisywanie…' : 'Potwierdź udział'}
              <Icon name="Check" />
            </button>
          </>
        )}
        {volunteerStatus === 'accepted' && (
          <Notice tone="success" title="Twój udział jest potwierdzony.">
            Szczegóły pilotażu pozostają dostępne na tej stronie.
          </Notice>
        )}
        {canCancel && (
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              void run(
                () => api.cancelPilotVolunteer(pilot.id),
                'Rezygnacja została zapisana. Wolne miejsce może zostać zaoferowane kolejnej osobie.',
              )
            }
          >
            {busy ? 'Zapisywanie…' : 'Zrezygnuj z udziału'}
          </button>
        )}
      </Panel>
      <aside className="context-aside">
        <img src={illustrations.people} alt="" />
        <h2>Co dzieje się po zapisie?</h2>
        <p>
          Po rezygnacji system zwalnia miejsce i może skierować ofertę do pierwszej osoby na liście
          oczekujących.
        </p>
      </aside>
    </div>
  )
}

function Evaluation({ pilot, notify }: { pilot: Pilot; notify: Notify }) {
  const [role, setRole] = useState<'beneficiary' | 'volunteer'>('volunteer')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [improvements, setImprovements] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!rating) {
      setError('Wybierz ocenę satysfakcji.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.submitPilotFeedback(pilot.id, {
        role,
        rating,
        comment: comment.trim() || undefined,
        improvements: improvements.trim() || undefined,
      })
      setSaved(true)
      notify('Opinia została zapisana.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się zapisać opinii.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="detail-layout">
      <Panel>
        <h2>Jak oceniasz doświadczenie?</h2>
        {saved ? (
          <Notice tone="success" title="Dziękujemy za opinię.">
            Została zapisana przy tym pilotażu.
          </Notice>
        ) : (
          <form onSubmit={(event) => void submit(event)}>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Twoja rola">
              <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
                <option value="volunteer">Wolontariusz / wolontariuszka</option>
                <option value="beneficiary">Beneficjent / beneficjentka</option>
              </select>
            </Field>
            <fieldset className="rating">
              <legend>Satysfakcja z udziału</legend>
              {[1, 2, 3, 4, 5].map((value) => (
                <label className={rating === value ? 'selected' : ''} key={value}>
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                    required
                  />
                  {value}
                </label>
              ))}
              <small>1 — bardzo niska · 5 — bardzo wysoka</small>
            </fieldset>
            <Field label="Co było pomocne?">
              <textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
            </Field>
            <Field label="Co warto poprawić?">
              <textarea
                rows={3}
                value={improvements}
                onChange={(event) => setImprovements(event.target.value)}
              />
            </Field>
            <button className="button" disabled={busy}>
              {busy ? 'Zapisywanie…' : 'Zapisz opinię'}
              <Icon name="Check" />
            </button>
          </form>
        )}
      </Panel>
      <aside className="context-aside">
        <h2>Opinie pomagają wyciągnąć wnioski.</h2>
        <p>
          Ocena dotyczy Twojego doświadczenia w tym pilotażu i trafia do danych ewaluacyjnych.
        </p>
      </aside>
    </div>
  )
}
function Notifications({ notify }: { notify: Notify }) {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.listNotifications>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    api.listNotifications().then(setItems).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Nie udało się pobrać powiadomień.')).finally(() => setLoading(false))
  }, [])
  async function markAllRead() {
    const unread = items.filter((item) => !item.is_read)
    await Promise.all(unread.map((item) => api.markNotificationRead(item.id)))
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
    notify('Powiadomienia oznaczono jako przeczytane.')
  }
  return (
    <>
      <Heading
        title="Ważne sprawy czekają tutaj."
        description="Powiadomienia wewnątrz aplikacji. Bez e-maili i SMS-ów."
        action={
          <button
            className="button secondary"
            onClick={() => void markAllRead()}
            disabled={!items.some((item) => !item.is_read)}
          >
            Oznacz jako przeczytane
          </button>
        }
      />
      {loading ? <DemoStatus state="ladowanie" /> : error ? <Notice tone="error">{error}</Notice> : !items.length ? <Empty title="Brak powiadomień." text="Ważne informacje pojawią się tutaj po zapisaniu działań." /> : <Panel>
        {items.map((item) => (
          <Link className={`notification-row ${item.is_read ? 'read' : ''}`} href={item.link || '/moje-aktywnosci'} key={item.id}>
            <span className="row-icon">
              <Icon name="Bell" size={24} />
            </span>
            <div>
              <Badge tone={item.is_read ? 'neutral' : 'green'}>{item.is_read ? 'Przeczytane' : 'Nowe'}</Badge>
              <h2>{item.title}</h2>
              <p>{item.message}</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        ))}
      </Panel>}
    </>
  )
}
function Activities() {
  const session = getStoredSession()
  const [reports, setReports] = useState<Report[]>([])
  const [ideas, setIdeas] = useState<Awaited<ReturnType<typeof api.listMyIdeas>>>([])
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [adaptations, setAdaptations] = useState<InstitutionAdaptation[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([api.listMyReports(), api.listMyIdeas(), api.listPilots(), api.listMyAdaptations()]).then(([loadedReports, loadedIdeas, loadedPilots, loadedAdaptations]) => {
      setReports(loadedReports)
      setIdeas(loadedIdeas)
      setPilots(loadedPilots.filter((pilot) => pilot.my_volunteer_status))
      setAdaptations(loadedAdaptations)
    }).finally(() => setLoading(false))
  }, [])
  const links = [
    { url: '/zgloszenia', title: 'Twoje zgłoszenia', text: `${reports.length} zapisanych zgłoszeń`, icon: 'ClipboardText' as const },
    { url: '/pomysly', title: 'Twoje pomysły', text: `${ideas.length} zapisanych pomysłów`, icon: 'Lightbulb' as const },
    { url: '/poparcie', title: 'Twoje poparcie', text: 'Sprawdź zapisane głosy i możliwość cofnięcia', icon: 'Heart' as const },
    { url: '/pilotaze', title: 'Twój udział', text: `${pilots.length} pilotaży z zapisanym udziałem`, icon: 'Plant' as const },
    { url: adaptations[0] ? `/adaptacje/${adaptations[0].id}` : '/adaptacje/nowa', title: 'Twoje adaptacje', text: `${adaptations.length} zapisanych szkiców adaptacji`, icon: 'Books' as const },
  ]
  return (
    <>
      <Heading
        title="Twoje małe kroki. Wspólna sprawa."
        description="Zgłoszenia, szkice i udział zebrane w jednym miejscu. Dane są pobierane z Twojej sesji."
      />
      <div className="profile-summary">
        <span className="avatar large">{session?.user_name.slice(0, 2).toUpperCase() || 'MB'}</span>
        <div>
          <h2>{session?.user_name || 'Użytkownik'}</h2>
          <p>Aktywności zapisane na koncie</p>
        </div>
        <ButtonLink to="/logowanie" secondary>
          Zmień profil
        </ButtonLink>
      </div>
      {loading ? <DemoStatus state="ladowanie" /> : <div className="activity-links">
        {links.map(({ url, title, text, icon }) => (
          <Link key={url} href={url} className="activity-row">
            <span className="row-icon">
              <Icon name={icon} size={28} />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        ))}
      </div>}
    </>
  )
}
function Information({ path }: { path: string }) {
  const help = path === '/pomoc',
    privacy = path === '/prywatnosc'
  return (
    <>
      <Heading
        title={
          help
            ? 'Zacznij spokojnie. Pomożemy Ci przejść dalej.'
            : privacy
              ? 'Twoja sprawa nie musi ujawniać Twoich danych.'
              : 'Różne sposoby korzystania. Ten sam dostęp do treści.'
        }
        description={
          help
            ? 'Najważniejsze pytania o działanie MBG.'
            : privacy
              ? 'Planowane zasady prywatności oraz granice obecnego prototypu.'
              : 'Zaprojektowane ułatwienia, bez deklaracji pełnej zgodności przed audytem.'
        }
      />
      <article className="reading-page">
        {help ? (
          <>
            <h2>Chcę znaleźć rozwiązanie.</h2>
            <p>
              Opisz potrzebę, wybierz jej miejsce i sprawdź sugerowane kategorie. Powiązanie z
              istniejącą potrzebą zawsze potwierdzasz samodzielnie. Odrzucenie podpowiedzi tworzy
              nową potrzebę.
            </p>
            <ButtonLink to="/zgloszenia/nowe">Zgłoś potrzebę</ButtonLink>
            <h2>Chcę zaproponować coś nowego.</h2>
            <p>
              Skorzystaj z formularza lub asystenta. Treść przechodzi redakcję AI, potwierdzenie
              autora i ocenę administratora. Gdy AI nie działa, szkic czeka w kolejce.
            </p>
            <ButtonLink to="/potrzeby" secondary>
              Wybierz problem dla pomysłu
            </ButtonLink>
            <h2>Chcę pomóc lokalnie.</h2>
            <p>
              Popieraj zatwierdzone propozycje, deklaruj zasoby lub zgłoś udział w pilotażu.
              Poparcie i deklaracja budżetu nie oznaczają płatności.
            </p>
          </>
        ) : privacy ? (
          <>
            <h2>W tym prototypie</h2>
            <p>
              Konta, potrzeby i pilotaże są syntetyczne. Edytowane opisy i szkice mogą być
              przechowywane w sessionStorage tej przeglądarki do zamknięcia sesji. Nie wpisuj
              prawdziwych danych osobowych.
            </p>
            <h2>Anonimowa prezentacja</h2>
            <p>
              Ukrycie autora przed innymi użytkownikami nie ukrywa go przed administratorem ani nie
              usuwa wszystkich danych identyfikujących z treści.
            </p>
            <h2>Granica AI</h2>
            <p>
              Docelowo dane identyfikujące mają być usuwane lokalnie przed wysłaniem tekstu do
              zewnętrznego modelu. Lokalizacja i grupa odbiorców nie są automatycznie anonimowe.
              Prototyp nie wywołuje AI.
            </p>
            <h2>Retencja i zewnętrzne zasoby</h2>
            <p>
              Plan przewiduje około miesiąca dla surowych opisów i rozmów; szczegóły usuwania są
              otwarte. Fonty są lokalne. Ilustracje są zapisane lokalnie; aplikacja nie pobiera
              zdjęć z zewnętrznej domeny. Źródła ROPS otwierają odrębne strony.
            </p>
          </>
        ) : (
          <>
            <h2>Klawiatura i widoczne działanie</h2>
            <p>
              Przejście do treści, widoczny fokus i opisane przyciski. Głosowanie ma przyciski
              równoważne gestom. Formularze mają etykiety i komunikaty wskazujące sposób poprawy.
            </p>
            <h2>Alternatywy</h2>
            <p>
              Lokalizację można wskazać ręcznie. Widok semantyczny ma listę alternatywną. Ruch
              wyłączamy przy preferencji ograniczenia animacji. Układy dopasowują się do telefonu.
            </p>
            <h2>Co pozostaje do sprawdzenia</h2>
            <p>
              Pełny audyt WCAG 2.1 AA, testy z czytnikami ekranu i odbiorcami, uprawnienia backendu
              oraz dostępność docelowej mapy i wizualizacji.
            </p>
          </>
        )}
        <Notice>
          Treść informacyjna opisuje prototyp i zamiary. Nie jest oświadczeniem o wdrożeniu
          wszystkich mechanizmów.
        </Notice>
      </article>
    </>
  )
}
