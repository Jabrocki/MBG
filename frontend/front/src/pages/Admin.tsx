import { useEffect, useState, type FormEvent } from 'react'
import { navigate } from '../navigation'
import {
  api,
  type AdminCatalogueInput,
  type AdminDashboardCounts,
  type CanonicalProblem,
  type Idea,
  type Innovation,
  type Pilot,
  type PilotStatus,
  type Report,
  type Volunteer,
} from '../api'
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
type TransitionStatus = Exclude<PilotStatus, 'draft'>

const transitionStatuses: TransitionStatus[] = [
  'review',
  'recruitment_funding',
  'pilot',
  'evaluation',
  'dissemination',
  'unavailable',
]

function pilotStatusLabel(status: PilotStatus) {
  return {
    draft: 'Szkic',
    review: 'Ocena',
    recruitment_funding: 'Rekrutacja i zasoby',
    pilot: 'Pilotaż',
    evaluation: 'Ewaluacja',
    dissemination: 'Upowszechnienie',
    unavailable: 'Niedostępny',
  }[status]
}

function statusTone(status: string) {
  if (status === 'rejected' || status === 'unavailable' || status === 'merged') return 'neutral'
  if (status === 'pending_admin' || status === 'review' || status === 'recruitment_funding')
    return 'yellow'
  if (status === 'evaluation') return 'blue'
  return 'green'
}

function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error ? caught.message : fallback
}

function formatCurrency(value: number | null) {
  return value === null ? 'Nie podano' : `${value.toLocaleString('pl-PL')} zł`
}

function Loading({ label = 'Wczytywanie danych…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="loader" />
      <strong>{label}</strong>
    </div>
  )
}

export function Admin({ path, notify }: Props) {
  if (path === '/admin') return <Overview />
  if (path === '/admin/zgloszenia') return <ReportsQueue />
  if (/^\/admin\/zgloszenia\/\d+$/.test(path))
    return <ReportReview id={Number(path.split('/').at(-1))} notify={notify} />
  if (path === '/admin/potrzeby') return <ProblemsQueue />
  if (/^\/admin\/potrzeby\/\d+$/.test(path))
    return <ProblemReview id={Number(path.split('/').at(-1))} notify={notify} />
  if (path === '/admin/innowacje') return <CatalogueQueue />
  if (path === '/admin/innowacje/nowa') return <CatalogueEditor notify={notify} />
  if (/^\/admin\/innowacje\/\d+$/.test(path))
    return <CatalogueEditor id={Number(path.split('/').at(-1))} notify={notify} />
  if (path === '/admin/rozwiazania/duplikaty') return <Duplicates />
  if (path === '/admin/pomysly') return <IdeasQueue />
  if (/^\/admin\/pomysly\/\d+$/.test(path))
    return <IdeaReview id={Number(path.split('/').at(-1))} notify={notify} />
  if (path === '/admin/pilotaze') return <PilotsQueue />
  if (path === '/admin/pilotaze/nowy') return <PilotCreate notify={notify} />
  if (/^\/admin\/pilotaze\/\d+(?:\/(?:budzet|uczestnicy))?$/.test(path)) {
    const parts = path.split('/')
    return <PilotAdmin id={Number(parts[3])} section={parts[4] ?? 'overview'} notify={notify} />
  }
  return (
    <Empty
      title="Nieznana ścieżka administratora."
      text="Sprawdź adres albo wróć do pulpitu administratora."
      to="/admin"
      action="Wróć do panelu"
    />
  )
}

function Overview() {
  const [counts, setCounts] = useState<AdminDashboardCounts | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getAdminDashboard()
      .then(setCounts)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać liczb.')))
  }, [])

  const cards = [
    [
      '/admin/zgloszenia',
      'Zgłoszenia',
      counts?.reports_total,
      counts?.reports_waiting_grouping,
      'Tray',
    ],
    ['/admin/pomysly', 'Pomysły', counts?.ideas_total, counts?.ideas_waiting_admin, 'Lightbulb'],
    ['/admin/pilotaze', 'Pilotaże', counts?.pilots_total, counts?.pilots_waiting_start, 'Plant'],
  ] as const
  return (
    <>
      <Heading
        title="Panel decyzji"
        description="Liczby oraz kolejki są odczytywane z bieżącej bazy danych."
      />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="admin-queues" aria-busy={!counts && !error}>
        {cards.map(([url, title, total, waiting, icon]) => (
          <Link href={url} key={url}>
            <Icon name={icon as 'Plant'} size={26} />
            <strong>{total ?? '—'}</strong>
            <h2>{title}</h2>
            <span>
              {waiting === undefined ? 'Wczytywanie…' : `${waiting} wymagających działania`}
              <Icon name="ArrowRight" size={17} />
            </span>
          </Link>
        ))}
      </div>
      <Panel>
        <h2>Praca administratora</h2>
        <p>
          Otwórz kolejkę, aby przejrzeć aktualne rekordy, wykonać decyzję i od razu zobaczyć wynik
          zapisany w systemie.
        </p>
      </Panel>
    </>
  )
}

function ReportsQueue() {
  const [reports, setReports] = useState<Report[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listMyReports()
      .then(setReports)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać zgłoszeń.')))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <Loading label="Wczytywanie zgłoszeń…" />
  return (
    <>
      <Heading
        title="Zgłoszenia do oceny"
        description="Kolejka zawiera wszystkie zgłoszenia dostępne administratorowi."
      />
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : reports.length === 0 ? (
        <Empty
          title="Brak zgłoszeń."
          text="Nowe zgłoszenia pojawią się tutaj po zapisaniu przez użytkowników."
          to="/admin"
          action="Pulpit"
        />
      ) : (
        <div className="table-wrap responsive-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Opis</th>
                <th scope="col">Miejsce</th>
                <th scope="col">Status</th>
                <th scope="col">Działanie</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td data-label="Opis">
                    <strong>
                      {report.text_raw.slice(0, 110)}
                      {report.text_raw.length > 110 ? '…' : ''}
                    </strong>
                  </td>
                  <td data-label="Miejsce">{report.location_name}</td>
                  <td data-label="Status">
                    <Badge tone={statusTone(report.status)}>{report.status}</Badge>
                  </td>
                  <td data-label="Działanie">
                    <ButtonLink to={`/admin/zgloszenia/${report.id}`}>Otwórz</ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function ReportReview({ id, notify }: { id: number; notify: Notify }) {
  const [report, setReport] = useState<Report | null>(null)
  const [categories, setCategories] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const reload = () =>
    api
      .getReport(id)
      .then((item) => {
        setReport(item)
        setCategories(item.categories.join(', '))
      })
      .catch((caught: unknown) =>
        setError(errorMessage(caught, 'Nie udało się pobrać zgłoszenia.')),
      )
  useEffect(() => {
    void reload()
  }, [id])
  if (!report && !error) return <Loading label="Wczytywanie zgłoszenia…" />
  if (!report) return <Notice tone="error">{error}</Notice>
  async function save(status?: 'submitted' | 'confirmed' | 'rejected') {
    setBusy(true)
    setError('')
    try {
      await api.updateReportCategories(
        id,
        categories
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      )
      if (status) await api.updateAdminReportStatus(id, status)
      await reload()
      notify('Zmiany zgłoszenia zostały zapisane.')
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się zapisać zmian.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Heading
        title="Ocena zgłoszenia"
        back="/admin/zgloszenia"
        description={report.location_name}
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <h2>Treść</h2>
            <p>{report.text_raw}</p>
            <dl className="facts">
              <Fact label="Odbiorcy">{report.audience}</Fact>
              <Fact label="Pilność">{report.urgency}</Fact>
              <Fact label="Czas trwania">{report.duration}</Fact>
            </dl>
          </Panel>
          {report.is_urgent && report.urgent_guidance && (
            <Notice tone="warning">{report.urgent_guidance}</Notice>
          )}
          <Panel>
            <h2>Decyzja</h2>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Kategorie, rozdzielone przecinkami">
              <input value={categories} onChange={(event) => setCategories(event.target.value)} />
            </Field>
            <div className="actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void save('submitted')}
              >
                Zapisz do dalszej oceny
              </button>
              <button className="button" disabled={busy} onClick={() => void save('confirmed')}>
                Potwierdź
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void save('rejected')}
              >
                Odrzuć
              </button>
            </div>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Aktualny status</h2>
          <Badge tone={statusTone(report.status)}>{report.status}</Badge>
          <p>Zmiana statusu i kategorii jest zapisywana bezpośrednio w bazie.</p>
        </aside>
      </div>
    </>
  )
}

function ProblemsQueue() {
  const [problems, setProblems] = useState<CanonicalProblem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api
      .listAdminProblems()
      .then(setProblems)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać problemów.')))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <Loading label="Wczytywanie problemów…" />
  return (
    <>
      <Heading
        title="Problemy kanoniczne"
        description="Wybierz problem, aby scalić podobne sprawy lub wydzielić raporty."
      />
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : problems.length === 0 ? (
        <Empty
          title="Brak problemów kanonicznych."
          text="Problemy pojawią się po potwierdzeniu grupowania zgłoszeń."
          to="/admin/zgloszenia"
          action="Zobacz zgłoszenia"
        />
      ) : (
        <div className="table-wrap responsive-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Problem</th>
                <th scope="col">Zgłaszający</th>
                <th scope="col">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {problems.map((problem) => (
                <tr key={problem.id}>
                  <td data-label="Problem">
                    <strong>{problem.title}</strong>
                  </td>
                  <td data-label="Zgłaszający">{problem.reporter_count}</td>
                  <td data-label="Status">
                    <Badge tone={statusTone(problem.status)}>{problem.status}</Badge>
                  </td>
                  <td data-label="Problem">
                    <ButtonLink to={`/admin/potrzeby/${problem.id}`}>Otwórz</ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function ProblemReview({ id, notify }: { id: number; notify: Notify }) {
  const [problem, setProblem] = useState<CanonicalProblem | null>(null)
  const [allProblems, setAllProblems] = useState<CanonicalProblem[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [targetId, setTargetId] = useState('')
  const [selectedReports, setSelectedReports] = useState<number[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const reload = async () => {
    try {
      const [current, problems, items] = await Promise.all([
        api.getProblem(id),
        api.listAdminProblems(),
        api.listMyReports(),
      ])
      setProblem(current)
      setAllProblems(problems)
      setReports(items.filter((item) => item.canonical_problem_id === id))
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się pobrać problemu.'))
    }
  }
  useEffect(() => {
    void reload()
  }, [id])
  if (!problem && !error) return <Loading label="Wczytywanie problemu…" />
  if (!problem) return <Notice tone="error">{error}</Notice>
  async function merge() {
    if (!targetId) return
    setBusy(true)
    setError('')
    try {
      await api.mergeProblems(Number(targetId), [id])
      notify('Problemy zostały scalone.')
      navigate(`/admin/potrzeby/${targetId}`)
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się scalić problemów.'))
    } finally {
      setBusy(false)
    }
  }
  async function split() {
    if (!selectedReports.length || !newTitle.trim()) return
    setBusy(true)
    setError('')
    try {
      const created = await api.splitProblem(id, selectedReports, newTitle.trim())
      notify('Utworzono wydzielony problem.')
      navigate(`/admin/potrzeby/${created.id}`)
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się wydzielić problemu.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Heading
        title={problem.title}
        description={problem.generated_description}
        back="/admin/potrzeby"
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <h2>Scal z innym problemem</h2>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Problem docelowy">
              <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
                <option value="">Wybierz problem</option>
                {allProblems
                  .filter((item) => item.id !== id && item.status !== 'merged')
                  .map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </Field>
            <button className="button" disabled={busy || !targetId} onClick={() => void merge()}>
              Scal problem
              <Icon name="ArrowRight" />
            </button>
          </Panel>
          <Panel>
            <h2>Wydziel raporty</h2>
            {reports.length === 0 ? (
              <p>Brak raportów przypisanych do tego problemu.</p>
            ) : (
              reports.map((report) => (
                <label className="checkbox-line" key={report.id}>
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() =>
                      setSelectedReports((ids) =>
                        ids.includes(report.id)
                          ? ids.filter((item) => item !== report.id)
                          : [...ids, report.id],
                      )
                    }
                  />
                  {report.text_raw.slice(0, 130)}
                </label>
              ))
            )}
            <Field label="Tytuł nowego problemu">
              <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
            </Field>
            <button
              className="button"
              disabled={busy || !selectedReports.length || !newTitle.trim()}
              onClick={() => void split()}
            >
              Wydziel problem
              <Icon name="ArrowRight" />
            </button>
          </Panel>
        </div>
        <aside className="context-aside">
          <dl>
            <Fact label="Zgłaszający">{problem.reporter_count}</Fact>
            <Fact label="Status">{problem.status}</Fact>
          </dl>
        </aside>
      </div>
    </>
  )
}

function CatalogueQueue() {
  const [items, setItems] = useState<Innovation[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = () => {
    setLoading(true)
    setError('')
    return api
      .searchCatalogue(query)
      .then(setItems)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać katalogu.')))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    void load()
  }, [])
  return (
    <>
      <Heading
        title="Katalog innowacji"
        description="Dodawaj, edytuj i usuwaj rekordy katalogu."
        action={<ButtonLink to="/admin/innowacje/nowa">Dodaj innowację</ButtonLink>}
      />
      <div className="toolbar">
        <label className="search">
          <Icon name="MagnifyingGlass" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj"
          />
        </label>
        <button className="button secondary" disabled={loading} onClick={() => void load()}>
          Szukaj
        </button>
      </div>
      {loading ? (
        <Loading label="Wczytywanie katalogu…" />
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : items.length === 0 ? (
        <Empty
          title="Brak pozycji."
          text="Dodaj pierwszą pozycję do katalogu."
          to="/admin/innowacje/nowa"
          action="Dodaj innowację"
        />
      ) : (
        <div className="table-wrap responsive-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Nazwa</th>
                <th scope="col">Kategoria</th>
                <th scope="col">Źródło</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Nazwa">
                    <strong>{item.title}</strong>
                  </td>
                  <td data-label="Kategoria">{item.category}</td>
                  <td data-label="Źródło">{item.source_url ?? 'Nie wskazano'}</td>
                  <td data-label="Nazwa">
                    <ButtonLink to={`/admin/innowacje/${item.id}`}>Edytuj</ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function CatalogueEditor({ id, notify }: { id?: number; notify: Notify }) {
  const [form, setForm] = useState<AdminCatalogueInput>({
    title: '',
    description: '',
    category: '',
    source_url: '',
    target_audience: '',
    cost_estimate: '',
    limitations: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(Boolean(id))
  useEffect(() => {
    if (!id) return
    api
      .getCatalogueItem(id)
      .then((item) =>
        setForm({
          title: item.title,
          description: item.description,
          category: item.category,
          source_url: item.source_url ?? '',
          target_audience: item.target_audience,
          cost_estimate: item.cost_estimate,
          limitations: item.limitations,
        }),
      )
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać innowacji.')))
      .finally(() => setBusy(false))
  }, [id])
  function set<K extends keyof AdminCatalogueInput>(key: K, value: AdminCatalogueInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const item = id
        ? await api.updateAdminCatalogueItem(id, form)
        : await api.createAdminCatalogueItem(form)
      notify('Innowacja została zapisana.')
      navigate(`/admin/innowacje/${item.id}`)
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się zapisać innowacji.'))
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    if (!id) return
    setBusy(true)
    setError('')
    try {
      await api.deleteAdminCatalogueItem(id)
      notify('Innowacja została usunięta.')
      navigate('/admin/innowacje')
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się usunąć innowacji.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Heading title={id ? 'Edycja innowacji' : 'Nowa innowacja'} back="/admin/innowacje" />
      {id && busy && !form.title ? (
        <Loading label="Wczytywanie innowacji…" />
      ) : (
        <Panel>
          <form onSubmit={save}>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Nazwa">
              <input
                value={form.title}
                onChange={(event) => set('title', event.target.value)}
                required
              />
            </Field>
            <Field label="Opis">
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => set('description', event.target.value)}
                required
              />
            </Field>
            <Field label="Kategoria">
              <input
                value={form.category}
                onChange={(event) => set('category', event.target.value)}
                required
              />
            </Field>
            <Field label="Adres źródła">
              <input
                type="url"
                value={form.source_url}
                onChange={(event) => set('source_url', event.target.value)}
                required
              />
            </Field>
            <Field label="Odbiorcy">
              <input
                value={form.target_audience}
                onChange={(event) => set('target_audience', event.target.value)}
              />
            </Field>
            <Field label="Koszt">
              <input
                value={form.cost_estimate}
                onChange={(event) => set('cost_estimate', event.target.value)}
              />
            </Field>
            <Field label="Ograniczenia">
              <textarea
                rows={3}
                value={form.limitations}
                onChange={(event) => set('limitations', event.target.value)}
              />
            </Field>
            <div className="actions">
              <button className="button" disabled={busy}>
                {busy ? 'Zapisywanie…' : 'Zapisz'}
                <Icon name="Check" />
              </button>
              {id && (
                <button
                  className="button secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void remove()}
                >
                  Usuń
                </button>
              )}
            </div>
          </form>
        </Panel>
      )}
    </>
  )
}

function Duplicates() {
  const [items, setItems] = useState<Innovation[]>([])
  const [target, setTarget] = useState('')
  const [duplicate, setDuplicate] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api
      .searchCatalogue()
      .then(setItems)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać katalogu.')))
      .finally(() => setLoading(false))
  }, [])
  async function merge() {
    if (!target || !duplicate || target === duplicate) return
    setBusy(true)
    setError('')
    try {
      await api.mergeSolutions(Number(target), [Number(duplicate)])
      setItems((current) => current.filter((item) => item.id !== Number(duplicate)))
      setDuplicate('')
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się scalić innowacji.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Heading
        title="Scalanie duplikatów"
        description="Wybierz rekord docelowy i rekord, który ma zostać włączony."
      />
      {loading ? (
        <Loading label="Wczytywanie katalogu…" />
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : items.length < 2 ? (
        <Empty
          title="Brak rekordów do scalenia."
          text="Do tej operacji potrzebne są co najmniej dwie innowacje w katalogu."
          to="/admin/innowacje"
          action="Otwórz katalog"
        />
      ) : (
        <Panel>
          <Field label="Rekord docelowy">
            <select value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="">Wybierz</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duplikat">
            <select value={duplicate} onChange={(event) => setDuplicate(event.target.value)}>
              <option value="">Wybierz</option>
              {items
                .filter((item) => String(item.id) !== target)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
            </select>
          </Field>
          <button
            className="button"
            disabled={busy || !target || !duplicate || target === duplicate}
            onClick={() => void merge()}
          >
            Scal rekordy
            <Icon name="ArrowRight" />
          </button>
        </Panel>
      )}
    </>
  )
}

function IdeasQueue() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api
      .listAdminIdeas()
      .then(setIdeas)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać pomysłów.')))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <Loading label="Wczytywanie pomysłów…" />
  return (
    <>
      <Heading
        title="Pomysły społeczności"
        description="Kolejka obejmuje wszystkie statusy pomysłów."
      />
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : ideas.length === 0 ? (
        <Empty
          title="Brak pomysłów do oceny."
          text="Pomysły pojawią się tutaj po przekazaniu ich przez autorów do oceny."
          to="/admin"
          action="Pulpit"
        />
      ) : (
        <div className="table-wrap responsive-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Pomysł</th>
                <th scope="col">Autor</th>
                <th scope="col">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ideas.map((idea) => (
                <tr key={idea.id}>
                  <td data-label="Pomysł">
                    <strong>{idea.text_refined || idea.text_raw.slice(0, 110)}</strong>
                  </td>
                  <td data-label="Autor">{idea.author_name ?? 'Nie ujawniono'}</td>
                  <td data-label="Status">
                    <Badge tone={statusTone(idea.status)}>{idea.status}</Badge>
                  </td>
                  <td data-label="Pomysł">
                    <ButtonLink to={`/admin/pomysly/${idea.id}`}>Otwórz</ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function IdeaReview({ id, notify }: { id: number; notify: Notify }) {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const reload = () =>
    api
      .getIdea(id)
      .then(setIdea)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać pomysłu.')))
      .finally(() => setBusy(false))
  useEffect(() => {
    void reload()
  }, [id])
  if (!idea && !error) return <Loading label="Wczytywanie pomysłu…" />
  if (!idea) return <Notice tone="error">{error}</Notice>
  async function approve() {
    setBusy(true)
    setError('')
    try {
      await api.approveIdea(id)
      await reload()
      notify('Pomysł został opublikowany.')
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się opublikować pomysłu.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Heading title="Ocena pomysłu" back="/admin/pomysly" description={idea.author_name ?? ''} />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <h2>Oryginał</h2>
            <p>{idea.text_raw}</p>
            <h2>Treść do publikacji</h2>
            <p>{idea.text_refined || 'Brak wersji po redakcji.'}</p>
            <dl>
              <Fact label="Potrzeba">{idea.need || 'Nie wskazano'}</Fact>
              <Fact label="Rozwiązanie">{idea.solution || 'Nie wskazano'}</Fact>
              <Fact label="Partnerzy">{idea.partners || 'Nie wskazano'}</Fact>
            </dl>
          </Panel>
          {error && <Notice tone="error">{error}</Notice>}
          {idea.status === 'pending_admin' ? (
            <button className="button" disabled={busy} onClick={() => void approve()}>
              {busy ? 'Zapisywanie…' : 'Zatwierdź publikację'}
              <Icon name="Check" />
            </button>
          ) : (
            <Notice title="Brak dostępnej decyzji publikacyjnej.">
              Pomysł musi zostać potwierdzony przez autora przed zatwierdzeniem przez
              administratora.
            </Notice>
          )}
        </div>
        <aside className="context-aside">
          <Badge tone={statusTone(idea.status)}>{idea.status}</Badge>
        </aside>
      </div>
    </>
  )
}

function PilotsQueue() {
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api
      .listPilots()
      .then(setPilots)
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać pilotaży.')))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <Loading label="Wczytywanie pilotaży…" />
  return (
    <>
      <Heading
        title="Pilotaże"
        description="Twórz inicjatywy i prowadź ich cykl życia."
        action={<ButtonLink to="/admin/pilotaze/nowy">Nowy pilotaż</ButtonLink>}
      />
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : pilots.length === 0 ? (
        <Empty
          title="Brak pilotaży."
          text="Utwórz inicjatywę, aby rozpocząć przygotowanie pilotażu."
          to="/admin/pilotaze/nowy"
          action="Nowy pilotaż"
        />
      ) : (
        <div className="table-wrap responsive-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Nazwa</th>
                <th scope="col">Status</th>
                <th scope="col">Wolontariusze</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pilots.map((pilot) => (
                <tr key={pilot.id}>
                  <td data-label="Nazwa">
                    <strong>{pilot.title}</strong>
                  </td>
                  <td data-label="Status">
                    <Badge tone={statusTone(pilot.status)}>{pilotStatusLabel(pilot.status)}</Badge>
                  </td>
                  <td data-label="Wolontariusze">
                    {pilot.registered_volunteers_count} / {pilot.max_volunteers}
                  </td>
                  <td data-label="Nazwa">
                    <ButtonLink to={`/admin/pilotaze/${pilot.id}`}>Otwórz</ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function PilotCreate({ notify }: { notify: Notify }) {
  const [solutions, setSolutions] = useState<Innovation[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState(0)
  const [maxVolunteers, setMaxVolunteers] = useState(1)
  const [solutionId, setSolutionId] = useState('')
  const [partners, setPartners] = useState('')
  const [testPlan, setTestPlan] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    api
      .searchCatalogue()
      .then(setSolutions)
      .catch(() => setSolutions([]))
  }, [])
  async function create(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const pilot = await api.createPilot({
        title,
        description,
        budget_declared: budget,
        max_volunteers: maxVolunteers,
        solution_id: solutionId ? Number(solutionId) : null,
        partners: partners || undefined,
        test_plan: testPlan || undefined,
      })
      notify('Pilotaż został utworzony.')
      navigate(`/admin/pilotaze/${pilot.id}`)
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się utworzyć pilotażu.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Heading title="Nowy pilotaż" back="/admin/pilotaze" />
      <Panel>
        <form onSubmit={create}>
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Nazwa">
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </Field>
          <Field label="Opis">
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </Field>
          <Field label="Źródłowa innowacja">
            <select value={solutionId} onChange={(event) => setSolutionId(event.target.value)}>
              <option value="">Nie przypisuj</option>
              {solutions.map((solution) => (
                <option key={solution.id} value={solution.id}>
                  {solution.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Budżet deklarowany">
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
              required
            />
          </Field>
          <Field label="Maksymalna liczba wolontariuszy">
            <input
              type="number"
              min="1"
              value={maxVolunteers}
              onChange={(event) => setMaxVolunteers(Number(event.target.value))}
              required
            />
          </Field>
          <Field label="Partnerzy">
            <input value={partners} onChange={(event) => setPartners(event.target.value)} />
          </Field>
          <Field label="Plan testów">
            <textarea
              rows={3}
              value={testPlan}
              onChange={(event) => setTestPlan(event.target.value)}
            />
          </Field>
          <button className="button" disabled={busy}>
            {busy ? 'Zapisywanie…' : 'Utwórz pilotaż'}
            <Icon name="Check" />
          </button>
        </form>
      </Panel>
    </>
  )
}

function pilotTabs(id: number): [string, string][] {
  return [
    [`/admin/pilotaze/${id}`, 'Etapy i gotowość'],
    [`/admin/pilotaze/${id}/budzet`, 'Budżet'],
    [`/admin/pilotaze/${id}/uczestnicy`, 'Uczestnicy'],
  ]
}

function PilotAdmin({ id, section, notify }: { id: number; section: string; notify: Notify }) {
  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [targetStatus, setTargetStatus] = useState<TransitionStatus>('recruitment_funding')
  const [budget, setBudget] = useState('')
  const [owner, setOwner] = useState('')
  const [partners, setPartners] = useState('')
  const [testPlan, setTestPlan] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const reload = () =>
    api
      .getPilot(id)
      .then((item) => {
        setPilot(item)
        setTargetStatus(item.status === 'draft' ? 'review' : item.status)
        setBudget(item.budget_approved?.toString() ?? '')
        setOwner(item.accountable_owner ?? '')
        setPartners(item.partners ?? '')
        setTestPlan(item.test_plan ?? '')
      })
      .catch((caught: unknown) => setError(errorMessage(caught, 'Nie udało się pobrać pilotażu.')))
      .finally(() => setBusy(false))
  useEffect(() => {
    void reload()
  }, [id])
  if (!pilot && !error) return <Loading label="Wczytywanie pilotażu…" />
  if (!pilot) return <Notice tone="error">{error}</Notice>
  const readiness = [
    ['Zatwierdzony budżet', Number(budget) > 0],
    ['Odpowiedzialny właściciel', Boolean(owner.trim())],
    ['Partnerzy', Boolean(partners.trim())],
    ['Plan testów', Boolean(testPlan.trim())],
    ['Uczestnicy w systemie', pilot.registered_volunteers_count > 0],
  ] as const
  async function transition() {
    setBusy(true)
    setError('')
    try {
      await api.transitionPilot(id, {
        target_status: targetStatus,
        budget_approved: budget === '' ? null : Number(budget),
        accountable_owner: owner || null,
        partners: partners || null,
        test_plan: testPlan || null,
      })
      await reload()
      notify('Dane pilotażu zostały zapisane.')
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się zmienić stanu pilotażu.'))
    } finally {
      setBusy(false)
    }
  }
  if (section === 'uczestnicy') return <PilotVolunteers pilot={pilot} notify={notify} />
  return (
    <>
      <Heading
        title={pilot.title}
        description={pilotStatusLabel(pilot.status)}
        back="/admin/pilotaze"
      />
      <Tabs
        items={pilotTabs(id)}
        active={section === 'budzet' ? `/admin/pilotaze/${id}/budzet` : `/admin/pilotaze/${id}`}
      />
      <div className="detail-layout">
        <div className="stack">
          <Panel>
            <h2>{section === 'budzet' ? 'Budżet i warunki' : 'Gotowość oraz etap'}</h2>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Zatwierdzony budżet">
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              />
            </Field>
            <Field label="Odpowiedzialny właściciel">
              <input value={owner} onChange={(event) => setOwner(event.target.value)} />
            </Field>
            <Field label="Partnerzy">
              <input value={partners} onChange={(event) => setPartners(event.target.value)} />
            </Field>
            <Field label="Plan testów">
              <textarea
                rows={4}
                value={testPlan}
                onChange={(event) => setTestPlan(event.target.value)}
              />
            </Field>
            <Field label="Docelowy etap">
              <select
                value={targetStatus}
                onChange={(event) => setTargetStatus(event.target.value as TransitionStatus)}
              >
                {transitionStatuses.map((status) => (
                  <option key={status} value={status}>
                    {pilotStatusLabel(status)}
                  </option>
                ))}
              </select>
            </Field>
            <button className="button" disabled={busy} onClick={() => void transition()}>
              {busy ? 'Zapisywanie…' : 'Zapisz i zmień etap'}
              <Icon name="Check" />
            </button>
          </Panel>
        </div>
        <aside className="context-aside">
          <h2>Kontrola gotowości</h2>
          {readiness.map(([label, ready]) => (
            <div className="gate-row" key={label}>
              <Icon name={ready ? 'CheckCircle' : 'WarningCircle'} />
              <span>{label}</span>
              <Badge tone={ready ? 'green' : 'yellow'}>{ready ? 'Uzupełniono' : 'Brakuje'}</Badge>
            </div>
          ))}
          <dl>
            <Fact label="Budżet deklarowany">{formatCurrency(pilot.budget_declared)}</Fact>
            <Fact label="Zapisani">
              {pilot.registered_volunteers_count} / {pilot.max_volunteers}
            </Fact>
          </dl>
          <small>Serwer ponownie sprawdza warunki przed wejściem w etap pilotażu.</small>
        </aside>
      </div>
    </>
  )
}

function PilotVolunteers({ pilot, notify }: { pilot: Pilot; notify: Notify }) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const reload = () =>
    api
      .listPilotVolunteers(pilot.id)
      .then(setVolunteers)
      .catch((caught: unknown) =>
        setError(errorMessage(caught, 'Nie udało się pobrać wolontariuszy.')),
      )
      .finally(() => setLoading(false))
  useEffect(() => {
    void reload()
  }, [pilot.id])
  async function promote(volunteer: Volunteer) {
    setBusyId(volunteer.id)
    setError('')
    try {
      await api.promotePilotVolunteer(pilot.id, volunteer.user_id)
      await reload()
      notify('Oferta miejsca została przekazana.')
    } catch (caught) {
      setError(errorMessage(caught, 'Nie udało się przekazać oferty.'))
    } finally {
      setBusyId(null)
    }
  }
  return (
    <>
      <Heading title={`Uczestnicy: ${pilot.title}`} back={`/admin/pilotaze/${pilot.id}`} />
      <Tabs items={pilotTabs(pilot.id)} active={`/admin/pilotaze/${pilot.id}/uczestnicy`} />
      {loading ? (
        <Loading label="Wczytywanie uczestników…" />
      ) : error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <Panel>
          {volunteers.length === 0 ? (
            <p>Brak zgłoszeń wolontariuszy.</p>
          ) : (
            <div className="table-wrap responsive-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Osoba</th>
                    <th scope="col">Status</th>
                    <th scope="col">Pozycja</th>
                    <th scope="col">Działanie</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((volunteer) => (
                    <tr key={volunteer.id}>
                      <td data-label="Osoba">
                        {volunteer.user_name ?? `Użytkownik #${volunteer.user_id}`}
                      </td>
                      <td data-label="Status">
                        <Badge tone={statusTone(volunteer.status)}>{volunteer.status}</Badge>
                      </td>
                      <td data-label="Pozycja">{volunteer.position || '—'}</td>
                      <td data-label="Działanie">
                        {volunteer.status === 'waiting' ? (
                          <button
                            className="button secondary"
                            disabled={busyId === volunteer.id}
                            onClick={() => void promote(volunteer)}
                          >
                            {busyId === volunteer.id ? 'Zapisywanie…' : 'Zaoferuj miejsce'}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </>
  )
}
