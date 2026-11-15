import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle,
  CheckCircle2,
  Trash2,
  Plus,
  ShieldCheck,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Hand,
  AlertTriangle,
  Lock,
  Link2,
  Zap,
  DollarSign,
  AlertCircle,
  Info,
  Wallet,
  Search,
  Loader2,
} from 'lucide-react';
import api from '../api/axiosInstance';
import { ApiMappingModal } from './ApiMappingModal';

/** Tier badge component — subtle indicator of which extraction path was used */
const TierBadge = ({ tier }) => {
  if (!tier) return null;

  const badges = {
    gemini_vision: {
      label: '✨ AI Vision',
      className: 'bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)]',
    },
    gemini: {
      label: '✨ AI Extracted',
      className: 'bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)]',
    },
    gemini_text: {
      label: '🔁 OCR + AI',
      className: 'bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]',
    },
    groq_ocr: {
      label: '🔄 OCR Fallback',
      className: 'bg-[var(--warning-bg)] border border-[var(--warning)]/20 text-[var(--warning)]',
    },
    openrouter_ocr: {
      label: '🌐 OpenRouter OCR',
      className: 'bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]',
    },
    manual: {
      label: '✋ Manual Entry',
      className: 'bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-muted)]',
    },
    json_paste: {
      label: '📋 Pasted JSON',
      className: 'bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)]',
    },
  };

  const badge = badges[tier];
  if (!badge) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide ${badge.className}`}>
      {badge.label}
    </span>
  );
};

export const ExtractionReviewModal = ({
  isOpen,
  onClose,
  extractedItems = [],
  onSaveSuccess,
  tier = null,
  manualFallback = false,
  rawText = '',
  wallets = [],
  targetWalletId = '',
}) => {
  const [items, setItems] = useState([]);
  const [selectedWalletId, setSelectedWalletId] = useState(targetWalletId || '');
  const [livePrices, setLivePrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currencyPreference, setCurrencyPreference] = useState('INR');
  const [mappingModalItem, setMappingModalItem] = useState(null);
  // Per-row live price verification state
  const [verifyingTicker, setVerifyingTicker] = useState(new Set());
  const [verifiedPrices, setVerifiedPrices] = useState({}); // tempId -> { ticker, price }

  useEffect(() => {
    if (isOpen) {
      setSelectedWalletId(targetWalletId || '');
    }
  }, [isOpen, targetWalletId]);

  // Sorting state
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch live market quotes for all extracted items upon open with smart batch lookup
  const fetchQuotes = async (itemsToFetch = extractedItems) => {
    if (!itemsToFetch || itemsToFetch.length === 0) return;
    setLoadingPrices(true);
    try {
      const lookupPayload = itemsToFetch.map((it) => ({
        symbol: it.symbol,
        mappedSymbol: it.mappedSymbol,
        assetType: it.assetType,
        name: it.name || it.schemeName || it.symbol,
        extractedPrice: it.extractedPrice,
        // Forward AI-extracted hints so lookup-batch can resolve prices directly
        ...(it.yahooSymbol ? { yahooSymbol: it.yahooSymbol } : {}),
        ...(it.mfSchemeCode ? { mfSchemeCode: it.mfSchemeCode } : {}),
      }));

      const res = await api.post('/prices/lookup-batch', { items: lookupPayload });
      const fetchedPrices = res.data?.prices || {};
      const resolvedMap = res.data?.resolvedMap || {};

      setLivePrices((prev) => ({ ...prev, ...fetchedPrices }));

      // Auto-update items with any resolved symbols (e.g. CANBK -> CANBK.NS or MF scheme codes)
      setItems((prevItems) =>
        prevItems.map((it) => {
          const symUpper = String(it.symbol || '').toUpperCase();
          const resInfo = resolvedMap[symUpper];
          if (resInfo && resInfo.resolvedSymbol && resInfo.resolvedSymbol !== it.symbol) {
            return {
              ...it,
              mappedSymbol: it.mappedSymbol || resInfo.resolvedSymbol,
              ...(resInfo.schemeName && !it.schemeName ? { schemeName: resInfo.schemeName } : {}),
            };
          }
          return it;
        })
      );
    } catch (err) {
      console.warn('Failed to load market prices for review modal:', err.message);
    } finally {
      setLoadingPrices(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuotes(extractedItems);
    }
  }, [isOpen, extractedItems]);

  useEffect(() => {
    if (manualFallback) {
      // Manual fallback mode — start with one empty row
      setItems([
        {
          tempId: Date.now(),
          symbol: '',
          quantity: 1,
          extractedPrice: null,
          totalValue: null,
          priceAction: 'live',
          mappedSymbol: '',
          customPrice: '',
          avgBuyPrice: 0,
          assetType: 'stock',
          notes: 'Manually entered from screenshot',
        },
      ]);
    } else if (extractedItems && extractedItems.length > 0) {
      setItems(
        extractedItems.map((item, idx) => {
          const ep = item.extractedPrice !== undefined && item.extractedPrice !== null ? Number(item.extractedPrice) : null;
          const tv = item.totalValue !== undefined && item.totalValue !== null ? Number(item.totalValue) : null;

          // Default strategy: if extractedPrice exists, choose 'screenshot' to protect user from wrong token matches
          const defaultAction = ep && ep > 0 ? 'screenshot' : 'live';
          const initialMapped = item.yahooSymbol || item.mfSchemeCode || item.mappedSymbol || '';

          return {
            ...item,
            tempId: idx + 1,
            extractedPrice: ep,
            totalValue: tv,
            priceAction: defaultAction, // 'screenshot' | 'live' | 'mapped' | 'custom'
            mappedSymbol: initialMapped,
            customPrice: ep ? String(ep) : '',
          };
        })
      );
    }
  }, [extractedItems, manualFallback]);

  // Formatters for INR and USD
  const formatINR = (num) => {
    const n = Number(num);
    if (isNaN(n)) return '—';
    if (n !== 0 && Math.abs(n) < 0.01) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(n);
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  const formatUSD = (num) => {
    const n = Number(num);
    if (isNaN(n)) return '—';
    if (n !== 0 && Math.abs(n) < 0.01) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(n);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  const fmtCurrency = (num, itemOrAssetType) => {
    const type = typeof itemOrAssetType === 'object' ? itemOrAssetType?.assetType : itemOrAssetType;
    if (currencyPreference === 'INR' || type === 'stock' || type === 'mutual_fund') {
      return formatINR(num);
    }
    return formatUSD(num);
  };

  // Analyze price discrepancies for an item
  const getItemPriceAnalysis = (item) => {
    if (item.assetType === 'cash') {
      return { isMismatch: false, livePrice: 1, diffPct: 0, isUnlisted: false };
    }

    const symUpper = item.symbol ? item.symbol.toUpperCase() : '';
    const mappedUpper = item.mappedSymbol ? item.mappedSymbol.toUpperCase() : '';
    const schemeCode = item.mfSchemeCode ? String(item.mfSchemeCode) : '';

    const liveQuote =
      (mappedUpper && livePrices[mappedUpper]) ||
      (mappedUpper && !mappedUpper.includes('.') && livePrices[`${mappedUpper}.NS`]) ||
      (schemeCode && livePrices[schemeCode]) ||
      (symUpper && livePrices[symUpper]) ||
      (symUpper && !symUpper.includes('.') && livePrices[`${symUpper}.NS`]) ||
      (symUpper && !symUpper.includes('.') && livePrices[`${symUpper}.BO`]) ||
      null;

    const inrRate = Number(livePrices['INR']?.price || livePrices['INR']?.rate || 95.7);
    const isINR = currencyPreference === 'INR' || item.assetType === 'stock' || item.assetType === 'mutual_fund' || liveQuote?.currency === 'INR';

    let livePrice = 0;
    const verifiedEntry = verifiedPrices[item.tempId];
    if (verifiedEntry) {
      const rawV = verifiedEntry.numericPrice ?? verifiedEntry.priceInr ?? verifiedEntry.price;
      const vPrice = typeof rawV === 'number' ? rawV : Number(String(rawV).replace(/[^0-9.]/g, ''));
      if (!isNaN(vPrice) && vPrice > 0) {
        livePrice = vPrice;
      }
    }

    if (!livePrice && typeof liveQuote === 'object' && liveQuote !== null) {
      if (isINR) {
        const inrVal = liveQuote.priceInr ?? liveQuote.navInr ?? (liveQuote.price > 0 ? (liveQuote.currency === 'INR' && liveQuote.price > 10 ? liveQuote.price : liveQuote.price * inrRate) : 0);
        livePrice = Number(inrVal) || 0;
      } else {
        livePrice = Number(liveQuote.price || 0);
      }
    } else if (!livePrice && typeof liveQuote === 'number') {
      livePrice = liveQuote;
    }

    const screenshotPrice = item.extractedPrice !== null && item.extractedPrice !== undefined ? Number(item.extractedPrice) : null;

    if (screenshotPrice !== null && screenshotPrice > 0) {
      if (livePrice === 0) {
        return { isMismatch: true, livePrice: 0, diffPct: 100, isUnlisted: true };
      }
      const diffPct = (Math.abs(livePrice - screenshotPrice) / screenshotPrice) * 100;
      return { isMismatch: diffPct > 15, livePrice, diffPct, isUnlisted: false };
    }

    return { isMismatch: false, livePrice, diffPct: 0, isUnlisted: livePrice === 0 };
  };

  // Check if any items have price mismatches
  const hasMismatches = useMemo(() => {
    return items.some((it) => getItemPriceAnalysis(it).isMismatch);
  }, [items, livePrices]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      const isNumeric = ['quantity', 'avgBuyPrice', 'extractedPrice', 'totalValue'].includes(field);
      setSortDirection(isNumeric ? 'desc' : 'asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (['quantity', 'avgBuyPrice', 'extractedPrice', 'totalValue'].includes(sortField)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDirection]);

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 inline text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 ml-1 inline text-[var(--text-primary)] font-bold" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline text-[var(--text-primary)] font-bold" />
    );
  };

  if (!isOpen) return null;

  const handleFieldChange = (tempId, field, value) => {
    setItems((prevItems) =>
      prevItems.map((it) =>
        it.tempId === tempId
          ? { ...it, [field]: field === 'symbol' ? value.toUpperCase() : value }
          : it
      )
    );
  };

  const handleRemoveRow = (tempId) => {
    setItems((prevItems) => prevItems.filter((it) => it.tempId !== tempId));
  };

  const handleAddEmptyRow = () => {
    setItems([
      ...items,
      {
        tempId: Date.now(),
        symbol: '',
        quantity: 1,
        extractedPrice: null,
        totalValue: null,
        priceAction: 'live',
        mappedSymbol: '',
        customPrice: '',
        avgBuyPrice: 0,
        assetType: 'stock',
        notes: 'Manually added during review stage',
        verifyTicker: '',
      },
    ]);
  };

  // Verify a live ticker for a given row
  const handleVerifyTicker = async (tempId, ticker) => {
    if (!ticker || !ticker.trim()) return;
    const t = ticker.trim().toUpperCase();
    setVerifyingTicker((prev) => new Set([...prev, tempId]));
    try {
      const res = await api.get(`/prices/quote/${encodeURIComponent(t)}`);
      const q = res.data;
      const numPrice = Number(q?.priceInr || q?.navInr || (q?.currency === 'INR' ? q?.price : null) || q?.price || 0);
      const resolvedTicker = q?.symbol || q?.suggestedSymbol || t;

      setVerifiedPrices((prev) => ({
        ...prev,
        [tempId]: {
          ticker: resolvedTicker,
          price: numPrice,
          numericPrice: numPrice,
          formattedPrice: q?.formattedPrice || (numPrice > 0 ? `₹${numPrice.toFixed(2)}` : '—'),
          quote: q,
        },
      }));

      if (numPrice > 0) {
        const liveEntry = {
          ...(q || {}),
          price: q?.price || numPrice,
          priceInr: numPrice,
          navInr: q?.navInr || (q?.assetType === 'mutual_fund' ? numPrice : undefined),
          currency: q?.currency || 'INR',
        };
        setLivePrices((prev) => ({
          ...prev,
          [t]: liveEntry,
          [resolvedTicker]: liveEntry,
        }));
      }

      // Auto-set mappedSymbol so the save logic uses this ticker for price lookups
      setItems((prev) =>
        prev.map((it) =>
          it.tempId === tempId
            ? {
                ...it,
                priceAction: 'mapped',
                mappedSymbol: resolvedTicker,
                assetType: q?.assetType || it.assetType,
                ...(q?.schemeName ? { mfSchemeName: q.schemeName } : {}),
              }
            : it
        )
      );
    } catch (err) {
      console.warn('Verify ticker failed:', err.message);
      setVerifiedPrices((prev) => ({ ...prev, [tempId]: { ticker: t, price: 0, error: true } }));
    } finally {
      setVerifyingTicker((prev) => { const n = new Set(prev); n.delete(tempId); return n; });
    }
  };

  // Bulk actions for all items
  const handleBulkSetStrategy = (strategy) => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        priceAction: strategy,
      }))
    );
  };

  // Bulk actions by asset type (e.g. all stocks or all mutual funds)
  const handleBulkSetStrategyByAssetType = (targetType, strategy) => {
    setItems((prev) =>
      prev.map((it) => (it.assetType === targetType ? { ...it, priceAction: strategy } : it))
    );
  };

  const handleConfirmSave = async () => {
    setError('');

    // Validation check
    const invalidItem = items.find((it) => !it.symbol || !it.quantity || Number(it.quantity) <= 0);
    if (invalidItem) {
      setError('Please ensure all items have a valid Symbol and positive Quantity before saving.');
      return;
    }

    // Validate mapped items
    const invalidMapping = items.find((it) => it.priceAction === 'mapped' && (!it.mappedSymbol || !it.mappedSymbol.trim()));
    if (invalidMapping) {
      setError(`Please specify a target ticker to map for ${invalidMapping.symbol}`);
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/holdings/batch', {
        holdings: items.map((it) => ({
          ...it,
          currency: currencyPreference,
        })),
        walletId: selectedWalletId || null,
      });
      onSaveSuccess(res.data.holdings);
      onClose();
    } catch (err) {
      console.error('Batch Save Error:', err);
      setError(err.response?.data?.message || 'Failed to save extracted holdings');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyApiMapping = ({ sourceSymbol, mappedSymbol, quote, assetType, price, priceInr, currency: quoteCurrency, schemeName }) => {
    if (!mappingModalItem) return;

    const cleanMapped = String(mappedSymbol || '').trim().toUpperCase();
    const cleanSource = String(sourceSymbol || '').trim().toUpperCase();
    const numericLive = Number(priceInr || quote?.priceInr || quote?.navInr || (quote?.currency === 'INR' ? quote?.price : null) || price || quote?.price || 0);

    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId === mappingModalItem.tempId) {
          return {
            ...it,
            mappedSymbol: cleanMapped,
            priceAction: 'mapped',
            assetType: assetType || it.assetType,
            mfSchemeName: schemeName || it.mfSchemeName,
            mfSchemeCode: assetType === 'mutual_fund' ? cleanMapped : it.mfSchemeCode,
          };
        }
        return it;
      })
    );

    // Store raw numeric price in verifiedPrices so getItemPriceAnalysis can compute correctly
    setVerifiedPrices((prev) => ({
      ...prev,
      [mappingModalItem.tempId]: {
        ticker: cleanMapped,
        price: numericLive,
        numericPrice: numericLive,
        formattedPrice: quote?.formattedPrice || (numericLive > 0 ? `₹${numericLive.toFixed(2)}` : '—'),
        quote,
      },
    }));

    // Also populate livePrices state directly so all lookups find it immediately!
    if (numericLive > 0) {
      const liveEntry = {
        ...(quote || {}),
        price: quote?.price || numericLive,
        priceInr: numericLive,
        navInr: quote?.navInr || (assetType === 'mutual_fund' ? numericLive : undefined),
        currency: quoteCurrency || quote?.currency || 'INR',
      };
      setLivePrices((prev) => ({
        ...prev,
        [cleanMapped]: liveEntry,
        ...(cleanSource ? { [cleanSource]: liveEntry } : {}),
      }));
    }

    setMappingModalItem(null);
  };

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-6xl rounded-2xl border border-[var(--card-border)] bg-[var(--panel-bg)] shadow-2xl p-6 relative max-h-[92vh] flex flex-col text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[var(--text-primary)]" />
                <span>Review Before Saving</span>
              </div>
              <TierBadge tier={tier} />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
              {manualFallback ? 'Manual Entry — Extraction Failed' : 'Verify Extracted Holdings & Prices'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {manualFallback
                ? "Auto-extraction couldn't parse the screenshot. Use the raw text below as reference and add holdings manually."
                : `Extracted ${items.length} holding${items.length === 1 ? '' : 's'}. Review screenshot prices, resolve any live market mismatches, and confirm additions.`
              }
            </p>
          </div>

          {/* Header Controls: Currency Pill & Destination Wallet */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center mr-8 sm:mr-10">
            {/* Currency Preference Selector */}
            <div className="flex items-center bg-[var(--shell-bg)] p-0.5 rounded-xl border border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setCurrencyPreference('INR')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  currencyPreference === 'INR'
                    ? 'bg-[var(--seg-active-bg)] text-[var(--seg-active-text)] shadow-xs'
                    : 'text-[var(--seg-text)] hover:text-[var(--seg-active-text)]'
                }`}
                title="Format prices in Indian Rupee (₹)"
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrencyPreference('USD')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  currencyPreference === 'USD'
                    ? 'bg-[var(--seg-active-bg)] text-[var(--seg-active-text)] shadow-xs'
                    : 'text-[var(--seg-text)] hover:text-[var(--seg-active-text)]'
                }`}
                title="Format prices in US Dollar ($)"
              >
                $ USD
              </button>
            </div>

            {/* Destination Wallet Selector */}
            {wallets && wallets.length > 0 && (
              <div className="flex items-center space-x-2 bg-[var(--shell-bg)] border border-[var(--card-border)] rounded-xl px-3 py-1.5 shadow-xs">
                <Wallet className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Target Wallet
                  </span>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[var(--text-primary)] border-none outline-none cursor-pointer p-0 pr-1"
                  >
                    <option value="" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">None (Unassigned Portfolio)</option>
                    {wallets.map((w) => (
                      <option key={w._id} value={w._id} className="bg-[var(--panel-bg)] text-[var(--text-primary)]">
                        {w.name} ({w.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Permanent Bulk Price Strategy Toolbar */}
        {!manualFallback && items.length > 0 && (
          <div className="mb-2.5 p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[var(--text-primary)]">
                Bulk Price Strategy ({items.length} items):
              </span>
              <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                Set all holdings to screenshot prices or live market quotes
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleBulkSetStrategy('screenshot')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--warning-bg)] border border-[var(--warning)]/20 text-[var(--warning)] font-semibold text-xs transition cursor-pointer hover:opacity-90"
                title="Use extracted screenshot price for all holdings"
              >
                <span>🔒 All Screenshot Prices</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkSetStrategy('live')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-semibold text-xs transition cursor-pointer hover:bg-[var(--shell-bg)]"
                title="Use live API quotes for all holdings"
              >
                <span>⚡ All Live Market Prices</span>
              </button>

              <button
                type="button"
                onClick={() => fetchQuotes(items.length ? items : extractedItems)}
                disabled={loadingPrices}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] font-medium text-xs transition cursor-pointer disabled:opacity-50"
                title="Re-query live market prices from Yahoo Finance and MFapi"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPrices ? 'animate-spin' : ''}`} />
                <span>{loadingPrices ? 'Fetching...' : 'Refresh Live Prices'}</span>
              </button>

              {/* Asset-specific quick toggles */}
              {items.some((i) => i.assetType === 'stock') && (
                <div className="flex items-center pl-1.5 border-l border-[var(--divider-1)] space-x-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Stocks:</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSetStrategyByAssetType('stock', 'screenshot')}
                    className="px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
                    title="Set all stocks to Screenshot price"
                  >
                    🔒 Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetStrategyByAssetType('stock', 'live')}
                    className="px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
                    title="Set all stocks to Live Market price"
                  >
                    ⚡ Live
                  </button>
                </div>
              )}

              {items.some((i) => i.assetType === 'mutual_fund') && (
                <div className="flex items-center pl-1.5 border-l border-[var(--divider-1)] space-x-1">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">MFs:</span>
                  <button
                    type="button"
                    onClick={() => handleBulkSetStrategyByAssetType('mutual_fund', 'screenshot')}
                    className="px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
                    title="Set all mutual funds to Screenshot price"
                  >
                    🔒 Screenshot
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkSetStrategyByAssetType('mutual_fund', 'live')}
                    className="px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
                    title="Set all mutual funds to Live Market price"
                  >
                    ⚡ Live
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Smart Price Mismatch Alert Banner */}
        {hasMismatches && !manualFallback && (
          <div className="mb-3 p-3.5 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)]/20 text-[var(--warning)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Price Discrepancy Detected</span>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Some assets in your screenshot differ from online market quotes (common for wrapped, unlisted, or airdropped tokens). We defaulted to using your exact screenshot price to ensure accurate valuation.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => handleBulkSetStrategy('screenshot')}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--warning)]/30 text-[var(--warning)] font-semibold text-[11px] transition cursor-pointer hover:bg-[var(--shell-bg)]"
              >
                🔒 Lock All Screenshot Prices
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetStrategy('live')}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium text-[11px] transition cursor-pointer hover:bg-[var(--shell-bg)]"
              >
                ⚡ Use All Live Quotes
              </button>
            </div>
          </div>
        )}

        {/* Manual Fallback: Raw OCR Text Block */}
        {manualFallback && rawText && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-[var(--warning-bg)] border border-[var(--warning)]/20 text-[var(--warning)] text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>We couldn't auto-extract this screenshot. Here's the text we found — please reference it while filling in holdings below.</span>
            </div>
            <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] shadow-inner">
              <pre className="text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap break-words leading-relaxed">
                {rawText}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-[var(--negative-bg)] border border-[var(--negative)]/20 text-[var(--negative)] text-xs font-medium">
            {error}
          </div>
        )}

        {/* Review Table */}
        <div className="overflow-y-auto flex-1 my-1 border border-[var(--card-border)] rounded-xl bg-[var(--card-bg)] shadow-xs">
          <table className="w-full text-left text-xs text-[var(--text-primary)]">
            <thead className="bg-[var(--shell-bg)] sticky top-0 uppercase font-semibold text-[var(--text-muted)] border-b border-[var(--divider-1)] select-none z-10 text-[11px] tracking-wider">
              <tr>
                <th onClick={() => handleSort('assetType')} className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition group">
                  <span>Type</span>
                  {renderSortIndicator('assetType')}
                </th>
                <th onClick={() => handleSort('symbol')} className="p-3 cursor-pointer hover:text-[var(--text-primary)] transition group">
                  <span>Symbol</span>
                  {renderSortIndicator('symbol')}
                </th>
                <th onClick={() => handleSort('quantity')} className="p-3 text-right cursor-pointer hover:text-[var(--text-primary)] transition group">
                  <span>Quantity</span>
                  {renderSortIndicator('quantity')}
                </th>
                <th onClick={() => handleSort('extractedPrice')} className="p-3 text-right cursor-pointer hover:text-[var(--text-primary)] transition group">
                  <span>Screenshot Price</span>
                  {renderSortIndicator('extractedPrice')}
                </th>
                <th className="p-3 text-right">
                  <span>Live Market Price</span>
                </th>
                <th className="p-3">
                  <div className="flex items-center justify-between gap-1.5">
                    <span>Price Strategy</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBulkSetStrategy(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="text-[10px] py-0.5 px-1.5 rounded font-bold uppercase bg-[var(--shell-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] cursor-pointer outline-none"
                      title="Apply price strategy to all holdings"
                    >
                      <option value="" disabled className="bg-[var(--panel-bg)] text-[var(--text-muted)]">All ▾</option>
                      <option value="screenshot" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">All Screenshot</option>
                      <option value="live" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">All Live Quotes</option>
                    </select>
                  </div>
                </th>
                <th className="p-3 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y border-[var(--divider-2)]">
              {sortedItems.map((item) => {
                const analysis = getItemPriceAnalysis(item);
                const hasExtractedPrice = item.extractedPrice !== null && item.extractedPrice !== undefined;

                return (
                  <tr
                    key={item.tempId}
                    className={`transition hover:bg-[var(--shell-bg)] ${
                      analysis.isMismatch ? 'bg-[var(--warning-bg)]/30' : ''
                    }`}
                  >
                    {/* Asset Type Selector */}
                    <td className="p-2">
                      <select
                        value={item.assetType}
                        onChange={(e) => handleFieldChange(item.tempId, 'assetType', e.target.value)}
                        className="rounded-lg px-2 py-1 text-xs bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
                      >
                        <option value="stock" className="bg-[var(--panel-bg)]">Stock / ETF</option>
                        <option value="mutual_fund" className="bg-[var(--panel-bg)]">Mutual Fund</option>
                        <option value="crypto" className="bg-[var(--panel-bg)]">Crypto</option>
                        <option value="cash" className="bg-[var(--panel-bg)]">Cash</option>
                      </select>
                    </td>

                    {/* Symbol */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.symbol}
                        onChange={(e) => handleFieldChange(item.tempId, 'symbol', e.target.value)}
                        placeholder="BTC"
                        className="w-20 rounded-lg px-2 py-1 text-xs font-mono font-bold uppercase bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleFieldChange(item.tempId, 'quantity', e.target.value)}
                        placeholder="0.00"
                        className="w-24 rounded-lg px-2 py-1 text-xs font-mono text-right bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
                      />
                    </td>

                    {/* Extracted Screenshot Price & Total */}
                    <td className="p-2 text-right font-mono">
                      {hasExtractedPrice ? (
                        <div>
                          <span className="font-semibold text-[var(--text-primary)] block">
                            {fmtCurrency(item.extractedPrice, item)}
                          </span>
                          {item.totalValue ? (
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              Total: {fmtCurrency(item.totalValue, item)}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)] italic">—</span>
                      )}
                    </td>

                    {/* Live Market Price from API */}
                    <td className="p-2 text-right font-mono">
                      {item.assetType === 'cash' ? (
                        <span className="text-[var(--text-primary)] font-medium">
                          {currencyPreference === 'INR' ? '₹1.00' : '$1.00'}
                        </span>
                      ) : loadingPrices ? (
                        <span className="text-[var(--text-muted)] text-[11px] inline-flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin text-[var(--text-secondary)]" />
                          <span>Fetching...</span>
                        </span>
                      ) : (
                        <div>
                          <span className="text-[var(--text-primary)] font-medium block">
                            {analysis.livePrice > 0 ? (
                              fmtCurrency(analysis.livePrice, item)
                            ) : (
                              <span className="text-[var(--warning)] text-[11px]">Unlisted (0)</span>
                            )}
                          </span>
                          {analysis.isMismatch && hasExtractedPrice && (
                            <span className="text-[10px] font-semibold text-[var(--warning)] block">
                              {analysis.isUnlisted ? '⚠️ Unlisted' : `⚠️ ${analysis.diffPct.toFixed(0)}% diff`}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Price Strategy Selector & Inline Configuration */}
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        <select
                          value={item.priceAction || 'live'}
                          onChange={(e) => handleFieldChange(item.tempId, 'priceAction', e.target.value)}
                          className="rounded-lg px-2 py-1 text-xs bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] font-medium outline-none"
                        >
                          {hasExtractedPrice ? (
                            <option value="screenshot" className="bg-[var(--panel-bg)]">
                              🔒 Use Screenshot Price ({fmtCurrency(item.extractedPrice, item)})
                            </option>
                          ) : (
                            <option value="screenshot" disabled className="bg-[var(--panel-bg)]">
                              🔒 Screenshot Price (N/A)
                            </option>
                          )}
                          <option value="live" className="bg-[var(--panel-bg)]">
                            ⚡ Use Live Market Quote ({analysis.livePrice > 0 ? fmtCurrency(analysis.livePrice, item) : 'Auto'})
                          </option>
                          <option value="mapped" className="bg-[var(--panel-bg)]">
                            🔗 Map to Ticker {item.mappedSymbol ? `(${item.mappedSymbol}${analysis.livePrice > 0 ? `: ${fmtCurrency(analysis.livePrice, item)}` : ''})` : '(e.g. CANBK.NS, BTC)'}
                          </option>
                          <option value="custom" className="bg-[var(--panel-bg)]">✍️ Custom Fixed Price</option>
                        </select>

                        {/* Ticker Mapping Action with Inline Instant Verification + Advanced Modal */}
                        {item.priceAction === 'mapped' && (
                          <div className="flex flex-col gap-1 mt-0.5">
                            <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                              <span className="text-[10px] text-[var(--text-muted)]">Map to:</span>
                              <input
                                type="text"
                                value={item.mappedSymbol || ''}
                                onChange={(e) => handleFieldChange(item.tempId, 'mappedSymbol', e.target.value.toUpperCase())}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleVerifyTicker(item.tempId, item.mappedSymbol);
                                  }
                                }}
                                onBlur={() => {
                                  if (item.mappedSymbol && !verifiedPrices[item.tempId]) {
                                    handleVerifyTicker(item.tempId, item.mappedSymbol);
                                  }
                                }}
                                placeholder="CANBK.NS, BTC"
                                className="w-24 px-1.5 py-0.5 rounded text-xs uppercase font-mono font-bold border border-[var(--card-border)] bg-[var(--shell-bg)] text-[var(--text-primary)] outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleVerifyTicker(item.tempId, item.mappedSymbol || item.symbol)}
                                disabled={verifyingTicker.has(item.tempId)}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--card-bg)] hover:bg-[var(--shell-bg)] text-[var(--text-secondary)] border border-[var(--card-border)] transition cursor-pointer shrink-0 flex items-center space-x-1 disabled:opacity-50"
                                title="Fetch and verify price from live API"
                              >
                                {verifyingTicker.has(item.tempId) ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Zap className="w-2.5 h-2.5 text-[var(--text-primary)]" />
                                )}
                                <span>{verifyingTicker.has(item.tempId) ? 'Verifying...' : 'Verify Live'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setMappingModalItem(item)}
                                className="px-1.5 py-0.5 rounded text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--card-bg)] hover:bg-[var(--shell-bg)] border border-[var(--card-border)] transition cursor-pointer shrink-0"
                                title="Search mutual fund schemes and variants"
                              >
                                Search
                              </button>
                            </div>
                            {verifiedPrices[item.tempId] ? (
                              <div className="flex items-center space-x-1 text-[10px] text-[var(--positive)] font-mono font-medium">
                                <CheckCircle2 className="w-3 h-3 text-[var(--positive)] shrink-0" />
                                <span>Target: {verifiedPrices[item.tempId].ticker} ({fmtCurrency(verifiedPrices[item.tempId].numericPrice || verifiedPrices[item.tempId].price, item)})</span>
                              </div>
                            ) : item.mappedSymbol ? (
                              <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                                Target: {item.mappedSymbol} (click Verify Live or press Enter)
                              </span>
                            ) : null}
                          </div>
                        )}

                        {/* Live Price Verification UI — shown when strategy is 'live' */}
                        {item.priceAction === 'live' && (
                          <div className="mt-1 flex flex-col gap-1">
                            <div className="flex items-center space-x-1 flex-wrap gap-y-1">
                              <button
                                type="button"
                                onClick={() => handleVerifyTicker(item.tempId, item.mappedSymbol || item.symbol)}
                                disabled={verifyingTicker.has(item.tempId)}
                                className="px-2 py-1 rounded text-[10px] font-semibold bg-[var(--card-bg)] hover:bg-[var(--shell-bg)] text-[var(--text-primary)] border border-[var(--card-border)] transition cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                                title="Auto-fetch live market quote"
                              >
                                {verifyingTicker.has(item.tempId) ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Zap className="w-2.5 h-2.5" />
                                )}
                                <span>{verifyingTicker.has(item.tempId) ? 'Fetching...' : '⚡ Auto-fetch Live'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setMappingModalItem(item)}
                                className="px-2 py-1 rounded text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--card-bg)] hover:bg-[var(--shell-bg)] border border-[var(--card-border)] transition cursor-pointer flex items-center space-x-1"
                                title="Open search dialog to select specific mutual fund scheme or variant"
                              >
                                <Search className="w-2.5 h-2.5" />
                                <span>Search</span>
                              </button>
                            </div>
                            {verifiedPrices[item.tempId] && (
                              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--positive-bg)] border border-[var(--positive)]/20 text-[var(--positive)]">
                                <span>✅ {verifiedPrices[item.tempId].ticker}: {fmtCurrency(verifiedPrices[item.tempId].numericPrice || verifiedPrices[item.tempId].price, item)} — mapped!</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Inline Custom Price Input */}
                        {item.priceAction === 'custom' && (
                          <div className="flex items-center space-x-1 mt-0.5">
                            <span className="text-[10px] text-[var(--text-muted)]">{currencyPreference === 'INR' ? '₹' : '$'}</span>
                            <input
                              type="number"
                              step="any"
                              value={item.customPrice !== undefined ? item.customPrice : ''}
                              onChange={(e) => handleFieldChange(item.tempId, 'customPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-20 px-1.5 py-0.5 rounded text-xs font-mono border border-[var(--card-border)] bg-[var(--shell-bg)] text-[var(--text-primary)] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Remove Button */}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(item.tempId)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--negative)] hover:bg-[var(--negative-bg)] transition cursor-pointer"
                        title="Remove holding row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Controls */}
        <div className="pt-3 border-t border-[var(--divider-1)] flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddEmptyRow}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[var(--shell-bg)] hover:bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-xs font-medium transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[var(--text-primary)]" />
            <span>Add Row</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={saving || items.length === 0}
              className="btn-primary min-h-[38px] px-5 text-xs font-semibold rounded-xl disabled:opacity-50 transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-[var(--btn-primary-text)]" />
              <span>{saving ? 'Saving to Portfolio...' : `Confirm & Add (${items.length}) Holdings`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Live API Fetch & Mapping Modal */}
      {mappingModalItem && (
        <ApiMappingModal
          isOpen={!!mappingModalItem}
          onClose={() => setMappingModalItem(null)}
          sourceSymbol={mappingModalItem.symbol}
          sourceName={mappingModalItem.name || mappingModalItem.schemeName || ''}
          sourceAssetType={mappingModalItem.assetType || 'stock'}
          referencePrice={mappingModalItem.extractedPrice}
          currency={currencyPreference}
          onConfirmMapping={handleApplyApiMapping}
        />
      )}
    </div>
  );
};
