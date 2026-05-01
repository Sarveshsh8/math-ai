import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { VizType } from '../types'
import { DerivativeExplorer } from '../components/explore/DerivativeExplorer'
import { IntegralVisualizer } from '../components/explore/IntegralVisualizer'
import { UnitCircle } from '../components/explore/UnitCircle'
import { TrigWaveBuilder } from '../components/explore/TrigWaveBuilder'
import { FunctionGrapher } from '../components/explore/FunctionGrapher'

const TABS: { id: VizType; label: string; description: string }[] = [
  { id: 'derivative_explorer', label: 'Derivative', description: 'See how the tangent line tracks f′(x)' },
  { id: 'integral_visualizer', label: 'Integral', description: 'Riemann sums converging to the true area' },
  { id: 'unit_circle', label: 'Unit Circle', description: 'sin, cos, tan on the unit circle' },
  { id: 'trig_wave', label: 'Wave Builder', description: 'A·sin(Bx + C) + D with live sliders' },
  { id: 'function_graph', label: 'Grapher', description: 'Plot any function expression' },
]

export function ExplorePage() {
  const [searchParams] = useSearchParams()
  const [active, setActive] = useState<VizType>('derivative_explorer')

  useEffect(() => {
    const viz = searchParams.get('viz') as VizType | null
    if (viz && TABS.find(t => t.id === viz)) setActive(viz)
  }, [searchParams])

  return (
    <div className="min-h-screen px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Explore</h1>
        <p className="text-slate-400">Interactive visualizations for calculus & trigonometry</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              active === tab.id
                ? 'bg-violet-600 text-white'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-[#1e2d45]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-slate-500 text-sm mb-4">
        {TABS.find(t => t.id === active)?.description}
      </p>

      {/* Visualizer */}
      <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
        {active === 'derivative_explorer' && <DerivativeExplorer />}
        {active === 'integral_visualizer' && <IntegralVisualizer />}
        {active === 'unit_circle' && <UnitCircle />}
        {active === 'trig_wave' && <TrigWaveBuilder />}
        {active === 'function_graph' && <FunctionGrapher />}
      </div>
    </div>
  )
}
