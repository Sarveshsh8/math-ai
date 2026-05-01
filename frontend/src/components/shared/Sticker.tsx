interface Props {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'ink'
  rotate?: 'l' | 'r'
  dot?: boolean
}

export function Sticker({ children, variant = 'default', rotate, dot }: Props) {
  let cls = 'sticker'
  if (variant === 'accent') cls += ' sticker--accent'
  if (variant === 'ink') cls += ' sticker--ink'
  if (rotate === 'l') cls += ' sticker--rotate-l'
  if (rotate === 'r') cls += ' sticker--rotate-r'
  return (
    <span className={cls}>
      {dot && <span className="sticker__dot" />}
      {children}
    </span>
  )
}
