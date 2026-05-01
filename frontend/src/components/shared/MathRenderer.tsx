import katex from 'katex'

interface Props {
  latex: string
  display?: boolean
  className?: string
}

export function MathRenderer({ latex, display = false, className }: Props) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: display,
    trust: false,
  })
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
