import type { SolveMetadata, PracticeProblem } from '../types'

export const MOCK_SOLVE_METADATA: SolveMetadata = {
  sympy_result: {
    type: 'derivative',
    input_expr: 'x**3 + sin(x)',
    result_expr: '3*x**2 + cos(x)',
    latex_result: '3x^{2} + \\cos(x)',
    steps: [
      'Apply power rule to x³: multiply by exponent, reduce power',
      'Derivative of sin(x) is cos(x)',
      'Sum rule: differentiate each term separately',
    ],
  },
  viz_hint: {
    type: 'derivative_explorer',
    expression: 'x^3 + sin(x)',
  },
}

export const MOCK_EXPLANATION = `Let's break this down step by step!

We need to find $\\frac{d}{dx}[x^3 + \\sin(x)]$.

**Step 1 — Power Rule on $x^3$:**

The power rule says $\\frac{d}{dx}[x^n] = nx^{n-1}$.

$$\\frac{d}{dx}[x^3] = 3x^2$$

**Step 2 — Derivative of $\\sin(x)$:**

This is a standard derivative you'll use constantly:

$$\\frac{d}{dx}[\\sin(x)] = \\cos(x)$$

**Step 3 — Sum Rule:**

The derivative of a sum is the sum of derivatives:

$$\\frac{d}{dx}[x^3 + \\sin(x)] = 3x^2 + \\cos(x)$$

**Final answer:** $\\boxed{3x^2 + \\cos(x)}$`

export const MOCK_PRACTICE: PracticeProblem = {
  problem_id: 'mock-001',
  problem: "Find $\\frac{d}{dx}\\left[x^4 + 2\\sin(x)\\right]$",
  answer_latex: '4x^3 + 2\\cos(x)',
}

export function simulateStream(
  text: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  delay = 18,
) {
  const words = text.split('')
  let i = 0
  const tick = () => {
    if (i >= words.length) { onDone(); return }
    const chunk = words.slice(i, i + 3).join('')
    onChunk(chunk)
    i += 3
    setTimeout(tick, delay)
  }
  setTimeout(tick, 300)
}
