import React from 'react';

export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        background: 'var(--l-bg)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Blob 1 — indigo */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: '#6366F1',
          filter: 'blur(130px)',
          opacity: 0.12,
          top: -100,
          left: -100,
          animation: 'landing-blob-move-1 18s ease-in-out infinite',
        }}
      />
      {/* Blob 2 — violet */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: '#8B5CF6',
          filter: 'blur(130px)',
          opacity: 0.1,
          bottom: -100,
          right: '10%',
          animation: 'landing-blob-move-2 22s ease-in-out infinite',
        }}
      />
      {/* Blob 3 — cyan */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: '#06B6D4',
          filter: 'blur(130px)',
          opacity: 0.07,
          top: '40%',
          left: '40%',
          animation: 'landing-blob-move-3 26s ease-in-out infinite',
        }}
      />
    </div>
  );
}
