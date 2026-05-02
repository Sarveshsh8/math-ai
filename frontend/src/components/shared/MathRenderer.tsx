import katex from 'katex'

interface Props {
  latex: string
  display?: boolean
  className?: string
}

const MAX_LATEX_CHARS = 1000

export function MathRenderer({ latex, display = false, className }: Props) {
  const safeLatex = latex.slice(0, MAX_LATEX_CHARS)

  let html: string
  try {
    html = katex.renderToString(safeLatex, {
      throwOnError: false,
      displayMode: display,
      trust: false,
      strict: 'ignore',
    })
  } catch {
    return <span className={className}>{safeLatex}</span>
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
