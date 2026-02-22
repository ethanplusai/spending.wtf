/**
 * JourneyScreen — "The Spending Story"
 * Apple-style scroll-driven narrative — big, bold, viewport-filling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SubScreen, TabId } from '../../types';

// ============================================
// Scroll Math
// ============================================

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Fade in and STAY — once visible, stays visible */
const fadeIn = (p: number, start: number, end: number) => clamp((p - start) / (end - start), 0, 1);

/** Stagger items with delayed starts */
const stagger = (base: number, i: number, total: number) => {
  const gap = 0.6 / total;
  const start = i * gap;
  return clamp((base - start) / 0.4, 0, 1);
};

// ============================================
// Component
// ============================================

interface JourneyScreenProps {
  onBack: () => void;
  onNavigate: (screen: SubScreen, params?: Record<string, string | number>) => void;
  onTabChange: (tab: TabId) => void;
}

export function JourneyScreen({ onBack, onTabChange }: JourneyScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [vh, setVh] = useState(1000);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    const onResize = () => setVh(window.innerHeight);
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onResize();
    return () => { el.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBack]);

  const sp = useCallback(
    (startVh: number, lengthVh: number) => clamp((scrollY - startVh * vh) / (lengthVh * vh), 0, 1),
    [scrollY, vh]
  );

  const totalProgress = scrollY / Math.max(1, (scrollRef.current?.scrollHeight || 1) - vh);

  // Auto-animate hero entrance — staggered reveal over 3.5s
  const [heroAuto, setHeroAuto] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start - 300;
      if (elapsed < 0) { requestAnimationFrame(animate); return; }
      const t = Math.min(elapsed / 3500, 1);
      setHeroAuto(t);
      if (t < 1) requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  // Section progress — S1 is short (entrance-animated), rest generous
  const p1 = sp(0, 1.5);
  const p2 = sp(1.5, 3.0);
  const p3 = sp(4.5, 3.5);
  const p4 = sp(8.0, 3.5);
  const p5 = sp(11.5, 3.5);
  const p6 = sp(15.0, 3.5);
  const p7 = sp(18.5, 3.0);
  const p8 = sp(21.5, 3.5);
  const p9 = sp(25.0, 2.5);

  const heroCountProgress = Math.max(heroAuto, fadeIn(p1, 0, 0.3));

  return (
    <div className="journey-screen" ref={scrollRef}>
      <div className="journey-progress-bar">
        <div className="journey-progress-fill" style={{ width: `${clamp(totalProgress, 0, 1) * 100}%` }} />
      </div>
      <button className="journey-close-btn" onClick={onBack} aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* ========== S1: HERO ========== */}
      <section className="journey-section" style={{ height: '150vh' }}>
        <div className="journey-sticky">
          {/* American flag background — proper 13 stripes + canton */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.06 }}>
            <AmericanFlag />
          </div>

          <div className="journey-glow" style={{
            background: `radial-gradient(circle, rgba(220,38,38,${0.08 + 0.04 * heroAuto}) 0%, transparent 60%)`,
          }} />

          {/* Shield — fades in first */}
          <div style={{
            opacity: fadeIn(heroAuto, 0, 0.1),
            transform: `translateY(${(1 - fadeIn(heroAuto, 0, 0.12)) * 16}px)`,
            marginBottom: '8px',
          }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(220, 38, 38, 0.6)" strokeWidth="1.5">
              <path d="M12 2L4 7v5c0 5.25 3.4 10.15 8 11.25 4.6-1.1 8-6 8-11.25V7l-8-5z" />
            </svg>
          </div>

          {/* Title — fades in at 0.08 */}
          <h1 className="journey-hero-title" style={{
            opacity: fadeIn(heroAuto, 0.06, 0.18),
            transform: `translateY(${(1 - fadeIn(heroAuto, 0.06, 0.2)) * 20}px)`,
          }}>
            The <span className="journey-red">
              <CountUp end={38.4} progress={heroCountProgress} prefix="$" suffix=" Trillion" decimals={1} />
            </span> Problem
          </h1>

          {/* Stat cards — stagger in starting at 0.35 */}
          <div style={{ opacity: fadeIn(heroAuto, 0.3, 0.4), marginTop: '40px' }}>
            <div className="journey-stat-grid">
              {[
                { value: '$1T', label: 'new debt every 100 days' },
                { value: '$8B', label: 'borrowed every single day' },
                { value: '$96K', label: 'owed per citizen' },
              ].map((s, i) => (
                <div key={i} className="journey-stat-card" style={{
                  opacity: stagger(fadeIn(heroAuto, 0.35, 0.6), i, 3),
                  transform: `translateY(${(1 - stagger(fadeIn(heroAuto, 0.35, 0.6), i, 3)) * 16}px)`,
                }}>
                  <div className="journey-stat-value">{s.value}</div>
                  <div className="journey-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* "How did we get here?" — fades in at 0.65 */}
          <div className="journey-section-title" style={{
            opacity: fadeIn(heroAuto, 0.65, 0.78),
            transform: `translateY(${(1 - fadeIn(heroAuto, 0.65, 0.8)) * 16}px)`,
            marginTop: '48px',
            fontSize: 'clamp(1.75rem, 5vw, 3rem)',
          }}>
            How did we get here?
          </div>

          {/* Scroll hint — appears last, fades out on scroll */}
          <div className="journey-scroll-hint" style={{
            opacity: fadeIn(heroAuto, 0.82, 0.95) * (1 - fadeIn(p1, 0.03, 0.15)),
          }}>
            <span>Scroll to begin</span>
            <span className="journey-scroll-arrow">↓</span>
          </div>
        </div>
      </section>

      {/* ========== S2: THE FOUNDATION ========== */}
      <section className="journey-section" style={{ height: '300vh' }}>
        <div className="journey-sticky">
          <SectionLabel text="THE FOUNDATION" progress={p2} />
          <h2 className="journey-section-title" style={{ opacity: fadeIn(p2, 0.02, 0.08) }}>
            Built on a Promise
          </h2>

          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 'none', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Phase 1: Body + Gold bar (0.06 → 0.44) */}
            {(() => {
              const enter = fadeIn(p2, 0.06, 0.14);
              const exit = fadeIn(p2, 0.38, 0.46);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '16px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-body">
                    For most of American history, the dollar was backed by gold.
                  </div>
                  <div className="journey-visual-wide">
                    <GoldBarVisual progress={fadeIn(p2, 0.1, 0.32)} />
                  </div>
                  <div className="journey-body" style={{ opacity: fadeIn(p2, 0.28, 0.36) }}>
                    The government couldn't spend what it didn't have.
                  </div>
                </div>
              );
            })()}

            {/* Phase 2: Jefferson quote (0.44 → end) */}
            {(() => {
              const enter = fadeIn(p2, 0.44, 0.52);
              const y = (1 - enter) * 30;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: enter, transform: `translateY(${y}px)`, pointerEvents: enter < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-quote-block">
                    <TypewriterText
                      text="The principle of spending money to be paid by posterity, under the name of funding, is but swindling futurity on a large scale."
                      progress={fadeIn(p2, 0.46, 0.76)}
                    />
                    <div className="journey-attribution">— Thomas Jefferson</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== S3: THE BREAK ========== */}
      <section className="journey-section" style={{ height: '350vh' }}>
        <div className="journey-sticky">
          <SectionLabel text="THE BREAK" progress={p3} />
          <div className="journey-big-number" style={{
            opacity: fadeIn(p3, 0.02, 0.08),
            transform: `scale(${lerp(1.3, 1, fadeIn(p3, 0.02, 0.1))})`,
            color: 'var(--text-primary)',
          }}>
            August 15, 1971
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 'none', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Phase 1: Body + temporary quote (0.06 → 0.32) */}
            {(() => {
              const enter = fadeIn(p3, 0.06, 0.14);
              const exit = fadeIn(p3, 0.26, 0.34);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '24px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-body">
                    Nixon ended the dollar's convertibility to gold. The constraint was removed.
                  </div>
                  <div className="journey-quote-block">
                    <TypewriterText
                      text='The "temporary" suspension was never reversed.'
                      progress={fadeIn(p3, 0.1, 0.24)}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Phase 2: Debt growth bars (0.32 → 0.64) */}
            {(() => {
              const enter = fadeIn(p3, 0.32, 0.40);
              const exit = fadeIn(p3, 0.58, 0.66);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-visual-wide">
                    <DebtGrowthBars progress={fadeIn(p3, 0.34, 0.58)} />
                  </div>
                </div>
              );
            })()}

            {/* Phase 3: 96× growth (0.64 → end) */}
            {(() => {
              const enter = fadeIn(p3, 0.64, 0.72);
              const y = (1 - enter) * 30;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: enter, transform: `translateY(${y}px)`, pointerEvents: enter < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-big-number" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)' }}>
                    <CountUp end={96} progress={fadeIn(p3, 0.66, 0.82)} suffix="× growth" decimals={0} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== S4: THE RATCHET ========== */}
      <section className="journey-section" style={{ height: '350vh' }}>
        <div className="journey-sticky">
          <SectionLabel text="THE RATCHET" progress={p4} />
          <h2 className="journey-section-title" style={{ opacity: fadeIn(p4, 0.02, 0.08) }}>
            It Only Goes Up
          </h2>

          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 'none', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Phase 1: Body + Agency cards (0.06 → 0.40) */}
            {(() => {
              const enter = fadeIn(p4, 0.06, 0.14);
              const exit = fadeIn(p4, 0.34, 0.42);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-body">
                    Every crisis adds agencies and spending. It never comes back down.
                  </div>
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    {[
                      { name: 'EPA', year: '1970', cost: '$9.2B/yr' },
                      { name: 'Dept. of Education', year: '1979', cost: '$268B/yr' },
                      { name: 'Dept. of Homeland Security', year: '2002', cost: '$62B/yr' },
                      { name: '400+ agencies total', year: 'and counting', cost: '' },
                    ].map((a, i) => (
                      <div key={i} className="journey-agency-card" style={{
                        opacity: stagger(fadeIn(p4, 0.12, 0.32), i, 4),
                        transform: `translateX(${(1 - stagger(fadeIn(p4, 0.12, 0.32), i, 4)) * 40}px)`,
                      }}>
                        <div>
                          <div className="journey-agency-name">{a.name}</div>
                          <div className="journey-agency-year">Est. {a.year}</div>
                        </div>
                        {a.cost && <div className="journey-agency-cost">{a.cost}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Phase 2: GDP chart (0.40 → 0.68) */}
            {(() => {
              const enter = fadeIn(p4, 0.40, 0.48);
              const exit = fadeIn(p4, 0.62, 0.70);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-visual-wide">
                    <GdpShareVisual progress={fadeIn(p4, 0.42, 0.6)} />
                  </div>
                </div>
              );
            })()}

            {/* Phase 3: Reagan quote (0.68 → end) */}
            {(() => {
              const enter = fadeIn(p4, 0.68, 0.76);
              const y = (1 - enter) * 30;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: enter, transform: `translateY(${y}px)`, pointerEvents: enter < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-quote-block">
                    <TypewriterText
                      text="We don't have a trillion-dollar debt because we haven't taxed enough; we have a trillion-dollar debt because we spend too much."
                      progress={fadeIn(p4, 0.70, 0.90)}
                    />
                    <div className="journey-attribution">— Ronald Reagan</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== S5: THE MONEY PRINTER ========== */}
      <section className="journey-section" style={{ height: '350vh' }}>
        <div className="journey-sticky" style={{ position: 'sticky', top: 0 }}>
          <SectionLabel text="THE MONEY PRINTER" progress={p5} />
          <h2 className="journey-section-title" style={{ opacity: fadeIn(p5, 0.02, 0.08) }}>
            The Illusion
          </h2>

          {/* Phases container — all absolutely positioned for seamless crossfade */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 'none', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Phase 1: Body + M2 chart + big stat (0.06 → 0.40) */}
            {(() => {
              const enter = fadeIn(p5, 0.06, 0.14);
              const exit = fadeIn(p5, 0.34, 0.42);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '16px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-body">
                    Without the gold constraint, the Fed prints money at will.
                  </div>
                  <div className="journey-visual-wide">
                    <MoneySupplyVisual progress={fadeIn(p5, 0.1, 0.32)} />
                  </div>
                  <div className="journey-medium-number journey-red" style={{ opacity: fadeIn(p5, 0.28, 0.34) }}>
                    +$6.3 trillion in 2 years
                  </div>
                </div>
              );
            })()}

            {/* Phase 2: Dollar purchasing power (0.40 → 0.72) */}
            {(() => {
              const enter = fadeIn(p5, 0.40, 0.48);
              const exit = fadeIn(p5, 0.66, 0.74);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '20px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-visual-wide">
                    <DollarPowerVisual progress={fadeIn(p5, 0.42, 0.64)} />
                  </div>
                  <div className="journey-medium-number journey-red" style={{ opacity: fadeIn(p5, 0.58, 0.64) }}>
                    88% of its value — gone
                  </div>
                </div>
              );
            })()}

            {/* Phase 3: Friedman quote (0.72 → end) */}
            {(() => {
              const enter = fadeIn(p5, 0.72, 0.80);
              const y = (1 - enter) * 30;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: enter, transform: `translateY(${y}px)`, pointerEvents: enter < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-quote-block">
                    <TypewriterText
                      text="Inflation is always and everywhere a monetary phenomenon."
                      progress={fadeIn(p5, 0.74, 0.92)}
                    />
                    <div className="journey-attribution">— Milton Friedman</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== S6: THE DEBT SPIRAL ========== */}
      <section className="journey-section" style={{ height: '350vh' }}>
        <div className="journey-sticky">
          <SectionLabel text="THE DEBT SPIRAL" progress={p6} />
          <div className="journey-big-number" style={{
            opacity: fadeIn(p6, 0.02, 0.1),
            transform: `scale(${lerp(0.85, 1, fadeIn(p6, 0.02, 0.1))})`,
          }}>
            $1 Trillion
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 'none', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Phase 1: Body + Interest chart + stat cards (0.06 → 0.52) */}
            {(() => {
              const enter = fadeIn(p6, 0.06, 0.14);
              const exit = fadeIn(p6, 0.46, 0.54);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '16px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-body">
                    Annual interest on the debt — more than defense or Medicare
                  </div>
                  <div className="journey-visual-wide">
                    <InterestCompareVisual progress={fadeIn(p6, 0.1, 0.36)} />
                  </div>
                  <div style={{ opacity: fadeIn(p6, 0.34, 0.42), marginTop: '16px' }}>
                    <div className="journey-stat-grid">
                      <div className="journey-stat-card">
                        <div className="journey-stat-value">19%</div>
                        <div className="journey-stat-label">of all revenue goes to interest</div>
                      </div>
                      <div className="journey-stat-card">
                        <div className="journey-stat-value">$7,300</div>
                        <div className="journey-stat-label">per household per year</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Phase 2: Spiral diagram (0.52 → end) */}
            {(() => {
              const enter = fadeIn(p6, 0.52, 0.60);
              const y = (1 - enter) * 30;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: enter, transform: `translateY(${y}px)`, pointerEvents: enter < 0.01 ? 'none' : 'auto',
                }}>
                  <SpiralDiagram progress={fadeIn(p6, 0.54, 0.82)} />
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== S7: YOUR SHARE ========== */}
      <section className="journey-section" style={{ height: '300vh' }}>
        <div className="journey-sticky">
          <SectionLabel text="YOUR SHARE" progress={p7} />
          <h2 className="journey-section-title" style={{ opacity: fadeIn(p7, 0.02, 0.08) }}>
            The Bill
          </h2>

          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 'none', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Phase 1: Three big numbers (0.06 → 0.48) */}
            {(() => {
              const enter = fadeIn(p7, 0.06, 0.14);
              const exit = fadeIn(p7, 0.42, 0.50);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '20px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  {[
                    { amount: 113000, label: 'per citizen' },
                    { amount: 330000, label: 'per taxpayer' },
                    { amount: 286000, label: 'per household' },
                  ].map((item, i) => {
                    const s = stagger(fadeIn(p7, 0.08, 0.35), i, 3);
                    return (
                      <div key={i} style={{ opacity: s, transform: `scale(${lerp(0.9, 1, s)})`, textAlign: 'center' }}>
                        <div className="journey-big-number">
                          <CountUp end={item.amount} progress={s} prefix="$" decimals={0} comma />
                        </div>
                        <div className="journey-section-label" style={{ marginTop: '6px', letterSpacing: '0.06em' }}>
                          {item.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Phase 2: Unfunded liabilities (0.48 → 0.82) */}
            {(() => {
              const enter = fadeIn(p7, 0.48, 0.56);
              const exit = fadeIn(p7, 0.76, 0.84);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '20px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-body">
                    But the official debt is only part of the picture.
                  </div>
                  <div className="journey-visual-wide">
                    <UnfundedVisual progress={fadeIn(p7, 0.5, 0.72)} />
                  </div>
                </div>
              );
            })()}

            {/* Phase 3: SS depletion warning (0.82 → end) */}
            {(() => {
              const enter = fadeIn(p7, 0.82, 0.90);
              const y = (1 - enter) * 30;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: enter, transform: `translateY(${y}px)`, pointerEvents: enter < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-medium-number journey-red">2033</div>
                  <div className="journey-body" style={{ marginTop: '16px' }}>
                    Social Security trust fund depleted. Benefits drop to 77%.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== S8: THE WARNING ========== */}
      <section className="journey-section" style={{ height: '350vh' }}>
        <div className="journey-sticky">
          <SectionLabel text="THE WARNING" progress={p8} />
          <h2 className="journey-section-title" style={{ opacity: fadeIn(p8, 0.02, 0.08) }}>
            This Has Happened Before
          </h2>

          <div style={{ position: 'relative', width: '100%', maxWidth: '800px', flex: 'none', height: '60vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

            {/* Phase 1: Case cards (0.06 → 0.42) */}
            {(() => {
              const enter = fadeIn(p8, 0.06, 0.14);
              const exit = fadeIn(p8, 0.36, 0.44);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '12px',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  {[
                    { title: 'Weimar Germany', year: '1923', stat: '200 billion marks for a loaf of bread', color: 'var(--negative)' },
                    { title: 'Greece', year: '2010', stat: 'GDP fell 25%, unemployment hit 27%', color: 'var(--warning)' },
                    { title: 'Argentina', year: '2001', stat: '$93B default — 50% fell below poverty line', color: 'var(--info)' },
                  ].map((c, i) => (
                    <div key={i} className="journey-case-card" style={{
                      opacity: stagger(fadeIn(p8, 0.08, 0.32), i, 3),
                      transform: `translateX(${(1 - stagger(fadeIn(p8, 0.08, 0.32), i, 3)) * -40}px)`,
                      borderLeftColor: c.color, borderLeftWidth: '3px',
                    }}>
                      <div className="journey-case-title">{c.title}, {c.year}</div>
                      <div className="journey-case-stat">{c.stat}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Phase 2: Debt-to-GDP chart (0.42 → 0.76) */}
            {(() => {
              const enter = fadeIn(p8, 0.42, 0.50);
              const exit = fadeIn(p8, 0.70, 0.78);
              const o = enter * (1 - exit);
              const y = (1 - enter) * 30 + exit * -20;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: o, transform: `translateY(${y}px)`, pointerEvents: o < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-visual-wide">
                    <DebtToGdpVisual progress={fadeIn(p8, 0.44, 0.68)} />
                  </div>
                </div>
              );
            })()}

            {/* Phase 3: CBO warning text (0.76 → end) */}
            {(() => {
              const enter = fadeIn(p8, 0.76, 0.84);
              const y = (1 - enter) * 30;
              return (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: enter, transform: `translateY(${y}px)`, pointerEvents: enter < 0.01 ? 'none' : 'auto',
                }}>
                  <div className="journey-body">
                    CBO projections assume <em>no new spending programs</em>.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ========== S9: FINALE ========== */}
      <section className="journey-section" style={{ height: '250vh' }}>
        <div className="journey-sticky">
          {/* Flag accent stripe */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
            display: 'flex', pointerEvents: 'none',
          }}>
            <div style={{ flex: 1, background: 'rgba(220, 38, 38, 0.5)' }} />
            <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.15)' }} />
            <div style={{ flex: 1, background: 'rgba(30, 58, 138, 0.5)' }} />
          </div>

          <div style={{ opacity: fadeIn(p9, 0.01, 0.05), marginBottom: '16px' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(220, 38, 38, 0.6)" strokeWidth="1.5">
              <path d="M12 2L4 7v5c0 5.25 3.4 10.15 8 11.25 4.6-1.1 8-6 8-11.25V7l-8-5z" />
            </svg>
          </div>

          <h2 className="journey-section-title" style={{
            opacity: fadeIn(p9, 0.01, 0.06),
            fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
          }}>
            Now You Know
          </h2>

          <div className="journey-quote-block" style={{ opacity: fadeIn(p9, 0.05, 0.12) }}>
            <TypewriterText
              text="It is incumbent on every generation to pay its own debts as it goes. A principle which if acted on would save one-half the wars of the world."
              progress={fadeIn(p9, 0.06, 0.3)}
            />
            <div className="journey-attribution">— Thomas Jefferson</div>
          </div>

          <div className="journey-cta-group" style={{ opacity: fadeIn(p9, 0.28, 0.38) }}>
            <button className="journey-cta journey-cta-primary" onClick={() => { onTabChange('dashboard'); onBack(); }}>
              Explore the Data
            </button>
            <button className="journey-cta journey-cta-secondary" onClick={() => { onTabChange('spending'); onBack(); }}>
              See Where It Goes
            </button>
          </div>

          <div className="journey-footer" style={{ opacity: fadeIn(p9, 0.35, 0.45) }}>
            spending.wtf — Every dollar, accounted for.
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================
// AMERICAN FLAG — proper 13 stripes, canton, 50 stars
// ============================================

function AmericanFlag() {
  return (
    <svg
      style={{ width: '80vw', maxWidth: '700px', height: 'auto' }}
      viewBox="0 0 494 260"
      fill="none"
    >
      {/* 13 Stripes */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
        <rect key={i} x="0" y={i * 20} width="494" height="20"
          fill={i % 2 === 0 ? '#B50000' : '#FFFFFF'}
          opacity={i % 2 === 0 ? 1 : 0.95}
        />
      ))}
      {/* Blue Canton */}
      <rect x="0" y="0" width="198" height="140" fill="#0D152E" />
      {/* 50 Stars — 9 rows alternating 6 and 5 */}
      {[0,1,2,3,4,5].map(i => <circle key={`a${i}`} cx={16.5 + i * 33} cy={14} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4].map(i => <circle key={`b${i}`} cx={33 + i * 33} cy={28} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4,5].map(i => <circle key={`c${i}`} cx={16.5 + i * 33} cy={42} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4].map(i => <circle key={`d${i}`} cx={33 + i * 33} cy={56} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4,5].map(i => <circle key={`e${i}`} cx={16.5 + i * 33} cy={70} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4].map(i => <circle key={`f${i}`} cx={33 + i * 33} cy={84} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4,5].map(i => <circle key={`g${i}`} cx={16.5 + i * 33} cy={98} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4].map(i => <circle key={`h${i}`} cx={33 + i * 33} cy={112} r="5" fill="#FFFFFF" />)}
      {[0,1,2,3,4,5].map(i => <circle key={`i${i}`} cx={16.5 + i * 33} cy={126} r="5" fill="#FFFFFF" />)}
    </svg>
  );
}

// ============================================
// SVG VISUALS — full-width, large viewboxes
// ============================================

/** Gold bar — Section 2 */
function GoldBarVisual({ progress }: { progress: number }) {
  const barW = lerp(0, 680, easeOutCubic(progress));
  return (
    <svg viewBox="0 0 800 100" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="24" fill="var(--text-muted)" fontSize="16" fontWeight="600" fontFamily="var(--font-family)">
        1 oz GOLD = $35
      </text>
      <rect x="0" y="36" width={barW} height="40" rx="6" fill="#d97706" opacity="0.85" />
      {progress > 0.3 && (
        <text x={Math.max(barW - 16, 12)} y="62" fill="white" fontSize="16" fontWeight="600" fontFamily="var(--font-heading)" textAnchor="end">
          BACKED BY GOLD
        </text>
      )}
      {progress > 0.5 && (
        <text x="0" y="98" fill="var(--text-dim)" fontSize="14" fontFamily="var(--font-family)">
          Every dollar redeemable for physical gold — Bretton Woods, 1944
        </text>
      )}
    </svg>
  );
}

/** Debt growth: $398B vs $38.4T — Section 3 */
function DebtGrowthBars({ progress }: { progress: number }) {
  const maxW = 720;
  const bar1 = lerp(0, maxW * 0.04, easeOutCubic(Math.min(progress * 2, 1)));
  const bar2 = lerp(0, maxW, easeOutCubic(Math.max((progress - 0.3) / 0.7, 0)));
  return (
    <svg viewBox="0 0 800 130" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="22" fill="var(--text-muted)" fontSize="16" fontWeight="600" fontFamily="var(--font-family)">1971</text>
      <rect x="60" y="6" width={Math.max(bar1, 3)} height="28" rx="4" fill="var(--text-secondary)" />
      {progress > 0.2 && <text x={70 + bar1} y="26" fill="var(--text-secondary)" fontSize="18" fontFamily="var(--font-heading)">$398B</text>}

      <text x="0" y="68" fill="var(--text-muted)" fontSize="16" fontWeight="600" fontFamily="var(--font-family)">2025</text>
      <rect x="60" y="52" width={Math.max(bar2, 3)} height="28" rx="4" fill="var(--negative)" opacity="0.9" />
      {progress > 0.5 && (
        <text x={Math.min(65 + bar2, maxW)} y="72" fill="white" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)" textAnchor="end">
          $38.4 TRILLION
        </text>
      )}

      {progress > 0.7 && (
        <text x="60" y="110" fill="var(--text-dim)" fontSize="14" fontFamily="var(--font-family)">
          Same scale — the 1971 bar is barely visible
        </text>
      )}
    </svg>
  );
}

/** GDP share: 17% → 24% — Section 4 */
function GdpShareVisual({ progress }: { progress: number }) {
  const maxW = 720;
  const pctNew = lerp(17, 24, easeOutCubic(progress));
  const barOld = maxW * (17 / 40);
  const barNew = maxW * (pctNew / 40);
  return (
    <svg viewBox="0 0 800 160" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="22" fill="var(--text-primary)" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)">
        Federal Spending as % of GDP
      </text>

      <text x="0" y="60" fill="var(--text-muted)" fontSize="16" fontFamily="var(--font-family)">1950s</text>
      <rect x="80" y="44" width={barOld} height="26" rx="4" fill="var(--text-secondary)" opacity="0.5" />
      <text x={86 + barOld} y="63" fill="var(--text-secondary)" fontSize="18" fontFamily="var(--font-heading)">17%</text>

      <text x="0" y="106" fill="var(--text-muted)" fontSize="16" fontFamily="var(--font-family)">Today</text>
      <rect x="80" y="90" width={barNew} height="26" rx="4" fill="var(--negative)" opacity="0.85" />
      <text x={86 + barNew} y="109" fill="var(--negative)" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)">
        {pctNew.toFixed(0)}%
      </text>

      {progress > 0.5 && (
        <text x="0" y="148" fill="var(--text-dim)" fontSize="14" fontFamily="var(--font-family)">
          Last balanced budget: 2001 — over 25 consecutive years of deficits
        </text>
      )}
    </svg>
  );
}

/** M2 money supply — Section 5 */
function MoneySupplyVisual({ progress }: { progress: number }) {
  const maxW = 720;
  const bar1 = maxW * 0.71;
  const bar2 = lerp(bar1, maxW, easeOutCubic(progress));
  const diff = bar2 - bar1;
  return (
    <svg viewBox="0 0 800 120" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="22" fill="var(--text-primary)" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)">
        M2 Money Supply
      </text>

      <text x="0" y="58" fill="var(--text-muted)" fontSize="16" fontFamily="var(--font-family)">Jan 2020</text>
      <rect x="100" y="42" width={bar1} height="26" rx="4" fill="var(--text-secondary)" opacity="0.4" />
      <text x={106 + bar1} y="61" fill="var(--text-secondary)" fontSize="16" fontFamily="var(--font-heading)">$15.4T</text>

      <text x="0" y="98" fill="var(--text-muted)" fontSize="16" fontFamily="var(--font-family)">Apr 2022</text>
      <rect x="100" y="82" width={bar1} height="26" rx="4" fill="var(--text-secondary)" opacity="0.4" />
      <rect x={100 + bar1} y="82" width={Math.max(diff, 0)} height="26" rx="0" fill="var(--negative)" opacity="0.9" />
      {progress > 0.5 && <text x={106 + bar2} y="101" fill="var(--negative)" fontSize="16" fontWeight="600" fontFamily="var(--font-heading)">$21.7T</text>}
      {progress > 0.6 && (
        <text x={100 + bar1 + diff / 2} y="78" fill="var(--negative)" fontSize="15" fontWeight="600" fontFamily="var(--font-heading)" textAnchor="middle">
          +40%
        </text>
      )}
    </svg>
  );
}

/** Dollar purchasing power — Section 5 */
function DollarPowerVisual({ progress }: { progress: number }) {
  const maxW = 720;
  const shrunk = lerp(maxW, maxW * 0.12, easeOutCubic(progress));
  return (
    <svg viewBox="0 0 800 100" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="22" fill="var(--text-primary)" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)">
        Purchasing Power of $1
      </text>
      <rect x="0" y="34" width={maxW} height="30" rx="5" fill="var(--text-secondary)" opacity="0.08" />
      <rect x="0" y="34" width={shrunk} height="30" rx="5" fill={progress > 0.5 ? 'var(--negative)' : 'var(--positive)'} opacity="0.85" />
      <text x="0" y="88" fill="var(--text-dim)" fontSize="14" fontFamily="var(--font-family)">1971: $1.00</text>
      {progress > 0.7 && <text x={maxW} y="88" fill="var(--negative)" fontSize="16" fontWeight="600" fontFamily="var(--font-heading)" textAnchor="end">Today: $0.12 — lost 88% of its value</text>}
      {progress > 0.8 && shrunk < maxW * 0.3 && (
        <text x={shrunk / 2} y="55" fill="white" fontSize="16" fontWeight="600" fontFamily="var(--font-heading)" textAnchor="middle">
          -88%
        </text>
      )}
    </svg>
  );
}

/** Interest vs Defense vs Medicare — Section 6 */
function InterestCompareVisual({ progress }: { progress: number }) {
  const maxW = 720;
  const items = [
    { label: 'Interest on Debt', value: 1000, color: 'var(--negative)' },
    { label: 'Defense', value: 874, color: 'var(--info)' },
    { label: 'Medicare', value: 850, color: 'var(--positive)' },
  ];
  const scale = maxW / 1000;
  return (
    <svg viewBox="0 0 800 160" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="22" fill="var(--text-primary)" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)">
        Annual Federal Spending (FY2025)
      </text>
      {items.map((item, i) => {
        const barW = lerp(0, item.value * scale, easeOutCubic(Math.min(progress * 1.5 - i * 0.15, 1)));
        const y = 38 + i * 40;
        return (
          <g key={i}>
            <text x="0" y={y + 19} fill="var(--text-muted)" fontSize="15" fontFamily="var(--font-family)">{item.label}</text>
            <rect x="140" y={y + 2} width={Math.max(barW, 0)} height="24" rx="4" fill={item.color} opacity={i === 0 ? 0.9 : 0.45} />
            {progress > 0.4 + i * 0.1 && (
              <text x={146 + barW} y={y + 19} fill={item.color} fontSize="16" fontWeight="600" fontFamily="var(--font-heading)">
                ${item.value}B
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Spiral diagram — Section 6 */
function SpiralDiagram({ progress }: { progress: number }) {
  const steps = ['More Debt', 'More Interest', 'Bigger Deficit', 'More Borrowing'];
  const cx = 140, cy = 140, r = 110;
  return (
    <svg viewBox="0 0 280 280" width="260" height="260" style={{ overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4 4" />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 1} ${cy - r}`}
        fill="none" stroke="var(--negative)" strokeWidth="3" opacity="0.6"
        strokeDasharray={`${2 * Math.PI * r * progress} ${2 * Math.PI * r}`}
      />
      {steps.map((step, i) => {
        const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
        const x = cx + Math.cos(angle) * (r + 6);
        const y = cy + Math.sin(angle) * (r + 6);
        const s = stagger(progress, i, 4);
        return (
          <g key={i} opacity={s}>
            <circle cx={cx + Math.cos(angle) * r} cy={cy + Math.sin(angle) * r} r="7" fill="var(--negative)" />
            <text x={x} y={y} fill="var(--text-primary)" fontSize="14" fontWeight="600" fontFamily="var(--font-heading)"
              textAnchor={x > cx ? 'start' : x < cx ? 'end' : 'middle'}
              dominantBaseline={y > cy ? 'hanging' : y < cy ? 'auto' : 'middle'}
              dx={x > cx ? 12 : x < cx ? -12 : 0}
              dy={y > cy ? 10 : y < cy ? -10 : 0}
            >{step}</text>
          </g>
        );
      })}
      {progress > 0.8 && <text x={cx} y={cy + 5} fill="var(--negative)" fontSize="28" textAnchor="middle" dominantBaseline="middle">↻</text>}
    </svg>
  );
}

/** Unfunded liabilities — Section 7 */
function UnfundedVisual({ progress }: { progress: number }) {
  const maxW = 720;
  const debtBar = maxW * (38.4 / 175);
  const unfundedBar = lerp(0, maxW, easeOutCubic(progress));
  return (
    <svg viewBox="0 0 800 130" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="22" fill="var(--text-primary)" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)">
        The Full Picture
      </text>

      <text x="0" y="58" fill="var(--text-muted)" fontSize="16" fontFamily="var(--font-family)">National Debt</text>
      <rect x="150" y="42" width={debtBar} height="26" rx="4" fill="var(--negative)" opacity="0.7" />
      <text x={156 + debtBar} y="61" fill="var(--negative)" fontSize="16" fontFamily="var(--font-heading)">$38T</text>

      <text x="0" y="98" fill="var(--text-muted)" fontSize="16" fontFamily="var(--font-family)">+ Unfunded</text>
      <rect x="150" y="82" width={unfundedBar} height="26" rx="4" fill="var(--negative)" opacity="0.9" />
      {progress > 0.5 && (
        <text x={Math.min(156 + unfundedBar, maxW + 50)} y="101" fill="white" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)" textAnchor="end">
          $175 TRILLION
        </text>
      )}

      {progress > 0.7 && (
        <text x="150" y="128" fill="var(--text-dim)" fontSize="14" fontFamily="var(--font-family)">
          Social Security + Medicare promises the government can't keep
        </text>
      )}
    </svg>
  );
}

/** Debt-to-GDP projections — Section 8 */
function DebtToGdpVisual({ progress }: { progress: number }) {
  const maxW = 720;
  const maxPct = 180;
  const bars = [
    { label: 'WWII Peak', year: '1946', pct: 106, color: 'var(--text-secondary)' },
    { label: 'Today', year: '2025', pct: 100, color: 'var(--warning)' },
    { label: 'CBO Proj.', year: '2035', pct: 118, color: 'var(--negative)' },
    { label: 'CBO Proj.', year: '2055', pct: 156, color: 'var(--negative)' },
  ];
  return (
    <svg viewBox="0 0 800 210" width="100%" style={{ overflow: 'visible' }}>
      <text x="0" y="22" fill="var(--text-primary)" fontSize="18" fontWeight="600" fontFamily="var(--font-heading)">
        U.S. Debt-to-GDP Ratio
      </text>

      {/* 100% danger line */}
      <line x1="110" y1="36" x2="110" y2="192" stroke="var(--negative)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
      <text x="108" y="204" fill="var(--negative)" fontSize="11" fontFamily="var(--font-family)" textAnchor="end" opacity="0.6">100%</text>

      {bars.map((bar, i) => {
        const barW = lerp(0, (bar.pct / maxPct) * (maxW - 110), easeOutCubic(Math.min(progress * 1.8 - i * 0.2, 1)));
        const y = 38 + i * 42;
        return (
          <g key={i}>
            <text x="0" y={y + 18} fill="var(--text-dim)" fontSize="13" fontFamily="var(--font-family)">{bar.label}</text>
            <text x="60" y={y + 18} fill="var(--text-muted)" fontSize="13" fontFamily="var(--font-family)">{bar.year}</text>
            <rect x="110" y={y + 2} width={Math.max(barW, 0)} height="26" rx="4" fill={bar.color} opacity={i >= 2 ? 0.85 : 0.45} />
            {barW > 40 && (
              <text x={106 + barW} y={y + 20} fill={bar.color} fontSize="16" fontWeight="600" fontFamily="var(--font-heading)">
                {bar.pct}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================
// Text Helpers
// ============================================

function TypewriterText({ text, progress }: { text: string; progress: number }) {
  const visible = Math.floor(text.length * clamp(progress, 0, 1));
  return (
    <div className="journey-quote">
      {'\u201C'}{text.slice(0, visible)}
      {visible < text.length && <span className="journey-cursor">|</span>}
      {visible >= text.length && '\u201D'}
    </div>
  );
}

function CountUp({ end, progress, prefix = '', suffix = '', decimals = 0, comma = false }: {
  end: number; progress: number; prefix?: string; suffix?: string; decimals?: number; comma?: boolean;
}) {
  const value = end * easeOutCubic(clamp(progress, 0, 1));
  const formatted = comma ? Math.round(value).toLocaleString('en-US') : value.toFixed(decimals);
  return <>{prefix}{formatted}{suffix}</>;
}

function SectionLabel({ text, progress }: { text: string; progress: number }) {
  return (
    <div className="journey-section-label" style={{
      opacity: fadeIn(progress, 0, 0.05),
      transform: `translateY(${(1 - fadeIn(progress, 0, 0.05)) * 10}px)`,
    }}>
      {text}
    </div>
  );
}
