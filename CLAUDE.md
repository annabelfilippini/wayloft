# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wayloft** is a travel rewards optimization platform that helps users manage credit card portfolios, track transfer bonuses, search flights, and maximize points/miles value. The project is in **Phase 0, Week 1** — pre-build audit is complete, data foundations are ready, next step is project scaffolding (Turborepo + Next.js + Supabase).

## Repository Structure

This repo currently contains planning documents and data catalogs (no application code yet):

- `WAYLOFT-MASTER-PLAN-V3.md` — Comprehensive development roadmap with week-by-week plan, automation skills/agents, and architecture decisions
- `Tech Stack.md` — Technology choices and rationale
- `001_initial_schema.sql` — Full Supabase/PostgreSQL schema (first migration)
- `credit-cards.json` — Catalog of 50+ credit cards with earning rates, perks, signup bonuses, and transfer partners. Keyed by `slug`.
- `transfer-partners.json` — Transfer partner relationships and ratios for Chase UR, Amex MR, Citi TYP, Capital One, and Bilt
- `Research/` — Completed P0 research (legal, competitive, API evaluations, UX teardowns)

## Planned Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod, Serwist (PWA)
- **Backend:** Next.js API Routes, Hono on Cloudflare Workers (edge), Trigger.dev (background jobs)
- **Scraping:** Python with Playwright + BeautifulSoup on Railway (separate from main app)
- **Browser Extension:** Chrome Extension Manifest V3 with React + Tailwind
- **Database:** Supabase (PostgreSQL) with Row Level Security. Upstash Redis for caching. Cloudflare R2 for file storage.
- **Infrastructure:** Vercel (frontend), Cloudflare Workers (edge), Railway (scrapers), GitHub Actions (CI/CD)
- **Monitoring:** Sentry (errors), PostHog (analytics)
- **Payments:** Stripe. **Email:** Resend.
- **Monorepo:** Turborepo

## Database Schema Conventions

The schema in `001_initial_schema.sql` follows these patterns:
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

## Current Status (Feb 17, 2026)

**Pre-build audit complete.** All 7 critical, 11 important, and 3 minor fixes applied across all three foundation files. Key changes:
- `001_initial_schema.sql` — Fixed signup_bonus_met trigger (spend-based, not date-based), expiring_points view uses per-program inactivity_months, added CHECK constraints, RLS on transfer_bonus_history, 'upgraded' status, next_anniversary_date() helper
- `credit-cards.json` — 52 cards (was 26), standardized earning categories, earning_caps added, Delta currency DL (not DELTA), Freedom Flex→visa, Bilt signup_bonus→null
- `transfer-partners.json` — Added WF + ALTITUDE currencies, 38 cpp_valuations (was 21), JetBlue ratio fixed to 1:0.25, WF/ALTITUDE expiration policies added

**Next up:** Project scaffolding (Turborepo + Next.js + Supabase), run migration, Week 1 sub-agents (trademark, DOT, card art, issuer rules)

## Development Build Order

The master plan specifies this build sequence:
1. Auth + Credit Card Portfolio (card picker, "My Cards" dashboard, bonus tracker)
2. Card Recommendation Engine (spending quiz, scoring algorithm, affiliate links)
3. Transfer Bonus Tracker (Python scrapers for Chase/Amex/Citi/C1/Bilt)
4. Flight Search via Duffel API (commercial flights, points valuation)
5. Browser Extension (DOM enrichers, balance capture, crowdsourced data)
