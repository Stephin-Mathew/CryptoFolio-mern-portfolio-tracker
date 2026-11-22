import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['buy', 'sell', 'swap', 'transfer_in', 'transfer_out', 'deposit', 'withdrawal', 'long', 'short', 'note'],
      required: true,
    },
    // "From" leg — what you gave up
    fromAsset:    { type: String, trim: true, default: '' },
    fromAmount:   { type: Number, default: null },
    fromWalletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', default: null },
    // "To" leg — what you received
    toAsset:    { type: String, trim: true, default: '' },
    toAmount:   { type: Number, default: null },
    toWalletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', default: null },
    // Convenience / analytics
    priceUSD:  { type: Number, default: null },
    valueUSD:  { type: Number, default: null },
    tags:      { type: [String], default: [] },
    notes:     { type: String, trim: true, default: '' },
    // Optional override timestamp for pinning to a specific chart point
    chartPinTs: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for fast queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
