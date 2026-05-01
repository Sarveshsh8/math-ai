import { useNavigate } from 'react-router-dom'
import type { VizHint } from '../../types'

interface Props {
  onPractice: () => void
  onReset: () => void
  vizHint: VizHint | null
}

export function PostSolveCTAs({ onPractice, onReset, vizHint }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <button
        onClick={onPractice}
        className="flex-1 min-w-40 bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
      >
        Try a similar problem →
      </button>
      {vizHint && (
        <button
          onClick={() => navigate(`/explore?viz=${vizHint.type}`)}
          className="flex-1 min-w-40 bg-[#111827] hover:bg-[#1a2235] border border-[#1e2d45] hover:border-violet-600 text-slate-300 hover:text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
        >
          Explore this concept ↗
        </button>
      )}
      <button
        onClick={onReset}
        className="bg-[#111827] hover:bg-[#1a2235] border border-[#1e2d45] text-slate-400 hover:text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
      >
        Solve another
      </button>
    </div>
  )
}
