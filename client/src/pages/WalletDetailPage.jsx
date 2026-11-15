import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWallets } from '../context/WalletContext';
import { useCurrency } from '../context/CurrencyContext';
import { getWalletColor } from '../utils/assetColors';
import { HoldingsTable } from '../components/HoldingsTable';
import {
  ArrowLeft, Wallet, Plus, Edit2, Trash2,
  Coins, Landmark, CreditCard, Vault, Shield, IndianRupee,
  TrendingUp, TrendingDown, Layers
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

/* ── WalletDetailPage ─────────────────────────────────────────────── */
export const WalletDetailPage = ({
  holdings,
  prices,
  onUpdateHolding,
  onDeleteHolding,
  onEditClick,
  onOpenAddModalWithWallet,
  onOpenEditWallet,
  onDeleteWallet,
  onClearWalletHoldings,
  onUpdatePrice,
  onResetPrice,
  onUpdateLogo,
  onResetLogo,
  rowStatuses,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallets, deleteWallet, loading: walletsLoading } = useWallets();
  const { fmt } = useCurrency();

  const wallet = wallets.find((w) => w._id === id);
  const inrRate = Number(prices.INR?.price || prices.INR?.rate || 95.7);

  // ── Business logic UNCHANGED ─────────────────────────────────────
  const walletHoldings = holdings.filter(
    (h) => h.walletId && h.walletId.toString() === id
  );

  let totalValue = 0;
  let totalStockCost = 0;
  let cryptoVal = 0;
  let stockVal = 0;
  let mutualFundVal = 0;
  let cashVal = 0;
  let wallet24hPnL = 0;

  walletHoldings.forEach((h) => {
    let currentPrice = 0;
    let ch24 = 0;
    const entry = prices[h.symbol];

    const isINR =
      h.assetType === 'mutual_fund' ||
      h.currency === 'INR' ||
      entry?.currency === 'INR' ||
      (entry?.priceInr != null && entry.priceInr > 0) ||
      (entry?.navInr != null && entry.navInr > 0) ||
      h.symbol?.endsWith('.NS') ||
      h.symbol?.endsWith('.BO');

    if (h.assetType === 'cash') {
      currentPrice = 1;
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
      if (h.assetType === 'stock') stockVal += val;
      else mutualFundVal += val;
      const rawCost = qty * (Number(h.avgBuyPrice) || 0);
      const cost = isINR && inrRate > 0 ? rawCost / inrRate : rawCost;
      totalStockCost += cost;
      const start24 = ch24 !== 0 ? currentPrice / (1 + ch24 / 100) : currentPrice;
      wallet24hPnL += qty * (currentPrice - start24);
    } else if (h.assetType === 'cash') {
      cashVal += val;
    }
  });

  const startBasis = totalValue - wallet24hPnL;
  const pnlPercent = startBasis > 0 ? (wallet24hPnL / startBasis) * 100 : 0;
  const isPositive = wallet24hPnL >= 0;

  const handleDeleteWallet = async () => {
    if (!wallet) return;
    if (onDeleteWallet) {
      onDeleteWallet(wallet, walletHoldings.length);
    } else if (window.confirm(`Delete wallet "${wallet.name}"? All ${walletHoldings.length} assets will be deleted.`)) {
      await deleteWallet(wallet._id);
      navigate('/wallets');
    }
  };
  // ── End business logic ────────────────────────────────────────────

  if (walletsLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="card shimmer" style={{ height: 130 }} />
        <div className="card shimmer" style={{ height: 320 }} />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 480 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--negative-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Wallet size={22} color="var(--negative)" />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Wallet Not Found</h3>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-muted)' }}>This wallet does not exist or has been deleted.</p>
          <Link to="/wallets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
            <ArrowLeft size={14} />
            Back to Wallets
          </Link>
        </div>
      </div>
    );
  }

  const IconComp = ICON_MAP[wallet.icon] || Wallet;
  const accentColor = getWalletColor(wallet, wallets);

  const mainContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to="/wallets"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 11px', borderRadius: 8,
              border: '1px solid var(--card-border)', background: 'var(--card-bg)',
              fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
              textDecoration: 'none', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <ArrowLeft size={13} />
            Wallets
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => onOpenEditWallet(wallet)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 8,
              border: '1px solid var(--card-border)', background: 'var(--card-bg)',
              fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Edit2 size={12} />
            Edit Wallet
          </button>
          <button
            onClick={handleDeleteWallet}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 8,
              border: '1px solid var(--negative-bg)', background: 'var(--negative-bg)',
              fontSize: 12, fontWeight: 500, color: 'var(--negative)',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>

      {/* ── Hero card: 2-row layout ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 3, background: accentColor }} />

        {/* Row 1 — Identity + Add Asset */}
        <div style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
          borderBottom: '1px solid var(--divider-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${accentColor}1a`,
                border: `1.5px solid ${accentColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 12px ${accentColor}18`,
              }}
            >
              <IconComp size={22} style={{ color: accentColor }} />
            </div>

            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                {wallet.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                <span className="chip chip-neutral" style={{ fontSize: 10, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  {wallet.type}
                </span>
                {wallet.description && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {wallet.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={() => onOpenAddModalWithWallet(wallet._id)}
          >
            <Plus size={15} />
            Add Asset
          </button>
        </div>

        {/* Row 2 — Stats strip */}
        <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
          {/* Net Worth */}
          <div style={{ flex: '1 1 180px', padding: '14px 20px', borderRight: '1px solid var(--divider-2)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Net Worth</span>
              <Wallet size={12} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
              {fmt(totalValue)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {walletHoldings.length} {walletHoldings.length === 1 ? 'asset' : 'assets'} in wallet
            </div>
          </div>

          {/* 24h Return */}
          <div style={{ flex: '1 1 220px', padding: '14px 20px', borderRight: '1px solid var(--divider-2)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>24h Return</span>
              {isPositive
                ? <TrendingUp size={12} style={{ color: 'var(--positive)' }} />
                : <TrendingDown size={12} style={{ color: 'var(--negative)' }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.6px', lineHeight: 1.1, color: isPositive ? 'var(--positive)' : 'var(--negative)' }}>
                {isPositive ? '+' : ''}{fmt(wallet24hPnL)}
              </span>
              <span
                style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '2px 7px', borderRadius: 20,
                  background: isPositive ? 'var(--positive-bg)' : 'var(--negative-bg)',
                  color: isPositive ? 'var(--positive)' : 'var(--negative)',
                }}
              >
                {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {totalStockCost > 0 ? `Cost basis: ${fmt(totalStockCost)}` : 'Live market tracking'}
            </div>
          </div>

          {/* Category */}
          <div style={{ flex: '1 1 220px', padding: '14px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Category</span>
              <Layers size={12} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 4 }}>
              {cryptoVal > 0 && <span className="chip chip-neutral" style={{ fontSize: 11, padding: '2px 8px' }}>{fmt(cryptoVal)} Crypto</span>}
              {stockVal > 0 && <span className="chip chip-neutral" style={{ fontSize: 11, padding: '2px 8px' }}>{fmt(stockVal)} Stocks</span>}
              {mutualFundVal > 0 && <span className="chip chip-neutral" style={{ fontSize: 11, padding: '2px 8px' }}>{fmt(mutualFundVal)} Funds</span>}
              {cashVal > 0 && <span className="chip chip-neutral" style={{ fontSize: 11, padding: '2px 8px' }}>{fmt(cashVal)} Cash</span>}
              {totalValue === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No assets recorded</span>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Type: <span style={{ fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{wallet.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Holdings section ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Holdings</h2>
            <span className="chip chip-neutral" style={{ fontSize: 11, padding: '1px 7px', fontWeight: 600 }}>
              {walletHoldings.length}
            </span>
          </div>

          {walletHoldings.length > 0 && onClearWalletHoldings && (
            <button
              onClick={() => onClearWalletHoldings(wallet, walletHoldings.length)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 9px', borderRadius: 7,
                border: '1px solid var(--negative-bg)', background: 'var(--negative-bg)',
                fontSize: 11, fontWeight: 500, color: 'var(--negative)',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={11} />
              Clear All
            </button>
          )}
        </div>

        <HoldingsTable
          holdings={walletHoldings}
          prices={prices}
          onUpdateHolding={onUpdateHolding}
          onDeleteHolding={onDeleteHolding}
          onEditClick={onEditClick}
          onUpdatePrice={onUpdatePrice}
          onResetPrice={onResetPrice}
          onUpdateLogo={onUpdateLogo}
          onResetLogo={onResetLogo}
          rowStatuses={rowStatuses}
          walletType={wallet?.type}
          hideBuyPrice={wallet?.type === 'crypto'}
          showAssetBadge={false}
        />
      </div>
    </div>
  );

  return (
    <div className="page-container wallet-detail-page">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {mainContent}
      </div>
    </div>
  );
};
