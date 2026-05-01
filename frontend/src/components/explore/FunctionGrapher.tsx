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
  const [expr, setExpr] = useState(toMathJs(expression))
  const [error, setError] = useState<string | null>(null)
  const [compiled, setCompiled] = useState(() => compileExpression(expression))

  const handleChange = useCallback((raw: string) => {
    setExpr(raw)
    try {
      const c = math.compile(toMathJs(raw))
      c.evaluate({ x: 0 })
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        value={expr}
        onChange={e => handleChange(e.target.value)}
        placeholder="e.g. sin(x) + cos(2*x)"
        className="t-mono"
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 12,
          border: `1px solid ${error ? 'oklch(0.7 0.18 30)' : 'var(--line-strong)'}`,
          background: 'var(--paper-2)', fontSize: 15, outline: 'none', color: 'var(--ink)',
        }}
      />
      {error && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'oklch(0.6 0.18 30)', margin: 0 }}>{error}</p>}

      <div className="mafs-wrapper">
        <Mafs viewBox={{ x: [-5, 5], y: [-3, 3] }}>
          <Coordinates.Cartesian />
          {!error && <Plot.OfX y={f} color={Theme.indigo} />}
        </Mafs>
      </div>

      <p className="t-mono" style={{ fontSize: 11, color: 'var(--ink-4)', textAlign: 'center', margin: 0 }}>
        sin · cos · tan · sqrt · abs · log · exp · pi · e · use *
      </p>
    </div>
  )
}
