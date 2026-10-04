import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { InnovationDocument } from './components/InnovationText'
import {
  getInnovationPreview,
  getSafeExternalUrl,
  parseInnovationSections,
  toReadableInnovationText,
} from './innovation-content'

const importedDescription =
  '# BaWita ## Metadane - Źródło: <https://example.test/source> ## Linki ### Pobierz materiały - [Pobierz materiały](<https://example.test/file.zip>) ## Opis ### 1. Na czym polega rozwiązanie? **Drewniana tablica** wspiera pamięć i sprawność. ### 2. Jakich problemów dotyczy innowacja? Odpowiada na samotność seniorów. ### 3. Grupa docelowa Seniorzy i ich bliscy. ### 5. Czy to działa? &amp; testy pilotażowe opisano przez autorów.'

describe('innovation content', () => {
  it('extracts readable sections from flattened imported Markdown', () => {
    expect(parseInnovationSections(importedDescription)).toEqual([
      { title: 'Na czym polega rozwiązanie?', text: 'Drewniana tablica wspiera pamięć i sprawność.' },
      { title: 'Problem, na który odpowiada', text: 'Odpowiada na samotność seniorów.' },
      { title: 'Dla kogo?', text: 'Seniorzy i ich bliscy.' },
      { title: 'Co wiadomo o działaniu?', text: '& testy pilotażowe opisano przez autorów.' },
    ])
    expect(getInnovationPreview(importedDescription)).toBe('Drewniana tablica wspiera pamięć i sprawność.')
  })

  it('removes markup as text rather than interpreting it as HTML', () => {
    const text = toReadableInnovationText('<img src=x onerror=alert(1)> **Bezpieczny opis** [źródło](https://example.test)')

    expect(text).toBe('Bezpieczny opis źródło')
    expect(text).not.toContain('<img')
    expect(text).not.toContain('onerror')
  })

  it('keeps recommendation cards to two short sentences', () => {
    const description = '## Opis ### 1. Na czym polega rozwiązanie? Pierwsze zdanie rozwiązania. Drugie zdanie rozwiązania. Trzecie zdanie z pełnego dokumentu.'
    expect(getInnovationPreview(description)).toBe('Pierwsze zdanie rozwiązania. Drugie zdanie rozwiązania.')
  })

  it('summarises descriptions when markdown headings were flattened by the API', () => {
    const flattened = 'Dostępny transport publiczny Metadane - Źródło: ROPS Opis 1. Na czym polega rozwiązanie? Aplikacja pokazuje przystanki i ułatwia planowanie podróży. Działa z funkcjami dostępności. 2. Jakich problemów dotyczy innowacja? Brak informacji pasażerskiej.'
    expect(getInnovationPreview(flattened)).toBe('Aplikacja pokazuje przystanki i ułatwia planowanie podróży. Działa z funkcjami dostępności.')
  })

  it('allows only HTTP source links', () => {
    expect(getSafeExternalUrl('https://rops.krakow.pl/innowacje')).toBe('https://rops.krakow.pl/innowacje')
    expect(getSafeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(getSafeExternalUrl('local://innovations/bawita.md')).toBeNull()
  })

  it('renders extracted text as React text nodes, without injecting imported tags', () => {
    const markup = renderToStaticMarkup(
      createElement(InnovationDocument, {
        description: '## Na czym polega rozwiązanie? <img src=x onerror=alert(1)> Pomoc dla mieszkańców.',
      }),
    )

    expect(markup).toContain('<h2>Na czym polega rozwiązanie?</h2>')
    expect(markup).toContain('Pomoc dla mieszkańców.')
    expect(markup).not.toContain('<img')
    expect(markup).not.toContain('onerror=')
  })
})
