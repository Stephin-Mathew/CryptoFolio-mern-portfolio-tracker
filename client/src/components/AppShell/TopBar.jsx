import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useWallets } from '../../context/WalletContext';
import {
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  Wallet as WalletIcon,
  Terminal,
} from 'lucide-react';

/**
 * TopBar — 64px, sits at the top of the panel.
 * Left: page title. Right: Currency switcher + user avatar + name + wallet count + chevron menu.
 */
export function TopBar({
  activeWalletName,
  onOpenAuthModal,
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { wallets } = useWallets();
  const { currency, setCurrency, currencies } = useCurrency();
  const location = useLocation();

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
