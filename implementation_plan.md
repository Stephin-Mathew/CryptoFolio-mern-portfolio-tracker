# Implementation Plan & Architecture Evolution: AI-Powered Multi-Asset Portfolio Tracker

> **Current Status**: Complete & Production-Ready  
> **Last Updated**: November 2026  
> **Repository**: `portfolio` (Client: React 19 + Vite + Tailwind CSS v4 | Server: Node.js + Express + MongoDB)

---

## 1. Executive Summary & Evolution Overview

The **AI-Powered Portfolio Tracker** originated as a baseline MERN application to track crypto and stock holdings with Gemini Vision screenshot parsing. 

Throughout development, the application evolved significantly from a simple prototype into an **enterprise-grade, multi-asset wealth management platform**. It now features:
- **Resilient 4-tier AI/OCR extraction pipeline** (Gemini Vision multimodal, Gemini Text, concurrent Groq & OpenRouter OCR race, and Tesseract.js background pre-processing) with screenshot price mismatch resolution and prompt engineering JSON modals.
- **Enterprise authentication** via **Clerk** with seamless JWT fallback, memory caching, and race-condition deduplication.
- **Hierarchical wallet management** with cascade deletion, multi-wallet grouping, and wallet-level analytics.
- **Comprehensive multi-asset market pricing** spanning **Crypto** (CoinMarketCap API with custom DNS resolver to bypass ISP blocking, Hyperliquid ecosystem tokens), **Global & Indian Equities** (Yahoo Finance), and **Indian Mutual Funds** (AMFI NAV tracking via `mfapi.in` with automatic scheme variant resolution).
- **Multi-currency valuation engine** (`USD`, `INR`, `BTC`, `HYPE`) with live USD-to-INR forex feeds and Indian numbering notation (Lakhs and Crores).
- **Advanced portfolio analytics & snapshot tracking** powered by `node-cron` hourly snapshots, concentration risk analysis, drawdown tracking, ECharts/Recharts time-series performance, and asset allocation donut visualizations.
- **High-density Apex glassmorphic UI** featuring collapsible icon rails, responsive bottom tab bars, and optimistic UI updates with automatic rollbacks.

---

## 2. Plan vs. Actual Implementation Comparison

| Domain | Original Implementation Plan | Actual Implementation (What Changed) | Status |
| :--- | :--- | :--- | :--- |
| **Authentication** | Basic custom email/password registration with bcrypt & local JWT tokens. | **Clerk Enterprise Authentication** (`@clerk/clerk-react`, `@clerk/express`) with OAuth/Email sign-in, user profile sync (`clerkId`), memory caching (`userCache` 2 min TTL), token readiness gating, 401 auto-retry, and backwards-compatible legacy JWT fallback. | **Enhanced** |
| **Asset Support** | Crypto, Stock, and Cash. | Added **Indian Mutual Funds** with AMFI scheme codes, NAV history, and scheme variant matching (Direct/Regular, Growth/IDCW). Enhanced Cash with INR, USD, USDT, USDC. | **Enhanced** |
| **Wallets Architecture** | String field (`walletOrAccount`) inside Holding model. | Dedicated **`Wallet` MongoDB Collection & Model** (`name`, `type`, `description`, `color`, `icon`), wallet aggregation pipelines, wallet detail views, and cascading deletion of holdings. | **Added** |
| **AI Extraction Pipeline** | Single call to `@google/genai` with fallback mock data. | **4-Tier Resilient Extraction Pipeline**: Tier 1 Gemini Vision Multimodal, Tier 2 Gemini Text, Tier 3 Groq (`openai/gpt-oss-120b`) & OpenRouter concurrent race (`Promise.any`), Tier 4 graceful manual fallback. Background Tesseract.js + Sharp OCR pre-computation. Price & total value mismatch resolution. | **Enhanced** |
| **Manual JSON Extraction** | Not planned. | **`JsonExtractModal`**: Complete prompt-engineering workspace. Copy prompt to external LLMs (ChatGPT/Claude/Gemini), paste JSON, auto-clean, repair syntax errors, and live quote validation. | **Added** |
| **Pricing Engine** | Basic CoinMarketCap fetch with static mock quotes. | **Multi-Provider Engine**: CoinMarketCap with custom Google/Cloudflare DNS resolver (bypasses ISP blocks), Yahoo Finance for stocks, AMFI `mfapi.in` for mutual funds, live forex rates via open exchange rate API, and dynamic fallback safety nets. | **Enhanced** |
| **Symbol & API Mapping** | Static symbol mapping. | **`ApiMappingModal`**: Interactive dialog to search AMFI scheme codes or Yahoo symbols with live quote preview and delta calculation against screenshot prices. | **Added** |
| **Price Overrides** | Not planned. | **`PriceOverride` Model & `PriceEditModal`**: User-defined custom valuation per symbol with single-click reset to live market prices. | **Added** |
| **Multi-Currency** | USD only. | **Universal Currency Switcher**: USD, INR (Lakh/Crore formatting), BTC, and HYPE across all dashboard widgets, tables, and charts. | **Added** |
| **Historical Analytics** | Not planned. | **`PortfolioSnapshot` Model & Cron Job**: Hourly background snapshot capture, multi-timeframe analytics (`24h`, `7d`, `30d`, `90d`, `1y`, `All`), drawdown metrics, concentration index, and top movers. | **Added** |
| **Frontend UI/UX** | Basic Tailwind dashboard with single table. | **Apex Modern App Shell**: Responsive icon rail, expandable sidebar, bottom mobile tabs, Overview page, Holdings page, Wallets page, Wallet detail page, Cash wallet page, and comprehensive Analytics page. | **Enhanced** |
| **Deployment Setup** | Local development only. | Production-ready Vercel SPA client configuration, Render Node API configuration with CORS and dynamic base URL resolution, and `mongodb-memory-server` local zero-setup fallback. | **Added** |

---

## 3. Detailed Architectural Changes

### 3.1 Backend Architecture (`server/`)

#### 1. Data Models (`server/src/models/`)
- **`User.js`**: Extended beyond email/password to include Clerk identity fields (`clerkId`, `firstName`, `lastName`, `imageUrl`) with unique sparse indexing.
- **`Wallet.js` [NEW]**: Structured wallet entities supporting types (`crypto`, `stocks`, `bank`, `mixed`), custom hex colors, UI icon keys, and relational association with holdings.
- **`Holding.js`**: Upgraded with:
  - `assetType`: Enum expanded to `['crypto', 'stock', 'mutual_fund', 'cash']`.
  - `walletId`: Direct ObjectId reference to `Wallet`.
  - `yahooSymbol`: Specific ticker for stock market pricing (e.g. `CANBK.NS`, `AAPL`).
  - `mfSchemeCode`: AMFI numeric code for mutual fund NAV tracking (e.g. `149800`).
  - `lastScreenshotPrice`: Historical audit trail of the price detected at the time of screenshot capture.
- **`PortfolioSnapshot.js` [NEW]**: Captures periodic time-series records of total net worth, breakdown by crypto, stock, and cash, and snapshot metadata (`hourly`, `manual`).
- **`PriceOverride.js` [NEW]**: Allows users to specify fixed or manual valuation overrides for individual tickers or illiquid assets.
- **`PriceCache.js`**: Enhanced to store 24h, 7d, and 30d percentage changes, native currency (`USD` vs `INR`), scheme codes, and TTL expiration tracking.

#### 2. Services & Business Logic (`server/src/services/`)
- **`extraction/extractionPipeline.js` [NEW ARCHITECTURE]**:
  - **Tier 1 (Gemini Multimodal)**: Direct image buffer analysis using `@google/generative-ai` with structured JSON schema enforcement.
  - **Tier 2 (Gemini Text-Only)**: Ingests raw OCR output into Gemini text models if multimodal parsing fails.
  - **Tier 3 (Third-Party Race)**: Concurrent execution of Groq (`groq-sdk`) and OpenRouter via `Promise.any`, returning the fastest valid parsed result.
  - **Tier 4 (Manual Entry Fallback)**: Returns raw OCR string so user never loses their uploaded information.
  - **Background Pre-computation (`ocrExtract.js`)**: Runs `tesseract.js` and `sharp` image optimization in parallel with Tier 1 to avoid latency cascades.
  - **Validation & Mismatch Resolution (`validateExtraction.js`)**: Resolves discrepancies between quantity, unit price, and total invested value before presenting to client.
- **`priceService.js` [EXPANDED]**:
  - **DNS Bypass Engine**: Uses `dns.Resolver` with `8.8.8.8` and `1.1.1.1` to bypass ISP blocking on cryptocurrency endpoints like CoinMarketCap.
  - **Yahoo Finance Engine**: Real-time batch fetching for NSE/BSE and US equities.
  - **AMFI Mutual Funds Engine**: Direct integration with `mfapi.in`, scheme search, batch NAV retrieval, and nearest-price variant heuristics.
  - **Forex Engine (`fetchLiveInrRate`)**: Live USD-to-INR conversion rate with 15-minute caching and fallback.
  - **Price Refresh Cron (`initPriceCron`)**: Auto-updates active user holding prices every 5 minutes.
- **`historyService.js` [NEW]**:
  - Auto-captures portfolio valuations hourly (`initSnapshotCron`).
  - Aggregates historical snapshots across customizable timeframes (`24h`, `7d`, `30d`, `90d`, `1y`, `All`).
  - Provides administrative snapshot clearing endpoint (`DELETE /api/portfolio/history`).

#### 3. API Routes (`server/src/routes/`)
- `/api/auth`: Handles Clerk session sync (`GET /api/auth/me`), legacy registration, and legacy login.
- `/api/wallets`: Complete CRUD for wallets, including MongoDB aggregation pipelines for instant per-wallet counts and cascading delete endpoints.
- `/api/holdings`: CRUD for individual holdings, batch imports (`POST /batch`), and wallet-specific clearing (`DELETE /wallet/:walletId`).
- `/api/prices`: Quotes retrieval, forced refresh (`POST /refresh`), symbol quote inspection (`GET /quote/:symbol`), and manual price overrides (`POST /override`, `DELETE /override/:symbol`).
- `/api/extract`: Multi-image multipart upload supporting Gemini Vision, OCR, Groq, and OpenRouter.
- `/api/portfolio`: Snapshot history queries, on-demand valuation capture, and history reset.

---

### 3.2 Frontend Architecture (`client/`)

#### 1. Core Framework & State Management
- **React 19 & Vite 6**: Leveraging modern React paradigms, clean hooks, and optimized build pipelines.
- **Tailwind CSS v4**: Theme engine based on modern CSS variables, supporting glassmorphic transparency, custom scrollbars, and high contrast data tables.
- **`AuthContext.jsx`**: Integrates Clerk React (`@clerk/clerk-react`) with dynamic token provider registration in Axios, memory token caching, and proactive user sync.
- **`WalletContext.jsx`**: Centralized store for user wallets, unassigned asset counts, and CRUD handlers.
- **`CurrencyContext.jsx`**: Real-time multi-currency formatter supporting `USD`, `INR`, `BTC`, and `HYPE`, including Indian Lakh/Crore compact notation.
- **`axiosInstance.js`**: Token readiness gating promise (`_tokenReadyPromise`), auto-retry on 401 with token refresh, and dynamic backend URL discovery.

#### 2. Views & Navigation Structure
- **App Shell (`AppShell/`)**:
  - `IconRail.jsx`: Minimalist desktop left rail for fast navigation and modal launching.
  - `ExpandedSidebar.jsx`: Collapsible side panel listing all user wallets with real-time valuations.
  - `TopBar.jsx` & `TabBar.jsx`: Context-aware header with net worth badges, currency selectors, quick actions, and Clerk profile buttons.
  - `BottomTabBar.jsx`: Mobile navigation bar optimized for touch screens.
- **`OverviewPage.jsx`**: High-level command center with key metrics, net worth across 4 currencies, wallet valuation cards, and aggregated holdings.
- **`HoldingsPage.jsx`**: Unified holdings manager with multi-criteria tab filtering (`All`, `Crypto`, `Stocks`, `Mutual Funds`, `Cash`), column sorting, and inline click-to-edit.
- **`WalletsPage.jsx` & `WalletDetailPage.jsx`**: Full wallet portfolio manager, showing allocation percentages, asset breakdowns, wallet edits, and batch deletion.
- **`CashWalletPage.jsx`**: Dedicated liquid assets dashboard tracking fiat cash and stablecoin reserves.
- **`AnalyticsPage.jsx`**: Comprehensive quantitative suite:
  - Historical portfolio net worth charts (ECharts & Recharts).
  - Asset allocation donut chart.
  - Wallet allocation breakdown.
  - Risk metrics panel (concentration index, top 1/3/5 asset weights).
  - Top gainers and losers.
  - Drawdown analysis from all-time highs.
  - Realized/unrealized PnL contribution matrix.

#### 3. Modals & Interactive Workflows
- **`ScreenshotUploadModal.jsx`**: Multimodal upload interface supporting drag-and-drop, image preview, extraction tier indicators, and progress spinners.
- **`ExtractionReviewModal.jsx`**: Mandatory staging table before saving extracted holdings, allowing row editing, symbol remapping, and one-click database commits.
- **`JsonExtractModal.jsx`**: Copy-paste prompt utility for external AI tools with JSON schema auto-fixing and live market price previews.
- **`ApiMappingModal.jsx`**: Interactive symbol finder for Indian stocks (NSE/BSE) and mutual funds (AMFI), featuring automatic nearest-NAV detection.
- **`PriceEditModal.jsx`**: Allows setting and removing custom price overrides per symbol.
- **`WalletFormModal.jsx` & `HoldingFormModal.jsx`**: Dialogs for manual asset and wallet creation.
- **`DeleteConfirmModal.jsx`**: Two-step deletion protection requiring typed `DELETE` confirmation for wallets containing assets.

---

## 4. Verification & Testing History

1. **AI Pipeline Multi-Tier Fallbacks**:
   - Verified Gemini Vision multimodal image parsing on crypto screenshots (Binance, Phantom, Hyperliquid) and stock brokerage screenshots (Zerodha, Groww).
   - Validated fallback to Gemini Text, Groq, and OpenRouter when primary API quotas or models are restricted.
   - Tested local OCR pre-computation with Tesseract.js and Sharp.
2. **Pricing Engine & DNS Resilience**:
   - Tested CoinMarketCap API requests under restricted DNS environments using custom Google/Cloudflare resolver.
   - Verified Yahoo Finance stock quotes across US and NSE markets.
   - Verified mutual fund NAV lookups via AMFI scheme codes and fuzzy scheme name matching.
   - Verified live forex conversion to INR, BTC, and HYPE.
3. **Database & Cascade Operations**:
   - Verified wallet deletion with cascade holding removal.
   - Verified memory MongoDB server fallback when `MONGODB_URI` is omitted.
4. **Optimistic UI & Inline Editing**:
   - Tested live editing of quantities and buy prices with instant optimistic UI update and server rollback on simulated network failure.

---

## 5. Next Steps & Future Enhancements

- [ ] Automated tax reporting & capital gains computation (short-term vs long-term).
- [ ] Read-only public portfolio sharing via encrypted tokenized links.
- [ ] On-chain wallet address tracking (EVM / Solana) via RPC balance queries.
- [ ] Push notifications / Telegram bot alerts for significant price movements and target drawdowns.
