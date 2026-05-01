import { useNavigate } from 'react-router-dom'
import { Sticker } from '../shared/Sticker'
import type { VizHint } from '../../types'

interface Props {
  onPractice: () => void
  onReset: () => void
  onShare: () => void
  shareStatus: string
  vizHint: VizHint | null
}

export function PostSolveCTAs({ onPractice, onReset, onShare, shareStatus, vizHint }: Props) {
  const navigate = useNavigate()

  return (
    <div className="post-ctas">
      <div>
        <div className="t-eyebrow" style={{ marginBottom: 6 }}>— What now?</div>
        <div className="post-ctas__heading">
          Don't stop here. <em style={{ fontStyle: 'italic', color: 'var(--accent-ink)' }}>Make it stick.</em>
        </div>
        {shareStatus && (
          <p className="t-mono" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{shareStatus}</p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn--accent" onClick={onPractice}>Practice this →</button>
        {vizHint && (
          <button className="btn btn--ghost" onClick={() => navigate(`/explore?viz=${vizHint.type}`)}>
            Open in Explore
          </button>
        )}
        <button className="btn btn--ghost" onClick={onShare}>Share</button>
        <button className="btn btn--ghost" onClick={onReset}>New problem</button>
        <Sticker dot>solved</Sticker>
      </div>
    </div>
  )
}
