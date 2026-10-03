import {
  cloneElement,
  isValidElement,
  useId,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react'
import { navigate } from './navigation'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  WarningCircle,
  Info,
  X,
  House,
  MapPin,
  Books,
  Lightbulb,
  Plant,
  SquaresFour,
  Tray,
  Intersect,
  Bell,
  UserCircle,
  List,
  CaretDown,
  MagnifyingGlass,
  Clock,
  Heart,
  ChatCircle,
  Users,
  ClipboardText,
  ShieldCheck,
  ArrowSquareOut,
  ArrowCounterClockwise,
  SlidersHorizontal,
  Plus,
  CaretRight,
  CheckCircle,
  Cube,
  Gear,
  SignOut,
} from '@phosphor-icons/react'
const icons = {
  ArrowRight,
  ArrowLeft,
  Check,
  WarningCircle,
  Info,
  X,
  House,
  MapPin,
  Books,
  Lightbulb,
  Plant,
  SquaresFour,
  Tray,
  Intersect,
  Bell,
  UserCircle,
  List,
  CaretDown,
  MagnifyingGlass,
  Clock,
  Heart,
  ChatCircle,
  Users,
  ClipboardText,
  ShieldCheck,
  ArrowSquareOut,
  ArrowCounterClockwise,
  SlidersHorizontal,
  Plus,
  CaretRight,
  CheckCircle,
  Cube,
  Gear,
  SignOut,
}
export function Icon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  const Component = icons[name]
  return <Component size={size} weight="regular" aria-hidden="true" />
}
export function Link({
  href = '#',
  children,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(event) => {
        onClick?.(event)
        if (
          !event.defaultPrevented &&
          href.startsWith('/') &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          event.button === 0 &&
          !rest.download
        ) {
          event.preventDefault()
          navigate(href)
        }
      }}
    >
      {children}
    </a>
  )
}
export function ButtonLink({
  to,
  children,
  secondary = false,
}: {
  to: string
  children: ReactNode
  secondary?: boolean
}) {
  return (
    <Link href={to} className={`button ${secondary ? 'secondary' : ''}`}>
      {children}
      <Icon name="ArrowRight" size={18} />
    </Link>
  )
}
export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link
      className={`logo ${light ? 'logo-light' : ''}`}
      href="/"
      aria-label="Małopolska bez granic — strona główna"
    >
      <img
        className={`landscape-logo ${compact ? 'compact' : ''}`}
        src="/brand/mbg-landscape.webp"
        width="230"
        height="66"
        alt=""
      />
      <span className="sr-only">
        {compact ? (
          <strong>MBG</strong>
        ) : (
          <>
            <strong>Małopolska</strong>
            <span>bez granic</span>
          </>
        )}
      </span>
    </Link>
  )
}
export function Heading({
  title,
  description,
  back,
  action,
}: {
  title: string
  description?: string
  back?: string
  action?: ReactNode
}) {
  return (
    <header className="page-heading">
      {back && (
        <Link className="back-link" href={back}>
          <Icon name="ArrowLeft" size={16} />
          Wróć do listy
        </Link>
      )}
      <div className="heading-row">
        <div>
          <h1 tabIndex={-1}>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}
export function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>
}
export function Notice({
  children,
  tone = 'info',
  title,
}: {
  children: ReactNode
  tone?: 'info' | 'warning' | 'success' | 'error'
  title?: string
}) {
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon
        name={
          tone === 'error' || tone === 'warning'
            ? 'WarningCircle'
            : tone === 'success'
              ? 'CheckCircle'
              : 'Info'
        }
        size={22}
      />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  )
}
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  const generatedId = useId()
  const control = isValidElement<{ id?: string; 'aria-describedby'?: string }>(children)
    ? children
    : null
  const id = control?.props.id ?? generatedId
  const description =
    [control?.props['aria-describedby'], hint ? `${id}-hint` : undefined]
      .filter(Boolean)
      .join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control ? cloneElement(control, { id, 'aria-describedby': description }) : children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  )
}
export function Tabs({ items, active }: { items: [string, string][]; active: string }) {
  return (
    <nav className="tabs" aria-label="Zakładki widoku">
      {items.map(([url, title]) => (
        <Link
          href={url}
          key={url}
          className={active === url ? 'active' : ''}
          aria-current={active === url ? 'page' : undefined}
        >
          {title}
        </Link>
      ))}
    </nav>
  )
}
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
export function Empty({
  title = 'Jeszcze nic tutaj nie ma.',
  text = 'Zacznij od opisania potrzeby lub sprawdź bibliotekę innowacji.',
  to = '/zgloszenia/nowe',
  action = 'Opisz potrzebę',
}: {
  title?: string
  text?: string
  to?: string
  action?: string
}) {
  return (
    <div className="empty">
      <Icon name="Plant" size={48} />
      <h2>{title}</h2>
      <p>{text}</p>
      <ButtonLink to={to}>{action}</ButtonLink>
    </div>
  )
}
export type Notify = (message: string) => void
export function DemoStatus({ state }: { state: string }) {
  if (state === 'blad')
    return (
      <Notice tone="error" title="Nie udało się wczytać danych.">
        Pokazowy stan błędu wczytywania. Ten podgląd zastępuje formularz i nie potwierdza zachowania
        jego niezapisanej treści. <Link href={window.location.pathname}>Spróbuj ponownie</Link>. To
        pokazowy stan błędu.
      </Notice>
    )
  if (state === 'ladowanie')
    return (
      <div className="loading" role="status">
        <span className="loader" />
        <strong>Przygotowujemy widok…</strong>
        <p>
          Pokazowy stan ładowania. <Link href={window.location.pathname}>Pokaż gotowy widok</Link>
        </p>
      </div>
    )
  return null
}
