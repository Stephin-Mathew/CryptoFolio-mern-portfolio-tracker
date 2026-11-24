import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { NAME_MAP } from '../utils/assetColors';
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent } from 'lucide-react';

/**
 * Clean up and format symbol & name for compact mover cards.
 * Prevents long strings from breaking layout and eliminates repetitive text.
 */
function formatMoverInfo(rawSymbol = '', rawName = '', assetType = '') {
  const sym = String(rawSymbol || '').trim();
  const nm = String(rawName || '').trim();

  // Check if symbol is unusually long (e.g. mutual fund scheme names or custom assets)
  const isLongSymbol = sym.length > 14 || sym.includes(' ');

  let displaySymbol = sym;
  let displayName = nm;

  if (isLongSymbol) {
    // Convert all-caps long names to clean readable Title Case
    const toTitleCase = (str) =>
      str.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());

    const titleCased = toTitleCase(sym);

    // Limit symbol length to max 18 chars for compact mover UI
    displaySymbol = titleCased.length > 19 ? titleCased.slice(0, 18).trim() + '…' : titleCased;

    // For secondary line: if name is almost identical to symbol, show clean category instead of repeating 50 chars
    const normSym = sym.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normNm = nm.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!nm || normNm === normSym || normNm.startsWith(normSym.slice(0, 15)) || normSym.startsWith(normNm.slice(0, 15))) {
      if (sym.toLowerCase().includes('index')) {
        displayName = 'Index Fund';
      } else if (sym.toLowerCase().includes('etf')) {
        displayName = 'ETF';
      } else if (sym.toLowerCase().includes('flexi')) {
        displayName = 'Flexi Cap Fund';
      } else if (sym.toLowerCase().includes('small')) {
        displayName = 'Small Cap Fund';
      } else if (sym.toLowerCase().includes('mid')) {
        displayName = 'Mid Cap Fund';
      } else if (assetType === 'mutual_fund' || sym.toLowerCase().includes('fund')) {
        displayName = 'Mutual Fund';
      } else {
        displayName = assetType ? assetType.toUpperCase() : '';
      }
    } else {
      displayName = nm.length > 20 ? nm.slice(0, 18).trim() + '…' : nm;
    }
  } else {
    // Standard short symbol (e.g. ITC, INFY, CANBK, SOL)
    if (!nm || nm.toUpperCase() === sym.toUpperCase()) {
      displayName = NAME_MAP[sym.toUpperCase()] || '';
    } else {
      displayName = nm.length > 22 ? nm.slice(0, 20).trim() + '…' : nm;
    }
  }

  const fullTooltip = nm && nm.toUpperCase() !== sym.toUpperCase()
    ? `${sym} (${nm})`
    : sym;

  return { displaySymbol, displayName, fullTooltip };
}

function MoverRow({ symbol, name, valueText, subText, isGainer, assetType }) {
  const { displaySymbol, displayName, fullTooltip } = formatMoverInfo(symbol, name, assetType);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: '1px solid var(--divider-2)',
        gap: 6,
        minWidth: 0,
        width: '100%',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          lineHeight: 1.25,
          minWidth: 0,
          flex: 1,
          overflow: 'hidden',
        }}
        title={fullTooltip}
      >
        <div
          style={{
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
          }}
        >
          {displaySymbol}
        </div>
        {displayName ? (
          <div
            style={{
              fontSize: 9,
              fontWeight: 400,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {displayName}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          flexShrink: 0,
          gap: 1,
          marginLeft: 4,
        }}
      >
        <span
          className={`chip ${isGainer ? 'chip-positive' : 'chip-negative'}`}
          style={{
            fontSize: 10,
            padding: '2px 5px',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {valueText}
        </span>
        {subText && (
          <span
            style={{
              fontSize: 8,
              color: 'var(--text-muted)',
              fontWeight: 400,
              whiteSpace: 'nowrap',
            }}
          >
            {subText}
          </span>
        )}
      </div>
    </div>
  );
}

export function TopMoversCard({ movers = {}, metrics = {} }) {
  const { fmtDelta } = useCurrency();
  const [metricMode, setMetricMode] = useState('pct'); // 'pct' | 'usd'

  const { gainers = [], losers = [] } = movers;
  const dollarMovers = metrics?.dollarMovers || {};

  // Check if any stock movers have their market closed
  const hasClosedStocks = [...gainers, ...losers].some((m) => m.isMarketClosed);

  // Market Breadth computation across active non-cash portfolio holdings
  // When active live holdings exist (e.g. crypto on weekends), breadth reflects active markets today
  const nonCash = (metrics?.perSymbol || []).filter((s) => s.assetType !== 'cash');
  const activeNonCash = nonCash.filter((s) => !s.isMarketClosed);
  const breadthList = activeNonCash.length > 0 ? activeNonCash : nonCash;

  const advancing = breadthList.filter((s) => (s.change24h || 0) > 0);
  const declining = breadthList.filter((s) => (s.change24h || 0) < 0);
  const totalActive = advancing.length + declining.length;

  const advancePct = totalActive > 0 ? (advancing.length / totalActive) * 100 : 50;
  const declinePct = totalActive > 0 ? (declining.length / totalActive) * 100 : 50;

  // Average move
  const avgGainerChange = advancing.length > 0
    ? advancing.reduce((sum, s) => sum + (s.change24h || 0), 0) / advancing.length
    : 0;
  const avgLoserChange = declining.length > 0
    ? declining.reduce((sum, s) => sum + (s.change24h || 0), 0) / declining.length
    : 0;

  // Selected movers list based on mode (% vs $)
  const activeGainers = metricMode === 'pct'
    ? gainers.slice(0, 5).map((m) => ({
      symbol: m.symbol,
      name: m.name,
      valueText: `${m.change24h >= 0 ? '+' : ''}${m.change24h.toFixed(1)}%`,
      subText: m.isMarketClosed ? 'last session' : null,
      isGainer: true,
      assetType: m.assetType,
    }))
    : (dollarMovers.gainers24h || []).slice(0, 5).map((m) => ({
      symbol: m.symbol,
      name: m.name,
      valueText: `+${fmtDelta(m.pnl24hUsd).replace('+', '')}`,
      subText: m.isMarketClosed ? `+${m.change24h?.toFixed(1)}% last session` : `+${m.change24h?.toFixed(1)}%`,
      isGainer: true,
      assetType: m.assetType,
    }));

  const activeLosers = metricMode === 'pct'
    ? losers.slice(0, 5).map((m) => ({
      symbol: m.symbol,
      name: m.name,
      valueText: `${m.change24h.toFixed(1)}%`,
      subText: m.isMarketClosed ? 'last session' : null,
      isGainer: false,
      assetType: m.assetType,
    }))
    : (dollarMovers.losers24h || []).slice(0, 5).map((m) => ({
      symbol: m.symbol,
      name: m.name,
      valueText: fmtDelta(m.pnl24hUsd),
      subText: m.isMarketClosed ? `${m.change24h?.toFixed(1)}% last session` : `${m.change24h?.toFixed(1)}%`,
      isGainer: false,
      assetType: m.assetType,
    }));

  // Extremes
  const topGainer = gainers[0];
  const deepestLoser = losers[0];
  const spread = (topGainer && deepestLoser) ? (topGainer.change24h - deepestLoser.change24h) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header with % vs $ toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={15} style={{ color: 'var(--accent, #6366F1)' }} />
          <h2 className="card-title" style={{ margin: 0 }}>Top Movers</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', background: 'var(--shell-bg)', borderRadius: 8, padding: 2, border: '1px solid var(--divider-2)' }}>
            <button
              onClick={() => setMetricMode('pct')}
              style={{
                background: metricMode === 'pct' ? 'var(--card-bg)' : 'transparent',
                color: metricMode === 'pct' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '2px 7px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                transition: 'all 0.15s ease',
              }}
            >
              <Percent size={10} /> % Return
            </button>
            <button
              onClick={() => setMetricMode('usd')}
              style={{
                background: metricMode === 'usd' ? 'var(--card-bg)' : 'transparent',
                color: metricMode === 'usd' ? 'var(--text-primary)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '2px 7px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                transition: 'all 0.15s ease',
              }}
            >
              <DollarSign size={10} /> $ Impact
            </button>
          </div>

          <span className="chip chip-neutral" style={{ fontSize: 10, padding: '2px 6px' }}>
            {hasClosedStocks ? 'Last Session' : 'Today'}
          </span>
        </div>
      </div>

      {/* ── Market Breadth & Sentiment Indicator ── */}
      {nonCash.length > 0 && (
        <div
          style={{
            background: 'var(--shell-bg)',
            borderRadius: 8,
            padding: '7px 12px',
            border: '1px solid var(--divider-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: 'var(--positive)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingUp size={11} /> {advancing.length} Advancing ({advancePct.toFixed(0)}%)
            </span>
            <span style={{ color: 'var(--negative)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingDown size={11} /> {declining.length} Declining ({declinePct.toFixed(0)}%)
            </span>
          </div>

          <div style={{ height: 4, background: 'var(--divider-2)', borderRadius: 2, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: `${advancePct}%`, background: 'var(--positive)', transition: 'width 0.4s ease' }} />
            <div style={{ width: `${declinePct}%`, background: 'var(--negative)', transition: 'width 0.4s ease' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
            <span>Avg Gainer: <strong style={{ color: 'var(--positive)' }}>+{avgGainerChange.toFixed(1)}%</strong></span>
            <span>Avg Loser: <strong style={{ color: 'var(--negative)' }}>{avgLoserChange.toFixed(1)}%</strong></span>
          </div>
        </div>
      )}

      {/* ── Two-column grid for Gainers & Losers ── */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0 14px' }}>
          {/* Gainers caption */}
          <div className="text-caption" style={{ color: 'var(--positive)', paddingBottom: 3, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metricMode === 'pct' ? 'TOP GAINERS (%)' : 'TOP MONEY MAKERS ($)'}
          </div>
          {/* Losers caption */}
          <div className="text-caption" style={{ color: 'var(--negative)', paddingBottom: 3, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metricMode === 'pct' ? 'TOP LOSERS (%)' : 'TOP MONEY DRAGS ($)'}
          </div>

          {/* Gainers column */}
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            {activeGainers.length === 0 ? (
              <div style={{ padding: '8px 0', fontSize: 11, color: 'var(--text-muted)' }}>No gainers</div>
            ) : (
              activeGainers.map((m) => (
                <MoverRow
                  key={m.symbol}
                  symbol={m.symbol}
                  name={m.name}
                  valueText={m.valueText}
                  subText={m.subText}
                  isGainer
                  assetType={m.assetType}
                />
              ))
            )}
          </div>

          {/* Losers column */}
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            {activeLosers.length === 0 ? (
              <div style={{ padding: '8px 0', fontSize: 11, color: 'var(--text-muted)' }}>No losers</div>
            ) : (
              activeLosers.map((m) => (
                <MoverRow
                  key={m.symbol}
                  symbol={m.symbol}
                  name={m.name}
                  valueText={m.valueText}
                  subText={m.subText}
                  isGainer={false}
                  assetType={m.assetType}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Session Extremes & Highlights Footer ── */}
      <div
        style={{
          paddingTop: 8,
          borderTop: '1px solid var(--divider-2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
        }}
      >
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Top Performer</div>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--positive)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={topGainer ? `${topGainer.symbol} (+${topGainer.change24h.toFixed(1)}%)` : ''}
          >
            {topGainer
              ? `${topGainer.symbol.length > 14 ? topGainer.symbol.slice(0, 12) + '…' : topGainer.symbol} (+${topGainer.change24h.toFixed(1)}%)`
              : '—'}
          </div>
        </div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deepest Drag</div>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--negative)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={deepestLoser ? `${deepestLoser.symbol} (${deepestLoser.change24h.toFixed(1)}%)` : ''}
          >
            {deepestLoser
              ? `${deepestLoser.symbol.length > 14 ? deepestLoser.symbol.slice(0, 12) + '…' : deepestLoser.symbol} (${deepestLoser.change24h.toFixed(1)}%)`
              : '—'}
          </div>
        </div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Session Spread</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 1 }}>
            {spread !== null ? `${spread.toFixed(1)}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
