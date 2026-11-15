import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Link2,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Loader2,
  Check,
  TrendingUp,
} from 'lucide-react';
import api from '../api/axiosInstance';
import { ApiMappingModal } from './ApiMappingModal';
import { AssetLogo } from './AssetLogo';

const COMMON_TICKERS = ['BTC', 'ETH', 'SOL', 'USDT', 'USDC', 'BNB', 'AVAX', 'SUI', 'ARB', 'OP'];

export const PriceEditModal = ({
  isOpen,
  onClose,
  symbol,
  currentPriceInfo = {},
  onSavePrice,
  onResetPrice,
}) => {
  const safeSymbol = String(symbol || '');
  const priceObj =
    typeof currentPriceInfo === 'object' && currentPriceInfo !== null
      ? currentPriceInfo
      : { price: Number(currentPriceInfo) || 0 };

  const [activeTab, setActiveTab] = useState('fixed'); // 'fixed' | 'mapped'
  const [priceInput, setPriceInput] = useState('');
  const [mappedTickerInput, setMappedTickerInput] = useState('');
  const [customCurrency, setCustomCurrency] = useState('USD');
  const [isLocked, setIsLocked] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [bustingCache, setBustingCache] = useState(false);
  const [error, setError] = useState('');

  // Live API quote verification state
  const [verifiedQuote, setVerifiedQuote] = useState(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);

  const currentPrice = Number(priceObj.price || 0);
  const currentPriceInr = Number(priceObj.priceInr || priceObj.navInr || 0);
  const isCustom = !!priceObj.isCustom;
  const mappedSymbol = priceObj.mappedSymbol || '';
  const isINRAsset =
    priceObj.currency === 'INR' || safeSymbol.endsWith('.NS') || safeSymbol.endsWith('.BO');

  const fetchLiveQuote = async (tickerToFetch) => {
    const t = String(tickerToFetch || mappedTickerInput || '').trim();
    if (!t) return;

    setFetchingQuote(true);
    setError('');
    try {
      const res = await api.get(`/prices/quote/${encodeURIComponent(t)}`);
      if (res.data?.found) {
        setVerifiedQuote(res.data);
        if (res.data.suggestedSymbol && res.data.suggestedSymbol !== t) {
          setMappedTickerInput(res.data.suggestedSymbol);
        }
      } else {
        setVerifiedQuote(null);
        setError(res.data?.message || `No price quote found for ${t}`);
      }
    } catch (err) {
      setVerifiedQuote(null);
      setError(
        err.response?.data?.message ||
          `Could not fetch live quote for ${t}. If it's an Indian stock, try appending .NS (e.g. ${t}.NS)`
      );
    } finally {
      setFetchingQuote(false);
    }
  };

  useEffect(() => {
    if (isOpen && safeSymbol) {
      setError('');
      setVerifiedQuote(null);
      setCustomCurrency(isINRAsset ? 'INR' : 'USD');

      if (mappedSymbol) {
        setActiveTab('mapped');
        setMappedTickerInput(mappedSymbol);
        setPriceInput(currentPrice > 0 ? String(currentPrice) : '');
        fetchLiveQuote(mappedSymbol);
      } else {
        setActiveTab('fixed');
        const displayVal = isINRAsset && currentPriceInr > 0 ? currentPriceInr : currentPrice;
        setPriceInput(displayVal > 0 ? String(displayVal) : '');
        setMappedTickerInput('');
      }
      setIsLocked(priceObj.isLocked !== undefined ? !!priceObj.isLocked : true);
    }
  }, [isOpen, safeSymbol, currentPrice, currentPriceInr, isCustom, mappedSymbol, isINRAsset, priceObj.isLocked]);

  const handleSave = async () => {
    setError('');

    if (activeTab === 'fixed') {
      const num = Number(priceInput);
      if (isNaN(num) || num < 0 || priceInput.trim() === '') {
        setError('Please enter a valid non-negative price');
        return;
      }
      setSaving(true);
      try {
        await onSavePrice(safeSymbol, {
          price: num,
          mappedSymbol: null,
          currency: customCurrency,
          isLocked,
        });
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to save custom price');
      } finally {
        setSaving(false);
      }
    } else {
      const cleanMapped = (verifiedQuote?.symbol || mappedTickerInput).trim().toUpperCase();
      if (!cleanMapped) {
        setError('Please enter a target ticker symbol to map to (e.g. ETH, BTC, CANBK.NS)');
        return;
      }
      setSaving(true);
      try {
        await onSavePrice(safeSymbol, {
          price: null,
          mappedSymbol: cleanMapped,
          currency: verifiedQuote?.currency || 'USD',
          priceInr: verifiedQuote?.priceInr || verifiedQuote?.navInr || null,
          isLocked: true,
        });
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to save ticker mapping');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleReset = async () => {
    setError('');
    setResetting(true);
    try {
      await onResetPrice(safeSymbol);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset price');
    } finally {
      setResetting(false);
    }
  };

  const handleCacheBust = async () => {
    setError('');
    setBustingCache(true);
    try {
      const res = await api.delete(`/prices/cache/${encodeURIComponent(safeSymbol)}`);
      if (res.data?.price) {
        const freshPrice = res.data.price;
        const inrVal = freshPrice.priceInr ?? freshPrice.navInr ?? 0;
        const displayVal = isINRAsset && inrVal > 0 ? inrVal : (freshPrice.price ?? 0);
        setPriceInput(displayVal > 0 ? String(displayVal) : '');
      }
      onClose();
      if (typeof onResetPrice === 'function') onResetPrice(safeSymbol);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to clear price cache');
    } finally {
      setBustingCache(false);
    }
  };

  const formatUSD = (num) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(num || 0);

  const formatINR = (num) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num || 0);

  const currentDisplayFormatted =
    isINRAsset && currentPriceInr > 0 ? formatINR(currentPriceInr) : formatUSD(currentPrice);

  if (!isOpen || !symbol) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        style={{ color: 'var(--text-primary)' }}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--divider-2)] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <AssetLogo
              symbol={safeSymbol}
              assetType={isINRAsset ? 'stock' : 'crypto'}
              customUrl={priceObj.logoUrl}
              size={38}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                  Price Mapping · <span className="font-mono text-cyan-500">{symbol}</span>
                </h3>
                {isCustom && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {mappedSymbol ? `Mapped to ${mappedSymbol}` : 'Custom Override'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                Configure live price feed mapping or set a locked custom valuation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={saving || resetting}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Valuation Summary Strip & Mode Tabs */}
        <div className="px-5 py-3 bg-[var(--shell-bg)] border-b border-[var(--divider-2)] flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider block">
              Current Live Valuation
            </span>
            <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
              {currentDisplayFormatted}
            </span>
          </div>

          {/* Mode Tabs Pills */}
          <div className="flex items-center bg-[var(--card-bg)] border border-[var(--divider-2)] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('fixed')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                activeTab === 'fixed'
                  ? 'bg-[var(--shell-bg)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Lock size={12} />
              <span>Fixed Price</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mapped')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                activeTab === 'mapped'
                  ? 'bg-[var(--shell-bg)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Link2 size={12} />
              <span>Map to Ticker</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Fixed Custom Price */}
          {activeTab === 'fixed' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Custom Price Value
                  </label>
                  {/* Currency Toggle */}
                  <div className="flex items-center bg-[var(--shell-bg)] border border-[var(--divider-2)] p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setCustomCurrency('INR')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded transition cursor-pointer ${
                        customCurrency === 'INR'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      ₹ INR
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomCurrency('USD')}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded transition cursor-pointer ${
                        customCurrency === 'USD'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      $ USD
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono font-bold text-[var(--text-muted)]">
                    {customCurrency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm font-mono font-bold focus:outline-none focus:border-cyan-500 transition placeholder:text-[var(--text-muted)]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Lock Toggle Card */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[var(--shell-bg)] border border-[var(--divider-2)] cursor-pointer hover:border-[var(--card-border)] transition select-none">
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="mt-0.5 rounded text-cyan-600 focus:ring-cyan-500 border-[var(--card-border)]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Lock size={13} className="text-cyan-500" />
                    Lock Custom Price
                  </span>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    Prevents automated 5-minute background cron jobs and the manual "Refresh Prices" button from overwriting this custom value.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Tab 2: Map to Market Ticker */}
          {activeTab === 'mapped' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Target Market Symbol
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMappingModal(true)}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 transition cursor-pointer"
                  >
                    <Search size={13} />
                    <span>Search Stocks / Funds</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mappedTickerInput}
                    onChange={(e) => setMappedTickerInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CANBK.NS, BTC, ETH, 120503"
                    onKeyDown={(e) => e.key === 'Enter' && fetchLiveQuote(mappedTickerInput)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm font-mono font-bold uppercase focus:outline-none focus:border-cyan-500 transition placeholder:text-[var(--text-muted)]"
                  />
                  <button
                    type="button"
                    onClick={() => fetchLiveQuote(mappedTickerInput)}
                    disabled={fetchingQuote || !mappedTickerInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                  >
                    {fetchingQuote ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    <span>Test API</span>
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Connect this holding to live quotes from Yahoo Finance (Stocks), MFapi.in (Mutual Funds), or CoinMarketCap (Crypto).
                </p>
              </div>

              {/* Verified Live Quote Card */}
              {verifiedQuote && (
                <div className="p-3.5 rounded-xl bg-[var(--shell-bg)] border border-emerald-500/30 shadow-2xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
                        Live Quote Verified
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--divider-2)]">
                      Source: {verifiedQuote.source}
                    </span>
                  </div>

                  {verifiedQuote.schemeName && (
                    <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                      {verifiedQuote.schemeName}
                    </p>
                  )}

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xl font-extrabold font-mono text-[var(--text-primary)]">
                        {verifiedQuote.formattedPrice}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-mono ml-2">
                        ({verifiedQuote.currency})
                      </span>
                    </div>

                    {verifiedQuote.change24h !== undefined && verifiedQuote.change24h !== null && (
                      <span
                        className={`text-xs font-bold font-mono ${
                          Number(verifiedQuote.change24h) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {Number(verifiedQuote.change24h) >= 0 ? '+' : ''}
                        {Number(verifiedQuote.change24h).toFixed(2)}% (24H)
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono border-t border-[var(--divider-2)]">
                    <span>
                      Mapping: <strong className="text-cyan-500">{safeSymbol}</strong> &rarr;{' '}
                      <strong className="text-indigo-400">{verifiedQuote.symbol}</strong>
                    </span>
                    <span>Type: {verifiedQuote.assetType}</span>
                  </div>
                </div>
              )}

              {/* Quick Append & Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                    Popular Tickers:
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-[var(--text-muted)]">Append:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const base = mappedTickerInput.replace(/\.(NS|BO)$/i, '') || safeSymbol;
                        const newSym = `${base}.NS`;
                        setMappedTickerInput(newSym);
                        fetchLiveQuote(newSym);
                      }}
                      className="font-mono text-cyan-500 hover:underline cursor-pointer"
                    >
                      .NS (NSE)
                    </button>
                    <span className="text-[var(--text-muted)]">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const base = mappedTickerInput.replace(/\.(NS|BO)$/i, '') || safeSymbol;
                        const newSym = `${base}.BO`;
                        setMappedTickerInput(newSym);
                        fetchLiveQuote(newSym);
                      }}
                      className="font-mono text-cyan-500 hover:underline cursor-pointer"
                    >
                      .BO (BSE)
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TICKERS.filter((t) => t !== safeSymbol.toUpperCase()).map((ticker) => (
                    <button
                      key={ticker}
                      type="button"
                      onClick={() => {
                        setMappedTickerInput(ticker);
                        fetchLiveQuote(ticker);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer border ${
                        mappedTickerInput === ticker
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
                          : 'bg-[var(--shell-bg)] border-[var(--divider-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--card-border)]'
                      }`}
                    >
                      {ticker}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--divider-2)] bg-[var(--shell-bg)] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {isCustom && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving || resetting || bustingCache}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset to Live'}
              </button>
            )}
            <button
              type="button"
              onClick={handleCacheBust}
              disabled={saving || resetting || bustingCache}
              title="Delete the cached price from the database and fetch a fresh one from the source"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={12} className={bustingCache ? 'animate-spin' : ''} />
              <span>{bustingCache ? 'Refreshing...' : 'Force Refresh Cache'}</span>
            </button>
          </div>

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
              disabled={saving || resetting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={13} />
                  <span>{activeTab === 'mapped' ? 'Save & Link Ticker' : 'Save Price'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced API Search & Mapping Modal */}
      {showMappingModal && (
        <ApiMappingModal
          isOpen={showMappingModal}
          onClose={() => setShowMappingModal(false)}
          sourceSymbol={symbol}
          sourceAssetType={isINRAsset ? 'stock' : 'crypto'}
          referencePrice={currentPriceInr || currentPrice}
          currency={isINRAsset ? 'INR' : 'USD'}
          onConfirmMapping={({ mappedSymbol: chosenSymbol, quote: chosenQuote }) => {
            setMappedTickerInput(chosenSymbol);
            if (chosenQuote) setVerifiedQuote(chosenQuote);
            setShowMappingModal(false);
          }}
        />
      )}
    </div>
  );
};
