import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

function useCountUp(target, duration = 1500, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime = null;
    let rafId;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [started, target, duration]);
  return count;
}

const HOLDINGS_ROWS = [
  { symbol: 'BTC', name: 'Bitcoin', alloc: '42.3%', delta: '+1.24%', up: true, color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', alloc: '28.1%', delta: '−0.81%', up: false, color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', alloc: '14.9%', delta: '+4.12%', up: true, color: '#9945FF' },
];

export default function DemoSection() {
  const cardRef = useRef(null);
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [rowsVisible, setRowsVisible] = useState(false);

  const totalValue = useCountUp(124832, 1800, inView);
  const todayGain = useCountUp(2841, 1600, inView);
  const walletCount = useCountUp(5, 800, inView);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          setTimeout(() => setRowsVisible(true), 600);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!cardRef.current) return;
      cardRef.current.style.transform = `translateY(${window.scrollY * 0.05}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fmtValue = (n) => {
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K';
    return '$' + n;
  };

  return (
    <section
      id="demo-section"
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '120px 24px',
        textAlign: 'center',
      }}
    >
      <ScrollReveal>
        <h2
          style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            color: 'var(--l-text)',
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}
        >
          See your portfolio come alive
        </h2>
        <p style={{ fontSize: 17, color: 'var(--l-muted)', marginBottom: 64, maxWidth: 480, margin: '0 auto 64px' }}>
          Real-time data. Beautiful visualizations. Zero complexity.
        </p>
      </ScrollReveal>

      {/* Main demo card with parallax */}
      <div
        ref={cardRef}
        style={{
          maxWidth: 900,
          margin: '0 auto',
          background: 'var(--l-surface)',
          border: '1px solid var(--l-border)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'card-entrance 0.9s ease 0.2s both',
        }}
      >
        {/* Mac-style title bar */}
        <div
          style={{
            background: 'var(--l-surface-2)',
            borderBottom: '1px solid var(--l-border)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--l-muted)', fontWeight: 500 }}>Portfolio — Live Dashboard</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#22C55E', fontWeight: 600 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
            Live
          </div>
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total Value', value: fmtValue(totalValue), raw: totalValue, prefix: '$', isMain: true },
              { label: "Today's Gain", value: '+$' + todayGain.toLocaleString(), color: '#22C55E' },
              { label: 'Wallets', value: walletCount, suffix: ' connected' },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--l-border)',
                  borderRadius: 14,
                  padding: '18px 20px',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--l-caption)', marginBottom: 8 }}>{stat.label}</div>
                <div
                  style={{
                    fontSize: i === 0 ? 28 : 22,
                    fontWeight: 800,
                    color: stat.color || 'var(--l-text)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.value}{stat.suffix || ''}
                </div>
              </div>
            ))}
          </div>

          {/* Sparkline */}
          <div
            style={{
              background: 'rgba(99,102,241,0.04)',
              borderRadius: 14,
              padding: '16px 12px 8px',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--l-muted)', marginBottom: 8, textAlign: 'left', paddingLeft: 4 }}>Portfolio Performance — 30 days</div>
            <svg viewBox="0 0 500 90" style={{ width: '100%', height: 70 }}>
              <defs>
                <linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,80 C25,78 40,70 70,58 C95,48 110,62 145,50 C175,40 195,55 225,42 C255,29 275,45 310,30 C340,18 360,32 395,18 C420,10 440,14 500,5"
                fill="none"
                stroke="#6366F1"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 1200,
                  strokeDashoffset: inView ? 0 : 1200,
                  transition: 'stroke-dashoffset 2s ease 0.3s',
                }}
              />
              <path
                d="M0,80 C25,78 40,70 70,58 C95,48 110,62 145,50 C175,40 195,55 225,42 C255,29 275,45 310,30 C340,18 360,32 395,18 C420,10 440,14 500,5 L500,90 L0,90 Z"
                fill="url(#demoGrad)"
              />
            </svg>
          </div>

          {/* Holdings rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--l-muted)', marginBottom: 4, textAlign: 'left' }}>Top Holdings</div>
            {HOLDINGS_ROWS.map((h, i) => (
              <div
                key={h.symbol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  opacity: rowsVisible ? 1 : 0,
                  transform: rowsVisible ? 'translateX(0)' : 'translateX(40px)',
                  transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: h.color + '1A',
                    border: `1.5px solid ${h.color}44`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: h.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--l-text)' }}>{h.symbol}</div>
                  <div style={{ fontSize: 11, color: 'var(--l-caption)' }}>{h.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--l-muted)' }}>{h.alloc}</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: h.up ? '#22C55E' : '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      justifyContent: 'flex-end',
                    }}
                  >
                    {h.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {h.delta}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
