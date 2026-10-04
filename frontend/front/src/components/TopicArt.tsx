type Topic = 'memory' | 'language' | 'work' | 'neighbors' | 'volunteer'

// Code-native illustrations, deliberately schematic rather than product photographs.
export function TopicArt({
  topic,
  className = '',
  label = '',
}: {
  topic: Topic
  className?: string
  label?: string
}) {
  return (
    <img
      className={`topic-art ${className}`}
      src={`/illustrations/${topic}.svg`}
      alt={label}
      width="320"
      height="220"
      decoding="async"
    />
  )
}

export function InnovationArt({ id, large = false }: { id: string; large?: boolean }) {
  const topic = id === 'bawita' ? 'memory' : id === 'bajkala' ? 'language' : 'work'
  return (
    <figure className={`innovation-art ${large ? 'large' : ''}`}>
      <TopicArt topic={topic} />
      {large && <figcaption>Ilustracja poglądowa — nie fotografia rozwiązania</figcaption>}
    </figure>
  )
}
