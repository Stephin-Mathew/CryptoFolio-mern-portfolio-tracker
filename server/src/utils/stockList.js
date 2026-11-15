/**
 * Curated list of top & widely traded stocks and ETFs (US & Indian NSE/BSE) with verified logos.
 * Used for instant, zero-latency stock logo search and selection in the logo customization modal.
 */
export const VERIFIED_STOCKS = [
  // US Tech & Mega Caps
  { symbol: 'AAPL', name: 'Apple Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/AAPL.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/AAPL' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', logoUrl: 'https://financialmodelingprep.com/image-stock/MSFT.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/MSFT' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', logoUrl: 'https://financialmodelingprep.com/image-stock/NVDA.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/NVDA' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', logoUrl: 'https://financialmodelingprep.com/image-stock/GOOGL.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/GOOGL' },
  { symbol: 'GOOG', name: 'Alphabet Inc. (Class C)', logoUrl: 'https://financialmodelingprep.com/image-stock/GOOG.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/GOOG' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/AMZN.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/AMZN' },
  { symbol: 'META', name: 'Meta Platforms Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/META.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/META' },
  { symbol: 'TSLA', name: 'Tesla Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/TSLA.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/TSLA' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/AVGO.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/AVGO' },
  { symbol: 'ORCL', name: 'Oracle Corporation', logoUrl: 'https://financialmodelingprep.com/image-stock/ORCL.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/ORCL' },
  { symbol: 'CRM', name: 'Salesforce Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/CRM.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/CRM' },
  { symbol: 'ADBE', name: 'Adobe Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/ADBE.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/ADBE' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/AMD.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/AMD' },
  { symbol: 'INTC', name: 'Intel Corporation', logoUrl: 'https://financialmodelingprep.com/image-stock/INTC.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/INTC' },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/QCOM.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/QCOM' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/CSCO.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/CSCO' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/TXN.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/TXN' },
  { symbol: 'IBM', name: 'International Business Machines', logoUrl: 'https://financialmodelingprep.com/image-stock/IBM.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/IBM' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/NOW.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/NOW' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/UBER.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/UBER' },
  { symbol: 'NFLX', name: 'Netflix Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/NFLX.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/NFLX' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/PLTR.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/PLTR' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/COIN.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/COIN' },
  { symbol: 'MSTR', name: 'MicroStrategy Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/MSTR.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/MSTR' },
  { symbol: 'HOOD', name: 'Robinhood Markets Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/HOOD.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/HOOD' },

  // US Financials & Payments
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', logoUrl: 'https://financialmodelingprep.com/image-stock/JPM.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/JPM' },
  { symbol: 'V', name: 'Visa Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/V.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/V' },
  { symbol: 'MA', name: 'Mastercard Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/MA.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/MA' },
  { symbol: 'BAC', name: 'Bank of America Corporation', logoUrl: 'https://financialmodelingprep.com/image-stock/BAC.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/BAC' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', logoUrl: 'https://financialmodelingprep.com/image-stock/WFC.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/WFC' },
  { symbol: 'MS', name: 'Morgan Stanley', logoUrl: 'https://financialmodelingprep.com/image-stock/MS.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/MS' },
  { symbol: 'GS', name: 'The Goldman Sachs Group Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/GS.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/GS' },
  { symbol: 'BLK', name: 'BlackRock Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/BLK.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/BLK' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/PYPL.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/PYPL' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/BRK.B.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/BRK.B' },

  // US Healthcare & Consumer
  { symbol: 'LLY', name: 'Eli Lilly and Company', logoUrl: 'https://financialmodelingprep.com/image-stock/LLY.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/LLY' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/UNH.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/UNH' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', logoUrl: 'https://financialmodelingprep.com/image-stock/JNJ.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/JNJ' },
  { symbol: 'WMT', name: 'Walmart Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/WMT.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/WMT' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', logoUrl: 'https://financialmodelingprep.com/image-stock/COST.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/COST' },
  { symbol: 'PG', name: 'The Procter & Gamble Company', logoUrl: 'https://financialmodelingprep.com/image-stock/PG.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/PG' },
  { symbol: 'HD', name: 'The Home Depot Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/HD.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/HD' },
  { symbol: 'KO', name: 'The Coca-Cola Company', logoUrl: 'https://financialmodelingprep.com/image-stock/KO.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/KO' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/PEP.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/PEP' },
  { symbol: 'MCD', name: "McDonald's Corporation", logoUrl: 'https://financialmodelingprep.com/image-stock/MCD.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/MCD' },
  { symbol: 'DIS', name: 'The Walt Disney Company', logoUrl: 'https://financialmodelingprep.com/image-stock/DIS.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/DIS' },
  { symbol: 'NKE', name: 'NIKE Inc.', logoUrl: 'https://financialmodelingprep.com/image-stock/NKE.png', altLogoUrl: 'https://assets.parqet.com/logos/symbol/NKE' },

  // US Major ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', logoUrl: 'https://assets.parqet.com/logos/symbol/SPY', altLogoUrl: 'https://financialmodelingprep.com/image-stock/SPY.png' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', logoUrl: 'https://assets.parqet.com/logos/symbol/QQQ', altLogoUrl: 'https://financialmodelingprep.com/image-stock/QQQ.png' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/VOO', altLogoUrl: 'https://financialmodelingprep.com/image-stock/VOO.png' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/VTI', altLogoUrl: 'https://financialmodelingprep.com/image-stock/VTI.png' },
  { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/IVV', altLogoUrl: 'https://financialmodelingprep.com/image-stock/IVV.png' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/DIA', altLogoUrl: 'https://financialmodelingprep.com/image-stock/DIA.png' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/IWM', altLogoUrl: 'https://financialmodelingprep.com/image-stock/IWM.png' },
  { symbol: 'SMH', name: 'VanEck Semiconductor ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/SMH', altLogoUrl: 'https://financialmodelingprep.com/image-stock/SMH.png' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', logoUrl: 'https://assets.parqet.com/logos/symbol/GLD', altLogoUrl: 'https://financialmodelingprep.com/image-stock/GLD.png' },
  { symbol: 'SLV', name: 'iShares Silver Trust', logoUrl: 'https://assets.parqet.com/logos/symbol/SLV', altLogoUrl: 'https://financialmodelingprep.com/image-stock/SLV.png' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/ARKK', altLogoUrl: 'https://financialmodelingprep.com/image-stock/ARKK.png' },

  // Indian Stocks (NSE & BSE)
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/RELIANCE.NS' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/TCS.NS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/HDFCBANK.NS' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/INFY.NS' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/ICICIBANK.NS' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/BHARTIARTL.NS' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', logoUrl: 'https://assets.parqet.com/logos/symbol/SBIN.NS' },
  { symbol: 'ITC.NS', name: 'ITC Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/ITC.NS' },
  { symbol: 'LICI.NS', name: 'Life Insurance Corporation of India', logoUrl: 'https://assets.parqet.com/logos/symbol/LICI.NS' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/HINDUNILVR.NS' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/LT.NS' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/BAJFINANCE.NS' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/HCLTECH.NS' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/MARUTI.NS' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/SUNPHARMA.NS' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/TATAMOTORS.NS' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/NTPC.NS' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/ONGC.NS' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/POWERGRID.NS' },
  { symbol: 'TITAN.NS', name: 'Titan Company Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/TITAN.NS' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/KOTAKBANK.NS' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/AXISBANK.NS' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/ADANIENT.NS' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/ADANIPORTS.NS' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/COALINDIA.NS' },
  { symbol: 'WIPRO.NS', name: 'Wipro Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/WIPRO.NS' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/BAJAJFINSV.NS' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/ASIANPAINT.NS' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/NESTLEIND.NS' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/JSWSTEEL.NS' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/TATASTEEL.NS' },
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/ULTRACEMCO.NS' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', logoUrl: 'https://assets.parqet.com/logos/symbol/TECHM.NS' },

  // Popular Indian ETFs (BeES)
  { symbol: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty 50 BeES', logoUrl: 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS' },
  { symbol: 'GOLDBEES.NS', name: 'Nippon India ETF Gold BeES', logoUrl: 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS' },
  { symbol: 'BANKBEES.NS', name: 'Nippon India ETF Nifty Bank BeES', logoUrl: 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS' },
  { symbol: 'ITBEES.NS', name: 'Nippon India ETF Nifty IT BeES', logoUrl: 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS' },
  { symbol: 'JUNIORBEES.NS', name: 'Nippon India ETF Nifty Next 50 BeES', logoUrl: 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS' },
  { symbol: 'LIQUIDBEES.NS', name: 'Nippon India ETF Nifty 1D Rate Liquid BeES', logoUrl: 'https://assets.parqet.com/logos/symbol/NAM-INDIA.NS' },
  { symbol: 'MON100.NS', name: 'Motilal Oswal Nasdaq 100 ETF', logoUrl: 'https://assets.parqet.com/logos/symbol/MOTILALOFS.NS' },
].map((s) => ({
  ...s,
  assetType: 'stock',
}));

/**
 * Search verified stocks by query string (symbol or company name).
 */
export const searchStocks = (query = '') => {
  const raw = String(query || '').trim();
  const q = raw.toLowerCase();
  const cleanQ = q.replace(/\.(ns|bo)$/, '');

  if (!q) return VERIFIED_STOCKS.slice(0, 24);

  const exact = [];
  const symbolStarts = [];
  const nameStarts = [];
  const contains = [];

  for (const s of VERIFIED_STOCKS) {
    const sym = s.symbol.toLowerCase();
    const symBase = sym.replace(/\.(ns|bo)$/, '');
    const name = s.name.toLowerCase();

    if (sym === q || symBase === cleanQ) {
      exact.push(s);
    } else if (sym.startsWith(q) || symBase.startsWith(cleanQ)) {
      symbolStarts.push(s);
    } else if (name.startsWith(q)) {
      nameStarts.push(s);
    } else if (sym.includes(q) || symBase.includes(cleanQ) || name.includes(q)) {
      contains.push(s);
    }
  }

  // If query wasn't matched in curated list, provide dynamic live preview entries
  const list = [...exact, ...symbolStarts, ...nameStarts, ...contains];
  if (list.length === 0 && raw.length >= 1) {
    const upper = raw.toUpperCase();
    const isIndian = upper.endsWith('.NS') || upper.endsWith('.BO');
    const dynamicCandidate = {
      symbol: upper,
      name: `${upper} (Live Lookup)`,
      assetType: 'stock',
      logoUrl: isIndian
        ? `https://assets.parqet.com/logos/symbol/${upper}`
        : `https://financialmodelingprep.com/image-stock/${upper}.png`,
    };
    return [dynamicCandidate];
  }

  return list.slice(0, 30);
};
