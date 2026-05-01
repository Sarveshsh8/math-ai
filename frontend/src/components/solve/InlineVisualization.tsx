import type { VizHint } from '../../types'
import { DerivativeExplorer } from '../explore/DerivativeExplorer'
import { IntegralVisualizer } from '../explore/IntegralVisualizer'
import { UnitCircle } from '../explore/UnitCircle'
import { TrigWaveBuilder } from '../explore/TrigWaveBuilder'
import { FunctionGrapher } from '../explore/FunctionGrapher'
import { Sticker } from '../shared/Sticker'

const VIZ_LABELS: Record<string, string> = {
  derivative_explorer: 'Derivative Explorer',
  integral_visualizer: 'Integral Visualizer',
  unit_circle: 'Unit Circle',
  trig_wave: 'Wave Builder',
  function_graph: 'Function Graph',
}

interface Props {
  hint: VizHint
}

export function InlineVisualization({ hint }: Props) {
  return (
    <div className="panel">
      <div className="panel__head">
        <h3 className="panel__title">Visualization</h3>
        <Sticker dot>live</Sticker>
      </div>
      <div className="panel__body">
        <p className="t-eyebrow" style={{ marginBottom: 16 }}>— {VIZ_LABELS[hint.type] ?? 'Interactive'}</p>
        {hint.type === 'derivative_explorer' && (
          <DerivativeExplorer expression={hint.expression} />
        )}
        {hint.type === 'integral_visualizer' && (
          <IntegralVisualizer expression={hint.expression} defaultA={hint.a} defaultB={hint.b} />
        )}
        {hint.type === 'unit_circle' && <UnitCircle />}
        {hint.type === 'trig_wave' && <TrigWaveBuilder />}
        {hint.type === 'function_graph' && (
          <FunctionGrapher expression={hint.expression} />
        )}
      </div>
    </div>
  )
}
