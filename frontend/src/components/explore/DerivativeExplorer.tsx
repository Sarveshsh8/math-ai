import { useState } from 'react'
import { Mafs, Coordinates, Plot, Point, Theme } from 'mafs'
import 'mafs/core.css'
import { create, all } from 'mathjs'

const math = create(all)

interface Props {
  expression?: string
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

export function DerivativeExplorer({ expression = 'x^2' }: Props) {
  const [xPos, setXPos] = useState(1)
  const f = makeF(expression)

  const h = 1e-6
  const slope = (f(xPos + h) - f(xPos - h)) / (2 * h)
  const y0 = f(xPos)
  const tangent = (x: number) => slope * (x - xPos) + y0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)', padding: '0 4px' }}>
        <span>x = <strong style={{ color: 'var(--ink)' }}>{xPos.toFixed(2)}</strong></span>
        <span>f(x) = <strong style={{ color: 'var(--ink)' }}>{isFinite(y0) ? y0.toFixed(3) : '—'}</strong></span>
        <span>f′(x) = <strong style={{ color: 'var(--accent-ink)' }}>{isFinite(slope) ? slope.toFixed(3) : '—'}</strong></span>
      </div>

      <div className="mafs-wrapper">
        <Mafs viewBox={{ x: [-4, 4], y: [-4, 4] }}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.indigo} />
          <Plot.OfX y={tangent} color={Theme.orange} style="dashed" />
          <Point x={xPos} y={y0} color={Theme.foreground} />
        </Mafs>
      </div>

      <div className="slider-row">
        <span>tangent x</span>
        <input type="range" className="r" min={-3.5} max={3.5} step={0.05}
          value={xPos} onChange={e => setXPos(Number(e.target.value))} />
        <span style={{ color: 'var(--accent-ink)', textAlign: 'right' }}>{xPos.toFixed(2)}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', textAlign: 'center', margin: 0 }}>
        Drag slider to move the point — tangent line tracks f′(x)
      </p>
    </div>
  )
}
