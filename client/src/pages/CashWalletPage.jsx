import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWallets } from '../context/WalletContext';
import {
  ArrowLeft, Plus, Edit2, Trash2, IndianRupee, Wallet,
  Banknote, Smartphone, PiggyBank, CreditCard, MoreHorizontal,
  TrendingUp, X, Save,
} from 'lucide-react';
import api from '../api/axiosInstance';

// ─── Color palette for dynamically styled destinations ────────────────
const DESTINATION_PALETTE = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#e11d48', // rose
];

// Helper: resolve icon and color dynamically based on destination text
function getDestinationMeta(destinationName = '') {
  const norm = String(destinationName || '').toLowerCase().trim();
  let Icon = Banknote;

  if (
    norm.includes('pay') ||
    norm.includes('gpay') ||
    norm.includes('phonepe') ||
    norm.includes('paytm') ||
    norm.includes('upi') ||
    norm.includes('app') ||
    norm.includes('digital')
  ) {
    Icon = Smartphone;
  } else if (
    norm.includes('bank') ||
    norm.includes('saving') ||
    norm.includes('account') ||
    norm.includes('current') ||
    norm.includes('sbi') ||
    norm.includes('hdfc') ||
    norm.includes('icici') ||
    norm.includes('axis') ||
    norm.includes('kotak')
  ) {
    Icon = PiggyBank;
  } else if (norm.includes('card') || norm.includes('credit') || norm.includes('debit')) {
    Icon = CreditCard;
  } else if (norm.includes('fd') || norm.includes('deposit') || norm.includes('interest')) {
    Icon = TrendingUp;
  } else if (
    norm.includes('safe') ||
    norm.includes('locker') ||
    norm.includes('vault') ||
    norm.includes('box')
  ) {
    Icon = Vault;
  } else if (
    norm.includes('purse') ||
    norm.includes('wallet') ||
    norm.includes('pocket') ||
    norm.includes('drawer') ||
    norm.includes('cash') ||
    norm.includes('hand')
  ) {
    Icon = Banknote;
  } else {
    Icon = MoreHorizontal;
  }

  // Consistent vibrant color hash
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = DESTINATION_PALETTE[Math.abs(hash) % DESTINATION_PALETTE.length];

  return {
    icon: Icon,
    color,
    label: destinationName?.trim() || 'General Cash',
  };
}

// ─── Decode destination and note from holding ──────────────────────────
function decodeEntry(holding) {
  // 1. Direct walletOrAccount field
  if (holding.walletOrAccount && holding.walletOrAccount.trim()) {
    return {
      destination: holding.walletOrAccount.trim(),
      userNote: holding.notes ? holding.notes.replace(/^location:[^|]+(\|\s*)?/, '').trim() : '',
    };
  }

  // 2. Encoded notes: location:<destination> | <notes>
  const noteStr = holding.notes || '';
  const locMatch = noteStr.match(/^location:([^|\n]+?)(?:\s\|\s(.*))?$/);
  if (locMatch) {
    const rawLoc = locMatch[1].trim();
    const legacyMap = {
      purse: 'Purse / Wallet',
      gpay: 'Google Pay',
      phonepe: 'PhonePe',
      paytm: 'Paytm',
      savings: 'Savings Account',
      current: 'Current Account',
      fd: 'Fixed Deposit',
      other: 'Other Cash',
    };
    return {
      destination: legacyMap[rawLoc] || rawLoc,
      userNote: locMatch[2] ? locMatch[2].trim() : '',
    };
  }

  return {
    destination: 'Purse / Cash in Hand',
    userNote: noteStr,
  };
}

// ─── Add / Edit Cash Modal ─────────────────────────────────────────────
function CashEntryModal({ isOpen, onClose, onSave, entryToEdit, walletId, existingDestinations = [] }) {
  const [destination, setDestination] = useState('');
  const [amount, setAmount]           = useState('');
  const [notes, setNotes]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  React.useEffect(() => {
    if (entryToEdit) {
      setAmount(entryToEdit.quantity ?? '');
      const { destination: dest, userNote } = decodeEntry(entryToEdit);
      setDestination(dest);
      setNotes(userNote);
    } else {
      setAmount('');
      setDestination('');
      setNotes('');
    }
    setError('');
  }, [entryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedDest = destination.trim();
    if (!trimmedDest) {
      setError('Please enter where this cash is held (e.g. Purse, Google Pay, HDFC Account)');
      return;
    }

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount (> 0)');
      return;
    }

    const notesEncoded = notes.trim()
      ? `location:${trimmedDest} | ${notes.trim()}`
      : `location:${trimmedDest}`;

    setSubmitting(true);
    try {
      await onSave({
        assetType: 'cash',
        symbol: 'INR',
        quantity: amt,
        walletId,
        walletOrAccount: trimmedDest,
        notes: notesEncoded,
        currency: 'INR',
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cash entry');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = getDestinationMeta(destination || 'Cash');
  const DestinationIcon = meta.icon;

  // Helpful quick suggestion pills (user's existing destinations + common starters)
  const defaultSuggestions = ['Purse', 'Google Pay', 'PhonePe', 'Bank Savings', 'Home Locker'];
  const suggestionList = Array.from(new Set([...existingDestinations, ...defaultSuggestions])).slice(0, 6);

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 440, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl" style={{ backgroundColor: meta.color }} />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl dark:bg-slate-900/60 bg-slate-100 dark:hover:bg-slate-800 hover:bg-slate-200 border dark:border-slate-800 border-slate-300 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6 flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
            style={{ backgroundColor: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
          >
            <DestinationIcon className="w-5 h-5 transition-all" style={{ color: meta.color }} />
          </div>
          <div>
            <h2 className="text-lg font-bold dark:text-white text-slate-900 font-heading">
              {entryToEdit ? 'Edit Cash Entry' : 'Add Cash Balance'}
            </h2>
            <p className="text-xs dark:text-slate-400 text-slate-500">
              Record your INR cash and where you are holding it
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination input */}
          <div>
            <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase mb-1 flex items-center justify-between">
              <span>Where is this cash? (Destination) *</span>
              {destination.trim() && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${meta.color}20`, color: meta.color }}>
                  {meta.label}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Purse, Google Pay, HDFC Savings, Locker, Drawer…"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                autoFocus
                required
              />
            </div>

            {/* Quick destination suggestion pills */}
            <div className="mt-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Quick Suggestions:</div>
              <div className="flex flex-wrap gap-1.5">
                {suggestionList.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setDestination(sug)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      destination.trim().toLowerCase() === sug.toLowerCase()
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'dark:bg-slate-900/60 bg-slate-100 dark:border-slate-800 border-slate-300 dark:text-slate-400 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase mb-1">
              Amount (INR) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-sm font-bold dark:text-slate-400 text-slate-500 pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full glass-input rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold dark:text-slate-300 text-slate-700 uppercase mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Emergency fund, monthly budget, petty cash…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t dark:border-slate-800 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border dark:border-slate-700 border-slate-300 dark:hover:bg-slate-800 hover:bg-slate-200 dark:text-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 15px #10b98130' }}
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving…' : entryToEdit ? 'Update Entry' : 'Add Cash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────
export const CashWalletPage = ({
  holdings,
  onDeleteHolding,
  onOpenEditWallet,
  onDeleteWallet,
  onClearWalletHoldings,
  showToast,
  onHoldingAdded,
  onHoldingUpdated,
}) => {
  const { id } = useParams();
  const { wallets, loading: walletsLoading } = useWallets();

  const wallet = wallets.find((w) => w._id === id);

  const cashHoldings = useMemo(
    () => holdings.filter((h) => h.walletId && h.walletId.toString() === id && h.assetType === 'cash'),
    [holdings, id]
  );

  const totalINR = useMemo(() => cashHoldings.reduce((sum, h) => sum + (Number(h.quantity) || 0), 0), [cashHoldings]);

  // Group by user-entered destination string
  const grouped = useMemo(() => {
    const groups = {};
    cashHoldings.forEach((h) => {
      const { destination } = decodeEntry(h);
      const key = destination?.trim() || 'General Cash';
      if (!groups[key]) groups[key] = [];
      groups[key].push(h);
    });
    return groups;
  }, [cashHoldings]);

  // Unique list of destinations already entered by user in this wallet
  const existingDestinations = useMemo(() => {
    return Object.keys(grouped);
  }, [grouped]);

  const [modalOpen, setModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n || 0);

  const handleSaveEntry = async (formData) => {
    if (entryToEdit) {
      const res = await api.patch(`/holdings/${entryToEdit._id}`, formData);
      if (onHoldingUpdated) onHoldingUpdated(res.data.holding);
      if (showToast) showToast('Cash entry updated', 'success');
    } else {
      const res = await api.post('/holdings', formData);
      if (onHoldingAdded) onHoldingAdded(res.data.holding);
      if (showToast) showToast('Cash balance added', 'success');
    }
  };

  const openAdd = () => { setEntryToEdit(null); setModalOpen(true); };
  const openEdit = (h) => { setEntryToEdit(h); setModalOpen(true); };

  const handleDeleteWallet = () => {
    if (!wallet) return;
    if (onDeleteWallet) onDeleteWallet(wallet, cashHoldings.length);
  };

  if (walletsLoading) {
    return (
      <div className="page-container cash-wallet-page">
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card shimmer" style={{ height: 130 }} />
          <div className="card shimmer" style={{ height: 260 }} />
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="page-container cash-wallet-page">
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 480, margin: '0 auto' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--negative-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Wallet size={22} color="var(--negative)" />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Wallet Not Found</h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--text-muted)' }}>The requested wallet does not exist or has been deleted.</p>
            <Link to="/wallets" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
              <ArrowLeft size={14} />
              Back to Wallets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const accentColor = wallet.color || '#10b981';

  return (
    <div className="page-container cash-wallet-page">
      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              to="/wallets"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 11px', borderRadius: 8,
                border: '1px solid var(--card-border)', background: 'var(--card-bg)',
                fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                textDecoration: 'none', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <ArrowLeft size={13} />
              Back to Wallets
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => onOpenEditWallet && onOpenEditWallet(wallet)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 8,
                border: '1px solid var(--card-border)', background: 'var(--card-bg)',
                fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
                cursor: 'pointer', transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Edit2 size={12} />
              Edit Wallet
            </button>
            <button
              onClick={handleDeleteWallet}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 8,
                border: '1px solid var(--negative-bg)', background: 'var(--negative-bg)',
                fontSize: 12, fontWeight: 500, color: 'var(--negative)',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 3, background: accentColor }} />

          {/* Row 1 — Identity + Add Action */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, flexWrap: 'wrap',
              borderBottom: '1px solid var(--divider-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${accentColor}1a`,
                  border: `1.5px solid ${accentColor}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 2px 12px ${accentColor}18`,
                }}
              >
                <IndianRupee size={22} style={{ color: accentColor }} />
              </div>

              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
                  {wallet.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4, flexWrap: 'wrap' }}>
                  <span className="chip chip-neutral" style={{ fontSize: 10, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                    Cash · INR
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {wallet.description || 'Track your INR cash across different locations'}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={openAdd}
              style={{ minHeight: 36, padding: '0 14px', fontSize: 12, fontWeight: 600, gap: 6, borderRadius: 10, cursor: 'pointer' }}
            >
              <Plus size={15} strokeWidth={2} />
              <span>Add Cash Balance</span>
            </button>
          </div>

          {/* Row 2 — Stats strip */}
          <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px', padding: '14px 20px', borderRight: '1px solid var(--divider-2)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Total Cash</span>
                <IndianRupee size={12} style={{ opacity: 0.5 }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
                {fmt(totalINR)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Across {cashHoldings.length} entr{cashHoldings.length === 1 ? 'y' : 'ies'}
              </div>
            </div>

            <div style={{ flex: '1 1 180px', padding: '14px 20px', borderRight: '1px solid var(--divider-2)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Locations Tracked</span>
                <Banknote size={12} style={{ opacity: 0.5 }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.6px', lineHeight: 1.1 }}>
                {Object.keys(grouped).length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Distinct storage location{Object.keys(grouped).length !== 1 ? 's' : ''}
              </div>
            </div>

            <div style={{ flex: '1 1 180px', padding: '14px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                <span>Currency</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: accentColor, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                INR ₹
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Indian Rupee only
              </div>
            </div>
          </div>
        </div>

        {/* Location Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Cash by Location
              </h2>
              <span className="chip chip-neutral" style={{ fontSize: 11, padding: '1px 7px', fontWeight: 600 }}>
                {cashHoldings.length}
              </span>
            </div>
            {cashHoldings.length > 0 && onClearWalletHoldings && (
              <button
                onClick={() => onClearWalletHoldings(wallet, cashHoldings.length)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 9px', borderRadius: 7,
                  border: '1px solid var(--negative-bg)', background: 'var(--negative-bg)',
                  fontSize: 11, fontWeight: 500, color: 'var(--negative)',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={11} />
                Clear All
              </button>
            )}
          </div>

          {cashHoldings.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${accentColor}18`, border: `1.5px solid ${accentColor}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <IndianRupee size={22} style={{ color: accentColor }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                No Cash Added Yet
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 16px' }}>
                Start tracking your INR cash by adding where you keep it — your purse, Google Pay, savings account, and more.
              </div>
              <button
                className="btn-primary"
                onClick={openAdd}
                style={{ padding: '7px 18px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', margin: '0 auto' }}
              >
                <Plus size={14} strokeWidth={2} style={{ marginRight: 6 }} />
                Add First Cash Entry
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: Object.keys(grouped).length === 1 ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: 12,
              }}
            >
              {Object.entries(grouped)
                .sort(([, a], [, b]) => {
                  const sumA = a.reduce((s, h) => s + Number(h.quantity), 0);
                  const sumB = b.reduce((s, h) => s + Number(h.quantity), 0);
                  return sumB - sumA;
                })
                .map(([destName, entries]) => {
                  const meta = getDestinationMeta(destName);
                  const LocIcon = meta.icon;
                  const locationTotal = entries.reduce((s, h) => s + Number(h.quantity), 0);
                  const pct = totalINR > 0 ? (locationTotal / totalINR) * 100 : 0;

                  return (
                    <div
                      key={destName}
                      className="card"
                      style={{ padding: 0, overflow: 'hidden' }}
                    >
                      {/* Top color bar */}
                      <div style={{ height: 3, backgroundColor: meta.color }} />

                      <div style={{ padding: '14px 18px' }}>
                        {/* Location Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 38, height: 38, borderRadius: 10,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: `${meta.color}1a`, border: `1px solid ${meta.color}35`,
                                flexShrink: 0,
                              }}
                            >
                              <LocIcon size={18} style={{ color: meta.color }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {meta.label}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: meta.color }}>
                              {fmt(locationTotal)}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                              {pct.toFixed(1)}% of total
                            </div>
                          </div>
                        </div>

                        {/* Share bar */}
                        <div style={{ height: 4, width: '100%', background: 'var(--divider-2)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              backgroundColor: meta.color,
                              borderRadius: 2,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>

                        {/* Entries list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {entries.map((h) => {
                            const { userNote } = decodeEntry(h);
                            return (
                              <div
                                key={h._id}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '8px 12px', borderRadius: 9,
                                  background: 'var(--shell-bg)',
                                  border: '1px solid var(--divider-2)',
                                  gap: 10,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                  <IndianRupee size={14} style={{ color: accentColor, flexShrink: 0 }} />
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                                      {fmt(h.quantity)}
                                    </div>
                                    {userNote && (
                                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {userNote}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                  <button
                                    onClick={() => openEdit(h)}
                                    title="Edit"
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      width: 28, height: 28, borderRadius: 7,
                                      border: '1px solid var(--card-border)', background: 'var(--card-bg)',
                                      color: 'var(--text-secondary)', cursor: 'pointer',
                                    }}
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => onDeleteHolding(h)}
                                    title="Delete"
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      width: 28, height: 28, borderRadius: 7,
                                      border: '1px solid var(--negative-bg)', background: 'var(--negative-bg)',
                                      color: 'var(--negative)', cursor: 'pointer',
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Cash Entry Modal */}
        <CashEntryModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEntryToEdit(null); }}
          onSave={handleSaveEntry}
          entryToEdit={entryToEdit}
          walletId={id}
          existingDestinations={existingDestinations}
        />
      </div>
    </div>
  );
};
