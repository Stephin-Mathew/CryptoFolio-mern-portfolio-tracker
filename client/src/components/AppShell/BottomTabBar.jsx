import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, List, Wallet, BarChart2, Sparkles, X } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/holdings', label: 'Holdings', icon: List, end: true },
  { to: '/wallets', label: 'Wallets', icon: Wallet, end: false },
  { to: '/analytics', label: 'Analytics', icon: BarChart2, end: true },
];

export function BottomTabBar({
  onOpenUploadModal,
  onOpenJsonExtractModal,
  onOpenAddModal,
  onOpenAddWalletModal,
  onRefreshPrices,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const items = [
    {
      label: 'Upload screenshot',
      sub: 'AI extracts holdings with Gemini Vision',
      action: () => {
        setMenuOpen(false);
        if (onOpenUploadModal) onOpenUploadModal();
      },
    },
    {
      label: 'Paste JSON',
      sub: 'Import from your LLM',
      action: () => {
        setMenuOpen(false);
        if (onOpenJsonExtractModal) onOpenJsonExtractModal();
      },
    },
    {
      label: 'Add holding manually',
      sub: 'Enter details by hand',
      action: () => {
        setMenuOpen(false);
        if (onOpenAddModal) onOpenAddModal();
      },
    },
    {
      label: 'Add wallet',
      sub: 'Create a new portfolio wallet',
      action: () => {
        setMenuOpen(false);
        if (onOpenAddWalletModal) onOpenAddWalletModal();
      },
    },
    {
      label: 'Refresh prices',
      sub: 'Update all live market prices',
      action: () => {
        setMenuOpen(false);
        if (onRefreshPrices) onRefreshPrices();
      },
    },
  ];

  return (
    <>
      {/* Mobile action popup menu when Import with AI is clicked */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="animate-fadeIn"
          style={{
            position: 'fixed',
            bottom: '68px',
            right: '12px',
            left: '12px',
            zIndex: 100,
            background: 'var(--panel-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            maxWidth: 380,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--divider-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              <Sparkles size={16} style={{ color: '#06B6D4' }} />
              Import with AI & Actions
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: '4px 0' }}>
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px 16px',
                  textAlign: 'left',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderBottom: '1px solid var(--divider-2)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bottom-tab-bar" role="navigation" aria-label="Mobile navigation">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `btab${isActive ? ' active' : ''}`}
            aria-label={label}
          >
            <Icon size={22} strokeWidth={1.6} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Import with AI shortcut */}
        <button
          className={`btab${menuOpen ? ' active' : ''}`}
          onClick={() => setMenuOpen((p) => !p)}
          aria-label="Import with AI"
          title="Import with AI"
        >
          <Sparkles size={22} strokeWidth={1.6} />
          <span>Import</span>
        </button>
      </div>
    </>
  );
}
