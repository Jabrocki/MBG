import { useRef, useState, type FormEvent } from 'react'
import { navigate } from '../navigation'
import { idea, innovations, needs, illustrations, pilot, reportText } from '../data'
import {
  Badge,
  ButtonLink,
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
export function Citizen({ path, state, notify }: Props) {
  if (path === '/start') return <Home />
  if (path === '/zgloszenia/nowe') return <ReportForm state={state} />
  if (/^\/zgloszenia\/[^/]+\/potwierdzenie$/.test(path)) return <Confirmation state={state} />
  if (/^\/zgloszenia\/[^/]+\/wyniki$/.test(path)) return <Results state={state} />
  if (path === '/zgloszenia') return <Reports state={state} />
  if (/^\/zgloszenia\/[^/]+$/.test(path)) return <ReportDetail />
  if (path === '/innowacje') return <Catalogue state={state} />
  if (path.startsWith('/innowacje/')) return <Innovation id={path.split('/')[2]} />
  if (path === '/potrzeby' || path === '/potrzeby/najczestsze')
    return <Needs frequent={path.endsWith('najczestsze')} state={state} />
  if (path.startsWith('/potrzeby/')) return <NeedDetail id={path.split('/')[2]} />
  if (path === '/pomysly/nowy') return <IdeaForm state={state} />
  if (path === '/pomysly') return <Ideas state={state} />
  if (path.endsWith('/dyskusja')) return <Discussion notify={notify} />
  if (path.startsWith('/pomysly/')) return <IdeaDetail state={state} notify={notify} />
  if (path === '/poparcie') return <Support notify={notify} />
  if (path === '/adaptacje/nowa') return <AdaptForm />
  if (path.startsWith('/adaptacje/')) return <Adaptation />
  if (path === '/pilotaze') return <Pilots state={state} />
  if (path.startsWith('/pilotaze/')) return <PilotPage path={path} state={state} notify={notify} />
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
  return (
    <>
      <section className="home-welcome">
        <div>
          <h1 tabIndex={-1}>Dzień dobry, Marto.</h1>
          <p>
            Sprawy blisko Ciebie.
            <br />
            Pomysły, które mogą pomóc.
          </p>
          <span className="location">
            <Icon name="MapPin" size={17} />
            Wieliczka i okolice · dane demo
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
            '/pomysly/nowy',
            'Rozwijaj pomysł',
            'Uporządkuj propozycję z pomocą asystenta.',
            'Lightbulb',
            'lavender',
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
          <Panel>
            <Badge>Potwierdzona potrzeba</Badge>
            <h3>Wsparcie w codzienności z demencją</h3>
            <p>Znaleźliśmy jedną innowację, którą warto sprawdzić.</p>
            <ButtonLink to="/zgloszenia/1/wyniki" secondary>
              Zobacz rozwiązanie
            </ButtonLink>
          </Panel>
        </section>
        <section>
          <div className="section-heading">
            <h2>Możesz dołączyć.</h2>
            <Link href="/pilotaze">
              Pilotaże
              <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
          <Link href="/pilotaze/1" className="photo-teaser">
            <img
              src={illustrations.people}
              alt="Rysunkowi mieszkańcy Małopolski wspólnie rozmawiają."
            />
            <div>
              <Badge tone="yellow">Rekrutacja · demo</Badge>
              <h3>{pilot.title}</h3>
              <span>
                Wieliczka · poznaj rolę wolontariusza
                <Icon name="ArrowRight" size={16} />
              </span>
            </div>
          </Link>
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
        {needs.slice(0, 2).map((n) => (
          <Link href={`/potrzeby/${n.id}`} className="need-row" key={n.id}>
            <span className="row-icon">
              <Icon name="Users" size={25} />
            </span>
            <div>
              <h3>{n.title}</h3>
              <p>
                {n.place} · {n.people} unikalnych zgłaszających · przykład
              </p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        ))}
      </section>
    </>
  )
}
function ReportForm({ state }: { state: string }) {
  const [step, setStep] = useState(state === 'poza-regionem' ? 2 : 1),
    [text, setText] = useState(sessionStorage.getItem('mbg-report') ?? reportText),
    [place, setPlace] = useState(state === 'poza-regionem' ? 'Warszawa' : 'Wieliczka'),
    [geo, setGeo] = useState(false),
    [audience, setAudience] = useState('Bliskich / innych osób'),
    [error, setError] = useState(
      state === 'poza-regionem'
        ? 'Wybierz miejscowość w Małopolsce. Warszawa znajduje się poza obsługiwanym obszarem.'
        : '',
    )
  const errorSummary = useRef<HTMLDivElement>(null)
  const descriptionField = useRef<HTMLTextAreaElement>(null)
  const placeField = useRef<HTMLSelectElement>(null)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (step === 1) {
      if (text.trim().length < 30) {
        setError('Opisz sprawę przynajmniej jednym pełnym zdaniem (30 znaków w demo).')
        requestAnimationFrame(() => errorSummary.current?.focus())
        return
      }
      setError('')
      setStep(2)
      return
    }
    if (place !== 'Wieliczka' && place !== 'Kraków' && place !== 'Niepołomice') {
      setError(
        'Wybierz miejscowość w Małopolsce. Warszawa znajduje się poza obsługiwanym obszarem.',
      )
      requestAnimationFrame(() => errorSummary.current?.focus())
      return
    }
    sessionStorage.setItem('mbg-report', text)
    sessionStorage.setItem('mbg-place', place)
    navigate('/zgloszenia/1/potwierdzenie')
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
                <Field
                  label="Miejscowość w Małopolsce"
                  hint="Wybierz miejscowość, której dotyczy sprawa."
                >
                  <select
                    id="report-place"
                    ref={placeField}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'report-error' : undefined}
                    value={place}
                    onChange={(e) => {
                      setPlace(e.target.value)
                      setError('')
                    }}
                  >
                    <option>Wieliczka</option>
                    <option>Kraków</option>
                    <option>Niepołomice</option>
                    <option>Warszawa</option>
                  </select>
                </Field>
                <AreaMap active="1" onSelect={() => setPlace('Wieliczka')} />
                <button type="button" className="button secondary" onClick={() => setGeo(true)}>
                  <Icon name="MapPin" />
                  Użyj przykładowej lokalizacji telefonu
                </button>
                {geo && (
                  <Notice title="Czy to jest miejsce problemu?">
                    Lokalizacja demo: Wieliczka.{' '}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        setPlace('Wieliczka')
                        setGeo(false)
                      }}
                    >
                      Potwierdzam lokalizację problemu
                    </button>
                  </Notice>
                )}
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
                      step === 1 ? descriptionField.current?.focus() : placeField.current?.focus()
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
              <button className="button" type="submit">
                {step === 1 ? 'Dalej: miejsce potrzeby' : 'Przejdź do potwierdzenia'}
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
            W docelowej aplikacji dane identyfikujące mają być usuwane lokalnie przed kontaktem z
            zewnętrznym AI. Tutaj AI nie jest wywoływane.
          </Notice>
        </aside>
      </div>
    </>
  )
}
function Confirmation({ state }: { state: string }) {
  const [categories, setCategories] = useState(['Dla seniorów']),
    [selected, setSelected] = useState('1')
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
            <Badge tone="blue">Szacunki AI · symulacja</Badge>
            <fieldset className="chip-fieldset">
              <legend>Kategorie — możesz wybrać kilka</legend>
              {['Dla seniorów', 'Zdrowie', 'Integracja społeczna', 'Dla rynku pracy'].map((c) => (
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
                <input defaultValue="Osoby z demencją i ich opiekunowie" />
              </Field>
              <Field label="Pilność · szacunek AI">
                <select defaultValue="Zwykła">
                  <option>Zwykła</option>
                  <option>Pilna</option>
                </select>
              </Field>
              <Field label="Czas trwania · szacunek AI">
                <select>
                  <option>Potrzeba długotrwała</option>
                  <option>Potrzeba jednorazowa</option>
                </select>
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
          <Panel>
            <h2>Podobna potrzeba w okolicy</h2>
            <label className={`candidate ${selected === '1' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="match"
                checked={selected === '1'}
                onChange={() => setSelected('1')}
              />
              <div>
                <Badge>Do Twojego potwierdzenia</Badge>
                <h3>{needs[0].title}</h3>
                <p>{needs[0].description}</p>
                <span>Wieliczka · 18 unikalnych zgłaszających (demo)</span>
              </div>
            </label>
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
            <button
              className="button"
              onClick={() => {
                sessionStorage.setItem('mbg-new-need', selected)
                navigate('/zgloszenia/1/wyniki')
              }}
            >
              {selected === 'new' ? 'Utwórz nową potrzebę' : 'Potwierdzam tę potrzebę'}
              <Icon name="ArrowRight" />
            </button>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Twoje zgłoszenie</h2>
          <p>{sessionStorage.getItem('mbg-report') ?? reportText}</p>
          <span className="location">
            <Icon name="MapPin" />
            {sessionStorage.getItem('mbg-place') ?? 'Wieliczka'}
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
function InnovationRow({ id, match = false }: { id: string; match?: boolean }) {
  const item = innovations.find((i) => i.id === id) ?? innovations[0]
  return (
    <article className="innovation-row">
      <div
        className={`innovation-letter ${item.id === 'bajkala' ? 'blue' : item.id === 'bawita' ? 'green' : 'yellow'}`}
        aria-hidden="true"
      >
        {item.title.slice(0, 1)}
      </div>
      <div>
        <Badge>{item.category}</Badge>
        <h2>
          <Link href={`/innowacje/${item.id}`}>{item.title}</Link>
        </h2>
        <p>{item.description}</p>
        {match && (
          <div className="match-explanation">
            <strong>Dlaczego może pasować · interpretacja demo</strong>
            <p>
              Tablica jest skierowana do osób z wczesnym otępieniem i wspiera aktywności pamięciowe
              oraz manualne opisane w zgłoszeniu.
            </p>
            <strong>Co trzeba sprawdzić</strong>
            <p>{item.limitation}</p>
          </div>
        )}
        <div className="row-meta">
          <a href={item.url} target="_blank" rel="noreferrer">
            Źródło: ROPS <Icon name="ArrowSquareOut" size={16} />
          </a>
          <Link href={`/innowacje/${item.id}`}>
            Poznaj rozwiązanie
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
      </div>
    </article>
  )
}
function Results({ state }: { state: string }) {
  const [view, setView] = useState('Lista'),
    [angle, setAngle] = useState(0)
  return (
    <>
      <Heading
        title={
          state === 'pusto'
            ? 'Nie znaleźliśmy trafnego rozwiązania.'
            : 'Jedno rozwiązanie warte sprawdzenia.'
        }
        description="Dopasowanie to punkt wyjścia. Zobacz źródło, odbiorców i ograniczenia przed podjęciem decyzji."
        back="/zgloszenia"
      />
      {state === 'pusto' ? (
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
            <ButtonLink to="/pomysly/nowy" secondary>
              Rozwijaj pomysł
            </ButtonLink>
          </div>
        </>
      ) : (
        <>
          <Notice
            tone="success"
            title={
              sessionStorage.getItem('mbg-new-need') === 'new'
                ? 'Utworzono nową potrzebę w demo.'
                : 'Potwierdzono powiązanie w demo.'
            }
          >
            Wynik prezentacyjny dla potrzeb osób z demencją. Żadne wyszukiwanie AI nie zostało
            wykonane.
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
            <span>1 trafna innowacja · przykład</span>
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
                  <p>Przybliżona projekcja demo. Układ punktów nie wyznacza rankingu.</p>
                  <div className="semantic-stage">
                    <div
                      className="semantic-plane"
                      style={{ transform: `rotateX(52deg) rotateZ(${angle}deg)` }}
                    >
                      <span className="semantic-axis" />
                      <span className="semantic-axis other" />
                      <span className="semantic-point problem">Potrzeba</span>
                      <Link className="semantic-point solution" href="/innowacje/bawita">
                        BaWita
                      </Link>
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
                    Współrzędne są syntetyczne. Finalna wizualizacja będzie korzystać z projekcji
                    embeddingów i mieć tę samą listę alternatywną.
                  </small>
                </>
              )}
            </Panel>
          )}
          <div className="result-list">
            <InnovationRow id="bawita" match />
          </div>
          <section className="next-action">
            <h2>A jeśli potrzeba jest inna?</h2>
            <p>Możesz dalej szukać lub uporządkować nowy pomysł.</p>
            <div className="actions">
              <ButtonLink to="/innowacje" secondary>
                Przejrzyj bibliotekę
              </ButtonLink>
              <ButtonLink to="/pomysly/nowy" secondary>
                Rozwijaj pomysł
              </ButtonLink>
            </div>
          </section>
        </>
      )}
    </>
  )
}
function Reports({ state }: { state: string }) {
  return (
    <>
      <Heading
        title="Twoje zgłoszenia."
        description="Wróć do sprawy i sprawdź jej dalszy ciąg."
        action={<ButtonLink to="/zgloszenia/nowe">Nowe zgłoszenie</ButtonLink>}
      />
      {state === 'pusto' ? (
        <Empty />
      ) : (
        <Panel>
          <Link href="/zgloszenia/1" className="activity-row">
            <span className="row-icon">
              <Icon name="ClipboardText" size={26} />
            </span>
            <div>
              <Badge>Potrzeba potwierdzona</Badge>
              <h2>Codzienne aktywności dla osób z demencją</h2>
              <p>Wieliczka · 3 października 2026 · zgłoszenie demo</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
          <Link href="/zgloszenia/1?stan=kolejka" className="activity-row">
            <span className="row-icon blue">
              <Icon name="Clock" size={26} />
            </span>
            <div>
              <Badge tone="yellow">W analizie · przykład stanu</Badge>
              <h2>Spotkania sąsiedzkie blisko domu</h2>
              <p>Wieliczka · 2 października 2026 · dane demo</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        </Panel>
      )}
    </>
  )
}
function ReportDetail() {
  return (
    <>
      <Heading
        title="Codzienne aktywności dla osób z demencją."
        back="/zgloszenia"
        description="Zgłoszenie MBG-001 · 3 października 2026 · dane demo"
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge>Potrzeba potwierdzona</Badge>
            <h2>Twój opis</h2>
            <p>{sessionStorage.getItem('mbg-report') ?? reportText}</p>
            <dl className="facts">
              <Fact label="Miejsce">Wieliczka</Fact>
              <Fact label="Widoczność">Autor ukryty przed innymi użytkownikami</Fact>
              <Fact label="Kategorie">Dla seniorów · Zdrowie</Fact>
            </dl>
          </Panel>
          <Panel>
            <h2>Co wydarzyło się dalej?</h2>
            <ol className="timeline">
              <li>
                <strong>Zapis zgłoszenia</strong>
                <span>Przykładowy opis i lokalizacja.</span>
              </li>
              <li>
                <strong>Potwierdzenie potrzeby</strong>
                <span>Powiązanie wybrane przez użytkownika.</span>
              </li>
              <li>
                <strong>Rozwiązanie do sprawdzenia</strong>
                <span>BaWita — biblioteka ROPS.</span>
              </li>
            </ol>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Twoja potrzeba</h2>
          <p>{needs[0].title}</p>
          <ButtonLink to="/potrzeby/1" secondary>
            Poznaj wspólną potrzebę
          </ButtonLink>
          <ButtonLink to="/zgloszenia/1/wyniki">Zobacz rozwiązanie</ButtonLink>
          <small>
            Powtórne zgłoszenie przez to samo konto liczy się raz. Decyzje moderacji wymagają
            backendu.
          </small>
        </aside>
      </div>
    </>
  )
}
function Catalogue({ state }: { state: string }) {
  const params = new URLSearchParams(window.location.search),
    [query, setQuery] = useState(params.get('q') ?? ''),
    [category, setCategory] = useState(params.get('kategoria') ?? 'Wszystkie')
  const filtered = innovations.filter(
    (i) =>
      (category === 'Wszystkie' || i.category === category) &&
      (i.title + i.description).toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl')),
  )
  function updateFilters(q: string, c: string) {
    setQuery(q)
    setCategory(c)
    const search = new URLSearchParams()
    if (q) search.set('q', q)
    if (c !== 'Wszystkie') search.set('kategoria', c)
    window.history.replaceState({}, '', `/innowacje${search.size ? '?' + search.toString() : ''}`)
  }
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
          <p>Trzy opisane innowacje. Bez niepotwierdzonych kosztów i ocen skuteczności.</p>
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
            {['Wszystkie', ...innovations.map((i) => i.category)].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>
      <p className="muted">
        {state === 'pusto' ? 0 : filtered.length} wyników · treści z biblioteki ROPS
      </p>
      {state === 'pusto' || !filtered.length ? (
        <Empty
          title="Brak wyników dla tych filtrów."
          text="Zmień kategorię albo użyj krótszego zapytania."
          to="/innowacje"
          action="Wyczyść filtry"
        />
      ) : (
        filtered.map((i) => <InnovationRow key={i.id} id={i.id} />)
      )}
    </>
  )
}
function Innovation({ id }: { id: string }) {
  const item = innovations.find((i) => i.id === id) ?? innovations[0]
  const [tab, setTab] = useState('Opis')
  return (
    <>
      <Heading title={item.title} description={item.description} back="/innowacje" />
      <div className="detail-layout">
        <div>
          <div className="innovation-feature">
            <div className="innovation-letter large">{item.title.slice(0, 1)}</div>
            <div>
              <Badge>{item.category}</Badge>
              <h2>
                Narzędzie do rozważenia.
                <br />
                Ze źródłem do sprawdzenia.
              </h2>
              <a href={item.url} target="_blank" rel="noreferrer">
                Biblioteka ROPS
                <Icon name="ArrowSquareOut" size={17} />
              </a>
            </div>
          </div>
          <div className="segmented section-tabs">
            {['Opis', 'Testy', 'Materiały'].map((t) => (
              <button key={t} onClick={() => setTab(t)} aria-pressed={tab === t}>
                {t}
              </button>
            ))}
          </div>
          <Panel>
            {tab === 'Opis' ? (
              <>
                <h2>Dla kogo?</h2>
                <p>{item.audience}</p>
                <h2>Co trzeba uwzględnić?</h2>
                <p>{item.limitation}</p>
                <h2>Skąd pochodzi opis?</h2>
                <p>
                  Skrót na podstawie {item.file} w zbiorze źródłowym repozytorium. MBG nie
                  przypisuje sobie autorstwa innowacji.
                </p>
              </>
            ) : tab === 'Testy' ? (
              <>
                <h2>Co mówi źródło o testach?</h2>
                <p>{item.evidence}</p>
                <Notice>
                  Nie przenosimy wyniku testów na nowe miejsce lub grupę odbiorców bez sprawdzenia
                  warunków.
                </Notice>
              </>
            ) : (
              <>
                <h2>Materiały źródłowe</h2>
                <a className="button secondary" href={item.url} target="_blank" rel="noreferrer">
                  Otwórz oryginalną kartę
                  <Icon name="ArrowSquareOut" />
                </a>
                <p>
                  Linki do materiałów znajdują się w karcie źródłowej. Dostępność plików i filmów
                  nie została zweryfikowana w tej wersji aplikacji.
                </p>
              </>
            )}
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Przenieś pomysł do swojego miejsca.</h2>
          <p>Adaptacja bierze pod uwagę odbiorców, zasoby i ograniczenia Twojej organizacji.</p>
          <ButtonLink to={`/adaptacje/nowa?innowacja=${item.id}`}>Przygotuj adaptację</ButtonLink>
          <dl>
            <Fact label="Koszt wdrożenia">Brak danych w skrócie źródłowym</Fact>
            <Fact label="Lokalna dostępność">Do sprawdzenia</Fact>
            <Fact label="Pochodzenie">ROPS w Krakowie</Fact>
          </dl>
        </aside>
      </div>
    </>
  )
}
function AreaMap({
  active = '1',
  onSelect,
  visibleIds = needs.map((n) => n.id),
}: {
  active?: string
  onSelect?: (id: string) => void
  visibleIds?: string[]
}) {
  return (
    <div className="area-map">
      <svg
        viewBox="0 0 700 400"
        role="img"
        aria-label="Schemat okolic Krakowa, Wieliczki i Niepołomic. Położenia są poglądowe, nie służą nawigacji."
      >
        <rect width="700" height="400" fill="#e5ebdf" />
        <path
          d="M0 60L190 20 260 110 175 195 0 150ZM360 0L520 20 620 150 490 190 390 100ZM50 260L175 215 270 345 230 400 0 400ZM500 260L700 190 700 400 580 375Z"
          fill="#cedec0"
        />
        <path
          d="M-10 185C80 155 165 210 240 180S380 115 465 175 600 245 715 195"
          fill="none"
          stroke="#afd2dc"
          strokeWidth="24"
        />
        <path
          d="M90 0L250 175 385 330 550 400M0 310L250 175 495 115 700 35M250 175L515 330 700 355"
          fill="none"
          stroke="#fffdf7"
          strokeWidth="14"
        />
        <path
          d="M90 0L250 175 385 330 550 400M0 310L250 175 495 115 700 35M250 175L515 330 700 355"
          fill="none"
          stroke="#c9bd9b"
          strokeWidth="2"
        />
        <g fill="#445951" fontFamily="IBM Plex Sans, sans-serif" fontSize="17">
          <text x="195" y="145">
            Kraków
          </text>
          <text x="328" y="375">
            Wieliczka
          </text>
          <text x="504" y="303">
            Niepołomice
          </text>
          <text x="64" y="360">
            Skawina
          </text>
        </g>
      </svg>
      {[
        { id: '1', x: 54, y: 78 },
        { id: '2', x: 44, y: 64 },
        { id: '3', x: 35, y: 45 },
        { id: '4', x: 74, y: 72 },
      ]
        .filter((p) => visibleIds.includes(p.id))
        .map((p) => (
          <button
            type="button"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            key={p.id}
            className={`map-marker ${active === p.id ? 'selected' : ''}`}
            onClick={() => onSelect?.(p.id)}
            aria-label={`Wybierz potrzebę: ${needs.find((n) => n.id === p.id)?.title}`}
          >
            <Icon name="MapPin" size={21} />
          </button>
        ))}
      <span className="map-disclaimer">Schemat lokalizacji · dane demo · bez geokodowania</span>
    </div>
  )
}
function Needs({ frequent, state }: { frequent: boolean; state: string }) {
  const params = new URLSearchParams(window.location.search),
    [radius, setRadius] = useState(+(params.get('promien') ?? 20)),
    [selected, setSelected] = useState('1'),
    [mode, setMode] = useState(frequent ? 'Lista' : 'Mapa')
  const filtered = needs.filter((n) => n.distance <= radius)
  const activeSelected = filtered.some((n) => n.id === selected) ? selected : filtered[0]?.id
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
        <Field label="Obszar">
          <select>
            <option>Wieliczka i okolice</option>
          </select>
        </Field>
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
      <small>
        Promień służy odkrywaniu. Nie zmienia grupowania zgłoszeń. Okres zliczania: pełny zbiór
        demo; okres produkcyjny do ustalenia.
      </small>
      {state === 'pusto' ? (
        <Empty
          title="W tym obszarze nie ma jeszcze potrzeb."
          text="Zwiększ promień lub opisz pierwszą sprawę w tej okolicy."
        />
      ) : (
        <div className={mode === 'Mapa' ? 'map-layout' : 'needs-list'}>
          {mode === 'Mapa' && (
            <AreaMap
              active={activeSelected}
              onSelect={setSelected}
              visibleIds={filtered.map((n) => n.id)}
            />
          )}
          <div>
            {filtered.map((n, i) => (
              <article
                key={n.id}
                className={`need-item ${activeSelected === n.id ? 'selected' : ''}`}
              >
                <div className="row-meta">
                  <Badge>{n.category}</Badge>
                  <span>{frequent ? `${i + 1}. miejsce w demo` : `${n.distance} km`}</span>
                </div>
                <h2>
                  <Link href={`/potrzeby/${n.id}`}>{n.title}</Link>
                </h2>
                <p>
                  {n.place} · {n.people} unikalnych zgłaszających
                </p>
                <div className="row-meta">
                  <span>{n.status}</span>
                  <Link href={`/potrzeby/${n.id}`} aria-label={`Poznaj potrzebę: ${n.title}`}>
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
  const n = needs.find((item) => item.id === id) ?? needs[0]
  return (
    <>
      <Heading title={n.title} description={n.description} back="/potrzeby" />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge>{n.status}</Badge>
            <dl className="facts">
              <Fact label="Obszar">{n.place}</Fact>
              <Fact label="Unikalni zgłaszający">{n.people} · dane demo</Fact>
              <Fact label="Kategorie">{n.category}</Fact>
            </dl>
            <p>
              Podsumowanie jest przykładowe. Nie pokazujemy oryginalnych opisów ani tożsamości
              innych zgłaszających.
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
            {n.id === '2' ? (
              <Empty
                title="Brak pasującej innowacji w przykładowej bibliotece."
                text="Dla tej potrzeby sprawdź pomysły społeczności lub zaproponuj własne rozwiązanie."
                to="/pomysly"
                action="Poznaj pomysły społeczności"
              />
            ) : (
              <InnovationRow
                id={
                  n.id === '1' ? 'bawita' : n.id === '3' ? 'agencja-pracy-incydentalnej' : 'bajkala'
                }
              />
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
          <ButtonLink to="/pomysly/nowy" secondary>
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
function IdeaForm({ state }: { state: string }) {
  const [mode, setMode] = useState('Formularz'),
    [message, setMessage] = useState(''),
    [messages, setMessages] = useState<{ author: string; text: string }[]>([
      {
        author: 'Asystent · symulacja',
        text: 'Zacznijmy od potrzeby i odbiorców. Komu ma pomóc Twój pomysł i jakiej zmiany oczekujesz?',
      },
    ])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    sessionStorage.setItem('mbg-idea-title', String(form.get('title') ?? idea.title))
    sessionStorage.setItem('mbg-idea-text', String(form.get('solution') ?? idea.description))
    sessionStorage.setItem('mbg-idea-status', state === 'ai-offline' ? 'kolejka' : 'autor')
    navigate(`/pomysly/1${state === 'ai-offline' ? '?stan=kolejka' : ''}`)
  }
  function chat(event: FormEvent) {
    event.preventDefault()
    if (!message.trim()) return
    setMessages([
      ...messages,
      { author: 'Ty', text: message },
      {
        author: 'Asystent · symulacja',
        text: 'Doprecyzujmy zasoby: kto udostępni miejsce i kto poprowadzi spotkania? Ten pokazowy asystent nie wywołuje AI. Uporządkowany szkic możesz przygotować w formularzu.',
      },
    ])
    setMessage('')
  }
  return (
    <>
      <Heading
        title="Dobry pomysł potrzebuje kilku konkretów."
        description="Opisz propozycję albo uporządkuj ją w rozmowie. Szkic pozostaje prywatny do zakończenia całego procesu."
        back="/pomysly"
      />
      {state === 'ai-offline' && (
        <Notice tone="warning" title="AI jest chwilowo niedostępne · przykład.">
          Formularz pozostaje dostępny. Po zapisaniu pomysł trafi do kolejki przetwarzania, a nie
          bezpośrednio do publikacji.
        </Notice>
      )}
      <div className="segmented section-tabs">
        {['Formularz', 'Rozmowa z asystentem'].map((m) => (
          <button
            key={m}
            disabled={state === 'ai-offline' && m !== 'Formularz'}
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="detail-layout">
        <Panel>
          {mode === 'Formularz' ? (
            <form onSubmit={submit}>
              <h2>Zapisz sedno pomysłu.</h2>
              <Field label="Nazwa pomysłu">
                <input name="title" defaultValue={idea.title} required />
              </Field>
              <Field label="Potrzeba i odbiorcy">
                <textarea
                  name="need"
                  rows={3}
                  defaultValue="Mieszkańcy Wieliczki, którzy szukają regularnego kontaktu z sąsiadami blisko domu."
                  required
                />
              </Field>
              <Field label="Proponowane rozwiązanie">
                <textarea name="solution" rows={4} defaultValue={idea.description} required />
              </Field>
              <div className="form-grid">
                <Field label="Partnerzy">
                  <input name="partners" defaultValue="Biblioteka / prowadzący demo" />
                </Field>
                <Field label="Koszty i zasoby" hint="Deklaracja autora, nie zatwierdzony budżet.">
                  <input
                    name="resources"
                    defaultValue="Sala i 2 godziny pracy prowadzącego tygodniowo"
                  />
                </Field>
              </div>
              <Field label="Etapy wdrożenia">
                <textarea
                  name="stages"
                  defaultValue="Uzgodnienie miejsca → zaproszenie mieszkańców → próbne spotkania → zebranie opinii."
                  rows={3}
                />
              </Field>
              <button className="button" type="submit">
                {state === 'ai-offline' ? 'Zapisz do kolejki AI' : 'Przygotuj szkic do sprawdzenia'}
                <Icon name="ArrowRight" />
              </button>
            </form>
          ) : (
            <div className="chat">
              <Notice>
                Rozmowa pokazowa w bieżącej sesji. Brak wznawiania rozmów i rzeczywistego modelu AI.
              </Notice>
              <div className="messages">
                {messages.map((m, i) => (
                  <div key={i} className={`message ${m.author === 'Ty' ? 'mine' : ''}`}>
                    <strong>{m.author}</strong>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={chat}>
                <Field label="Twoja wiadomość">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Opisz pomysł…"
                    rows={2}
                    required
                  />
                </Field>
                <button className="button">
                  Wyślij w demo
                  <Icon name="ArrowRight" />
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setMode('Formularz')}
                >
                  Przejdź do formularza
                </button>
              </form>
            </div>
          )}
        </Panel>
        <aside className="context-aside">
          <img src="/images/community.webp" alt="" />
          <h2>Od szkicu do propozycji.</h2>
          <ol className="timeline">
            <li>
              <strong>Redakcja AI</strong>
              <span>Porządkowanie tekstu i wskazanie niewiadomych.</span>
            </li>
            <li>
              <strong>Twoje potwierdzenie</strong>
              <span>Sprawdzenie znaczenia i treści.</span>
            </li>
            <li>
              <strong>Decyzja administratora</strong>
              <span>Dopiero potem publikacja i poparcie.</span>
            </li>
          </ol>
          <small>
            Przetwarzanie, koszty i decyzje w tym prototypie są symulowane. Wpisuj wyłącznie dane
            przykładowe.
          </small>
        </aside>
      </div>
    </>
  )
}
function Ideas({ state }: { state: string }) {
  const [tab, setTab] = useState('Społeczność')
  return (
    <>
      <Heading
        title="Pomysły, które warto rozwijać."
        description="Propozycje społeczności oraz Twoje prywatne szkice. Pomysł nie oznacza jeszcze przetestowanej innowacji."
        action={<ButtonLink to="/pomysly/nowy">Nowy pomysł</ButtonLink>}
      />
      <div className="segmented section-tabs">
        {['Społeczność', 'Moje szkice'].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {state === 'pusto' ? (
        <Empty
          title="Pierwszy pomysł może być Twój."
          to="/pomysly/nowy"
          action="Przygotuj pomysł"
        />
      ) : tab === 'Społeczność' ? (
        <div className="idea-grid">
          <Link href="/pomysly/1?stan=oferta" className="idea-card">
            <img src={illustrations.hands} alt="Rysunkowa scena wspólnego działania mieszkańców." />
            <div>
              <Badge tone="lavender">Pomysł · zatwierdzony w demo</Badge>
              <h2>{idea.title}</h2>
              <p>{idea.description}</p>
              <div className="row-meta">
                <span>
                  <Icon name="MapPin" size={17} />
                  Wieliczka
                </span>
                <span>
                  <Icon name="Heart" size={18} />
                  24 poparcia · demo
                </span>
              </div>
            </div>
          </Link>
          <section className="idea-invitation">
            <Icon name="Lightbulb" size={40} />
            <h2>Masz inną perspektywę?</h2>
            <p>Potrzeby ludzi mają więcej niż jedną odpowiedź. Dodaj swoją propozycję.</p>
            <ButtonLink to="/pomysly/nowy">Rozwijaj pomysł</ButtonLink>
          </section>
        </div>
      ) : (
        <Panel>
          <Link className="activity-row" href="/pomysly/1">
            <Icon name="Lightbulb" size={28} />
            <div>
              <Badge tone="yellow">Oczekuje na autora · prywatny</Badge>
              <h2>{sessionStorage.getItem('mbg-idea-title') ?? idea.title}</h2>
              <p>Sprawdź roboczą treść i potwierdź jej przekazanie.</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
          <Link className="activity-row" href="/pomysly/1?stan=kolejka">
            <Icon name="Clock" size={28} />
            <div>
              <Badge tone="blue">Oczekuje na AI · prywatny</Badge>
              <h2>Drugi szkic · wariant stanu</h2>
              <p>Treść nie jest dostępna w społeczności.</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        </Panel>
      )}
    </>
  )
}
function IdeaDetail({ state, notify }: { state: string; notify: Notify }) {
  const [status, setStatus] = useState(
      state === 'kolejka'
        ? 'kolejka'
        : state === 'oferta'
          ? 'publiczny'
          : (sessionStorage.getItem('mbg-idea-status') ?? 'autor'),
    ),
    [edit, setEdit] = useState(false),
    [text, setText] = useState(
      state === 'oferta'
        ? idea.description
        : (sessionStorage.getItem('mbg-idea-text') ?? idea.description),
    )
  const title =
    status === 'publiczny' ? idea.title : (sessionStorage.getItem('mbg-idea-title') ?? idea.title)
  return (
    <>
      <Heading
        title={title}
        back="/pomysly"
        description="Pomysł lokalny · Wieliczka · treść i decyzje demo"
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge tone={status === 'publiczny' ? 'green' : 'yellow'}>
              {status === 'kolejka'
                ? 'Prywatny · oczekuje na AI'
                : status === 'autor'
                  ? 'Prywatny · czeka na Twoje potwierdzenie'
                  : status === 'ocena'
                    ? 'Prywatny · u administratora'
                    : 'Zatwierdzony pomysł · demo'}
            </Badge>
            <h2>Propozycja do sprawdzenia</h2>
            {edit ? (
              <Field label="Popraw treść szkicu">
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} />
              </Field>
            ) : (
              <p>{text}</p>
            )}
            <h3>Odbiorcy i potrzeba</h3>
            <p>Mieszkańcy szukający regularnych spotkań i kontaktu sąsiedzkiego.</p>
            <h3>Zasoby i etapy</h3>
            <p>
              Sala, prowadzący i ustalenie programu. Następnie próbne spotkania i zebranie opinii.
              Koszty do przygotowania; nie ma zatwierdzonego budżetu.
            </p>
            <Notice>
              Treść jest przykładową redakcją. AI nie było wywołane; przed wdrożeniem każdy szkic
              musi przejść rzeczywisty proces z README.
            </Notice>
          </Panel>
          {status === 'publiczny' ? (
            <Panel>
              <h2>24 poparcia to sygnał zainteresowania.</h2>
              <p>To nie satysfakcja po testach ani decyzja o rozpoczęciu pilotażu.</p>
              <div className="actions">
                <ButtonLink to="/poparcie">Przejdź do poparcia</ButtonLink>
                <ButtonLink to="/pomysly/1/dyskusja" secondary>
                  Dołącz do rozmowy
                </ButtonLink>
              </div>
            </Panel>
          ) : status === 'kolejka' ? (
            <Notice tone="warning" title="Szkic bezpiecznie czeka w demo.">
              Nie można przekazać go do publikacji bez AI i Twojego potwierdzenia.{' '}
              <button
                className="text-button"
                onClick={() => {
                  setStatus('autor')
                  sessionStorage.setItem('mbg-idea-status', 'autor')
                  notify('Symulacja: przetworzenie AI zakończone. Sprawdź szkic.')
                }}
              >
                Zasymuluj zakończenie AI
              </button>
            </Notice>
          ) : status === 'autor' ? (
            <div className="actions">
              <button
                className="button"
                onClick={() => {
                  setStatus('ocena')
                  sessionStorage.setItem('mbg-idea-status', 'ocena')
                  notify('Demo: autor potwierdził szkic. Oczekuje na administratora.')
                }}
              >
                Potwierdzam i przekazuję do oceny
                <Icon name="Check" />
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  if (edit) {
                    sessionStorage.setItem('mbg-idea-text', text)
                    setStatus('kolejka')
                    sessionStorage.setItem('mbg-idea-status', 'kolejka')
                    notify('Zmieniona treść wraca do przetworzenia AI w demo.')
                  }
                  setEdit(!edit)
                }}
              >
                {edit ? 'Zapisz i ponów AI' : 'Popraw szkic'}
              </button>
            </div>
          ) : (
            <Notice tone="success" title="Szkic oczekuje na administratora.">
              Pozostaje prywatny do czasu potwierdzenia autora i decyzji administratora.
            </Notice>
          )}
        </div>
        <aside className="context-aside">
          <h2>Ścieżka publikacji</h2>
          <ol className="timeline">
            <li>
              <strong>AI</strong>
              <span>
                {status === 'kolejka'
                  ? 'Oczekuje na przetworzenie'
                  : 'Przetworzone w scenariuszu demo'}
              </span>
            </li>
            <li>
              <strong>Autor</strong>
              <span>
                {status === 'autor' || status === 'kolejka'
                  ? 'Potwierdzenie przed nami'
                  : 'Potwierdzono w demo'}
              </span>
            </li>
            <li>
              <strong>Administrator</strong>
              <span>
                {status === 'publiczny' ? 'Publikacja dopuszczona w demo' : 'Decyzja przed nami'}
              </span>
            </li>
          </ol>
          <small>
            Nie przechowujemy rozmowy asystenta w celu wznowienia. Tylko zatwierdzona propozycja
            trafia do poparcia.
          </small>
        </aside>
      </div>
    </>
  )
}
function Discussion({ notify }: { notify: Notify }) {
  const [text, setText] = useState(''),
    [comments, setComments] = useState([
      {
        author: 'Koordynator demo',
        text: 'Przed pilotażem sprawdźmy dostępność sali oraz to, kto poprowadzi pierwsze spotkania.',
      },
      {
        author: 'Marta demo',
        text: 'Możemy zacząć od jednego krótkiego spotkania i zebrać opinie uczestników.',
      },
    ])
  return (
    <>
      <Heading
        title="Porozmawiajmy o Sąsiedzkim stole."
        back="/pomysly"
        description="Wątek przypięty do zatwierdzonego pomysłu. Wszyscy uczestnicy i komentarze są syntetyczni."
      />
      <div className="detail-layout">
        <Panel>
          <h2>Rozmowa o pomyśle</h2>
          {comments.map((c, i) => (
            <article className="comment" key={i}>
              <span className="avatar">{c.author.slice(0, 1)}</span>
              <div>
                <strong>{c.author}</strong>
                <p>{c.text}</p>
                <small>Wiadomość demo · widoczna w tym podglądzie</small>
              </div>
            </article>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              setComments([...comments, { author: 'Marta demo', text }])
              setText('')
              notify('Komentarz dodany lokalnie w demo.')
            }}
          >
            <Field label="Dodaj komentarz">
              <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} required />
            </Field>
            <button className="button">
              Dodaj komentarz
              <Icon name="ChatCircle" />
            </button>
          </form>
        </Panel>
        <aside className="context-aside">
          <Badge tone="lavender">Zatwierdzony pomysł · demo</Badge>
          <h2>{idea.title}</h2>
          <p>{idea.description}</p>
          <ButtonLink to="/pomysly/1?stan=oferta" secondary>
            Wróć do pomysłu
          </ButtonLink>
          <Notice>
            Widoczność wątków i uprawnienia docelowej aplikacji pozostają do ustalenia. Ten ekran
            prezentuje rozmowę po zalogowaniu.
          </Notice>
        </aside>
      </div>
    </>
  )
}
function Support({ notify }: { notify: Notify }) {
  const [index, setIndex] = useState(0),
    [choices, setChoices] = useState<string[]>([]),
    [reason, setReason] = useState(''),
    pointerStart = useRef<number | null>(null)
  const cards = [
    {
      title: idea.title,
      description: idea.description,
      type: 'Pomysł',
      count: 24,
      photo: illustrations.hands,
    },
    {
      title: pilot.title,
      description: pilot.description,
      type: 'W przygotowaniu do testów',
      count: 12,
      photo: illustrations.people,
    },
  ]
  function choose(choice: string) {
    if (index >= cards.length) return
    setChoices([...choices, choice])
    setIndex(index + 1)
    notify(
      choice === 'support'
        ? 'Demo: dodano poparcie dla tej propozycji i lokalnej potrzeby.'
        : 'Demo: pominięto propozycję. Możesz cofnąć wybór.',
    )
  }
  return (
    <>
      <Heading
        title="Co zasługuje na wspólny krok?"
        description="Zatwierdzone propozycje dla nierozwiązanych potrzeb w Wieliczce. Poparcie to sygnał zainteresowania, nie decyzja o pilotażu."
      />
      <div className="support-layout">
        {index >= cards.length ? (
          <Empty
            title="To wszystkie propozycje w tym demo."
            text="Dzięki za wybory. Możesz je cofnąć lub poznać inne potrzeby."
            to="/potrzeby"
            action="Wróć do potrzeb"
          />
        ) : (
          <article
            className="support-card"
            onPointerDown={(e) => {
              pointerStart.current = e.clientX
            }}
            onPointerUp={(e) => {
              if (pointerStart.current !== null && Math.abs(e.clientX - pointerStart.current) > 90)
                choose(e.clientX > pointerStart.current ? 'support' : 'skip')
              pointerStart.current = null
            }}
            onPointerCancel={() => {
              pointerStart.current = null
            }}
          >
            <img
              src={cards[index].photo}
              alt="Rysunkowa ilustracja propozycji demo."
              draggable={false}
            />
            <div>
              <div className="row-meta">
                <Badge tone="lavender">{cards[index].type} · demo</Badge>
                <span>
                  {index + 1} / {cards.length}
                </span>
              </div>
              <h2>{cards[index].title}</h2>
              <p>{cards[index].description}</p>
              <p className="support-context">
                Potrzeba:{' '}
                {index === 0
                  ? 'Spotkania sąsiedzkie blisko domu'
                  : 'Wsparcie aktywności osób z demencją'}
              </p>
              <div className="row-meta">
                <span>
                  <Icon name="MapPin" />
                  Wieliczka
                </span>
                <span>
                  <Icon name="Heart" />
                  {cards[index].count} poparcia · demo
                </span>
              </div>
              <Link href={index === 0 ? '/pomysly/1?stan=oferta' : '/pilotaze/1'}>
                Szczegóły i ograniczenia
                <Icon name="ArrowRight" size={16} />
              </Link>
              <div className="vote-actions">
                <button className="button secondary" onClick={() => choose('skip')}>
                  <Icon name="X" />
                  Pomijam
                </button>
                <button className="button" onClick={() => choose('support')}>
                  <Icon name="Heart" />
                  Popieram
                </button>
              </div>
            </div>
          </article>
        )}
        <aside className="context-aside">
          <h2>Twój głos. Twój wybór.</h2>
          <p>
            Przesuń kartę w prawo, aby poprzeć, lub w lewo, aby pominąć. Przyciski wykonują ten sam
            wybór i działają klawiaturą.
          </p>
          <button
            className="button secondary"
            disabled={!choices.length}
            onClick={() => {
              setIndex(Math.max(0, index - 1))
              setChoices(choices.slice(0, -1))
              notify('Demo: cofnięto ostatni wybór.')
            }}
          >
            <Icon name="ArrowCounterClockwise" />
            Cofnij ostatni wybór
          </button>
          {choices.at(-1) === 'skip' && (
            <>
              <Field label="Dlaczego pomijasz? (opcjonalnie)">
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
              </Field>
              <button
                className="text-button"
                onClick={() => notify('Powód zachowany wyłącznie w tym widoku demo.')}
              >
                Zapisz powód w demo
              </button>
            </>
          )}
          <small>
            Jedno bieżące poparcie na propozycję w konkretnej potrzebie. Liczby nie opisują
            satysfakcji ani skuteczności.
          </small>
        </aside>
      </div>
    </>
  )
}
type AdaptationDraft = {
  innovation: string
  organization: string
  audience: string
  place: string
  budget: string
  resources: string
  constraints: string
}
const defaultAdaptation: AdaptationDraft = {
  innovation: 'bawita',
  organization: 'Placówka dziennego wsparcia demo',
  audience: innovations[0].audience,
  place: 'Wieliczka',
  budget: '4200',
  resources: 'Dostępna sala, prowadzący i czas na krótkie spotkania.',
  constraints: 'Niewielka grupa, zróżnicowana sprawność manualna, potrzeba spokojnej przestrzeni.',
}
function readAdaptation(): AdaptationDraft {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem('mbg-adaptation') ?? 'null')
    if (
      stored &&
      typeof stored === 'object' &&
      Object.keys(defaultAdaptation).every(
        (k) => typeof (stored as Record<string, unknown>)[k] === 'string',
      )
    )
      return stored as AdaptationDraft
  } catch {
    /* An invalid local draft falls back to the synthetic fixture. */
  }
  return defaultAdaptation
}
function AdaptForm() {
  const id = new URLSearchParams(window.location.search).get('innowacja') ?? 'bawita',
    item = innovations.find((i) => i.id === id) ?? innovations[0]
  const stored = readAdaptation()
  const draft =
    stored.innovation === item.id
      ? stored
      : { ...defaultAdaptation, innovation: item.id, audience: item.audience }
  return (
    <>
      <Heading
        title="Dobre rozwiązanie. Twoje warunki."
        description="Przygotuj roboczą adaptację istniejącej innowacji dla swojej placówki lub organizacji."
        back="/innowacje"
      />
      <div className="detail-layout">
        <Panel>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const fields = new FormData(e.currentTarget)
              const values = Object.fromEntries(
                Object.keys(defaultAdaptation).map((k) => [
                  k,
                  k === 'innovation' ? item.id : String(fields.get(k) ?? ''),
                ]),
              )
              sessionStorage.setItem('mbg-adaptation', JSON.stringify(values))
              navigate('/adaptacje/1')
            }}
          >
            <h2>Co trzeba uwzględnić?</h2>
            <Field label="Organizacja / placówka (przykładowa)">
              <input name="organization" defaultValue={draft.organization} required />
            </Field>
            <Field label="Odbiorcy">
              <textarea name="audience" defaultValue={draft.audience} rows={3} required />
            </Field>
            <div className="form-grid">
              <Field label="Miejscowość">
                <select name="place" defaultValue={draft.place}>
                  <option>Wieliczka</option>
                  <option>Kraków</option>
                  <option>Niepołomice</option>
                </select>
              </Field>
              <Field label="Dostępny budżet · deklaracja autora">
                <input name="budget" type="number" min="0" defaultValue={draft.budget} required />
              </Field>
            </div>
            <Field label="Zasoby">
              <textarea name="resources" defaultValue={draft.resources} rows={3} />
            </Field>
            <Field label="Ograniczenia">
              <textarea name="constraints" defaultValue={draft.constraints} rows={3} />
            </Field>
            <button className="button">
              Przygotuj roboczą adaptację
              <Icon name="ArrowRight" />
            </button>
          </form>
        </Panel>
        <aside className="context-aside">
          <Badge>Wybrana innowacja</Badge>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <a href={item.url}>
            Sprawdź źródło
            <Icon name="ArrowSquareOut" size={16} />
          </a>
          <Notice>
            Instytucja korzysta ze zwykłego konta użytkownika. Adaptacja jest szkicem, nie
            zatwierdzonym wdrożeniem.
          </Notice>
        </aside>
      </div>
    </>
  )
}
function Adaptation() {
  const draft = readAdaptation()
  const item = innovations.find((i) => i.id === draft.innovation) ?? innovations[0]
  return (
    <>
      <Heading
        title={`${item.title} w Twojej placówce.`}
        description="Robocza adaptacja · wariant demonstracyjny · wymagane sprawdzenie przez organizację i administratora"
        back="/innowacje"
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge tone="yellow">Szkic adaptacji · demo</Badge>
            <h2>Warunki do sprawdzenia</h2>
            <dl className="facts">
              <Fact label="Placówka / organizacja">{draft.organization}</Fact>
              <Fact label="Miejsce">{draft.place}</Fact>
              <Fact label="Odbiorcy">{draft.audience}</Fact>
              <Fact label="Budżet deklarowany">
                {Number(draft.budget).toLocaleString('pl-PL')} zł · demo
              </Fact>
            </dl>
            <h3>Dostępne zasoby</h3>
            <p>{draft.resources || 'Nie wskazano zasobów.'}</p>
            <h3>Ograniczenia organizacji</h3>
            <p>{draft.constraints || 'Nie wskazano ograniczeń.'}</p>
            <h3>Proponowana kolejność</h3>
            <ol className="timeline">
              <li>
                <strong>Sprawdź odbiorców i ograniczenia</strong>
                <span>{item.limitation}</span>
              </li>
              <li>
                <strong>Ustal zasoby i właściciela</strong>
                <span>Przygotuj materiały oraz osobę odpowiedzialną za prowadzenie.</span>
              </li>
              <li>
                <strong>Zaplanuj krótki pilotaż</strong>
                <span>Określ pytania testowe i sposób zebrania opinii.</span>
              </li>
            </ol>
          </Panel>
          <Notice tone="warning" title="Niewiadome przed decyzją">
            Lokalna dostępność materiałów, koszt, kwalifikacje prowadzących i dopasowanie do
            odbiorców. Wprowadzone {Number(draft.budget).toLocaleString('pl-PL')} zł to deklaracja
            demo, a nie koszt zatwierdzony.
          </Notice>
        </div>
        <aside className="context-aside">
          <h2>Wciąż to samo źródło.</h2>
          <p>{item.title} — biblioteka ROPS.</p>
          <a href={item.url}>
            Otwórz oryginalną kartę
            <Icon name="ArrowSquareOut" size={16} />
          </a>
          <ButtonLink to={`/adaptacje/nowa?innowacja=${item.id}`} secondary>
            Zmień warunki adaptacji
          </ButtonLink>
          <small>
            Ten plan adaptacji wymaga weryfikacji. Pilotaż i budżet zatwierdza administrator.
          </small>
        </aside>
      </div>
    </>
  )
}
function Pilots({ state }: { state: string }) {
  const [filter, setFilter] = useState('Wszystkie')
  return (
    <>
      <Heading
        title="Sprawdźmy pomysły w codzienności."
        description="Pilotaże mają właściciela, plan i zatwierdzone warunki. Znajdź inicjatywę, do której możesz dołączyć."
      />
      <div className="filter-pills section-tabs">
        {['Wszystkie', 'Rekrutacja', 'W testach', 'Ewaluacja'].map((f) => (
          <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      {state === 'pusto' || !['Wszystkie', 'Rekrutacja'].includes(filter) ? (
        <Empty
          title="Brak pilotaży na tym etapie w demo."
          text="Przejdź do rekrutacji, aby obejrzeć przykładową inicjatywę."
          to="/pilotaze"
          action="Pokaż wszystkie"
        />
      ) : (
        <div className="pilot-feature">
          <img
            src={illustrations.people}
            alt="Rysunkowa wizja wspólnego działania, nie dokumentacja pilotażu."
          />
          <div>
            <Badge tone="yellow">Rekrutacja i zasoby · demo</Badge>
            <h2>{pilot.title}</h2>
            <p>{pilot.description}</p>
            <dl className="facts">
              <Fact label="Miejsce">Wieliczka</Fact>
              <Fact label="Szukamy">Wolontariuszy do wsparcia aktywności</Fact>
            </dl>
            <ButtonLink to="/pilotaze/1">Poznaj pilotaż</ButtonLink>
          </div>
        </div>
      )}
      <Notice>
        Wszystkie pilotaże w tym prototypie są syntetyczne. Ilustracje przedstawiają temat, nie
        pokazują faktycznych uczestników.
      </Notice>
    </>
  )
}
const pilotTabs: [string, string][] = [
  ['/pilotaze/1', 'O pilotażu'],
  ['/pilotaze/1/zasoby', 'Zasoby'],
  ['/pilotaze/1/udzial', 'Twój udział'],
  ['/pilotaze/1/ewaluacja', 'Ewaluacja'],
]
function PilotPage({ path, state, notify }: Props) {
  return (
    <>
      <Heading
        title={pilot.title}
        description="Wieliczka · BaWita · inicjatywa demo"
        back="/pilotaze"
      />
      <Tabs items={pilotTabs} active={path} />
      {path.endsWith('/zasoby') ? (
        <Resources notify={notify} />
      ) : path.endsWith('/udzial') ? (
        <Participation state={state} notify={notify} />
      ) : path.endsWith('/ewaluacja') ? (
        <Evaluation state={state} notify={notify} />
      ) : (
        <div className="detail-layout">
          <div className="stack">
            <div className="pilot-photo">
              <img
                src={illustrations.people}
                alt="Dwie seniorki przy roślinach — ilustracja tematu pilotażu."
              />
              <Badge tone="yellow">Rekrutacja i zasoby · demo</Badge>
            </div>
            <Panel>
              <h2>Co chcemy sprawdzić?</h2>
              <p>
                {pilot.description} To przykład lokalnego zastosowania, nie udokumentowany projekt.
              </p>
              <h3>Plan testów · propozycja demo</h3>
              <p>
                Krótka seria spotkań, obserwacja używania narzędzia i opinie odbiorców oraz
                wolontariuszy. Zasady i daty wymagają zatwierdzenia przed startem.
              </p>
              <dl className="facts">
                <Fact label="Właściciel">Koordynator demo</Fact>
                <Fact label="Partner">Placówka wsparcia demo</Fact>
                <Fact label="Źródło rozwiązania">
                  <Link href="/innowacje/bawita">BaWita · biblioteka ROPS</Link>
                </Fact>
              </dl>
            </Panel>
          </div>
          <aside className="context-aside">
            <h2>Możesz pomóc na swój sposób.</h2>
            <p>
              Czas, sprzęt, miejsce lub zadeklarowany budżet — różne zasoby mogą wspierać jeden cel.
            </p>
            <ButtonLink to="/pilotaze/1/udzial">Sprawdź możliwość udziału</ButtonLink>
            <ButtonLink to="/pilotaze/1/zasoby" secondary>
              Poznaj potrzebne zasoby
            </ButtonLink>
            <Notice>
              Start zatwierdza administrator po sprawdzeniu budżetu, właściciela, partnerów, planu i
              uczestników.
            </Notice>
          </aside>
        </div>
      )}
    </>
  )
}
function Resources({ notify }: { notify: Notify }) {
  const [type, setType] = useState('Czas'),
    [saved, setSaved] = useState(false)
  return (
    <div className="detail-layout">
      <div className="stack">
        <Panel>
          <h2>Co jest potrzebne?</h2>
          <div className="resource-row">
            <Icon name="Clock" />
            <div>
              <strong>Czas wolontariuszy</strong>
              <p>Wsparcie podczas aktywności · przykładowo 2 godziny tygodniowo.</p>
            </div>
            <Badge tone="yellow">Szukamy</Badge>
          </div>
          <div className="resource-row">
            <Icon name="House" />
            <div>
              <strong>Spokojna sala</strong>
              <p>Przykładowa deklaracja placówki; wymaga potwierdzenia.</p>
            </div>
            <Badge>Do sprawdzenia</Badge>
          </div>
          <div className="resource-row">
            <Icon name="Gear" />
            <div>
              <strong>Materiały do pracy</strong>
              <p>Zestaw narzędzi i przygotowanie prowadzących.</p>
            </div>
            <Badge tone="yellow">Luka w zasobach</Badge>
          </div>
        </Panel>
        <Panel>
          <h2>Zadeklaruj wsparcie.</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSaved(true)
              notify('Deklaracja zapisana lokalnie w demo. Nie wykonano płatności.')
            }}
          >
            <Field label="Rodzaj zasobu">
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {['Czas', 'Sprzęt', 'Lokal', 'Budżet'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field
              label={type === 'Budżet' ? 'Kwota deklaracji (zł)' : 'Opis deklarowanego zasobu'}
            >
              {type === 'Budżet' ? (
                <input type="number" min="1" required />
              ) : (
                <textarea
                  rows={3}
                  required
                  placeholder="Co możesz udostępnić i w jakim zakresie?"
                />
              )}
            </Field>
            <button className="button">
              Zapisz deklarację
              <Icon name="Check" />
            </button>
          </form>
          {saved && (
            <Notice tone="success">
              Deklaracja wymaga weryfikacji administratora. To demonstracja bez zapisu na serwerze.
            </Notice>
          )}
        </Panel>
      </div>
      <aside className="context-aside">
        <h2>Budżet i deklaracje osobno.</h2>
        <dl>
          <Fact label="Budżet zatwierdzony · demo">4 200 zł</Fact>
          <Fact label="Deklaracje · demo">2 800 zł</Fact>
          <Fact label="Luka · demo">1 400 zł</Fact>
        </dl>
        <p>Deklaracja nie jest wpłatą ani gwarancją dostępności. Nie ma płatności i zbiórek.</p>
        <small>Start pilotażu nadal wymaga ostatecznej decyzji administratora.</small>
      </aside>
    </div>
  )
}
function Participation({ state, notify }: { state: string; notify: Notify }) {
  const [status, setStatus] = useState(
      state === 'kolejka' ? 'waiting' : state === 'oferta' ? 'offer' : 'available',
    ),
    [accepted, setAccepted] = useState(false)
  return (
    <div className="detail-layout">
      <Panel>
        <h2>Wesprzyj aktywności uczestników.</h2>
        <p>
          Pomoc w przygotowaniu sali i spokojnej pracy z narzędziem. Terminy oraz szczegółowe
          zadania w demo są propozycją.
        </p>
        <dl className="facts">
          <Fact label="Miejsce">Placówka demo · Wieliczka</Fact>
          <Fact label="Zaangażowanie">Przykładowo 2 godziny tygodniowo</Fact>
          <Fact label="Limit">6 osób · wariant demonstracyjny</Fact>
        </dl>
        {status === 'available' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setStatus('registered')
              notify('Demo: zgłoszenie udziału zapisane do weryfikacji.')
            }}
          >
            <Field label="Umiejętności / doświadczenie (przykładowe)">
              <textarea
                rows={3}
                placeholder="Opisz doświadczenie bez przesyłania dokumentów."
                required
              />
            </Field>
            <label className="checkbox-line">
              <input
                type="checkbox"
                required
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              Chcę uczestniczyć w tym przykładowym scenariuszu.
            </label>
            <button className="button">
              Zgłoś udział
              <Icon name="ArrowRight" />
            </button>
          </form>
        )}
        {status === 'waiting' && (
          <Notice tone="warning" title="Jesteś na liście oczekujących · demo.">
            Gdy zwolni się miejsce, oferta pojawi się w aplikacji. Kolejność i ważność ofert są
            jeszcze do ustalenia.
          </Notice>
        )}
        {status === 'offer' && (
          <>
            <Notice tone="success" title="Jest dla Ciebie wolne miejsce · demo.">
              Oferta wymaga Twojego potwierdzenia. Samo powiadomienie nie zapisuje Cię
              automatycznie.
            </Notice>
            <button
              className="button"
              onClick={() => {
                setStatus('confirmed')
                notify('Demo: przyjęto ofertę miejsca.')
              }}
            >
              Przyjmuję miejsce
              <Icon name="Check" />
            </button>
          </>
        )}
        {status === 'registered' && (
          <Notice title="Zgłoszenie oczekuje na weryfikację.">
            Administrator potwierdzi wymagane umiejętności. Nie przesyłaj prawdziwych skanów
            dokumentów.
          </Notice>
        )}
        {status === 'confirmed' && (
          <Notice tone="success" title="Udział potwierdzony w demo.">
            Szczegóły pozostają w tym podglądzie. Nie wysłano powiadomień zewnętrznych.
          </Notice>
        )}
        {status !== 'available' && (
          <button
            className="button secondary"
            onClick={() => {
              setStatus('available')
              notify('Demo: zrezygnowano. Miejsce może zostać zaoferowane osobie z kolejki.')
            }}
          >
            Zrezygnuj z udziału / oczekiwania
          </button>
        )}
      </Panel>
      <aside className="context-aside">
        <img src={illustrations.people} alt="" />
        <h2>Warto wiedzieć przed zapisem.</h2>
        <p>
          Wymagane umiejętności potwierdza administrator. Rezygnacja zwalnia miejsce, które można
          zaoferować osobie oczekującej.
        </p>
        <div className="link-list">
          <Link href="/pilotaze/1/udzial?stan=kolejka">
            Zobacz wariant kolejki
            <Icon name="ArrowRight" size={16} />
          </Link>
          <Link href="/pilotaze/1/udzial?stan=oferta">
            Zobacz ofertę miejsca
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
        <small>
          Obsługa konkurujących zapisów i wygaśnięcia ofert należy do przyszłego backendu.
        </small>
      </aside>
    </div>
  )
}
function Evaluation({ state, notify }: { state: string; notify: Notify }) {
  const [score, setScore] = useState(0),
    [saved, setSaved] = useState(false)
  return (
    <div className="detail-layout">
      <Panel>
        <h2>Jak oceniasz doświadczenie?</h2>
        <Notice title="Wariant po testach · konto uprawnionego uczestnika demo">
          Pilotaż bazowy jest w rekrutacji; ten ekran pokazuje odrębny stan ewaluacji po udziale.
          Skala 1–5 jest propozycją do uzgodnienia.
        </Notice>
        {state === 'blokada' ? (
          <Notice tone="warning">
            Ocena jest dostępna dopiero dla uprawnionego beneficjenta lub wolontariusza po etapie
            testów.
          </Notice>
        ) : saved ? (
          <Notice tone="success" title="Dziękujemy za opinię w demo.">
            Satysfakcja jest oddzielona od poparcia. Nie opublikowano żadnej oceny na serwerze.
          </Notice>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!score) {
                notify('Wybierz ocenę satysfakcji.')
                return
              }
              setSaved(true)
              notify('Opinia zapisana lokalnie w demo.')
            }}
          >
            <fieldset className="rating">
              <legend>Satysfakcja z udziału · propozycja skali</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <label className={score === n ? 'selected' : ''} key={n}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={score === n}
                    onChange={() => setScore(n)}
                    required
                  />
                  {n}
                </label>
              ))}
              <small>1 — bardzo niska · 5 — bardzo wysoka</small>
            </fieldset>
            <Field label="Co było pomocne?">
              <textarea rows={3} required />
            </Field>
            <Field label="Co warto poprawić?">
              <textarea rows={3} />
            </Field>
            <button className="button">
              Zapisz opinię
              <Icon name="Check" />
            </button>
          </form>
        )}
      </Panel>
      <aside className="context-aside">
        <h2>Opinie pomagają wyciągnąć wnioski.</h2>
        <p>
          Ocena dotyczy Twojego doświadczenia, nie liczby poparć. Upowszechnienie wymaga osobnej
          decyzji administratora.
        </p>
        <small>
          Uprawnienia, termin i skala docelowej oceny pozostają otwartymi decyzjami produktowymi.
        </small>
      </aside>
    </div>
  )
}
function Notifications({ notify }: { notify: Notify }) {
  const [read, setRead] = useState(false)
  return (
    <>
      <Heading
        title="Ważne sprawy czekają tutaj."
        description="Powiadomienia wewnątrz aplikacji. Bez e-maili i SMS-ów."
        action={
          <button
            className="button secondary"
            onClick={() => {
              setRead(true)
              notify('Powiadomienia oznaczone jako przeczytane w demo.')
            }}
          >
            Oznacz jako przeczytane
          </button>
        }
      />
      <Panel>
        {[
          [
            '/pilotaze/1/udzial?stan=oferta',
            'Czeka na Ciebie wolne miejsce',
            'Przyjmij ofertę udziału w pilotażu Pamięć w dobrych rękach.',
            'Plant',
          ],
          [
            '/pomysly/1',
            'Twój szkic jest gotowy do sprawdzenia',
            'Potwierdź treść przed przekazaniem do administratora.',
            'Lightbulb',
          ],
          [
            '/pomysly/1/dyskusja',
            'Nowy komentarz o Sąsiedzkim stole',
            'Koordynator demo zapytał o miejsce i prowadzącego.',
            'ChatCircle',
          ],
        ].map(([url, title, description, icon]) => (
          <Link className={`notification-row ${read ? 'read' : ''}`} href={url} key={url}>
            <span className="row-icon">
              <Icon name={icon as 'Plant'} size={24} />
            </span>
            <div>
              <Badge tone={read ? 'neutral' : 'green'}>
                {read ? 'Przeczytane' : 'Nowe'} · demo
              </Badge>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        ))}
      </Panel>
    </>
  )
}
function Activities() {
  return (
    <>
      <Heading
        title="Twoje małe kroki. Wspólna sprawa."
        description="Zgłoszenia, szkice i udział zebrane w jednym miejscu. Konto Marta jest syntetyczne."
      />
      <div className="profile-summary">
        <span className="avatar large">MK</span>
        <div>
          <h2>Marta demo</h2>
          <p>Wieliczka · użytkownik · konto przykładowe</p>
        </div>
        <ButtonLink to="/logowanie" secondary>
          Zmień profil
        </ButtonLink>
      </div>
      <div className="activity-links">
        {[
          [
            '/zgloszenia',
            'Twoje zgłoszenia',
            'Codzienne aktywności dla osób z demencją',
            'ClipboardText',
          ],
          ['/pomysly', 'Twoje pomysły', 'Sąsiedzki stół · szkic prywatny', 'Lightbulb'],
          [
            '/poparcie',
            'Twoje poparcie',
            'Wybierz propozycję i sprawdź możliwość cofnięcia',
            'Heart',
          ],
          [
            '/pilotaze/1/udzial?stan=kolejka',
            'Twój udział',
            'Pamięć w dobrych rękach · lista oczekujących',
            'Plant',
          ],
          ['/adaptacje/1', 'Twoje adaptacje', 'BaWita · robocze warunki placówki', 'Books'],
        ].map(([url, title, text, icon]) => (
          <Link key={url} href={url} className="activity-row">
            <span className="row-icon">
              <Icon name={icon as 'Books'} size={28} />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        ))}
      </div>
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
            <ButtonLink to="/pomysly/nowy" secondary>
              Rozwijaj pomysł
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
