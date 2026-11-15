import express from 'express';
import { PriceFetchLog } from '../models/PriceFetchLog.js';
import { PriceCache } from '../models/PriceCache.js';
import { PriceOverride } from '../models/PriceOverride.js';
import { Holding } from '../models/Holding.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * @route   GET /api/dev/price-logs
 * @desc    Get paginated price fetch logs with optional filters
 * @access  Private
 */
router.get('/price-logs', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      source = '',
      status = '',
      assetType = '',
      sortBy = 'fetchedAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (req.query.days) {
      const days = parseInt(req.query.days);
      if (days > 0) {
        filter.fetchedAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    if (req.query.trigger) {
      filter.trigger = req.query.trigger;
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, totalCount] = await Promise.all([
      PriceFetchLog.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      PriceFetchLog.countDocuments(filter),
    ]);

    // Apply symbol-level filters
    let processedLogs = logs;
    if (search || source || status || assetType) {
      processedLogs = logs.map((log) => {
        let filteredResults = log.results || [];

        if (search) {
          const q = search.toUpperCase();
          filteredResults = filteredResults.filter(
            (r) =>
              r.symbol?.toUpperCase().includes(q) ||
              r.mappedTo?.toUpperCase().includes(q) ||
              r.mappedFrom?.toUpperCase().includes(q) ||
              r.schemeName?.toUpperCase().includes(q) ||
              r.source?.toUpperCase().includes(q)
          );
        }

        if (source) {
          filteredResults = filteredResults.filter((r) => r.source === source);
        }

        if (status === 'success') {
          filteredResults = filteredResults.filter((r) => r.success);
        } else if (status === 'failed') {
          filteredResults = filteredResults.filter((r) => !r.success);
        }

        if (assetType) {
          filteredResults = filteredResults.filter((r) => r.assetType === assetType);
        }

        return { ...log, results: filteredResults };
      }).filter((log) => log.results.length > 0);
    }

    res.json({
      logs: processedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Dev Logs Error:', error);
    res.status(500).json({ message: 'Failed to fetch price logs' });
  }
});

/**
 * @route   GET /api/dev/price-logs/stats
 * @desc    Get summary statistics for the dev dashboard
 * @access  Private
 */
router.get('/price-logs/stats', async (req, res) => {
  try {
    const [
      totalBatches,
      recentBatches,
      cacheEntries,
      overrideEntries,
      holdingCount,
    ] = await Promise.all([
      PriceFetchLog.countDocuments(),
      PriceFetchLog.find().sort({ fetchedAt: -1 }).limit(5).lean(),
      PriceCache.find().lean(),
      PriceOverride.find({ userId: req.user._id }).lean(),
      Holding.countDocuments({ userId: req.user._id }),
    ]);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await PriceFetchLog.find({ fetchedAt: { $gte: last24h } }).lean();

    let totalFetches24h = 0;
    let totalSuccess24h = 0;
    let totalFail24h = 0;
    let avgDuration = 0;
    const sourceBreakdown = {};
    const failedSymbols = new Set();

    recentLogs.forEach((log) => {
      totalFetches24h += log.totalSymbols || 0;
      totalSuccess24h += log.successCount || 0;
      totalFail24h += log.failCount || 0;
      avgDuration += log.durationMs || 0;

      (log.results || []).forEach((r) => {
        const src = r.source || 'unknown';
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
        if (!r.success) {
          failedSymbols.add(r.symbol);
        }
      });
    });

    if (recentLogs.length > 0) {
      avgDuration = Math.round(avgDuration / recentLogs.length);
    }

    // Build cache overview
    const cacheOverview = cacheEntries.map((c) => ({
      symbol: c.symbol,
      price: c.price,
      assetType: c.assetType || 'crypto',
      source: c.source || (c.cmcId ? 'cmc' : (c.assetType === 'stock' ? 'yahoo' : (c.assetType === 'mutual_fund' ? 'mfapi' : 'unknown'))),
      currency: c.currency || 'USD',
      priceInr: c.priceInr,
      navInr: c.navInr,
      schemeName: c.schemeName,
      logoUrl: c.logoUrl,
      cmcId: c.cmcId,
      lastUpdated: c.lastUpdated,
      staleness: Date.now() - new Date(c.lastUpdated).getTime(),
      change24h: c.change24h,
      change7d: c.change7d,
      change30d: c.change30d,
      marketState: c.marketState,
    }));

    // Build overrides overview
    const overridesOverview = overrideEntries.map((o) => ({
      symbol: o.symbol,
      price: o.price,
      mappedSymbol: o.mappedSymbol,
      isLocked: o.isLocked,
      currency: o.currency,
      customLogoUrl: o.customLogoUrl,
      customLogoCmcId: o.customLogoCmcId,
      notes: o.notes,
      updatedAt: o.updatedAt,
    }));

    res.json({
      stats: {
        totalBatches,
        batchesLast24h: recentLogs.length,
        totalFetches24h,
        totalSuccess24h,
        totalFail24h,
        successRate: totalFetches24h > 0 ? Number(((totalSuccess24h / totalFetches24h) * 100).toFixed(1)) : 100,
        avgDurationMs: avgDuration,
        failedSymbols: [...failedSymbols],
        sourceBreakdown,
        holdingCount,
        cacheEntryCount: cacheEntries.length,
        overrideCount: overrideEntries.length,
      },
      cache: cacheOverview,
      overrides: overridesOverview,
      recentBatches: recentBatches.map((b) => ({
        batchId: b.batchId,
        trigger: b.trigger,
        totalSymbols: b.totalSymbols,
        successCount: b.successCount,
        failCount: b.failCount,
        durationMs: b.durationMs,
        fetchedAt: b.fetchedAt,
      })),
    });
  } catch (error) {
    console.error('Dev Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch dev stats' });
  }
});

const PROVIDER_METADATA = [
  {
    id: 'cmc',
    name: 'CoinMarketCap',
    category: 'Crypto Quotes API',
    endpoint: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    color: '#F7931A',
    description: 'Primary market provider for crypto assets, prices, 24h/7d/30d changes & verified logos.',
  },
  {
    id: 'yahoo',
    name: 'Yahoo Finance',
    category: 'Stocks & ETFs API',
    endpoint: 'https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}',
    color: '#734CFF',
    description: 'Real-time and delayed quotes for US stocks, ETFs, and Indian NSE/BSE securities (.NS / .BO).',
  },
  {
    id: 'mfapi',
    name: 'MFapi.in',
    category: 'Indian Mutual Funds (NAV)',
    endpoint: 'https://api.mfapi.in/mf/{schemeCode}',
    color: '#10B981',
    description: 'Daily Net Asset Value (NAV) and scheme history for all registered Indian Mutual Fund schemes.',
  },
  {
    id: 'coingecko',
    name: 'CoinGecko',
    category: 'Crypto Fallback API',
    endpoint: 'https://api.coingecko.com/api/v3/simple/price',
    color: '#8BD94E',
    description: 'Secondary fallback for cryptocurrency tokens missed or rate-limited on CoinMarketCap.',
  },
  {
    id: 'stablecoin',
    name: 'Stablecoins & FX Rates',
    category: 'Fixed Pegs & Exchange Rates',
    endpoint: 'Internal / open.er-api.com',
    color: '#06B6D4',
    description: 'Fixed 1.00 USD pegs for stablecoins (USDT, USDC, USD) and live USD to INR exchange rates.',
  },
  {
    id: 'fallback',
    name: 'Static Fallback Baseline',
    category: 'Offline Baseline',
    endpoint: 'Local Baseline Constants',
    color: '#FF6B73',
    description: 'Hardcoded baseline prices and variance used when all live market APIs are unreachable.',
  },
];

/**
 * @route   GET /api/dev/sources
 * @desc    Get assets grouped by API source provider (CoinMarketCap, Yahoo Finance, MFapi.in, etc.)
 *          with last API call items and current cache items for each source.
 * @access  Private
 */
router.get('/sources', async (req, res) => {
  try {
    const allCache = await PriceCache.find().lean();

    // Query latest log batch for each provider
    const providerData = await Promise.all(
      PROVIDER_METADATA.map(async (meta) => {
        const sourceKeys = meta.id === 'stablecoin'
          ? ['stablecoin', 'exchange_rate_api']
          : [meta.id];

        // Find the most recent log batch that included this source
        const latestBatch = await PriceFetchLog.findOne({
          'results.source': { $in: sourceKeys },
        })
          .sort({ fetchedAt: -1 })
          .lean();

        let latestCallItems = [];
        let latestCallTime = null;
        let latestCallDurationMs = 0;
        let latestCallTrigger = null;
        let latestBatchId = null;

        if (latestBatch) {
          latestBatchId = latestBatch.batchId;
          latestCallTime = latestBatch.fetchedAt;
          latestCallDurationMs = latestBatch.durationMs;
          latestCallTrigger = latestBatch.trigger;
          latestCallItems = (latestBatch.results || []).filter((r) =>
            sourceKeys.includes(r.source)
          );
        }

        // Find all currently cached items belonging to this provider
        const cachedItems = allCache.filter((c) => {
          if (meta.id === 'cmc') {
            return c.source === 'cmc' || (c.cmcId && c.source !== 'coingecko' && c.assetType === 'crypto');
          }
          if (meta.id === 'yahoo') {
            return c.source === 'yahoo' || c.assetType === 'stock';
          }
          if (meta.id === 'mfapi') {
            return c.source === 'mfapi' || c.assetType === 'mutual_fund';
          }
          if (meta.id === 'coingecko') {
            return c.source === 'coingecko';
          }
          if (meta.id === 'stablecoin') {
            return c.source === 'stablecoin' || c.source === 'exchange_rate_api' || ['USD', 'USDT', 'USDC', 'INR'].includes(c.symbol);
          }
          if (meta.id === 'fallback') {
            return c.source === 'fallback';
          }
          return c.source === meta.id;
        });

        return {
          ...meta,
          lastApiCall: {
            batchId: latestBatchId,
            fetchedAt: latestCallTime,
            trigger: latestCallTrigger,
            durationMs: latestCallDurationMs,
            totalItems: latestCallItems.length,
            successCount: latestCallItems.filter((i) => i.success).length,
            failCount: latestCallItems.filter((i) => !i.success).length,
            items: latestCallItems,
          },
          cachedAssetsCount: cachedItems.length,
          cachedAssets: cachedItems.map((c) => ({
            symbol: c.symbol,
            price: c.price,
            assetType: c.assetType || 'crypto',
            currency: c.currency || 'USD',
            priceInr: c.priceInr,
            navInr: c.navInr,
            schemeName: c.schemeName,
            logoUrl: c.logoUrl,
            cmcId: c.cmcId,
            source: c.source || meta.id,
            lastUpdated: c.lastUpdated,
            change24h: c.change24h,
            change7d: c.change7d,
            change30d: c.change30d,
            marketState: c.marketState,
          })),
        };
      })
    );

    res.json({ providers: providerData });
  } catch (error) {
    console.error('Dev Sources Error:', error);
    res.status(500).json({ message: 'Failed to fetch source grouped data' });
  }
});

/**
 * @route   GET /api/dev/price-logs/:batchId
 * @desc    Get detailed results for a specific batch
 * @access  Private
 */
router.get('/price-logs/:batchId', async (req, res) => {
  try {
    const log = await PriceFetchLog.findOne({ batchId: req.params.batchId }).lean();
    if (!log) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.json({ log });
  } catch (error) {
    console.error('Dev Batch Detail Error:', error);
    res.status(500).json({ message: 'Failed to fetch batch details' });
  }
});

/**
 * @route   DELETE /api/dev/price-logs
 * @desc    Clear all price fetch logs
 * @access  Private
 */
router.delete('/price-logs', async (req, res) => {
  try {
    const result = await PriceFetchLog.deleteMany({});
    res.json({ message: `Cleared ${result.deletedCount} price fetch log(s)` });
  } catch (error) {
    console.error('Clear Logs Error:', error);
    res.status(500).json({ message: 'Failed to clear logs' });
  }
});

export default router;
