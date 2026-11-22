import React, { useRef, useEffect, useState } from 'react';
import { Camera, Zap, BarChart3, Wallet, PieChart, TrendingUp } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

function WalletConnectCard() {
  const exchanges = [
    { name: 'BNB', color: '#F3BA2F', angle: 0 },
    { name: 'CB', color: '#0052FF', angle: 90 },
    { name: 'RH', color: '#00C805', angle: 180 },
    { name: 'LD', color: '#888', angle: 270 },
  ];
  return (
    <div style={{ position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Orbit ring */}
      <div
        style={{
          position: 'absolute',
          width: 150,
          height: 150,
          borderRadius: '50%',
          border: '1px dashed rgba(255,255,255,0.1)',
        }}
      />
      {/* Center hub */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(99,102,241,0.4)',
          zIndex: 1,
        }}
      >
        <Wallet size={20} color="white" />
      </div>
      {/* Orbiting exchange chips */}
      {exchanges.map((ex, i) => {
        const rad = (ex.angle * Math.PI) / 180;
        const radius = 75;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        return (
          <div
            key={ex.name}
            style={{
              position: 'absolute',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: ex.color + '22',
              border: `1px solid ${ex.color}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: ex.color,
              left: `calc(50% + ${x}px - 18px)`,
              top: `calc(50% + ${y}px - 18px)`,
              animation: `float-y ${2.5 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {ex.name}
          </div>
        );
      })}
    </div>
  );
}

function ScreenshotCard() {
  const rows = ['BTC   0.52   $51,200', 'ETH   4.80   $17,120', 'SOL   120    $14,400'];
  return (
    <div style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 11 }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            padding: '6px 10px',
            background: 'rgba(99,102,241,0.08)',
            borderRadius: 6,
            marginBottom: 6,
            color: '#22C55E',
            animation: `landing-fade-up 0.4s ease ${i * 0.3}s both`,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: 'var(--l-muted)' }}>{row}</span>
          <span style={{ color: '#22C55E' }}>✓</span>
        </div>
      ))}
    </div>
  );
}

function PriceTickerCard() {
  const prices = [
    { sym: 'BTC', price: '$95,420', delta: '+1.24%', up: true },
    { sym: 'ETH', price: '$3,180', delta: '-0.81%', up: false },
    { sym: 'SOL', price: '$198.4', delta: '+4.12%', up: true },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {prices.map(p => (
        <div key={p.sym} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--l-text)' }}>{p.sym}</span>
          <span style={{ fontSize: 12, color: 'var(--l-muted)', fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: p.up ? '#22C55E' : '#EF4444' }}>{p.delta}</span>
        </div>
      ))}
    </div>
  );
}

function MiniLineChart({ visible }) {
  return (
    <svg viewBox="0 0 200 60" style={{ width: '100%', height: 50, marginTop: 12 }}>
      <path
        d="M0,50 C20,45 35,35 60,25 C85,15 100,30 130,20 C155,12 170,18 200,5"
        fill="none"
        stroke="#6366F1"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          strokeDasharray: 500,
          strokeDashoffset: visible ? 0 : 500,
          transition: 'stroke-dashoffset 1.5s ease',
        }}
      />
    </svg>
  );
}

function PnLBarChart({ visible }) {
  const bars = [
    { label: 'BTC', pct: 72, color: '#F7931A', positive: true },
    { label: 'ETH', pct: 45, color: '#627EEA', positive: true },
    { label: 'Cash', pct: 20, color: '#888', positive: false },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {bars.map(b => (
        <div key={b.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--l-muted)', marginBottom: 4 }}>
            <span>{b.label}</span>
            <span style={{ color: b.positive ? '#22C55E' : '#EF4444' }}>{b.positive ? '+' : ''}{b.pct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: visible ? b.pct + '%' : '0%',
                background: b.color,
                borderRadius: 3,
                transition: 'width 1.2s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CashRingCard({ visible }) {
  const circumference = 2 * Math.PI * 36;
  const pct = 0.63;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="45" cy="45" r="36"
          fill="none"
          stroke="#22C55E"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={visible ? circumference * (1 - pct) : circumference}
          style={{ transition: 'stroke-dashoffset 1.4s ease', transform: 'rotate(-90deg)', transformOrigin: '45px 45px' }}
        />
        <text x="45" y="49" textAnchor="middle" fontSize="13" fontWeight="700" fill="#22C55E">63%</text>
      </svg>
      <div style={{ fontSize: 11, color: 'var(--l-muted)', marginTop: 6 }}>Cash allocation</div>
    </div>
  );
}

export default function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState({});
  const cardRefs = useRef({});

  useEffect(() => {
    const observers = [];
    ['analytics', 'pnl', 'cash'].forEach(id => {
      const el = cardRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards(prev => ({ ...prev, [id]: true }));
            obs.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const featureCardStyle = () => ({
    background: 'var(--l-surface)',
    border: '1px solid var(--l-border)',
    borderRadius: 20,
    padding: '24px 24px 20px',
    transition: 'border-color 0.25s ease, transform 0.25s ease',
    cursor: 'default',
  });

  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '120px 24px',
        maxWidth: 1140,
        margin: '0 auto',
      }}
    >
      {/* Heading */}
      <ScrollReveal>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 800,
              color: 'var(--l-text)',
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            Everything you need to track your wealth
          </h2>
          <p style={{ fontSize: 17, color: 'var(--l-muted)', maxWidth: 480, margin: '0 auto' }}>
            One dashboard. All your wallets. AI-powered insights.
          </p>
        </div>
      </ScrollReveal>

      {/* Bento grid row 1 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Tall left card */}
        <ScrollReveal direction="left" delay={0} style={{ gridRow: 'span 2' }}>
          <div
            style={{ ...featureCardStyle(), height: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--l-border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--l-border)'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A5B4FC' }}>
                <Wallet size={18} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--l-text)', margin: 0 }}>Multi-Wallet Connect</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--l-muted)', margin: '0 0 8px', lineHeight: 1.6 }}>
              Link Binance, Coinbase, Ledger, Robinhood and more. All in one place.
            </p>
            <WalletConnectCard />
          </div>
        </ScrollReveal>

        {/* Screenshot card */}
        <ScrollReveal direction="right" delay={100}>
          <div
            style={featureCardStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--l-border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--l-border)'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A5B4FC' }}>
                <Camera size={18} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--l-text)', margin: 0 }}>AI Screenshot Import</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--l-muted)', margin: '0 0 8px', lineHeight: 1.6 }}>
              Snap any portfolio screenshot. AI extracts all holdings instantly.
            </p>
            <ScreenshotCard />
          </div>
        </ScrollReveal>

        {/* Live quotes card */}
        <ScrollReveal direction="right" delay={200}>
          <div
            style={featureCardStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--l-border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--l-border)'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
                <Zap size={18} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--l-text)', margin: 0 }}>Live Market Quotes</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--l-muted)', margin: '0 0 8px', lineHeight: 1.6 }}>
              Real-time prices for crypto, stocks, and funds — always fresh.
            </p>
            <PriceTickerCard />
          </div>
        </ScrollReveal>
      </div>

      {/* Row 2 — 3 equal cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Analytics */}
        <ScrollReveal delay={0}>
          <div
            ref={el => cardRefs.current['analytics'] = el}
            style={featureCardStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--l-border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--l-border)'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A5B4FC' }}>
                <BarChart3 size={18} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--l-text)', margin: 0 }}>Analytics</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--l-muted)', lineHeight: 1.6, marginBottom: 4 }}>
              Beautiful charts and performance insights.
            </p>
            <MiniLineChart visible={visibleCards['analytics']} />
          </div>
        </ScrollReveal>

        {/* P&L */}
        <ScrollReveal delay={120}>
          <div
            ref={el => cardRefs.current['pnl'] = el}
            style={featureCardStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--l-border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--l-border)'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22C55E' }}>
                <TrendingUp size={18} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--l-text)', margin: 0 }}>P&L Tracking</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--l-muted)', lineHeight: 1.6, marginBottom: 4 }}>
              Know exactly where your gains and losses come from.
            </p>
            <PnLBarChart visible={visibleCards['pnl']} />
          </div>
        </ScrollReveal>

        {/* Cash wallets */}
        <ScrollReveal delay={240}>
          <div
            ref={el => cardRefs.current['cash'] = el}
            style={featureCardStyle()}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--l-border-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--l-border)'; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBB024' }}>
                <PieChart size={18} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--l-text)', margin: 0 }}>Cash Wallets</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--l-muted)', lineHeight: 1.6, marginBottom: 4 }}>
              Track cash, stablecoins, and fiat alongside your investments.
            </p>
            <CashRingCard visible={visibleCards['cash']} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
