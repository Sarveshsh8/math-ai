import { useContext } from 'react'
import { TweaksContext } from './tweaks-context'

export const useTweaks = () => useContext(TweaksContext)
