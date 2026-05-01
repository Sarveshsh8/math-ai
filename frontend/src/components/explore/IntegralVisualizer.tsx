import { useState } from 'react'
import { Mafs, Coordinates, Plot, Polygon, Theme } from 'mafs'
import 'mafs/core.css'
import { create, all } from 'mathjs'

const math = create(all)

interface Props {
  expression?: string
  defaultA?: number
  defaultB?: number
}

function makeF(expr: string) {
  try {
    const compiled = math.compile(expr.replace(/\*\*/g, '^'))
    return (x: number) => {
      try { return compiled.evaluate({ x }) as number }
      catch { return NaN }
    }
  } catch {
    return (x: number) => x * x
  }
}

export function IntegralVisualizer({ expression = 'x^2', defaultA = 0, defaultB = 2 }: Props) {
  const [n, setN] = useState(8)
  const [a] = useState(defaultA)
  const [b] = useState(defaultB)
  const f = makeF(expression)

  const dx = (b - a) / n
  const rects = Array.from({ length: n }, (_, i) => {
    const x = a + i * dx
    const midX = x + dx / 2
    const height = f(midX)
    return { x, midX, height, dx }
  })

  const approxArea = rects.reduce((sum, r) => sum + r.height * r.dx, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)', flexWrap: 'wrap' }}>
        <span>n = <strong style={{ color: 'var(--ink)' }}>{n}</strong> rectangles</span>
        <span>≈ area = <strong style={{ color: 'var(--accent-ink)' }}>{approxArea.toFixed(4)}</strong></span>
        <span style={{ color: 'var(--ink-4)' }}>midpoint rule</span>
      </div>

      <div className="mafs-wrapper">
        <Mafs viewBox={{ x: [a - 0.5, b + 0.5], y: [-0.5, Math.max(...rects.map(r => Math.abs(r.height))) + 0.5] }}>
          <Coordinates.Cartesian />
          {rects.map((r, i) => (
            <Polygon key={i}
              points={[[r.x, 0], [r.x, r.height], [r.x + r.dx, r.height], [r.x + r.dx, 0]]}
              color={Theme.indigo} fillOpacity={0.3}
            />
          ))}
          <Plot.OfX y={f} color={Theme.orange} />
        </Mafs>
      </div>

      <div className="slider-row">
        <span>partitions</span>
        <input type="range" className="r" min={2} max={100} step={1}
          value={n} onChange={e => setN(Number(e.target.value))} />
        <span style={{ color: 'var(--accent-ink)', textAlign: 'right' }}>{n}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textAlign: 'center', margin: 0 }}>
        More rectangles → area converges to the true integral
      </p>
    </div>
  )
}
