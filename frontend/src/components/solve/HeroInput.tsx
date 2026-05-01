import { useState, useRef } from 'react'

interface Props {
  onSolve: (problem: string) => void
  loading: boolean
  initialValue?: string
}

const EXAMPLES = [
  '∫ x² dx',
  'd/dx[sin(x)cos(x)]',
  'sin(30°)',
  'x² + 5x + 6 = 0',
]

export function HeroInput({ onSolve, loading, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSolve(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste homework like: solve x^2 - 5x + 6 = 0"
          rows={3}
          className="w-full bg-[#111827] border border-[#1e2d45] rounded-2xl px-6 py-5 text-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="absolute right-4 bottom-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl font-medium text-sm transition-colors"
        >
          {loading ? 'Solving...' : 'Solve'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="text-slate-500 text-sm self-center">Try one:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            type="button"
            onClick={() => { setValue(ex); textareaRef.current?.focus() }}
            className="text-slate-400 hover:text-violet-400 text-sm bg-[#111827] border border-[#1e2d45] px-3 py-1 rounded-full transition-colors hover:border-violet-600"
          >
            {ex}
          </button>
        ))}
      </div>

      <p className="text-center text-slate-600 text-xs mt-3">
        Cmd/Ctrl + Enter to solve
      </p>
    </form>
  )
}
