import { lazy, Suspense, useEffect, useState } from 'react'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/ibm-plex-sans/latin-ext-400.css'
import '@fontsource/ibm-plex-sans/latin-ext-500.css'
import '@fontsource/ibm-plex-sans/latin-ext-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import { adminNav, primaryNav, screens } from './routes'
import { Icon, Link, Logo, Heading, DemoStatus } from './ui'
import { useRoute } from './navigation'
import { api, clearSession, getStoredSession, saveSession, type Session } from './api'
import { navigate } from './navigation'
import { Login, PasswordReset, Atlas, Brand } from './pages/Public'
import { Citizen } from './pages/Citizen'
import { Admin } from './pages/Admin'
import './App.css'
import './Civic.css'
const Landing = lazy(() => import('./pages/Landing'))

export default function App() {
  const route = useRoute(),
    path = route.split('?')[0],
    params = new URLSearchParams(route.split('?')[1]),
    state = params.get('stan') ?? 'gotowy'
  const [toast, setToast] = useState(''),
    [menuRoute, setMenuRoute] = useState<string | null>(null),
    [session, setSession] = useState<Session | null>(() => getStoredSession())
  const menu = menuRoute === path
  const admin = path.startsWith('/admin'),
    publicPage = ['/', '/logowanie', '/reset-hasla', '/mockupy', '/marka'].includes(path)
  const screen = screens.find((item) => item.path.split('?')[0] === path)
  useEffect(() => {
    document.title = `${screen?.title ?? 'Strona MBG'} · MBG`
  }, [screen?.title])
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timeout)
  }, [toast])
  useEffect(() => {
    if (!publicPage && !session) navigate('/logowanie')
    if (session?.role === 'user' && admin) navigate('/start')
  }, [admin, publicPage, session])
  const notify = (message: string) => setToast(message)
  function establishSession(nextSession: Session, destination: string) {
    saveSession(nextSession)
    setSession(nextSession)
    navigate(nextSession.role === 'admin' ? '/admin' : destination)
  }
  async function loginWithPassword(email: string, password: string, destination: string) {
    establishSession(await api.login(email, password), destination)
  }
  async function register(
    data: { name: string; surname: string; email: string; password: string; is_anonymous_by_default: boolean },
    destination: string,
  ) {
    establishSession(await api.register(data), destination)
  }
  function logout() {
    void api.logout().catch(() => undefined)
    clearSession()
    setSession(null)
    navigate('/logowanie')
  }
  const navigation = admin ? adminNav : primaryNav
  let page
  if (path === '/')
    page = (
      <Suspense
        fallback={
          <p role="status" className="landing-loading">
            Wczytywanie strony MBG…
          </p>
        }
      >
        <Landing />
      </Suspense>
    )
  else if (path === '/logowanie')
    page = <Login onPasswordLogin={loginWithPassword} onRegister={register} />
  else if (path === '/reset-hasla') page = <PasswordReset />
  else if (path === '/mockupy') page = <Atlas />
  else if (path === '/marka') page = <Brand />
  else if (state === 'blad' || state === 'ladowanie')
    page = (
      <>
        <Heading title={screen?.title ?? 'Widok aplikacji'} />
        <DemoStatus state={state} />
      </>
    )
  else if (admin) page = <Admin path={path} state={state} notify={notify} />
  else page = <Citizen path={path} state={state} notify={notify} />
  return (
    <>
      <a href="#main" className="skip-link">
        Przejdź do treści
      </a>
      {!publicPage && (
        <header className="app-header">
          <Logo />
          <div className="header-context">
            {admin ? 'Przestrzeń administratora' : 'Przestrzeń mieszkańca'}
          </div>
          <div className="header-tools">
            <Link href="/powiadomienia" aria-label="Powiadomienia" className="icon-button">
              <Icon name="Bell" />
              <span className="notification-dot" />
            </Link>
            <Link href="/moje-aktywnosci" className="account-link">
              <span className="avatar">{admin ? 'AD' : session?.user_name.slice(0, 2).toUpperCase()}</span>
              <span>{admin ? 'Administrator' : session?.user_name}</span>
            </Link>
            <button
              className="icon-button menu-trigger"
              onClick={() => setMenuRoute(menu ? null : path)}
              aria-label="Otwórz menu"
              aria-expanded={menu}
            >
              <Icon name="List" />
            </button>
          </div>
        </header>
      )}
      {!publicPage && menu && (
        <nav className="mobile-menu" aria-label="Menu dodatkowe">
          {navigation.map(([url, title]) => (
            <Link key={url} href={url}>
              {title}
            </Link>
          ))}
          <Link href="/moje-aktywnosci">Moje aktywności</Link>
          <Link href="/zgloszenia">Moje zgłoszenia</Link>
          <Link href="/poparcie">Poparcie</Link>
          <Link href="/pomoc">Pomoc</Link>
          <Link href="/logowanie" onClick={logout}>Wyloguj się</Link>
        </nav>
      )}
      <div className={!publicPage ? 'app-layout' : ''}>
        {!publicPage && (
          <aside className="app-sidebar">
            <nav aria-label={admin ? 'Nawigacja administratora' : 'Nawigacja główna'}>
              {navigation.map(([url, text, icon]) => (
                <Link
                  key={url}
                  href={url}
                  className={
                    path === url ||
                    (url !== '/admin' && path.startsWith(url + '/')) ||
                    (url === '/start' && path.startsWith('/zgloszenia'))
                      ? 'active'
                      : ''
                  }
                >
                  <Icon name={icon} />
                  {text}
                </Link>
              ))}
              {!admin && (
                <>
                  <Link href="/zgloszenia/nowe">
                    <Icon name="Plus" />
                    Zgłoś potrzebę
                  </Link>
                  <Link href="/poparcie">
                    <Icon name="Heart" />
                    Poparcie
                  </Link>
                </>
              )}
            </nav>
            <div className="sidebar-bottom">
              {admin ? (
                <Link href="/start">
                  <Icon name="ArrowLeft" />
                  Widok użytkownika
                </Link>
              ) : (
                <Link href="/moje-aktywnosci">
                  <Icon name="UserCircle" />
                  Moje aktywności
                </Link>
              )}
              <Link href="/pomoc">
                <Icon name="Info" />
                Jak możemy pomóc?
              </Link>
              <Link href="/logowanie" onClick={logout}>
                <Icon name="SignOut" />
                Wyloguj się
              </Link>
            </div>
          </aside>
        )}
        <main
          id="main"
          className={publicPage ? 'public-main' : `app-main ${admin ? 'admin-main' : ''}`}
          key={route}
        >
          {page}
        </main>
      </div>
      {!publicPage && (
        <footer className="app-footer">
          <span>Małopolska bez granic · MBG</span>
          <div>
            <Link href="/pomoc">Pomoc</Link>
            <Link href="/prywatnosc">Prywatność</Link>
            <Link href="/dostepnosc">Dostępność</Link>
          </div>
        </footer>
      )}
      {!publicPage && !admin && (
        <nav className="bottom-nav" aria-label="Nawigacja na telefonie">
          {primaryNav.map(([url, text, icon]) => (
            <Link
              key={url}
              href={url}
              aria-current={path.startsWith(url) ? 'page' : undefined}
              className={path.startsWith(url) ? 'active' : ''}
            >
              <Icon name={icon} size={22} />
              {text}
            </Link>
          ))}
        </nav>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="CheckCircle" />
          {toast}
          <button
            onClick={() => setToast('')}
            className="icon-button"
            aria-label="Zamknij komunikat"
          >
            <Icon name="X" />
          </button>
        </div>
      )}
    </>
  )
}
