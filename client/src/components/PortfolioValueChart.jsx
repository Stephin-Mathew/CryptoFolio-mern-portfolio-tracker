import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Brush, Legend,
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { formatAxisLabel } from '../utils/format';
import { computePortfolio } from '../utils/portfolioMetrics';
import api from '../api/axiosInstance';
import { RefreshCw, X, ExternalLink, ArrowRightLeft } from 'lucide-react';

const RANGES = [
  { id: '24h', label: '1D' },
  { id: '7d',  label: '1W' },
  { id: '30d', label: '1M' },
  { id: '90d', label: '3M' },
  { id: '1y',  label: '1Y' },
  { id: 'all', label: 'All' },
];

const ASSET_COLORS = {
  crypto:      '#6366F1',
  stock:       '#10B981',
  mutual_fund: '#F59E0B',
  cash:        '#94A3B8',
};

// Transaction marker colour by type
const TX_COLORS = {
  buy:          '#3DD68C',
  deposit:      '#3DD68C',
  transfer_in:  '#6366F1',
  long:         '#3DD68C',
  sell:         '#FF6B73',
  withdrawal:   '#FF6B73',
  transfer_out: '#FF6B73',
  short:        '#FF6B73',
  swap:         '#F59E0B',
  note:         '#94A3B8',
};

function txMarkerColor(type) {
  return TX_COLORS[type] || '#94A3B8';
}

function formatXTick(ts, rangeId) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  if (rangeId === '24h') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (rangeId === '1y' || rangeId === 'all') {
    return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatTooltipDate(ts, rangeId) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  if (rangeId === '24h') {
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Convert a USD value to display-currency value */
function toDisplay(usd, currency, rates) {
  switch (currency) {
    case 'INR':  return (usd || 0) * (rates.inrRate  || 95.7);
    case 'BTC':  return rates.btcPrice  > 0 ? (usd || 0) / rates.btcPrice  : 0;
    case 'HYPE': return rates.hypePrice > 0 ? (usd || 0) / rates.hypePrice : 0;
    default:     return (usd || 0);
  }
}

/** Custom dot rendered for transaction markers */
function TransactionDot(props) {
  const { cx, cy, payload, onSelectTx } = props;
  if (!cx || !cy || !payload?._txList || payload._txList.length === 0) return null;

  const txList = payload._txList;
  const primaryColor = txMarkerColor(txList[0].type);
  const count = txList.length;

  return (
    <g
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
      onClick={(e) => {
        e.stopPropagation();
        if (onSelectTx) onSelectTx(txList);
      }}
    >
      {/* Outer pulse glow */}
      <circle
        cx={cx}
        cy={cy}
        r={9}
        fill={primaryColor}
        fillOpacity={0.25}
        stroke={primaryColor}
        strokeWidth={1}
      />
      {/* Center dot */}
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={primaryColor}
        stroke="#ffffff"
        strokeWidth={2}
      />
      {count > 1 && (
        <text
          x={cx}
          y={cy - 9}
          textAnchor="middle"
          fontSize="9"
          fontWeight="bold"
          fill="#ffffff"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
        >
          {count}
        </text>
      )}
    </g>
  );
}

/** Custom tooltip rendered by Recharts */
function ChartTooltip({ active, payload, fmt, fmtDelta, startUSD, rangeId }) {
  if (!active || !payload || !payload.length) return null;

  const pt = payload[0]?.payload;
  if (!pt) return null;

  const totalValue = pt._totalUSD ?? 0;
  const changeSinceStart = totalValue - startUSD;
  const changePct = startUSD > 0 ? (changeSinceStart / startUSD) * 100 : 0;

  const isPositive = changeSinceStart >= 0;
  const positiveColor = '#3DD68C';
  const negativeColor = '#FF6B73';

  return (
    <div style={{
      background: 'var(--chart-tooltip-bg, #1a1a2e)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      lineHeight: 1.6,
      minWidth: 200,
      maxWidth: 280,
      color: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <div style={{ color: '#9CA3AF', fontSize: 11, marginBottom: 6 }}>
        {formatTooltipDate(pt._ts, rangeId)}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <span style={{ color: '#D1D5DB' }}>Total</span>
        <strong>{fmt(totalValue)}</strong>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, marginBottom: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: '#D1D5DB' }}>Period change</span>
          <span style={{ color: isPositive ? positiveColor : negativeColor }}>
            {fmtDelta(changeSinceStart)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Per-asset breakdown rows */}
      {(pt._crypto > 0 || pt._stock > 0 || pt._fund > 0 || pt._cash > 0) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, marginTop: 4 }}>
          {pt._crypto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
              <span style={{ color: ASSET_COLORS.crypto }}>▪ Crypto</span>
              <span>{fmt(pt._crypto)}</span>
            </div>
          )}
          {pt._stock > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
              <span style={{ color: ASSET_COLORS.stock }}>▪ Stocks</span>
              <span>{fmt(pt._stock)}</span>
            </div>
          )}
          {pt._fund > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
              <span style={{ color: ASSET_COLORS.mutual_fund }}>▪ Funds</span>
              <span>{fmt(pt._fund)}</span>
            </div>
          )}
          {pt._cash > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11 }}>
              <span style={{ color: ASSET_COLORS.cash }}>▪ Cash</span>
              <span>{fmt(pt._cash)}</span>
            </div>
          )}
        </div>
      )}

      {/* Highlighted transactions on this point */}
      {pt._txList && pt._txList.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 8, marginTop: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FCD34D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span>⚡ {pt._txList.length} Transaction{pt._txList.length > 1 ? 's' : ''} here</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {pt._txList.map((tx, idx) => {
              const color = txMarkerColor(tx.type);
              const fromStr = tx.fromAmount != null ? `${tx.fromAmount} ${tx.fromAsset || ''}` : tx.fromAsset;
              const toStr = tx.toAmount != null ? `${tx.toAmount} ${tx.toAsset || ''}` : tx.toAsset;
              return (
                <div key={tx._id || idx} style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 6,
                  padding: '5px 8px',
                  fontSize: 11,
                  borderLeft: `3px solid ${color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, color, textTransform: 'capitalize' }}>
                      {tx.type.replace('_', ' ')}
                    </span>
                    {tx.valueUSD != null && (
                      <span style={{ color: '#9CA3AF', fontSize: 10 }}>${Number(tx.valueUSD).toLocaleString()}</span>
                    )}
                  </div>
                  {(fromStr || toStr) && (
                    <div style={{ color: '#E5E7EB', marginTop: 2, fontSize: 11, fontWeight: 500 }}>
                      {fromStr && <span>{fromStr.trim()}</span>}
                      {fromStr && toStr && <span style={{ color: '#9CA3AF', margin: '0 4px' }}>→</span>}
                      {toStr && <span>{toStr.trim()}</span>}
                    </div>
                  )}
                  {tx.notes && (
                    <div style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2, fontStyle: 'italic', wordBreak: 'break-word' }}>
                      {tx.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PortfolioValueChart({ holdings = [], prices = {}, refreshKey = 0 }) {
  const { currency, fmt, fmtDelta, rates } = useCurrency();
  const { isDark } = useTheme();

  const [rangeId, setRangeId]         = useState('30d');
  const [viewMode, setViewMode]       = useState('total');   // 'total' | 'stacked' | 'pct'
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Transaction markers state
  const [markers, setMarkers]                 = useState([]);
  const [showTxDots, setShowTxDots]           = useState(true);
  const [selectedTxList, setSelectedTxList]   = useState(null);

  const fetchHistory = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/portfolio/history?timeframe=${id}`);
      setHistoryData(res.data);
    } catch (err) {
      console.error('Fetch portfolio history error:', err);
      setError(err.message || 'Failed to load chart');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarkers = useCallback(async (id) => {
    try {
      const res = await api.get(`/transactions/chart-markers?timeframe=${id}`);
      setMarkers(res.data.markers || []);
    } catch (err) {
      console.warn('Failed to load transaction markers for chart:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchHistory(rangeId);
    fetchMarkers(rangeId);
  }, [rangeId, refreshKey, fetchHistory, fetchMarkers]);

  const rawPoints = historyData?.dataPoints || [];
  const summary   = historyData?.summary || {};

  // Ensure we always have at least 2 points to draw a curve, even if only 1 snapshot exists
  const effectivePoints = useMemo(() => {
    if (rawPoints.length >= 2) return rawPoints;
    if (rawPoints.length === 1) {
      const p = rawPoints[0];
      const t = new Date(p.timestamp || Date.now()).getTime();
      const earlier = new Date(t - 3600 * 1000).toISOString();
      return [{ ...p, timestamp: earlier }, p];
    }
    // Fallback if snapshots endpoint returned empty but holdings are available
    if (holdings && holdings.length > 0) {
      const m = computePortfolio(holdings, prices);
      if (m.totalValue > 0) {
        const now = new Date();
        const earlier = new Date(now.getTime() - 3600 * 1000).toISOString();
        const pt = {
          timestamp: now.toISOString(),
          totalValue: m.totalValue,
          cryptoValue: m.perSymbol?.filter(s => s.assetType === 'crypto').reduce((a, b) => a + b.valueUsd, 0) || 0,
          stockValue: m.perSymbol?.filter(s => s.assetType === 'stock').reduce((a, b) => a + b.valueUsd, 0) || 0,
          mutualFundValue: m.perSymbol?.filter(s => s.assetType === 'mutual_fund').reduce((a, b) => a + b.valueUsd, 0) || 0,
          cashValue: m.perSymbol?.filter(s => s.assetType === 'cash').reduce((a, b) => a + b.valueUsd, 0) || 0,
        };
        return [{ ...pt, timestamp: earlier }, pt];
      }
    }
    return [];
  }, [rawPoints, holdings, prices]);

  // Snap each marker to the nearest point on the curve
  const txByPointIndex = useMemo(() => {
    if (!markers.length || !effectivePoints.length) return {};
    const map = {};

    markers.forEach((m) => {
      const mTime = new Date(m.chartPinTs || m.date).getTime();
      if (isNaN(mTime)) return;

      let closestIdx = 0;
      let minDiff = Infinity;
      effectivePoints.forEach((p, idx) => {
        const pTime = new Date(p.timestamp).getTime();
        const diff = Math.abs(pTime - mTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      if (!map[closestIdx]) map[closestIdx] = [];
      map[closestIdx].push(m);
    });

    return map;
  }, [markers, effectivePoints]);

  // Build chart data: convert all USD values to display currency and attach markers
  const chartData = useMemo(() => {
    if (!effectivePoints.length) return [];

    const startUSD = effectivePoints[0]?.totalValue ?? 0;

    return effectivePoints.map((p, idx) => {
      const totalUSD  = p.totalValue      ?? 0;
      const cryptoUSD = p.cryptoValue     ?? 0;
      const stockUSD  = p.stockValue      ?? 0;
      const fundUSD   = p.mutualFundValue ?? 0;
      const cashUSD   = p.cashValue       ?? 0;

      const disp = (v) => toDisplay(v, currency, rates);
      const pct = startUSD > 0 ? ((totalUSD - startUSD) / startUSD) * 100 : 0;

      return {
        _ts: p.timestamp,
        _totalUSD: totalUSD,
        _crypto: cryptoUSD,
        _stock: stockUSD,
        _fund: fundUSD,
        _cash: cashUSD,
        _txList: txByPointIndex[idx] || [],
        value: viewMode === 'pct' ? pct : disp(totalUSD),
        crypto: disp(cryptoUSD),
        stock: disp(stockUSD),
        mutual_fund: disp(fundUSD),
        cash: disp(cashUSD),
      };
    });
  }, [effectivePoints, currency, rates, viewMode, txByPointIndex]);

  const startUSD   = effectivePoints[0]?.totalValue ?? 0;
  const currentUSD = effectivePoints[effectivePoints.length - 1]?.totalValue ?? 0;
  const deltaUSD   = currentUSD - startUSD;
  const deltaPct   = startUSD > 0 ? (deltaUSD / startUSD) * 100 : 0;
  const isPositive = deltaUSD >= 0;

  // Colour tokens
  const lineColor     = isDark ? '#a5b4fc' : '#6366F1';
  const positiveColor = '#3DD68C';
  const negativeColor = '#FF6B73';
  const gradientId    = 'portfolioGradient';
  const fillColor     = isPositive ? positiveColor : negativeColor;

  const axisColor     = 'var(--text-muted, #94a3b8)';
  const gridColor     = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // Y-axis tick formatter
  const yTickFmt = (v) => {
    if (viewMode === 'pct') return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
    let usdEquiv = v;
    if (currency === 'INR') usdEquiv = v / (rates.inrRate || 95.7);
    else if (currency === 'BTC') usdEquiv = v * (rates.btcPrice || 84300);
    else if (currency === 'HYPE') usdEquiv = v * (rates.hypePrice || 93.8);
    return formatAxisLabel(usdEquiv, currency, rates);
  };

  const xTickFmt = (ts) => formatXTick(ts, rangeId);

  const hasData = chartData.length >= 2;
  const showBrush = hasData && effectivePoints.length > 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <div>
          <h2 className="card-title">Portfolio Value Over Time</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Hourly snapshots · values in {currency}
          </div>
        </div>

        {/* Range segmented control */}
        <div className="seg seg-sm" role="group" aria-label="Time range" style={{ padding: 2 }}>
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={`seg-btn${rangeId === r.id ? ' active' : ''}`}
              aria-pressed={rangeId === r.id}
              onClick={() => setRangeId(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* View-mode toggle + summary stats row */}
      {hasData && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {/* Summary pill */}
          <div style={{ display: 'flex', gap: 14, fontSize: 13, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Total <strong>{fmt(currentUSD)}</strong></span>
            <span style={{ color: isPositive ? positiveColor : negativeColor, fontWeight: 600 }}>
              {fmtDelta(deltaUSD)} ({deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(2)}%)
            </span>
            {summary.highestValue > 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                High <strong style={{ color: 'var(--text-secondary)' }}>{fmt(summary.highestValue)}</strong>
              </span>
            )}
            {summary.lowestValue > 0 && (
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Low <strong style={{ color: 'var(--text-secondary)' }}>{fmt(summary.lowestValue)}</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Trades toggle chip */}
            <button
              type="button"
              onClick={() => setShowTxDots((p) => !p)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 8,
                border: showTxDots ? '1px solid var(--accent, #6366F1)' : '1px solid var(--card-border)',
                background: showTxDots ? 'rgba(99,102,241,0.14)' : 'var(--shell-bg)',
                color: showTxDots ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
              title="Toggle transaction dots on chart"
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: showTxDots ? '#3DD68C' : '#94A3B8',
                }}
              />
              <span>Trades ({markers.length})</span>
            </button>

            {/* View mode toggle */}
            <div className="seg seg-sm" role="group" aria-label="Chart view mode" style={{ padding: 2 }}>
              {[
                { id: 'total',   label: 'Total' },
                { id: 'stacked', label: 'Breakdown' },
                { id: 'pct',     label: '% Return' },
              ].map((m) => (
                <button
                  key={m.id}
                  className={`seg-btn${viewMode === m.id ? ' active' : ''}`}
                  aria-pressed={viewMode === m.id}
                  onClick={() => setViewMode(m.id)}
                  style={{ fontSize: 11, padding: '0 8px', minHeight: 26 }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chart area */}
      <div style={{ width: '100%', height: 320, minHeight: 300, position: 'relative' }}>
        {/* Floating Transaction Details Popover if dot is clicked */}
        {selectedTxList && selectedTxList.length > 0 && (
          <div
            className="animate-fadeIn"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 30,
              background: 'var(--panel-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 14,
              boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
              padding: 14,
              width: 280,
              maxWidth: '90%',
              maxHeight: 290,
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowRightLeft size={13} style={{ color: 'var(--accent, #6366F1)' }} />
                <span>Transaction Details</span>
              </div>
              <button
                onClick={() => setSelectedTxList(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTxList.map((tx) => {
                const color = txMarkerColor(tx.type);
                const fromStr = tx.fromAmount != null ? `${tx.fromAmount} ${tx.fromAsset || ''}` : tx.fromAsset;
                const toStr = tx.toAmount != null ? `${tx.toAmount} ${tx.toAsset || ''}` : tx.toAsset;
                const dateStr = new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                return (
                  <div
                    key={tx._id}
                    style={{
                      background: 'var(--shell-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 10,
                      padding: 10,
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' }}>
                        {tx.type.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dateStr}</span>
                    </div>

                    {(fromStr || toStr) && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0' }}>
                        {fromStr && <span>{fromStr.trim()}</span>}
                        {fromStr && toStr && <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span>}
                        {toStr && <span>{toStr.trim()}</span>}
                      </div>
                    )}

                    {tx.valueUSD != null && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        Value: ${Number(tx.valueUSD).toLocaleString()}
                      </div>
                    )}

                    {tx.notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic', wordBreak: 'break-word' }}>
                        {tx.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <Link
                to="/transactions"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: 'var(--accent, #6366F1)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <span>All Transactions</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Loading chart data…
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
            Failed to load chart data
          </div>
        ) : !hasData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            Not enough data for the selected range.<br />Import holdings to start tracking your portfolio.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: showBrush ? 32 : 10 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={fillColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={fillColor} stopOpacity={0.0}  />
                </linearGradient>
                <linearGradient id="cryptoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ASSET_COLORS.crypto}      stopOpacity={0.5} />
                  <stop offset="95%" stopColor={ASSET_COLORS.crypto}      stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ASSET_COLORS.stock}       stopOpacity={0.5} />
                  <stop offset="95%" stopColor={ASSET_COLORS.stock}       stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ASSET_COLORS.mutual_fund} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={ASSET_COLORS.mutual_fund} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ASSET_COLORS.cash}        stopOpacity={0.5} />
                  <stop offset="95%" stopColor={ASSET_COLORS.cash}        stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

              <XAxis
                dataKey="_ts"
                tickFormatter={xTickFmt}
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={45}
              />

              <YAxis
                tickFormatter={yTickFmt}
                tick={{ fill: axisColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
                domain={viewMode === 'pct' ? ['auto', 'auto'] : [(dataMin) => Math.max(0, Math.floor(dataMin * 0.98)), (dataMax) => Math.ceil(dataMax * 1.02 || 1)]}
              />

              <Tooltip
                content={(props) => (
                  <ChartTooltip
                    {...props}
                    fmt={fmt}
                    fmtDelta={fmtDelta}
                    startUSD={startUSD}
                    rangeId={rangeId}
                  />
                )}
                cursor={{ stroke: isDark ? '#4B5563' : '#D1D5DB', strokeWidth: 1 }}
              />

              {/* Baseline reference line (start value) */}
              {viewMode !== 'pct' && viewMode !== 'stacked' && startUSD > 0 && (
                <ReferenceLine
                  y={toDisplay(startUSD, currency, rates)}
                  stroke="var(--chart-baseline, #9CA3AF)"
                  strokeDasharray="5 4"
                  strokeWidth={1.2}
                />
              )}
              {viewMode === 'pct' && (
                <ReferenceLine y={0} stroke="var(--chart-baseline, #9CA3AF)" strokeDasharray="5 4" strokeWidth={1.2} />
              )}

              {/* Stacked breakdown mode */}
              {viewMode === 'stacked' ? (
                <>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: axisColor, paddingTop: 6 }}
                    formatter={(value) => ({
                      crypto:      'Crypto',
                      stock:       'Stocks',
                      mutual_fund: 'Funds',
                      cash:        'Cash',
                    }[value] ?? value)}
                  />
                  <Area type="monotone" dataKey="cash"        stackId="1" stroke={ASSET_COLORS.cash}        fill="url(#cashGrad)"   strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="mutual_fund" stackId="1" stroke={ASSET_COLORS.mutual_fund} fill="url(#fundGrad)"   strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="stock"       stackId="1" stroke={ASSET_COLORS.stock}       fill="url(#stockGrad)"  strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="crypto"      stackId="1" stroke={ASSET_COLORS.crypto}      fill="url(#cryptoGrad)" strokeWidth={1.5} dot={false} />

                  {/* Marker overlay dots on stacked mode */}
                  {showTxDots && (
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="transparent"
                      fill="none"
                      legendType="none"
                      tooltipType="none"
                      dot={(props) => <TransactionDot {...props} onSelectTx={setSelectedTxList} />}
                      activeDot={false}
                    />
                  )}
                </>
              ) : (
                /* Total / % mode */
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={viewMode === 'pct' ? (isPositive ? positiveColor : negativeColor) : lineColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  dot={showTxDots ? (props) => <TransactionDot {...props} onSelectTx={setSelectedTxList} /> : false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: isDark ? '#fff' : '#000' }}
                />
              )}

              {showBrush && (
                <Brush
                  dataKey="_ts"
                  height={22}
                  stroke={isDark ? '#374151' : '#D1D5DB'}
                  fill={isDark ? '#1F2937' : '#F3F4F6'}
                  travellerWidth={6}
                  tickFormatter={xTickFmt}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {(currency === 'BTC' || currency === 'HYPE') && hasData && (
        <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--text-caption)', marginTop: 4 }}>
          Converted at today's rate
        </div>
      )}
    </div>
  );
}
