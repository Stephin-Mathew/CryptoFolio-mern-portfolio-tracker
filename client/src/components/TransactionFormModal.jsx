import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const TRANSACTION_TYPES = [
  { value: 'buy',          label: 'Buy',          emoji: '🟢' },
  { value: 'sell',         label: 'Sell',         emoji: '🔴' },
  { value: 'swap',         label: 'Swap',         emoji: '🟡' },
  { value: 'transfer_in',  label: 'Transfer In',  emoji: '📥' },
  { value: 'transfer_out', label: 'Transfer Out', emoji: '📤' },
  { value: 'deposit',      label: 'Deposit',      emoji: '💰' },
  { value: 'withdrawal',   label: 'Withdrawal',   emoji: '💸' },
  { value: 'long',         label: 'Long',         emoji: '📈' },
  { value: 'short',        label: 'Short',        emoji: '📉' },
  { value: 'note',         label: 'Note',         emoji: '📝' },
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

export function TransactionFormModal({ isOpen, onClose, onSave, txToEdit, wallets = [] }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, date: toLocalDatetimeStr() });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (txToEdit) {
      setForm({
        date:         toLocalDatetimeStr(txToEdit.date),
        type:         txToEdit.type || 'buy',
        fromAsset:    txToEdit.fromAsset || '',
        fromAmount:   txToEdit.fromAmount != null ? String(txToEdit.fromAmount) : '',
        fromWalletId: txToEdit.fromWalletId ? String(txToEdit.fromWalletId) : '',
        toAsset:      txToEdit.toAsset || '',
        toAmount:     txToEdit.toAmount != null ? String(txToEdit.toAmount) : '',
        toWalletId:   txToEdit.toWalletId ? String(txToEdit.toWalletId) : '',
        valueUSD:     txToEdit.valueUSD != null ? String(txToEdit.valueUSD) : '',
        notes:        txToEdit.notes || '',
        tags:         (txToEdit.tags || []).join(', '),
        syncBalances: txToEdit.syncBalances !== false,
      });
    } else {
      setForm({ ...EMPTY_FORM, date: toLocalDatetimeStr() });
    }
    setError('');
  }, [isOpen, txToEdit]);

  if (!isOpen) return null;

  const set = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.type) { setError('Please select a transaction type'); return; }
    if (!form.date) { setError('Please enter a date'); return; }

    const payload = {
      date:         new Date(form.date).toISOString(),
      type:         form.type,
      fromAsset:    form.fromAsset.trim().toUpperCase() || null,
      fromAmount:   form.fromAmount !== '' ? Number(form.fromAmount) : null,
      fromWalletId: form.fromWalletId || null,
      toAsset:      form.toAsset.trim().toUpperCase() || null,
      toAmount:     form.toAmount !== '' ? Number(form.toAmount) : null,
      toWalletId:   form.toWalletId || null,
      valueUSD:     form.valueUSD !== '' ? Number(form.valueUSD) : null,
      notes:        form.notes.trim(),
      tags:         form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      syncBalances: Boolean(form.syncBalances),
    };

    setSubmitting(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save transaction');
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
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
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

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            {txToEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            {txToEdit
              ? 'Update this transaction record'
              : 'Record a trade, transfer, conversion, or financial event'}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Date + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date & Time *</label>
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

          {/* FROM */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--negative)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              📤 From (what you gave up)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Asset / Currency</label>
                <input
                  type="text"
                  placeholder="e.g. USDT, INR, BTC"
                  value={form.fromAsset}
                  onChange={(e) => set('fromAsset', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Amount</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.fromAmount}
                  onChange={(e) => set('fromAmount', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            {wallets.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <label style={labelStyle}>From Wallet (optional)</label>
                <select
                  value={form.fromWalletId}
                  onChange={(e) => set('fromWalletId', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">— None —</option>
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* TO */}
          <div style={sectionStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              📥 To (what you received)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Asset / Currency</label>
                <input
                  type="text"
                  placeholder="e.g. INR, NVDA, USDC"
                  value={form.toAsset}
                  onChange={(e) => set('toAsset', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Amount</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.toAmount}
                  onChange={(e) => set('toAmount', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            {wallets.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <label style={labelStyle}>To Wallet (optional)</label>
                <select
                  value={form.toWalletId}
                  onChange={(e) => set('toWalletId', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">— None —</option>
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* USD Value + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>USD Value (optional)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="Total value at time of trade"
                value={form.valueUSD}
                onChange={(e) => set('valueUSD', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. dca, tax-event, staking"
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
              placeholder="e.g. Sold on Binance, added to GPay. Rate was ₹82.5/USDT."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
            />
          </div>

          {/* Two-Way Balance Sync Toggle */}
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
              disabled={submitting}
              className="btn-primary"
              style={{ minHeight: 38, padding: '0 18px', fontSize: 13, borderRadius: 10, opacity: submitting ? 0.6 : 1, gap: 6 }}
            >
              <Save size={15} />
              {submitting ? 'Saving…' : txToEdit ? 'Update' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
