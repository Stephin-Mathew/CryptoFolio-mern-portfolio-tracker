import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useWallets } from '../../context/WalletContext';
import {
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Wallet as WalletIcon,
  Terminal,
} from 'lucide-react';

/**
 * TopBar — 64px, sits at the top of the panel.
 * Left: page title. Right: Import with AI & Actions button + user avatar + name + wallet count + chevron menu.
 */
export function TopBar({
  activeWalletName,
  onOpenAuthModal,
  onOpenUploadModal,
  onOpenJsonExtractModal,
  onOpenAddModal,
  onOpenAddWalletModal,
  onRefreshPrices,
  refreshingPrices,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { wallets } = useWallets();
  const { currency, setCurrency, currencies } = useCurrency();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const menuRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (importRef.current && !importRef.current.contains(e.target)) {
        setImportOpen(false);
      }
    };
    if (menuOpen || importOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen, importOpen]);

  // Determine page title
  const getTitle = () => {
    if (activeWalletName) return activeWalletName;
    if (location.pathname === '/' || location.pathname === '/holdings' || location.pathname === '/wallets') {
      return 'Portfolio';
    }
    if (location.pathname === '/analytics') return 'Analytics';
    if (location.pathname === '/transactions') return 'Transactions';
    if (location.pathname.startsWith('/dev')) return 'Developer Logs';
    return 'Portfolio';
  };

  const initial = user?.firstName?.[0] || user?.fullName?.[0] || user?.email?.[0] || 'U';

  const importItems = [
    {
      label: 'Upload screenshot',
      sub: 'AI extracts holdings with Gemini Vision',
      action: () => {
        if (onOpenUploadModal) onOpenUploadModal();
        setImportOpen(false);
      },
    },
    {
      label: 'Paste JSON',
      sub: 'Import structured JSON from your LLM',
      action: () => {
        if (onOpenJsonExtractModal) onOpenJsonExtractModal();
        setImportOpen(false);
      },
    },
    {
      label: 'Add holding manually',
      sub: 'Enter holding details by hand',
      action: () => {
        if (onOpenAddModal) onOpenAddModal();
        setImportOpen(false);
      },
    },
    {
      label: 'Add wallet',
      sub: 'Create a new portfolio wallet',
      action: () => {
        if (onOpenAddWalletModal) onOpenAddWalletModal();
        setImportOpen(false);
      },
    },
    {
      label: 'Refresh prices',
      sub: 'Update all live market prices',
      action: () => {
        if (onRefreshPrices) onRefreshPrices();
        setImportOpen(false);
      },
      disabled: refreshingPrices,
    },
  ];

  return (
    <div className="top-bar">
      {/* Left: title */}
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: 'var(--text-primary)' }}>
        {getTitle()}
      </h1>

      {/* Right: actions & user section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Currency segmented control */}
        <div className="seg seg-sm" role="group" aria-label="Display currency" style={{ padding: 2 }}>
          {currencies.map((c) => (
            <button
              key={c}
              className={`seg-btn${currency === c ? ' active' : ''}`}
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
              style={{ padding: '0 8px', minHeight: 28, fontSize: 11 }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Import with AI & Actions button (Swapped from bottom tab bar) */}
        <div style={{ position: 'relative' }} ref={importRef}>
          <button
            className="btn-primary"
            onClick={() => setImportOpen((p) => !p)}
            title="Import with AI & Actions"
            aria-label="Import with AI & Actions"
            aria-expanded={importOpen}
            style={{
              minHeight: 34,
              padding: '0 12px',
              fontSize: 12,
              fontWeight: 600,
              gap: 6,
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={15} strokeWidth={1.8} />
            <span>Import</span>
          </button>

          {importOpen && (
            <div
              className="animate-fadeIn"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                zIndex: 100,
                background: 'var(--panel-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                minWidth: 230,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--divider-1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                <Sparkles size={14} style={{ color: '#06B6D4' }} />
                <span>Import with AI & Actions</span>
              </div>

              {importItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={item.disabled}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    borderBottom: '1px solid var(--divider-2)',
                    opacity: item.disabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = 'var(--shell-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((p) => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '4px 8px',
                borderRadius: 10,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#E9ECFF',
                  color: '#3447C8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {initial.toUpperCase()}
              </div>

              {/* Name + wallet count */}
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {user?.firstName || user?.fullName?.split(' ')[0] || 'Account'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
                </div>
              </div>

              <ChevronDown
                size={16}
                color="var(--text-muted)"
                style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                className="animate-fadeIn"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  zIndex: 60,
                  background: 'var(--panel-bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  minWidth: 200,
                  overflow: 'hidden',
                }}
              >
                <NavLink
                  to="/wallets"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--divider-2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <WalletIcon size={15} />
                  Manage wallets
                </NavLink>

                {/* Developer Logs link in dropdown */}
                <NavLink
                  to="/dev/price-logs"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--divider-2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <Terminal size={15} />
                  Developer Logs
                </NavLink>

                <button
                  onClick={() => { toggleTheme(); setMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--text-primary)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--divider-2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </button>

                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: 13,
                    color: 'var(--negative)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="btn-primary"
            style={{ fontSize: 13 }}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}
