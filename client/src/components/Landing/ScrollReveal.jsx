import React, { useRef, useState, useEffect } from 'react';

export default function ScrollReveal({ children, delay = 0, direction = 'up', className = '', style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const dirClass = {
    up: 'landing-scroll-reveal',
    left: 'landing-scroll-reveal-left',
    right: 'landing-scroll-reveal-right',
    scale: 'landing-scroll-reveal-scale',
  }[direction] || 'landing-scroll-reveal';

  return (
    <div
      ref={ref}
      className={`${dirClass}${visible ? ' in-view' : ''} ${className}`}
      style={{ transitionDelay: delay + 'ms', ...style }}
    >
      {children}
    </div>
  );
}
