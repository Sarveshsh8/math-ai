import { useState } from 'react'
import { Mafs, Coordinates, Circle, Point, Line, Theme } from 'mafs'
import 'mafs/core.css'

export function UnitCircle() {
  const [theta, setTheta] = useState(Math.PI / 4)

  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const tanT = Math.tan(theta)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 text-center text-sm px-1">
        <div className="bg-[#111827] rounded-lg p-2">
          <p className="text-slate-500 text-xs">sin(θ)</p>
          <p className="text-white font-mono font-semibold">{sinT.toFixed(4)}</p>
        </div>
        <div className="bg-[#111827] rounded-lg p-2">
          <p className="text-slate-500 text-xs">cos(θ)</p>
          <p className="text-white font-mono font-semibold">{cosT.toFixed(4)}</p>
        </div>
        <div className="bg-[#111827] rounded-lg p-2">
          <p className="text-slate-500 text-xs">tan(θ)</p>
          <p className="text-white font-mono font-semibold">{Math.abs(tanT) > 99 ? '∞' : tanT.toFixed(4)}</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-[#1e2d45]">
        <Mafs viewBox={{ x: [-1.6, 1.6], y: [-1.6, 1.6] }}>
          <Coordinates.Cartesian />
          <Circle center={[0, 0]} radius={1} color={Theme.indigo} fillOpacity={0} />
          {/* Radius line */}
          <Line.Segment point1={[0, 0]} point2={[cosT, sinT]} color={Theme.foreground} />
          {/* sin projection (vertical) */}
          <Line.Segment point1={[cosT, 0]} point2={[cosT, sinT]} color={Theme.pink} style="dashed" />
          {/* cos projection (horizontal) */}
          <Line.Segment point1={[0, 0]} point2={[cosT, 0]} color={Theme.green} style="dashed" />
          <Point x={cosT} y={sinT} color={Theme.foreground} />
        </Mafs>
      </div>

      <div className="space-y-1">
        <input
          type="range"
          min={0} max={2 * Math.PI} step={0.02}
          value={theta}
          onChange={e => setTheta(Number(e.target.value))}
          className="w-full accent-violet-600"
        />
        <p className="text-slate-500 text-xs text-center">
          θ = {(theta * 180 / Math.PI).toFixed(1)}° = {theta.toFixed(3)} rad
        </p>
      </div>
    </div>
  )
}
