import { createContext } from 'react'

export interface Tweaks {
  variant: 'editorial' | 'studio'
  accentHue: number
  density: number
  displayFont: string
}

export const DEFAULT_TWEAKS: Tweaks = {
  variant: 'editorial',
  accentHue: 45,
  density: 1,
  displayFont: 'Instrument Serif',
}

export interface TweaksCtx {
  tweaks: Tweaks
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void
}

export const TweaksContext = createContext<TweaksCtx>({
  tweaks: DEFAULT_TWEAKS,
  setTweak: () => {},
})
