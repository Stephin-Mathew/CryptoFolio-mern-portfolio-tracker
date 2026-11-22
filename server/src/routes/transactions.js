import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { Transaction } from '../models/Transaction.js';
import { syncTransactionBalances } from '../services/transactionSyncService.js';
import mongoose from 'mongoose';

const router = express.Router();

// All transactions routes require authentication
router.use(authenticateToken);

/** Convert a timeframe string to a cutoff Date (or null for 'all'). */
function timeframeToCutoff(tf) {
  const days = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[tf] ?? null;
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ── GET /api/transactions ─────────────────────────────────────────────────────
// List transactions with optional search + type filter + date range + pagination.
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, type, from, to, page = 1, limit = 50 } = req.query;

    const filter = { userId };

    if (type && type !== 'all') filter.type = type;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }

    // Regex search across notes + fromAsset + toAsset + tags
    if (search && search.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [
        { notes:     re },
        { fromAsset: re },
        { toAsset:   re },
        { tags:      re },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({ transactions, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('GET /transactions error:', err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// ── GET /api/transactions/chart-markers ──────────────────────────────────────
// Lightweight list filtered by the chart's current timeframe.
// Must be BEFORE /:id so Express doesn't try to match 'chart-markers' as an id.
router.get('/chart-markers', async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = '30d' } = req.query;

    const filter = { userId };
    const cutoff = timeframeToCutoff(timeframe);
    if (cutoff) filter.date = { $gte: cutoff };

    const markers = await Transaction.find(filter)
      .sort({ date: 1 })
      .select('_id date type fromAsset fromAmount toAsset toAmount notes valueUSD chartPinTs')
      .lean();

    res.json({ markers });
  } catch (err) {
    console.error('GET /transactions/chart-markers error:', err);
    res.status(500).json({ message: 'Failed to fetch chart markers' });
  }
});

// ── POST /api/transactions ────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      date, type,
      fromAsset, fromAmount, fromWalletId, fromHoldingId,
      toAsset, toAmount, toWalletId, toHoldingId,
      priceUSD, valueUSD, tags, notes, chartPinTs,
      syncBalances = true,
    } = req.body;

    if (!type) return res.status(400).json({ message: 'type is required' });
    if (!date)  return res.status(400).json({ message: 'date is required' });

    const tx = await Transaction.create({
      userId,
      date:          new Date(date),
      type,
      fromAsset:     fromAsset?.trim() || '',
      fromAmount:    fromAmount   != null ? Number(fromAmount)   : null,
      fromWalletId:  fromWalletId || null,
      fromHoldingId: fromHoldingId || null,
      toAsset:       toAsset?.trim() || '',
      toAmount:      toAmount     != null ? Number(toAmount)     : null,
      toWalletId:    toWalletId   || null,
      toHoldingId:   toHoldingId  || null,
      priceUSD:      priceUSD     != null ? Number(priceUSD)     : null,
      valueUSD:      valueUSD     != null ? Number(valueUSD)     : null,
      tags:          Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
      notes:         notes?.trim() || '',
      syncBalances:  Boolean(syncBalances),
      chartPinTs:    chartPinTs ? new Date(chartPinTs) : null,
    });

    // Auto-update balances if enabled
    if (tx.syncBalances) {
      try {
        await syncTransactionBalances(tx, userId, 'apply');
      } catch (syncErr) {
        console.warn('Balance sync warning on create:', syncErr.message);
      }
    }

    res.status(201).json({ transaction: tx });
  } catch (err) {
    console.error('POST /transactions error:', err);
    res.status(500).json({ message: 'Failed to create transaction' });
  }
});

// ── PATCH /api/transactions/:id ───────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction id' });
    }

    const oldTx = await Transaction.findOne({ _id: id, userId });
    if (!oldTx) return res.status(404).json({ message: 'Transaction not found' });

    // Revert old transaction balances before applying updated ones
    if (oldTx.syncBalances) {
      try {
        await syncTransactionBalances(oldTx, userId, 'revert');
      } catch (revertErr) {
        console.warn('Balance sync revert warning on patch:', revertErr.message);
      }
    }

    const tx = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Apply updated balances
    if (tx.syncBalances) {
      try {
        await syncTransactionBalances(tx, userId, 'apply');
      } catch (applyErr) {
        console.warn('Balance sync apply warning on patch:', applyErr.message);
      }
    }

    res.json({ transaction: tx });
  } catch (err) {
    console.error('PATCH /transactions/:id error:', err);
    res.status(500).json({ message: 'Failed to update transaction' });
  }
});

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction id' });
    }

    const tx = await Transaction.findOneAndDelete({ _id: id, userId });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    // Automatically revert balances if this transaction had balance sync enabled
    if (tx.syncBalances) {
      try {
        await syncTransactionBalances(tx, userId, 'revert');
      } catch (syncErr) {
        console.warn('Balance sync revert warning on delete:', syncErr.message);
      }
    }

    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('DELETE /transactions/:id error:', err);
    res.status(500).json({ message: 'Failed to delete transaction' });
  }
});

export default router;
