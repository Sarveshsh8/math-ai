import { StreamingText } from '../shared/StreamingText'
import { MathRenderer } from '../shared/MathRenderer'
import type { SympyResult } from '../../types'

interface Props {
  sympyResult: SympyResult
  explanation: string
  done: boolean
}

export function StreamingExplanation({ sympyResult, explanation, done }: Props) {
  return (
    <div className="space-y-4">
      {/* Answer — always shown immediately */}
      <div className="bg-[#0d1226] border border-violet-900/40 rounded-2xl p-5">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">Answer</p>
        <div className="text-3xl font-light">
          <MathRenderer latex={sympyResult.latex_result} display />
        </div>
      </div>

      {/* SymPy steps — compact */}
      <div className="bg-[#111827] rounded-xl p-4">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Key steps</p>
        <ol className="space-y-1">
          {sympyResult.steps.map((step, i) => (
            <li key={i} className="text-slate-300 text-sm flex gap-2">
              <span className="text-violet-500 font-mono">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Streaming explanation */}
      {explanation && (
        <div className="bg-[#111827] rounded-xl p-4">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Explanation</p>
          <StreamingText text={explanation} />
          {!done && (
            <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      )}
    </div>
  )
}
