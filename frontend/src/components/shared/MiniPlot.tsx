import { useMemo } from 'react'

interface AccentLine {
  x1: number; y1: number; x2: number; y2: number
}
interface PlotPoint {
  x: number; y: number; fill?: string
}

interface Props {
  f?: (x: number) => number
  domain?: [number, number]
  range?: [number, number]
  width?: number
  height?: number
  color?: string
  accentLine?: AccentLine
  points?: PlotPoint[]
}

export function MiniPlot({
  f,
  domain = [-5, 5],
  range = [-3, 3],
  width = 320,
  height = 180,
  color = 'var(--accent)',
  accentLine,
  points,
}: Props) {
  const [x0, x1] = domain
  const [y0, y1] = range
  const sx = (x: number) => ((x - x0) / (x1 - x0)) * width
  const sy = (y: number) => height - ((y - y0) / (y1 - y0)) * height

  const path = useMemo(() => {
    if (!f) return ''
    const N = 220
    let d = ''
    let prev = false
    for (let k = 0; k <= N; k++) {
      const x = x0 + (k / N) * (x1 - x0)
      let y: number
      try { y = f(x) } catch { y = NaN }
      if (!isFinite(y) || Math.abs(y) > 1e3) { prev = false; continue }
      const px = sx(x).toFixed(1)
      const py = sy(Math.max(y0 - 1, Math.min(y1 + 1, y))).toFixed(1)
      d += prev ? ` L ${px} ${py}` : `M ${px} ${py}`
      prev = true
    }
    return d
  }, [f, x0, x1, y0, y1, width, height])

  const xticks: number[] = []
  for (let x = Math.ceil(x0); x <= x1; x++) xticks.push(x)
  const yticks: number[] = []
  for (let y = Math.ceil(y0); y <= y1; y++) yticks.push(y)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: 'block' }}>
      {xticks.map(x => (
        <line key={`vx${x}`} x1={sx(x)} x2={sx(x)} y1={0} y2={height}
          stroke="currentColor" opacity={x === 0 ? 0.35 : 0.08} strokeWidth={x === 0 ? 1 : 0.5} />
      ))}
      {yticks.map(y => (
        <line key={`vy${y}`} x1={0} x2={width} y1={sy(y)} y2={sy(y)}
          stroke="currentColor" opacity={y === 0 ? 0.35 : 0.08} strokeWidth={y === 0 ? 1 : 0.5} />
      ))}
      {path && <path d={path} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />}
      {accentLine && (
        <line
          x1={sx(accentLine.x1)} y1={sy(accentLine.y1)}
          x2={sx(accentLine.x2)} y2={sy(accentLine.y2)}
          stroke="var(--plum)" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.85}
        />
      )}
      {points?.map((p, i) => (
        <g key={i}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r={5} fill={p.fill ?? color} stroke="var(--paper)" strokeWidth={2} />
        </g>
      ))}
    </svg>
  )
}
