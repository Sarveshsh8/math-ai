import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { VizType } from '../types'
import { DerivativeExplorer } from '../components/explore/DerivativeExplorer'
import { IntegralVisualizer } from '../components/explore/IntegralVisualizer'
import { UnitCircle } from '../components/explore/UnitCircle'
import { TrigWaveBuilder } from '../components/explore/TrigWaveBuilder'
import { FunctionGrapher } from '../components/explore/FunctionGrapher'
import { Sticker } from '../components/shared/Sticker'

const TABS: { id: VizType; label: string; desc: string }[] = [
  { id: 'derivative_explorer', label: 'Derivative', desc: 'Drag x. Watch the tangent line track f′(x).' },
  { id: 'integral_visualizer', label: 'Integral', desc: 'Slide partitions until Riemann sums converge.' },
  { id: 'unit_circle', label: 'Unit Circle', desc: 'sin, cos, tan as positions on the unit circle.' },
  { id: 'trig_wave', label: 'Wave Builder', desc: 'A·sin(Bx + C) + D — change one slider at a time.' },
  { id: 'function_graph', label: 'Grapher', desc: 'Plot any expression. Live, no compile button.' },
]

export function ExplorePage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<VizType>(() => {
    const viz = searchParams.get('viz') as VizType | null
    return viz && TABS.find(t => t.id === viz) ? viz : 'derivative_explorer'
  })
  const cur = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="explore page-fade">
      <div className="explore__head">
        <Sticker rotate="l" variant="accent">interactive</Sticker>
        <h1 className="t-display" style={{
          fontSize: 'clamp(48px, 7vw, 96px)', letterSpacing: '-0.03em',
          lineHeight: 0.95, margin: '14px 0 8px',
        }}>
          Explore.
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 16, maxWidth: 580, margin: 0 }}>
          Five playgrounds for the most-asked-about ideas in calc &amp; trig.
          Everything is live — no scrubbers, no buffering.
        </p>
      </div>

      <div className="tab-row">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'tab--active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="t-mono" style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
        — {cur.desc}
      </p>

      <div className="viz-card">
        {tab === 'derivative_explorer' && <DerivativeExplorer />}
        {tab === 'integral_visualizer' && <IntegralVisualizer />}
        {tab === 'unit_circle' && <UnitCircle />}
        {tab === 'trig_wave' && <TrigWaveBuilder />}
        {tab === 'function_graph' && <FunctionGrapher />}
      </div>
    </div>
  )
}
