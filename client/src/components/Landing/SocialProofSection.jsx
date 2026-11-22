import React, { useRef, useEffect, useState } from 'react';
import ScrollReveal from './ScrollReveal';

function useCountUp(target, duration = 1500, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || target === 0) return;
    let startTime = null;
    let rafId;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [started, target, duration]);
  return count;
}

const STATS = [
  { value: 10, suffix: '+', label: 'Wallets Supported', numeric: true },
  { value: 5, suffix: '', label: 'Exchanges Connected', numeric: true },
  { value: null, display: '∞', label: 'Assets Trackable', numeric: false },
  { value: 100, suffix: '%', label: 'Private — Your Data', numeric: true },
];

const PLATFORMS = [
  { name: 'Binance', emoji: '🟡' },
  { name: 'Coinbase', emoji: '🔵' },
  { name: 'Robinhood', emoji: '🟢' },
  { name: 'Ledger', emoji: '⬜' },
  { name: 'Kraken', emoji: '🟣' },
  { name: 'Fidelity', emoji: '🔵' },
  { name: 'Schwab', emoji: '🟤' },
  { name: 'Zerodha', emoji: '🟢' },
  { name: 'Groww', emoji: '🟣' },
  { name: 'Interactive Brokers', emoji: '🔵' },
  { name: 'Custom Wallets', emoji: '✦' },
];

function StatBlock({ stat, started, index }) {
  const count = useCountUp(stat.numeric ? stat.value : 0, 1500, started);
  const display = stat.numeric ? count + stat.suffix : stat.display;

  return (
    <ScrollReveal delay={index * 150}>
      <div style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div
          style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #F0F0F5, #A5B4FC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {display}
        </div>
        <div style={{ fontSize: 14, color: 'var(--l-muted)', fontWeight: 500 }}>{stat.label}</div>
      </div>
    </ScrollReveal>
  );
}

export default function SocialProofSection() {
  const sectionRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const tickerItems = [...PLATFORMS, ...PLATFORMS]; // doubled for seamless loop

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '120px 0',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        {/* Heading */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 800,
                color: 'var(--l-text)',
                letterSpacing: '-0.03em',
                marginBottom: 12,
              }}
            >
              Built for serious investors
            </h2>
            <p style={{ fontSize: 16, color: 'var(--l-muted)' }}>
              Trusted by portfolio trackers across 40+ countries
            </p>
          </div>
        </ScrollReveal>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0,
            borderRadius: 20,
            background: 'var(--l-surface)',
            border: '1px solid var(--l-border)',
            overflow: 'hidden',
            marginBottom: 60,
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={i}
              style={{
                borderRight: i < STATS.length - 1 ? '1px solid var(--l-border)' : 'none',
              }}
            >
              <StatBlock stat={stat} started={started} index={i} />
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--l-border)', margin: '0 0 60px' }} />

      {/* Platform ticker */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontSize: 14, color: 'var(--l-caption)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Works with your favorite platforms
          </p>
        </div>
        <div style={{ overflow: 'hidden', padding: '8px 0' }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              width: 'max-content',
              animation: 'landing-ticker 25s linear infinite',
            }}
          >
            {tickerItems.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 12,
                  background: 'var(--l-surface)',
                  border: '1px solid var(--l-border)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--l-muted)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span>{p.emoji}</span>
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
