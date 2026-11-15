import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axiosInstance';
import { PriceEditModal } from '../components/PriceEditModal';
import { LogoPickerModal } from '../components/LogoPickerModal';
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Activity,
  Zap,
  Filter,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  ArrowUpDown,
  ChevronLeft,
  Link2,
  Edit3,
  Globe,
  Sliders,
  Plus,
  RotateCcw,
  Layers,
  Sparkles,
  Server,
  TrendingUp,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n, d = 2) => {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
};

const fmtPrice = (p, currency = 'USD') => {
  if (p === null || p === undefined || p === 0) return '—';
  const sym = currency === 'INR' ? '₹' : '$';
  if (p < 0.01) return `${sym}${Number(p).toPrecision(4)}`;
  return `${sym}${fmt(p)}`;
};

const ago = (date) => {
  if (!date) return '—';
  const ms = Date.now() - new Date(date).getTime();
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
};

const SOURCE_COLORS = {
  cmc: { bg: 'rgba(247, 147, 26, 0.12)', color: '#F7931A', label: 'CoinMarketCap' },
  coingecko: { bg: 'rgba(139, 217, 78, 0.12)', color: '#8BD94E', label: 'CoinGecko' },
  yahoo: { bg: 'rgba(115, 76, 255, 0.12)', color: '#734CFF', label: 'Yahoo Finance' },
  mfapi: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', label: 'MFapi.in' },
  fallback: { bg: 'rgba(255, 107, 115, 0.12)', color: '#FF6B73', label: 'Static Baseline' },
  stablecoin: { bg: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', label: 'Stablecoin / FX' },
  exchange_rate_api: { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', label: 'FX Rate API' },
  override: { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', label: 'User Override' },
  unknown: { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B', label: 'Unknown' },
};

const ASSET_TYPE_COLORS = {
  crypto: { bg: 'rgba(247, 147, 26, 0.12)', color: '#F7931A' },
  stock: { bg: 'rgba(115, 76, 255, 0.12)', color: '#734CFF' },
  mutual_fund: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981' },
  fiat: { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B' },
  cash: { bg: 'rgba(100, 116, 139, 0.12)', color: '#64748B' },
};

const SourceBadge = ({ source }) => {
  const cfg = SOURCE_COLORS[source] || SOURCE_COLORS.unknown;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        letterSpacing: '.02em',
      }}
    >
      {cfg.label}
    </span>
  );
};

const StatusDot = ({ success }) => (
  <span
    style={{
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: success ? 'var(--positive, #3DD68C)' : 'var(--negative, #FF6B73)',
      display: 'inline-block',
      flexShrink: 0,
      boxShadow: `0 0 6px ${success ? 'rgba(61, 214, 140, 0.4)' : 'rgba(255, 107, 115, 0.4)'}`,
    }}
  />
);

const ChangeBadge = ({ value }) => {
  if (value === null || value === undefined) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  const isPos = value >= 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isPos ? 'var(--positive)' : 'var(--negative)' }}>
      {isPos ? '+' : ''}{fmt(value, 2)}%
    </span>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--text-primary)' }) => (
  <div
    style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flex: '1 1 0',
      minWidth: 160,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={18} style={{ color }} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

// ── Tab Button ────────────────────────────────────────────────────────────

const Tab = ({ active, label, count, onClick, icon: Icon }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 14px',
      borderRadius: 8,
      border: active ? '1px solid var(--card-border)' : '1px solid transparent',
      background: active ? 'var(--card-bg)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
      fontSize: 12,
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
      transition: 'all 0.15s ease',
    }}
  >
    {Icon && <Icon size={14} />}
    {label}
    {count !== undefined && (
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '1px 6px',
          borderRadius: 5,
          background: active ? 'var(--neutral-chip-bg)' : 'var(--neutral-chip-bg)',
          color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </span>
    )}
  </button>
);

// ── Main Page Component ──────────────────────────────────────────────────

export const DevPriceLogsPage = () => {
  const [activeView, setActiveView] = useState('sources'); // 'sources' | 'cache' | 'logs' | 'overrides'
  const [stats, setStats] = useState(null);
  const [cache, setCache] = useState([]);
  const [overrides, setOverrides] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('cmc');
  const [sourceSubView, setSourceSubView] = useState('lastCall'); // 'lastCall' | 'cached'
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state for changing mapping & logos
  const [priceModalTarget, setPriceModalTarget] = useState(null);
  const [logoModalTarget, setLogoModalTarget] = useState(null);
  const [newMappingOpen, setNewMappingOpen] = useState(false);
  const [newSymbolInput, setNewSymbolInput] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assetTypeFilter, setAssetTypeFilter] = useState('');
  const [sortField, setSortField] = useState('symbol');
  const [sortDir, setSortDir] = useState('asc');

  // Batch detail expansion in Fetch Logs
  const [expandedBatch, setExpandedBatch] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch stats + cache + overrides
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/dev/price-logs/stats');
      setStats(res.data.stats);
      setCache(res.data.cache || []);
      setOverrides(res.data.overrides || []);
    } catch (err) {
      console.error('Failed to fetch dev stats:', err);
    }
  }, []);

  // Fetch sources grouped view
  const fetchSources = useCallback(async () => {
    try {
      const res = await api.get('/dev/sources');
      setSources(res.data.providers || []);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  }, []);

  // Fetch batch logs
  const fetchLogs = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 20, search, source: sourceFilter, status: statusFilter, assetType: assetTypeFilter };
      const res = await api.get('/dev/price-logs', { params });
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, [search, sourceFilter, statusFilter, assetTypeFilter]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchSources(), fetchLogs()]);
      setLoading(false);
    };
    load();
  }, [fetchStats, fetchSources, fetchLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchSources(), fetchLogs(pagination.page)]);
    setRefreshing(false);
    showToast('Data refreshed live');
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Clear all price fetch logs? This cannot be undone.')) return;
    try {
      await api.delete('/dev/price-logs');
      await fetchLogs();
      await fetchStats();
      await fetchSources();
      showToast('Price fetch logs cleared');
    } catch (err) {
      console.error('Failed to clear logs:', err);
      showToast('Failed to clear logs', 'error');
    }
  };

  // ── Price Override & Mapping Handlers ──────────────────────────────────
  const handleSavePrice = async (symbol, overrideData) => {
    try {
      const res = await api.post('/prices/override', { symbol, ...overrideData });
      showToast(res.data.message || `Price updated for ${symbol}`, 'success');
      await Promise.all([fetchStats(), fetchSources(), fetchLogs(pagination.page)]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update price', 'error');
      throw err;
    }
  };

  const handleResetPrice = async (symbol) => {
    try {
      const res = await api.delete(`/prices/override/${symbol}`);
      showToast(res.data.message || `Reset ${symbol} to live market price`, 'success');
      await Promise.all([fetchStats(), fetchSources(), fetchLogs(pagination.page)]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset price', 'error');
      throw err;
    }
  };

  // ── Logo Override Handlers ─────────────────────────────────────────────
  const handleSaveLogo = async (symbol, logoData) => {
    try {
      const res = await api.post('/prices/logo/override', { symbol, ...logoData });
      showToast(res.data.message || `Logo updated for ${symbol}`, 'success');
      await Promise.all([fetchStats(), fetchSources(), fetchLogs(pagination.page)]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update logo', 'error');
      throw err;
    }
  };

  const handleResetLogo = async (symbol) => {
    try {
      const res = await api.delete(`/prices/logo/override/${encodeURIComponent(symbol)}`);
      showToast(res.data.message || `Reset logo for ${symbol} to default`, 'success');
      await Promise.all([fetchStats(), fetchSources(), fetchLogs(pagination.page)]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset logo', 'error');
      throw err;
    }
  };

  // ── Cache Bust Handler ─────────────────────────────────────────────────
  const handleCacheBust = async (symbol) => {
    try {
      const res = await api.delete(`/prices/cache/${encodeURIComponent(symbol)}`);
      showToast(res.data?.message || `Refreshed live price for ${symbol}`, 'success');
      await Promise.all([fetchStats(), fetchSources(), fetchLogs(pagination.page)]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to bust cache', 'error');
    }
  };

  // ── Open Modals for a Symbol ───────────────────────────────────────────
  const openPriceModal = (sym, priceObj = {}) => {
    setPriceModalTarget({
      symbol: sym,
      priceInfo: priceObj,
    });
  };

  const openLogoModal = (sym, assetType = 'crypto', logoUrl = null, isCustom = false) => {
    setLogoModalTarget({
      symbol: sym,
      assetType,
      logoUrl,
      isCustomLogo: isCustom,
    });
  };

  // ── Filtered & sorted cache ────────────────────────────────────────────
  const filteredCache = useMemo(() => {
    let items = [...cache];

    if (search) {
      const q = search.toUpperCase();
      items = items.filter(
        (c) =>
          c.symbol?.toUpperCase().includes(q) ||
          c.schemeName?.toUpperCase().includes(q) ||
          c.assetType?.toUpperCase().includes(q) ||
          c.source?.toUpperCase().includes(q)
      );
    }

    if (assetTypeFilter) {
      items = items.filter((c) => c.assetType === assetTypeFilter);
    }

    items.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [cache, search, assetTypeFilter, sortField, sortDir]);

  const filteredOverrides = useMemo(() => {
    let items = [...overrides];
    if (search) {
      const q = search.toUpperCase();
      items = items.filter(
        (o) =>
          o.symbol?.toUpperCase().includes(q) ||
          o.mappedSymbol?.toUpperCase().includes(q)
      );
    }
    return items;
  }, [overrides, search]);

  const selectedSource = useMemo(() => {
    return sources.find((s) => s.id === selectedSourceId) || sources[0] || null;
  }, [sources, selectedSourceId]);

  const filteredSourceItems = useMemo(() => {
    if (!selectedSource) return [];
    const rawList = sourceSubView === 'lastCall'
      ? selectedSource.lastApiCall?.items || []
      : selectedSource.cachedAssets || [];

    if (!search) return rawList;
    const q = search.toUpperCase();
    return rawList.filter(
      (item) =>
        item.symbol?.toUpperCase().includes(q) ||
        item.mappedTo?.toUpperCase().includes(q) ||
        item.schemeName?.toUpperCase().includes(q)
    );
  }, [selectedSource, sourceSubView, search]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>Loading developer logs…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 24px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Toast Notification ────────────────────────────────────────── */}
      {toast && (
        <div
          className="animate-fadeIn"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 100,
            padding: '10px 16px',
            borderRadius: 12,
            border: `1px solid ${toast.type === 'success' ? 'var(--positive-bg)' : 'var(--negative-bg)'}`,
            background: 'var(--panel-bg)',
            color: toast.type === 'success' ? 'var(--positive)' : 'var(--negative)',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            maxWidth: 380,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 16px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={22} style={{ color: '#734CFF' }} />
            Price Engine & Source Inspector
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Developer dashboard — API providers, price cache, fetch logs, ticker mappings & logo overrides
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Action button to configure new mapping */}
          <button
            onClick={() => setNewMappingOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(115, 76, 255, 0.3)',
              background: 'rgba(115, 76, 255, 0.1)',
              color: '#734CFF',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={14} />
            Map Ticker / Price
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>

          {activeView === 'logs' && (
            <button
              onClick={handleClearLogs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                border: '1px solid var(--negative-bg)',
                background: 'var(--negative-bg)',
                color: 'var(--negative)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Trash2 size={14} />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      {stats && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard icon={Database} label="Cache Entries" value={stats.cacheEntryCount} color="#734CFF" />
          <StatCard icon={Activity} label="Fetches (24h)" value={stats.totalFetches24h} sub={`${stats.batchesLast24h} batches`} color="#F7931A" />
          <StatCard
            icon={CheckCircle2}
            label="Success Rate"
            value={`${stats.successRate}%`}
            sub={`${stats.totalSuccess24h} ok / ${stats.totalFail24h} fail`}
            color={stats.successRate >= 95 ? '#3DD68C' : stats.successRate >= 80 ? '#F59E0B' : '#FF6B73'}
          />
          <StatCard icon={Zap} label="Avg Duration" value={`${stats.avgDurationMs}ms`} color="#06B6D4" />
          <StatCard icon={Sliders} label="Active Overrides" value={stats.overrideCount} sub={`${stats.holdingCount} holdings`} color="#8B5CF6" />
        </div>
      )}

      {/* ── Tab Row ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 0 12px', borderBottom: '1px solid var(--divider-1)', marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Tab active={activeView === 'sources'} label="By Source Provider" count={sources.length} icon={Globe} onClick={() => setActiveView('sources')} />
        <Tab active={activeView === 'cache'} label="Price Cache" count={cache.length} icon={Database} onClick={() => setActiveView('cache')} />
        <Tab active={activeView === 'logs'} label="Fetch Logs" count={pagination.total} icon={Activity} onClick={() => setActiveView('logs')} />
        <Tab active={activeView === 'overrides'} label="Overrides & Mappings" count={overrides.length} icon={Sliders} onClick={() => setActiveView('overrides')} />

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div style={{ position: 'relative', width: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search symbol, name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px 7px 30px',
              borderRadius: 8,
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
        </div>

        {/* Asset type filter (for Cache & Logs) */}
        {activeView !== 'sources' && (
          <select
            value={assetTypeFilter}
            onChange={(e) => setAssetTypeFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: 8,
              border: '1px solid var(--card-border)',
              background: 'var(--card-bg)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            <option value="">All Types</option>
            <option value="crypto">Crypto</option>
            <option value="stock">Stock</option>
            <option value="mutual_fund">Mutual Fund</option>
          </select>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── SECTION 1: BY SOURCE PROVIDER (NEW GROUPED SECTION) ────────── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'sources' && (
        <div>
          {/* Provider Selector Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
            {sources.map((src) => {
              const isSelected = selectedSourceId === src.id;
              const hasRecentCall = src.lastApiCall?.totalItems > 0;
              return (
                <div
                  key={src.id}
                  onClick={() => setSelectedSourceId(src.id)}
                  style={{
                    background: isSelected ? 'var(--card-bg)' : 'var(--shell-bg)',
                    border: isSelected ? `2px solid ${src.color}` : '1px solid var(--card-border)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? `0 4px 16px ${src.color}25` : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: src.color }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{src.name}</span>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: src.color, color: '#fff' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{src.category}</div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--divider-2)', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Last call: <strong style={{ color: 'var(--text-primary)' }}>{src.lastApiCall?.totalItems || 0}</strong>
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                      {hasRecentCall ? ago(src.lastApiCall.fetchedAt) : 'No call yet'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Provider Detail Box */}
          {selectedSource && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Provider Info Banner */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: `${selectedSource.color}08` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedSource.color }} />
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedSource.name}
                    </h2>
                    <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: `${selectedSource.color}20`, color: selectedSource.color }}>
                      {selectedSource.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    {selectedSource.description}
                  </p>
                  <div style={{ fontSize: 11, color: 'var(--text-caption)', fontFamily: 'monospace', marginTop: 4 }}>
                    API Endpoint: {selectedSource.endpoint}
                  </div>
                </div>

                {/* Sub-view toggle: Last API Call vs Cached Assets */}
                <div style={{ display: 'flex', background: 'var(--seg-track)', borderRadius: 10, padding: 3, gap: 2 }}>
                  <button
                    onClick={() => setSourceSubView('lastCall')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: sourceSubView === 'lastCall' ? 'var(--seg-active-bg)' : 'transparent',
                      color: sourceSubView === 'lastCall' ? 'var(--seg-active-text)' : 'var(--seg-text)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: sourceSubView === 'lastCall' ? 'var(--seg-active-shadow)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Zap size={12} style={{ color: selectedSource.color }} />
                    Last API Call ({selectedSource.lastApiCall?.totalItems || 0})
                  </button>
                  <button
                    onClick={() => setSourceSubView('cached')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: sourceSubView === 'cached' ? 'var(--seg-active-bg)' : 'transparent',
                      color: sourceSubView === 'cached' ? 'var(--seg-active-text)' : 'var(--seg-text)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: sourceSubView === 'cached' ? 'var(--seg-active-shadow)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Database size={12} style={{ color: selectedSource.color }} />
                    All Cached Assets ({selectedSource.cachedAssetsCount || 0})
                  </button>
                </div>
              </div>

              {/* Last API Call Metadata Strip (when lastCall subview is active) */}
              {sourceSubView === 'lastCall' && selectedSource.lastApiCall?.batchId && (
                <div style={{ padding: '8px 20px', background: 'var(--shell-bg)', borderBottom: '1px solid var(--divider-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span>
                      Batch: <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedSource.lastApiCall.batchId}</code>
                    </span>
                    <span>
                      Trigger: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selectedSource.lastApiCall.trigger || 'manual'}</strong>
                    </span>
                    <span>
                      Duration: <strong>{selectedSource.lastApiCall.durationMs}ms</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--positive)', fontWeight: 600 }}>
                      ✓ {selectedSource.lastApiCall.successCount} succeeded
                    </span>
                    {selectedSource.lastApiCall.failCount > 0 && (
                      <span style={{ color: 'var(--negative)', fontWeight: 600 }}>
                        ✕ {selectedSource.lastApiCall.failCount} failed
                      </span>
                    )}
                    <span>
                      Fetched: {ago(selectedSource.lastApiCall.fetchedAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Items Table for the Source */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--divider-1)' }}>
                      {['Status', 'Symbol', 'Price (USD)', 'Price (INR / NAV)', '24h', '7d', '30d', 'Mapped Target', 'Logo', 'Actions'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '10px 12px',
                            textAlign: 'left',
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '.05em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSourceItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                          {sourceSubView === 'lastCall'
                            ? `No items were fetched from ${selectedSource.name} in the last API call. Click Refresh to trigger a live quote update.`
                            : `No cached assets currently mapped to ${selectedSource.name}.`}
                        </td>
                      </tr>
                    ) : (
                      filteredSourceItems.map((item, idx) => {
                        const isSuccess = item.success !== undefined ? item.success : (item.price > 0);
                        const displayInr = item.navInr ? `₹${fmt(item.navInr)}` : item.priceInr ? `₹${fmt(item.priceInr)}` : '—';
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--divider-2)' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <StatusDot success={isSuccess} />
                            </td>

                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {item.logoUrl ? (
                                  <img
                                    src={item.logoUrl}
                                    alt=""
                                    style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${selectedSource.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: selectedSource.color }}>
                                    {item.symbol?.slice(0, 2)}
                                  </div>
                                )}
                                <div>
                                  <div>{item.symbol}</div>
                                  {item.schemeName && (
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {item.schemeName}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                              {fmtPrice(item.price, item.currency)}
                            </td>

                            <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--text-secondary)' }}>
                              {displayInr}
                            </td>

                            <td style={{ padding: '8px 12px' }}><ChangeBadge value={item.change24h} /></td>
                            <td style={{ padding: '8px 12px' }}><ChangeBadge value={item.change7d} /></td>
                            <td style={{ padding: '8px 12px' }}><ChangeBadge value={item.change30d} /></td>

                            <td style={{ padding: '8px 12px' }}>
                              {item.mappedTo ? (
                                <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
                                  → {item.mappedTo}
                                </span>
                              ) : item.cmcId ? (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  CMC #{item.cmcId}
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Direct</span>
                              )}
                            </td>

                            <td style={{ padding: '8px 12px' }}>
                              {item.logoUrl ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--positive)', fontWeight: 500 }}>
                                  <CheckCircle2 size={12} /> Assigned
                                </span>
                              ) : (
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>None</span>
                              )}
                            </td>

                            {/* ── ACTION BUTTONS: MAP PRICE & CHANGE LOGO ── */}
                            <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button
                                  onClick={() => openPriceModal(item.symbol, item)}
                                  title={`Edit price / map ticker for ${item.symbol}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    border: '1px solid var(--card-border)',
                                    background: 'var(--shell-bg)',
                                    color: 'var(--text-primary)',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  <Link2 size={12} /> Map Price
                                </button>

                                <button
                                  onClick={() => openLogoModal(item.symbol, item.assetType || 'crypto', item.logoUrl, false)}
                                  title={`Change logo for ${item.symbol}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    border: '1px solid var(--card-border)',
                                    background: 'var(--shell-bg)',
                                    color: 'var(--text-secondary)',
                                    fontSize: 11,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  <ImageIcon size={12} /> Logo
                                </button>

                                <button
                                  onClick={() => handleCacheBust(item.symbol)}
                                  title={`Force re-fetch from live API for ${item.symbol}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 6px',
                                    borderRadius: 6,
                                    border: '1px solid var(--card-border)',
                                    background: 'var(--shell-bg)',
                                    color: 'var(--text-muted)',
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <RefreshCw size={11} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── SECTION 2: PRICE CACHE ─────────────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'cache' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider-1)' }}>
                  {[
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'source', label: 'Source' },
                    { key: 'assetType', label: 'Type' },
                    { key: 'price', label: 'Price (USD)' },
                    { key: null, label: 'Price (INR)' },
                    { key: 'change24h', label: '24h' },
                    { key: 'change7d', label: '7d' },
                    { key: 'change30d', label: '30d' },
                    { key: null, label: 'Logo' },
                    { key: 'lastUpdated', label: 'Last Updated' },
                    { key: 'staleness', label: 'Staleness' },
                    { key: null, label: 'Actions' },
                  ].map(({ key, label }) => (
                    <th
                      key={label}
                      onClick={key ? () => toggleSort(key) : undefined}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        cursor: key ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {label}
                        {key && sortField === key && (
                          <ArrowUpDown size={10} style={{ color: 'var(--text-secondary)' }} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCache.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No cached prices found
                    </td>
                  </tr>
                ) : (
                  filteredCache.map((c) => {
                    const atc = ASSET_TYPE_COLORS[c.assetType] || ASSET_TYPE_COLORS.crypto;
                    const isStale = c.staleness > 10 * 60 * 1000;
                    return (
                      <tr key={c.symbol} style={{ borderBottom: '1px solid var(--divider-2)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {c.logoUrl && (
                              <img
                                src={c.logoUrl}
                                alt=""
                                style={{ width: 20, height: 20, borderRadius: 6, objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            {c.symbol}
                          </div>
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <SourceBadge source={c.source || 'unknown'} />
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: atc.bg, color: atc.color }}>
                            {c.assetType === 'mutual_fund' ? 'MF' : c.assetType}
                          </span>
                        </td>

                        <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {fmtPrice(c.price)}
                        </td>

                        <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--text-secondary)' }}>
                          {c.navInr ? `₹${fmt(c.navInr)}` : c.priceInr ? `₹${fmt(c.priceInr)}` : '—'}
                        </td>

                        <td style={{ padding: '8px 12px' }}><ChangeBadge value={c.change24h} /></td>
                        <td style={{ padding: '8px 12px' }}><ChangeBadge value={c.change7d} /></td>
                        <td style={{ padding: '8px 12px' }}><ChangeBadge value={c.change30d} /></td>

                        <td style={{ padding: '8px 12px' }}>
                          {c.logoUrl ? (
                            <span
                              title={c.logoUrl}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                padding: '2px 6px',
                                borderRadius: 5,
                                fontSize: 10,
                                fontWeight: 500,
                                background: 'var(--positive-bg)',
                                color: 'var(--positive)',
                              }}
                            >
                              <ImageIcon size={10} /> Mapped
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {c.lastUpdated ? new Date(c.lastUpdated).toLocaleString() : '—'}
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 5,
                              background: isStale ? 'var(--negative-bg)' : 'var(--positive-bg)',
                              color: isStale ? 'var(--negative)' : 'var(--positive)',
                            }}
                          >
                            {ago(c.lastUpdated)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              onClick={() => openPriceModal(c.symbol, c)}
                              title={`Map price or lock custom quote for ${c.symbol}`}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--card-border)',
                                background: 'var(--shell-bg)',
                                color: 'var(--text-primary)',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Link2 size={11} /> Map
                            </button>

                            <button
                              onClick={() => openLogoModal(c.symbol, c.assetType, c.logoUrl, false)}
                              title={`Change logo for ${c.symbol}`}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--card-border)',
                                background: 'var(--shell-bg)',
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <ImageIcon size={11} /> Logo
                            </button>

                            <button
                              onClick={() => handleCacheBust(c.symbol)}
                              title={`Force re-fetch from API for ${c.symbol}`}
                              style={{
                                padding: '4px 6px',
                                borderRadius: 6,
                                border: '1px solid var(--card-border)',
                                background: 'var(--shell-bg)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              <RefreshCw size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--divider-1)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>{filteredCache.length} entries</span>
            <span>Stale threshold: 10 minutes</span>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── SECTION 3: FETCH LOGS (TIMELINE BATCHES) ───────────────────── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'logs' && (
        <div>
          {logs.length === 0 ? (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 40, textAlign: 'center' }}>
              <Database size={32} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No fetch logs yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Logs appear here after price fetches are triggered (page loads, manual refresh, or cron).</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.map((log) => {
                const isExpanded = expandedBatch === log.batchId;
                return (
                  <div
                    key={log.batchId || log._id}
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 14,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Batch header */}
                    <button
                      onClick={() => setExpandedBatch(isExpanded ? null : log.batchId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        width: '100%',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                      }}
                    >
                      {isExpanded ? <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 5,
                            fontSize: 10,
                            fontWeight: 600,
                            background: log.trigger === 'cron' ? 'rgba(6, 182, 212, 0.12)' : log.trigger === 'manual_refresh' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: log.trigger === 'cron' ? '#06B6D4' : log.trigger === 'manual_refresh' ? '#8B5CF6' : '#F59E0B',
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                          }}
                        >
                          {log.trigger}
                        </span>

                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {log.totalSymbols} symbols
                        </span>

                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--positive)', fontWeight: 600 }}>
                          <CheckCircle2 size={12} /> {log.successCount}
                        </span>

                        {log.failCount > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--negative)', fontWeight: 600 }}>
                            <XCircle size={12} /> {log.failCount}
                          </span>
                        )}

                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {log.durationMs}ms
                        </span>
                      </div>

                      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {ago(log.fetchedAt)}
                      </span>
                    </button>

                    {/* Expanded batch detail */}
                    {isExpanded && (
                      <div style={{ borderTop: '1px solid var(--divider-1)', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--divider-2)' }}>
                              {['Status', 'Symbol', 'Source', 'Type', 'Price', 'Mapped To', 'Logo', '24h', 'Error', 'Actions'].map((h) => (
                                <th
                                  key={h}
                                  style={{
                                    padding: '8px 10px',
                                    textAlign: 'left',
                                    fontSize: 9,
                                    fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '.06em',
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(log.results || []).map((r, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--divider-2)' }}>
                                <td style={{ padding: '6px 10px' }}><StatusDot success={r.success} /></td>
                                <td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.symbol}</td>
                                <td style={{ padding: '6px 10px' }}><SourceBadge source={r.source} /></td>
                                <td style={{ padding: '6px 10px' }}>
                                  <span style={{
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    fontSize: 9,
                                    fontWeight: 600,
                                    background: (ASSET_TYPE_COLORS[r.assetType] || ASSET_TYPE_COLORS.crypto).bg,
                                    color: (ASSET_TYPE_COLORS[r.assetType] || ASSET_TYPE_COLORS.crypto).color,
                                  }}>
                                    {r.assetType === 'mutual_fund' ? 'MF' : r.assetType}
                                  </span>
                                </td>
                                <td style={{ padding: '6px 10px', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                                  {fmtPrice(r.price, r.currency)}
                                </td>
                                <td style={{ padding: '6px 10px', fontSize: 10, color: 'var(--text-muted)' }}>
                                  {r.mappedTo || '—'}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  {r.logoUrl ? (
                                    <img src={r.logoUrl} alt="" style={{ width: 16, height: 16, borderRadius: 4 }} onError={(e) => { e.target.style.display = 'none'; }} />
                                  ) : (
                                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: '6px 10px' }}><ChangeBadge value={r.change24h} /></td>
                                <td style={{ padding: '6px 10px', fontSize: 10, color: 'var(--negative)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.error || ''}
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      onClick={() => openPriceModal(r.symbol, r)}
                                      title="Map price / ticker"
                                      style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--card-border)', background: 'var(--shell-bg)', fontSize: 10, cursor: 'pointer' }}
                                    >
                                      <Link2 size={10} />
                                    </button>
                                    <button
                                      onClick={() => openLogoModal(r.symbol, r.assetType, r.logoUrl, false)}
                                      title="Change logo"
                                      style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid var(--card-border)', background: 'var(--shell-bg)', fontSize: 10, cursor: 'pointer' }}
                                    >
                                      <ImageIcon size={10} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 0' }}>
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchLogs(pagination.page - 1)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      cursor: pagination.page <= 1 ? 'default' : 'pointer',
                      opacity: pagination.page <= 1 ? 0.4 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchLogs(pagination.page + 1)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--card-border)',
                      background: 'var(--card-bg)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      cursor: pagination.page >= pagination.totalPages ? 'default' : 'pointer',
                      opacity: pagination.page >= pagination.totalPages ? 0.4 : 1,
                      fontFamily: 'inherit',
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* ── SECTION 4: OVERRIDES & MAPPINGS (WITH EDIT/CHANGE ACTIONS) ─── */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeView === 'overrides' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Action Bar for Overrides */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Ticker Mappings & Custom Price Overrides
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Redirect any portfolio symbol to an alternate live market ticker, or lock a custom price / logo override.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setNewMappingOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #734CFF',
                  background: '#734CFF',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Plus size={14} />
                + Add New Mapping
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--divider-1)' }}>
                    {['Symbol', 'Mapped Ticker', 'Custom Price', 'Locked', 'Currency', 'Custom Logo', 'CMC ID', 'Notes', 'Updated', 'Actions'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '.05em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOverrides.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No overrides or ticker mappings configured yet. Click "+ Add New Mapping" above to map a ticker or override a price.
                      </td>
                    </tr>
                  ) : (
                    filteredOverrides.map((o) => (
                      <tr key={o.symbol} style={{ borderBottom: '1px solid var(--divider-2)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>{o.symbol}</td>

                        <td style={{ padding: '8px 12px' }}>
                          {o.mappedSymbol ? (
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              background: 'rgba(139, 92, 246, 0.15)',
                              color: '#8B5CF6',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <Link2 size={12} /> → {o.mappedSymbol}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>None (Direct)</span>
                          )}
                        </td>

                        <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                          {o.price !== null && o.price !== undefined ? fmtPrice(o.price, o.currency) : '—'}
                        </td>

                        <td style={{ padding: '8px 12px' }}>
                          {o.isLocked ? (
                            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--warning)', padding: '2px 6px', borderRadius: 4, background: 'var(--warning-bg)' }}>
                              🔒 Locked
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Live</span>
                          )}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)' }}>{o.currency}</td>

                        <td style={{ padding: '8px 12px' }}>
                          {o.customLogoUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <img src={o.customLogoUrl} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--positive)' }}>Custom</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Default</span>
                          )}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                          {o.customLogoCmcId || '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {o.notes || '—'}
                        </td>

                        <td style={{ padding: '8px 12px', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {ago(o.updatedAt)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              onClick={() => openPriceModal(o.symbol, o)}
                              title="Edit price mapping"
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--card-border)',
                                background: 'var(--shell-bg)',
                                color: 'var(--text-primary)',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Edit3 size={11} /> Edit
                            </button>

                            <button
                              onClick={() => openLogoModal(o.symbol, 'crypto', o.customLogoUrl, true)}
                              title="Change logo"
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--card-border)',
                                background: 'var(--shell-bg)',
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <ImageIcon size={11} /> Logo
                            </button>

                            <button
                              onClick={() => handleResetPrice(o.symbol)}
                              title="Revert to market price"
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--negative-bg)',
                                background: 'var(--negative-bg)',
                                color: 'var(--negative)',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <RotateCcw size={11} /> Reset
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Failed Symbols Alert ───────────────────────────────────────── */}
      {stats?.failedSymbols?.length > 0 && (
        <div
          style={{
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid var(--negative-bg)',
            background: 'var(--negative-bg)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <AlertTriangle size={16} style={{ color: 'var(--negative)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--negative)', marginBottom: 4 }}>
              Failed Symbols (last 24h)
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {stats.failedSymbols.map((sym) => (
                <span
                  key={sym}
                  onClick={() => openPriceModal(sym)}
                  title="Click to map this symbol to a valid ticker"
                  style={{
                    padding: '2px 8px',
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.2)',
                    color: 'var(--negative)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {sym} <Link2 size={10} />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK ADD NEW MAPPING DIALOG ───────────────────────────────── */}
      {newMappingOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="animate-fadeIn"
            style={{
              background: 'var(--panel-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link2 size={18} style={{ color: '#734CFF' }} />
                Map Symbol Ticker / Price
              </div>
              <button
                onClick={() => { setNewMappingOpen(false); setNewSymbolInput(''); }}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Enter the portfolio symbol you want to map or override (e.g. <code>CANBK</code>, <code>HYPE</code>, <code>MIRAE</code>).
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>
                Asset Symbol
              </label>
              <input
                type="text"
                placeholder="e.g. CANBK, HYPE, AAPL..."
                value={newSymbolInput}
                onChange={(e) => setNewSymbolInput(e.target.value.toUpperCase())}
                autoFocus
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--card-border)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setNewMappingOpen(false); setNewSymbolInput(''); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--card-border)',
                  background: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                disabled={!newSymbolInput.trim()}
                onClick={() => {
                  const sym = newSymbolInput.trim().toUpperCase();
                  setNewMappingOpen(false);
                  setNewSymbolInput('');
                  openPriceModal(sym);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#734CFF',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: newSymbolInput.trim() ? 'pointer' : 'default',
                  opacity: newSymbolInput.trim() ? 1 : 0.5,
                  fontFamily: 'inherit',
                }}
              >
                Continue to Mapping →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRICE EDIT & MAPPING MODAL ─────────────────────────────────── */}
      {priceModalTarget && (
        <PriceEditModal
          isOpen={Boolean(priceModalTarget)}
          onClose={() => setPriceModalTarget(null)}
          symbol={priceModalTarget.symbol}
          currentPriceInfo={priceModalTarget.priceInfo || {}}
          onSavePrice={handleSavePrice}
          onResetPrice={handleResetPrice}
        />
      )}

      {/* ── LOGO PICKER & OVERRIDE MODAL ───────────────────────────────── */}
      {logoModalTarget && (
        <LogoPickerModal
          isOpen={Boolean(logoModalTarget)}
          onClose={() => setLogoModalTarget(null)}
          symbol={logoModalTarget.symbol}
          assetType={logoModalTarget.assetType || 'crypto'}
          currentLogoUrl={logoModalTarget.logoUrl}
          isCustomLogo={logoModalTarget.isCustomLogo}
          onSaveLogo={handleSaveLogo}
          onResetLogo={handleResetLogo}
        />
      )}
    </div>
  );
};
