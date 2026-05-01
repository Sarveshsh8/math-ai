import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HeroInput } from '../components/solve/HeroInput'
import { StreamingExplanation } from '../components/solve/StreamingExplanation'
import { InlineVisualization } from '../components/solve/InlineVisualization'
import { PostSolveCTAs } from '../components/solve/PostSolveCTAs'
import { SolveLoading } from '../components/solve/SolveLoading'
import { ProblemCard } from '../components/practice/ProblemCard'
import { MOCK_SOLVE_METADATA, MOCK_EXPLANATION, MOCK_PRACTICE, simulateStream } from '../mock/responses'
import { generatePractice, streamSolve } from '../api/client'
import type { SolveState, SolveMetadata, PracticeProblem, PracticeTopic } from '../types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

function readStoredList(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []
  } catch {
    return []
  }
}

function readStoredNumber(key: string) {
  const value = Number(localStorage.getItem(key) ?? '0')
  return Number.isFinite(value) ? value : 0
}

export function SolvePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sharedProblem = searchParams.get('q') ?? ''
  const autoRunRef = useRef(false)
  const [state, setState] = useState<SolveState>('idle')
  const [currentProblem, setCurrentProblem] = useState('')
  const [metadata, setMetadata] = useState<SolveMetadata | null>(null)
  const [explanation, setExplanation] = useState('')
  const [explanationDone, setExplanationDone] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [practiceProblem, setPracticeProblem] = useState<PracticeProblem | null>(null)
  const [practiceTopic, setPracticeTopic] = useState<PracticeTopic>('algebra')
  const [practiceLoading, setPracticeLoading] = useState(false)
  const [shareStatus, setShareStatus] = useState('')
  const [practiceStreak, setPracticeStreak] = useState(() => readStoredNumber('mathai.practiceStreak'))
  const [weakAreas, setWeakAreas] = useState<string[]>(() => readStoredList('mathai.weakAreas'))
  const [recentProblems, setRecentProblems] = useState<string[]>(() => readStoredList('mathai.recentProblems'))
  const [error, setError] = useState<string | null>(null)

  const handleSolve = useCallback(async (problem: string, options: { preserveUrl?: boolean } = {}) => {
    const trimmed = problem.trim()
    if (!trimmed) return
    if (!options.preserveUrl) {
      setSearchParams({ q: trimmed })
    }
    setCurrentProblem(trimmed)
    setShareStatus('')
    setState('loading')
    setExplanation('')
    setExplanationDone(false)
    setShowPractice(false)
    setPracticeProblem(null)
    setError(null)
    setRecentProblems(prev => {
      const next = [trimmed, ...prev.filter(item => item !== trimmed)].slice(0, 5)
      localStorage.setItem('mathai.recentProblems', JSON.stringify(next))
      return next
    })

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
      const gen = streamSolve(trimmed, (meta) => {
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
  }, [setSearchParams])

  useEffect(() => {
    if (!sharedProblem || autoRunRef.current) return
    autoRunRef.current = true
    queueMicrotask(() => {
      void handleSolve(sharedProblem, { preserveUrl: true })
    })
  }, [handleSolve, sharedProblem])

  const handleReset = () => {
    setState('idle')
    setCurrentProblem('')
    setMetadata(null)
    setExplanation('')
    setExplanationDone(false)
    setShowPractice(false)
    setPracticeProblem(null)
    setShareStatus('')
    setError(null)
    setSearchParams({})
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

  const handleShare = async () => {
    const problem = currentProblem || sharedProblem || metadata?.sympy_result.input_expr || ''
    const url = new URL(window.location.href)
    url.pathname = '/'
    url.search = ''
    url.searchParams.set('q', problem)

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MathAI explanation',
          text: `I used MathAI to understand: ${problem}`,
          url: url.toString(),
        })
        setShareStatus('Shared.')
        return
      }
      await navigator.clipboard.writeText(url.toString())
      setShareStatus('Link copied.')
    } catch {
      setShareStatus('Could not share. Copy the page URL instead.')
    }
  }

  const handlePracticeGraded = (isCorrect: boolean, topic: string) => {
    if (isCorrect) {
      setPracticeStreak(prev => {
        const next = prev + 1
        localStorage.setItem('mathai.practiceStreak', String(next))
        return next
      })
      return
    }

    setWeakAreas(prev => {
      const label = topic.replace(/_/g, ' ')
      const next = [label, ...prev.filter(item => item !== label)].slice(0, 3)
      localStorage.setItem('mathai.weakAreas', JSON.stringify(next))
      return next
    })
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
              Get the exact answer, then understand every step.
            </p>
            <p className="text-slate-500 text-sm mt-3">
              Built for homework, exam prep, and the moment a confusing step finally clicks.
            </p>
          </div>
        )}
        <HeroInput
          key={sharedProblem || 'new-problem'}
          onSolve={handleSolve}
          loading={state === 'loading'}
          initialValue={sharedProblem}
        />
        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
        {state === 'idle' && recentProblems.length > 0 && (
          <div className="max-w-2xl mx-auto w-full mt-5">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2 text-center">Recent Problems</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {recentProblems.map(problem => (
                <button
                  key={problem}
                  type="button"
                  onClick={() => handleSolve(problem)}
                  className="text-slate-400 hover:text-violet-400 text-sm bg-[#111827] border border-[#1e2d45] px-3 py-1 rounded-full transition-colors hover:border-violet-600"
                >
                  {problem}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {state === 'loading' && (
        <SolveLoading problem={currentProblem} />
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
              onShare={handleShare}
              shareStatus={shareStatus}
              vizHint={metadata.viz_hint}
            />
          )}

          {explanationDone && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#0d1226] border border-[#1e2d45] rounded-2xl p-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest">Practice Streak</p>
                <p className="text-white text-2xl font-bold mt-2">{practiceStreak}</p>
                <p className="text-slate-500 text-sm">Correct similar problems solved.</p>
              </div>
              <div className="bg-[#0d1226] border border-[#1e2d45] rounded-2xl p-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest">Weak Areas</p>
                <p className="text-slate-300 text-sm mt-2">
                  {weakAreas.length ? weakAreas.join(', ') : 'None yet. Missed practice will appear here.'}
                </p>
              </div>
              <div className="bg-[#0d1226] border border-violet-900/40 rounded-2xl p-4">
                <p className="text-violet-300 text-xs uppercase tracking-widest">Plus Preview</p>
                <p className="text-white font-semibold mt-2">Exam Practice Mode</p>
                <p className="text-slate-500 text-sm">Unlimited sets, saved history, and weekly parent progress reports.</p>
              </div>
            </div>
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
              onGraded={handlePracticeGraded}
              onDone={() => setShowPractice(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
