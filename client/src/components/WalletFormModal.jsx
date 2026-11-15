import React, { useState, useEffect } from 'react';
import { X, Wallet, Coins, Shield, CreditCard, Landmark, Vault, Palette, IndianRupee } from 'lucide-react';

const WALLET_TYPES = [
  { id: 'crypto', label: 'Crypto Wallet / Web3', icon: Coins },
  { id: 'stock', label: 'Stock Brokerage', icon: Landmark },
  { id: 'exchange', label: 'Exchange Account', icon: Wallet },
  { id: 'bank', label: 'Bank Account', icon: CreditCard },
  { id: 'cash', label: 'Cash / INR', icon: IndianRupee },
  { id: 'other', label: 'Custom / Other', icon: Vault },
];

const PRESET_COLORS = [
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
];

const ICON_OPTIONS = [
  { id: 'wallet', label: 'Wallet', Icon: Wallet },
  { id: 'coins', label: 'Coins', Icon: Coins },
  { id: 'shield', label: 'Shield', Icon: Shield },
  { id: 'credit-card', label: 'Card', Icon: CreditCard },
  { id: 'landmark', label: 'Bank', Icon: Landmark },
  { id: 'vault', label: 'Vault', Icon: Vault },
  { id: 'rupee', label: 'Rupee', Icon: IndianRupee },
];

export const WalletFormModal = ({ isOpen, onClose, onSave, walletToEdit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('crypto');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [icon, setIcon] = useState('wallet');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (walletToEdit) {
      setName(walletToEdit.name || '');
      setType(walletToEdit.type || 'crypto');
      setDescription(walletToEdit.description || '');
      setColor(walletToEdit.color || '#06b6d4');
      setIcon(walletToEdit.icon || 'wallet');
    } else {
      setName('');
      setType('crypto');
      setDescription('');
      setColor('#06b6d4');
      setIcon('wallet');
    }
    setError('');
  }, [walletToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a wallet name');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        type,
        description: description.trim(),
        color,
        icon,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save wallet');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--panel-bg)] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top color accent strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: '16px 16px 0 0',
            backgroundColor: color,
            transition: 'background-color 0.2s',
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--divider-1)]">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: `${color}25`, borderColor: `${color}50`, borderWidth: 1 }}
            >
              <Wallet className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {walletToEdit ? 'Edit Wallet' : 'Add New Wallet'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">Manage individual portfolio accounts & wallets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--negative-bg)] border border-[var(--negative)]/20 text-[var(--negative)] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wallet Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Wallet / Account Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Binance Hot Wallet, Zerodha, Ledger, Robinhood"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm outline-none focus:border-[var(--text-primary)] transition"
              required
            />
          </div>

          {/* Wallet Type */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Wallet Category / Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WALLET_TYPES.map((item) => {
                const TypeIcon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id);
                      if (item.id === 'cash') {
                        setIcon('rupee');
                        setColor('#10b981');
                      }
                    }}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--shell-bg)] border-[var(--text-primary)] text-[var(--text-primary)] font-bold shadow-xs'
                        : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)]'
                    }`}
                  >
                    <TypeIcon className="w-4 h-4" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash wallet hint */}
          {type === 'cash' && (
            <div className="p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] text-xs leading-relaxed">
              💰 <strong>Cash / INR Wallet:</strong> A dedicated space to track your INR cash across different locations — purse, Google Pay, PhonePe, Paytm, savings account, FD, and more.
            </div>
          )}

          {/* Color Accent Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Theme Accent Color</span>
            </label>
            <div className="flex items-center space-x-2.5">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 rounded-full border-2 transition transform hover:scale-110 cursor-pointer ${
                    color === hex ? 'border-[var(--text-primary)] scale-110 ring-2 ring-[var(--text-primary)]/20 shadow-xs' : 'border-transparent opacity-85'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Wallet Icon
            </label>
            <div className="flex items-center space-x-2">
              {ICON_OPTIONS.map((item) => {
                const ItemIcon = item.Icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--shell-bg)] border-[var(--text-primary)] text-[var(--text-primary)] font-bold shadow-xs'
                        : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)]'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Staking wallet, long term hold, Zerodha account"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-xs outline-none focus:border-[var(--text-primary)] transition"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-[var(--divider-1)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary min-h-[38px] px-5 text-xs font-semibold rounded-xl disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? 'Saving…' : walletToEdit ? 'Save Changes' : 'Create Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
