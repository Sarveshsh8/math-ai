import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface Tweaks {
  variant: 'editorial' | 'studio'
  accentHue: number
  density: number
  displayFont: string
}

const DEFAULTS: Tweaks = {
  variant: 'editorial',
  accentHue: 45,
  density: 1,
  displayFont: 'Instrument Serif',
}

interface TweaksCtx {
  tweaks: Tweaks
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void
}

const Ctx = createContext<TweaksCtx>({ tweaks: DEFAULTS, setTweak: () => {} })

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(DEFAULTS)

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

  return <Ctx.Provider value={{ tweaks, setTweak }}>{children}</Ctx.Provider>
}

export const useTweaks = () => useContext(Ctx)
