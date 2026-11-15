import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Coins,
  Layers,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
  Check,
  Zap,
} from 'lucide-react';
import api from '../api/axiosInstance';

export const ApiMappingModal = ({
  isOpen,
  onClose,
  sourceSymbol = '',
  sourceName = '',
  sourceAssetType = 'stock',
  referencePrice = null,
  currency = 'INR',
  onConfirmMapping,
}) => {
  const [assetType, setAssetType] = useState(sourceAssetType || 'stock');
  const [targetSymbol, setTargetSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);

  // MF variants and auto-selection state
  const [mfSearchQuery, setMfSearchQuery] = useState('');
  const [mfVariants, setMfVariants] = useState([]);
  const [selectedMfVariant, setSelectedMfVariant] = useState(null);
  const [mfSearching, setMfSearching] = useState(false);
  const [showAllVariants, setShowAllVariants] = useState(true);

  const safeSourceSymbol = String(sourceSymbol || '');

  const fetchQuote = async (symbolToFetch, typeToUse) => {
    const sym = String(symbolToFetch || targetSymbol || '').trim();
    if (!sym) {
      setError('Please enter a symbol or scheme code');
      return;
    }

    setLoading(true);
    setError('');
    setQuote(null);

    try {
      const type = typeToUse || assetType;
      const res = await api.get(
        `/prices/quote/${encodeURIComponent(sym)}?assetType=${type}&referencePrice=${referencePrice || ''}`
      );
      if (res.data?.found) {
        setQuote(res.data);
        if (res.data.suggestedSymbol && res.data.suggestedSymbol !== sym) {
          setTargetSymbol(res.data.suggestedSymbol);
        }
      } else {
        setError(res.data?.message || `No price quote found for ${sym}`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Could not fetch live quote for "${sym}". For Indian stocks, try appending .NS (e.g. ${sym}.NS).`
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all variants for the mutual fund (Direct, Regular, Growth, IDCW),
   * along with their live NAVs, and auto-select the variant closest to referencePrice.
   */
  const fetchMfVariants = async (queryText) => {
    const q = String(queryText || '').trim();
    if (!q || q.length < 2) return;

    setMfSearching(true);
    setError('');

    try {
      const res = await api.get('/prices/mf/variants', {
        params: {
          q,
          referencePrice: referencePrice ? Number(referencePrice) : undefined,
        },
      });

      const { variants = [], bestMatch } = res.data || {};
      setMfVariants(variants);

      if (bestMatch) {
        setSelectedMfVariant(bestMatch);
        setTargetSymbol(String(bestMatch.schemeCode));
        await fetchQuote(String(bestMatch.schemeCode), 'mutual_fund');
      } else if (variants.length > 0) {
        setSelectedMfVariant(variants[0]);
        setTargetSymbol(String(variants[0].schemeCode));
        await fetchQuote(String(variants[0].schemeCode), 'mutual_fund');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search mutual fund variants');
    } finally {
      setMfSearching(false);
    }
  };

  const handleSelectVariant = async (variant) => {
    setSelectedMfVariant(variant);
    setTargetSymbol(String(variant.schemeCode));
    await fetchQuote(String(variant.schemeCode), 'mutual_fund');
  };

  useEffect(() => {
    if (isOpen) {
      setQuote(null);
      setError('');
      setMfVariants([]);
      setSelectedMfVariant(null);

      const initialType = sourceAssetType || 'stock';
      setAssetType(initialType);

      if (initialType === 'mutual_fund') {
        const queryToRun = (sourceName || safeSourceSymbol).trim();
        setMfSearchQuery(queryToRun);
        setTargetSymbol('');
        if (queryToRun) {
          fetchMfVariants(queryToRun);
        }
      } else {
        let guess = safeSourceSymbol.toUpperCase();
        if (initialType === 'stock' && !guess.includes('.')) {
          guess = `${guess}.NS`;
        }
        setTargetSymbol(guess);
        if (guess) {
          fetchQuote(guess, initialType);
        }
      }
    }
  }, [isOpen, sourceSymbol, sourceName, sourceAssetType]);

  const handleAppendSuffix = (suffix) => {
    let base = targetSymbol.replace(/\.(NS|BO)$/i, '');
    const newSym = `${base}${suffix}`;
    setTargetSymbol(newSym);
    fetchQuote(newSym, 'stock');
  };

  const handleConfirm = () => {
    if (!quote) return;
    onConfirmMapping({
      sourceSymbol: sourceSymbol.toUpperCase(),
      mappedSymbol: quote.symbol || targetSymbol.toUpperCase(),
      assetType,
      quote,
      price: quote.price,
      priceInr: quote.priceInr || quote.navInr,
      currency: quote.currency || (assetType === 'crypto' ? 'USD' : 'INR'),
      schemeName: quote.schemeName || null,
    });
    onClose();
  };

  const renderPriceDiff = () => {
    if (!referencePrice || !quote) return null;
    const ref = Number(referencePrice);
    const live = quote.currency === 'INR' && quote.priceInr ? Number(quote.priceInr) : Number(quote.price);
    if (!ref || !live) return null;

    const diffPct = ((Math.abs(live - ref) / ref) * 100).toFixed(2);
    const isClose = diffPct < 3;

    return (
      <div
        className={`mt-2 p-2.5 rounded-xl text-xs flex items-center justify-between border ${
          isClose
            ? 'bg-[var(--positive-bg)] border-[var(--positive)]/20 text-[var(--positive)]'
            : 'bg-[var(--warning-bg)] border-[var(--warning)]/20 text-[var(--warning)]'
        }`}
      >
        <span>
          Original LTP: <strong>{quote.currency === 'INR' ? `₹${ref.toFixed(2)}` : `$${ref.toFixed(2)}`}</strong>
        </span>
        <span className="font-semibold">
          {isClose ? `Match (${diffPct}% diff)` : `${diffPct}% variance`}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--panel-bg)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--divider-1)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight truncate">
                Verify Quote · <span className="font-mono text-[var(--text-primary)]">{sourceName || sourceSymbol || 'Asset'}</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                Test live feeds from MFapi.in, Yahoo Finance, or CoinMarketCap
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

        {/* Asset Type Selector Tabs */}
        <div className="px-5 py-3 bg-[var(--shell-bg)] border-b border-[var(--divider-1)]">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs">
            {[
              { id: 'stock', label: 'Stock / ETF', icon: TrendingUp },
              { id: 'mutual_fund', label: 'Mutual Fund', icon: Layers },
              { id: 'crypto', label: 'Crypto', icon: Coins },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setAssetType(id);
                  setQuote(null);
                  setError('');
                  if (id === 'mutual_fund') {
                    const defaultSearch = (sourceName || safeSourceSymbol).trim();
                    setMfSearchQuery(defaultSearch);
                    if (defaultSearch) fetchMfVariants(defaultSearch);
                  } else if (id === 'stock' && targetSymbol && !targetSymbol.includes('.')) {
                    setTargetSymbol(`${targetSymbol}.NS`);
                  }
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition cursor-pointer ${
                  assetType === id
                    ? 'bg-[var(--shell-bg)] text-[var(--text-primary)] font-bold border border-[var(--card-border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Stock / ETF Input Section */}
          {assetType === 'stock' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Stock Ticker (Yahoo Finance)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={targetSymbol}
                  onChange={(e) => setTargetSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. CANBK.NS, RELIANCE.NS, AAPL"
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuote(targetSymbol, 'stock')}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm font-mono font-bold uppercase focus:outline-none focus:border-[var(--text-primary)] transition placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => fetchQuote(targetSymbol, 'stock')}
                  disabled={loading || !targetSymbol.trim()}
                  className="btn-primary min-h-[38px] px-4 text-xs font-semibold rounded-xl disabled:opacity-50 shrink-0"
                >
                  {loading ? <Loader2 size={13} className="animate-spin text-[var(--btn-primary-text)]" /> : <RefreshCw size={13} className="text-[var(--btn-primary-text)]" />}
                  <span>Fetch Price</span>
                </button>
              </div>

              {/* Quick Suffix Helpers for Indian NSE/BSE */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-[var(--text-muted)]">Indian Exchanges:</span>
                <button
                  type="button"
                  onClick={() => handleAppendSuffix('.NS')}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[var(--shell-bg)] border border-[var(--card-border)] hover:bg-[var(--card-bg)] text-[var(--text-primary)] transition cursor-pointer"
                >
                  + .NS (NSE)
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendSuffix('.BO')}
                  className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[var(--shell-bg)] border border-[var(--card-border)] hover:bg-[var(--card-bg)] text-[var(--text-primary)] transition cursor-pointer"
                >
                  + .BO (BSE)
                </button>
              </div>
            </div>
          )}

          {/* Mutual Fund Input & Variants Section */}
          {assetType === 'mutual_fund' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Mutual Fund Name or Scheme Code
                </label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      type="text"
                      value={mfSearchQuery}
                      onChange={(e) => setMfSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchMfVariants(mfSearchQuery)}
                      placeholder="e.g. Parag Parikh Flexi Cap, Quant Small Cap..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition placeholder:text-[var(--text-muted)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchMfVariants(mfSearchQuery)}
                    disabled={mfSearching || !mfSearchQuery.trim()}
                    className="btn-primary min-h-[36px] px-3.5 text-xs font-semibold rounded-xl disabled:opacity-50 shrink-0"
                  >
                    {mfSearching ? <Loader2 size={13} className="animate-spin text-[var(--btn-primary-text)]" /> : <Search size={13} className="text-[var(--btn-primary-text)]" />}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Variants Results */}
              {mfVariants.length > 0 && (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                    <span>Select Exact Plan Variant ({mfVariants.length})</span>
                    {selectedMfVariant && (
                      <span className="text-[var(--text-primary)] font-mono font-medium">Code #{selectedMfVariant.schemeCode}</span>
                    )}
                  </div>

                  {mfVariants.map((v) => {
                    const isSelected = selectedMfVariant?.schemeCode === v.schemeCode;
                    return (
                      <div
                        key={v.schemeCode}
                        onClick={() => handleSelectVariant(v)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-[var(--shell-bg)] border-[var(--text-primary)] shadow-2xs font-semibold'
                            : 'bg-[var(--card-bg)] border-[var(--card-border)] hover:bg-[var(--shell-bg)]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            {v.schemeName}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                            Code: {v.schemeCode}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-xs text-[var(--text-primary)]">
                            ₹{Number(v.nav || 0).toFixed(2)}
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-[var(--positive)]">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Crypto Input Section */}
          {assetType === 'crypto' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Cryptocurrency Ticker
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={targetSymbol}
                  onChange={(e) => setTargetSymbol(e.target.value.toUpperCase())}
                  placeholder="e.g. BTC, ETH, SOL, SUI"
                  onKeyDown={(e) => e.key === 'Enter' && fetchQuote(targetSymbol, 'crypto')}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-sm font-mono font-bold uppercase focus:outline-none focus:border-[var(--text-primary)] transition placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => fetchQuote(targetSymbol, 'crypto')}
                  disabled={loading || !targetSymbol.trim()}
                  className="btn-primary min-h-[38px] px-4 text-xs font-semibold rounded-xl disabled:opacity-50 shrink-0"
                >
                  {loading ? <Loader2 size={13} className="animate-spin text-[var(--btn-primary-text)]" /> : <RefreshCw size={13} className="text-[var(--btn-primary-text)]" />}
                  <span>Fetch Price</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-[var(--negative-bg)] border border-[var(--negative)]/20 text-[var(--negative)] text-xs flex items-center gap-2 font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verified Quote Preview Card */}
          {quote && (
            <div className="p-4 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] shadow-2xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[var(--positive)]" />
                  <span className="text-[11px] font-bold text-[var(--positive)] uppercase tracking-wider">
                    Live Quote Verified
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]">
                  Source: {quote.source}
                </span>
              </div>

              {quote.schemeName && (
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                  {quote.schemeName}
                </p>
              )}

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">
                    {quote.formattedPrice}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] font-mono ml-2">
                    ({quote.currency})
                  </span>
                </div>

                {quote.change24h !== undefined && (
                  <span
                    className={`text-xs font-bold font-mono ${
                      quote.change24h >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
                    }`}
                  >
                    {quote.change24h >= 0 ? '+' : ''}
                    {Number(quote.change24h).toFixed(2)}% (24H)
                  </span>
                )}
              </div>

              {renderPriceDiff()}

              <div className="pt-2 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono border-t border-[var(--divider-1)]">
                <span>
                  Mapping: <strong className="text-[var(--text-primary)]">{sourceSymbol || 'Asset'}</strong> &rarr;{' '}
                  <strong className="text-[var(--text-primary)]">{quote.symbol}</strong>
                </span>
                <span>Type: {quote.assetType}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="px-5 py-3.5 border-t border-[var(--divider-1)] bg-[var(--shell-bg)] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg)] border border-[var(--card-border)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!quote}
            className="btn-primary min-h-[36px] px-4 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={13} className="text-[var(--btn-primary-text)]" />
            <span>Confirm & Map to {quote ? quote.symbol : 'Symbol'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
