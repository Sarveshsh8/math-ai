import { useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_TWEAKS, TweaksContext, type Tweaks } from './tweaks-context'

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULT_TWEAKS)

  const setTweak = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent-h', String(tweaks.accentHue))
    root.style.setProperty('--density', String(tweaks.density))
    root.style.setProperty('--font-display', `'${tweaks.displayFont}', serif`)
    document.body.classList.toggle('variant-studio', tweaks.variant === 'studio')
  }, [tweaks])

  return <TweaksContext.Provider value={{ tweaks, setTweak }}>{children}</TweaksContext.Provider>
}
