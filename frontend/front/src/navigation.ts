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
  requestAnimationFrame(() => document.querySelector<HTMLElement>('h1')?.focus())
}
