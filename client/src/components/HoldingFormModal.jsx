import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Coins, TrendingUp, DollarSign, Wallet, Layers, Search, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/axiosInstance';

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export const HoldingFormModal = ({ isOpen, onClose, onSave, holdingToEdit, wallets = [], targetWalletId = '' }) => {
  const [formData, setFormData] = useState({
    assetType: 'crypto',
    symbol: '',
    quantity: '',
    avgBuyPrice: '',
    walletId: '',
    walletOrAccount: '',
    notes: '',
    mfSchemeCode: null,
    mfSchemeName: null,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mutual fund scheme search state
  const [mfQuery, setMfQuery] = useState('');
  const [mfResults, setMfResults] = useState([]);
  const [mfSearching, setMfSearching] = useState(false);
  const [mfDropdownOpen, setMfDropdownOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null); // { schemeCode, schemeName }
  const mfDropdownRef = useRef(null);

  const debouncedMfQuery = useDebounce(mfQuery, 350);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (mfDropdownRef.current && !mfDropdownRef.current.contains(e.target)) {
        setMfDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch MF search results when query changes
  useEffect(() => {
    if (formData.assetType !== 'mutual_fund' || debouncedMfQuery.length < 2) {
      setMfResults([]);
      setMfDropdownOpen(false);
      return;
    }
    let cancelled = false;
    setMfSearching(true);
    api.get('/prices/mf/search', { params: { q: debouncedMfQuery } })
      .then((res) => {
        if (!cancelled) {
          setMfResults(res.data.results || []);
          setMfDropdownOpen(true);
          setMfSearching(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMfResults([]);
          setMfSearching(false);
        }
      });
    return () => { cancelled = true; };
  }, [debouncedMfQuery, formData.assetType]);

  useEffect(() => {
    if (holdingToEdit) {
      let dest = holdingToEdit.walletOrAccount || '';
      let userNote = holdingToEdit.notes || '';
      if (!dest && holdingToEdit.assetType === 'cash' && holdingToEdit.notes) {
        const m = holdingToEdit.notes.match(/^location:([^|\n]+?)(?:\s\|\s(.*))?$/);
        if (m) {
          dest = m[1].trim();
          userNote = m[2] ? m[2].trim() : '';
        }
      }

      setFormData({
        assetType: holdingToEdit.assetType || 'crypto',
        symbol: holdingToEdit.symbol || '',
        quantity: holdingToEdit.quantity !== undefined ? holdingToEdit.quantity : '',
        avgBuyPrice: holdingToEdit.avgBuyPrice !== undefined ? holdingToEdit.avgBuyPrice : '',
        walletId: holdingToEdit.walletId ? String(holdingToEdit.walletId) : '',
        walletOrAccount: dest,
        notes: userNote,
        mfSchemeCode: holdingToEdit.mfSchemeCode || null,
        mfSchemeName: holdingToEdit.mfSchemeName || null,
      });
      if (holdingToEdit.assetType === 'mutual_fund' && holdingToEdit.mfSchemeCode) {
        const scheme = { schemeCode: holdingToEdit.mfSchemeCode, schemeName: holdingToEdit.mfSchemeName || holdingToEdit.symbol };
        setSelectedScheme(scheme);
        setMfQuery(scheme.schemeName || '');
      }
    } else {
      setFormData({
        assetType: 'crypto',
        symbol: '',
        quantity: '',
        avgBuyPrice: '',
        walletId: targetWalletId || '',
        walletOrAccount: '',
        notes: '',
        mfSchemeCode: null,
        mfSchemeName: null,
      });
      setSelectedScheme(null);
      setMfQuery('');
    }
    setError('');
    setMfResults([]);
    setMfDropdownOpen(false);
  }, [holdingToEdit, isOpen, targetWalletId]);

  if (!isOpen) return null;

  const handleAssetTypeChange = (type) => {
    let nextSymbol = formData.symbol;
    if (type === 'cash') {
      nextSymbol = 'INR';
    } else if (formData.assetType === 'cash' && nextSymbol === 'INR') {
      nextSymbol = '';
    }
    let nextWalletId = formData.walletId;
    if (type === 'cash' && !nextWalletId && wallets && wallets.length > 0) {
      const cashWallet = wallets.find((w) => w.type === 'cash');
      if (cashWallet) nextWalletId = cashWallet._id;
    }

    setFormData({
      ...formData,
      assetType: type,
      symbol: nextSymbol,
      walletId: nextWalletId,
      mfSchemeCode: null,
      mfSchemeName: null,
    });
    setSelectedScheme(null);
    setMfQuery('');
    setMfResults([]);
    setMfDropdownOpen(false);
  };

  const handleSelectScheme = (scheme) => {
    setSelectedScheme(scheme);
    setMfQuery(scheme.schemeName);
    // Use scheme code as symbol for MF holdings (routed to MFapi.in on backend)
    setFormData((prev) => ({
      ...prev,
      symbol: scheme.schemeCode,          // numeric code → backend routes to MFapi.in
      mfSchemeCode: scheme.schemeCode,
      mfSchemeName: scheme.schemeName,
    }));
    setMfDropdownOpen(false);
    setMfResults([]);
  };

  const handleClearScheme = () => {
    setSelectedScheme(null);
    setMfQuery('');
    setFormData((prev) => ({ ...prev, symbol: '', mfSchemeCode: null, mfSchemeName: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.assetType === 'mutual_fund') {
      if (!selectedScheme && !formData.mfSchemeCode) {
        setError('Please search and select a mutual fund scheme from the dropdown');
        return;
      }
    } else if (formData.assetType === 'cash') {
      if (!formData.walletOrAccount?.trim()) {
        setError('Please enter where this cash is held (e.g. Purse, Google Pay, HDFC Account)');
        return;
      }
    } else if (!formData.symbol.trim()) {
      setError('Please enter an asset symbol or fund name (e.g., BTC, AAPL, CANBK)');
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Please enter a positive quantity / amount');
      return;
    }

    if ((formData.assetType === 'stock' || formData.assetType === 'mutual_fund') && (!formData.avgBuyPrice || Number(formData.avgBuyPrice) < 0)) {
      setError(`Please enter a valid purchase price / NAV for ${formData.assetType === 'mutual_fund' ? 'mutual fund' : 'stock'} holdings`);
      return;
    }

    const trimmedDest = (formData.walletOrAccount || '').trim();
    const finalNotes = (formData.assetType === 'cash' && trimmedDest)
      ? (formData.notes?.trim() ? `location:${trimmedDest} | ${formData.notes.trim()}` : `location:${trimmedDest}`)
      : formData.notes?.trim() || '';

    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        symbol: (formData.symbol || 'INR').trim().toUpperCase(),
        quantity: Number(formData.quantity),
        walletId: formData.walletId || null,
        walletOrAccount: trimmedDest,
        notes: finalNotes,
        currency: formData.assetType === 'cash' ? (formData.symbol?.trim().toUpperCase() || 'INR') : undefined,
        avgBuyPrice:
          (formData.assetType === 'stock' || formData.assetType === 'mutual_fund')
            ? formData.avgBuyPrice
              ? Number(formData.avgBuyPrice)
              : 0
            : null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save holding');
    } finally {
      setSubmitting(false);
    }
  };

  const isMutualFund = formData.assetType === 'mutual_fund';

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--card-border)] bg-[var(--panel-bg)] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-5">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
            {holdingToEdit ? 'Edit Asset Holding' : 'Add New Asset Holding'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {holdingToEdit ? 'Update details of your existing portfolio entry' : 'Record a cryptocurrency, stock, mutual fund, or cash balance'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--negative-bg)] border border-[var(--negative)]/20 text-[var(--negative)] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Asset Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'crypto', label: 'Crypto', icon: Coins },
                { type: 'stock', label: 'Stock / ETF', icon: TrendingUp },
                { type: 'mutual_fund', label: 'Mutual Fund', icon: Layers },
                { type: 'cash', label: 'Cash', icon: DollarSign },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleAssetTypeChange(type)}
                  className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    formData.assetType === type
                      ? 'bg-[var(--shell-bg)] border-[var(--text-primary)] text-[var(--text-primary)] font-bold shadow-xs'
                      : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Asset-specific info hints */}
          {formData.assetType === 'crypto' && (
            <div className="p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] text-xs leading-relaxed">
              💡 <strong>Market &amp; Time-Based PnL:</strong> Crypto performance is automatically calculated from historical intervals — no buy price needed, perfectly tracking airdrops, rewards, and transfers.
            </div>
          )}
          {formData.assetType === 'stock' && (
            <div className="p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] text-xs leading-relaxed">
              📈 <strong>Yahoo Finance:</strong> Live prices are fetched automatically via Yahoo Finance. Use standard exchange tickers (e.g. <code className="font-mono text-[var(--text-primary)]">AAPL</code>, <code className="font-mono text-[var(--text-primary)]">RELIANCE.NS</code>, <code className="font-mono text-[var(--text-primary)]">TCS.BO</code>).
            </div>
          )}
          {formData.assetType === 'mutual_fund' && (
            <div className="p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] text-xs leading-relaxed">
              🏦 <strong>MFapi.in (Live NAV):</strong> Search for your Indian mutual fund scheme below. The latest NAV is fetched daily from AMFI via MFapi.in — free, automated, and accurate.
            </div>
          )}
          {formData.assetType === 'cash' && (
            <div className="p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] text-xs leading-relaxed">
              💵 <strong>INR Cash:</strong> Record your physical or digital cash (e.g. Purse, Google Pay, Bank Account). Enter the destination to organize your balances.
            </div>
          )}

          {/* ── Mutual Fund Scheme Search ─────────────────────────────────── */}
          {isMutualFund && (
            <div ref={mfDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Search Mutual Fund Scheme *
              </label>

              {selectedScheme ? (
                /* Selected scheme chip */
                <div className="flex items-start justify-between p-3 rounded-xl bg-[var(--shell-bg)] border border-[var(--card-border)]">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center space-x-1.5 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--positive)] flex-shrink-0" />
                      <span className="text-xs font-semibold text-[var(--positive)]">Scheme Selected</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">{selectedScheme.schemeName}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">Code: {selectedScheme.schemeCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearScheme}
                    className="p-1.5 rounded-lg hover:bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--negative)] transition flex-shrink-0 cursor-pointer"
                    title="Change scheme"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Search input */
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    {mfSearching
                      ? <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
                      : <Search className="w-4 h-4 text-[var(--text-muted)]" />
                    }
                  </div>
                  <input
                    type="text"
                    placeholder="Type fund name, e.g. Parag Parikh, Mirae, SBI Bluechip…"
                    value={mfQuery}
                    onChange={(e) => setMfQuery(e.target.value)}
                    onFocus={() => mfResults.length > 0 && setMfDropdownOpen(true)}
                    className="w-full rounded-xl pl-9 pr-3.5 py-2.5 text-xs bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--text-primary)] transition"
                    autoComplete="off"
                  />
                </div>
              )}

              {/* Search results dropdown */}
              {mfDropdownOpen && mfResults.length > 0 && !selectedScheme && (
                <div className="absolute z-50 w-full mt-1 rounded-xl border border-[var(--card-border)] bg-[var(--panel-bg)] shadow-2xl max-h-56 overflow-y-auto">
                  {mfResults.slice(0, 20).map((scheme) => (
                    <button
                      type="button"
                      key={scheme.schemeCode}
                      onClick={() => handleSelectScheme(scheme)}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--shell-bg)] transition border-b border-[var(--divider-1)] last:border-0 group cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug transition">
                        {scheme.schemeName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">Code: {scheme.schemeCode}</p>
                    </button>
                  ))}
                  {mfResults.length > 20 && (
                    <div className="px-4 py-2 text-xs text-[var(--text-muted)] text-center">
                      Showing top 20 of {mfResults.length} results — refine your search
                    </div>
                  )}
                </div>
              )}

              {mfDropdownOpen && !mfSearching && mfResults.length === 0 && mfQuery.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 rounded-xl border border-[var(--card-border)] bg-[var(--panel-bg)] shadow-xl p-4 text-center">
                  <p className="text-xs text-[var(--text-muted)]">No schemes found for "<strong>{mfQuery}</strong>"</p>
                </div>
              )}
            </div>
          )}

          {/* ── Cash Inputs ──────────────────────────────────────────────── */}
          {formData.assetType === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Cash Destination / Where is it held? *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Purse, Google Pay, HDFC Savings, Locker, Drawer…"
                  value={formData.walletOrAccount}
                  onChange={(e) => setFormData({ ...formData, walletOrAccount: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--text-primary)] transition"
                  autoFocus
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={formData.symbol || 'INR'}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition"
                    placeholder="INR"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-xs font-bold text-[var(--text-muted)] pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 5000"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full rounded-xl pl-8 pr-3.5 py-2.5 text-xs font-mono font-bold bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Symbol & Quantity Grid (Crypto & Stock) ───────────────────── */}
          {!isMutualFund && formData.assetType !== 'cash' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Asset Ticker / Symbol *
                </label>
                <input
                  type="text"
                  placeholder={formData.assetType === 'stock' ? 'e.g. AAPL, RELIANCE.NS' : 'e.g. BTC, ETH, SOL'}
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs uppercase font-mono font-bold bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--text-primary)] transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs font-mono bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition"
                  required
                />
              </div>
            </div>
          )}

          {/* Quantity for Mutual Funds (separate row, full width) */}
          {isMutualFund && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Units Held *
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 245.678"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs font-mono bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition"
                required
              />
            </div>
          )}

          {/* Stock & Mutual Fund: Avg Buy Price */}
          {(formData.assetType === 'stock' || formData.assetType === 'mutual_fund') && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                {formData.assetType === 'mutual_fund' ? 'Avg Purchase NAV (₹) *' : 'Avg Buy Price (USD / ₹) *'}
              </label>
              <input
                type="number"
                step="any"
                placeholder={formData.assetType === 'mutual_fund' ? 'e.g. 85.50' : 'e.g. 185.50'}
                value={formData.avgBuyPrice}
                onChange={(e) => setFormData({ ...formData, avgBuyPrice: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs font-mono bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] transition"
                required
              />
              {formData.assetType === 'mutual_fund' && (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Enter the average NAV per unit at the time of purchase (in ₹). Current NAV is fetched live.
                </p>
              )}
            </div>
          )}

          {/* Destination Wallet */}
          {wallets && wallets.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                <Wallet className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>Destination Wallet / Account</span>
              </label>
              <select
                value={formData.walletId}
                onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs font-medium bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
              >
                <option value="" className="bg-[var(--panel-bg)] text-[var(--text-primary)]">None (Unassigned / General Portfolio)</option>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id} className="bg-[var(--panel-bg)] text-[var(--text-primary)]">
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. SIP, Staked on Ledger, Yield pool"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-[var(--shell-bg)] border border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--text-primary)] transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--divider-1)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--shell-bg)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (isMutualFund && !selectedScheme && !formData.mfSchemeCode)}
              className="btn-primary min-h-[38px] px-5 text-xs font-semibold rounded-xl disabled:opacity-50 transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-[var(--btn-primary-text)]" />
              <span>{submitting ? 'Saving...' : holdingToEdit ? 'Update Holding' : 'Save Holding'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
