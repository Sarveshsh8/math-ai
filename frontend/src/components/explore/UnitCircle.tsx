import { useState } from 'react'
import { Mafs, Coordinates, Circle, Point, Line, Theme } from 'mafs'
import 'mafs/core.css'

export function UnitCircle() {
  const [theta, setTheta] = useState(Math.PI / 4)

  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const tanT = Math.tan(theta)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
        {[
          { label: 'sin(θ)', value: sinT.toFixed(4), color: 'var(--plum)' },
          { label: 'cos(θ)', value: cosT.toFixed(4), color: 'var(--moss)' },
          { label: 'tan(θ)', value: Math.abs(tanT) > 99 ? '∞' : tanT.toFixed(4), color: 'var(--accent-ink)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 8px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', margin: '0 0 4px' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color, margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mafs-wrapper">
        <Mafs viewBox={{ x: [-1.6, 1.6], y: [-1.6, 1.6] }}>
          <Coordinates.Cartesian />
          <Circle center={[0, 0]} radius={1} color={Theme.indigo} fillOpacity={0} />
          <Line.Segment point1={[0, 0]} point2={[cosT, sinT]} color={Theme.foreground} />
          <Line.Segment point1={[cosT, 0]} point2={[cosT, sinT]} color={Theme.pink} style="dashed" />
          <Line.Segment point1={[0, 0]} point2={[cosT, 0]} color={Theme.green} style="dashed" />
          <Point x={cosT} y={sinT} color={Theme.foreground} />
        </Mafs>
      </div>

      <div className="slider-row">
        <span>angle (°)</span>
        <input type="range" className="r" min={0} max={2 * Math.PI} step={0.02}
          value={theta} onChange={e => setTheta(Number(e.target.value))} />
        <span style={{ color: 'var(--accent-ink)', textAlign: 'right' }}>{(theta * 180 / Math.PI).toFixed(0)}°</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[0, 30, 45, 60, 90, 120, 180, 270].map(deg => (
          <button key={deg} className="chip" onClick={() => setTheta(deg * Math.PI / 180)}>{deg}°</button>
        ))}
      </div>
    </div>
  )
}
