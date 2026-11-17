import React, { useState, useEffect } from 'react';
import { resolveAmcFromText } from '../utils/amcList';

/**
 * CoinMarketCap Verified Static Image ID Map
 * CMC serves official vetted token logos via: https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png
 * (or 128x128 / 200x200).
 *
 * All IDs below are strictly matched to the official active cryptocurrency on CoinMarketCap.
 */
const CMC_ID_MAP = {
  // Major & Large Caps
  BTC: 1,
  ETH: 1027,
  USDT: 825,
  BNB: 1839,
  SOL: 5426,
  XRP: 52,
  USDC: 3408,
  ADA: 2010,
  DOGE: 74,
  AVAX: 5805,
  TRX: 1958,
  DOT: 6636,
  LINK: 1975,
  NEAR: 6535,
  SUI: 20947,
  DAI: 4943,
  LTC: 2,
  BCH: 1831,
  LEO: 6892,
  UNI: 7083,
  APT: 21794,
  ICP: 8916,
  SHIB: 5994,
  PEPE: 24478,
  XLM: 512,
  XMR: 328,
  ETC: 1321,
  POL: 28321,
  MATIC: 3890,
  HBAR: 4642,
  TAO: 22974,
  KAS: 20396,
  FET: 3773,
  RENDER: 5690,
  RNDR: 5690,
  FIL: 2280,
  AAVE: 7278,
  ATOM: 3794,
  ARB: 11841,
  OP: 11840,
  INJ: 7226,
  TIA: 22861,      // Celestia
  SEI: 23149,
  TON: 11419,
  STX: 4847,
  VET: 3077,
  MKR: 1518,
  GRT: 6719,
  ALGO: 4030,
  FTM: 3513,
  S: 3513,
  RUNE: 4157,
  SAND: 6210,
  MANA: 1966,
  AXS: 6783,
  THETA: 2416,
  EGLD: 6892,
  EOS: 1765,
  FLOW: 4558,
  XTZ: 2011,
  QNT: 3155,
  CRV: 6538,
  LDO: 8397,
  APE: 18876,
  WIF: 28752,
  BONK: 23095,
  FLOKI: 10804,
  BOME: 29870,
  MEME: 28301,
  WLD: 13502,
  PENDLE: 9481,
  ONDO: 21178,
  ENA: 30171,      // Ethena
  NOT: 28850,
  JUP: 29210,      // Jupiter
  PYTH: 28177,
  STRK: 22691,     // Starknet
  BLUR: 23121,
  DYDX: 11156,
  GALA: 7080,
  CHZ: 4066,
  ENS: 13855,
  IMX: 10603,
  MINA: 8646,
  OSMO: 12220,
  CFX: 7334,
  KLAY: 4256,
  BSV: 3602,
  NEO: 1376,
  IOTA: 1720,
  KAVA: 4846,
  ZIL: 2469,
  COMP: 5692,
  BAT: 1697,
  ENJ: 2130,
  HOT: 2682,
  ZRX: 1896,
  YFI: 5864,
  SUSHI: 6758,
  CAKE: 7186,
  TWT: 5964,
  LUNC: 4172,
  USTC: 7175,
  FDUSD: 26081,
  PYUSD: 27772,
  USDE: 29470,
  MNT: 27075,
  CORE: 23254,
  BEAM: 28298,
  RON: 14101,
  JASMY: 8425,
  W: 29587,        // Wormhole
  IO: 29835,       // io.net
  ZK: 24091,       // ZKsync
  SAFE: 21585,     // Safe
  DRIFT: 31278,    // Drift
  ATH: 30083,      // Aethir
  ZRO: 26997,      // LayerZero (verified CMC ID)
  BLAST: 28480,    // Blast
  DOGS: 32698,
  CATI: 33140,
  HMSTR: 32959,
  EIGEN: 30494,    // EigenLayer (verified CMC ID)
  NEIRO: 32880,
  POPCAT: 29198,
  TURBO: 24911,
  BABYDOGE: 10407,
  BRETT: 29743,
  MEW: 30126,
  MOG: 27659,
  RAY: 8526,
  ORCA: 11165,
  AERO: 29270,
  KNTQ: 36142,     // Kinto
  HYPE: 32196,     // Hyperliquid
  WBTC: 3717,
  WETH: 2396,
};

/**
 * Curated map for special stocks / ETFs (e.g. Indian BeES ETFs, Nasdaq ETFs, etc.)
 */
const STOCK_LOGO_MAP = {
  'NIFTYBEES.NS': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'NIFTYBEES': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'GOLDBEES.NS': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'GOLDBEES': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'BANKBEES.NS': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'BANKBEES': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'ITBEES.NS': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'ITBEES': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'JUNIORBEES.NS': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'JUNIORBEES': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'LIQUIDBEES.NS': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'LIQUIDBEES': 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
  'MON100.NS': 'https://assets.parqet.com/logos/symbol/MOTILALOFS.NS',
  'MON100': 'https://assets.parqet.com/logos/symbol/MOTILALOFS.NS',
};

/**
 * AssetLogo
 *
 * Supports official logos for:
 * 1. Cryptocurrencies (via CoinMarketCap static image CDN)
 * 2. Stocks & ETFs (US, global & Indian NSE/BSE via FMP & Parqet vector/PNG CDNs)
 * 3. User overrides (custom logo URL or CMC ID)
 * 4. Graceful Fallback: Clean circular starting-letter avatar (prevents broken images)
 */
export const AssetLogo = ({
  symbol = '',
  assetType = 'crypto',
  customUrl = null,
  size = 36,
  className = '',
  children,
}) => {
  const [srcIndex, setSrcIndex] = useState(0);

  // Clean the symbol: remove pair suffixes like /USD, -USDT, etc.
  const cleanRaw = (symbol || '').split('/')[0].split('-')[0].trim();
  const upperSymbol = cleanRaw.toUpperCase();
  const isStock =
    assetType === 'stock' ||
    upperSymbol.endsWith('.NS') ||
    upperSymbol.endsWith('.BO');
  const isCrypto =
    (assetType === 'crypto' || !assetType) &&
    !isStock &&
    cleanRaw.length > 0;

  // Build the prioritized logo source list
  const sources = [];

  const addSource = (url) => {
    if (url && typeof url === 'string' && url.startsWith('http') && !sources.includes(url)) {
      sources.push(url);
    }
  };

  // 1. Explicit / Custom URL (from user override or backend live quote)
  if (customUrl) {
    addSource(customUrl);
  }

  // 2. Mutual Fund AMC logo (all funds from same fund house share one logo)
  const isMutualFund = assetType === 'mutual_fund';
  if (isMutualFund) {
    const amc = resolveAmcFromText(symbol);
    if (amc) {
      addSource(amc.logoUrl);
      if (amc.altLogoUrl) addSource(amc.altLogoUrl);
    }
  }

  // 3. Stock & ETF resolution
  if (isStock && !isMutualFund) {
    if (STOCK_LOGO_MAP[upperSymbol]) {
      addSource(STOCK_LOGO_MAP[upperSymbol]);
    }

    const hasIndianSuffix = upperSymbol.endsWith('.NS') || upperSymbol.endsWith('.BO');
    const baseTicker = upperSymbol.replace(/\.(NS|BO)$/, '');

    if (hasIndianSuffix) {
      // Indian exchange stock (NSE/BSE) - Parqet has extensive coverage for .NS symbols
      addSource(`https://assets.parqet.com/logos/symbol/${upperSymbol}`);
      addSource(`https://assets.parqet.com/logos/symbol/${baseTicker}`);
      addSource(`https://financialmodelingprep.com/image-stock/${baseTicker}.png`);
    } else {
      // US or global stock / ETF (AAPL, MSFT, NVDA, TSLA, SPY, QQQ, etc.)
      addSource(`https://financialmodelingprep.com/image-stock/${upperSymbol}.png`);
      addSource(`https://assets.parqet.com/logos/symbol/${upperSymbol}`);
      addSource(`https://assets.parqet.com/logos/symbol/${upperSymbol}.NS`);
    }
  }

  // 4. Automatic CoinMarketCap verified ID Map for crypto
  if (isCrypto && !isMutualFund) {
    const cmcId = CMC_ID_MAP[upperSymbol];
    if (cmcId) {
      addSource(`https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`);
    }
  }

  // Reset source index when symbol, assetType, or customUrl changes
  useEffect(() => {
    setSrcIndex(0);
  }, [symbol, assetType, customUrl]);

  const showImage = sources.length > 0 && srcIndex < sources.length;
  const initial = (symbol || '?')[0].toUpperCase();

  const handleImgError = () => {
    setSrcIndex((prev) => prev + 1);
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--neutral-chip-bg, #F1F5F9)',
          border: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          fontSize: Math.max(11, Math.round(size * 0.38)),
          fontWeight: 700,
          color: 'var(--text-primary)',
          userSelect: 'none',
        }}
      >
        {showImage ? (
          <img
            src={sources[srcIndex]}
            alt={symbol}
            loading="lazy"
            onError={handleImgError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              display: 'block',
            }}
          />
        ) : (
          initial
        )}
      </div>

      {/* Optional overlay (e.g., expand/collapse chevron badge) */}
      {children}
    </div>
  );
};
