import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWallets } from '../../context/WalletContext';
import { useCurrency } from '../../context/CurrencyContext';
import { getWalletColor } from '../../utils/assetColors';
import {
  LayoutGrid,
  Briefcase,
  Wallet,
  BarChart2,
  ArrowRightLeft,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Plus,
  PanelLeft,
} from 'lucide-react';

// Logo tile: 40x40 dark square with rotated white square inside
function LogoTile() {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: 'var(--btn-primary-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          background: 'var(--btn-primary-text)',
          transform: 'rotate(45deg)',
        }}
      />
    </div>
  );
}

const CURRENCY_CONFIG = [
  { id: 'USD', symbol: '$', name: 'USD', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)' },
  { id: 'INR', symbol: '₹', name: 'INR', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' },
  { id: 'BTC', symbol: '₿', name: 'BTC', color: '#F7931A', bg: 'rgba(247, 147, 26, 0.14)' },
  { id: 'HYPE', symbol: '⚡', name: 'HYPE', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.14)' },
];

/** Icon rail — 64px wide, always visible on ≥1100px. */
export function IconRail({
  isSidebarCollapsed,
  onToggleCollapse,
  onRefreshPrices,
  refreshingPrices,
}) {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { currency, setCurrency, rates } = useCurrency();
  const location = useLocation();

  const isOverview = location.pathname === '/';
  const isHoldings = location.pathname === '/holdings';
  const isWallets = location.pathname.startsWith('/wallets');
  const isAnalytics = location.pathname === '/analytics';
  const isTransactions = location.pathname === '/transactions';

  // Currency dropdown
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyOpen(false);
      }
    };
    if (currencyOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [currencyOpen]);

  const activeCurrency = CURRENCY_CONFIG.find((c) => c.id === currency) || CURRENCY_CONFIG[0];

  return (
    <nav
      className="icon-rail"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <Link to="/" aria-label="Home" style={{ marginBottom: 10 }}>
        <LogoTile />
      </Link>

      {/* Expand/collapse toggle */}
      <button
        className="rib"
        onClick={onToggleCollapse}
        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <PanelLeft size={20} strokeWidth={1.6} />
      </button>

      {/* Nav: Overview */}
      <NavLink
        to="/"
        end
        className={({ isActive }) => `rib${isActive ? ' active' : ''}`}
        title="Overview"
        aria-label="Overview"
        aria-current={isOverview ? 'page' : undefined}
      >
        <LayoutGrid size={20} strokeWidth={1.6} />
      </NavLink>

      {/* Nav: Wallets */}
      <NavLink
        to="/wallets"
        className={({ isActive }) => `rib${isActive || isWallets ? ' active' : ''}`}
        title="Wallets"
        aria-label="Wallets"
        aria-current={isWallets ? 'page' : undefined}
      >
        <Wallet size={20} strokeWidth={1.6} />
      </NavLink>

      {/* Nav: Holdings */}
      <NavLink
        to="/holdings"
        end
        className={({ isActive }) => `rib${isActive ? ' active' : ''}`}
        title="Holdings"
        aria-label="Holdings"
        aria-current={isHoldings ? 'page' : undefined}
      >
        <Briefcase size={20} strokeWidth={1.6} />
      </NavLink>

      {/* Nav: Analytics */}
      <NavLink
        to="/analytics"
        className={({ isActive }) => `rib${isActive ? ' active' : ''}`}
        title="Analytics"
        aria-label="Analytics"
        aria-current={isAnalytics ? 'page' : undefined}
      >
        <BarChart2 size={20} strokeWidth={1.6} />
      </NavLink>

      {/* Nav: Transactions */}
      <NavLink
        to="/transactions"
        className={({ isActive }) => `rib${isActive ? ' active' : ''}`}
        title="Transactions"
        aria-label="Transactions"
        aria-current={isTransactions ? 'page' : undefined}
      >
        <ArrowRightLeft size={20} strokeWidth={1.6} />
      </NavLink>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Refresh prices button */}
      <button
        className="rib"
        onClick={onRefreshPrices}
        disabled={refreshingPrices}
        title={refreshingPrices ? 'Refreshing prices...' : 'Refresh market prices'}
        aria-label="Refresh market prices"
        style={{ cursor: refreshingPrices ? 'not-allowed' : 'pointer', opacity: refreshingPrices ? 0.6 : 1 }}
      >
        <RefreshCw size={19} strokeWidth={1.6} className={refreshingPrices ? 'animate-spin' : ''} />
      </button>

      {/* Currency Switcher */}
      <div style={{ position: 'relative' }} ref={currencyRef}>
        <button
          className={`rib ${currencyOpen ? 'active' : ''}`}
          onClick={() => setCurrencyOpen((p) => !p)}
          title={`Display currency: ${activeCurrency.name} (Click to switch)`}
          aria-label={`Display currency: ${activeCurrency.name}`}
          aria-expanded={currencyOpen}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            padding: 4,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: activeCurrency.bg,
              color: activeCurrency.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              border: `1.5px solid ${activeCurrency.color}45`,
              transition: 'all 0.15s ease',
            }}
          >
            {activeCurrency.symbol}
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: activeCurrency.color,
              lineHeight: 1,
            }}
          >
            {activeCurrency.id}
          </span>
        </button>

        {currencyOpen && (
          <div
            className="animate-fadeIn"
            style={{
              position: 'absolute',
              left: '54px',
              bottom: 0,
              zIndex: 100,
              background: 'var(--panel-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 14,
              boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
              padding: '12px 14px',
              width: 232,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Display Currency
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--positive, #10B981)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                Live
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {CURRENCY_CONFIG.map((c) => {
                const isSelected = currency === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCurrency(c.id);
                      setCurrencyOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '7px 9px',
                      borderRadius: 10,
                      border: isSelected ? `1.5px solid ${c.color}` : '1px solid var(--card-border)',
                      background: isSelected ? 'var(--card-bg)' : 'var(--shell-bg)',
                      boxShadow: isSelected ? `0 2px 8px ${c.color}25, 0 1px 3px rgba(0,0,0,0.06)` : 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.18s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: isSelected ? c.bg : 'var(--neutral-chip-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: isSelected ? c.color : 'var(--text-muted)',
                        flexShrink: 0,
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {c.symbol}
                    </div>

                    <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          lineHeight: 1.1,
                        }}
                      >
                        {c.name}
                      </div>
                    </div>

                    {isSelected && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: c.color,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 10,
                padding: '6px 8px',
                borderRadius: 7,
                background: 'var(--shell-bg)',
                border: '1px solid var(--divider-2)',
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span>Rate:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                {currency === 'USD' && '1 USD = $1.00 (Base)'}
                {currency === 'INR' && `1 USD ≈ ₹${Number(rates?.inrRate || 95.7).toFixed(1)}`}
                {currency === 'BTC' && `1 BTC ≈ $${Math.round(rates?.btcPrice || 84300).toLocaleString()}`}
                {currency === 'HYPE' && `1 HYPE ≈ $${Number(rates?.hypePrice || 93.8).toFixed(2)}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        className="rib"
        onClick={toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun size={20} strokeWidth={1.6} /> : <Moon size={20} strokeWidth={1.6} />}
      </button>

      {/* Sign out */}
      <button
        className="rib"
        onClick={logout}
        title="Sign out"
        aria-label="Sign out"
      >
        <LogOut size={20} strokeWidth={1.6} />
      </button>
    </nav>
  );
}

/** Expanded sidebar — 240px, shows wallet quick-links. */
export function ExpandedSidebar({
  onClose,
  onOpenAddWalletModal,
  holdings,
  prices,
  wallets,
}) {
  const location = useLocation();
  const { fmt } = useCurrency();
  const inrRate = Number(prices?.INR?.price || prices?.INR?.rate || 95.7);

  const getWalletValue = (walletId) => {
    let v = 0;
    if (!holdings) return 0;
    holdings.forEach((h) => {
      if (h.walletId?.toString() !== walletId?.toString()) return;
      let currentPrice = 0;
      const entry = prices?.[h.symbol];
      const isINR =
        h.assetType === 'mutual_fund' ||
        h.currency === 'INR' ||
        entry?.currency === 'INR' ||
        (entry?.priceInr != null && entry.priceInr > 0) ||
        (entry?.navInr != null && entry.navInr > 0) ||
        h.symbol?.endsWith('.NS') ||
        h.symbol?.endsWith('.BO');

      if (h.assetType === 'cash') {
        currentPrice = h.symbol === 'INR' && inrRate > 0 ? 1 / inrRate : 1;
      } else if (entry !== undefined) {
        if (typeof entry === 'object') {
          currentPrice = Number(entry?.price || 0);
        } else {
          currentPrice = Number(entry) || 0;
        }
      } else {
        currentPrice = isINR && inrRate > 0 ? (Number(h.avgBuyPrice) || 0) / inrRate : (Number(h.avgBuyPrice) || 0);
      }
      v += (Number(h.quantity) || 0) * currentPrice;
    });
    return v;
  };

  return (
    <div
      className="expanded-sidebar"
      style={{
        background: 'var(--shell-bg)',
        borderRight: '1px solid var(--divider-1)',
      }}
    >
      {/* Quick link: All Holdings */}
      <div style={{ padding: '12px 10px 8px' }}>
        <NavLink
          to="/holdings"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 10,
            textDecoration: 'none',
            background: isActive ? 'var(--card-bg)' : 'transparent',
            marginBottom: 2,
            transition: 'all 0.15s ease',
            border: isActive ? '1px solid var(--card-border)' : '1px solid transparent',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <Briefcase size={16} />
          <span>All Holdings</span>
        </NavLink>
      </div>

      {/* Header */}
      <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid var(--divider-1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, letterSpacing: '.6px', textTransform: 'uppercase', color: 'var(--text-caption)', fontWeight: 500 }}>
            Your Wallets
          </span>
          <button
            onClick={onOpenAddWalletModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: 'none',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            title="Add wallet"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>

      {/* Wallet links */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {wallets.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            No wallets yet
          </div>
        ) : (
          wallets.map((wallet) => {
            const color = getWalletColor(wallet, wallets);
            const isActive = location.pathname === `/wallets/${wallet._id}`;
            const val = getWalletValue(wallet._id);

            return (
              <Link
                key={wallet._id}
                to={`/wallets/${wallet._id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  background: isActive ? 'var(--card-bg)' : 'transparent',
                  marginBottom: 2,
                  transition: 'all 0.15s ease',
                  border: isActive ? '1px solid var(--card-border)' : '1px solid transparent',
                  boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--card-bg)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                      boxShadow: isActive ? `0 0 6px ${color}88` : 'none',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {wallet.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 500,
                    flexShrink: 0,
                    marginLeft: 6,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmt(val)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
