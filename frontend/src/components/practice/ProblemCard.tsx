import { useState } from 'react'
import { streamGrade } from '../../api/client'
import { MathRenderer } from '../shared/MathRenderer'
import { StreamingText } from '../shared/StreamingText'
import { Sticker } from '../shared/Sticker'
import type { PracticeProblem } from '../../types'

interface Props {
  problem: PracticeProblem
  topic?: string
  onGraded?: (isCorrect: boolean, topic: string) => void
  onDone?: () => void
}

const MAX_ANSWER_CHARS = 500

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
      setFeedback(`Could not grade: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <h3 className="panel__title">Practice</h3>
        <Sticker variant="ink" dot>generated</Sticker>
      </div>
      <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="t-eyebrow" style={{ marginBottom: 4 }}>— Similar problem</div>

        <div style={{ fontSize: 22, padding: '14px 16px', background: 'var(--paper-2)', borderRadius: 12, border: '1px solid var(--line)' }}>
          <MathRenderer latex={problem.problem.replace(/\$/g, '')} display />
          <span style={{ color: 'var(--ink-3)' }}> = ?</span>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={answer}
                onChange={e => setAnswer(e.target.value.slice(0, MAX_ANSWER_CHARS))}
                placeholder="your answer (e.g. 4x^3 + 2cos(x))"
                className="t-mono"
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: '1px solid var(--line-strong)', background: 'var(--paper)',
                  fontSize: 14, outline: 'none', color: 'var(--ink)',
                }}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit(e as unknown as React.FormEvent)}
              />
              <button type="submit" className="btn btn--primary" disabled={!answer.trim() || submitting}>
                {submitting ? '…' : 'Check'}
              </button>
            </div>
            <p style={{ color: 'var(--ink-3)', fontSize: 12, textAlign: 'right' }}>
              {answer.length}/{MAX_ANSWER_CHARS}
            </p>
            <button type="button" className="btn btn--ghost"
              style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: 12 }}
              onClick={() => setFeedback(`Hint: The answer is $${problem.answer_latex}$`)}>
              Hint
            </button>
          </form>
        ) : (
          <div style={{
            padding: 14, borderRadius: 10,
            background: correct === null ? 'var(--paper-2)' : correct ? 'oklch(0.95 0.06 145)' : 'oklch(0.95 0.06 30)',
            border: `1px solid ${correct === null ? 'var(--line)' : correct ? 'var(--moss)' : 'oklch(0.7 0.18 30)'}`,
            fontSize: 13, lineHeight: 1.5, color: 'var(--ink)',
          }}>
            <StreamingText text={feedback || 'Checking your answer…'} />
          </div>
        )}

        {feedback && !submitted && (
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--paper-2)', border: '1px solid var(--line)' }}>
            <StreamingText text={feedback} />
          </div>
        )}

        {submitted && onDone && (
          <button className="btn btn--ghost" onClick={onDone} style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: 13 }}>
            Back to solution ↩
          </button>
        )}
      </div>
    </div>
  )
}
