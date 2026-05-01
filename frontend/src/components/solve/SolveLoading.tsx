interface Props {
  problem: string
}

const STEPS = [
  'Reading the question like a tutor',
  'Finding the exact symbolic path',
  'Turning the math into clear steps',
]

export function SolveLoading({ problem }: Props) {
  return (
    <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-6 items-stretch">
        <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-6 overflow-hidden relative">
          <div className="absolute right-6 top-6 flex gap-1">
            {[0, 1, 2].map(dot => (
              <span
                key={dot}
                className="h-2 w-2 rounded-full bg-violet-400 animate-pulse"
                style={{ animationDelay: `${dot * 180}ms` }}
              />
            ))}
          </div>

          <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">MathAI is thinking</p>
          <p className="text-white text-xl font-semibold leading-relaxed pr-16">
            {problem || 'Solving your question'}
          </p>
          <p className="text-slate-400 mt-4">
            I am checking the exact answer first, then building an explanation that feels like a teacher walking beside you.
          </p>

          <div className="mt-6 space-y-3">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-900/30 text-violet-300 text-sm">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{step}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[#0a0f1e] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500 animate-pulse"
                      style={{ width: `${45 + index * 18}%`, animationDelay: `${index * 240}ms` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d1226] border border-violet-900/40 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-violet-300 text-xs uppercase tracking-widest mb-4">Scratchpad</p>
            <div className="font-mono text-sm text-slate-400 space-y-3">
              <p>given: <span className="text-slate-200">{problem || 'your problem'}</span></p>
              <p>goal: exact answer + intuition</p>
              <p>method: symbolic solve, then human steps</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-[#1e2d45] bg-[#111827] p-4">
            <p className="text-slate-500 text-xs uppercase tracking-widest">While you wait</p>
            <p className="text-slate-300 text-sm mt-2">
              The best math answer is not the fastest one. It is the one you can repeat on the next problem.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
