import { getInnovationPreview, parseInnovationSections, toReadableInnovationText } from '../innovation-content'

export function InnovationPreview({ description }: { description: string }) {
  return <p className="innovation-description">{getInnovationPreview(description)}</p>
}

export function InnovationDocument({ description }: { description: string }) {
  const sections = parseInnovationSections(description)
  if (!sections.length) return <p className="innovation-description">{toReadableInnovationText(description)}</p>

  return (
    <div className="innovation-document">
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.text}</p>
        </section>
      ))}
    </div>
  )
}
