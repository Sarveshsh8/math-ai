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
    url.pathname = '/solve'
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
    <div className={`solve solve--${state} page-fade`}>
      <div className="solve__hero">
        {state === 'idle' && (
          <>
            <div style={{ marginBottom: 22 }}>
              <span className="sticker sticker--accent sticker--rotate-l">
                <span className="sticker__dot" />type anything math-shaped
              </span>
            </div>
            <h1 className="solve__title">
              Got a problem?<br /><em>Let's see it.</em>
            </h1>
            <p className="solve__sub">
              Plain math notation works. LaTeX works. Press{' '}
              <span className="t-mono" style={{ color: 'var(--ink)' }}>⌘ + Enter</span> to solve.
            </p>
          </>
        )}

        <HeroInput
          key={sharedProblem || 'new-problem'}
          onSolve={handleSolve}
          loading={state === 'loading'}
          initialValue={sharedProblem}
        />

        {error && (
          <p className="t-mono" style={{ marginTop: 12, color: 'oklch(0.6 0.18 30)', fontSize: 13, textAlign: 'center' }}>{error}</p>
        )}

        {state === 'idle' && recentProblems.length > 0 && (
          <div style={{ maxWidth: 720, margin: '20px auto 0', width: '100%' }}>
            <p className="t-eyebrow" style={{ marginBottom: 8, textAlign: 'center' }}>Recent</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {recentProblems.map(problem => (
                <button key={problem} type="button" className="chip" onClick={() => handleSolve(problem)}>
                  {problem}
                </button>
              ))}
            </div>
          </div>
        )}

        {state === 'result' && (
          <button type="button" className="btn btn--ghost" onClick={handleReset}
            style={{ padding: '8px 14px', fontSize: 13, marginTop: 12 }}>
            Reset
          </button>
        )}
      </div>

      {state === 'loading' && <SolveLoading problem={currentProblem} />}

      {state === 'result' && metadata && (
        <div className="solve__result">
          <div className="result-grid">
            <StreamingExplanation
              sympyResult={metadata.sympy_result}
              explanation={explanation}
              done={explanationDone}
            />
            {metadata.viz_hint
              ? <InlineVisualization hint={metadata.viz_hint} />
              : <div className="panel" style={{ minHeight: 200, display: 'grid', placeItems: 'center', color: 'var(--ink-4)' }}>
                  <span className="t-mono" style={{ fontSize: 12 }}>no visualization for this problem type</span>
                </div>
            }
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
              <div className="panel">
                <div className="panel__body">
                  <p className="t-eyebrow" style={{ marginBottom: 8 }}>Practice Streak</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, margin: '0 0 4px' }}>{practiceStreak}</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>correct similar problems</p>
                </div>
              </div>
              <div className="panel">
                <div className="panel__body">
                  <p className="t-eyebrow" style={{ marginBottom: 8 }}>Weak Areas</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
                    {weakAreas.length ? weakAreas.join(', ') : 'None yet — missed practice will appear here.'}
                  </p>
                </div>
              </div>
              <div className="panel" style={{ borderColor: 'var(--accent-soft)' }}>
                <div className="panel__body">
                  <p className="t-eyebrow" style={{ marginBottom: 8, color: 'var(--accent-ink)' }}>Plus Preview</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 4px' }}>Exam Practice Mode</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Unlimited sets, saved history, progress reports.</p>
                </div>
              </div>
            </div>
          )}

          {practiceLoading && (
            <div className="panel" style={{ marginTop: 20, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3)' }}>
                <span className="cursor" />
                Generating a similar problem…
              </div>
            </div>
          )}

          {showPractice && practiceProblem && (
            <div style={{ marginTop: 20 }}>
              <ProblemCard
                problem={practiceProblem}
                topic={practiceTopic}
                onGraded={handlePracticeGraded}
                onDone={() => setShowPractice(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
