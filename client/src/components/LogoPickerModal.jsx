import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  RotateCcw,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import api from '../api/axiosInstance';
import { AssetLogo } from './AssetLogo';

export const LogoPickerModal = ({
  isOpen,
  onClose,
  symbol = '',
  assetType = 'crypto',
  currentLogoUrl = null,
  isCustomLogo = false,
  onSaveLogo,
  onResetLogo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'custom'
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(symbol || '');
      setSelectedCoin(null);
      setCustomUrlInput('');
      setActiveTab('search');
      setError('');
      fetchCoins(symbol || '');
    }
  }, [isOpen, symbol]);

  const fetchCoins = async (q = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/prices/logo/search?q=${encodeURIComponent(q)}&assetType=${encodeURIComponent(assetType || '')}`);
      setResults(res.data?.results || []);
    } catch (err) {
      console.error('Failed to search logos:', err);
      setError('Could not load logo search results.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchCoins(val);
  };

  const handleSelectCoin = (coin) => {
    setSelectedCoin(coin);
    setCustomUrlInput(coin.logoUrl);
  };

  const handleSave = async () => {
    const rawCustom = customUrlInput.trim();
    if (!selectedCoin && !rawCustom) {
      setError('Please select a logo from the list or enter an image URL / CMC ID.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const isDigits = /^\d+$/.test(rawCustom);
      const cmcIdNum = selectedCoin ? selectedCoin.id : isDigits ? parseInt(rawCustom, 10) : null;
      const logoUrlStr = selectedCoin
        ? selectedCoin.logoUrl
        : isDigits
          ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcIdNum}.png`
          : rawCustom;

      const payload = {
        symbol,
        logoUrl: logoUrlStr,
        cmcId: cmcIdNum,
      };

      if (onSaveLogo) {
        await onSaveLogo(symbol, payload);
      }
      onClose();
    } catch (err) {
      console.error('Save logo error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save logo.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError('');
    try {
      if (onResetLogo) {
        await onResetLogo(symbol);
      }
      onClose();
    } catch (err) {
      console.error('Reset logo error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to reset logo.');
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  const trimmedCustom = customUrlInput.trim();
  const customIsDigits = /^\d+$/.test(trimmedCustom);
  const resolvedCustomUrl = customIsDigits
    ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${trimmedCustom}.png`
    : trimmedCustom;

  const previewUrl =
    activeTab === 'custom' && trimmedCustom
      ? resolvedCustomUrl
      : selectedCoin
        ? selectedCoin.logoUrl
        : currentLogoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        style={{ color: 'var(--text-primary)' }}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--divider-2)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                Change Logo for {symbol}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {assetType === 'stock'
                  ? 'Search verified stock & ETF logos or provide a custom image URL'
                  : assetType === 'mutual_fund'
                    ? 'All funds from the same AMC (fund house) share one logo'
                    : 'Search verified CoinMarketCap logos or provide a custom image URL'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Preview Header */}
        <div className="px-5 py-3.5 bg-[var(--shell-bg)] border-b border-[var(--divider-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <AssetLogo
                symbol={symbol}
                assetType={assetType}
                customUrl={previewUrl}
                size={44}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{selectedCoin ? selectedCoin.name : symbol}</span>
                {isCustomLogo && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Custom Mapped
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {selectedCoin
                  ? selectedCoin.id
                    ? `CMC ID #${selectedCoin.id}`
                    : 'Verified Stock Logo'
                  : previewUrl
                    ? 'Active Logo URL'
                    : 'Default Starting Letter'}
              </div>
            </div>
          </div>

          {/* Tab Pill Toggle */}
          <div className="flex items-center bg-[var(--card-bg)] border border-[var(--divider-2)] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${activeTab === 'search'
                  ? 'bg-[var(--shell-bg)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              Search List
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${activeTab === 'custom'
                  ? 'bg-[var(--shell-bg)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
            >
              Custom URL
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </div>
          )}

          {activeTab === 'search' ? (
            <>
              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={
                    assetType === 'stock'
                      ? 'Search by company name (e.g. Apple) or ticker (e.g. AAPL, RELIANCE.NS)...'
                      : assetType === 'mutual_fund'
                        ? 'Search by fund house (e.g. HDFC, Axis, SBI, Parag Parikh)...'
                        : 'Search by coin name (e.g. LayerZero) or ticker (e.g. ZRO)...'
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition placeholder:text-[var(--text-muted)]"
                  autoFocus
                />
                {loading && (
                  <Loader2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 animate-spin"
                  />
                )}
              </div>

              {/* Grid of Results */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {results.length > 0 ? (
                  results.map((coin) => {
                    const isSelected =
                      (selectedCoin?.id && selectedCoin.id === coin.id) ||
                      (selectedCoin?.symbol === coin.symbol) ||
                      (!selectedCoin && previewUrl === coin.logoUrl);
                    return (
                      <div
                        key={coin.id || coin.symbol}
                        onClick={() => handleSelectCoin(coin)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-[var(--text-primary)] shadow-2xs'
                            : 'bg-[var(--shell-bg)] border-[var(--divider-2)] hover:border-[var(--card-border)] hover:bg-[var(--card-bg)] text-[var(--text-primary)]'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={coin.logoUrl}
                            alt={coin.symbol}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-[var(--card-border)]"
                            onError={(e) => {
                              if (coin.altLogoUrl && e.target.src !== coin.altLogoUrl) {
                                e.target.src = coin.altLogoUrl;
                              } else {
                                e.target.style.display = 'none';
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                              <span>{coin.name}</span>
                              {coin.id ? (
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                  #{coin.id}
                                </span>
                              ) : coin.assetType === 'mutual_fund' ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  AMC
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                  Stock
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-medium">
                              {coin.symbol}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] opacity-0 hover:opacity-100">
                            Select
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    {loading
                      ? 'Searching database...'
                      : assetType === 'stock'
                        ? 'No matching stocks found.'
                        : assetType === 'mutual_fund'
                          ? 'No matching fund houses found.'
                          : 'No matching cryptocurrencies found.'}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Custom URL / Direct CMC ID Tab */
            <div className="space-y-3 py-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  {assetType === 'stock' ? 'Custom Stock Logo Image URL' : 'Custom Logo Image URL or CoinMarketCap ID'}
                </label>
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setSelectedCoin(null);
                  }}
                  placeholder={
                    assetType === 'stock'
                      ? 'https://... image URL (e.g. PNG, SVG, JPG)'
                      : 'https://... or enter CMC ID (e.g. 26997)'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 transition placeholder:text-[var(--text-muted)]"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                  {assetType === 'stock'
                    ? 'Tip: You can paste any direct web image URL (PNG, SVG, JPG) to use as the logo for this stock.'
                    : 'Tip: You can enter an image URL directly or a CoinMarketCap ID number (like 26997 for LayerZero or 30494 for EigenLayer).'}
                </p>
              </div>

              {customUrlInput.trim() && (
                <div className="p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--divider-2)] flex items-center gap-3">
                  <img
                    src={
                      /^\d+$/.test(customUrlInput.trim())
                        ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${customUrlInput.trim()}.png`
                        : customUrlInput.trim()
                    }
                    alt="Preview"
                    className="w-8 h-8 rounded-full object-cover border border-[var(--card-border)]"
                    onError={(e) => {
                      e.target.src = '';
                      e.target.alt = 'Invalid image';
                    }}
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">Image Preview</span>
                    <div className="text-[11px] text-[var(--text-muted)] truncate max-w-[280px]">
                      {customUrlInput.trim()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--divider-2)] bg-[var(--shell-bg)] flex items-center justify-between gap-2">
          {isCustomLogo ? (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {resetting ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              Reset to Default
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || resetting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] border border-[var(--card-border)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || resetting || (!selectedCoin && !customUrlInput.trim())}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
              Save Logo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
