/**
 * Indian Mutual Fund AMC (Asset Management Company) / Fund House Registry
 *
 * All mutual fund schemes from the same fund house share the same AMC logo.
 * This registry maps fund house names to verified high-resolution logos
 * sourced from exchange-listed parent entities on Parqet CDN & FMP CDN.
 *
 * Usage:
 *   import { resolveAmcFromText, searchAmcs, VERIFIED_AMCS } from './amcList';
 *   const amc = resolveAmcFromText('Axis ELSS Tax Saver Fund - Direct Plan');
 *   // => { slug: 'axis', name: 'Axis Mutual Fund', logoUrl: '...', ... }
 */

export const VERIFIED_AMCS = [
  {
    slug: 'hdfc',
    name: 'HDFC Mutual Fund',
    patterns: [/\bhdfc\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/HDFCAMC.NS',
    altLogoUrl: 'https://assets.parqet.com/logos/symbol/HDFCBANK.NS',
  },
  {
    slug: 'sbi',
    name: 'SBI Mutual Fund',
    patterns: [/\bsbi\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/SBIN.NS',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/SBIN.NS.png',
  },
  {
    slug: 'axis',
    name: 'Axis Mutual Fund',
    patterns: [/\baxis\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/AXISBANK.NS',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/AXISBANK.NS.png',
  },
  {
    slug: 'icici-prudential',
    name: 'ICICI Prudential Mutual Fund',
    patterns: [/\bicici[\s-]*pru(dential)?\b/i, /\bicici\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/ICICIPRULI.NS',
    altLogoUrl: 'https://assets.parqet.com/logos/symbol/ICICIBANK.NS',
  },
  {
    slug: 'parag-parikh',
    name: 'PPFAS Mutual Fund (Parag Parikh)',
    patterns: [/\bparag[\s-]*parikh\b/i, /\bppfas\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=ppfas.com&sz=128',
    altLogoUrl: 'https://groww.in/images/partners/ppfas_groww.svg',
  },
  {
    slug: 'mirae-asset',
    name: 'Mirae Asset Mutual Fund',
    patterns: [/\bmirae[\s-]*asset\b/i, /\bmirae\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/055550.KS',
    altLogoUrl: 'https://www.google.com/s2/favicons?domain=miraeassetmf.co.in&sz=128',
  },
  {
    slug: 'motilal-oswal',
    name: 'Motilal Oswal Mutual Fund',
    patterns: [/\bmotilal[\s-]*oswal\b/i, /\bmotilal\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/MOTILALOFS.NS',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/MOTILALOFS.NS.png',
  },
  {
    slug: 'nippon-india',
    name: 'Nippon India Mutual Fund',
    patterns: [/\bnippon[\s-]*india\b/i, /\bnippon\b/i, /\breliance[\s-]*mutual\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS',
    altLogoUrl: null,
  },
  {
    slug: 'kotak',
    name: 'Kotak Mahindra Mutual Fund',
    patterns: [/\bkotak[\s-]*(mahindra)?\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/KOTAKBANK.NS',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/KOTAKBANK.NS.png',
  },
  {
    slug: 'zerodha',
    name: 'Zerodha Fund House',
    patterns: [/\bzerodha\b/i, /\bzerodha[\s-]*case\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=zerodha.com&sz=128',
    altLogoUrl: null,
  },
  {
    slug: 'canara-robeco',
    name: 'Canara Robeco Mutual Fund',
    patterns: [/\bcanara[\s-]*robeco\b/i, /\bcanara\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/CANBK.NS',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/CANBK.NS.png',
  },
  {
    slug: 'tata',
    name: 'Tata Mutual Fund',
    patterns: [/\btata[\s-]*(mutual|asset|amc)?\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/TATAMOTORS.NS',
    altLogoUrl: 'https://assets.parqet.com/logos/symbol/TCS.NS',
  },
  {
    slug: 'uti',
    name: 'UTI Mutual Fund',
    patterns: [/\buti\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/UTIAMC.NS',
    altLogoUrl: null,
  },
  {
    slug: 'dsp',
    name: 'DSP Mutual Fund',
    patterns: [/\bdsp\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/DSP',
    altLogoUrl: null,
  },
  {
    slug: 'quant',
    name: 'Quant Mutual Fund',
    patterns: [/\bquant\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=quantmutual.com&sz=128',
    altLogoUrl: null,
  },
  {
    slug: 'aditya-birla',
    name: 'Aditya Birla Sun Life Mutual Fund',
    patterns: [/\baditya[\s-]*birla\b/i, /\babsl\b/i, /\bbirla[\s-]*sun[\s-]*life\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/ABSLAMC.NS',
    altLogoUrl: null,
  },
  {
    slug: 'bandhan',
    name: 'Bandhan Mutual Fund',
    patterns: [/\bbandhan\b/i, /\bidfc\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/BANDHANBNK.NS',
    altLogoUrl: null,
  },
  {
    slug: 'edelweiss',
    name: 'Edelweiss Mutual Fund',
    patterns: [/\bedelweiss\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/EDELWEISS.NS',
    altLogoUrl: null,
  },
  {
    slug: 'invesco',
    name: 'Invesco Mutual Fund',
    patterns: [/\binvesco\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/IVZ',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/IVZ.png',
  },
  {
    slug: 'franklin-templeton',
    name: 'Franklin Templeton Mutual Fund',
    patterns: [/\bfranklin[\s-]*(templeton)?\b/i, /\btempleton\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/BEN',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/BEN.png',
  },
  {
    slug: 'sundaram',
    name: 'Sundaram Mutual Fund',
    patterns: [/\bsundaram\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/SUNDARMFIN.NS',
    altLogoUrl: null,
  },
  {
    slug: 'navi',
    name: 'Navi Mutual Fund',
    patterns: [/\bnavi\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/NAVI',
    altLogoUrl: null,
  },
  {
    slug: 'groww',
    name: 'Groww Mutual Fund',
    patterns: [/\bgroww\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=groww.in&sz=128',
    altLogoUrl: null,
  },
  {
    slug: 'whiteoak',
    name: 'WhiteOak Capital Mutual Fund',
    patterns: [/\bwhiteoak\b/i, /\bwhite[\s-]*oak\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=whiteoakamc.com&sz=128',
    altLogoUrl: null,
  },
  {
    slug: 'pgim',
    name: 'PGIM India Mutual Fund',
    patterns: [/\bpgim\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/PGR',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/PGR.png',
  },
  {
    slug: 'hsbc',
    name: 'HSBC Mutual Fund',
    patterns: [/\bhsbc\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/HSBC',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/HSBC.png',
  },
  {
    slug: 'baroda-bnp',
    name: 'Baroda BNP Paribas Mutual Fund',
    patterns: [/\bbaroda[\s-]*(bnp)?\b/i, /\bbnp[\s-]*paribas\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/BANKBARODA.NS',
    altLogoUrl: null,
  },
  {
    slug: 'mahindra-manulife',
    name: 'Mahindra Manulife Mutual Fund',
    patterns: [/\bmahindra[\s-]*(manulife)?\b/i, /\bmanulife\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/M&M.NS',
    altLogoUrl: 'https://www.google.com/s2/favicons?domain=mahindramanulife.com&sz=128',
  },
  {
    slug: 'union',
    name: 'Union Mutual Fund',
    patterns: [/\bunion[\s-]*(mutual|amc)\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/UNIONBANK.NS',
    altLogoUrl: null,
  },
  {
    slug: 'lic',
    name: 'LIC Mutual Fund',
    patterns: [/\blic\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/LICI.NS',
    altLogoUrl: null,
  },
  {
    slug: '360-one',
    name: '360 ONE Mutual Fund (IIFL)',
    patterns: [/\b360[\s-]*one\b/i, /\biifl\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/360ONE.NS',
    altLogoUrl: null,
  },
  {
    slug: 'samco',
    name: 'Samco Mutual Fund',
    patterns: [/\bsamco\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=samco.in&sz=128',
    altLogoUrl: null,
  },
  {
    slug: 'jm-financial',
    name: 'JM Financial Mutual Fund',
    patterns: [/\bjm[\s-]*financial\b/i, /\bjm\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/JMFINANCIL.NS',
    altLogoUrl: null,
  },
  {
    slug: 'shriram',
    name: 'Shriram Mutual Fund',
    patterns: [/\bshriram\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/SHRIRAMFIN.NS',
    altLogoUrl: null,
  },
  {
    slug: 'trust',
    name: 'Trust Mutual Fund',
    patterns: [/\btrust[\s-]*(mutual|mf)\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=trustmf.com&sz=128',
    altLogoUrl: null,
  },
  {
    slug: 'bajaj-finserv',
    name: 'Bajaj Finserv Mutual Fund',
    patterns: [/\bbajaj[\s-]*(finserv|amc)\b/i],
    logoUrl: 'https://assets.parqet.com/logos/symbol/BAJAJFINSV.NS',
    altLogoUrl: 'https://financialmodelingprep.com/image-stock/BAJAJFINSV.NS.png',
  },
  {
    slug: 'helios',
    name: 'Helios Mutual Fund',
    patterns: [/\bhelios\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=heliosmf.in&sz=128',
    altLogoUrl: null,
  },
  {
    slug: 'old-bridge',
    name: 'Old Bridge Mutual Fund',
    patterns: [/\bold[\s-]*bridge\b/i],
    logoUrl: 'https://www.google.com/s2/favicons?domain=oldbridgecap.com&sz=128',
    altLogoUrl: null,
  },
];

/**
 * Resolve an AMC from any text string — fund house name, scheme name, or holding symbol.
 * Returns the matched AMC object or null.
 *
 * Example inputs:
 *   - "HDFC Liquid Fund - Direct Plan - Growth Option"
 *   - "HDFC Mutual Fund"
 *   - "Axis ELSS Tax Saver Fund"
 *   - "Parag Parikh Flexi Cap Fund - Direct Plan"
 */
export const resolveAmcFromText = (text) => {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.trim();
  if (!cleaned) return null;

  for (const amc of VERIFIED_AMCS) {
    for (const pattern of amc.patterns) {
      if (pattern.test(cleaned)) {
        return amc;
      }
    }
  }

  return null;
};

/**
 * Search AMCs by query string — fuzzy matches on slug, name, and patterns.
 * Returns array of matching AMC objects, sorted by relevance.
 */
export const searchAmcs = (query = '') => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return VERIFIED_AMCS.slice(0, 20);

  const exact = [];
  const starts = [];
  const contains = [];

  for (const amc of VERIFIED_AMCS) {
    const slug = amc.slug.toLowerCase();
    const name = amc.name.toLowerCase();

    if (slug === q || name === q) {
      exact.push(amc);
    } else if (slug.startsWith(q) || name.startsWith(q)) {
      starts.push(amc);
    } else if (slug.includes(q) || name.includes(q)) {
      contains.push(amc);
    } else {
      // Also try pattern-based match
      for (const pattern of amc.patterns) {
        if (pattern.test(query)) {
          contains.push(amc);
          break;
        }
      }
    }
  }

  return [...exact, ...starts, ...contains];
};
