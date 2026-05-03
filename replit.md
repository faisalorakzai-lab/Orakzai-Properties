# Orakzai Properties — Premium Real Estate Platform

Pakistan's premier real estate marketplace built for the Lahore & Islamabad market. Gold/navy premium aesthetic, Clerk authentication, PostgreSQL database.

## Architecture

- **Frontend**: React + Vite + Wouter + TanStack Query + Framer Motion + shadcn/ui (`artifacts/orakzai-properties`)
- **API Server**: Express 5 + Drizzle ORM + Clerk auth (`artifacts/api-server`)
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **Auth**: Clerk (whitelabel, proxied through `/api/__clerk`)
- **API Contract**: OpenAPI → Orval codegen → `lib/api-client-react`, `lib/api-zod`

## Theme

- Background: Deep navy `#0a1220` / `#0f1929` / `#050d1a` (investment pages darker)
- Accent: Gold `#C9A84C`
- Fonts: Playfair Display (headings/serif), Plus Jakarta Sans (body/sans)
- Tailwind v4 with `optimize: false` (Clerk themes compatibility)
- Glassmorphism property cards with gold borders

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero search, featured properties, Azan Smart City banner, stats |
| `/browse` | Marketplace — filter by city/category/type/price, category tab bar (All/Buy/Sell/Rent) |
| `/property/:id` | Property detail — gallery, details, WhatsApp CTA, rental-specific CTAs |
| `/post-property` | Post listing form with rental fields (auth required) |
| `/my-properties` | My listings with Available/Rented toggle + My Rental Inquiries (auth required) |
| `/invest` | Investment Portal — fractional investment grid with funding progress bars |
| `/invest/:id` | Investment Detail — roadmap timeline, ROI calculator, share selector |
| `/project/azan-smart-city` | Project launchpad — installment calculator, Book Now dialog, live progress feed |
| `/sign-in`, `/sign-up` | Clerk auth pages (dark gold themed) |

## API Endpoints

- `GET /api/properties` — list with filters (city, category, type, minPrice, maxPrice, search)
- `GET /api/properties/stats` — stats by city/type/category
- `GET /api/properties/my` — authenticated user's listings
- `GET/PATCH/DELETE /api/properties/:id` — property CRUD
- `POST /api/properties` — create listing (auth required)
- `GET /api/projects` — list projects
- `GET /api/projects/:id` — project detail
- `GET/POST /api/projects/:id/updates` — development updates
- `POST /api/bookings` — submit booking inquiry
- `GET /api/bookings` — my bookings (authenticated)
- `GET /api/investment-projects` — list investment projects (with ?status filter)
- `GET /api/investment-projects/:id` — investment project detail
- `POST /api/investment-projects` — create investment project

## Database Schema (`lib/db/src/schema/`)

- `properties` — real estate listings (buy/sell/rent, with rental-specific fields)
- `projects` — mega development projects (Azan Smart City)
- `project_updates` — development progress updates
- `bookings` — plot booking inquiries
- `investment_projects` — fractional investment projects (Plazas, Towers, Smart Cities)

## Key Features

### Module 6 — Elite Rental Engine
- Category tab bar (All / Buy / Sell / Rent with live count badge)
- Rental-specific price format: "PKR 85,000 / mo"
- Rental filter drawer: Furnished Status, Occupancy Type, Duration
- Tenant-Owner WhatsApp "Request to Rent" CTA with pre-filled message
- Owner Available/Rented toggle (PATCH `/properties/:id` with `isAvailable`)
- My Rental Inquiries tracker in localStorage

### Module 13 — Notification & Alert System + Agent Dashboard

**Notification & Alert System:**
- **5 new DB tables**: `notifications`, `notification_settings`, `push_subscriptions`, `property_leads`, `agent_profiles` — all pushed to PostgreSQL
- **WebSocket server** on `/api/ws` — `ws` package attached to the raw HTTP server alongside Express. Maintains `Map<userId, Set<WebSocket>>` for real-time fan-out. Client authenticates by sending `{ type: "auth", userId }` after connect; server confirms with `{ event: "auth_ok" }`. `broadcastToUser(userId, payload)` exported from index.ts and called whenever a notification is created
- **Web Push** — VAPID keys generated (`web-push` package). `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` stored as shared env vars. Push delivery is gracefully disabled when env vars absent. Service worker at `/public/sw.js` handles `push` events and `notificationclick` to open the app
- **`createNotification()` helper** exported from `notifications.ts` route — checks user's settings table before inserting, broadcasts via WS, sends push to all stored subscriptions
- **5 new API endpoints** (all auth-protected): `GET /notifications`, `DELETE /notifications` (clear all), `PATCH /notifications/:id/read`, `POST /notifications/read-all`, `GET/PATCH /notifications/settings`, `POST /notifications/push-subscribe`
- **Bell icon** in Navbar — `<NotificationBell>` component with `AnimatePresence` dropdown, real-time WS connection per user, rose badge for unread count, Mark All Read (CheckCheck icon), Clear All (Trash2), Settings link, per-item mark-read on hover, category color coding (Market=sky, Price=gold, Wealth=emerald, System=purple)
- **`/notifications` page** — Sovereign Alerts Center with filter pills (All / Wealth / Price / Market / System), notification cards with emoji badges, time-ago stamps, animated entrance. Mark All + Clear All in the header
- **`/notification-settings` page** — 4 category toggles (Market Alerts, Price Pulse, Wealth Alerts, System Updates) with animated gold toggle switch; Browser Push section with "Enable Sovereign Alerts" flow — requests browser permission, registers service worker, subscribes to push, stores endpoint in DB; graceful "Blocked" state
- **Notification categories**: `market_alert` 🏠, `price_pulse` 📈, `wealth_alert` 💰, `system` 📢

**Agent & Seller Dashboard (/agent/dashboard):**
- **`GET /agent/dashboard`** — aggregates agent profile (auto-creates on first visit), all listings by `ownerId`, all leads by `agentId`; returns stats (totalListings, activeListings, totalLeads, totalViews), listing items with status (live/pending/sold), lead items
- **`GET/PATCH /agent/profile`** — returns or upserts `agent_profiles` row
- **`POST /agent/lead`** — any client can record a WhatsApp/contact inquiry; used from property detail page to feed agent's lead list
- **Dashboard layout**: fixed left sidebar (desktop) + bottom tab bar (mobile) with 4 tabs: Inventory, Leads, Analytics, Profile
- **Agent header**: agency logo/icon, agency name + verification badge, specialization + experience, "Quick Post" button → `/post-property`
- **4 stat cards**: Total Views, Total Leads, Active Listings, All Listings
- **Inventory tab**: full listing grid — building icon, title+city+price, view/lead counts, Live/Pending/Sold status badge, hover-reveal Edit/MarkSold/Delete action buttons. Empty state with CTA
- **Leads tab**: chronological lead list with lead name, property title, WhatsApp/Contact source badge, date, one-click phone call button on hover. Empty state
- **Analytics tab**: 4 computed metrics (Conversion Rate, Avg Lead/Listing, Views/Listing, Active Rate) + Top Performers table sorted by views
- **Profile tab**: inline edit form — Agency Name, Specialization, Years Experience, Logo URL, Bio textarea; PATCH saves in real-time
- **Navbar**: "Agent" link added to signed-in desktop bar + mobile menu; "🔔 Notifications" in mobile menu

### Module 12 — Investor Portfolio Dashboard (/portfolio)
- Complete wealth-management dashboard replacing the old simple portfolio grid
- **New API endpoint** `GET /portfolio/dashboard` — aggregates wallet balance, all portfolio positions with live P&L, investment ledger, and 6-month performance history; returns in a single request
- **OpenAPI spec** extended with `PortfolioDashboard`, `PortfolioPosition`, `LedgerItem`, `PerformancePoint` schemas; codegen regenerated `useGetPortfolioDashboard` React Query hook
- **Executive Summary Bar (4 cards)**: Total Assets (gold, Playfair), Invested Capital (blue), Unrealized P&L (emerald/rose with trend arrow, ±PKR and ±%), Wallet Balance (gold, clickable link to /wallet)
- **Performance Chart**: `recharts` AreaChart — dual-area (gold for portfolio value, dark blue for invested capital); custom `ChartTooltip` glassmorphic component; gradient fills; 6-month x-axis; abbreviated y-axis (L/Cr/M); auto-refetch every 60s with refresh button
- **Active Positions (tab)**: Dual-column grid of `PositionRow` cards — gold progress-bar header showing ownership %, project icon+title+location, 4-stat grid (Shares/Invested/Current Value/P&L), ownership percentage label, ROI text, **Trade** shortcut button → `/trade/:id`, **Details** → `/invest/:id`; staggered entrance animations
- **Investment Ledger (tab)**: Timeline of `LedgerRow` items with emerald coin icon, project name, shares bought @ price/share, debit amount in emerald, confirmed/pending status badge, monospace timestamp
- **Income Stream section**: Rental Income card (per-position monthly projected ROI breakdown + total monthly) + Dividend History card (shows completed projects' annual dividends, placeholder when none)
- **Tab switcher**: Positions vs Investment Ledger with count badges and gold active indicator
- **Expandable Portfolio CTA**: Gold gradient "Invest More" + Wallet shortcut buttons at bottom
- **Auth gate**: "Investor Access Required" screen with shield icon and sign-in redirect
- **Empty state**: PieChart icon, copy, and "Explore Investment Projects" CTA
- **Performance history computation**: Server-side cumulative investment per month from ledger, simulated growth curve proportional to actual unrealized PnL%, gives realistic upward trajectory chart
- Zero TypeScript errors across all packages

### Module 11 — Ultra-Luxury Property Detail Page (/property/[id])
- Full visual overhaul of PropertyDetail.tsx — high-conversion, ultra-luxury aesthetic
- **Gallery**: 600px cinematic viewport, AnimatePresence slide transitions (scale+opacity), "View All N Photos" overlay button, dot nav dots (wide pill for active), photo counter badge, full **Grid View** modal (lazy staggered animation) with hover Expand overlay, **Lightbox** with animated entrance, keyboard arrow/Esc navigation, gold-border thumbnail strip with ring highlight
- **Sticky sub-header**: `backdrop-blur-xl` gold-bordered bar — Back to Marketplace (gold arrow) + truncated title preview (desktop) + Heart/Share icon buttons
- **Hero Price Card**: Full-width rounded-3xl card, `radial-gradient` gold glow, giant 5–6rem Playfair Display price in `#C9A84C` with `textShadow` glow, per sq.ft. calculation, **Sovereign Verified** inset badge (shield icon, "Price authenticated"), listing ID mono bottom-right
- **Specs Grid (glassmorphic)**: Frosted glass card with `backdrop-blur`, gold left-bar heading accent, SpecPill cells with gold icon rings, hover fill effect
- **Key Features & Amenities**: New section — gold checkmark icons in mini circles, 6 luxury features (security, gated, fibre, parking, generator, water), staggered fade-in animations
- **Description**: Playfair Display `font-serif` sub-headings with gold left-bar accents, 1.85 line-height prose, Listing Details table (Category / Type / City / Area / Listed / ID)
- **3D Map**: 260px perspectived gold grid map, animated MapPin bounce + dual ping rings, Orakzai Map watermark
- **Agent Card (sticky right column)**: `TrustRing` SVG circular progress indicator (animated `strokeDashoffset` on mount, gold gradient stroke), stars row, Response/Properties stat pills, ID Verified + Trusted Agent badges, WhatsApp primary CTA (green gradient), phone secondary button, pre-filled message preview italicised
- **Quick Details card**: Property ID (mono), Listed On, Status badge, Sovereign Verified gold text
- **Sovereign Guarantee seal**: Appears for verified properties — shield icon + authentication copy
- **Floating Action Bar**: Spring-in from bottom (delay 0.55s), gold shimmer top line, 4-zone layout — **Call** (icon+label), **WhatsApp Agent** (full hero green-gradient CTA, flex-1), **Save** (AnimatePresence heart toggle, rose fill), **Share** (gold hover), safe-area-inset-bottom padding
- Zero TypeScript errors across all packages

### Module 10 — Wallet Management System
- Full financial core at `/wallet` (signed-in only, auth gate for unauthenticated)
- **DB Tables**: `wallets` (uuid pk, userId unique, balance, currency, pinHash SHA-256, isPinSet, timestamps), `wallet_transactions` (txnId unique, userId, counterpartyId, amount, type, status, note, balanceAfter, createdAt)
- **Balance Card**: Gold-to-midnight gradient hero card, 50px animated balance counter (ease-out quartic tick-up on load/update), PKR abbreviations (L / Cr), Total In (emerald) / Total Out (red) / Transactions stats, Live SSE indicator
- **Three Action Buttons**: Deposit (emerald tint, ArrowDownLeft), Withdraw (crimson tint, ArrowUpRight), Transfer (gold tint, ArrowLeftRight) — glassmorphic gradient buttons with hover glow
- **Deposit Modal**: Shows Meezan Bank transfer details with copy buttons, amount + note inputs, 2-step confirm flow (form → confirm → success animation)
- **Withdraw Modal**: Amount + bank details form, PIN gate (4-digit numpad PinPad component), pending status returned
- **Transfer Modal**: Recipient User ID + amount + note, PIN required for transfers ≥ PKR 50,000, atomic dual-entry (transfer_out + transfer_in) in same request
- **Set PIN Modal**: 3-step (set → confirm → done), 4-digit numpad, PIN stored as SHA-256 hex hash with ORAKZAI salt, `isPinSet` flag on wallet
- **PinPad Component**: 4-dot progress dots, 3×4 numpad grid, backspace key, spring animations
- **Transaction History**: Filter tabs (All / Deposits / Withdrawals / Transfers / Investments), Green+ incoming, Red− outgoing, status badge (success/pending/failed), staggered fade-in rows, Download Receipt button per successful txn
- **Receipt Generator**: Server-side HTML receipt at `GET /wallet/receipt/:txnId`, branded Orakzai design, opens in new tab, printable
- **Security Info Card**: Pinned at bottom showing encryption notice + PIN protected badge / Set PIN prompt
- **Real-time SSE**: `GET /wallet/stream` per-user EventSource, broadcasts `balance_update` on deposit/withdraw/transfer — balance animates instantly without reload
- **API Endpoints**: `GET /wallet/me` (get/create wallet), `GET /wallet/transactions`, `POST /wallet/deposit`, `POST /wallet/withdraw`, `POST /wallet/transfer`, `POST /wallet/set-pin`, `POST /wallet/verify-pin`, `GET /wallet/stream`, `GET /wallet/receipt/:txnId`
- **Navbar**: Added "Wallet" link (Wallet icon) for signed-in users between Portfolio and Post Property

### Module 9 — Trading Market Interface
- Full secondary-market trading floor at `/trade/:projectId`
- **Ticker Bar**: Project name, Last Price (gold), 24h Change (green/red with arrow), 24h Volume, High/Low, Live/Reconnecting SSE indicator
- **Price Chart**: TradingView Lightweight Charts v5 (`addSeries(AreaSeries)`) — gold area chart on midnight-black bg, 60 seeded price history points (6-hour intervals auto-generated on first load), real trade prices appended live
- **Order Book**: Side panel showing asks (crimson depth bars) above spread and bids (emerald depth bars) below, price + qty + total columns, depth-weighted fill bars
- **Market Sentiment Meter**: Bear-to-Bull gradient bar based on buy-vs-sell order volume ratio with Bullish/Bearish/Neutral label
- **Order Entry Panel**: BUY (emerald) / SELL (crimson) tabs, Limit Price input, Qty +/– picker, live fee calculation (0.5% $OKBOND trading fee → Orakzai Treasury), Net Total display, "Sign In to Trade" gate for unauth users
- **Order Matching Engine** (`orderMatcher.ts`): Price-time priority matching — buyer price >= seller price triggers execution at the resting order's price; partial fills supported; portfolio ownership transferred atomically
- **SSE Real-Time** (`sseController.ts`): Singleton EventSource per projectId; broadcasts `trade` and `orderbook_update` events; 20s heartbeat keepalive
- **My Active Orders Table**: Full order history table with ID, type badge, price, qty, filled, status, time; Cancel button for pending/partial orders
- **Recent Trades Feed**: Live-updating feed of executed trades with price, quantity, fee
- **DB Tables**: `trading_orders` (price-time priority queue), `trades` (execution ledger with 0.5% fee column), `price_history` (time-series for chart)
- **API Endpoints**: `GET /trading/stream/:id` (SSE), `GET /trading/orderbook/:id`, `GET /trading/ticker/:id`, `GET /trading/price-history/:id`, `GET /trading/my-orders/:id`, `POST /trading/orders`, `DELETE /trading/orders/:id`
- **InvestDetail**: Added "Trade on Secondary Market" gold-bordered button linking to `/trade/:id`

### Module 8 — Investment Execution Flow
- `InvestModal` — 3-step gold checkout: Share Selector → Confirmation → Success animation
- Step 1: Live calc (total cost, monthly ROI, annual ROI), FOMO "X shares remaining" badge, +/– share picker
- Step 2: Summary with Sovereign Guarantee notice, "Confirm Investment — PKR X" gold button
- Step 3: Gold coin burst animation (12 coins radiate outward), Digital Certificate flash (spring-animated), "Welcome to the Grid, Chairman [Name]!" message
- `POST /api/investment-projects/:id/invest` — auth-required endpoint: validates share availability, creates ledger entry, upserts user portfolio, increments project fundedShares
- `GET /api/portfolio` — auth-required endpoint: returns enriched portfolio items with currentValue, projectedMonthlyRoi
- `investments_ledger` table — every transaction: transactionId (UUID), userId, projectId, sharesBought, amountPaid, status, createdAt
- `user_portfolios` table — per-user per-project totals: unique(userId, projectId), totalShares, totalInvested, updatedAt
- `Portfolio.tsx` at `/portfolio` — "Chairman [Name]'s Portfolio" header, stats bar (total invested, monthly income, total shares), investment cards per project, "Expand Your Portfolio" CTA, Sovereign Guarantee disclaimer
- Post-purchase: redirects to `/portfolio` with toast "Congratulations Chairman [Name], your investment is now active on the Orakzai Grid"
- Auth gate: portfolio page shows "Sign In Required" shield card with CTA for unauthenticated users
- Navbar: "Portfolio" link (BarChart3 icon) shown to signed-in users between Sign Out and Post Property

### Module 7 — Investment Portal
- Fractional investment in Plazas, Towers, Smart Cities
- Gold funding progress bars with animated fill
- ROI and Duration prominent gold badges on cards
- Status filters: Funding Open / Under Construction / Completed
- Detail page: vertical construction roadmap timeline
- Interactive ROI Calculator (slider → monthly/annual/total projections)
- Share Selector with +/- controls and per-share pricing
- "Secure My Investment" gold gradient button → WhatsApp Investment Desk

## Supabase SQL (to replicate DB schema)

```sql
-- Run in Supabase SQL Editor to create all tables

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(15,2) NOT NULL,
  city TEXT NOT NULL,
  area TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  images JSON NOT NULL DEFAULT '[]',
  owner_id TEXT NOT NULL,
  owner_name TEXT,
  owner_phone TEXT,
  owner_avatar TEXT,
  owner_rating NUMERIC(3,1),
  whatsapp_number TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  beds INTEGER,
  baths INTEGER,
  area_sqft INTEGER,
  furnished_status TEXT,
  occupancy_type TEXT,
  rental_duration TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  banner_image TEXT,
  plot_sizes JSON NOT NULL DEFAULT '[]',
  price_per_marla NUMERIC(15,2) NOT NULL,
  total_plots INTEGER,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_updates (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  plot_size TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS investment_projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  banner_image TEXT,
  total_value NUMERIC(20,2) NOT NULL,
  min_investment NUMERIC(20,2) NOT NULL,
  total_shares INTEGER NOT NULL,
  funded_shares INTEGER NOT NULL DEFAULT 0,
  roi TEXT NOT NULL,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'funding',
  type TEXT NOT NULL DEFAULT 'plaza',
  roadmap JSON NOT NULL DEFAULT '[]',
  features JSON NOT NULL DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```
