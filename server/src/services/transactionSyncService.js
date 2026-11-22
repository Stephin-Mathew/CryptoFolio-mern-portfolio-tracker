import { Holding } from '../models/Holding.js';
import { Wallet } from '../models/Wallet.js';

/**
 * Determine asset type based on symbol and target wallet.
 */
function inferAssetType(symbol, walletType) {
  const s = String(symbol || '').toUpperCase().trim();
  if (s === 'INR' || s === 'USD' || s === 'EUR' || s === 'GBP' || walletType === 'cash' || walletType === 'bank') {
    return 'cash';
  }
  if (s.endsWith('.NS') || s.endsWith('.BO')) {
    return 'stock';
  }
  return 'crypto';
}

/**
 * Apply or revert balance adjustments on user's holdings based on transaction details.
 *
 * @param {Object} tx - The transaction document / object
 * @param {string|ObjectId} userId - User id
 * @param {'apply'|'revert'} direction - Whether applying or undoing the transaction
 */
export async function syncTransactionBalances(tx, userId, direction = 'apply') {
  if (!tx || !userId) return;

  const isApply = direction === 'apply';
  const {
    type,
    fromAsset, fromAmount, fromWalletId, fromHoldingId,
    toAsset, toAmount, toWalletId, toHoldingId,
    priceUSD, valueUSD,
  } = tx;

  // Derive per-unit price if available
  let unitPrice = priceUSD;
  if (!unitPrice && valueUSD && toAmount) {
    unitPrice = valueUSD / toAmount;
  }

  // ── 1. Process "FROM" leg (gave up) ──────────────────────────────────────────
  if (fromAsset && fromAmount && Number(fromAmount) > 0) {
    const sym = fromAsset.toUpperCase().trim();
    const amt = Number(fromAmount);

    let fromHolding = null;
    if (fromHoldingId) {
      fromHolding = await Holding.findOne({ _id: fromHoldingId, userId });
    }

    if (!fromHolding) {
      const fromQuery = { userId, symbol: sym };
      if (fromWalletId) fromQuery.walletId = fromWalletId;
      fromHolding = await Holding.findOne(fromQuery);
    }

    // If not found with walletId, fallback to any holding of this symbol
    if (!fromHolding && fromWalletId) {
      fromHolding = await Holding.findOne({ userId, symbol: sym });
    }

    if (isApply) {
      // Spent / sold: deduct amount
      if (fromHolding) {
        const remaining = (fromHolding.quantity || 0) - amt;
        if (remaining <= 0) {
          // Position fully closed / sold: delete holding from portfolio
          await Holding.deleteOne({ _id: fromHolding._id });
        } else {
          fromHolding.quantity = remaining;
          await fromHolding.save();
        }
      }
    } else {
      // Revert deletion: add amount back
      if (fromHolding) {
        fromHolding.quantity = (fromHolding.quantity || 0) + amt;
        await fromHolding.save();
      } else {
        // Recreate holding if it was removed
        let wallet = null;
        if (fromWalletId) wallet = await Wallet.findById(fromWalletId);
        await Holding.create({
          userId,
          symbol: sym,
          quantity: amt,
          assetType: inferAssetType(sym, wallet?.type),
          walletId: fromWalletId || null,
        });
      }
    }
  }

  // ── 2. Process "TO" leg (received) ───────────────────────────────────────────
  if (toAsset && toAmount && Number(toAmount) > 0) {
    const sym = toAsset.toUpperCase().trim();
    const amt = Number(toAmount);

    let toHolding = null;
    if (toHoldingId) {
      toHolding = await Holding.findOne({ _id: toHoldingId, userId });
    }

    if (!toHolding) {
      const toQuery = { userId, symbol: sym };
      if (toWalletId) toQuery.walletId = toWalletId;
      toHolding = await Holding.findOne(toQuery);
    }

    // If not found with walletId, fallback to any holding of this symbol
    if (!toHolding && toWalletId) {
      toHolding = await Holding.findOne({ userId, symbol: sym });
    }

    if (isApply) {
      // Acquired / bought: add amount
      if (toHolding) {
        const oldQty = toHolding.quantity || 0;
        const newQty = oldQty + amt;

        // If it's a buy and we have a unit price, update weighted average cost
        if (type === 'buy' && unitPrice && unitPrice > 0 && newQty > 0) {
          const oldAvg = toHolding.avgBuyPrice != null ? toHolding.avgBuyPrice : unitPrice;
          toHolding.avgBuyPrice = ((oldQty * oldAvg) + (amt * unitPrice)) / newQty;
        }

        toHolding.quantity = newQty;
        if (!toHolding.walletId && toWalletId) {
          toHolding.walletId = toWalletId;
        }
        await toHolding.save();
      } else {
        // Create new position
        let wallet = null;
        if (toWalletId) wallet = await Wallet.findById(toWalletId);
        const inferredType = inferAssetType(sym, wallet?.type);

        await Holding.create({
          userId,
          symbol: sym,
          quantity: amt,
          assetType: inferredType,
          walletId: toWalletId || null,
          walletOrAccount: (inferredType === 'cash' && wallet) ? wallet.name : '',
          avgBuyPrice: unitPrice && unitPrice > 0 ? unitPrice : null,
          currency: inferredType === 'cash' ? sym : undefined,
        });
      }
    } else {
      // Revert deletion: deduct amount
      if (toHolding) {
        const remaining = (toHolding.quantity || 0) - amt;
        if (remaining <= 0) {
          await Holding.deleteOne({ _id: toHolding._id });
        } else {
          toHolding.quantity = remaining;
          await toHolding.save();
        }
      }
    }
  }
}
