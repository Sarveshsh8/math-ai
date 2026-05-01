import { useState } from 'react'
import { Mafs, Coordinates, Plot, Point, Line, Theme } from 'mafs'
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
    <div className="space-y-3">
      <div className="flex gap-6 text-sm text-slate-300 px-1">
        <span>x = <strong className="text-white">{xPos.toFixed(2)}</strong></span>
        <span>f(x) = <strong className="text-white">{isFinite(y0) ? y0.toFixed(3) : '—'}</strong></span>
        <span>f′(x) = <strong className="text-violet-400">{isFinite(slope) ? slope.toFixed(3) : '—'}</strong></span>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#1e2d45]">
        <Mafs viewBox={{ x: [-4, 4], y: [-4, 4] }}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.indigo} />
          <Plot.OfX y={tangent} color={Theme.orange} style="dashed" />
          <Point x={xPos} y={y0} color={Theme.foreground} />
          <Line.ThroughPoints
            point1={[xPos - 0.01, tangent(xPos - 0.01)]}
            point2={[xPos + 0.01, tangent(xPos + 0.01)]}
            color={Theme.orange}
            style="dashed"
          />
        </Mafs>
      </div>

      <input
        type="range"
        min={-3.5} max={3.5} step={0.05}
        value={xPos}
        onChange={e => setXPos(Number(e.target.value))}
        className="w-full accent-violet-600"
      />
      <p className="text-slate-500 text-xs text-center">Drag slider to move the point — tangent line tracks f′(x)</p>
    </div>
  )
}
