import { useState, useCallback } from 'react'
import { Mafs, Coordinates, Plot, Theme } from 'mafs'
import 'mafs/core.css'
import { create, all } from 'mathjs'

const math = create(all)

interface Props {
  expression?: string
}

function toMathJs(expr: string) {
  return expr.replace(/\*\*/g, '^')
}

function compileExpression(expr: string) {
  try {
    return math.compile(toMathJs(expr))
  } catch {
    return math.compile('sin(x) + 0.5*x')
  }
}

export function FunctionGrapher({ expression = 'sin(x) + 0.5*x' }: Props) {
  const initialExpression = toMathJs(expression)
  const [expr, setExpr] = useState(initialExpression)
  const [error, setError] = useState<string | null>(null)
  const [compiled, setCompiled] = useState(() => compileExpression(expression))

  const handleChange = useCallback((raw: string) => {
    setExpr(raw)
    try {
      const c = math.compile(toMathJs(raw))
      c.evaluate({ x: 0 }) // test
      setCompiled(c)
      setError(null)
    } catch {
      setError('Invalid expression')
    }
  }, [])

  const f = (x: number) => {
    try { return compiled.evaluate({ x }) as number }
    catch { return NaN }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          value={expr}
          onChange={e => handleChange(e.target.value)}
          placeholder="e.g. sin(x) + cos(2*x)"
          className="w-full bg-[#111827] border border-[#1e2d45] rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-violet-600 transition-colors"
        />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      <div className="rounded-xl overflow-hidden border border-[#1e2d45]">
        <Mafs viewBox={{ x: [-5, 5], y: [-3, 3] }}>
          <Coordinates.Cartesian />
          {!error && <Plot.OfX y={f} color={Theme.indigo} />}
        </Mafs>
      </div>

      <p className="text-slate-500 text-xs text-center">
        Use: sin, cos, tan, sqrt, abs, log, exp, pi, e — e.g. <code className="text-slate-400">sin(x)^2 + cos(x)^2</code>
      </p>
    </div>
  )
}
