# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wayloft** is a travel rewards optimization platform that helps users manage credit card portfolios, track transfer bonuses, search flights, and maximize points/miles value. The project is in **Phase 0, Week 1** — scaffolding complete, database live, deploying to production.

## Repository Structure

Turborepo monorepo with pnpm workspaces:

```
wayloft/
├── apps/
│   ├── web/                    # Next.js 16.1.6 (App Router, Tailwind v4, shadcn/ui)
│   │   ├── app/
│   │   │   ├── (marketing)/    # Public pages (layout stub)
│   │   │   ├── (app)/          # Authenticated pages (dashboard stub + 6 route stubs)
│   │   │   └── api/
│   │   ├── components/ui/      # shadcn components (button, card, input, badge)
│   │   ├── lib/
│   │   │   ├── supabase/       # server.ts, client.ts, middleware.ts
│   │   │   └── utils.ts        # cn() helper
│   │   └── middleware.ts       # Supabase auth session refresh
│   ├── extension/              # Chrome Extension (stub)
│   └── workers/                # Cloudflare Workers (stub)
├── packages/
│   ├── shared/                 # Types, constants, Zod validators (@wayloft/shared)
│   ├── db/                     # Supabase client, migrations (@wayloft/db)
│   │   └── migrations/001_initial_schema.sql
│   └── email/                  # React Email templates (@wayloft/email)
├── scrapers/                   # Python scraper stubs (bonuses, semi_private)
├── data/                       # credit-cards.json (52 cards), transfer-partners.json
├── Research/                   # Completed P0 research
├── .github/workflows/ci.yml   # CI: lint, type-check, build on push/PR
├── turbo.json
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── package.json
```

## Tech Stack (Active)

- **Frontend:** Next.js 16.1.6 (App Router), Tailwind CSS v4, shadcn/ui (New York, Neutral)
- **Database:** Supabase (PostgreSQL) — project `wjloligimlldiljeyelh`, migration deployed, 15 tables live with RLS
- **Auth:** Supabase Auth with @supabase/ssr (server/client/middleware helpers in place)
- **Infrastructure:** Vercel (auto-deploys from main), GitHub Actions CI
- **Monorepo:** Turborepo with pnpm 10.30.0

## Tech Stack (Planned, Not Yet Integrated)

- TanStack Query, Zustand, React Hook Form + Zod, Serwist (PWA)
- Hono on Cloudflare Workers (edge), Trigger.dev (background jobs)
- Python with Playwright + BeautifulSoup on Railway (scrapers)
- Chrome Extension Manifest V3
- Upstash Redis, Cloudflare R2, Sentry, PostHog, Stripe, Resend

## Database Schema Conventions

The schema in `packages/db/migrations/001_initial_schema.sql` follows these patterns:
- All tables use UUID primary keys via `gen_random_uuid()`
- User data tables reference `profiles(id)` which links to `auth.users(id)` (Supabase Auth)
- RLS is enabled on all tables; policies enforce user-owns-their-data
- `updated_at` columns are auto-managed by `set_updated_at()` trigger
- `user_cards` fields auto-populate from `credit-cards.json` catalog on insert — user only provides `card_slug` and optionally `card_since`
- Derived fields (signup deadlines, AF dates, bonus met status) are calculated by the `auto_populate_card_fields()` trigger
- Views `upcoming_card_actions` and `expiring_points` power the dashboard action items widget

## Key Data Model Relationships

- `credit-cards.json` is the source of truth for card metadata; `user_cards.card_slug` is the lookup key
- `transfer-partners.json` maps bank currencies (UR, MR, TYP, C1, Bilt) to airline/hotel partners with transfer ratios
- `transfer_bonuses` stores scraped active promotions; `transfer_bonus_history` archives expired ones
- `crowdsourced_availability` stores browser extension contributions with 6-hour TTL and confidence scoring

## Critical Business Rules

- **Do NOT scrape airline websites** — active litigation risk (Air Canada v. Seats.aero). Use Duffel API for commercial flights.
- **Seller of Travel registration** required in CA, FL, HI, WA before accepting bookings
- Affiliate revenue (CardRatings, CJ, FlexOffers) is the primary monetization path (55-65%)
- Subscription tiers: Free (limited) and Pro ($9.99/mo)

## Current Status (Feb 18, 2026)

**Phase 0 Week 1 — scaffolding complete.** Here's what's done and what's remaining:

### Done
- Turborepo monorepo with pnpm workspaces
- Next.js 16.1.6 app (`apps/web`) with App Router, Tailwind v4, TypeScript
- shadcn/ui initialized (New York style, Neutral base, 4 starter components)
- Supabase connected — migration deployed, all 15 tables + RLS + triggers live
- Supabase client helpers (server, browser, middleware) with @supabase/ssr
- Route groups: (marketing), (app) with dashboard stub
- Shared packages: @wayloft/shared (types), @wayloft/db (Supabase client), @wayloft/email (stub)
- GitHub repo: github.com/annabelfilippini/wayloft (private)
- Vercel: auto-deploys on push to main, env vars set
- CI/CD: GitHub Actions (lint, type-check, build)
- All verification passing: `pnpm turbo build`, `pnpm turbo type-check`, `pnpm turbo dev`

### Remaining Week 1
- **MCP connections** — Supabase MCP server for direct DB access
- **4 research sub-agents:** trademark search, DOT/Seller of Travel, card art collection, issuer rules
- **Brand identity** (owner task) — logo, colors, fonts
- **GTM** (owner task) — Reddit/Twitter/FlyerTalk presence, waitlist

### Next: Week 2
- ToS, Privacy Policy (Termly)
- Chrome Web Store dev account
- Auth config (Supabase Auth providers)
- Deploy skeleton (auth flow, protected routes)
- Core UI components
- Extension popup wireframes
- Build 13 Claude Code skills
- 4 more sub-agents: expiration policy verification, airline DOM, bank DOM, MV3 guide

## Supabase Connection Info

- **Project ID:** wjloligimlldiljeyelh
- **URL:** https://wjloligimlldiljeyelh.supabase.co
- **Note:** Direct DB connection is IPv6-only (no IPv4). Use Supabase JS client or dashboard SQL Editor for migrations.
- **Env vars** are in `apps/web/.env.local` (not committed) and Vercel env settings

## Development Commands

```bash
pnpm turbo dev          # Start Next.js dev server (localhost:3000)
pnpm turbo build        # Production build
pnpm turbo type-check   # TypeScript check across all packages
pnpm turbo lint         # ESLint across all packages
```

## Development Build Order

The master plan specifies this build sequence:
1. Auth + Credit Card Portfolio (card picker, "My Cards" dashboard, bonus tracker)
2. Card Recommendation Engine (spending quiz, scoring algorithm, affiliate links)
3. Transfer Bonus Tracker (Python scrapers for Chase/Amex/Citi/C1/Bilt)
4. Flight Search via Duffel API (commercial flights, points valuation)
5. Browser Extension (DOM enrichers, balance capture, crowdsourced data)
