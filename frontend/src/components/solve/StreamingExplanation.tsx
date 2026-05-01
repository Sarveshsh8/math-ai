import { MathRenderer } from '../shared/MathRenderer'
import { StreamingText } from '../shared/StreamingText'
import { Sticker } from '../shared/Sticker'
import type { SympyResult } from '../../types'

interface Props {
  sympyResult: SympyResult
  explanation: string
  done: boolean
}

export function StreamingExplanation({ sympyResult, explanation, done }: Props) {
  return (
    <div className="panel">
      <div className="panel__head">
        <h3 className="panel__title">Solution</h3>
        <Sticker dot>{done ? 'done' : 'streaming'}</Sticker>
      </div>

      <div className="answer-box">
        <span className="answer-box__label">answer</span>
        <div style={{ fontSize: 24, textAlign: 'center', padding: '6px 0' }}>
          <MathRenderer latex={sympyResult.latex_result} display />
        </div>
      </div>

      <div className="panel__body stream">
        {sympyResult.steps.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {sympyResult.steps.map((step, i) => (
              <div key={i} className="step">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="t-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-ink)' }}>
                    Step {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6 }}>{step}</p>
              </div>
            ))}
          </div>
        )}

        {explanation && (
          <>
            <div className="t-eyebrow" style={{ marginBottom: 10 }}>— Explanation</div>
            <StreamingText text={explanation} />
            {!done && <span className="cursor" />}
          </>
        )}
      </div>
    </div>
  )
}
