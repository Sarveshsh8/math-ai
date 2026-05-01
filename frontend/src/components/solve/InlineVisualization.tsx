import type { VizHint } from '../../types'
import { DerivativeExplorer } from '../explore/DerivativeExplorer'
import { IntegralVisualizer } from '../explore/IntegralVisualizer'
import { UnitCircle } from '../explore/UnitCircle'
import { TrigWaveBuilder } from '../explore/TrigWaveBuilder'
import { FunctionGrapher } from '../explore/FunctionGrapher'

interface Props {
  hint: VizHint
}

export function InlineVisualization({ hint }: Props) {
  const label: Record<string, string> = {
    derivative_explorer: 'Derivative Explorer',
    integral_visualizer: 'Integral Visualizer',
    unit_circle: 'Unit Circle',
    trig_wave: 'Wave Builder',
    function_graph: 'Function Graph',
  }

  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-2xl p-5">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">
        {label[hint.type] ?? 'Visualization'}
      </p>
      {hint.type === 'derivative_explorer' && (
        <DerivativeExplorer expression={hint.expression} />
      )}
      {hint.type === 'integral_visualizer' && (
        <IntegralVisualizer
          expression={hint.expression}
          defaultA={hint.a}
          defaultB={hint.b}
        />
      )}
      {hint.type === 'unit_circle' && <UnitCircle />}
      {hint.type === 'trig_wave' && <TrigWaveBuilder />}
      {hint.type === 'function_graph' && (
        <FunctionGrapher expression={hint.expression} />
      )}
    </div>
  )
}
