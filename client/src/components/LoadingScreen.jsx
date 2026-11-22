import React, { useState, useEffect } from 'react';

const LETTERS = 'Portfolio'.split('');

const STEPS = [
  'Connecting to secure vault…',
  'Loading wallets & accounts…',
  'Fetching live market quotes…',
  'Almost ready…',
];

export const LoadingScreen = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((p) => Math.min(p + 1, STEPS.length - 1)), 650);
    return () => clearInterval(id);
  }, []);

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <>
      <style>{`
        @keyframes loading-spin-ring { to { transform: rotate(360deg); } }
        @keyframes loading-logo-pulse { 0%,100% { box-shadow: 0 8px 32px rgba(99,102,241,0.3); } 50% { box-shadow: 0 8px 48px rgba(99,102,241,0.7); } }
        @keyframes loading-letter-rise { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes loading-shimmer-bar { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes float-y { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
        @keyframes landing-fade-up { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
        @keyframes landing-fade-in { from { opacity:0; } to { opacity:1; } }
        @keyframes landing-word-rise { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes landing-draw-line { from { stroke-dashoffset:1000; } to { stroke-dashoffset:0; } }
        @keyframes landing-blob-move-1 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(70px,-50px) scale(1.15); } }
        @keyframes landing-blob-move-2 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-50px,80px) scale(0.85); } }
        @keyframes landing-blob-move-3 { 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(40px,40px) scale(1.1); } }
        @keyframes landing-pulse-glow { 0%,100% { box-shadow:0 0 0 0 rgba(99,102,241,0.5); } 50% { box-shadow:0 0 32px 12px rgba(99,102,241,0); } }
        @keyframes landing-shimmer { from { background-position:-300% 0; } to { background-position:300% 0; } }
        @keyframes landing-ticker { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes card-entrance { from { opacity:0; transform:translateY(60px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        .landing-word { display:inline-block; opacity:0; animation: landing-word-rise 0.5s ease forwards; }
        .landing-scroll-reveal { opacity:0; transform:translateY(32px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .landing-scroll-reveal.in-view { opacity:1; transform:translateY(0); }
        .landing-scroll-reveal-left { opacity:0; transform:translateX(-40px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .landing-scroll-reveal-left.in-view { opacity:1; transform:translateX(0); }
        .landing-scroll-reveal-right { opacity:0; transform:translateX(40px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .landing-scroll-reveal-right.in-view { opacity:1; transform:translateX(0); }
        .landing-scroll-reveal-scale { opacity:0; transform:scale(0.9); transition: opacity 0.65s ease, transform 0.65s ease; }
        .landing-scroll-reveal-scale.in-view { opacity:1; transform:scale(1); }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07070C',
          flexDirection: 'column',
        }}
      >
        {/* Spinning ring + logo */}
        <div style={{ position: 'relative', width: 112, height: 112, marginBottom: 28 }}>
          {/* Conic gradient spinning ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, #6366F1 0%, #8B5CF6 40%, #06B6D4 70%, #07070C 100%)',
              animation: 'loading-spin-ring 1.8s linear infinite',
            }}
          />
          {/* Mask inner circle */}
          <div
            style={{
              position: 'absolute',
              inset: 7,
              borderRadius: '50%',
              background: '#07070C',
            }}
          />
          {/* Logo */}
          <div
            style={{
              position: 'absolute',
              inset: 14,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
              animation: 'loading-logo-pulse 2.2s ease-in-out infinite',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#fff',
                transform: 'rotate(45deg)',
              }}
            />
          </div>
        </div>

        {/* Animated wordmark */}
        <div
          style={{
            display: 'flex',
            gap: 1,
            marginBottom: 16,
          }}
        >
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#F0F0F5',
                letterSpacing: '-0.01em',
                opacity: 0,
                animation: `loading-letter-rise 0.4s ease ${200 + i * 50}ms forwards`,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Status text */}
        <p
          key={step}
          style={{
            fontSize: 13,
            color: 'rgba(240,240,245,0.45)',
            margin: '0 0 36px',
            minHeight: 20,
            animation: 'loading-letter-rise 0.3s ease forwards',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {STEPS[step]}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: 220,
            height: 3,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              height: '100%',
              width: progress + '%',
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #06B6D4)',
              backgroundSize: '300% 100%',
              borderRadius: 2,
              transition: 'width 0.65s ease',
              animation: 'loading-shimmer-bar 2s linear infinite',
            }}
          />
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i <= step ? '#6366F1' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.4s ease',
                boxShadow: i <= step ? '0 0 8px rgba(99,102,241,0.6)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};
