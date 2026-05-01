import { useState } from 'react'
import { streamGrade } from '../../api/client'
import { MathRenderer } from '../shared/MathRenderer'
import { StreamingText } from '../shared/StreamingText'
import type { PracticeProblem } from '../../types'

interface Props {
  problem: PracticeProblem
  topic?: string
  onGraded?: (isCorrect: boolean, topic: string) => void
  onDone?: () => void
}

export function ProblemCard({ problem, topic = 'practice', onGraded, onDone }: Props) {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitted(true)
    setFeedback('')

    try {
      const gen = streamGrade(
        problem.problem,
        problem.problem_id,
        answer,
        problem.answer_latex,
        topic,
        grade => {
          setCorrect(grade.is_correct)
          setFeedback(`${grade.message}\n\n`)
          onGraded?.(grade.is_correct, topic)
        },
      )

      for await (const chunk of gen) {
        setFeedback(prev => prev + chunk)
      }
    } catch (e) {
      setCorrect(false)
      setFeedback(
        `Could not grade this answer: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-[#0d1226] border border-violet-900/40 rounded-2xl p-5 space-y-4">
      <p className="text-slate-400 text-xs uppercase tracking-widest">Similar Problem</p>

      <div className="text-lg">
        <MathRenderer latex={problem.problem.replace(/\$/g, '')} display />
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Your answer (LaTeX or plain text)..."
            className="w-full bg-[#111827] border border-[#1e2d45] rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-violet-600 transition-colors"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!answer.trim() || submitting}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {submitting ? 'Checking...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={() => setFeedback(`Hint: The answer is $${problem.answer_latex}$`)}
              className="bg-[#111827] hover:bg-[#1a2235] border border-[#1e2d45] text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Hint
            </button>
          </div>
        </form>
      ) : (
        <div className={`rounded-xl p-3 ${correct ? 'bg-green-900/20 border border-green-700/40' : 'bg-red-900/20 border border-red-700/40'}`}>
          <StreamingText text={feedback || 'Checking your answer...'} />
        </div>
      )}

      {feedback && !submitted && (
        <div className="bg-[#111827] rounded-xl p-3">
          <StreamingText text={feedback} />
        </div>
      )}

      {submitted && onDone && (
        <button
          onClick={onDone}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Back to solution ↩
        </button>
      )}
    </div>
  )
}
