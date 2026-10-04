import { useState } from 'react'
import { screens } from '../routes'
import { Badge, ButtonLink, Heading, Icon, Link, Logo, Notice } from '../ui'

export function Login({
  onPasswordLogin,
  onRegister,
}: {
  onPasswordLogin: (email: string, password: string, destination: string) => Promise<void>
  onRegister: (data: {
    name: string
    surname: string
    email: string
    password: string
    is_anonymous_by_default: boolean
  }, destination: string) => Promise<void>
}) {
  const target = new URLSearchParams(window.location.search).get('cel') ?? ''
  const destination =
    (
      { zgloszenie: '/zgloszenia/nowe', innowacje: '/innowacje', mapa: '/potrzeby' } as Record<
        string,
        string
      >
    )[target] ?? '/start'
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onPasswordLogin(email, password, destination)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się zalogować.')
    } finally {
      setLoading(false)
    }
  }
  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onRegister(
        { name, surname, email, password, is_anonymous_by_default: anonymous },
        destination,
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się utworzyć konta.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="login-layout">
      <section className="login-art">
        <Logo />
        <img
          src="/images/community.webp"
          alt="Ilustracja sąsiadów wspólnie rozmawiających nad pomysłem."
        />
        <h2>
          Twoja perspektywa
          <br />
          ma znaczenie.
        </h2>
        <Link href="/">Wróć na stronę główną</Link>
      </section>
      <section className="login-content">
        <Heading
          title={mode === 'login' ? 'Zaloguj się do MBG.' : 'Załóż konto w MBG.'}
          description={
            mode === 'login'
              ? 'Użyj konta utworzonego w MBG.'
              : 'Nowe konto otrzymuje rolę użytkownika. Uprawnienia administratora nadaje serwer.'
          }
        />
        <div className="auth-tabs" role="tablist" aria-label="Dostęp do konta">
          <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')}>
            Logowanie
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => setMode('register')}>
            Rejestracja
          </button>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        {mode === 'login' ? (
          <form className="auth-form" onSubmit={(event) => void login(event)}>
            <label>
              E-mail
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <label>
              Hasło
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Logowanie…' : 'Zaloguj się'}
              <Icon name="ArrowRight" size={17} />
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(event) => void register(event)}>
            <div className="auth-form-grid">
              <label>
                Imię
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="given-name" required />
              </label>
              <label>
                Nazwisko
                <input value={surname} onChange={(event) => setSurname(event.target.value)} autoComplete="family-name" />
              </label>
            </div>
            <label>
              E-mail
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <label>
              Hasło
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={10} required />
              <small>Co najmniej 10 znaków, w tym litera i cyfra.</small>
            </label>
            <label className="auth-checkbox">
              <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
              <span>Ukrywaj moje imię przy zgłoszeniach przed innymi użytkownikami.</span>
            </label>
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Tworzenie konta…' : 'Załóż konto'}
              <Icon name="ArrowRight" size={17} />
            </button>
          </form>
        )}
        <small>
          Administrator testowy loguje się tym samym formularzem. Dane syntetyczne są wyraźnie oznaczone w katalogu i widokach aplikacji.
        </small>
      </section>
    </div>
  )
}
export function Atlas() {
  const [query, setQuery] = useState(''),
    [group, setGroup] = useState('Wszystkie')
  const groups = ['Wszystkie', ...new Set(screens.map((s) => s.group))]
  const filtered = screens.filter(
    (s) =>
      (group === 'Wszystkie' || s.group === group) &&
      (s.title + s.note).toLocaleLowerCase('pl').includes(query.toLocaleLowerCase('pl')),
  )
  return (
    <div className="atlas">
      <header className="atlas-top">
        <Logo />
        <ButtonLink to="/">Strona główna</ButtonLink>
      </header>
      <Heading
        title="Cała Małopolska bez granic. Ekran po ekranie."
        description={`${screens.length} widoków: użytkownik, administrator i marka. Każdy ekran ma układ na komputer i telefon.`}
      />
      <Notice>
        Atlas służy przeglądowi projektu. Dostęp do ekranów administratora w tej galerii jest celowy
        i nie stanowi systemu uprawnień.
      </Notice>
      <div className="atlas-controls">
        <label className="search">
          <Icon name="MagnifyingGlass" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Znajdź ekran lub funkcję"
            aria-label="Wyszukaj ekran"
          />
        </label>
        <div className="filter-pills">
          {groups.map((g) => (
            <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="atlas-grid">
        {filtered.map((s) => (
          <Link href={s.path} className="atlas-card" key={s.path}>
            <img
              className="atlas-preview"
              loading="lazy"
              src={`/previews/${s.path === '/' ? 'landing' : s.path.split('?')[0].slice(1).replaceAll('/', '-')}.webp`}
              alt=""
            />
            <div className="atlas-card-copy">
              <Badge tone={s.group === 'Administrator' ? 'blue' : 'green'}>{s.group}</Badge>
              <h2>{s.title}</h2>
              <p>{s.note}</p>
              <span>
                Otwórz ekran <Icon name="ArrowRight" size={18} />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <section className="atlas-states">
        <h2>Ważne stany i alternatywne ścieżki</h2>
        <div className="link-list">
          {[
            ['/zgloszenia/nowe?stan=poza-regionem', 'Miejsce poza Małopolską'],
            ['/zgloszenia/1/potwierdzenie?stan=pilne', 'Pilna sprawa · symulacja skierowania'],
            ['/zgloszenia/1/wyniki?stan=pusto', 'Brak trafnych rozwiązań'],
            ['/zgloszenia/1/wyniki?stan=brak-webgl', 'Alternatywa dla semantycznego 3D'],
            ['/pomysly/nowy?stan=ai-offline', 'AI niedostępne · formularz i kolejka'],
            ['/pomysly/1?stan=kolejka', 'Oczekiwanie na przetworzenie AI'],
            ['/pomysly/1?stan=oferta', 'Pomysł po decyzji administratora'],
            ['/pilotaze/1/udzial?stan=kolejka', 'Lista oczekujących'],
            ['/pilotaze/1/udzial?stan=oferta', 'Oferta wolnego miejsca'],
            ['/admin/pilotaze/1?stan=blokada', 'Pilotaż bez warunków startu'],
            ['/innowacje?stan=blad', 'Błąd i ponowienie'],
            ['/potrzeby?stan=ladowanie', 'Ładowanie widoku'],
            ['/zgloszenia?stan=pusto', 'Pusta lista zgłoszeń'],
          ].map(([url, title]) => (
            <Link key={url} href={url}>
              {title}
              <Icon name="ArrowRight" size={16} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
export function Brand() {
  return (
    <div className="brand-page">
      <header className="atlas-top">
        <Logo />
        <ButtonLink to="/" secondary>
          Wróć na stronę główną
        </ButtonLink>
      </header>
      <Heading
        title="Małopolska bez granic."
        description="Logo krajobrazowe dostarczone przez właściciela: małopolskie wzgórza, Wisła, panorama Krakowa i wspólny kierunek."
      />
      <section className="brand-display">
        <img src="/brand/mbg-landscape.webp" alt="Logo Małopolska bez granic" />
        <span>MBG</span>
      </section>
      <div className="brand-variants">
        <div>
          <img src="/brand/mbg-landscape.webp" alt="Logo krajobrazowe na jasnym tle" />
          <p>Logo krajobrazowe</p>
        </div>
        <div>
          <img src="/brand/mbg-landscape-original.png" alt="Oryginalny plik logo właściciela" />
          <p>Oryginał właściciela</p>
        </div>
        <div>
          <img src="/images/community.webp" alt="Rysunkowy język ilustracji MBG" />
          <p>Rysunkowy świat MBG</p>
        </div>
      </div>
      <div className="swatches">
        {[
          ['#0c2941', 'Granat tekstu'],
          ['#00834a', 'Zieleń działań'],
          ['#ffffff', 'Dashboard'],
          ['#ffffff', 'Białe tło'],
          ['#a8492f', 'Ceglasty akcent'],
        ].map(([color, name]) => (
          <div key={color}>
            <span style={{ background: color }} />
            <strong>{name}</strong>
            <small>{color}</small>
          </div>
        ))}
      </div>
      <section className="brand-downloads">
        <h2>Logo do użycia.</h2>
        <p>
          Oryginalny PNG właściciela oraz lżejszy WebP z zachowaną przezroczystością. Logo jest
          rastrowe; nie jest plikiem wektorowym.
        </p>
        <div className="actions">
          {['mbg-landscape-original.png', 'mbg-landscape.webp'].map((file) => (
            <a className="button secondary" key={file} href={`/brand/${file}`} download>
              {file}
              <Icon name="ArrowSquareOut" size={16} />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
