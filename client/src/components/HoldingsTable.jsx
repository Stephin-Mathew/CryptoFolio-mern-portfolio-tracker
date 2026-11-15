import React, { useState, useMemo } from 'react';
import {
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Coins,
  TrendingUp,
  Wallet,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Layers,
  Clock,
  Lock,
  Link2,
} from 'lucide-react';
import { PriceEditModal } from './PriceEditModal';
import { LogoPickerModal } from './LogoPickerModal';
import { AssetLogo } from './AssetLogo';
import { useCurrency } from '../context/CurrencyContext';

const ASSET_COLORS = { crypto: '#2DD4BF', stock: '#818CF8', cash: '#A3E635', mutual_fund: '#F59E0B' };

const ALLOCATION_PALETTE = [
  '#0D9488', // teal (like HYPE in reference)
  '#3B82F6', // blue (like USDC in reference)
  '#EAB308', // amber (like KNTQ in reference)
  '#EF4444', // coral red (like BNB in reference)
  '#8B5CF6', // violet (like ZRO in reference)
  '#06B6D4', // cyan (like ETH in reference)
  '#EC4899', // pink
  '#10B981', // emerald
  '#6366F1', // indigo
];

function generateSparkline(change24h = 0, change7d = 0) {
  const c24 = Number(change24h) || 0;
  const c7 = Number(change7d) || 0;
  const isFlat = Math.abs(c24) < 0.01 && Math.abs(c7) < 0.01;
  const W = 88, H = 26, padX = 4, padY = 4;

  if (isFlat) {
    return {
      points: `${padX},${(H / 2).toFixed(1)} ${(W - padX).toFixed(1)},${(H / 2).toFixed(1)}`,
      color: '#94A3B8',
      isFlat: true,
    };
  }

  // Create an illustrative 6-point 7d path
  const start = 100 / (1 + (c7 / 100));
  const p0 = start;
  const p1 = start + (100 - start) * 0.20 + (c7 >= 0 ? -1.5 : 1.5);
  const p2 = start + (100 - start) * 0.50 + (c7 >= 0 ? 2.5 : -2.5);
  const p3 = start + (100 - start) * 0.75 - (c24 * 0.15);
  const p4 = 100 - (c24 * 0.35);
  const p5 = 100;

  const rawPts = [p0, p1, p2, p3, p4, p5];
  const min = Math.min(...rawPts);
  const max = Math.max(...rawPts);
  const range = max - min || 1;

  const points = rawPts.map((v, i) => {
    const x = padX + (i / (rawPts.length - 1)) * (W - padX * 2);
    const y = padY + ((max - v) / range) * (H - padY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const isPositive = c7 >= 0;
  return {
    points,
    color: isPositive ? '#10B981' : '#EF4444',
    isFlat: false,
  };
}

export const HoldingsTable = ({
  holdings,
  prices,
  onUpdateHolding,
  onDeleteHolding,
  onEditClick,
  onUpdatePrice,
  onResetPrice,
  onUpdateLogo,
  onResetLogo,
  rowStatuses = {},
  walletType,
  hideBuyPrice: hideBuyPriceProp,
  displayCurrency = 'USD',
  showAssetBadge = false,
}) => {
  // Price Edit Modal state
  const [priceModalSymbol, setPriceModalSymbol] = useState(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  // Logo Picker Modal state: { symbol, assetType, logoUrl, isCustomLogo }
  const [logoModalAsset, setLogoModalAsset] = useState(null);

  const handleOpenPriceModal = (sym) => {
    setPriceModalSymbol(sym);
    setIsPriceModalOpen(true);
  };

  // Crypto Timeframe Filter for Period PnL: '24h' (Yesterday), '7d' (Last Week), '30d'
  const [cryptoTimeframe, setCryptoTimeframe] = useState('24h');

  // Expanded symbols state: { [symbol]: boolean }
  const [expandedSymbols, setExpandedSymbols] = useState({});

  // Inline editing cell state: { holdingId, field }
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Column sorting state
  const [sortField, setSortField] = useState('totalValue');
  const [sortDirection, setSortDirection] = useState('desc');

  const { currency = 'USD', fmt, fmtPrice, fmtDelta, rates } = useCurrency();

  const toggleExpand = (symbol) => {
    setExpandedSymbols((prev) => ({
      ...prev,
      [symbol]: !prev[symbol],
    }));
  };

  // Determine if Buy Price column should be shown
  const showBuyPrice = useMemo(() => {
    if (hideBuyPriceProp !== undefined) {
      return !hideBuyPriceProp;
    }
    if (walletType === 'crypto') {
      return false;
    }
    return holdings.some((h) => h.assetType === 'stock' || h.assetType === 'mutual_fund');
  }, [hideBuyPriceProp, walletType, holdings]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      const isNumeric = ['quantity', 'avgBuyPrice', 'livePrice', 'totalValue', 'pnl'].includes(field);
      setSortDirection(isNumeric ? 'desc' : 'asc');
    }
  };

  const getPriceInfo = (symbol, assetType) => {
    if (assetType === 'cash') {
      const isCashInr = symbol === 'INR';
      return { price: 1, change24h: 0, change7d: 0, change30d: 0, currency: isCashInr ? 'INR' : 'USD' };
    }
    const entry = prices[symbol];
    if (!entry) return { price: 0, change24h: 0, change7d: 0, change30d: 0, currency: null, priceInr: null, navInr: null };
    if (typeof entry === 'number') {
      return { price: entry, change24h: 0, change7d: 0, change30d: 0, currency: null, priceInr: null, navInr: null };
    }
    return {
      price: Number(entry.price || 0),
      priceInr: entry.priceInr !== undefined && entry.priceInr !== null ? Number(entry.priceInr) : null,
      navInr: entry.navInr !== undefined && entry.navInr !== null ? Number(entry.navInr) : null,
      currency: entry.currency || (entry.priceInr != null || entry.navInr != null ? 'INR' : null),
      change24h: Number(entry.change24h || 0),
      change7d: Number(entry.change7d || 0),
      change30d: Number(entry.change30d || 0),
      mappedSymbol: entry.mappedSymbol || null,
      isCustom: !!entry.isCustom,
      logoUrl: entry.logoUrl || null,
      isCustomLogo: !!entry.isCustomLogo,
    };
  };

  const inrRate = Number(prices.INR?.price || prices.INR?.rate || 95.7);

  const groupedHoldings = useMemo(() => {
    const map = {};

    holdings.forEach((h) => {
      const sym = (h.symbol || 'UNKNOWN').toUpperCase();
      if (!map[sym]) {
        map[sym] = {
          symbol: sym,
          assetType: h.assetType || 'crypto',
          items: [],
        };
      }
      map[sym].items.push(h);
    });

    const groups = Object.values(map).map((group) => {
      const priceInfo = getPriceInfo(group.symbol, group.assetType);
      const isINR =
        group.assetType === 'mutual_fund' ||
        group.items.some((h) => h.currency === 'INR') ||
        priceInfo.currency === 'INR' ||
        (priceInfo.priceInr !== null && priceInfo.priceInr > 0) ||
        (priceInfo.navInr !== null && priceInfo.navInr > 0) ||
        group.symbol.endsWith('.NS') ||
        group.symbol.endsWith('.BO');

      const nativeLivePrice =
        group.assetType === 'cash'
          ? (group.symbol === 'INR' && inrRate > 0 ? 1 / inrRate : 1)
          : isINR
            ? (priceInfo.priceInr ?? priceInfo.navInr ?? (priceInfo.price > 0 ? priceInfo.price * inrRate : 0))
            : priceInfo.price;
      const livePrice = nativeLivePrice > 0 ? nativeLivePrice : (group.items[0]?.avgBuyPrice || 0);

      let totalQuantity = 0;
      let totalStockCost = 0;

      group.items.forEach((h) => {
        const qty = Number(h.quantity) || 0;
        totalQuantity += qty;
        if (group.assetType === 'stock' || group.assetType === 'mutual_fund') {
          totalStockCost += qty * (Number(h.avgBuyPrice) || 0);
        }
      });

      const weightedAvgBuyPrice =
        (group.assetType === 'stock' || group.assetType === 'mutual_fund') && totalQuantity > 0
          ? totalStockCost / totalQuantity
          : null;
      const totalValue = totalQuantity * livePrice;

      let pnl = 0;
      let pnlPercent = 0;

      if (group.assetType === 'stock' || group.assetType === 'mutual_fund') {
        pnl = totalValue - totalStockCost;
        pnlPercent = totalStockCost > 0 ? (pnl / totalStockCost) * 100 : 0;
      } else if (group.assetType === 'crypto') {
        const changePct =
          cryptoTimeframe === '7d'
            ? priceInfo.change7d
            : cryptoTimeframe === '30d'
              ? priceInfo.change30d
              : priceInfo.change24h;

        const startPrice = livePrice / (1 + changePct / 100);
        pnl = totalQuantity * (livePrice - startPrice);
        pnlPercent = changePct;
      }

      // Normalized USD values for multi-currency formatting
      const usdLivePrice = isINR && inrRate > 0 ? livePrice / inrRate : livePrice;
      const usdBuyPrice = isINR && inrRate > 0 && weightedAvgBuyPrice !== null ? weightedAvgBuyPrice / inrRate : weightedAvgBuyPrice;
      const usdTotalValue = isINR && inrRate > 0 ? totalValue / inrRate : totalValue;
      const usdPnl = isINR && inrRate > 0 ? pnl / inrRate : pnl;

      return {
        ...group,
        isINR,
        totalQuantity,
        weightedAvgBuyPrice,
        livePrice,
        priceInfo,
        totalValue,
        totalCost: totalStockCost,
        pnl,
        pnlPercent,
        usdLivePrice,
        usdBuyPrice,
        usdTotalValue,
        usdPnl,
        displayLivePrice: usdLivePrice,
        displayBuyPrice: usdBuyPrice,
        displayTotalValue: usdTotalValue,
        displayPnl: usdPnl,
      };
    });

    return groups.sort((a, b) => {
      if (!sortField) return 0;

      const fieldMap = {
        totalValue: 'usdTotalValue',
        pnl: 'usdPnl',
        livePrice: 'usdLivePrice',
        avgBuyPrice: 'usdBuyPrice',
        quantity: 'totalQuantity',
      };
      const field = fieldMap[sortField] || sortField;

      let valA = a[field];
      let valB = b[field];

      if (['symbol', 'assetType'].includes(sortField)) {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [holdings, prices, sortField, sortDirection, cryptoTimeframe, inrRate]);

  const totalPortfolioDisplayValue = useMemo(() => {
    return groupedHoldings.reduce((sum, g) => sum + (g.usdTotalValue || 0), 0);
  }, [groupedHoldings]);

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 ml-1 inline text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition" />
      );
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 ml-1 inline text-cyan-600 dark:text-cyan-400 font-bold" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1 inline text-cyan-600 dark:text-cyan-400 font-bold" />
    );
  };

  const handleCellClick = (holding, field, currentValue) => {
    if (field === 'avgBuyPrice' && holding.assetType !== 'stock' && holding.assetType !== 'mutual_fund') {
      return;
    }
    setEditingCell({ id: holding._id, field });
    setEditValue(currentValue !== undefined && currentValue !== null ? String(currentValue) : '');
  };

  const handleCellSave = async (holding, field) => {
    if (!editingCell) return;
    let newValue = editValue.trim();
    if (field === 'symbol') newValue = newValue.toUpperCase();

    setEditingCell(null);

    const originalValue = String(holding[field] || '');
    if (newValue !== originalValue) {
      onUpdateHolding(holding._id, { [field]: newValue });
    }
  };

  const handleKeyDown = (e, holding, field) => {
    if (e.key === 'Enter') {
      handleCellSave(holding, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const formatUSD = (num) => {
    const n = Number(num) || 0;
    if (n !== 0 && Math.abs(n) < 0.01) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(n);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const formatINR = (num) => {
    const n = Number(num) || 0;
    if (n !== 0 && Math.abs(n) < 0.01) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(n);
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  const formatDisplay = (num) => {
    return fmt(num);
  };

  const formatNative = (num, isINR) => {
    return isINR ? formatINR(num) : formatUSD(num);
  };

  const formatQty = (num) => {
    const n = Number(num) || 0;
    if (n === 0) return '0';
    if (Math.abs(n) < 0.0001) return n.toFixed(8).replace(/\.?0+$/, '');
    if (Math.abs(n) < 1) return n.toFixed(6).replace(/\.?0+$/, '');
    if (Math.abs(n) < 1000) return n.toFixed(4).replace(/\.?0+$/, '');
    return n.toFixed(2).replace(/\.?0+$/, '');
  };

  const getAssetBadge = (type) => {
    switch (type) {
      case 'crypto':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Coins className="w-2.5 h-2.5 mr-1" />
            Crypto
          </span>
        );
      case 'stock':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-2.5 h-2.5 mr-1" />
            Stock
          </span>
        );
      case 'mutual_fund':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Layers className="w-2.5 h-2.5 mr-1" />
            MF
          </span>
        );
      case 'cash':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Wallet className="w-2.5 h-2.5 mr-1" />
            Cash
          </span>
        );
      default:
        return null;
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="rounded-2xl p-8 text-center border border-[var(--card-border)] bg-[var(--card-bg)]">
        <div className="w-12 h-12 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
          <Coins className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">No Holdings Recorded</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          No assets in this category. Click Add Asset to add your first position.
        </p>
      </div>
    );
  }

  const getTimeframeLabel = () => {
    if (cryptoTimeframe === '7d') return '7D';
    if (cryptoTimeframe === '30d') return '30D';
    return '24H';
  };

  return (
    <div className="rounded-xl overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs">
      {/* Top Bar with PnL Basis Selector */}
      <div className="px-3.5 py-2.5 border-b border-[var(--divider-1)] flex flex-wrap items-center justify-between gap-2.5 bg-[var(--card-bg)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Holdings
          </span>
          <span className="chip chip-neutral text-[11px] font-semibold">
            {groupedHoldings.length} {groupedHoldings.length === 1 ? 'asset' : 'assets'}
          </span>
          <span className="chip chip-neutral text-[11px] font-semibold">
            {currency === 'INR' ? '₹ INR Mode' : currency === 'BTC' ? '₿ BTC Mode' : currency === 'HYPE' ? '⚡ HYPE Mode' : '$ USD Mode'}
          </span>
        </div>

        {/* Crypto Timeframe Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
            <Clock size={13} className="text-cyan-600 dark:text-cyan-400" />
            <span>P&L Basis:</span>
          </span>
          <div className="seg seg-sm" style={{ padding: 2 }}>
            {[
              { id: '24h', label: '24H' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setCryptoTimeframe(tf.id)}
                className={`seg-btn ${cryptoTimeframe === tf.id ? 'active' : ''}`}
                style={{ minHeight: 26, padding: '0 9px', fontSize: 11 }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop View (Compact, Proportional Table) ────────────── */}
      <div className="hidden md:block overflow-x-auto" style={{ maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full text-left text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '64px' }} />
          </colgroup>
          <thead className="bg-[var(--shell-bg)] text-[10px] uppercase font-semibold text-[var(--text-muted)] border-b border-[var(--divider-1)] select-none" style={{ letterSpacing: '0.08em' }}>
            <tr>
              <th
                onClick={() => handleSort('symbol')}
                className="py-2.5 px-4 cursor-pointer hover:text-[var(--text-primary)] transition group"
              >
                <span>Asset · Quantity</span>
                {renderSortIndicator('symbol')}
              </th>

              <th
                onClick={() => handleSort('livePrice')}
                className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition group"
              >
                <span>Price</span>
                {renderSortIndicator('livePrice')}
              </th>

              <th
                onClick={() => handleSort('totalValue')}
                className="py-2.5 px-3 cursor-pointer hover:text-[var(--text-primary)] transition group"
              >
                <span>Value · P&L</span>
                {renderSortIndicator('totalValue')}
              </th>

              <th className="py-2.5 px-3">
                <span>Allocation</span>
              </th>

              <th className="py-2.5 px-3" style={{ width: 100 }}>
                <span>7D Trend</span>
              </th>

              <th className="py-2.5 px-3 text-right" style={{ width: 64 }}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--divider-2)]">
            {groupedHoldings.map((group, idx) => {
              const hasMultiple = group.items.length > 1;
              const isExpanded = !!expandedSymbols[group.symbol];
              const isProfit = group.usdPnl >= 0;
              const barColor = ALLOCATION_PALETTE[idx % ALLOCATION_PALETTE.length];
              const allocPct = totalPortfolioDisplayValue > 0 ? (group.usdTotalValue / totalPortfolioDisplayValue * 100) : 0;
              const spark = generateSparkline(
                group.priceInfo?.change24h || 0,
                group.priceInfo?.change7d || 0
              );

              // Single item row
              if (!hasMultiple) {
                const h = group.items[0];
                const priceInfo = group.priceInfo;
                const rowStatus = rowStatuses[h._id];
                const changePct = Number(group.priceInfo?.change24h || 0);
                const changePctPositive = changePct >= 0;
                const schemeDisplayName = h.mfSchemeName || priceInfo?.schemeName;

                return (
                  <tr key={h._id} className="hover:bg-[var(--shell-bg)] transition-colors group">
                    {/* ASSET · QUANTITY */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* Asset logo or letter avatar */}
                        <div
                          onClick={() =>
                            onUpdateLogo &&
                            setLogoModalAsset({
                              symbol: h.symbol,
                              assetType: h.assetType,
                              logoUrl: priceInfo?.logoUrl,
                              isCustomLogo: !!priceInfo?.isCustomLogo,
                            })
                          }
                          className={onUpdateLogo ? 'cursor-pointer hover:opacity-85 hover:scale-105 transition-transform' : ''}
                          title={onUpdateLogo ? 'Click to change or customize logo' : ''}
                        >
                          <AssetLogo
                            symbol={h.symbol}
                            assetType={h.assetType}
                            customUrl={priceInfo?.logoUrl}
                            size={36}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {editingCell?.id === h._id && editingCell?.field === 'symbol' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellSave(h, 'symbol')}
                                onKeyDown={(e) => handleKeyDown(e, h, 'symbol')}
                                autoFocus
                                className="w-20 px-2 py-0.5 rounded bg-[var(--shell-bg)] border border-[var(--btn-primary-bg)] text-xs font-semibold uppercase"
                              />
                            ) : (
                              <span
                                onClick={() => handleCellClick(h, 'symbol', h.symbol)}
                                className="cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                                title="Click to edit symbol"
                                style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}
                              >
                                {schemeDisplayName || h.symbol}
                              </span>
                            )}
                            {showAssetBadge && getAssetBadge(h.assetType)}
                            {rowStatus === 'saving' && <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />}
                            {rowStatus === 'error' && <AlertCircle className="w-3 h-3 text-rose-500" />}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                            {editingCell?.id === h._id && editingCell?.field === 'quantity' ? (
                              <input
                                type="number" step="any"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellSave(h, 'quantity')}
                                onKeyDown={(e) => handleKeyDown(e, h, 'quantity')}
                                autoFocus
                                className="w-20 px-1.5 py-0.5 rounded bg-[var(--shell-bg)] border border-[var(--btn-primary-bg)] text-xs"
                              />
                            ) : (
                              <span
                                onClick={() => handleCellClick(h, 'quantity', h.quantity)}
                                className="cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                                title="Click to edit quantity"
                              >
                                {formatQty(h.quantity)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="py-3.5 px-3">
                      <div>
                        {h.assetType === 'cash' ? (
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtPrice(group.usdLivePrice)}
                          </div>
                        ) : (
                          <>
                            <div
                              onClick={() => onUpdatePrice && handleOpenPriceModal(h.symbol)}
                              className={onUpdatePrice ? 'cursor-pointer' : ''}
                              title={priceInfo?.isCustom ? 'Custom locked price' : priceInfo?.mappedSymbol ? `Mapped: ${priceInfo.mappedSymbol}` : 'Click to edit price'}
                              style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                            >
                              {fmtPrice(group.usdLivePrice)}
                              {priceInfo?.mappedSymbol && (
                                <Link2 size={9} className="inline ml-1 text-indigo-500 opacity-60" />
                              )}
                              {priceInfo?.isCustom && (
                                <Lock size={9} className="inline ml-1 text-amber-500 opacity-60" />
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                marginTop: 2,
                                fontVariantNumeric: 'tabular-nums',
                                color: changePct === 0 ? 'var(--text-muted)' : changePctPositive ? 'var(--positive, #10B981)' : 'var(--negative, #EF4444)',
                              }}
                            >
                              {changePctPositive && changePct !== 0 ? '+' : ''}{changePct.toFixed(2)}% (24h)
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* VALUE · P&L */}
                    <td className="py-3.5 px-3">
                      <div>
                        <div
                          style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {fmt(group.usdTotalValue)}
                        </div>
                        {h.assetType !== 'cash' ? (
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              marginTop: 2,
                              fontVariantNumeric: 'tabular-nums',
                              color: Math.abs(group.usdPnl) < 0.005 ? 'var(--text-muted)' : isProfit ? 'var(--positive, #10B981)' : 'var(--negative, #EF4444)',
                            }}
                          >
                            {fmtDelta(group.usdPnl)}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, marginTop: 2, color: 'var(--text-muted)' }}>—</div>
                        )}
                      </div>
                    </td>

                    {/* ALLOCATION */}
                    <td className="py-3.5 px-3">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 60, maxWidth: 130 }}>
                          <div style={{ height: 7, borderRadius: 9999, background: 'var(--wallet-track, #F1F5F9)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(allocPct, 100)}%`,
                                borderRadius: 9999,
                                background: barColor,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'left' }}>
                          {allocPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* 7D TREND */}
                    <td className="py-3.5 px-3">
                      <svg width="88" height="26" viewBox="0 0 88 26" fill="none" style={{ display: 'block' }}>
                        <polyline
                          points={spark.points}
                          stroke={spark.color}
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEditClick(h)}
                          title="Edit Details"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] border border-[var(--card-border)] hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteHolding(h)}
                          title="Delete Holding"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-[var(--card-border)] hover:border-rose-500/30 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Multiple entries of the SAME coin (splits)
              return (
                <React.Fragment key={group.symbol}>
                  {/* Aggregated Main Symbol Row */}
                  <tr
                    onClick={() => toggleExpand(group.symbol)}
                    className="hover:bg-[var(--shell-bg)] transition-colors cursor-pointer group bg-[var(--card-bg)]"
                  >
                    {/* ASSET · QUANTITY */}
                    <td className="py-3.5 px-4 text-[var(--text-primary)] font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={(e) => {
                            if (onUpdateLogo) {
                              e.stopPropagation();
                              setLogoModalAsset({
                                symbol: group.symbol,
                                assetType: group.assetType,
                                logoUrl: group.priceInfo?.logoUrl,
                                isCustomLogo: !!group.priceInfo?.isCustomLogo,
                              });
                            }
                          }}
                          className={onUpdateLogo ? 'cursor-pointer hover:opacity-85 hover:scale-105 transition-transform' : ''}
                          title={onUpdateLogo ? 'Click to change or customize logo' : ''}
                        >
                          <AssetLogo
                            symbol={group.symbol}
                            assetType={group.assetType}
                            customUrl={group.priceInfo?.logoUrl}
                            size={36}
                          >
                            <ChevronRight
                              size={10}
                              style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                background: 'var(--card-bg)',
                                borderRadius: '50%',
                                transition: 'transform 0.2s',
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                color: 'var(--text-muted)',
                              }}
                            />
                          </AssetLogo>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="flex items-center gap-1.5">
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                              {group.symbol}
                            </span>
                            {showAssetBadge && getAssetBadge(group.assetType)}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                            {formatQty(group.totalQuantity)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PRICE */}
                    <td className="py-3.5 px-3">
                      {group.assetType === 'cash' ? (
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          {fmtPrice(group.usdLivePrice)}
                        </div>
                      ) : (
                        <div
                          onClick={(e) => { e.stopPropagation(); onUpdatePrice && handleOpenPriceModal(group.symbol); }}
                          className={onUpdatePrice ? 'cursor-pointer' : ''}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtPrice(group.usdLivePrice)}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              marginTop: 2,
                              fontVariantNumeric: 'tabular-nums',
                              color: (group.priceInfo?.change24h || 0) === 0 ? 'var(--text-muted)' : (group.priceInfo?.change24h || 0) >= 0 ? 'var(--positive, #10B981)' : 'var(--negative, #EF4444)',
                            }}
                          >
                            {(group.priceInfo?.change24h || 0) >= 0 ? '+' : ''}{(group.priceInfo?.change24h || 0).toFixed(2)}% (24h)
                          </div>
                        </div>
                      )}
                    </td>

                    {/* VALUE · P&L */}
                    <td className="py-3.5 px-3">
                      <div>
                        <div
                          style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {fmt(group.usdTotalValue)}
                        </div>
                        {group.assetType !== 'cash' ? (
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              marginTop: 2,
                              fontVariantNumeric: 'tabular-nums',
                              color: Math.abs(group.usdPnl) < 0.005 ? 'var(--text-muted)' : isProfit ? 'var(--positive, #10B981)' : 'var(--negative, #EF4444)',
                            }}
                          >
                            {fmtDelta(group.usdPnl)}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, marginTop: 2, color: 'var(--text-muted)' }}>—</div>
                        )}
                      </div>
                    </td>

                    {/* ALLOCATION */}
                    <td className="py-3.5 px-3">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 60, maxWidth: 130 }}>
                          <div style={{ height: 7, borderRadius: 9999, background: 'var(--wallet-track, #F1F5F9)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(allocPct, 100)}%`,
                                borderRadius: 9999,
                                background: barColor,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'left' }}>
                          {allocPct.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* 7D TREND */}
                    <td className="py-3.5 px-3">
                      <svg width="88" height="26" viewBox="0 0 88 26" fill="none" style={{ display: 'block' }}>
                        <polyline
                          points={spark.points}
                          stroke={spark.color}
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>

                    {/* Actions (empty for split rows — expand chevron is in avatar) */}
                    <td className="py-3.5 px-3 text-right" style={{ width: 64 }}></td>
                  </tr>

                  {/* Expanded Accordion Sub-Table Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="p-0 bg-[var(--shell-bg)] border-y border-[var(--divider-1)]">
                        <div className="py-3 px-6 space-y-2">
                          <div className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <Layers size={13} />
                            <span>Split Positions ({group.items.length})</span>
                          </div>

                          <table className="w-full text-xs text-left rounded-lg overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xs">
                            <thead className="bg-[var(--shell-bg)] text-[10px] uppercase font-semibold text-[var(--text-muted)] border-b border-[var(--divider-1)]">
                              <tr>
                                <th className="py-2 px-3">Entry</th>
                                <th className="py-2 px-3 text-right">Quantity (% Share)</th>
                                {showBuyPrice && (group.assetType === 'stock' || group.assetType === 'mutual_fund') && (
                                  <th className="py-2 px-3 text-right">Buy Price</th>
                                )}
                                <th className="py-2 px-3 text-right">Value</th>
                                <th className="py-2 px-3 text-right">P&L ({getTimeframeLabel()})</th>
                                <th className="py-2 px-3 text-right w-[60px]">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--divider-2)]">
                              {group.items.map((subItem, index) => {
                                const subCurrentPrice =
                                  subItem.assetType === 'cash'
                                    ? 1
                                    : group.livePrice > 0
                                      ? group.livePrice
                                      : (subItem.avgBuyPrice || 0);

                                const subVal = subItem.quantity * subCurrentPrice;
                                let subPnL = 0;
                                let subPnLPct = 0;

                                if (subItem.assetType === 'stock' || subItem.assetType === 'mutual_fund') {
                                  const subCost = subItem.quantity * (subItem.avgBuyPrice || 0);
                                  subPnL = subVal - subCost;
                                  subPnLPct = subCost > 0 ? (subPnL / subCost) * 100 : 0;
                                } else if (subItem.assetType === 'crypto') {
                                  const changePct =
                                    cryptoTimeframe === '7d'
                                      ? group.priceInfo?.change7d || 0
                                      : cryptoTimeframe === '30d'
                                        ? group.priceInfo?.change30d || 0
                                        : group.priceInfo?.change24h || 0;

                                  const startPrice = subCurrentPrice / (1 + changePct / 100);
                                  subPnL = subItem.quantity * (subCurrentPrice - startPrice);
                                  subPnLPct = changePct;
                                }

                                const subIsProfit = subPnL >= 0;
                                const pctShare = group.totalQuantity > 0 ? ((subItem.quantity / group.totalQuantity) * 100).toFixed(1) : '0';

                                const subUsdVal = group.isINR && inrRate > 0 ? subVal / inrRate : subVal;
                                const subUsdPnL = group.isINR && inrRate > 0 ? subPnL / inrRate : subPnL;
                                let subUsdBuyPrice = subItem.avgBuyPrice !== undefined && subItem.avgBuyPrice !== null ? Number(subItem.avgBuyPrice) : null;
                                if (subUsdBuyPrice !== null && group.isINR && inrRate > 0) subUsdBuyPrice /= inrRate;

                                const subDisplayVal = subUsdVal;
                                const subDisplayPnL = subUsdPnL;
                                const subDisplayBuyPrice = subUsdBuyPrice;

                                return (
                                  <tr key={subItem._id} className="hover:bg-[var(--shell-bg)] transition-colors">
                                    <td className="py-2 px-3 font-medium text-[var(--text-primary)]">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[var(--shell-bg)] text-[var(--text-muted)] border border-[var(--card-border)] font-medium">
                                          #{index + 1}
                                        </span>
                                        {subItem.walletOrAccount && (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                            {subItem.walletOrAccount}
                                          </span>
                                        )}
                                        {subItem.notes && (
                                          <span className="text-[11px] text-[var(--text-muted)] italic truncate max-w-xs">
                                            {subItem.notes}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="py-2 px-3 text-right font-medium tabular-nums text-[var(--text-primary)]">
                                      {editingCell?.id === subItem._id && editingCell?.field === 'quantity' ? (
                                        <input
                                          type="number"
                                          step="any"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onBlur={() => handleCellSave(subItem, 'quantity')}
                                          onKeyDown={(e) => handleKeyDown(e, subItem, 'quantity')}
                                          autoFocus
                                          className="w-20 px-1.5 py-0.5 rounded bg-[var(--shell-bg)] border border-[var(--btn-primary-bg)] text-right text-xs"
                                        />
                                      ) : (
                                        <div
                                          onClick={() => handleCellClick(subItem, 'quantity', subItem.quantity)}
                                          className="inline-flex items-center space-x-1 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition"
                                          title="Click to edit split quantity"
                                        >
                                          <span>{formatQty(subItem.quantity)}</span>
                                          <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium">
                                            {pctShare}%
                                          </span>
                                        </div>
                                      )}
                                    </td>

                                    {showBuyPrice && (group.assetType === 'stock' || group.assetType === 'mutual_fund') && (
                                      <td className="py-2 px-3 text-right tabular-nums text-[var(--text-secondary)]">
                                        {editingCell?.id === subItem._id && editingCell?.field === 'avgBuyPrice' ? (
                                          <input
                                            type="number"
                                            step="any"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => handleCellSave(subItem, 'avgBuyPrice')}
                                            onKeyDown={(e) => handleKeyDown(e, subItem, 'avgBuyPrice')}
                                            autoFocus
                                            className="w-20 px-1.5 py-0.5 rounded bg-[var(--shell-bg)] border border-[var(--btn-primary-bg)] text-right text-xs"
                                          />
                                        ) : (
                                          <span
                                            onClick={() => handleCellClick(subItem, 'avgBuyPrice', subItem.avgBuyPrice)}
                                            className="cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 transition px-1 py-0.5 rounded hover:bg-[var(--divider-2)]"
                                            title="Click to edit buy price"
                                          >
                                            {formatDisplay(subDisplayBuyPrice)}
                                          </span>
                                        )}
                                      </td>
                                    )}

                                    <td className="py-2 px-3 text-right tabular-nums font-semibold text-[var(--text-primary)]">
                                      {formatDisplay(subDisplayVal)}
                                    </td>

                                    <td className="py-2 px-3 text-right tabular-nums">
                                      <span
                                        className="font-semibold"
                                        style={{ color: subIsProfit ? 'var(--positive)' : 'var(--negative)' }}
                                      >
                                        {subIsProfit ? '+' : ''}
                                        {formatDisplay(subDisplayPnL)} ({subIsProfit ? '+' : ''}
                                        {subPnLPct.toFixed(1)}%)
                                      </span>
                                    </td>

                                    <td className="py-2 px-3 text-right">
                                      <div className="flex items-center justify-end space-x-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEditClick(subItem);
                                          }}
                                          title="Edit"
                                          className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
                                        >
                                          <Edit2 size={11} />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteHolding(subItem);
                                          }}
                                          title="Delete"
                                          className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile View (Compact Responsive Card List) ────────────── */}
      <div className="block md:hidden p-3 space-y-2.5">
        {groupedHoldings.map((group) => {
          const hasMultiple = group.items.length > 1;
          const isExpanded = !!expandedSymbols[group.symbol];
          const isProfit = group.pnl >= 0;

          // Mobile Single Item Card
          if (!hasMultiple) {
            const h = group.items[0];
            const rowStatus = rowStatuses[h._id];

            return (
              <div
                key={h._id}
                className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xs flex flex-col gap-2"
              >
                {/* Header: Symbol + Live Price & 24h PnL */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      onClick={(e) => {
                        if (onUpdateLogo) {
                          e.stopPropagation();
                          setLogoModalAsset({
                            symbol: h.symbol,
                            assetType: h.assetType,
                            logoUrl: group.priceInfo?.logoUrl,
                            isCustomLogo: !!group.priceInfo?.isCustomLogo,
                          });
                        }
                      }}
                      className={onUpdateLogo ? 'cursor-pointer hover:opacity-85' : ''}
                      title={onUpdateLogo ? 'Click to change logo' : ''}
                    >
                      <AssetLogo symbol={h.symbol} assetType={h.assetType} customUrl={group.priceInfo?.logoUrl} size={20} />
                    </div>
                    <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">
                      {h.symbol}
                    </span>
                    {h.walletOrAccount && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {h.walletOrAccount}
                      </span>
                    )}
                    {rowStatus === 'saving' && (
                      <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onUpdatePrice && handleOpenPriceModal(h.symbol)}
                      className="tabular-nums text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {formatDisplay(group.displayLivePrice)}
                    </button>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isProfit ? 'chip-positive' : 'chip-negative'
                        }`}
                    >
                      {isProfit ? '+' : ''}{group.pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-lg bg-[var(--shell-bg)] border border-[var(--divider-2)] text-xs tabular-nums">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Quantity</div>
                    <div className="font-semibold text-[var(--text-primary)] truncate mt-0.5">{formatQty(h.quantity)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Value</div>
                    <div className="font-bold text-[var(--text-primary)] truncate mt-0.5">{formatDisplay(group.displayTotalValue)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">P&L</div>
                    <div
                      className="font-semibold truncate mt-0.5"
                      style={{ color: isProfit ? 'var(--positive)' : 'var(--negative)' }}
                    >
                      {isProfit ? '+' : ''}{formatDisplay(group.displayPnl)}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-[var(--divider-2)]">
                  <div className="text-[11px] text-[var(--text-muted)] tabular-nums">
                    {showBuyPrice && group.displayBuyPrice !== null && (
                      <span>Avg: {formatDisplay(group.displayBuyPrice)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditClick(h)}
                      className="px-2 py-1 rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--shell-bg)] border border-[var(--card-border)] transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => onDeleteHolding(h)}
                      className="px-2 py-1 rounded-md text-xs font-medium text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Mobile Multi-Split Card
          return (
            <div
              key={group.symbol}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-2xs"
            >
              <div
                onClick={() => toggleExpand(group.symbol)}
                className="p-3 flex flex-col gap-2 cursor-pointer select-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      size={14}
                      className={`text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-90 text-cyan-600 dark:text-cyan-400' : ''
                        }`}
                    />
                    <div
                      onClick={(e) => {
                        if (onUpdateLogo) {
                          e.stopPropagation();
                          setLogoModalAsset({
                            symbol: group.symbol,
                            assetType: group.assetType,
                            logoUrl: group.priceInfo?.logoUrl,
                            isCustomLogo: !!group.priceInfo?.isCustomLogo,
                          });
                        }
                      }}
                      className={onUpdateLogo ? 'cursor-pointer hover:opacity-85' : ''}
                      title={onUpdateLogo ? 'Click to change logo' : ''}
                    >
                      <AssetLogo symbol={group.symbol} assetType={group.assetType} customUrl={group.priceInfo?.logoUrl} size={20} />
                    </div>
                    <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight">
                      {group.symbol}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdatePrice && handleOpenPriceModal(group.symbol);
                      }}
                      className="tabular-nums text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {formatDisplay(group.displayLivePrice)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isProfit ? 'chip-positive' : 'chip-negative'
                        }`}
                    >
                      {isProfit ? '+' : ''}{group.pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-lg bg-[var(--shell-bg)] border border-[var(--divider-2)] text-xs tabular-nums">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total Qty</div>
                    <div className="font-semibold text-[var(--text-primary)] truncate mt-0.5">{formatQty(group.totalQuantity)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total Value</div>
                    <div className="font-bold text-[var(--text-primary)] truncate mt-0.5">{formatDisplay(group.displayTotalValue)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">P&L</div>
                    <div
                      className="font-semibold truncate mt-0.5"
                      style={{ color: isProfit ? 'var(--positive)' : 'var(--negative)' }}
                    >
                      {isProfit ? '+' : ''}{formatDisplay(group.displayPnl)}
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-2.5 bg-[var(--shell-bg)] border-t border-[var(--divider-2)] space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 px-1">
                    Split Entries ({group.items.length})
                  </div>
                  {group.items.map((subItem, index) => {
                    const subCurrentPrice =
                      subItem.assetType === 'cash'
                        ? 1
                        : group.livePrice > 0
                          ? group.livePrice
                          : (subItem.avgBuyPrice || 0);

                    const subVal = subItem.quantity * subCurrentPrice;
                    let subPnL = 0;
                    if (subItem.assetType === 'stock' || subItem.assetType === 'mutual_fund') {
                      const subCost = subItem.quantity * (subItem.avgBuyPrice || 0);
                      subPnL = subVal - subCost;
                    } else if (subItem.assetType === 'crypto') {
                      const changePct =
                        cryptoTimeframe === '7d'
                          ? group.priceInfo?.change7d || 0
                          : cryptoTimeframe === '30d'
                            ? group.priceInfo?.change30d || 0
                            : group.priceInfo?.change24h || 0;
                      const startPrice = subCurrentPrice / (1 + changePct / 100);
                      subPnL = subItem.quantity * (subCurrentPrice - startPrice);
                    }
                    const subIsProfit = subPnL >= 0;
                    const pctShare = group.totalQuantity > 0 ? ((subItem.quantity / group.totalQuantity) * 100).toFixed(1) : '0';

                    const subUsdVal = group.isINR && inrRate > 0 ? subVal / inrRate : subVal;
                    const subUsdPnL = group.isINR && inrRate > 0 ? subPnL / inrRate : subPnL;
                    const subDisplayVal = subUsdVal;
                    const subDisplayPnL = subUsdPnL;

                    return (
                      <div
                        key={subItem._id}
                        className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 tabular-nums">
                            <span className="text-[10px] px-1 py-0.2 rounded bg-[var(--shell-bg)] text-[var(--text-muted)]">
                              #{index + 1}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">{formatQty(subItem.quantity)}</span>
                            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">({pctShare}%)</span>
                          </div>
                          <div className="text-[11px] tabular-nums text-[var(--text-muted)] mt-0.5">
                            {formatDisplay(subDisplayVal)} · <span style={{ color: subIsProfit ? 'var(--positive)' : 'var(--negative)' }}>
                              {subIsProfit ? '+' : ''}{formatDisplay(subDisplayPnL)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditClick(subItem)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => onDeleteHolding(subItem)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Price Override Modal */}
      <PriceEditModal
        isOpen={isPriceModalOpen}
        onClose={() => {
          setIsPriceModalOpen(false);
          setPriceModalSymbol(null);
        }}
        symbol={priceModalSymbol}
        currentPriceInfo={
          priceModalSymbol
            ? (typeof prices[priceModalSymbol] === 'object' && prices[priceModalSymbol] !== null
              ? prices[priceModalSymbol]
              : { price: Number(prices[priceModalSymbol]) || 0 })
            : {}
        }
        onSavePrice={onUpdatePrice}
        onResetPrice={onResetPrice}
      />

      {/* Logo Picker Modal */}
      <LogoPickerModal
        isOpen={!!logoModalAsset}
        onClose={() => setLogoModalAsset(null)}
        symbol={logoModalAsset?.symbol || ''}
        assetType={logoModalAsset?.assetType || 'crypto'}
        currentLogoUrl={logoModalAsset?.logoUrl || null}
        isCustomLogo={!!logoModalAsset?.isCustomLogo}
        onSaveLogo={onUpdateLogo}
        onResetLogo={onResetLogo}
      />
    </div>
  );
};
