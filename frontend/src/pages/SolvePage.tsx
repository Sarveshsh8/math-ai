import { useState } from 'react'
import { HeroInput } from '../components/solve/HeroInput'
import { StreamingExplanation } from '../components/solve/StreamingExplanation'
import { InlineVisualization } from '../components/solve/InlineVisualization'
import { PostSolveCTAs } from '../components/solve/PostSolveCTAs'
import { ProblemCard } from '../components/practice/ProblemCard'
import { MOCK_SOLVE_METADATA, MOCK_EXPLANATION, MOCK_PRACTICE, simulateStream } from '../mock/responses'
import { generatePractice, streamSolve } from '../api/client'
import type { SolveState, SolveMetadata, PracticeProblem, PracticeTopic } from '../types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function SolvePage() {
  const [state, setState] = useState<SolveState>('idle')
  const [metadata, setMetadata] = useState<SolveMetadata | null>(null)
  const [explanation, setExplanation] = useState('')
  const [explanationDone, setExplanationDone] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [practiceProblem, setPracticeProblem] = useState<PracticeProblem | null>(null)
  const [practiceTopic, setPracticeTopic] = useState<PracticeTopic>('algebra')
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSolve = async (problem: string) => {
    setState('loading')
    setExplanation('')
    setExplanationDone(false)
    setShowPractice(false)
    setPracticeProblem(null)
    setError(null)

    if (USE_MOCK) {
      setTimeout(() => {
        setMetadata(MOCK_SOLVE_METADATA)
        setState('result')
        simulateStream(
          MOCK_EXPLANATION,
          chunk => setExplanation(prev => prev + chunk),
          () => setExplanationDone(true),
        )
      }, 800)
      return
    }

    try {
      const gen = streamSolve(problem, (meta) => {
        setMetadata(meta)
        setState('result')
      })
      for await (const chunk of gen) {
        setExplanation(prev => prev + chunk)
      }
      setExplanationDone(true)
    } catch (e) {
      setError(`Backend error: ${e instanceof Error ? e.message : String(e)}`)
      setState('idle')
    }
  }

  const handleReset = () => {
    setState('idle')
    setMetadata(null)
    setExplanation('')
    setExplanationDone(false)
    setShowPractice(false)
    setPracticeProblem(null)
    setError(null)
  }

  const topicForResult = (meta: SolveMetadata): PracticeTopic => {
    if (meta.sympy_result.type === 'derivative') return 'differential_calculus'
    if (meta.sympy_result.type === 'integral') return 'integral_calculus'
    if (meta.sympy_result.type === 'equation') return 'algebra'
    if (meta.viz_hint?.type === 'unit_circle' || /sin|cos|tan/i.test(meta.sympy_result.input_expr)) {
      return 'trigonometry'
    }
    return 'algebra'
  }

  const handlePractice = async () => {
    if (!metadata) return
    const topic = topicForResult(metadata)
    setPracticeTopic(topic)
    setPracticeLoading(true)
    setError(null)

    if (USE_MOCK) {
      setPracticeProblem(MOCK_PRACTICE)
      setShowPractice(true)
      setPracticeLoading(false)
      return
    }

    try {
      const nextPractice = await generatePractice(topic, 'medium')
      setPracticeProblem(nextPractice)
      setShowPractice(true)
    } catch (e) {
      setError(`Practice error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setPracticeLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className={`transition-all duration-500 ${state === 'idle' ? 'flex-1 flex flex-col items-center justify-center px-6 pb-24' : 'px-6 pt-6 pb-4 border-b border-[#1e2d45]'}`}>
        {state === 'idle' && (
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
              Math<span className="text-violet-500">AI</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Enter any math problem. Get step-by-step understanding.
            </p>
          </div>
        )}
        <HeroInput onSolve={handleSolve} loading={state === 'loading'} />
        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      {state === 'loading' && (
        <div className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-32 bg-[#111827] rounded-2xl animate-pulse" />
              <div className="h-24 bg-[#111827] rounded-xl animate-pulse" />
            </div>
            <div className="h-72 bg-[#111827] rounded-2xl animate-pulse" />
          </div>
        </div>
      )}

      {state === 'result' && metadata && (
        <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <StreamingExplanation
              sympyResult={metadata.sympy_result}
              explanation={explanation}
              done={explanationDone}
            />
            {metadata.viz_hint && (
              <InlineVisualization hint={metadata.viz_hint} />
            )}
          </div>

          {explanationDone && (
            <PostSolveCTAs
              onPractice={handlePractice}
              onReset={handleReset}
              vizHint={metadata.viz_hint}
            />
          )}

          {practiceLoading && (
            <div className="bg-[#0d1226] border border-violet-900/40 rounded-2xl p-5 text-slate-400">
              Generating a similar problem...
            </div>
          )}

          {showPractice && practiceProblem && (
            <ProblemCard
              problem={practiceProblem}
              topic={practiceTopic}
              onDone={() => setShowPractice(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
