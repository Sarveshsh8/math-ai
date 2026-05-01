import { MathRenderer } from './MathRenderer'

interface Props {
  text: string
  className?: string
}

// Splits a string into segments: plain text and LaTeX ($$...$$ or $...$)
function parseSegments(text: string) {
  const segments: { type: 'text' | 'display' | 'inline'; content: string }[] = []
  const re = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: 'text', content: text.slice(last, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('$$')) {
      segments.push({ type: 'display', content: raw.slice(2, -2) })
    } else {
      segments.push({ type: 'inline', content: raw.slice(1, -1) })
    }
    last = match.index + raw.length
  }
  if (last < text.length) {
    segments.push({ type: 'text', content: text.slice(last) })
  }
  return segments
}

// Render **bold** markers in plain text
function renderPlainText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export function StreamingText({ text, className }: Props) {
  const segments = parseSegments(text)

  return (
    <div className={`text-slate-200 leading-relaxed whitespace-pre-wrap ${className ?? ''}`}>
      {segments.map((seg, i) => {
        if (seg.type === 'display') {
          return (
            <div key={i} className="my-3 overflow-x-auto">
              <MathRenderer latex={seg.content} display />
            </div>
          )
        }
        if (seg.type === 'inline') {
          return <MathRenderer key={i} latex={seg.content} />
        }
        return <span key={i}>{renderPlainText(seg.content)}</span>
      })}
    </div>
  )
}
