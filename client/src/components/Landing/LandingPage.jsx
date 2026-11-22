import React, { useEffect } from 'react';
import '../../styles/landing.css';
import AnimatedBackground from './AnimatedBackground';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import DemoSection from './DemoSection';
import SocialProofSection from './SocialProofSection';
import FinalCTA from './FinalCTA';

export default function LandingPage({ onOpenAuthModal }) {
  // Scroll progress bar
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      document.documentElement.style.setProperty('--scroll-pct', pct + '%');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--l-bg)', minHeight: '100vh', position: 'relative' }}>
      {/* Scroll progress */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: 3,
          width: 'var(--scroll-pct, 0%)',
          background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #06B6D4)',
          zIndex: 200,
          transition: 'width 0.1s linear',
          pointerEvents: 'none',
        }}
      />

      {/* Fixed animated background */}
      <AnimatedBackground />

      {/* Fixed top navbar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(7,7,12,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: '#F0F0F5',
            letterSpacing: '-0.02em',
          }}
        >
          Portfolio
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenAuthModal}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              background: 'transparent',
              color: 'rgba(240,240,245,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#F0F0F5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(240,240,245,0.7)'; }}
          >
            Sign In
          </button>
          <button
            onClick={onOpenAuthModal}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.35)'; }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Page sections */}
      <HeroSection onOpenAuthModal={onOpenAuthModal} />
      <FeaturesSection />
      <DemoSection />
      <SocialProofSection />
      <FinalCTA onOpenAuthModal={onOpenAuthModal} />

      {/* Footer */}
      <footer
        style={{
          background: '#040408',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 13, color: 'rgba(240,240,245,0.3)', margin: 0 }}>
          © 2025 Portfolio. Built for investors who care.
        </p>
      </footer>
    </div>
  );
}
