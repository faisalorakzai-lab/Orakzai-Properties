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
