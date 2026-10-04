export type InnovationSection = {
  title: string
  text: string
}

type SectionDefinition = {
  title: string
  expression: string
}

// Scraped source files are persisted as Markdown. Some import paths flatten newlines, so the
// heading marker is the only reliable delimiter available to the browser.
const sectionDefinitions: SectionDefinition[] = [
  { title: 'Lokalizacja', expression: 'Lokalizacja\\b' },
  { title: 'Problem, na który odpowiada', expression: '(?:Jakich problemów dotyczy innowacja\\?\\s*|Problem\\b)' },
  { title: 'Dla kogo?', expression: 'Grupa docelowa\\b' },
  { title: 'Na czym polega rozwiązanie?', expression: 'Na czym polega rozwiązanie\\??' },
  { title: 'Kto może skorzystać?', expression: 'Kto może skorzystać z innowacji\\??' },
  { title: 'Wdrożenie', expression: 'Wdrożenie\\b' },
  { title: 'Rezultaty pilotażu', expression: 'Rezultaty pilotażu\\b' },
  { title: 'Co wiadomo o działaniu?', expression: 'Czy to działa\\??' },
  { title: 'Ograniczenia', expression: 'Ograniczenia\\b' },
  { title: 'Autorzy', expression: 'Autorzy\\b' },
]

const namedEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  quot: '"',
}

function decodeEntity(entity: string): string {
  const normalized = entity.toLowerCase()
  if (normalized in namedEntities) return namedEntities[normalized]

  const codePoint = normalized.startsWith('#x')
    ? Number.parseInt(normalized.slice(2), 16)
    : normalized.startsWith('#')
      ? Number.parseInt(normalized.slice(1), 10)
      : Number.NaN

  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return `&${entity};`
  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return `&${entity};`
  }
}

/**
 * Turns imported Markdown/HTML-like source text into plain text. The result is always rendered
 * by React as a text node; it is deliberately not HTML and must never be passed to
 * dangerouslySetInnerHTML.
 */
export function toReadableInnovationText(value: string | null | undefined): string {
  if (!value) return ''

  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\(\s*<?[^)]*\)/gu, '$1')
    .replace(/<(?:(?:https?|mailto):[^>]+)>/giu, '')
    .replace(/<\/?[a-z][^>]*>/giu, '')
    .replace(/(^|\s)#{1,6}\s+/gu, '$1')
    .replace(/(?:\*\*|__|~~|`)/gu, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (_, entity: string) => decodeEntity(entity))
    .replace(/[\t\r\n]+/gu, ' ')
    .replace(/\s{2,}/gu, ' ')
    .trim()
}

type SectionMarker = InnovationSection & { start: number; end: number }

function findSectionMarkers(value: string): SectionMarker[] {
  const markers: SectionMarker[] = []

  for (const definition of sectionDefinitions) {
    const matcher = new RegExp(
      `(^|\\s)#{2,6}\\s+(?:\\d+\\.\\s*)?${definition.expression}`,
      'giu',
    )
    for (const match of value.matchAll(matcher)) {
      const leadingWhitespace = match[1].length
      const start = (match.index ?? 0) + leadingWhitespace
      markers.push({
        title: definition.title,
        text: '',
        start,
        end: start + match[0].length - leadingWhitespace,
      })
    }
  }

  return markers.sort((left, right) => left.start - right.start)
}

export function parseInnovationSections(value: string | null | undefined): InnovationSection[] {
  if (!value) return []
  const markers = findSectionMarkers(value)
  const sections: InnovationSection[] = []

  for (const [index, marker] of markers.entries()) {
    const nextMarker = markers[index + 1]
    const text = toReadableInnovationText(value.slice(marker.end, nextMarker?.start))
    if (!text) continue

    const existing = sections.find((section) => section.title === marker.title)
    if (existing) {
      existing.text = `${existing.text} ${text}`
    } else {
      sections.push({ title: marker.title, text })
    }
  }

  return sections
}

export function getInnovationPreview(value: string | null | undefined, maxLength = 280): string {
  const sections = parseInnovationSections(value)
  const preferred = sections.find((section) => section.title === 'Na czym polega rozwiązanie?')
    ?? sections.find((section) => section.title === 'Problem, na który odpowiada')
    ?? sections.find((section) => section.title !== 'Lokalizacja')
  const readable = toReadableInnovationText(value)
  // Some API responses arrive with Markdown headings already flattened. In
  // that form the section parser cannot find markers, so cut away scraper
  // metadata using the visible section label before summarising.
  const solutionLabel = /na czym polega rozwiązanie\??/iu.exec(readable)
  const flattened = solutionLabel
    ? readable.slice((solutionLabel.index ?? 0) + solutionLabel[0].length)
    : readable
  const text = preferred?.text ?? flattened

  // Cards and recommendations show a summary, never the scraped document.
  // Keep at most two complete sentences so the actual solution remains easy
  // to scan; the full source is still available on the details page.
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/gu)
  const summary = sentences?.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim() || text

  if (summary.length <= maxLength) return summary
  const ending = summary.lastIndexOf(' ', maxLength - 1)
  return `${summary.slice(0, ending > 0 ? ending : maxLength).trimEnd()}…`
}

export function getSafeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null
  } catch {
    return null
  }
}
