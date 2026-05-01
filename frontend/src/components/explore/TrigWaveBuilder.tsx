import { useState } from 'react'
import { Mafs, Coordinates, Plot, Theme } from 'mafs'
import 'mafs/core.css'

export function TrigWaveBuilder() {
  const [A, setA] = useState(1)
  const [B, setB] = useState(1)
  const [C, setC] = useState(0)
  const [D, setD] = useState(0)

  const f = (x: number) => A * Math.sin(B * x + C) + D

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="t-mono" style={{ fontSize: 14, color: 'var(--ink)', background: 'var(--paper-2)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
        f(x) = {A.toFixed(1)}·sin({B.toFixed(1)}x {C >= 0 ? '+' : '−'} {Math.abs(C).toFixed(2)}) {D >= 0 ? '+' : '−'} {Math.abs(D).toFixed(1)}
      </div>

      <div className="mafs-wrapper">
        <Mafs viewBox={{ x: [-2 * Math.PI, 2 * Math.PI], y: [-3, 3] }}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.indigo} />
        </Mafs>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'A · amplitude', value: A, set: setA, min: -3, max: 3, step: 0.1 },
          { label: 'B · frequency', value: B, set: setB, min: 0.1, max: 4, step: 0.1 },
          { label: 'C · phase', value: C, set: setC, min: -Math.PI, max: Math.PI, step: 0.05 },
          { label: 'D · vertical', value: D, set: setD, min: -2, max: 2, step: 0.1 },
        ].map(({ label, value, set, min, max, step }) => (
          <div key={label} className="slider-row" style={{ gridTemplateColumns: '1fr', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-ink)' }}>{value.toFixed(2)}</span>
            </div>
            <input type="range" className="r" min={min} max={max} step={step}
              value={value} onChange={e => set(Number(e.target.value))} />
          </div>
        ))}
      </div>
    </div>
  )
}
