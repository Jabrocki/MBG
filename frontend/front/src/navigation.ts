import { useSyncExternalStore } from 'react'

const subscribe = (callback: () => void) => {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}
const snapshot = () => window.location.pathname + window.location.search

export function useRoute() {
  return useSyncExternalStore(subscribe, snapshot, () => '/')
}
export function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'instant' })
  requestAnimationFrame(focusRouteHeading)
}

export function isActiveSection(path: string, url: string) {
  if (url === '/start' && (path.startsWith('/zgloszenia') || path === '/moje-aktywnosci'))
    return true
  if (url === '/pomysly' && path === '/poparcie') return true
  if (url === '/innowacje' && path.startsWith('/adaptacje')) return true
  return path === url || (url !== '/admin' && path.startsWith(url + '/'))
}

export function focusRouteHeading() {
  const heading = document.querySelector<HTMLElement>('h1')
  if (heading?.hasAttribute('tabindex')) heading.focus({ preventScroll: true })
}
