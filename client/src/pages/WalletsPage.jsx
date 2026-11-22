import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallets } from '../context/WalletContext';
import { useCurrency } from '../context/CurrencyContext';
import { getWalletColor } from '../utils/assetColors';
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Coins,
  Landmark,
  CreditCard,
  Vault,
  Shield,
  IndianRupee,
  LayoutList,
  Table as TableIcon,
} from 'lucide-react';

const ICON_MAP = {
  wallet: Wallet,
  coins: Coins,
  shield: Shield,
  'credit-card': CreditCard,
  landmark: Landmark,
  vault: Vault,
  rupee: IndianRupee,
};

export const WalletsPage = ({
  holdings,
  prices,
  onOpenAddWallet,
  onOpenEditWallet,
  onDeleteWallet,
}) => {
  const { wallets, deleteWallet, loading } = useWallets();
  const { fmt } = useCurrency();
  const inrRate = Number(prices.INR?.price || prices.INR?.rate || 95.7);

  // Default to cards on mobile (< 768px), table on desktop (>= 768px)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'cards';
    }
    return 'table';
  });

  // ── Business logic UNCHANGED ─────────────────────────────────────
  const calculateWalletStats = (walletId) => {
    let totalValue = 0;
    let totalCost = 0;
    let cryptoVal = 0;
    let stockVal = 0;
    let cashVal = 0;
    let wallet24hPnL = 0;

    const walletHoldings = holdings.filter(
      (h) => h.walletId && h.walletId.toString() === walletId.toString()
    );

    walletHoldings.forEach((h) => {
      let currentPrice = 0;
      let ch24 = 0;
      const entry = prices[h.symbol];

      const isINR =
        h.symbol === 'INR' ||
        h.assetType === 'mutual_fund' ||
        h.currency === 'INR' ||
        entry?.currency === 'INR' ||
        (entry?.priceInr != null && entry.priceInr > 0) ||
        (entry?.navInr != null && entry.navInr > 0) ||
        h.symbol?.endsWith('.NS') ||
        h.symbol?.endsWith('.BO');

      if (h.assetType === 'cash') {
        currentPrice = isINR && inrRate > 0 ? 1 / inrRate : 1;
      } else if (entry !== undefined) {
        if (typeof entry === 'object') {
          currentPrice = Number(entry.price || 0);
          ch24 = Number(entry.change24h || 0);
        } else {
          currentPrice = Number(entry) || 0;
        }
      } else {
        currentPrice = isINR && inrRate > 0 ? (Number(h.avgBuyPrice) || 0) / inrRate : (Number(h.avgBuyPrice) || 0);
      }

      const qty = Number(h.quantity) || 0;
      const val = qty * currentPrice;
      totalValue += val;

      if (h.assetType === 'crypto') {
        cryptoVal += val;
        const start24 = ch24 !== 0 ? currentPrice / (1 + ch24 / 100) : currentPrice;
        wallet24hPnL += qty * (currentPrice - start24);
      } else if (h.assetType === 'stock' || h.assetType === 'mutual_fund') {
        stockVal += val;
        const rawCost = qty * (Number(h.avgBuyPrice) || 0);
        const cost = isINR && inrRate > 0 ? rawCost / inrRate : rawCost;
        totalCost += cost;
        const start24 = ch24 !== 0 ? currentPrice / (1 + ch24 / 100) : currentPrice;
        wallet24hPnL += qty * (currentPrice - start24);
      } else if (h.assetType === 'cash') {
        cashVal += val;
      }
    });

    const startBasis = totalValue - wallet24hPnL;
    const pnlPct = startBasis > 0 ? (wallet24hPnL / startBasis) * 100 : 0;

    return {
      totalValue,
      totalCost,
      pnl: wallet24hPnL,
      pnlPct,
      count: walletHoldings.length,
      cryptoVal,
      stockVal,
      cashVal,
    };
  };

  const sortedWalletsWithStats = useMemo(() => {
    return wallets
      .map((wallet) => ({ wallet, stats: calculateWalletStats(wallet._id) }))
      .sort((a, b) => {
        const diff = (b.stats.totalValue || 0) - (a.stats.totalValue || 0);
        if (Math.abs(diff) > 0.0001) return diff;
        return (a.wallet.name || '').localeCompare(b.wallet.name || '');
      });
  }, [wallets, holdings, prices]);

  const totalPortfolioValue = sortedWalletsWithStats.reduce((s, { stats }) => s + stats.totalValue, 0);

  const handleDelete = async (wallet, count) => {
    if (onDeleteWallet) {
      onDeleteWallet(wallet, count);
    } else if (window.confirm(`Delete wallet "${wallet.name}"? All assets will be deleted.`)) {
      await deleteWallet(wallet._id);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card shimmer" style={{ height: 56 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container wallets-page" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Wallets</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} · {fmt(totalPortfolioValue)} total portfolio value
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* View switcher: Cards vs Table */}
            {wallets.length > 0 && (
              <div className="seg seg-sm" role="group" aria-label="View mode" style={{ padding: 2 }}>
                <button
                  type="button"
                  className={`seg-btn${viewMode === 'cards' ? ' active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  title="Card view (optimized for mobile)"
                  style={{ padding: '0 8px', minHeight: 28, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <LayoutList size={13} />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  className={`seg-btn${viewMode === 'table' ? ' active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table view (with horizontal scroll)"
                  style={{ padding: '0 8px', minHeight: 28, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <TableIcon size={13} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            )}

            <button className="btn-primary" onClick={onOpenAddWallet} style={{ minHeight: 32, padding: '0 12px', fontSize: 13 }}>
              <Plus size={14} />
              <span>Add Wallet</span>
            </button>
          </div>
        </div>

        {/* ── Empty state ── */}
        {wallets.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'var(--neutral-chip-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
              }}
            >
              <Wallet size={22} color="var(--text-muted)" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              No Wallets Yet
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, marginInline: 'auto' }}>
              Create wallets for Binance, MetaMask, Ledger, Robinhood, or any account to get started.
            </p>
            <button className="btn-primary" onClick={onOpenAddWallet} style={{ margin: '0 auto' }}>
              <Plus size={14} />
              Create First Wallet
            </button>
          </div>
        ) : (
          <>
            {/* ── Mobile Responsive Card View (Default on mobile) ── */}
            {viewMode === 'cards' && (
              <div className="flex flex-col gap-3">
                {sortedWalletsWithStats.map(({ wallet, stats }) => {
                  const IconComp = ICON_MAP[wallet.icon] || Wallet;
                  const accentColor = getWalletColor(wallet, wallets);
                  const isProfit = stats.pnl >= 0;

                  const cryptoPct = stats.totalValue > 0 ? (stats.cryptoVal / stats.totalValue) * 100 : 0;
                  const stockPct = stats.totalValue > 0 ? (stats.stockVal / stats.totalValue) * 100 : 0;
                  const cashPct = stats.totalValue > 0 ? (stats.cashVal / stats.totalValue) * 100 : 0;
                  const walletShare = totalPortfolioValue > 0 ? (stats.totalValue / totalPortfolioValue) * 100 : 0;

                  return (
                    <div
                      key={wallet._id}
                      className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs flex flex-col gap-3"
                    >
                      {/* Top Row: Icon + Name + Type + Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: `${accentColor}18`,
                              border: `1.5px solid ${accentColor}40`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: accentColor,
                            }}
                          >
                            <IconComp size={18} style={{ color: accentColor }} />
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/wallets/${wallet._id}`}
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                textDecoration: 'none',
                              }}
                              className="truncate block hover:underline"
                            >
                              {wallet.name}
                            </Link>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                              {stats.count} asset{stats.count !== 1 ? 's' : ''}
                              {wallet.description && <span style={{ opacity: 0.75 }}> · {wallet.description}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="chip chip-neutral"
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              textTransform: 'capitalize',
                              fontWeight: 600,
                            }}
                          >
                            {wallet.type}
                          </span>
                          <Link
                            to={`/wallets/${wallet._id}`}
                            title="View wallet"
                            style={{
                              width: 28, height: 28, borderRadius: 8,
                              border: '1px solid var(--card-border)',
                              background: 'var(--shell-bg)',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--text-muted)',
                              textDecoration: 'none',
                            }}
                          >
                            <ChevronRight size={14} />
                          </Link>
                          <button
                            onClick={() => onOpenEditWallet(wallet)}
                            title="Edit wallet"
                            style={{
                              width: 28, height: 28, borderRadius: 8,
                              border: '1px solid var(--card-border)',
                              background: 'var(--shell-bg)',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(wallet, stats.count)}
                            title="Delete wallet"
                            style={{
                              width: 28, height: 28, borderRadius: 8,
                              border: '1px solid var(--negative-bg)',
                              background: 'var(--negative-bg)',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--negative)',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Value & 24h P&L */}
                      <div className="flex items-baseline justify-between pt-2 border-t border-[var(--divider-2)]">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                            Total Value
                          </span>
                          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmt(stats.totalValue)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                            24h P&L
                          </span>
                          {stats.count > 0 && wallet.type !== 'cash' ? (
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                fontVariantNumeric: 'tabular-nums',
                                color: isProfit ? 'var(--positive, #10B981)' : 'var(--negative, #EF4444)',
                              }}
                            >
                              {isProfit ? '+' : ''}{fmt(stats.pnl)} ({isProfit ? '+' : ''}{stats.pnlPct.toFixed(2)}%)
                            </span>
                          ) : (
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </div>

                      {/* Allocation Section */}
                      <div className="space-y-1.5 pt-1.5 border-t border-[var(--divider-2)]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Allocation</span>
                          <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                            {walletShare.toFixed(1)}% of portfolio
                          </span>
                        </div>
                        <div style={{ height: 7, borderRadius: 9999, background: 'var(--wallet-track, #F1F5F9)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(walletShare, 100)}%`,
                              borderRadius: 9999,
                              background: accentColor,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>

                      {/* Asset Mix Section */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Asset Mix</span>
                          <div className="flex items-center gap-2 text-[10px] font-bold">
                            {cryptoPct > 0 && <span style={{ color: '#2DD4BF' }}>Crypto {cryptoPct.toFixed(0)}%</span>}
                            {stockPct > 0 && <span style={{ color: '#818CF8' }}>Stock {stockPct.toFixed(0)}%</span>}
                            {cashPct > 0 && <span style={{ color: '#8BC34A' }}>Cash {cashPct.toFixed(0)}%</span>}
                          </div>
                        </div>
                        {stats.totalValue > 0 ? (
                          <div style={{ height: 6, borderRadius: 9999, overflow: 'hidden', background: 'var(--wallet-track, #F1F5F9)', display: 'flex' }}>
                            {cryptoPct > 0 && <div style={{ flex: cryptoPct, background: '#2DD4BF', minWidth: 2 }} title={`Crypto ${cryptoPct.toFixed(0)}%`} />}
                            {stockPct > 0 && <div style={{ flex: stockPct, background: '#818CF8', minWidth: 2 }} title={`Stocks ${stockPct.toFixed(0)}%`} />}
                            {cashPct > 0 && <div style={{ flex: cashPct, background: '#A3E635', minWidth: 2 }} title={`Cash ${cashPct.toFixed(0)}%`} />}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No assets in wallet</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Table View (With full horizontal scroll support so no columns are clipped) ── */}
            {viewMode === 'table' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                  <div style={{ minWidth: 780 }}>
                    {/* Table header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(200px, 1.8fr) 110px 140px 140px 130px 84px',
                      gap: 0,
                      padding: '10px 16px',
                      background: 'var(--shell-bg)',
                      borderBottom: '1px solid var(--divider-1)',
                    }}>
                      {['Wallet · Assets', 'Type', 'Value · 24h P&L', 'Allocation', 'Asset Mix', ''].map((h, i) => (
                        <div key={i} style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '.08em',
                          textAlign: i === 2 || i === 3 ? 'left' : i === 4 ? 'right' : 'left',
                          paddingRight: i === 5 ? 0 : 8,
                        }}>
                          {h}
                        </div>
                      ))}
                    </div>

                    {/* Wallet rows */}
                    {sortedWalletsWithStats.map(({ wallet, stats }, idx) => {
                      const IconComp = ICON_MAP[wallet.icon] || Wallet;
                      const accentColor = getWalletColor(wallet, wallets);
                      const isProfit = stats.pnl >= 0;

                      const cryptoPct = stats.totalValue > 0 ? (stats.cryptoVal / stats.totalValue) * 100 : 0;
                      const stockPct = stats.totalValue > 0 ? (stats.stockVal / stats.totalValue) * 100 : 0;
                      const cashPct = stats.totalValue > 0 ? (stats.cashVal / stats.totalValue) * 100 : 0;
                      const walletShare = totalPortfolioValue > 0 ? (stats.totalValue / totalPortfolioValue) * 100 : 0;

                      return (
                        <div
                          key={wallet._id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(200px, 1.8fr) 110px 140px 140px 130px 84px',
                            gap: 0,
                            padding: '0 16px',
                            borderBottom: idx < sortedWalletsWithStats.length - 1 ? '1px solid var(--divider-2)' : 'none',
                            alignItems: 'center',
                            minHeight: 64,
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {/* Col 1: Avatar circle + Name + Assets count */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, paddingRight: 8 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: `${accentColor}18`,
                                border: `1.5px solid ${accentColor}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: 13,
                                fontWeight: 700,
                                color: accentColor,
                              }}
                            >
                              <IconComp size={16} style={{ color: accentColor }} />
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <Link
                                to={`/wallets/${wallet._id}`}
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: 'var(--text-primary)',
                                  textDecoration: 'none',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: 'block',
                                }}
                              >
                                {wallet.name}
                              </Link>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                                {stats.count} asset{stats.count !== 1 ? 's' : ''}
                                {wallet.description && (
                                  <span style={{ marginLeft: 5, opacity: 0.75 }}>· {wallet.description.length > 24 ? wallet.description.slice(0, 24) + '…' : wallet.description}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Type chip */}
                          <div>
                            <span
                              className="chip chip-neutral"
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                textTransform: 'capitalize',
                                letterSpacing: '.3px',
                                fontWeight: 600,
                              }}
                            >
                              {wallet.type}
                            </span>
                          </div>

                          {/* Col 3: Value + 24h P&L */}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(stats.totalValue)}
                            </div>
                            {stats.count > 0 && wallet.type !== 'cash' ? (
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  marginTop: 2,
                                  fontVariantNumeric: 'tabular-nums',
                                  color: isProfit ? 'var(--positive, #10B981)' : 'var(--negative, #EF4444)',
                                }}
                              >
                                {isProfit ? '+' : ''}{fmt(stats.pnl)} ({isProfit ? '+' : ''}{stats.pnlPct.toFixed(2)}%)
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>—</div>
                            )}
                          </div>

                          {/* Col 4: Allocation Capsule Bar */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, minWidth: 50, maxWidth: 80 }}>
                                <div style={{ height: 7, borderRadius: 9999, background: 'var(--wallet-track, #F1F5F9)', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${Math.min(walletShare, 100)}%`,
                                      borderRadius: 9999,
                                      background: accentColor,
                                      transition: 'width 0.3s ease',
                                    }}
                                  />
                                </div>
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                                {walletShare.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          {/* Col 5: Asset mix mini-bar */}
                          <div style={{ textAlign: 'right' }}>
                            {stats.totalValue > 0 ? (
                              <>
                                <div style={{ height: 5, borderRadius: 9999, overflow: 'hidden', background: 'var(--wallet-track, #F1F5F9)', display: 'flex', marginBottom: 4 }}>
                                  {cryptoPct > 0 && <div style={{ flex: cryptoPct, background: '#2DD4BF', minWidth: 2 }} title={`Crypto ${cryptoPct.toFixed(0)}%`} />}
                                  {stockPct > 0 && <div style={{ flex: stockPct, background: '#818CF8', minWidth: 2 }} title={`Stocks ${stockPct.toFixed(0)}%`} />}
                                  {cashPct > 0 && <div style={{ flex: cashPct, background: '#A3E635', minWidth: 2 }} title={`Cash ${cashPct.toFixed(0)}%`} />}
                                </div>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', fontSize: 10, fontWeight: 600 }}>
                                  {cryptoPct > 0 && <span style={{ color: '#2DD4BF' }}>C {cryptoPct.toFixed(0)}%</span>}
                                  {stockPct > 0 && <span style={{ color: '#818CF8' }}>S {stockPct.toFixed(0)}%</span>}
                                  {cashPct > 0 && <span style={{ color: '#8BC34A' }}>$ {cashPct.toFixed(0)}%</span>}
                                </div>
                              </>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                            )}
                          </div>

                          {/* Col 6: Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <Link
                              to={`/wallets/${wallet._id}`}
                              title="View wallet"
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                border: '1px solid var(--card-border)',
                                background: 'var(--shell-bg)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)',
                                textDecoration: 'none',
                                flexShrink: 0,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                              <ChevronRight size={13} />
                            </Link>
                            <button
                              onClick={() => onOpenEditWallet(wallet)}
                              title="Edit wallet"
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                border: '1px solid var(--card-border)',
                                background: 'var(--shell-bg)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-muted)',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(wallet, stats.count)}
                              title="Delete wallet"
                              style={{
                                width: 28, height: 28, borderRadius: 7,
                                border: '1px solid var(--negative-bg)',
                                background: 'var(--negative-bg)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--negative)',
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Footer summary row */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(200px, 1.8fr) 110px 140px 140px 130px 84px',
                      gap: 0,
                      padding: '10px 16px',
                      background: 'var(--shell-bg)',
                      borderTop: '1px solid var(--divider-1)',
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} · {holdings.length} total positions
                      </div>
                      <div />
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(totalPortfolioValue)}
                      </div>
                      <div />
                      <div />
                      <div />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
