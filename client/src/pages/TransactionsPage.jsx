import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, X, Edit2, Trash2, ArrowRightLeft, RefreshCw } from 'lucide-react';
import api from '../api/axiosInstance';
import { TransactionFormModal } from '../components/TransactionFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { useWallets } from '../context/WalletContext';

const TYPE_CONFIG = {
  buy:          { label: 'Buy',          color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  sell:         { label: 'Sell',         color: '#FF6B73', bg: 'rgba(255,107,115,0.12)' },
  swap:         { label: 'Swap',         color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  transfer_in:  { label: 'Transfer In',  color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  transfer_out: { label: 'Transfer Out', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  deposit:      { label: 'Deposit',      color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  withdrawal:   { label: 'Withdrawal',   color: '#FF6B73', bg: 'rgba(255,107,115,0.12)' },
  long:         { label: 'Long',         color: '#3DD68C', bg: 'rgba(61,214,140,0.12)' },
  short:        { label: 'Short',        color: '#FF6B73', bg: 'rgba(255,107,115,0.12)' },
  note:         { label: 'Note',         color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const ALL_TYPES = ['all', ...Object.keys(TYPE_CONFIG)];

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return (
    dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' +
    dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
}

const LIMIT = 50;

export function TransactionsPage({ showToast, onTransactionChange }) {
  const { wallets } = useWallets();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);

  // Filters
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [debouncedSearch, setDebounced] = useState('');
  const timerRef = useRef(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txToEdit, setTxToEdit]       = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete]   = useState(null);

  // Debounce search input
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(timerRef.current);
  }, [search]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, typeFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  const handleSave = async (data) => {
    if (txToEdit) {
      const res = await api.patch(`/transactions/${txToEdit._id}`, data);
      setTransactions((prev) => prev.map((t) => (t._id === txToEdit._id ? res.data.transaction : t)));
      showToast?.('Transaction updated', 'success');
    } else {
      const res = await api.post('/transactions', data);
      setTransactions((prev) => [res.data.transaction, ...prev]);
      setTotal((prev) => prev + 1);
      showToast?.('Transaction added', 'success');
    }
    onTransactionChange?.();
  };

  const promptDelete = (tx) => {
    setTxToDelete(tx);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    try {
      await api.delete(`/transactions/${txToDelete._id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== txToDelete._id));
      setTotal((prev) => prev - 1);
      showToast?.('Transaction deleted', 'success');
      onTransactionChange?.();
    } catch (err) {
      showToast?.('Failed to delete transaction', 'error');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 className="card-title" style={{ fontSize: 20, marginBottom: 2 }}>Transactions</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {loading ? 'Loading…' : `${total} record${total !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ minHeight: 36, padding: '0 14px', fontSize: 13, gap: 6, borderRadius: 10 }}
          onClick={() => { setTxToEdit(null); setIsModalOpen(true); }}
        >
          <Plus size={15} />
          Add Transaction
        </button>
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search assets, notes, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 32,
              paddingRight: search ? 32 : 12,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 10,
              border: '1px solid var(--card-border)',
              background: 'var(--shell-bg)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 2 }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {ALL_TYPES.map((t) => {
            const cfg = TYPE_CONFIG[t];
            const isActive = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '4px 11px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  border: isActive ? `1.5px solid ${cfg?.color || 'var(--text-primary)'}` : '1px solid var(--card-border)',
                  background: isActive ? (cfg?.bg || 'var(--shell-bg)') : 'var(--shell-bg)',
                  color: isActive ? (cfg?.color || 'var(--text-primary)') : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.13s',
                  whiteSpace: 'nowrap',
                }}
              >
                {t === 'all' ? 'All' : (cfg?.label || t)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 48, color: 'var(--text-muted)', fontSize: 13 }}>
            <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
            Loading transactions…
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 56, color: 'var(--text-muted)', fontSize: 13 }}>
            {search || typeFilter !== 'all' ? (
              'No transactions match your filters.'
            ) : (
              <>
                <ArrowRightLeft size={34} style={{ marginBottom: 12, opacity: 0.25, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>No transactions yet</div>
                <div style={{ fontSize: 12 }}>Click "Add Transaction" to record your first trade or transfer.</div>
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--divider-1)' }}>
                  {['Date', 'Type', 'From', 'To', 'USD Value', 'Notes / Tags', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '9px 14px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        whiteSpace: 'nowrap',
                        background: 'var(--shell-bg)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr
                    key={tx._id}
                    style={{
                      borderBottom: i < transactions.length - 1 ? '1px solid var(--divider-2)' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--shell-bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Date */}
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {formatDate(tx.date)}
                    </td>
                    {/* Type */}
                    <td style={{ padding: '10px 14px' }}>
                      <TypeBadge type={tx.type} />
                    </td>
                    {/* From */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {tx.fromAmount != null ? (
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                          {Number(tx.fromAmount).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
                          {tx.fromAsset && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 11, fontWeight: 400 }}>
                              {tx.fromAsset.toUpperCase()}
                            </span>
                          )}
                        </span>
                      ) : (tx.fromAsset || <span style={{ color: 'var(--text-muted)' }}>—</span>)}
                    </td>
                    {/* To */}
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {tx.toAmount != null ? (
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                          {Number(tx.toAmount).toLocaleString('en-IN', { maximumFractionDigits: 6 })}
                          {tx.toAsset && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontSize: 11, fontWeight: 400 }}>
                              {tx.toAsset.toUpperCase()}
                            </span>
                          )}
                        </span>
                      ) : (tx.toAsset || <span style={{ color: 'var(--text-muted)' }}>—</span>)}
                    </td>
                    {/* Value USD */}
                    <td style={{ padding: '10px 14px', fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {tx.valueUSD != null
                        ? `$${Number(tx.valueUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    {/* Notes / Tags */}
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {tx.notes || (tx.tags?.length ? tx.tags.join(', ') : <span style={{ color: 'var(--divider-1)' }}>—</span>)}
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '10px 10px 10px 4px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button
                          onClick={() => { setTxToEdit(tx); setIsModalOpen(true); }}
                          title="Edit"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 5, borderRadius: 7, display: 'flex', transition: 'color 0.13s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => promptDelete(tx)}
                          title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 5, borderRadius: 7, display: 'flex', transition: 'color 0.13s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--negative)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderTop: '1px solid var(--divider-1)', fontSize: 12,
          }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Page {page} of {totalPages} · {total} records
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: '4px 12px', borderRadius: 8,
                  border: '1px solid var(--card-border)',
                  background: 'var(--shell-bg)', color: 'var(--text-secondary)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.4 : 1,
                  fontFamily: 'inherit', fontSize: 12,
                }}
              >
                ← Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '4px 12px', borderRadius: 8,
                  border: '1px solid var(--card-border)',
                  background: 'var(--shell-bg)', color: 'var(--text-secondary)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.4 : 1,
                  fontFamily: 'inherit', fontSize: 12,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTxToEdit(null); }}
        onSave={handleSave}
        txToEdit={txToEdit}
        wallets={wallets}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setTxToDelete(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        itemDescription={
          txToDelete
            ? `${txToDelete.type.toUpperCase()}${txToDelete.fromAsset ? ` : ${txToDelete.fromAmount ?? ''} ${txToDelete.fromAsset}` : ''}${txToDelete.toAsset ? ` → ${txToDelete.toAmount ?? ''} ${txToDelete.toAsset}` : ''}`
            : ''
        }
      />
    </div>
  );
}
