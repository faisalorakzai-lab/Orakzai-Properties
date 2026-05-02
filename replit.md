# Orakzai Properties — Premium Real Estate Platform

Pakistan's premier real estate marketplace built for the Lahore & Islamabad market. Gold/navy premium aesthetic, Clerk authentication, PostgreSQL database.

## Architecture

- **Frontend**: React + Vite + Wouter + TanStack Query + Framer Motion + shadcn/ui (`artifacts/orakzai-properties`)
- **API Server**: Express 5 + Drizzle ORM + Clerk auth (`artifacts/api-server`)
- **Database**: PostgreSQL via Drizzle ORM (`lib/db`)
- **Auth**: Clerk (whitelabel, proxied through `/api/__clerk`)
- **API Contract**: OpenAPI → Orval codegen → `lib/api-client-react`, `lib/api-zod`

## Theme

- Background: Deep navy `#0a1220` / `#0f1929`
- Accent: Gold `#C9A84C`
- Fonts: Playfair Display (headings/serif), Plus Jakarta Sans (body/sans)
- Tailwind v4 with `optimize: false` (Clerk themes compatibility)
- Glassmorphism property cards with gold borders

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero search, featured properties, Azan Smart City banner, stats |
| `/browse` | Marketplace — filter by city/category/type/price, glassmorphism grid |
| `/property/:id` | Property detail — gallery, details, WhatsApp floating button |
| `/post-property` | Post listing form (auth required) |
| `/my-properties` | My listings with delete (auth required) |
| `/project/azan-smart-city` | Project launchpad — installment calculator, Book Now dialog, live progress feed |
| `/sign-in`, `/sign-up` | Clerk auth pages (dark gold themed) |

## API Endpoints

- `GET /api/properties` — list with filters (city, category, type, minPrice, maxPrice, search)
- `GET /api/properties/stats` — stats by city/type/category
- `GET /api/properties/my` — authenticated user's listings
- `GET/POST /api/properties/:id` — CRUD
- `GET /api/projects` — list projects
- `GET /api/projects/:id` — project detail
- `GET/POST /api/projects/:id/updates` — development updates
- `POST /api/bookings` — submit booking inquiry
- `GET /api/bookings` — my bookings (authenticated)

## Database Schema (`lib/db/src/schema/`)

- `properties` — real estate listings
- `projects` — mega development projects (Azan Smart City)
- `project_updates` — development progress updates
- `bookings` — plot booking inquiries

## Seeded Data

- 6 sample properties across Lahore & Islamabad
- Azan Smart City project (35% progress, 5000 plots, PKR 8.5L/Marla)
- 3 development progress updates

## Key Technical Notes

- Clerk proxy at `/api/__clerk` — `clerkProxyMiddleware` in API server
- `publishableKeyFromHost` used for Clerk key resolution
- `@layer theme, base, clerk, components, utilities;` required before `@import "tailwindcss"` for Clerk themes
- WhatsApp links: `wa.me/{number}?text=...`
- Installment calculator: 4-year plan (48 months), configurable plot size + down payment %
- All prices formatted in PKR Lakh/Crore notation
