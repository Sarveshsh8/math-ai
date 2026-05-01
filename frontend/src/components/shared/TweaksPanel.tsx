import { useRef, useCallback, useEffect } from 'react'
import { useTweaks } from '../../contexts/TweaksContext'

const ACCENT_SWATCHES = [
  { h: 45, name: 'tangerine' },
  { h: 25, name: 'persimmon' },
  { h: 145, name: 'moss' },
  { h: 220, name: 'sky' },
  { h: 290, name: 'orchid' },
  { h: 355, name: 'rose' },
]

const DISPLAY_FONTS = ['Instrument Serif', 'Fraunces', 'JetBrains Mono', 'Inter']

interface Props {
  open: boolean
  onClose: () => void
}

export function TweaksPanel({ open, onClose }: Props) {
  const { tweaks, setTweak } = useTweaks()
  const dragRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef({ x: 16, y: 16 })

  const clamp = useCallback(() => {
    const panel = dragRef.current
    if (!panel) return
    const w = panel.offsetWidth, h = panel.offsetHeight
    const PAD = 16
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD)
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD)
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    }
    panel.style.right = offsetRef.current.x + 'px'
    panel.style.bottom = offsetRef.current.y + 'px'
  }, [])

  useEffect(() => {
    if (!open) return
    clamp()
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [open, clamp])

  const onDragStart = (e: React.MouseEvent) => {
    const panel = dragRef.current
    if (!panel) return
    const r = panel.getBoundingClientRect()
    const sx = e.clientX, sy = e.clientY
    const startRight = window.innerWidth - r.right
    const startBottom = window.innerHeight - r.bottom
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      }
      clamp()
    }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  if (!open) return null

  return (
    <div ref={dragRef} style={{
      position: 'fixed',
      right: offsetRef.current.x,
      bottom: offsetRef.current.y,
      zIndex: 2147483646,
      width: 280,
      maxHeight: 'calc(100vh - 32px)',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(250,249,247,.9)',
      color: 'var(--ink)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      border: '0.5px solid rgba(255,255,255,.6)',
      borderRadius: 14,
      boxShadow: '0 1px 0 rgba(255,255,255,.5) inset, 0 12px 40px rgba(0,0,0,.18)',
      fontFamily: 'var(--font-ui)',
      fontSize: 12,
      overflow: 'hidden',
    }}>
      {/* header */}
      <div onMouseDown={onDragStart} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 8px 10px 14px', cursor: 'move', userSelect: 'none',
        borderBottom: '0.5px solid rgba(0,0,0,.08)',
      }}>
        <b style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.01em' }}>Tweaks</b>
        <button onMouseDown={e => e.stopPropagation()} onClick={onClose}
          style={{
            width: 22, height: 22, borderRadius: 6, border: 'none',
            background: 'transparent', color: 'rgba(41,38,27,.55)',
            cursor: 'pointer', fontSize: 13, lineHeight: 1, display: 'grid', placeItems: 'center',
          }}>✕</button>
      </div>

      {/* body */}
      <div style={{ padding: '2px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        {/* Variation */}
        <div style={{ paddingTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(41,38,27,.45)', paddingBottom: 8 }}>Variation</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['editorial', 'studio'] as const).map(v => (
              <button key={v} onClick={() => setTweak('variant', v)} style={{
                flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: '0.5px solid rgba(0,0,0,.12)',
                background: tweaks.variant === v ? 'var(--ink)' : 'rgba(255,255,255,.6)',
                color: tweaks.variant === v ? 'var(--paper)' : 'var(--ink)',
                cursor: 'pointer',
              }}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
        </div>

        {/* Accent color */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(41,38,27,.45)', paddingBottom: 8 }}>Accent color</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <span>hue</span>
              <span style={{ color: 'rgba(41,38,27,.5)', fontVariantNumeric: 'tabular-nums' }}>{tweaks.accentHue}°</span>
            </div>
            <input type="range" min={0} max={360} step={1} value={tweaks.accentHue}
              onChange={e => setTweak('accentHue', Number(e.target.value))}
              className="r" />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {ACCENT_SWATCHES.map(p => (
                <button key={p.h} onClick={() => setTweak('accentHue', p.h)} title={p.name} style={{
                  width: 22, height: 22, borderRadius: 999,
                  background: `oklch(0.7 0.22 ${p.h})`,
                  border: tweaks.accentHue === p.h ? '2px solid #000' : '1px solid rgba(0,0,0,.15)',
                  cursor: 'pointer',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Density */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(41,38,27,.45)', paddingBottom: 8 }}>Density</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span>scale</span>
            <span style={{ color: 'rgba(41,38,27,.5)' }}>{tweaks.density.toFixed(2)}×</span>
          </div>
          <input type="range" min={0.7} max={1.4} step={0.05} value={tweaks.density}
            onChange={e => setTweak('density', Number(e.target.value))}
            className="r" />
        </div>

        {/* Display font */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(41,38,27,.45)', paddingBottom: 8 }}>Display font</div>
          <select value={tweaks.displayFont} onChange={e => setTweak('displayFont', e.target.value)} style={{
            width: '100%', height: 28, padding: '0 8px',
            border: '0.5px solid rgba(0,0,0,.1)', borderRadius: 7,
            background: 'rgba(255,255,255,.6)', color: 'inherit',
            fontFamily: 'inherit', fontSize: 12, outline: 'none',
          }}>
            {DISPLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}
