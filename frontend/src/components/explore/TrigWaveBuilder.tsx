import { useState } from 'react'
import { Mafs, Coordinates, Plot, Theme } from 'mafs'
import 'mafs/core.css'
import { MathRenderer } from '../shared/MathRenderer'

export function TrigWaveBuilder() {
  const [A, setA] = useState(1)
  const [B, setB] = useState(1)
  const [C, setC] = useState(0)
  const [D, setD] = useState(0)

  const f = (x: number) => A * Math.sin(B * x + C) + D

  const latex = `f(x) = ${A}\\sin(${B}x ${C >= 0 ? '+' : ''}${C}) + ${D}`

  return (
    <div className="space-y-3">
      <div className="bg-[#111827] rounded-xl p-3 text-center text-lg">
        <MathRenderer latex={latex} />
      </div>

      <div className="rounded-xl overflow-hidden border border-[#1e2d45]">
        <Mafs viewBox={{ x: [-2 * Math.PI, 2 * Math.PI], y: [-3, 3] }}>
          <Coordinates.Cartesian />
          <Plot.OfX y={f} color={Theme.indigo} />
        </Mafs>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: 'A (amplitude)', value: A, set: setA, min: -3, max: 3, step: 0.1 },
          { label: 'B (frequency)', value: B, set: setB, min: 0.1, max: 4, step: 0.1 },
          { label: 'C (phase shift)', value: C, set: setC, min: -Math.PI, max: Math.PI, step: 0.05 },
          { label: 'D (vertical shift)', value: D, set: setD, min: -2, max: 2, step: 0.1 },
        ].map(({ label, value, set, min, max, step }) => (
          <div key={label} className="bg-[#111827] rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400 text-xs">{label}</span>
              <span className="text-white text-xs font-mono">{value.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={min} max={max} step={step}
              value={value}
              onChange={e => set(Number(e.target.value))}
              className="w-full accent-violet-600"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
