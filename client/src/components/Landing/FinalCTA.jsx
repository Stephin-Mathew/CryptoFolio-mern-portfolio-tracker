import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import ScrollReveal from './ScrollReveal';

export default function FinalCTA({ onOpenAuthModal }) {
  return (
    <section
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '160px 24px',
        textAlign: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Gradient background glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative rings */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.15)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.07)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.04)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <ScrollReveal>
          {/* Badge */}
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
            }}
          >
            <Sparkles size={13} />
            Start for free today
          </div>

          {/* Headline */}
          <h2
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 900,
              color: 'var(--l-text)',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: 24,
            }}
          >
            Your entire portfolio.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #6366F1, #A5B4FC, #06B6D4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              One place.
            </span>
          </h2>

          {/* Sub */}
          <p
            style={{
              fontSize: 18,
              color: 'var(--l-muted)',
              maxWidth: 480,
              margin: '0 auto 48px',
              lineHeight: 1.7,
            }}
          >
            No spreadsheets. No manual entry. Just your wealth, beautifully tracked.
          </p>

          {/* CTA Button */}
          <button
            onClick={onOpenAuthModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '18px 44px',
              borderRadius: 16,
              background: 'var(--l-accent)',
              color: '#fff',
              border: 'none',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              animation: 'landing-pulse-glow 2.5s ease-in-out infinite',
              boxShadow: '0 8px 40px rgba(99,102,241,0.4)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
          >
            Get Started — It's Free
            <ArrowRight size={18} />
          </button>

          {/* Fine print */}
          <p
            style={{
              marginTop: 20,
              fontSize: 13,
              color: 'var(--l-caption)',
            }}
          >
            No credit card required · Sign in with Google
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
