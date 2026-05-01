interface Props {
  problem: string
}

export function SolveLoading({ problem }: Props) {
  return (
    <div style={{ flex: 1, padding: 32, maxWidth: 1160, margin: '0 auto', width: '100%' }}>
      <div className="result-grid">
        <div className="panel" style={{ minHeight: 340, display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            <span className="cursor" />
            {problem ? `solving: ${problem}` : 'running symbolic engine…'}
          </div>
        </div>
        <div className="panel" style={{ minHeight: 340, display: 'grid', placeItems: 'center', color: 'var(--ink-4)' }}>
          <span className="t-mono" style={{ fontSize: 12 }}>visualization loading…</span>
        </div>
      </div>
    </div>
  )
}
