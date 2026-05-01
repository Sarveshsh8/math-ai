import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sticker } from '../components/shared/Sticker'
import { MiniPlot } from '../components/shared/MiniPlot'

export function LandingPage() {
  return (
    <div className="page-fade">
      <Hero />
      <MarqueeBand />
      <FeatureSection />
      <FlowSection />
      <ExploreShowcase />
      <CtaSection />
    </div>
  )
}

function Hero() {
  const navigate = useNavigate()
  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__eyebrow-row">
          <Sticker variant="accent" dot rotate="l">v 1.0 — public beta</Sticker>
          <span className="t-eyebrow">For students, tutors &amp; curious minds</span>
        </div>

        <h1 className="hero__title">
          Math that<br />
          <em>thinks</em> with you,<br />
          <span className="underline">
            not for you.
            <svg viewBox="0 0 600 20" preserveAspectRatio="none" aria-hidden>
              <path d="M5 12 Q 150 2 300 11 T 595 9" stroke="var(--accent)" strokeWidth="5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="hero__sub">
          Drop in any problem — derivatives, integrals, equations, trig.
          Get clear, step-by-step understanding alongside an interactive
          visualization that makes the why obvious.
        </p>

        <div className="hero__bottom">
          <button className="btn btn--accent btn--lg" onClick={() => navigate('/solve')}>
            Solve a problem <span>→</span>
          </button>
          <button className="btn btn--ghost btn--lg" onClick={() => navigate('/explore')}>
            Explore visualizations
          </button>
          <span className="t-mono" style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 8 }}>
            no signup · works offline
          </span>
        </div>

        <div className="hero__floating" style={{ top: '8%', right: '6%', transform: 'rotate(-6deg)' }}>
          <Sticker rotate="r" variant="ink">∫ x² dx</Sticker>
        </div>
        <div className="hero__floating" style={{
          bottom: '15%', right: '12%', transform: 'rotate(4deg)',
          fontSize: 24, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--accent-ink)'
        }}>
          d/dx
        </div>
        <div className="hero__floating" style={{ top: '40%', right: '4%', transform: 'rotate(8deg)' }}>
          <Sticker rotate="l">sin²θ + cos²θ = 1</Sticker>
        </div>
      </div>
    </section>
  )
}

function MarqueeBand() {
  const items = [
    'derivatives', '✶', 'integrals', '✶', 'limits', '✶', 'trigonometry',
    '✶', 'linear algebra', '✶', 'series', '✶', 'differential eq.',
    '✶', 'graphing', '✶', 'word problems',
  ]
  return (
    <div className="marquee" aria-hidden>
      <div className="marquee__track">
        {[...items, ...items].map((it, i) => (
          <span key={i} className="marquee__item">
            {it === '✶' ? <span className="star">✶</span> : <span>{it}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

function FeatureSection() {
  const fSin = (x: number) => Math.sin(x) + 0.4 * x
  const fSinD = (x: number) => Math.cos(x) + 0.4
  const tangentAt = 1.0
  const ty = fSin(tangentAt)
  const slope = fSinD(tangentAt)

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <span className="t-eyebrow">— What it does</span>
          <h2 className="section__title">
            Three modes,<br /><em>one workflow.</em>
          </h2>
        </div>
        <p className="section__lede">
          Most math tools either spit out an answer or buy you time with a hint.
          math·ai is built around the loop: ask, understand, practice. Then do it again.
        </p>
      </div>

      <div className="f-grid">
        {/* card 1: solve */}
        <div className="f-card" style={{ gridColumn: 'span 7' }}>
          <span className="f-card__num">01 / Solve</span>
          <h3 className="f-card__title">Step-by-step that<br />actually steps.</h3>
          <p className="f-card__body">
            Type a problem in plain notation. Watch the solution stream in,
            with each move grounded in a named rule — power rule, chain rule,
            substitution. No hand-waving.
          </p>
          <div className="f-card__visual">
            <SolvePreview />
          </div>
        </div>

        {/* card 2: explore */}
        <div className="f-card f-card--ink" style={{ gridColumn: 'span 5' }}>
          <span className="f-card__num">02 / Explore</span>
          <h3 className="f-card__title">See the shape<br />of the answer.</h3>
          <p className="f-card__body">
            Every solve hands off to an interactive visualization. Drag the
            tangent. Slide Riemann partitions. Spin the unit circle.
          </p>
          <div className="f-card__visual">
            <div className="miniplot">
              <MiniPlot
                f={fSin}
                domain={[-4, 4]} range={[-3, 3]}
                width={360} height={170}
                color="var(--accent)"
                accentLine={{
                  x1: tangentAt - 2, y1: ty - 2 * slope,
                  x2: tangentAt + 2, y2: ty + 2 * slope
                }}
                points={[{ x: tangentAt, y: ty, fill: 'var(--accent)' }]}
              />
              <div className="miniplot__caption">
                <span>f(x) = sin(x) + 0.4x</span>
                <span>tangent @ x={tangentAt.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* card 3: practice */}
        <div className="f-card f-card--accent" style={{ gridColumn: 'span 5' }}>
          <span className="f-card__num" style={{ color: 'var(--ink-2)' }}>03 / Practice</span>
          <h3 className="f-card__title">Generated problems<br />that match your level.</h3>
          <p className="f-card__body" style={{ color: 'var(--ink-2)' }}>
            After every solve, get a similar problem. Symbolic grading means
            12x⁴ and 12·x⁴ are both correct — no penalty for formatting.
          </p>
          <div className="f-card__visual">
            <div style={{ background: 'var(--paper)', borderRadius: 14, padding: 16, color: 'var(--ink)' }}>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>Practice · Calculus</div>
              <div className="t-mono" style={{ fontSize: 16, marginBottom: 14 }}>
                d/dx[x⁴ + 2·sin(x)] = ?
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['4x³ + 2cos(x)', '4x³ − 2cos(x)', '3x³ + 2cos(x)'].map((t, i) => (
                  <span key={i} className="chip" style={i === 0 ? { borderColor: 'var(--moss)', color: 'var(--moss)' } : undefined}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* card 4: under the hood */}
        <div className="f-card" style={{ gridColumn: 'span 7' }}>
          <span className="f-card__num">04 / Under the hood</span>
          <h3 className="f-card__title">Symbolic engine,<br />language model on top.</h3>
          <p className="f-card__body">
            We don't ask the LLM to do math. A symbolic kernel computes the
            real answer; the LLM narrates it. So the answer is right —
            and the explanation is in plain English.
          </p>
          <div className="f-card__visual" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'input → SymPy', bg: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' },
              { label: '→', bg: 'transparent', color: 'var(--ink-3)', border: 'none' },
              { label: 'exact result', bg: 'var(--ink)', color: 'var(--paper)', border: 'none' },
              { label: '→', bg: 'transparent', color: 'var(--ink-3)', border: 'none' },
              { label: 'LLM narration', bg: 'var(--accent)', color: 'var(--ink)', border: 'none' },
            ].map((item, i) => (
              item.label === '→'
                ? <span key={i} style={{ color: 'var(--ink-3)' }}>→</span>
                : <div key={i} className="t-mono" style={{
                  fontSize: 13, padding: '10px 14px',
                  background: item.bg, color: item.color, border: item.border, borderRadius: 10,
                }}>{item.label}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function SolvePreview() {
  return (
    <div style={{
      background: 'var(--paper)', borderRadius: 14,
      border: '1px solid var(--line)', padding: 14,
      fontFamily: 'var(--font-mono)', fontSize: 13,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)', display: 'inline-block' }} />
        <span className="t-eyebrow">solving</span>
      </div>
      <div style={{ fontSize: 15, marginBottom: 12, color: 'var(--ink)', fontStyle: 'italic' }}>
        d/dx[x³ + sin(x)]
      </div>
      <div style={{
        borderTop: '1px dashed var(--line-strong)', paddingTop: 12,
        fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6,
      }}>
        <div>① power rule on x³ → <span style={{ color: 'var(--ink)' }}>3x²</span></div>
        <div>② d/dx[sin x] → <span style={{ color: 'var(--ink)' }}>cos(x)</span></div>
        <div>③ sum rule</div>
      </div>
      <div style={{
        marginTop: 12, padding: '10px 12px',
        background: 'var(--accent-soft)', borderRadius: 8,
        fontSize: 14, color: 'var(--ink)',
        borderLeft: '3px solid var(--accent)',
        fontStyle: 'italic',
      }}>
        = 3x² + cos(x)
      </div>
    </div>
  )
}

function FlowSection() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="section__head">
        <div>
          <span className="t-eyebrow">— How it feels</span>
          <h2 className="section__title">
            Type a problem.<br /><em>Three things happen.</em>
          </h2>
        </div>
        <p className="section__lede">
          The whole interaction lives on one screen. Input top, explanation left,
          visualization right — so seeing and reading happen at the same time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {[
          { num: '01', t: 'Symbolic engine fires.', body: 'A real CAS computes the exact answer. Not predicted — calculated.' },
          { num: '02', t: 'Explanation streams in.', body: "A language model narrates the engine's steps in plain English, with named rules." },
          { num: '03', t: 'Visualization appears.', body: 'The system picks the right interactive — tangent line, Riemann sum, unit circle, wave.' },
        ].map((s, i) => (
          <div key={i} style={{ borderTop: '1px solid var(--ink)', paddingTop: 20 }}>
            <div className="t-mono" style={{ fontSize: 12, color: 'var(--accent-ink)', marginBottom: 24 }}>{s.num}</div>
            <h3 className="t-display" style={{ fontSize: 28, lineHeight: 1.05, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{s.t}</h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, margin: 0, lineHeight: 1.55 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ExploreShowcase() {
  const navigate = useNavigate()
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div style={{
        background: 'var(--ink)', color: 'var(--paper)',
        borderRadius: 28, padding: 'clamp(40px, 6vw, 80px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.1fr 1fr',
          gap: 60, alignItems: 'center',
        }}>
          <div>
            <Sticker variant="accent" rotate="l">explore mode</Sticker>
            <h2 className="t-display" style={{
              fontSize: 'clamp(40px, 5vw, 76px)', lineHeight: 0.98,
              letterSpacing: '-0.03em', margin: '20px 0 18px', color: 'var(--paper)',
            }}>
              Five interactive<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>playgrounds.</em>
            </h2>
            <p style={{ color: 'oklch(0.78 0.01 280)', maxWidth: 460, fontSize: 16, lineHeight: 1.55 }}>
              Drag the tangent line. Slide partitions until Riemann sums converge.
              Build trig waves with sliders for A, B, C, D. Live, no scrubbing.
            </p>
            <button className="btn btn--accent btn--lg" style={{ marginTop: 28 }} onClick={() => navigate('/explore')}>
              Open Explore →
            </button>
          </div>
          <div style={{
            background: 'oklch(0.22 0.013 280)', borderRadius: 18, padding: 18,
            border: '1px solid oklch(0.3 0.013 280)',
          }}>
            <div className="t-mono" style={{
              fontSize: 11, color: 'oklch(0.65 0.01 280)',
              display: 'flex', justifyContent: 'space-between', marginBottom: 10,
            }}>
              <span>integral_visualizer.tsx</span>
            </div>
            <RiemannPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

function RiemannPreview() {
  const [n, setN] = useState(14)
  const f = (x: number) => 0.6 * Math.sin(x) + 0.5 * x + 1.5
  const a = -2, b = 3
  const W = 380, H = 220
  const dx = (b - a) / n
  const bars: { x: number; w: number; h: number }[] = []
  for (let i = 0; i < n; i++) {
    const x = a + i * dx + dx / 2
    bars.push({ x: a + i * dx, w: dx, h: f(x) })
  }
  const sx = (x: number) => ((x - a) / (b - a)) * W
  const yMax = 4
  const sy = (y: number) => H - (y / yMax) * H

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {bars.map((bar, i) => (
          <rect key={i}
            x={sx(bar.x)} y={sy(Math.max(0, bar.h))}
            width={Math.max(0, sx(bar.x + bar.w) - sx(bar.x) - 1)}
            height={H - sy(Math.max(0, bar.h))}
            fill="var(--accent)" opacity={0.55}
            stroke="var(--accent)" strokeWidth={1}
          />
        ))}
        <path
          d={Array.from({ length: 120 }, (_, k) => {
            const x = a + (k / 119) * (b - a)
            const y = f(x)
            return `${k === 0 ? 'M' : 'L'} ${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`
          }).join(' ')}
          fill="none" stroke="var(--paper)" strokeWidth={2.2}
        />
      </svg>
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'oklch(0.78 0.01 280)',
      }}>
        <span style={{ minWidth: 60 }}>partitions</span>
        <input type="range" className="r" min={4} max={60} value={n}
          onChange={e => setN(parseInt(e.target.value))} style={{ flex: 1 }} />
        <span style={{ color: 'var(--accent)', minWidth: 30, textAlign: 'right' }}>{n}</span>
      </div>
    </div>
  )
}

function CtaSection() {
  const navigate = useNavigate()
  return (
    <section className="section" style={{ paddingBottom: 'clamp(80px, 10vw, 140px)' }}>
      <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
        <Sticker rotate="r" dot>start any problem</Sticker>
        <h2 className="t-display" style={{
          fontSize: 'clamp(56px, 9vw, 132px)', lineHeight: 0.92,
          letterSpacing: '-0.03em', margin: '20px 0 32px',
        }}>
          Ready when you<br /><em style={{ fontStyle: 'italic', color: 'var(--accent-ink)' }}>are.</em>
        </h2>
        <button className="btn btn--primary btn--lg" onClick={() => navigate('/solve')}>
          Solve your first problem →
        </button>
      </div>
    </section>
  )
}
