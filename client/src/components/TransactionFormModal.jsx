import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Save,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  TrendingDown,
  TrendingUp,
  Trash2,
  PlusCircle,
  ChevronDown,
  Search,
  Coins,
  Shield,
  CreditCard,
  Landmark,
  Vault,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { AssetLogo } from './AssetLogo';
import { calculateWalletValue } from '../utils/walletUtils';
import api from '../api/axiosInstance';

const TRANSACTION_TYPES = [
  { value: 'buy', label: 'Buy', emoji: '🟢' },
  { value: 'sell', label: 'Sell', emoji: '🔴' },
  { value: 'swap', label: 'Swap', emoji: '🟡' },
  { value: 'transfer_in', label: 'Transfer In', emoji: '📥' },
  { value: 'transfer_out', label: 'Transfer Out', emoji: '📤' },
  { value: 'deposit', label: 'Deposit', emoji: '💰' },
  { value: 'withdrawal', label: 'Withdrawal', emoji: '💸' },
  { value: 'long', label: 'Long', emoji: '📈' },
  { value: 'short', label: 'Short', emoji: '📉' },
  { value: 'note', label: 'Note', emoji: '📝' },
];

const COMMON_PRESETS = [
  { symbol: 'INR', name: 'Indian Rupee', assetType: 'cash' },
  { symbol: 'USDT', name: 'Tether USDt', assetType: 'crypto' },
  { symbol: 'USD', name: 'US Dollar', assetType: 'cash' },
  { symbol: 'BTC', name: 'Bitcoin', assetType: 'crypto' },
  { symbol: 'ETH', name: 'Ethereum', assetType: 'crypto' },
  { symbol: 'SOL', name: 'Solana', assetType: 'crypto' },
];

function toLocalDatetimeStr(date) {
  const d = date ? new Date(date) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EMPTY_FORM = {
  date: '',
  type: 'buy',
  fromAsset: '',
  fromAmount: '',
  fromWalletId: '',
  toAsset: '',
  toAmount: '',
  toWalletId: '',
  valueUSD: '',
  notes: '',
  tags: '',
  syncBalances: true,
};

/**
 * Rich, spacious Asset Dropdown with official logos, names, balances, and search.
 */
function AssetDropdown({
  value,
  onChange,
  holdings = [],
  fallbackPresets = [],
  placeholder = 'Select asset from wallet...',
  walletName = '',
  prices = {},
  allowCustom = true,
  isCustom = false,
  onCustomToggle,
  onCustomTextChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Selected holding object
  const selectedHolding = holdings.find(
    (h) => h.symbol?.toUpperCase() === value?.toUpperCase()
  );

  // Combined list for display (holdings first, then optional presets not already listed)
  const displayItems = useMemo(() => {
    const holdingSymbols = new Set(holdings.map((h) => h.symbol?.toUpperCase()));
    const extraPresets = (fallbackPresets || [])
      .filter((p) => !holdingSymbols.has(p.symbol.toUpperCase()))
      .map((p) => ({
        _id: `preset_${p.symbol}`,
        symbol: p.symbol,
        name: p.name,
        assetType: p.assetType,
        quantity: null,
        isPreset: true,
      }));

    return [...holdings, ...extraPresets];
  }, [holdings, fallbackPresets]);

  // Filtered list based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return displayItems;
    const q = searchQuery.toLowerCase().trim();
    return displayItems.filter(
      (item) =>
        item.symbol?.toLowerCase().includes(q) ||
        item.name?.toLowerCase().includes(q) ||
        item.mfSchemeName?.toLowerCase().includes(q) ||
        item.walletOrAccount?.toLowerCase().includes(q)
    );
  }, [displayItems, searchQuery]);

  // If user selected custom text input mode
  if (isCustom) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="e.g. USDT, BTC, NVDA"
          value={value}
          onChange={(e) => onCustomTextChange(e.target.value.toUpperCase())}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--card-border)',
            background: 'var(--shell-bg)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          autoFocus
        />
        {holdings.length > 0 && (
          <button
            type="button"
            onClick={onCustomToggle}
            style={{
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid var(--card-border)',
              background: 'var(--shell-bg)',
              color: 'var(--accent, #6366F1)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}
          >
            Pick from list
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          minHeight: 48,
          padding: '6px 12px',
          borderRadius: 12,
          border: isOpen ? '1.5px solid var(--accent, #6366F1)' : '1px solid var(--card-border)',
          background: 'var(--shell-bg)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        {value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <AssetLogo symbol={value} assetType={selectedHolding?.assetType || 'crypto'} size={30} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {value}
                </span>
                {selectedHolding?.assetType && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'var(--neutral-chip-bg, rgba(255,255,255,0.06))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {selectedHolding.assetType}
                  </span>
                )}
              </div>
              {selectedHolding?.quantity != null && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
                  Balance: <strong>{Number(selectedHolding.quantity).toLocaleString()}</strong> {value}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {placeholder}
          </span>
        )}

        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* ── Dropdown Popover ── */}
      {isOpen && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 60,
            background: 'var(--panel-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search box if there are 4+ items */}
          {displayItems.length > 3 && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--divider-1)', background: 'var(--shell-bg)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 9,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search assets by symbol or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    paddingLeft: 28,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid var(--card-border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* List of items */}
          <div style={{ maxHeight: 230, overflowY: 'auto', padding: 6 }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                {searchQuery ? `No asset matching "${searchQuery}"` : 'No assets in this wallet'}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.symbol?.toUpperCase() === value?.toUpperCase();
                const priceObj = prices[item.symbol];
                const unitPrice = typeof priceObj === 'object' ? Number(priceObj?.price || 0) : Number(priceObj || 0);
                const estValueUSD = unitPrice > 0 && item.quantity != null ? Number(item.quantity) * unitPrice : null;

                return (
                  <div
                    key={item._id || item.symbol}
                    onClick={() => {
                      onChange(item.symbol, item.isPreset ? null : item);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      marginBottom: 2,
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--shell-bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Official Logo */}
                    <AssetLogo symbol={item.symbol} assetType={item.assetType || 'crypto'} size={34} />

                    {/* Symbol & Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.symbol}
                        </span>
                        {item.assetType && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: 'var(--neutral-chip-bg, rgba(255,255,255,0.06))',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {item.assetType}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: 1,
                        }}
                      >
                        {item.name || item.mfSchemeName || item.walletOrAccount || (walletName ? `in ${walletName}` : 'Portfolio asset')}
                      </div>
                    </div>

                    {/* Balance & Value */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {item.quantity != null ? (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {Number(item.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </div>
                          {estValueUSD != null && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                              ~${estValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--accent, #6366F1)', fontWeight: 600 }}>
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action: Enter Custom Symbol */}
          {allowCustom && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--divider-1)', background: 'var(--shell-bg)' }}>
              <button
                type="button"
                onClick={() => {
                  onCustomToggle?.();
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px dashed var(--card-border)',
                  background: 'var(--card-bg)',
                  color: 'var(--accent, #6366F1)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; }}
              >
                <PlusCircle size={13} />
                <span>+ Enter custom / unlisted ticker...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const WALLET_ICONS_MAP = {
  wallet: Wallet,
  coins: Coins,
  shield: Shield,
  'credit-card': CreditCard,
  landmark: Landmark,
  vault: Vault,
  rupee: IndianRupee,
};

const WALLET_TYPE_LABELS = {
  crypto: 'Crypto',
  stock: 'Stock Brokerage',
  exchange: 'Exchange',
  bank: 'Bank Account',
  cash: 'Cash / INR',
  other: 'Custom / Other',
};

function getWalletIcon(iconName, type) {
  if (iconName && WALLET_ICONS_MAP[iconName]) {
    return WALLET_ICONS_MAP[iconName];
  }
  switch (type) {
    case 'cash': return IndianRupee;
    case 'bank': return CreditCard;
    case 'stock': return Landmark;
    case 'exchange': return Wallet;
    case 'crypto': return Coins;
    case 'other': return Vault;
    default: return Wallet;
  }
}

/**
 * Rich, spacious Wallet Dropdown with colored badges, icons, asset counts, USD valuations, and search.
 */
function WalletDropdown({
  value,
  onChange,
  wallets = [],
  holdings = [],
  prices = {},
  placeholder = '— Select Wallet —',
  allowAllOption = true,
  allOptionLabel = 'All Portfolio Assets (General)',
  allOptionSubtitle = 'Include holdings across all wallets',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const selectedWallet = useMemo(() => {
    if (!value) return null;
    return wallets.find((w) => String(w._id) === String(value)) || null;
  }, [wallets, value]);

  const filteredWallets = useMemo(() => {
    if (!searchQuery.trim()) return wallets;
    const q = searchQuery.toLowerCase().trim();
    return wallets.filter((w) => {
      const nameMatch = w.name?.toLowerCase().includes(q);
      const typeMatch = w.type?.toLowerCase().includes(q) || WALLET_TYPE_LABELS[w.type]?.toLowerCase().includes(q);
      const descMatch = w.description?.toLowerCase().includes(q);
      return nameMatch || typeMatch || descMatch;
    });
  }, [wallets, searchQuery]);

  // Selected wallet metrics
  const selectedWalletAssetCount = useMemo(() => {
    if (!selectedWallet) return 0;
    return holdings.filter((h) => h.walletId && String(h.walletId) === String(selectedWallet._id)).length;
  }, [selectedWallet, holdings]);

  const selectedWalletValuation = useMemo(() => {
    if (!selectedWallet) return 0;
    return calculateWalletValue(selectedWallet._id, holdings, prices);
  }, [selectedWallet, holdings, prices]);

  const SelectedIcon = selectedWallet ? getWalletIcon(selectedWallet.icon, selectedWallet.type) : null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          minHeight: 48,
          padding: '6px 12px',
          borderRadius: 12,
          border: isOpen ? '1.5px solid var(--accent, #6366F1)' : '1px solid var(--card-border)',
          background: 'var(--shell-bg)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        {selectedWallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: selectedWallet.color ? `${selectedWallet.color}22` : 'rgba(99,102,241,0.12)',
                border: `1px solid ${selectedWallet.color || '#6366F1'}44`,
                color: selectedWallet.color || 'var(--accent, #6366F1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SelectedIcon size={16} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedWallet.name}
                </span>
                {selectedWallet.type && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'var(--neutral-chip-bg, rgba(255,255,255,0.06))',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {WALLET_TYPE_LABELS[selectedWallet.type] || selectedWallet.type}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
                {selectedWalletAssetCount} asset{selectedWalletAssetCount !== 1 ? 's' : ''}
                {selectedWalletValuation > 0 && ` · ~$${selectedWalletValuation.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`}
              </div>
            </div>
          </div>
        ) : allowAllOption && !value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'var(--neutral-chip-bg, rgba(255,255,255,0.06))',
                border: '1px solid var(--card-border)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Layers size={16} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {allOptionLabel}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {allOptionSubtitle}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'var(--neutral-chip-bg, rgba(255,255,255,0.06))',
                border: '1px solid var(--card-border)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Wallet size={16} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {placeholder}
            </span>
          </div>
        )}

        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* ── Dropdown Popover ── */}
      {isOpen && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 65,
            background: 'var(--panel-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 14,
            boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search box if there are 3+ wallets */}
          {wallets.length > 2 && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--divider-1)', background: 'var(--shell-bg)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 9,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search wallets by name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    paddingLeft: 28,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid var(--card-border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* List of wallets */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: 6 }}>
            {/* "All Portfolio Assets / General" Option */}
            {allowAllOption && (
              <div
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: !value ? 'rgba(99,102,241,0.12)' : 'transparent',
                  border: !value ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  marginBottom: 2,
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (value) e.currentTarget.style.background = 'var(--shell-bg)';
                }}
                onMouseLeave={(e) => {
                  if (value) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: 'var(--neutral-chip-bg, rgba(255,255,255,0.06))',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Layers size={17} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {allOptionLabel}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    {allOptionSubtitle}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {holdings.length} assets
                  </span>
                </div>
              </div>
            )}

            {filteredWallets.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                {searchQuery ? `No wallet matching "${searchQuery}"` : 'No wallets configured yet'}
              </div>
            ) : (
              filteredWallets.map((wallet) => {
                const isSelected = String(wallet._id) === String(value);
                const wHoldings = holdings.filter((h) => h.walletId && String(h.walletId) === String(wallet._id));
                const wCount = wHoldings.length;
                const wValuation = calculateWalletValue(wallet._id, holdings, prices);
                const IconComponent = getWalletIcon(wallet.icon, wallet.type);

                return (
                  <div
                    key={wallet._id}
                    onClick={() => {
                      onChange(wallet._id, wallet);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      marginBottom: 2,
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--shell-bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Wallet Icon Box */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: wallet.color ? `${wallet.color}22` : 'rgba(99,102,241,0.12)',
                        border: `1px solid ${wallet.color || '#6366F1'}44`,
                        color: wallet.color || 'var(--accent, #6366F1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={17} />
                    </div>

                    {/* Name & Type */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {wallet.name}
                        </span>
                        {wallet.type && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 5px',
                              borderRadius: 4,
                              background: 'var(--neutral-chip-bg, rgba(255,255,255,0.06))',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {WALLET_TYPE_LABELS[wallet.type] || wallet.type}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: 1,
                        }}
                      >
                        {wallet.description || `${wCount} holding${wCount !== 1 ? 's' : ''} in wallet`}
                      </div>
                    </div>

                    {/* Holdings Count & Total Value */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {wCount > 0 ? `${wCount} asset${wCount !== 1 ? 's' : ''}` : '0 assets'}
                      </div>
                      {wValuation > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', marginTop: 1 }}>
                          ~${wValuation.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TransactionFormModal({
  isOpen,
  onClose,
  onSave,
  txToEdit,
  wallets = [],
  holdings = [],
  prices = {},
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, date: toLocalDatetimeStr() });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // Custom asset typing flags
  const [customFromAsset, setCustomFromAsset] = useState(false);
  const [customToAsset, setCustomToAsset] = useState(false);

  // Active holdings list
  const [activeHoldings, setActiveHoldings] = useState(holdings);

  useEffect(() => {
    if (holdings && holdings.length > 0) {
      setActiveHoldings(holdings);
    } else if (isOpen) {
      api.get('/holdings').then((res) => {
        setActiveHoldings(res.data.holdings || []);
      }).catch(() => { });
    }
  }, [holdings, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setIsReviewing(false);
    if (txToEdit) {
      setForm({
        date: toLocalDatetimeStr(txToEdit.date),
        type: txToEdit.type || 'buy',
        fromAsset: txToEdit.fromAsset || '',
        fromAmount: txToEdit.fromAmount != null ? String(txToEdit.fromAmount) : '',
        fromWalletId: txToEdit.fromWalletId ? String(txToEdit.fromWalletId) : '',
        toAsset: txToEdit.toAsset || '',
        toAmount: txToEdit.toAmount != null ? String(txToEdit.toAmount) : '',
        toWalletId: txToEdit.toWalletId ? String(txToEdit.toWalletId) : '',
        valueUSD: txToEdit.valueUSD != null ? String(txToEdit.valueUSD) : '',
        notes: txToEdit.notes || '',
        tags: (txToEdit.tags || []).join(', '),
        syncBalances: txToEdit.syncBalances !== false,
      });
      setCustomFromAsset(true);
      setCustomToAsset(true);
    } else {
      setForm({ ...EMPTY_FORM, date: toLocalDatetimeStr() });
      setCustomFromAsset(false);
      setCustomToAsset(false);
    }
    setError('');
  }, [isOpen, txToEdit]);

  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  // Filter holdings belonging to fromWallet (or all if unassigned)
  const fromWalletHoldings = useMemo(() => {
    if (!form.fromWalletId) return activeHoldings;
    return activeHoldings.filter((h) => h.walletId && String(h.walletId) === String(form.fromWalletId));
  }, [form.fromWalletId, activeHoldings]);

  // Filter holdings belonging to toWallet
  const toWalletHoldings = useMemo(() => {
    if (!form.toWalletId) return [];
    return activeHoldings.filter((h) => h.walletId && String(h.walletId) === String(form.toWalletId));
  }, [form.toWalletId, activeHoldings]);

  // Lookup the exact holding being deducted
  const matchedFromHolding = useMemo(() => {
    if (!form.fromAsset) return null;
    const sym = form.fromAsset.toUpperCase().trim();
    if (form.fromWalletId) {
      const match = activeHoldings.find(
        (h) => String(h.walletId) === String(form.fromWalletId) && h.symbol?.toUpperCase() === sym
      );
      if (match) return match;
    }
    return activeHoldings.find((h) => h.symbol?.toUpperCase() === sym) || null;
  }, [form.fromAsset, form.fromWalletId, activeHoldings]);

  // Lookup the exact holding being added to
  const matchedToHolding = useMemo(() => {
    if (!form.toAsset) return null;
    const sym = form.toAsset.toUpperCase().trim();
    if (form.toWalletId) {
      const match = activeHoldings.find(
        (h) => String(h.walletId) === String(form.toWalletId) && h.symbol?.toUpperCase() === sym
      );
      if (match) return match;
    }
    return activeHoldings.find((h) => h.symbol?.toUpperCase() === sym) || null;
  }, [form.toAsset, form.toWalletId, activeHoldings]);

  // Wallet metadata
  const fromWallet = useMemo(() => wallets.find((w) => String(w._id) === String(form.fromWalletId)), [wallets, form.fromWalletId]);
  const toWallet = useMemo(() => wallets.find((w) => String(w._id) === String(form.toWalletId)), [wallets, form.toWalletId]);

  if (!isOpen) return null;

  // Handle Step 1 Validation & Proceed to Review
  const handleProceedToReview = (e) => {
    e.preventDefault();
    setError('');

    if (!form.type) {
      setError('Please select a transaction type');
      return;
    }
    if (!form.date) {
      setError('Please enter a date & time');
      return;
    }

    if (!form.fromAsset && !form.toAsset) {
      setError('Please enter at least one asset (either From or To leg)');
      return;
    }

    if (form.fromAsset && (!form.fromAmount || Number(form.fromAmount) <= 0)) {
      setError(`Please enter a valid amount for ${form.fromAsset}`);
      return;
    }

    if (form.toAsset && (!form.toAmount || Number(form.toAmount) <= 0)) {
      setError(`Please enter a valid amount for ${form.toAsset}`);
      return;
    }

    setIsReviewing(true);
  };

  // Final Confirmation Submit
  const handleConfirmSubmit = async () => {
    setError('');
    const payload = {
      date: new Date(form.date).toISOString(),
      type: form.type,
      fromAsset: form.fromAsset.trim().toUpperCase() || null,
      fromAmount: form.fromAmount !== '' ? Number(form.fromAmount) : null,
      fromWalletId: form.fromWalletId || null,
      toAsset: form.toAsset.trim().toUpperCase() || null,
      toAmount: form.toAmount !== '' ? Number(form.toAmount) : null,
      toWalletId: form.toWalletId || null,
      valueUSD: form.valueUSD !== '' ? Number(form.valueUSD) : null,
      notes: form.notes.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      syncBalances: Boolean(form.syncBalances),
    };

    setSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save transaction');
      setIsReviewing(false);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid var(--card-border)',
    background: 'var(--shell-bg)',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    marginBottom: 4,
  };

  const sectionStyle = {
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid var(--divider-1)',
    background: 'var(--shell-bg)',
  };

  // Balance calculations
  const currentFromQty = matchedFromHolding?.quantity ?? 0;
  const numFromAmt = Number(form.fromAmount || 0);
  const remainingFromQty = Math.max(0, currentFromQty - numFromAmt);
  const isFromDeleted = currentFromQty > 0 && numFromAmt >= currentFromQty;

  const currentToQty = matchedToHolding?.quantity ?? 0;
  const numToAmt = Number(form.toAmount || 0);
  const newToQty = currentToQty + numToAmt;
  const isToNew = !matchedToHolding;

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div
        style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          padding: 24,
          width: '100%',
          maxWidth: isReviewing ? 580 : 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 8,
          }}
        >
          <X size={18} />
        </button>

        {/* ── STEP 2: CONFIRMATION MODAL ─────────────────────────────────────── */}
        {isReviewing ? (
          <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'rgba(99,102,241,0.12)',
                  color: 'var(--accent, #6366F1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Confirm Transaction &amp; Balance Impact
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Review the balance updates that will be applied to your portfolio
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                background: 'var(--negative-bg)', border: '1px solid rgba(255,107,115,0.2)',
                color: 'var(--negative)', fontSize: 12,
              }}>
                {error}
              </div>
            )}

            {/* Overview bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--shell-bg)',
                border: '1px solid var(--card-border)',
                marginBottom: 16,
                fontSize: 12,
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Type:
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {form.type.toUpperCase()}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>
                {new Date(form.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>

            {/* Balance Changes Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>

              {/* DEDUCTED ASSET (FROM) */}
              {form.fromAsset && numFromAmt > 0 && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid rgba(255,107,115,0.25)',
                    background: 'rgba(255,107,115,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--negative)' }}>
                      <TrendingDown size={14} />
                      <span>📤 ASSET DEDUCTION (FROM)</span>
                    </div>
                    {form.syncBalances && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: isFromDeleted ? 'var(--negative-bg)' : 'rgba(245,158,11,0.12)',
                          color: isFromDeleted ? 'var(--negative)' : '#F59E0B',
                          border: `1px solid ${isFromDeleted ? 'rgba(255,107,115,0.3)' : 'rgba(245,158,11,0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isFromDeleted ? (
                          <>
                            <Trash2 size={11} />
                            <span>Asset Deleted / Fully Sold</span>
                          </>
                        ) : (
                          <span>Balance Reduced</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AssetLogo symbol={form.fromAsset} assetType={matchedFromHolding?.assetType || 'crypto'} size={32} />
                      <div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {form.fromAsset}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          in {fromWallet?.name || 'Unassigned / General'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--negative)', fontVariantNumeric: 'tabular-nums' }}>
                      - {numFromAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} {form.fromAsset}
                    </div>
                  </div>

                  {form.syncBalances && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px dashed rgba(255,107,115,0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>
                        Current: <strong style={{ color: 'var(--text-primary)' }}>{currentFromQty.toLocaleString()} {form.fromAsset}</strong>
                      </span>
                      <span>
                        New: <strong style={{ color: isFromDeleted ? 'var(--negative)' : 'var(--text-primary)' }}>
                          {remainingFromQty.toLocaleString()} {form.fromAsset}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ADDED ASSET (TO) */}
              {form.toAsset && numToAmt > 0 && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid rgba(16,185,129,0.25)',
                    background: 'rgba(16,185,129,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                      <TrendingUp size={14} />
                      <span>📥 ASSET ADDITION (TO)</span>
                    </div>
                    {form.syncBalances && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: isToNew ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                          color: isToNew ? 'var(--accent, #6366F1)' : '#10B981',
                          border: `1px solid ${isToNew ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isToNew ? (
                          <>
                            <PlusCircle size={11} />
                            <span>New Asset Added to Wallet</span>
                          </>
                        ) : (
                          <span>Balance Increased</span>
                        )}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AssetLogo symbol={form.toAsset} assetType={matchedToHolding?.assetType || 'crypto'} size={32} />
                      <div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {form.toAsset}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          into {toWallet?.name || 'Unassigned / General'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
                      + {numToAmt.toLocaleString(undefined, { maximumFractionDigits: 6 })} {form.toAsset}
                    </div>
                  </div>

                  {form.syncBalances && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px dashed rgba(16,185,129,0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>
                        Current: <strong style={{ color: 'var(--text-primary)' }}>{currentToQty.toLocaleString()} {form.toAsset}</strong>
                      </span>
                      <span>
                        New: <strong style={{ color: '#10B981' }}>
                          {newToQty.toLocaleString()} {form.toAsset}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary info */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--shell-bg)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {form.valueUSD && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Value:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>${Number(form.valueUSD).toLocaleString()} USD</strong>
                </div>
              )}
              {form.notes && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Notes:</span>
                  <span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{form.notes}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, paddingTop: 4, borderTop: '1px solid var(--divider-2)' }}>
                <span>Auto-Update Balances:</span>
                <strong style={{ color: form.syncBalances ? '#10B981' : 'var(--text-muted)' }}>
                  {form.syncBalances ? '⚡ Active (Holdings will adjust)' : 'Off (Record only)'}
                </strong>
              </div>
            </div>

            {/* Actions for Confirmation */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsReviewing(false)}
                disabled={submitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--card-border)',
                  background: 'var(--shell-bg)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="btn-primary"
                style={{
                  minHeight: 38,
                  padding: '0 20px',
                  fontSize: 13,
                  borderRadius: 10,
                  opacity: submitting ? 0.6 : 1,
                  gap: 6,
                }}
              >
                <Save size={15} />
                <span>{submitting ? 'Applying Changes…' : '✓ Confirm & Save Transaction'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── STEP 1: FORM INPUTS ─────────────────────────────────────────── */
          <>
            {/* Title */}
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {txToEdit ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {txToEdit
                  ? 'Update this transaction record'
                  : 'Record a trade, sale, conversion, or financial move'}
              </p>
            </div>

            {error && (
              <div style={{
                marginBottom: 14, padding: '10px 14px', borderRadius: 10,
                background: 'var(--negative-bg)', border: '1px solid rgba(255,107,115,0.2)',
                color: 'var(--negative)', fontSize: 12,
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleProceedToReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Date + Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Date &amp; Time *</label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    required
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── 📤 FROM (WHAT YOU GAVE UP) ── */}
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--negative)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    📤 From (what you gave up / sold)
                  </div>
                  {fromWalletHoldings.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {fromWalletHoldings.length} asset{fromWalletHoldings.length !== 1 ? 's' : ''} available
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* From Wallet Selector */}
                  <div>
                    <label style={labelStyle}>From Wallet (Account)</label>
                    <WalletDropdown
                      value={form.fromWalletId}
                      onChange={(newWalletId) => {
                        set('fromWalletId', newWalletId);
                        setCustomFromAsset(false);
                      }}
                      wallets={wallets}
                      holdings={activeHoldings}
                      prices={prices}
                      placeholder="— Select Source Wallet (or All Portfolio) —"
                      allowAllOption={true}
                      allOptionLabel="All Portfolio Assets (General)"
                      allOptionSubtitle="Include holdings across all wallets"
                    />
                  </div>

                  {/* Asset Picker + Amount Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
                    {/* Rich Asset Selector Dropdown */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Asset / Symbol</label>
                        {customFromAsset && (
                          <button
                            type="button"
                            onClick={() => setCustomFromAsset(false)}
                            style={{
                              background: 'none', border: 'none', fontSize: 10,
                              color: 'var(--accent, #6366F1)', cursor: 'pointer', padding: 0,
                            }}
                          >
                            ← Pick from wallet
                          </button>
                        )}
                      </div>

                      <AssetDropdown
                        value={form.fromAsset}
                        onChange={(sym, holding) => {
                          set('fromAsset', sym);
                          // Auto-select wallet if holding has a wallet and no wallet was chosen yet
                          if (holding?.walletId && !form.fromWalletId) {
                            set('fromWalletId', String(holding.walletId));
                          }
                        }}
                        holdings={fromWalletHoldings}
                        placeholder={form.fromWalletId ? `Select asset from ${fromWallet?.name || 'wallet'}...` : 'Select asset from portfolio...'}
                        walletName={fromWallet?.name || ''}
                        prices={prices}
                        isCustom={customFromAsset}
                        onCustomToggle={() => setCustomFromAsset((p) => !p)}
                        onCustomTextChange={(text) => set('fromAsset', text)}
                      />
                    </div>

                    {/* Amount Input */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Amount</label>
                        {matchedFromHolding && Number(matchedFromHolding.quantity) > 0 && (
                          <button
                            type="button"
                            onClick={() => set('fromAmount', String(matchedFromHolding.quantity))}
                            style={{
                              background: 'rgba(99,102,241,0.1)',
                              border: '1px solid rgba(99,102,241,0.3)',
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 700,
                              color: 'var(--accent, #6366F1)',
                              cursor: 'pointer',
                              padding: '1px 5px',
                            }}
                          >
                            USE MAX
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={form.fromAmount}
                        onChange={(e) => set('fromAmount', e.target.value)}
                        style={{ ...inputStyle, minHeight: 48 }}
                      />
                    </div>
                  </div>

                  {/* Context Helper / Warning */}
                  {matchedFromHolding && (
                    <div
                      style={{
                        fontSize: 11,
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>
                        Available: <strong style={{ color: 'var(--text-primary)' }}>{Number(matchedFromHolding.quantity).toLocaleString()} {matchedFromHolding.symbol}</strong>
                      </span>
                      {Number(form.fromAmount) > 0 && (
                        <span>
                          {Number(form.fromAmount) >= matchedFromHolding.quantity ? (
                            <span style={{ color: 'var(--negative)', fontWeight: 600 }}>
                              ⚠️ Will fully close position
                            </span>
                          ) : (
                            <span>
                              After: {(matchedFromHolding.quantity - Number(form.fromAmount)).toLocaleString()} {matchedFromHolding.symbol}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── 📥 TO (WHAT YOU RECEIVED) ── */}
              <div style={sectionStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    📥 To (what you received / bought)
                  </div>
                  {toWalletHoldings.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {toWalletHoldings.length} asset{toWalletHoldings.length !== 1 ? 's' : ''} in wallet
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* To Wallet Selector */}
                  <div>
                    <label style={labelStyle}>To Wallet (Destination)</label>
                    <WalletDropdown
                      value={form.toWalletId}
                      onChange={(newWalletId) => {
                        set('toWalletId', newWalletId);
                        setCustomToAsset(false);
                      }}
                      wallets={wallets}
                      holdings={activeHoldings}
                      prices={prices}
                      placeholder="— Select Destination Wallet —"
                      allowAllOption={true}
                      allOptionLabel="Unassigned / External Wallet"
                      allOptionSubtitle="Log without linking to a specific internal wallet"
                    />
                  </div>

                  {/* Asset Picker + Amount Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
                    {/* Rich Asset Selector Dropdown */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ ...labelStyle, marginBottom: 0 }}>Asset / Symbol</label>
                        {customToAsset && (
                          <button
                            type="button"
                            onClick={() => setCustomToAsset(false)}
                            style={{
                              background: 'none', border: 'none', fontSize: 10,
                              color: 'var(--accent, #6366F1)', cursor: 'pointer', padding: 0,
                            }}
                          >
                            ← Pick from list
                          </button>
                        )}
                      </div>

                      <AssetDropdown
                        value={form.toAsset}
                        onChange={(sym, holding) => {
                          set('toAsset', sym);
                          if (holding?.walletId && !form.toWalletId) {
                            set('toWalletId', String(holding.walletId));
                          }
                        }}
                        holdings={toWalletHoldings}
                        fallbackPresets={COMMON_PRESETS}
                        placeholder={form.toWalletId ? `Select or enter asset for ${toWallet?.name || 'wallet'}...` : 'Select or enter asset...'}
                        walletName={toWallet?.name || ''}
                        prices={prices}
                        isCustom={customToAsset}
                        onCustomToggle={() => setCustomToAsset((p) => !p)}
                        onCustomTextChange={(text) => set('toAsset', text)}
                      />
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label style={labelStyle}>Amount</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0.00"
                        value={form.toAmount}
                        onChange={(e) => set('toAmount', e.target.value)}
                        style={{ ...inputStyle, minHeight: 48 }}
                      />
                    </div>
                  </div>

                  {/* Context Helper */}
                  {matchedToHolding ? (
                    <div
                      style={{
                        fontSize: 11,
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span>
                        Current: <strong style={{ color: 'var(--text-primary)' }}>{Number(matchedToHolding.quantity).toLocaleString()} {matchedToHolding.symbol}</strong>
                      </span>
                      {Number(form.toAmount) > 0 && (
                        <span style={{ color: '#10B981', fontWeight: 600 }}>
                          After: {(Number(matchedToHolding.quantity) + Number(form.toAmount)).toLocaleString()} {matchedToHolding.symbol}
                        </span>
                      )}
                    </div>
                  ) : form.toAsset && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: '2px 4px' }}>
                      ✨ New position "{form.toAsset}" will be created in {toWallet?.name || 'wallet'}
                    </div>
                  )}
                </div>
              </div>

              {/* USD Value + Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>USD Value (optional)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Total value at trade time"
                    value={form.valueUSD}
                    onChange={(e) => set('valueUSD', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. dca, p2p, staking"
                    value={form.tags}
                    onChange={(e) => set('tags', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  placeholder="e.g. Sold on Binance, received in Google Pay. Rate: ₹82.5/USDT"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 52 }}
                />
              </div>

              {/* ⚡ Two-Way Balance Sync Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: form.syncBalances ? 'rgba(16,185,129,0.08)' : 'var(--shell-bg)',
                  border: form.syncBalances ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--card-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.syncBalances)}
                  onChange={(e) => set('syncBalances', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--positive, #10B981)', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    ⚡ Auto-update portfolio balances
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                    Automatically increment/decrement holding quantities &amp; cash wallet balances
                  </div>
                </div>
              </label>

              {/* Actions */}
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                paddingTop: 10, borderTop: '1px solid var(--divider-1)',
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    border: '1px solid var(--card-border)',
                    background: 'var(--shell-bg)', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ minHeight: 38, padding: '0 18px', fontSize: 13, borderRadius: 10, gap: 6 }}
                >
                  <span>Review &amp; Confirm</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
