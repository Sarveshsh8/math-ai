export type VizType =
  | 'derivative_explorer'
  | 'integral_visualizer'
  | 'unit_circle'
  | 'trig_wave'
  | 'function_graph'

export interface VizHint {
  type: VizType
  expression?: string
  a?: number
  b?: number
}

export interface SympyResult {
  type: 'derivative' | 'integral' | 'equation' | 'simplify' | 'unknown'
  input_expr: string
  result_expr: string
  latex_result: string
  steps: string[]
}

export interface SolveMetadata {
  sympy_result: SympyResult
  viz_hint: VizHint | null
}

export interface PracticeProblem {
  problem_id: string
  problem: string
  answer_latex: string
}

export interface PracticeGradeResult {
  is_correct: boolean
  method: 'symbolic' | 'unparseable'
  message: string
}

export type PracticeTopic =
  | 'trigonometry'
  | 'differential_calculus'
  | 'integral_calculus'
  | 'algebra'

export type SolveState = 'idle' | 'loading' | 'result'
