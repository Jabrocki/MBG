import { getStoredSession } from './api'
import { useCallback, useRef, useState, type SetStateAction } from 'react'

// Demo drafts stay in this tab's session; no content is sent to a service.
function sessionKey(key: string) {
  return `${getStoredSession()?.user_id ?? 'guest'}:${key}`
}
export function readSession<T>(key: string, fallback: T): T {
  try {
    const stored = sessionStorage.getItem(sessionKey(key))
    if (stored === null) return fallback
    const value: unknown = JSON.parse(stored)
    if (Array.isArray(fallback))
      return Array.isArray(value) && value.every((item) => typeof item === 'string')
        ? (value as T)
        : fallback
    if (typeof fallback === 'object' && fallback !== null)
      return value !== null &&
        typeof value === 'object' &&
        Object.entries(fallback).every(
          ([k, v]) => typeof (value as Record<string, unknown>)[k] === typeof v,
        )
        ? (value as T)
        : fallback
    return typeof value === typeof fallback ? (value as T) : fallback
  } catch {
    return fallback
  }
}

export function useSessionState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readSession(key, fallback))
  const [saved, setSaved] = useState(true)
  const current = useRef(value)
  const update = useCallback(
    (next: SetStateAction<T>) => {
      const resolved =
        typeof next === 'function' ? (next as (previous: T) => T)(current.current) : next
      current.current = resolved
      setValue(resolved)
      try {
        sessionStorage.setItem(sessionKey(key), JSON.stringify(resolved))
        setSaved(true)
      } catch {
        setSaved(false)
      }
    },
    [key],
  )
  return [value, update, saved] as const
}

export const reportDraftKeys = [
  'mbg-draft-description',
  'mbg-draft-step',
  'mbg-draft-place',
  'mbg-draft-location',
  'mbg-draft-audience',
  'mbg-draft-hidden',
  'mbg-draft-categories',
  'mbg-draft-match',
  'mbg-draft-recipients',
  'mbg-draft-urgency',
  'mbg-draft-duration',
]

export function clearReportDraft() {
  try {
    reportDraftKeys.forEach((key) => sessionStorage.removeItem(sessionKey(key)))
    return true
  } catch {
    return false
  }
}
