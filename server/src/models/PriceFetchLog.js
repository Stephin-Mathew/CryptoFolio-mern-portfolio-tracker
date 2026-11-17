import mongoose from 'mongoose';

const priceFetchLogSchema = new mongoose.Schema(
  {
    // The batch run ID — all symbols fetched in the same invocation share this
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    // Trigger type: 'cron' | 'manual_refresh' | 'page_load' | 'cache_miss'
    trigger: {
      type: String,
      enum: ['cron', 'manual_refresh', 'page_load', 'cache_miss', 'initial'],
      default: 'cache_miss',
    },
    // Total symbols requested in this batch
    totalSymbols: {
      type: Number,
      default: 0,
    },
    // How many succeeded
    successCount: {
      type: Number,
      default: 0,
    },
    // How many failed (fell back to fallback/baseline)
    failCount: {
      type: Number,
      default: 0,
    },
    // Duration of the entire batch fetch in ms
    durationMs: {
      type: Number,
      default: 0,
    },
    // Per-symbol results array
    results: [
      {
        symbol: { type: String, required: true },
        // Which source was used: 'cmc' | 'coingecko' | 'yahoo' | 'mfapi' | 'fallback' | 'override' | 'stablecoin'
        source: { type: String, default: 'unknown' },
        // Final price stored
        price: { type: Number, default: 0 },
        // Asset classification
        assetType: { type: String, enum: ['crypto', 'stock', 'mutual_fund', 'cash', 'fiat'], default: 'crypto' },
        // Whether this symbol was fetched successfully
        success: { type: Boolean, default: false },
        // Error message if fetch failed for this symbol
        error: { type: String, default: null },
        // HTTP status code or network error code
        statusCode: { type: Number, default: null },
        // Extended diagnostic details (HTTP statusText, response body, network syscall)
        errorDetails: { type: String, default: null },
        // Target URL that was called
        url: { type: String, default: null },
        // The ticker mapping info
        mappedFrom: { type: String, default: null },
        mappedTo: { type: String, default: null },
        // Logo info
        logoUrl: { type: String, default: null },
        logoSource: { type: String, default: null },
        cmcId: { type: Number, default: null },
        // Change percentages fetched
        change24h: { type: Number, default: null },
        change7d: { type: Number, default: null },
        change30d: { type: Number, default: null },
        // Currency of native quote
        currency: { type: String, default: 'USD' },
        priceInr: { type: Number, default: null },
        navInr: { type: Number, default: null },
        schemeName: { type: String, default: null },
        // Was it from cache (stale refresh) or truly missing
        wasCached: { type: Boolean, default: false },
        wasStale: { type: Boolean, default: false },
      },
    ],
    // Timestamp of the fetch
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete logs older than 30 days
priceFetchLogSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Index for querying by symbol within results
priceFetchLogSchema.index({ 'results.symbol': 1 });

export const PriceFetchLog = mongoose.model('PriceFetchLog', priceFetchLogSchema);
