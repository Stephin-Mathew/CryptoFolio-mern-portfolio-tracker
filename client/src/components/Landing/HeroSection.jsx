import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

const HEADLINE_WORDS = [
  { text: 'Track', accent: false },
  { text: 'Every', accent: false },
  { text: 'Asset.', accent: false },
  { text: 'Every', accent: false },
  { text: 'Wallet.', accent: false },
  { text: 'One', accent: true },
  { text: 'Dashboard.', accent: false },
];

const HOLDINGS = [
  { symbol: 'BTC', name: 'Bitcoin', pct: '42.3%', delta: '+1.24%', up: true, color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum', pct: '28.1%', delta: '−0.81%', up: false, color: '#627EEA' },
  { symbol: 'SOL', name: 'Solana', pct: '14.9%', delta: '+4.12%', up: true, color: '#9945FF' },
];

const WALLETS = [
  { name: 'Binance', color: '#F3BA2F' },
  { name: 'Coinbase', color: '#0052FF' },
  { name: 'Ledger', color: '#888' },
];

export default function HeroSection({ onOpenAuthModal }) {
  const cardRef = useRef(null);
  const [wordsVisible, setWordsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWordsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(1200px) rotateY(${x * 14}deg) rotateX(${y * -14}deg) scale(1.025)`;
    cardRef.current.style.transition = 'transform 0.1s ease';
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1)';
    cardRef.current.style.transition = 'transform 0.6s ease';
  };

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '120px 24px 100px',
        zIndex: 1,
        textAlign: 'center',
      }}
    >
      {/* Badge chip */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 16px',
          borderRadius: 24,
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.25)',
          fontSize: 12,
          fontWeight: 600,
          color: '#A5B4FC',
          marginBottom: 36,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          animation: 'landing-fade-in 0.6s ease forwards',
        }}
      >
        <Sparkles size={13} />
        AI-Powered · Multi-Wallet · Real-time
      </div>

      {/* Animated headline */}
      <h1
        style={{
          fontSize: 'clamp(40px, 7vw, 76px)',
          fontWeight: 800,
          color: 'var(--l-text)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: 28,
          maxWidth: 800,
        }}
      >
        {HEADLINE_WORDS.map((word, i) => (
          <span
            key={i}
            className="landing-word"
            style={{
              animationDelay: wordsVisible ? `${i * 80}ms` : '9999s',
              color: word.accent ? 'var(--l-accent)' : 'inherit',
              marginRight: i === HEADLINE_WORDS.length - 1 ? 0 : '0.25em',
              display: 'inline-block',
            }}
          >
            {word.text}
          </span>
        ))}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 18,
          color: 'var(--l-muted)',
          lineHeight: 1.7,
          maxWidth: 540,
          marginBottom: 48,
          animation: 'landing-fade-up 0.7s ease 600ms both',
        }}
      >
        Manage Binance, Coinbase, Ledger, Robinhood, and custom wallets.
        Snap a screenshot — AI extracts your holdings instantly.
      </p>

      {/* CTA Buttons */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 80,
          animation: 'landing-fade-up 0.7s ease 800ms both',
        }}
      >
        <button
          onClick={onOpenAuthModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 32px',
            borderRadius: 14,
            background: 'var(--l-accent)',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.4)'; }}
        >
          Get Started <ArrowRight size={16} />
        </button>
        <button
          onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 32px',
            borderRadius: 14,
            background: 'transparent',
            color: 'var(--l-muted)',
            border: '1px solid var(--l-border-hover)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'var(--l-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--l-border-hover)'; e.currentTarget.style.color = 'var(--l-muted)'; }}
        >
          See how it works ↓
        </button>
      </div>

      {/* 3D Tilt Dashboard Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          animation: 'card-entrance 0.9s ease 400ms both',
        }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            background: 'var(--l-surface)',
            border: '1px solid var(--l-border)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            cursor: 'default',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Card header */}
          <div
            style={{
              background: 'var(--l-surface-2)',
              borderBottom: '1px solid var(--l-border)',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--l-muted)', fontWeight: 500, marginLeft: 8 }}>Portfolio — Live Dashboard</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#22C55E', fontWeight: 600 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              Live
            </div>
          </div>

          {/* Card content */}
          <div style={{ padding: '24px 24px 20px' }}>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total Value', value: '$124,832', sub: '+2.3% today', up: true },
                { label: "Today's Gain", value: '+$2,841', sub: 'vs yesterday', up: true },
                { label: '30-Day Return', value: '+18.4%', sub: 'Since Oct 23', up: true },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--l-border)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--l-caption)', marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: stat.up ? '#22C55E' : '#EF4444', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--l-caption)', marginTop: 4 }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Sparkline SVG */}
            <div style={{ marginBottom: 20, borderRadius: 10, overflow: 'hidden', background: 'rgba(99,102,241,0.04)', padding: '12px 8px 4px' }}>
              <svg viewBox="0 0 400 80" style={{ width: '100%', height: 60 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,65 C30,60 50,55 80,45 C110,35 130,50 160,38 C190,26 210,42 240,30 C270,18 290,28 320,15 C350,8 370,12 400,5"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: 0,
                    animation: 'landing-draw-line 2s ease 1.2s both',
                  }}
                />
                <path
                  d="M0,65 C30,60 50,55 80,45 C110,35 130,50 160,38 C190,26 210,42 240,30 C270,18 290,28 320,15 C350,8 370,12 400,5 L400,80 L0,80 Z"
                  fill="url(#sparkGrad)"
                />
              </svg>
            </div>

            {/* Holdings rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {HOLDINGS.map((h, i) => (
                <div
                  key={h.symbol}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    animation: `landing-fade-up 0.4s ease ${1.4 + i * 0.1}s both`,
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: h.color + '22', border: `1px solid ${h.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--l-text)' }}>{h.symbol}</div>
                    <div style={{ fontSize: 11, color: 'var(--l-caption)' }}>{h.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--l-muted)' }}>{h.pct}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: h.up ? '#22C55E' : '#EF4444' }}>{h.delta}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Wallet chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {WALLETS.map(w => (
                <div
                  key={w.name}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--l-border)',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--l-muted)',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: w.color }} />
                  {w.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          animation: 'float-y 2.5s ease-in-out infinite, landing-fade-in 1s ease 2s both',
          opacity: 0,
        }}
      >
        <div style={{ fontSize: 11, color: 'var(--l-caption)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scroll</div>
        <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, var(--l-caption), transparent)' }} />
      </div>
    </section>
  );
}
