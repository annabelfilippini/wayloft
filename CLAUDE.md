# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wayloft** is a travel rewards optimization platform that helps users manage credit card portfolios, track transfer bonuses, search flights, and maximize points/miles value. See `WAYLOFT-MASTER-PLAN-V3.md` for the full business plan, timeline, and automation framework.

## Current Status (Feb 27, 2026)

**Loop 2 (Card Recommendation Engine) — in progress.** Loop 1 complete. Spending quiz, scoring algorithm, results UI, and issuer rule checking are built. Scoring engine uses portfolio-aware CPP (accounts for transfer partner gateway cards), 3-tier goal alignment (+25%/neutral/-10%), signup bonus achievability, and credit utilization. 7 issuer rules wired in from `issuer-rules.json`: Chase One Sapphire (hard filter), Chase 5/24, Barclays 6/24, Citi 8/48, Amex once-per-lifetime, Marriott cross-issuer, Capital One triple pull. Quiz collects both 24-month and 48-month card counts for accurate rule checking. Catalog data audited and corrected. Remaining P2 work: card comparison view, card review pages, affiliate infrastructure.

### What's Built

**Infrastructure (Phase 0 — complete):**
- Turborepo monorepo with pnpm workspaces
- Next.js 16.1.6 app (`apps/web`) with App Router, Tailwind v4, TypeScript
- shadcn/ui (New York style, Neutral base) — button, card, input, badge, dialog, dropdown-menu, command, progress, separator, skeleton
- Supabase connected — 7 migrations, 20+ tables with RLS + triggers
- Supabase client helpers (server, browser, middleware) via @supabase/ssr
- GitHub repo: github.com/annabelfilippini/wayloft (private)
- Vercel: auto-deploys on push to main, env vars set
- CI/CD: GitHub Actions (lint, type-check, build)
- Brand identity: Instrument Serif (display) + DM Sans (body), navy/amber/warm stone palette

**Auth system (complete):**
- Login, signup, forgot password, reset password, email verification pages
- Google OAuth with callback handler
- Server actions for auth flows (`app/actions/auth.ts`)
- Auth helpers (`lib/auth/get-user.ts`, `lib/auth/require-user.ts`)
- Middleware for session refresh
- User menu component with sign out

**Card portfolio (complete):**
- Card picker search with fuzzy matching against catalog
- Add card dialog (2-field UX: card_slug + card_since)
- Card grid + card item display with issuer-colored art placeholders
- Card detail view (earning rates, transfer partners with alliance explainer, perks, credits tracker, lifecycle timeline)
- Bonus progress tracker (spend progress bar)
- Card actions menu (dropdown)
- Spend update form with quick-increment buttons (+$500/+$1k/+$2k)
- Annual fee section with retention offer logging
- Empty state for new users
- Server actions for card CRUD + spend increment (`app/actions/cards.ts`)
- Card catalog utilities (`lib/cards/catalog.ts`, `lib/cards/issuer-colors.ts`)

**Spending optimizer (complete):**
- 13 canonical spending categories with earning rate comparison
- CPP-weighted tie-breaking across all user cards
- Category rows with best-card recommendation + full ranking on expand
- Gap detection: amber suggestions for uncovered categories (dining, gas, groceries, streaming, transit)
- Empty state for users with no cards

**Statement credit tracker (complete):**
- Credits tab on card detail page with per-period grouping (monthly/quarterly/semi-annual/annual)
- Progress bars, status badges (used/partial/expiring/expired), mark-as-used (full/partial), enrollment buttons
- Annual fee offset calculator (effective cost = AF - credits used)
- Auto-generates credit usage rows when card is added (Amex Platinum, CSR, Amex Gold)
- `user_credit_usage` table + `expiring_credits` view (migration 003)
- Server actions: `markCreditUsed`, `enrollCredit`

**Perks & benefits reference (complete):**
- Interactive perk checklist on card detail Perks tab, grouped by category (travel/insurance/lifestyle/financial/dining/status)
- Value summary with progress bar ("3 of 5 perks activated · ~$X,XXX/yr value")
- Status toggle (not_started → in_progress → completed), dismiss as not_applicable
- Structured perks on 3 premium cards (CSR: 8, Amex Platinum: 11, Amex Gold: 5) — non-monetary benefits only
- Auto-generates perk rows when card is added; lazy backfill for pre-existing cards
- `user_perk_setup` table + `unused_perks` view (migration 004)
- Server actions: `markPerkSetup`, `dismissPerk`
- Dashboard: top 3 unused perks by value appear as "Perk" action items
- Fallback: cards without structured perks render the original key_perks string list

**Annual fee decision helper (complete):**
- AF decision helper component: value breakdown (credits + perks vs AF), verdict badge (KEEP/CALL/DOWNGRADE)
- Retention guide with phone numbers, success rates, common offers, past retention history
- Downgrade comparison with lose/keep lists for CSR (3 paths), Amex Platinum (2), Amex Gold (1)
- `DowngradeOption`, `RetentionOffer`, `RetentionData` types + catalog JSON fields
- Wired into AnnualFeeSection with expand/collapse CTA (shows when AF ≤ 60 days)
- Dashboard AF actions show enhanced subtitle for cards with decision data
- No new DB migration — all client-side from existing tables + catalog

**Payment due date tracker (complete):**
- `payment_info` on all 54 cards in catalog, migration 005: `user_payment_info` table + views
- PaymentTracker component on card detail (empty state form + display with autopay badge, late fee warning)
- Server actions: `addPaymentInfo`, `updatePaymentInfo`, `deletePaymentInfo`
- Dashboard: upcoming payments + missing autopay nudges in action items feed

**Experience level system (complete):**
- Migration 006: `experience_level` column on profiles (`beginner`/`intermediate`/`advanced`)
- Onboarding step 0: "How experienced are you?" with visual selector
- `lib/experience.ts` utilities (`getEffectiveLevel`, `isBeginnerOrBelow`, `isAdvanced`, `formatCurrencyName`)
- Settings dropdown to change level, `ExperienceLevel` type in @wayloft/shared
- Conditional rendering: beginner-friendly currency names, portfolio value/cpp hiding

**Education layer (complete):**
- `lib/glossary.ts`: 8-term glossary with beginner + intermediate definitions
- `JargonTip` component: dotted-underline tooltip wrapper, level-aware (no tooltip for advanced)
- `TooltipProvider` in app layout for global tooltip support
- Card detail: earning caps hidden for beginners, portal cpp as friendly sentence
- Optimizer: ¢/$ tooltips, cap warnings hidden for beginners
- Dashboard: "AF" → "Fee" for beginners, cpp tooltips on points portfolio

**Dashboard (complete):**
- Portfolio summary cards (total cards, total AF, active bonuses)
- Points portfolio ("My Points & Miles") with estimated values, expiration badges
- Action items widget (unified deadline feed: signup spend, AF, points expiring, credits expiring)
- Expiration alerts widget
- Add balance dialog

**Onboarding (complete):**
- 2-screen card picker quiz
- Skip banner for users who bypass onboarding

**UX polish pass (Priority 0 — complete, Feb 23):**
- Card tile hierarchy: name bumped to text-base font-semibold, SpendUpdateForm removed from grid tiles (detail page only)
- Amber best_for tags on card detail for visual contrast
- Spend tracker: quick-increment buttons (+$500/+$1k/+$2k) with server-side increment support
- AF section simplified: removed "Your options" block, retention CTA as subtle text link
- Portal value: "Travel portal value" with issuer-specific sublabel
- Alliance explainer: Star Alliance/oneworld/SkyTeam descriptions on transfer partners tab
- Dashboard headers bumped to text-lg font-bold
- Optimizer: removed quick reference card, added gap suggestions with lightbulb icons

**Landing page (complete):**
- Clean navy hero with Instrument Serif headlines
- Features grid (Card Portfolio, Transfer Bonuses, Flight Search)
- CTA section + footer

**Data catalogs:**
- `data/credit-cards.json` — 52 cards with earning rates, signup bonuses, transfer partners
- `data/transfer-partners.json` — bank currencies mapped to airline/hotel partners
- `data/issuer-rules.json` — Chase 5/24, Amex once-per-lifetime, Citi 8/48, etc.

**Research (Phase 0 — complete):**
- Trademark search, DOT/SOT compliance, card art sourcing, issuer rules
- Competitive teardowns (Point.me, Seats.aero), affiliate research, design/UX teardown
- Duffel API deep dive, AwardWallet evaluation
- All reports in `Research/`

**Card Recommendation Engine (Priority 2 — in progress):**
- 5-step spending quiz wizard (`components/recommend/`, saves to `card_quiz_responses`)
- Quiz collects both `cardsOpened24mo` and `cardsOpened48mo` for accurate issuer rule checking
- Scoring engine (`lib/recommend/engine.ts`): pure function scoring cards by first-year value
  - Formula: ongoing rewards + signup bonus + credits offset + goal bonus - annual fee
  - Portfolio-aware CPP via transfer gateway detection (e.g. CFU gets 2.0 cpp UR when user owns CSR)
  - 3-tier goal alignment: strong (+25%), neutral (0%), mismatch (-10%)
  - Signup bonus achievability discount based on user's total monthly spend
  - Credit utilization at 70% factor
  - Filters: owned cards, business cards, credit score gate, annual fee comfort, Chase One Sapphire exclusion
- Issuer rule checking (`lib/recommend/issuer-rules.ts`): data-driven from `issuer-rules.json`
  - Hard filter: Chase One Sapphire (can't hold CSR + CSP simultaneously)
  - Hard warnings (amber): Chase 5/24, Barclays 6/24, Citi 8/48
  - Info warnings (blue): Amex once-per-lifetime, Marriott cross-issuer, Capital One triple pull
  - Severity-based styling in score-card.tsx (amber/AlertTriangle vs blue/Info icon)
- Results UI (`components/recommend/results.tsx`, `score-card.tsx`): ranked cards with value breakdown, top earning categories, reasoning, warnings, retake flow
- Server action returns quiz data for client-side scoring
- Catalog data audited: portal rates separated from direct earning, signup bonuses verified against current offers

**Other:**
- App sidebar navigation (`components/nav/app-sidebar.tsx`)
- Dashboard page stub with actions widget
- Route stubs: bonuses, search, settings
- Community intelligence scan agent + daily cron script
- 7 migrations: initial schema, issuer rules + user credit profile, statement credits, perk setup, payment due dates, experience level, quiz cards_opened_48mo
- `/ship` slash command (commit + update docs)

### What's Next

Priority 2 scoring engine + issuer rule checking are built. Remaining P2 work:
- Card comparison view (side-by-side 2-3 cards)
- Card review pages (10-15, SEO-optimized) for affiliate applications
- "Best cards for X" comparison articles
- Affiliate link infrastructure (FTC disclosure, click tracking)

Then:
- Priority 3: Transfer Bonus Tracker (scrapers, alerts)
- Priority 4: Flight Search via Duffel

### Week 2 gaps (can be done anytime)
- ToS / Privacy Policy (Termly)
- Chrome Web Store dev account
- Build 13 Claude Code skills
- 4 sub-agents: expiration policy verification, airline DOM, bank DOM, MV3 guide

## Repository Structure

```
wayloft/
├── apps/
│   ├── web/                        # Next.js 16.1.6 (App Router, Tailwind v4, shadcn/ui)
│   │   ├── app/
│   │   │   ├── (marketing)/        # Public: landing, login, signup, password flows
│   │   │   ├── (app)/              # Authenticated: dashboard, cards, recommend, bonuses, search, settings
│   │   │   ├── actions/            # Server actions (auth.ts, cards.ts, recommend.ts)
│   │   │   └── auth/callback/      # OAuth callback handler
│   │   ├── components/
│   │   │   ├── auth/               # Auth form, OAuth buttons, submit button, user menu
│   │   │   ├── cards/              # Card grid, card item, picker, bonus progress, credit tracker, etc.
│   │   │   ├── dashboard/          # Actions widget, points portfolio, expiration alerts, 5/24 counter
│   │   │   ├── nav/                # App sidebar
│   │   │   ├── recommend/          # Quiz wizard, steps, results, score card
│   │   │   └── ui/                 # shadcn components
│   │   ├── lib/
│   │   │   ├── auth/               # get-user.ts, require-user.ts
│   │   │   ├── cards/              # catalog.ts, issuer-colors.ts
│   │   │   ├── recommend/          # engine.ts, types.ts, issuer-rules.ts
│   │   │   └── supabase/           # server.ts, client.ts, middleware.ts
│   │   └── middleware.ts           # Supabase auth session refresh
│   ├── extension/                  # Chrome Extension (stub)
│   └── workers/                    # Cloudflare Workers (stub)
├── packages/
│   ├── shared/                     # Types, constants (@wayloft/shared)
│   ├── db/                         # Supabase client + 7 migrations (@wayloft/db)
│   └── email/                      # React Email templates stub (@wayloft/email)
├── scrapers/                       # Python scraper stubs (bonuses, semi_private)
├── data/                           # credit-cards.json, transfer-partners.json, issuer-rules.json
├── Research/                       # 13 completed P0 research reports
├── scripts/                        # daily-community-scan.sh
├── .github/workflows/ci.yml       # CI: lint, type-check, build
├── WAYLOFT-MASTER-PLAN-V3.md      # Full business plan + timeline (consolidated, includes v3.2 additions)
├── turbo.json
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── package.json
```

## Tech Stack

**Active:**
- **Frontend:** Next.js 16.1.6 (App Router), Tailwind CSS v4, shadcn/ui (New York, Neutral)
- **Fonts:** Instrument Serif (display, weight 400), DM Sans (body) — via next/font/google
- **Database:** Supabase (PostgreSQL) — project `wjloligimlldiljeyelh`, 15+ tables with RLS
- **Auth:** Supabase Auth with @supabase/ssr (email + Google OAuth)
- **Infrastructure:** Vercel (auto-deploys from main), GitHub Actions CI
- **Monorepo:** Turborepo with pnpm 10.30.0

**Planned (not yet integrated):**
- TanStack Query, Zustand, React Hook Form + Zod, Serwist (PWA)
- Hono on Cloudflare Workers, Trigger.dev (background jobs)
- Python with Playwright + BeautifulSoup on Railway (scrapers)
- Chrome Extension Manifest V3
- Upstash Redis, Cloudflare R2, Sentry, PostHog, Stripe, Resend
- Duffel API (commercial flight search)

## Database

**Migrations:** `packages/db/migrations/`
- `001_initial_schema.sql` — profiles, user_cards, card_lifecycle_events, loyalty_balances, searches, favorites, alerts, transfer_bonuses, transfer_bonus_history, crowdsourced_availability, email_connections, notification_preferences, semi_private_flights + views + triggers
- `002_issuer_rules_user_data.sql` — issuer rules + user credit profile data
- `003_statement_credits.sql` — user_credit_usage table + expiring_credits view
- `004_perk_setup.sql` — user_perk_setup table + unused_perks view
- `005_payment_due_dates.sql` — user_payment_info table + upcoming_payments/cards_missing_autopay views
- `006_experience_level.sql` — experience_level column on profiles
- `007_quiz_cards_opened_48mo.sql` — cards_opened_48mo column on card_quiz_responses

**Key conventions:**
- UUID primary keys via `gen_random_uuid()`
- User tables reference `profiles(id)` → `auth.users(id)`
- RLS on all tables; user-owns-their-data policies
- `updated_at` auto-managed by `set_updated_at()` trigger
- `user_cards` auto-populated from catalog on insert (trigger: `auto_populate_card_fields()`)
- Views `upcoming_card_actions`, `expiring_points`, `expiring_credits`, `upcoming_payments`, `cards_missing_autopay`, `unused_perks` power dashboard widgets

**Connection:** Supabase JS client only (IPv6-only, no direct DB connection). Env vars in `apps/web/.env.local`.

**IMPORTANT — Running migrations:** There is NO Supabase CLI auth and NO direct DB connection. Do NOT attempt `supabase login`, `supabase db execute`, `psql`, or any REST-based SQL execution. Instead, output the migration SQL for the user to paste into the **Supabase Dashboard SQL Editor**.

## Critical Business Rules

- **Do NOT scrape airline websites** — active litigation risk. Use Duffel API for commercial flights.
- **Seller of Travel registration** required in CA, FL, HI, WA before accepting bookings
- Affiliate revenue (CardRatings, CJ, FlexOffers) is the primary monetization path (55-65%)
- Subscription tiers: Free (limited) and Pro ($9.99/mo)
- `credit-cards.json` is the single source of truth for card metadata
- `transfer-partners.json` is the single source of truth for transfer partner data

## Development Commands

```bash
pnpm turbo dev          # Start dev server (localhost:3000)
pnpm turbo build        # Production build
pnpm turbo type-check   # TypeScript check
pnpm turbo lint         # ESLint
```

**Note:** Turbopack (default in Next.js 16) has an HMR bug that causes page flashing. Use `--webpack` flag for stable dev: `npx next dev --webpack`

## Build Order (from master plan)

1. **Auth + Credit Card Portfolio** ← COMPLETE
2. **Card Recommendation Engine** (spending quiz, scoring, issuer rules, affiliate links) ← IN PROGRESS
3. Transfer Bonus Tracker (Python scrapers)
4. Flight Search via Duffel API
5. Browser Extension (DOM enrichers, balance capture, crowdsourced data)
