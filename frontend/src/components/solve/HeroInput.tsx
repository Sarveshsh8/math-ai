import { useState, useRef } from 'react'

interface Props {
  onSolve: (problem: string) => void
  loading: boolean
  initialValue?: string
}

const EXAMPLES = [
  { label: '∫ x² dx', input: '∫ x² dx' },
  { label: 'd/dx[sin(x)cos(x)]', input: 'd/dx[sin(x)cos(x)]' },
  { label: 'sin(30°)', input: 'sin(30°)' },
  { label: 'x² + 5x + 6 = 0', input: 'x² + 5x + 6 = 0' },
]

export function HeroInput({ onSolve, loading, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const submit = (raw?: string) => {
    const inp = (raw ?? value).trim()
    if (!inp || loading) return
    onSolve(inp)
  }

  return (
    <form className="input-card" onSubmit={e => { e.preventDefault(); submit() }}>
      <textarea
        ref={taRef}
        className="input-card__field"
        placeholder="e.g. d/dx[x³ + sin(x)]"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
        }}
        rows={2}
        disabled={loading}
      />
      <div className="input-card__bar">
        <div className="input-card__chips">
          {EXAMPLES.map(ex => (
            <button
              key={ex.label}
              type="button"
              className="chip"
              onClick={() => { setValue(ex.input); submit(ex.input) }}
            >
              {ex.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            type="submit"
            className="btn btn--accent"
            style={{ padding: '10px 18px', fontSize: 13 }}
            disabled={!value.trim() || loading}
          >
            {loading ? 'Solving…' : 'Solve →'}
          </button>
        </div>
      </div>
    </form>
  )
}
