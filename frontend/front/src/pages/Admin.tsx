import { useState, type ReactNode } from 'react'
import { idea, innovations, needs, pilot, reportText } from '../data'
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

export function Admin({ path, state, notify }: Props) {
  if (path === '/admin') return <Overview />
  if (path === '/admin/zgloszenia') return <Queue kind="reports" state={state} />
  if (path.startsWith('/admin/zgloszenia/')) return <ModerateReport notify={notify} />
  if (path === '/admin/potrzeby') return <Queue kind="needs" state={state} />
  if (path.startsWith('/admin/potrzeby/')) return <Grouping notify={notify} />
  if (path === '/admin/innowacje') return <Knowledge state={state} />
  if (path.startsWith('/admin/innowacje/')) return <KnowledgeEdit notify={notify} />
  if (path === '/admin/rozwiazania/duplikaty') return <Duplicates notify={notify} />
  if (path === '/admin/pomysly') return <Queue kind="ideas" state={state} />
  if (path.startsWith('/admin/pomysly/')) return <ModerateIdea state={state} notify={notify} />
  if (path === '/admin/pilotaze') return <Queue kind="pilots" state={state} />
  if (path.endsWith('/budzet')) return <Budget notify={notify} />
  if (path.endsWith('/uczestnicy')) return <Participants notify={notify} />
  if (path.startsWith('/admin/pilotaze/')) return <PilotAdmin state={state} notify={notify} />
  return (
    <Empty
      title="Nieznana ścieżka administratora."
      text="Sprawdź adres albo wróć do panelu administratora."
      to="/admin"
      action="Wróć do panelu"
    />
  )
}
function Overview() {
  return (
    <>
      <Heading
        title="Dobre decyzje potrzebują kontekstu."
        description="Wybierz sprawę, sprawdź źródła i podejmij uzasadnioną decyzję. Dane poniżej są syntetyczne."
      />
      <div className="admin-queues">
        {[
          ['/admin/zgloszenia', 'Zgłoszenia do oceny', '3', 'Tray'],
          ['/admin/pomysly', 'Pomysły po potwierdzeniu autora', '2', 'Lightbulb'],
          ['/admin/pilotaze', 'Pilotaż przed startem', '1', 'Plant'],
        ].map(([url, title, count, icon]) => (
          <Link href={url} key={url}>
            <Icon name={icon as 'Plant'} size={26} />
            <strong>{count}</strong>
            <h2>{title}</h2>
            <span>
              Sprawdź kolejkę
              <Icon name="ArrowRight" size={17} />
            </span>
          </Link>
        ))}
      </div>
      <section>
        <div className="section-heading">
          <h2>Najbliższe decyzje</h2>
          <Badge tone="neutral">Przykładowe kolejki</Badge>
        </div>
        <Panel>
          <Link href="/admin/pomysly/1" className="activity-row">
            <span className="row-icon lavender">
              <Icon name="Lightbulb" size={26} />
            </span>
            <div>
              <Badge tone="yellow">Gotowy do oceny</Badge>
              <h3>Sąsiedzki stół</h3>
              <p>AI w scenariuszu demo zakończone · autor potwierdził.</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
          <Link href="/admin/pilotaze/1" className="activity-row">
            <span className="row-icon">
              <Icon name="Plant" size={26} />
            </span>
            <div>
              <Badge tone="yellow">Brakuje warunków startu</Badge>
              <h3>{pilot.title}</h3>
              <p>Potwierdź partnera i domknięcie zasobów.</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
          <Link href="/admin/potrzeby/1" className="activity-row">
            <span className="row-icon blue">
              <Icon name="Intersect" size={26} />
            </span>
            <div>
              <Badge tone="blue">Sugestia grupowania</Badge>
              <h3>Dwie podobne potrzeby w okolicy Wieliczki</h3>
              <p>Najpierw sprawdź skutki dla powiązań i liczników.</p>
            </div>
            <Icon name="ArrowRight" />
          </Link>
        </Panel>
      </section>
      <Notice>
        AI podpowiada; administrator podejmuje decyzję. Liczby nie opisują realnych mieszkańców ani
        wyników inicjatywy.
      </Notice>
    </>
  )
}
type QueueKind = 'reports' | 'needs' | 'ideas' | 'pilots'
const queueConfig = {
  reports: {
    title: 'Zgłoszenia do spokojnej oceny.',
    description: 'Oryginał, podpowiedzi AI i kontekst miejsca rozpatruj razem.',
    base: '/admin/zgloszenia',
    columns: ['Sprawa', 'Miejsce / autor', 'Etap', 'Data'],
  },
  needs: {
    title: 'Podobne sprawy. Świadome powiązania.',
    description: 'Grupowanie nie może zgubić zgłoszeń ani podwójnie liczyć tej samej osoby.',
    base: '/admin/potrzeby',
    columns: ['Potrzeba', 'Obszar', 'Zgłaszający', 'Stan'],
  },
  ideas: {
    title: 'Pomysły gotowe do Twojej decyzji.',
    description: 'Publikacja wymaga zakończonego AI i potwierdzenia autora.',
    base: '/admin/pomysly',
    columns: ['Pomysł', 'Autor', 'Bramki publikacji', 'Stan'],
  },
  pilots: {
    title: 'Pilotaże pod opieką administratora.',
    description: 'Etap, kompletność warunków i odpowiedzialność pozostają widoczne.',
    base: '/admin/pilotaze',
    columns: ['Pilotaż', 'Właściciel', 'Warunki', 'Etap'],
  },
}
function Queue({ kind, state }: { kind: QueueKind; state: string }) {
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('Wszystkie'),
    config = queueConfig[kind]
  const rows: { id: string; name: string; sub: string; values: ReactNode[]; status: string }[] =
    kind === 'reports'
      ? [
          {
            id: '1',
            name: 'Aktywności pamięciowe dla osób z demencją',
            sub: 'Zgłoszenie MBG-001',
            values: [
              'Wieliczka · Marta demo',
              <Badge key="queue-status-1" tone="yellow">
                Do oceny
              </Badge>,
              '03.10.2026',
            ],
            status: 'Do oceny',
          },
          {
            id: '1',
            name: 'Spotkania sąsiedzkie',
            sub: 'Przykład zgłoszenia do korekty',
            values: [
              'Wieliczka · autor demo',
              <Badge key="queue-status-2" tone="blue">
                Do wyjaśnienia
              </Badge>,
              '02.10.2026',
            ],
            status: 'Do wyjaśnienia',
          },
          {
            id: '1',
            name: 'Uzupełnienie kontekstu potrzeby',
            sub: 'Powtórne zgłoszenie · deduplikacja autora',
            values: [
              'Wieliczka · Marta demo',
              <Badge key="queue-status-3" tone="yellow">
                Do oceny
              </Badge>,
              '01.10.2026',
            ],
            status: 'Do oceny',
          },
        ]
      : kind === 'needs'
        ? needs.map((n) => ({
            id: '1',
            name: n.title,
            sub: n.category,
            values: [n.place, `${n.people} · demo`, <Badge key="queue-status-4">{n.status}</Badge>],
            status: 'Do oceny',
          }))
        : kind === 'ideas'
          ? [
              {
                id: '1',
                name: 'Sąsiedzki stół',
                sub: 'Lokalne spotkania · demo',
                values: [
                  'Marta demo',
                  <Badge key="queue-status-5">AI + autor: gotowe</Badge>,
                  <Badge key="queue-status-6" tone="yellow">
                    Do oceny
                  </Badge>,
                ],
                status: 'Do oceny',
              },
              {
                id: '1?stan=kolejka',
                name: 'Drugi szkic · stan oczekiwania',
                sub: 'Prywatny, nie kwalifikuje się do publikacji',
                values: [
                  'Autor demo',
                  <Badge key="queue-status-7" tone="yellow">
                    AI: oczekuje
                  </Badge>,
                  <Badge key="queue-status-8" tone="blue">
                    Do wyjaśnienia
                  </Badge>,
                ],
                status: 'Do wyjaśnienia',
              },
            ]
          : [
              {
                id: '1',
                name: pilot.title,
                sub: 'Wieliczka · BaWita · demo',
                values: [
                  pilot.owner,
                  <Badge key="queue-status-9" tone="yellow">
                    Niekompletne
                  </Badge>,
                  <Badge key="queue-status-10">Rekrutacja i zasoby</Badge>,
                ],
                status: 'Do oceny',
              },
            ]
  const filtered = rows.filter(
    (r) =>
      r.name.toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl')) &&
      (filter === 'Wszystkie' || r.status === filter),
  )
  return (
    <>
      <Heading title={config.title} description={config.description} />
      <div className="toolbar">
        <label className="search">
          <Icon name="MagnifyingGlass" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w kolejce"
            aria-label="Szukaj w kolejce"
          />
        </label>
        <Field label="Stan sprawy">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>Wszystkie</option>
            <option>Do oceny</option>
            <option>Do wyjaśnienia</option>
          </select>
        </Field>
      </div>
      {state === 'pusto' || !filtered.length ? (
        <Empty
          title="W tej kolejce nie ma spraw."
          text="Zmień filtr lub wróć do pulpitu administratora."
          to="/admin"
          action="Pulpit administratora"
        />
      ) : (
        <div className="table-wrap">
          <table>
            <caption>{config.title} Dane demo.</caption>
            <thead>
              <tr>
                {config.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
                <th scope="col">Działanie</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={index}>
                  <td>
                    <Link href={`${config.base}/${row.id}`}>
                      <strong>{row.name}</strong>
                    </Link>
                    <small>{row.sub}</small>
                  </td>
                  {row.values.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                  <td>
                    <Link
                      className="table-open"
                      href={`${config.base}/${row.id}`}
                      aria-label={`Otwórz: ${row.name}`}
                    >
                      <Icon name="ArrowRight" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Notice>
        To syntetyczna kolejka do przeglądu projektu. Powiązane szczegóły są reprezentatywnym
        scenariuszem demo.
      </Notice>
    </>
  )
}
function Decision({
  notify,
  eligible = true,
  label = 'Zatwierdź w demo',
}: {
  notify: Notify
  eligible?: boolean
  label?: string
}) {
  const [reason, setReason] = useState(''),
    [decision, setDecision] = useState('')
  return (
    <Panel className="decision-panel">
      <h2>Decyzja administratora</h2>
      <Field label="Uzasadnienie" hint="Wpisz krótkie uzasadnienie dla autora i historii decyzji.">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} required />
      </Field>
      {decision ? (
        <Notice tone="success" title="Decyzja zapisana w tym widoku.">
          {decision}
          <p>{reason}</p>
        </Notice>
      ) : (
        <div className="stack">
          <button
            className="button"
            disabled={!eligible || !reason.trim()}
            onClick={() => {
              setDecision('Zatwierdzono w scenariuszu demo.')
              notify('Decyzja lokalna: zatwierdzono. Nie wykonano operacji na serwerze.')
            }}
          >
            <Icon name="Check" />
            {label}
          </button>
          <button
            className="button secondary"
            disabled={!reason.trim()}
            onClick={() => {
              setDecision('Zwrócono do poprawy w scenariuszu demo.')
              notify('Decyzja lokalna: zwrot do poprawy z uzasadnieniem.')
            }}
          >
            Zwróć do poprawy
          </button>
        </div>
      )}
      {!eligible && (
        <small>Warunki publikacji nie są spełnione. Zatwierdzenie pozostaje zablokowane.</small>
      )}
    </Panel>
  )
}
function ModerateReport({ notify }: { notify: Notify }) {
  return (
    <>
      <Heading
        title="Zgłoszenie MBG-001."
        description="Wieliczka · Marta demo · 3 października 2026"
        back="/admin/zgloszenia"
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <Badge tone="yellow">Do oceny · demo</Badge>
            <h2>Oryginalny opis autora</h2>
            <p>{reportText}</p>
            <dl className="facts">
              <Fact label="Tożsamość syntetyczna">Marta demo · konto użytkownika</Fact>
              <Fact label="Prezentacja innym">Autor ukryty</Fact>
            </dl>
          </Panel>
          <Panel>
            <h2>Podsumowanie AI · odrębna warstwa</h2>
            <Badge tone="blue">Symulacja podpowiedzi</Badge>
            <p>
              Potrzeba narzędzi do codziennych aktywności pamięciowych i manualnych, odpowiednich
              dla osoby z wczesnym stadium demencji.
            </p>
            <dl className="facts">
              <Fact label="Kategorie">Dla seniorów · Zdrowie</Fact>
              <Fact label="Pilność · szacunek">Zwykła</Fact>
              <Fact label="Powiązanie">Użytkownik potwierdził potrzebę nr 1</Fact>
            </dl>
            <Link href="/admin/potrzeby/1">
              Sprawdź grupowanie
              <Icon name="ArrowRight" size={17} />
            </Link>
          </Panel>
          <Notice>
            Nowa potrzeba jest widoczna przed późniejszą moderacją. Zachowaj rozróżnienie
            oryginalnego zgłoszenia i tekstu wygenerowanego.
          </Notice>
        </div>
        <Decision notify={notify} label="Potwierdź ocenę zgłoszenia" />
      </div>
    </>
  )
}
function Grouping({ notify }: { notify: Notify }) {
  const [mode, setMode] = useState('Scalanie'),
    [preview, setPreview] = useState(false),
    [done, setDone] = useState(false)
  return (
    <>
      <Heading
        title="Dwie potrzeby. Sprawdź, czy jedna sprawa."
        description="Powiązania i liczniki muszą pozostać spójne po zmianie. Wszystkie liczby są syntetyczne."
        back="/admin/potrzeby"
      />
      <div className="segmented section-tabs">
        {['Scalanie', 'Rozdzielanie'].map((m) => (
          <button
            key={m}
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m)
              setPreview(false)
            }}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="comparison-grid">
        <Panel>
          <Badge>Potrzeba A</Badge>
          <h2>{needs[0].title}</h2>
          <p>Wieliczka · 18 unikalnych osób w demo</p>
          <p>{needs[0].description}</p>
        </Panel>
        <Panel>
          <Badge tone="blue">Potrzeba B · kandydat demo</Badge>
          <h2>Narzędzia pamięciowe w placówce dziennego wsparcia.</h2>
          <p>Okolice Wieliczki · 6 unikalnych osób w demo</p>
          <p>
            Podobny obszar tematyczny, ale należy sprawdzić grupę odbiorców i różnice między opieką
            domową a placówką.
          </p>
        </Panel>
      </div>
      <Panel>
        <h2>{mode === 'Scalanie' ? 'Podgląd scalenia' : 'Wybór zgłoszeń do odłączenia'}</h2>
        {mode === 'Rozdzielanie' && (
          <fieldset className="checklist">
            <legend>Przykładowe powiązania</legend>
            <label>
              <input type="checkbox" />
              Zgłoszenie MBG-003 · dotyczy wyłącznie placówki demo
            </label>
            <label>
              <input type="checkbox" />
              Zgłoszenie MBG-004 · wymagania organizacyjne demo
            </label>
          </fieldset>
        )}
        <Field label="Uzasadnienie operacji">
          <textarea rows={3} placeholder="Wyjaśnij zgodność lub różnicę kontekstu." />
        </Field>
        <button className="button secondary" onClick={() => setPreview(true)}>
          Sprawdź skutki przed decyzją
          <Icon name="ArrowRight" />
        </button>
        {preview && (
          <div className="operation-preview">
            <h3>Zmiany w scenariuszu demo</h3>
            <dl className="facts">
              <Fact label="Zgłaszający">
                {mode === 'Scalanie'
                  ? '18 + 6 − 2 wspólne osoby = 22'
                  : 'Dwa wybrane zgłoszenia utworzą odrębną potrzebę'}
              </Fact>
              <Fact label="Zgłoszenia">Oryginały pozostają zachowane</Fact>
              <Fact label="Poparcie i pilotaże">Wymagają rozstrzygnięcia powiązań</Fact>
            </dl>
            <Notice tone="warning">
              Zasady przenoszenia głosów i deduplikacji po zmianie są otwarte w README. Ten podgląd
              nie ustala kontraktu backendu.
            </Notice>
            <button
              className="button"
              disabled={done}
              onClick={() => {
                setDone(true)
                notify(
                  'Demo: zakończono podgląd decyzji o grupowaniu. Bez mutacji danych rzeczywistych.',
                )
              }}
            >
              {done ? 'Decyzja pokazana w demo' : 'Potwierdź decyzję pokazową'}
              <Icon name="Check" />
            </button>
          </div>
        )}
      </Panel>
    </>
  )
}
function Knowledge({ state }: { state: string }) {
  const [query, setQuery] = useState('')
  return (
    <>
      <Heading
        title="Baza wiedzy ze śladem pochodzenia."
        description="Treści źródłowe, metadane i braki pozostają rozróżnione. Tymczasowy błąd pobierania nie usuwa ostatniej dobrej kopii."
      />
      <label className="search wide-search">
        <Icon name="MagnifyingGlass" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj w bazie wiedzy"
          aria-label="Szukaj w bazie wiedzy"
        />
      </label>
      {state === 'pusto' ? (
        <Empty title="Brak źródeł w aktywnym filtrze." to="/admin/innowacje" action="Pokaż bazę" />
      ) : (
        <div className="table-wrap">
          <table>
            <caption>Innowacje w bazie wiedzy.</caption>
            <thead>
              <tr>
                <th>Innowacja</th>
                <th>Pochodzenie</th>
                <th>Kompletność</th>
                <th>Indeks</th>
                <th>Działanie</th>
              </tr>
            </thead>
            <tbody>
              {innovations
                .filter((i) =>
                  i.title.toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl')),
                )
                .map((i) => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.title}</strong>
                      <small>{i.category}</small>
                    </td>
                    <td>
                      Biblioteka ROPS<small>{i.file}</small>
                    </td>
                    <td>
                      <Badge tone="yellow">Koszt: brak danych</Badge>
                    </td>
                    <td>
                      <Badge tone="blue">Indeks niepodłączony</Badge>
                    </td>
                    <td>
                      <Link
                        href="/admin/innowacje/bawita"
                        className="table-open"
                        aria-label={`Otwórz redakcję: ${i.title}`}
                      >
                        <Icon name="ArrowRight" />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      <Notice>
        Opis pochodzi z repozytorium. Stan indeksowania jest wizualnym scenariuszem, bez
        uruchomionego modelu embeddingów.
      </Notice>
    </>
  )
}
function KnowledgeEdit({ notify }: { notify: Notify }) {
  const [availability, setAvailability] = useState('Dostępne'),
    [saved, setSaved] = useState(false)
  return (
    <>
      <Heading
        title="BaWita · karta źródłowa."
        description="Zachowaj pochodzenie i nie uzupełniaj brakujących danych domysłami."
        back="/admin/innowacje"
      />
      <div className="detail-layout">
        <Panel>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSaved(true)
              notify('Zmiany karty zachowane lokalnie w demo.')
            }}
          >
            <h2>Metadane i opis</h2>
            <Field label="Nazwa">
              <input defaultValue="BaWita" required />
            </Field>
            <Field label="Opis źródłowy">
              <textarea rows={5} defaultValue={innovations[0].description} />
            </Field>
            <Field label="Adres źródła">
              <input type="url" defaultValue={innovations[0].url} required />
            </Field>
            <div className="form-grid">
              <Field label="Koszt">
                <input placeholder="Brak danych w źródle" />
              </Field>
              <Field label="Dostępność źródła">
                <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option>Dostępne</option>
                  <option>Tymczasowy błąd</option>
                  <option>Usunięcie potwierdzone</option>
                </select>
              </Field>
            </div>
            {availability === 'Tymczasowy błąd' && (
              <Notice>
                Zachowujemy ostatnią dobrą kopię. Timeout nie oznacza usunięcia źródła.
              </Notice>
            )}
            {availability === 'Usunięcie potwierdzone' && (
              <Notice tone="warning">
                Wstrzymaj aktywne indeksowanie po potwierdzeniu usunięcia. Postępowanie z
                powiązanymi głosami i pilotażami wymaga decyzji produktowej.
              </Notice>
            )}
            <button className="button">
              Zapisz zmianę pokazową
              <Icon name="Check" />
            </button>
            {saved && <Badge>Zapisano w widoku demo</Badge>}
          </form>
        </Panel>
        <aside className="context-aside">
          <h2>Pochodzenie</h2>
          <dl>
            <Fact label="Plik">backend/data/bawita.md</Fact>
            <Fact label="Dostawca">ROPS w Krakowie</Fact>
            <Fact label="Materiały">PDF / archiwum / film — linki niezweryfikowane</Fact>
            <Fact label="Embeddingi">Lokalny Nomic / Ollama — planowane</Fact>
          </dl>
          <a href={innovations[0].url}>
            Otwórz źródło
            <Icon name="ArrowSquareOut" size={16} />
          </a>
        </aside>
      </div>
    </>
  )
}
function Duplicates({ notify }: { notify: Notify }) {
  const [decision, setDecision] = useState('')
  return (
    <>
      <Heading
        title="Podobne nie zawsze znaczy to samo."
        description="Sugestia AI jest początkiem przeglądu. Sprawdź odbiorców, lokalną potrzebę, zakres i powiązania."
      />
      <Notice>
        Syntetyczny przykład: dwa pomysły na spotkania sąsiedzkie. Nie jest to realny wynik
        detektora duplikatów.
      </Notice>
      <div className="comparison-grid">
        {[
          ['A', 'Sąsiedzki stół', 'Wspólne aktywności dla mieszkańców blisko domu.', '24'],
          ['B', 'Rozmowy przy stole', 'Jednorazowe spotkanie dla nowych mieszkańców.', '8'],
        ].map(([id, title, text, count]) => (
          <Panel key={id}>
            <Badge tone={id === 'A' ? 'green' : 'blue'}>Propozycja {id} · demo</Badge>
            <h2>{title}</h2>
            <p>{text}</p>
            <dl>
              <Fact label="Potrzeba lokalna">Spotkania sąsiedzkie · Wieliczka</Fact>
              <Fact label="Poparcie">{count} · dane demo</Fact>
              <Fact label="Pilotaż">Brak aktywnego pilotażu</Fact>
            </dl>
          </Panel>
        ))}
      </div>
      <Panel>
        <h2>Najpierw różnice, potem decyzja.</h2>
        <p>
          Stały program i jednorazowe spotkanie mogą odpowiadać na inne oczekiwania. Przenoszenie
          głosów wymaga deduplikacji dla konkretnej potrzeby.
        </p>
        <Field label="Uzasadnienie">
          <textarea rows={3} placeholder="Dlaczego to duplikat lub odrębne rozwiązanie?" />
        </Field>
        <div className="actions">
          <button
            className="button secondary"
            onClick={() => {
              setDecision('Zachowano dwie odrębne propozycje w demo.')
              notify('Pokazowa decyzja: propozycje odrębne.')
            }}
          >
            Zachowaj odrębne
          </button>
          <button
            className="button"
            onClick={() => {
              setDecision(
                'Podgląd scalenia: 24 + 8 − 3 wspólne głosy = 29. Przykładowa arytmetyka, nie uzgodniona reguła backendu.',
              )
              notify('Przygotowano pokazowy podgląd skutków.')
            }}
          >
            Pokaż skutki scalenia
            <Icon name="ArrowRight" />
          </button>
        </div>
        {decision && <Notice title="Podgląd decyzji">{decision}</Notice>}
      </Panel>
    </>
  )
}
function ModerateIdea({ state, notify }: { state: string; notify: Notify }) {
  const eligible = state !== 'kolejka'
  return (
    <>
      <Heading
        title="Sąsiedzki stół · decyzja o publikacji."
        description="Pomysł i autor są przykładowi. Akceptacja dopuszcza poparcie, nie rozpoczyna pilotażu."
        back="/admin/pomysly"
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <h2>Bramki publikacji</h2>
            <div className="gate-row">
              <Icon name={eligible ? 'CheckCircle' : 'Clock'} />
              <strong>Redakcja AI</strong>
              <Badge tone={eligible ? 'green' : 'yellow'}>
                {eligible ? 'Zakończona w demo' : 'Oczekuje'}
              </Badge>
            </div>
            <div className="gate-row">
              <Icon name={eligible ? 'CheckCircle' : 'Clock'} />
              <strong>Potwierdzenie autora</strong>
              <Badge tone={eligible ? 'green' : 'yellow'}>
                {eligible ? 'Potwierdzono w demo' : 'Niedostępne przed AI'}
              </Badge>
            </div>
          </Panel>
          <Panel>
            <h2>Treść po redakcji · demo</h2>
            <p>{idea.description}</p>
            <h3>Oryginał autora · przykład</h3>
            <p>
              Chcemy organizować regularne spotkania sąsiadów w sali blisko domu, z krótkimi
              wspólnymi aktywnościami.
            </p>
            <h3>Źródła i niewiadome</h3>
            <p>
              Nowy pomysł autora, bez dowodów testów. Dostępność sali i prowadzącego wymaga
              potwierdzenia. Koszt nie jest zatwierdzony.
            </p>
          </Panel>
          <Notice tone="warning">
            Szkic wymaga potwierdzenia autora i kompletnej oceny przed publikacją.
          </Notice>
        </div>
        <Decision notify={notify} eligible={eligible} label="Zatwierdź do poparcia w demo" />
      </div>
    </>
  )
}
const adminPilotTabs: [string, string][] = [
  ['/admin/pilotaze/1', 'Etapy i gotowość'],
  ['/admin/pilotaze/1/budzet', 'Budżet'],
  ['/admin/pilotaze/1/uczestnicy', 'Uczestnicy'],
]
function PilotAdmin({ state, notify }: { state: string; notify: Notify }) {
  const gates = [
      'Zatwierdzony budżet',
      'Odpowiedzialny właściciel',
      'Wymagani partnerzy',
      'Plan testów',
      'Wystarczająca liczba uczestników',
      'Potwierdzone zasoby',
    ],
    [checked, setChecked] = useState(
      state === 'blokada'
        ? ['Odpowiedzialny właściciel']
        : ['Zatwierdzony budżet', 'Odpowiedzialny właściciel', 'Plan testów'],
    ),
    [stage, setStage] = useState('Rekrutacja / zasoby')
  const ready = checked.length === gates.length
  return (
    <>
      <Heading
        title={pilot.title}
        description="Prowadzenie pilotażu · Wieliczka · scenariusz demo"
        back="/admin/pilotaze"
      />
      <Tabs items={adminPilotTabs} active="/admin/pilotaze/1" />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <h2>Aktualny etap</h2>
            <Badge tone="yellow">{stage} · demo</Badge>
            <ol className="lifecycle">
              {[
                'Szkic',
                'Ocena',
                'Rekrutacja / zasoby',
                'Pilotaż',
                'Ewaluacja',
                'Upowszechnienie',
              ].map((s) => (
                <li className={stage === s ? 'current' : ''} key={s}>
                  {s}
                </li>
              ))}
            </ol>
            <p>
              Rekrutacja i zbieranie zasobów mogą trwać równolegle. Każda bramka wymaga uzasadnionej
              decyzji.
            </p>
          </Panel>
          <Panel>
            <h2>Warunki przed startem</h2>
            <fieldset className="checklist">
              <legend>Potwierdź dokumenty i zasoby w scenariuszu demo</legend>
              {gates.map((g) => (
                <label className={checked.includes(g) ? 'done' : ''} key={g}>
                  <input
                    type="checkbox"
                    checked={checked.includes(g)}
                    onChange={() =>
                      setChecked(
                        checked.includes(g) ? checked.filter((c) => c !== g) : [...checked, g],
                      )
                    }
                  />
                  <span>{g}</span>
                  <Badge tone={checked.includes(g) ? 'green' : 'yellow'}>
                    {checked.includes(g) ? 'Potwierdzone' : 'Brakuje'}
                  </Badge>
                </label>
              ))}
            </fieldset>
            <Notice
              tone={ready ? 'success' : 'warning'}
              title={ready ? 'Warunki zaznaczone w demo.' : 'Start jest zablokowany.'}
            >
              {ready
                ? 'Ostateczna decyzja nadal należy do administratora.'
                : 'Uzupełnij brakujące warunki. Poparcie społeczności samo nie uruchamia testów.'}
            </Notice>
            <button
              className="button"
              disabled={!ready || stage === 'Pilotaż'}
              onClick={() => {
                setStage('Pilotaż')
                notify('Demo: administrator zatwierdził start po wszystkich warunkach.')
              }}
            >
              Zatwierdź start pilotażu
              <Icon name="Plant" />
            </button>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Dalsze decyzje</h2>
          <Field label="Uzasadnienie zmiany etapu">
            <textarea rows={3} defaultValue="Pokazowy scenariusz administratora." />
          </Field>
          <div className="stack">
            <button
              className="button secondary"
              onClick={() => {
                setStage('Niedostępny')
                notify('Demo: inicjatywa oznaczona jako niedostępna.')
              }}
            >
              Oznacz niedostępność
            </button>
            <button
              className="button secondary"
              disabled={stage !== 'Pilotaż'}
              onClick={() => {
                setStage('Ewaluacja')
                notify('Demo: otwarto ewaluację po testach.')
              }}
            >
              Przejdź do ewaluacji
            </button>
            <button
              className="button secondary"
              disabled={stage !== 'Ewaluacja'}
              onClick={() => {
                setStage('Upowszechnienie')
                notify('Demo: zatwierdzono upowszechnienie po ewaluacji.')
              }}
            >
              Zatwierdź upowszechnienie
            </button>
          </div>
          <small>
            Potwierdzenia w UI są demonstracją. Docelowe warunki, role i transakcje muszą zostać
            zweryfikowane przez backend.
          </small>
        </aside>
      </div>
    </>
  )
}
function Budget({ notify }: { notify: Notify }) {
  const [costs, setCosts] = useState([1800, 1200, 600, 600]),
    [approved, setApproved] = useState(false),
    total = costs.reduce((a, b) => a + b, 0)
  const invalid = costs.some((c) => !Number.isFinite(c) || c < 0)
  return (
    <>
      <Heading
        title="Budżet, który można sprawdzić."
        description={`${pilot.title} · kwoty i pozycje syntetyczne`}
        back="/admin/pilotaze"
      />
      <Tabs items={adminPilotTabs} active="/admin/pilotaze/1/budzet" />
      <div className="detail-layout">
        <Panel>
          <h2>Przygotowany kosztorys · demo</h2>
          <div className="budget-lines">
            {[
              'Materiały i narzędzia',
              'Przygotowanie prowadzących',
              'Sala i wyposażenie',
              'Koordynacja testów',
            ].map((label, i) => (
              <Field label={label} key={label}>
                <input
                  type="number"
                  min="0"
                  value={costs[i]}
                  aria-invalid={!Number.isFinite(costs[i]) || costs[i] < 0}
                  aria-describedby={costs[i] < 0 ? 'budget-error' : undefined}
                  onChange={(e) => {
                    setCosts(costs.map((c, index) => (index === i ? +e.target.value : c)))
                    setApproved(false)
                  }}
                />
              </Field>
            ))}
          </div>
          {invalid && (
            <div id="budget-error">
              <Notice tone="error">
                Każda pozycja kosztorysu musi być liczbą nieujemną. Popraw zaznaczoną pozycję przed
                zatwierdzeniem.
              </Notice>
            </div>
          )}
          <div className="budget-total">
            <span>Przygotowany budżet</span>
            <strong>{total.toLocaleString('pl-PL')} zł</strong>
          </div>
          <Field label="Uzasadnienie zatwierdzenia">
            <textarea
              rows={3}
              defaultValue="Kosztorys przykładowy; zgodność zakresu do sprawdzenia w scenariuszu demo."
            />
          </Field>
          <button
            className="button"
            disabled={approved || invalid || total <= 0}
            onClick={() => {
              if (invalid || total <= 0) return
              setApproved(true)
              notify('Demo: zatwierdzono przygotowany budżet. Brak płatności.')
            }}
          >
            {approved ? 'Budżet zatwierdzony w demo' : 'Zatwierdź przygotowany budżet'}
            <Icon name="Check" />
          </button>
        </Panel>
        <aside className="context-aside">
          <h2>Trzy różne informacje.</h2>
          <dl>
            <Fact label="Szacunek AI · demo">5 200 zł · wstępny i niezatwierdzony</Fact>
            <Fact label="Koszt przygotowany">{total.toLocaleString('pl-PL')} zł</Fact>
            <Fact label="Deklaracje zasobów · demo">2 800 zł · nie wpłaty</Fact>
            <Fact label="Luka do domknięcia">
              {Math.max(0, total - 2800).toLocaleString('pl-PL')} zł · przykład
            </Fact>
          </dl>
          <Notice>
            Zatwierdzony koszt nie potwierdza zebrania zasobów. Start wymaga także pozostałych
            warunków.
          </Notice>
        </aside>
      </div>
    </>
  )
}
function Participants({ notify }: { notify: Notify }) {
  const [offer, setOffer] = useState(false),
    [verified, setVerified] = useState(false)
  return (
    <>
      <Heading
        title="Miejsca i ludzie. Bez automatycznych obietnic."
        description={`${pilot.title} · syntetyczni uczestnicy i dowody umiejętności`}
        back="/admin/pilotaze"
      />
      <Tabs items={adminPilotTabs} active="/admin/pilotaze/1/uczestnicy" />
      <Panel>
        <h2>Zapisy i umiejętności</h2>
        <div className="table-wrap">
          <table>
            <caption>Uczestnicy demo.</caption>
            <thead>
              <tr>
                <th>Osoba</th>
                <th>Status</th>
                <th>Umiejętności</th>
                <th>Działanie</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Marta demo</td>
                <td>
                  <Badge tone="yellow">Do weryfikacji</Badge>
                </td>
                <td>
                  {verified ? 'Potwierdzone w demo' : 'Opis doświadczenia · dane syntetyczne'}
                </td>
                <td>
                  <button
                    className="button secondary"
                    disabled={verified}
                    onClick={() => {
                      setVerified(true)
                      notify(
                        'Umiejętności potwierdzone pokazowo. Nie sprawdzano dokumentów rzeczywistych.',
                      )
                    }}
                  >
                    {verified ? 'Potwierdzono' : 'Potwierdź w demo'}
                  </button>
                </td>
              </tr>
              <tr>
                <td>Wolontariusz demo B</td>
                <td>
                  <Badge>Udział potwierdzony</Badge>
                </td>
                <td>Potwierdzone · scenariusz</td>
                <td>
                  <Badge tone="neutral">Miejsce zajęte</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel>
        <h2>Lista oczekujących</h2>
        <div className="waitlist-item">
          <span className="avatar">C</span>
          <div>
            <strong>Wolontariusz demo C</strong>
            <p>{offer ? 'Oczekuje na przyjęcie oferty' : 'Gotowy do otrzymania oferty miejsca'}</p>
          </div>
          <button
            className="button"
            disabled={offer}
            onClick={() => {
              setOffer(true)
              notify('Demo: zaoferowano wolne miejsce. Uczestnik musi je przyjąć.')
            }}
          >
            {offer ? 'Oferta pokazana w demo' : 'Zaoferuj wolne miejsce'}
            <Icon name="ArrowRight" />
          </button>
        </div>
        <Notice>
          Ręczna promocja przygotowuje ofertę, którą uczestnik przyjmuje w aplikacji. Kolejność,
          wygaśnięcie i konkurujące akceptacje wymagają kontraktu backendu.
        </Notice>
        <ButtonLink to="/pilotaze/1/udzial?stan=oferta" secondary>
          Podgląd oferty dla uczestnika
        </ButtonLink>
      </Panel>
    </>
  )
}
