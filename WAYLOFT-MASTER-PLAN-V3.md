# Wayloft — Master Business Development Plan

**Version:** 3.1
**Updated:** February 17, 2026
**Status:** Phase 0, Week 1 — Pre-build audit complete, data foundations ready, awaiting project scaffolding
**Owner:** Tom Filippini

---

## What Changed in v3.0 → v3.1

**v3.1 changes (February 17, 2026):**
- **Build priority reordered:** Credit Cards → Flights → Semi-Private. Loop 1 is now Auth + Card Portfolio. Loop 2 is Card Recommendation Engine. Duffel integrated earlier (Weeks 5-7).
- **Card lifecycle management:** Signup bonus tracking (auto-calculated deadlines, spend progress), annual fee reminders, retention offer logging, product change history, points expiration alerts.
- **Auto-populate from catalog:** User provides only card_slug + card_since. Everything else (name, AF, signup bonus, earning rates, expiration policies) auto-fills from credit-cards.json + transfer-partners.json. Postgres triggers calculate all derived fields.
- **Automation scaled to max:** 13 skills (was 7), 12 agents (was 7), 30 sub-agents (was ~18). New skills: card-recommendation, seo-content-page, 
react-email-template, ui-component, test-generator, data-seed-builder. New agents: Card Deadline Notifier, Card Catalog Monitor, Data Quality Monitor, User Engagement Monitor, Affiliate Revenue Monitor.

**v3.0 changes (February 16, 2026):**

Version 3.0 reflects a fundamental strategic shift: **Wayloft will not depend on any single external API for its core functionality.** The previous plan placed Seats.aero (award data) and AwardWallet (balance tracking) on the critical path. This version removes both as dependencies and replaces them with a self-reliant data architecture built on a browser extension, crowdsourced data, manual entry, and email parsing.

**Why:** Both Seats.aero and AwardWallet could cut API access at any time. AwardWallet's co-founder also co-founded Point.me (a direct competitor). As a pre-launch startup, Wayloft has no leverage to negotiate favorable terms. Building on rented infrastructure creates existential risk.

**The new architecture:**
- **Layer 1 (Day 1):** Manual balance entry + transfer bonus tracker + card recommendation engine + CPP calculator. Zero dependencies.
- **Layer 2 (Weeks 4-6):** Chrome extension that enriches airline award search pages AND captures balance/availability data from sites users visit. Crowdsourced data begins accumulating.
- **Layer 3 (Month 2-3):** Gmail/Outlook email parsing for automatic balance updates.
- **Layer 4 (Weeks 5-7):** Duffel for commercial flight search (the one worthy external dependency — well-funded company, reliable API, startup-friendly).
- **Layer 5 (Month 6+, from strength):** Approach Seats.aero and AwardWallet as a product with users and leverage. These become additive integrations, not foundational dependencies.

**v3.1 priority reorder (Credit Cards → Flights → Semi-Private):**
- Loop 1 is now Auth + Credit Card Portfolio (the core product identity)
- Loop 2 is Credit Card Recommendation Engine (affiliate revenue driver)
- Loop 3 is Transfer Bonus Tracker (natural extension of card portfolio)
- Loop 4 is Flight Search via Duffel (integrated earlier, Weeks 5-7)
- Loop 5 is Browser Extension (parallel track)
- Semi-Private Discovery moves to Week 8 (last feature before polish)

**Other v3.0 changes:**
- Rebranded from "Miles Optimizer" to "Wayloft" throughout
- Added `extension/` to monorepo structure
- New skill: `chrome-extension`
- Updated database schema for crowdsourced data and manual balances
- Loop 5 completely rewritten (extension replaces award scraping)
- New Loop 5a: Email Parsing (Month 2-3)
- Revenue model reordered: affiliates primary (55-65%), subscriptions secondary (25-30%)
- Research register updated (16 of 20 items resolved)
- Award scraping sub-agents (R7, R8, R9) removed as moot

---

## How to Use This Document

This plan is organized into **8 Tracks** that run in parallel across **4 Phases**. Each track has owners, deliverables, dependencies, and research tasks. The phases are:

- **Phase 0: Foundation (Weeks 1-2)** — Business setup, tech decisions, environment config
- **Phase 1: Core Build (Weeks 3-8)** — MVP features, extension, design system, first deploy
- **Phase 2: Polish & Launch (Weeks 9-12)** — Monetization, testing, public beta
- **Phase 3: Growth (Months 4-9)** — Advanced features, partnerships from strength, paid acquisition

Tracks can (and should) run in parallel. Dependencies are called out explicitly.

**Automation Framework** (Agents, Sub-Agents, Skills) is unchanged from v2.0. See v2.0 for full automation framework documentation.

---

## Self-Reliant Data Architecture

This is the core strategic change in v3.0. Every data source Wayloft needs has a path that doesn't depend on any single external partner.

### Award Availability Data

| Layer | Source | How It Works | Timeline | Cost | Risk |
|-------|--------|-------------|----------|------|------|
| **1. Extension enrichment** | User's own airline searches | Chrome extension reads DOM when user searches United.com, AA.com, etc. Overlays Wayloft intelligence (CPP, transfer path, bonus awareness) directly on the page. | Weeks 4-6 | $0 | None — user is accessing their own data |
| **2. Crowdsourced data** | Opt-in from extension users | With permission, extension anonymously contributes availability data back to Wayloft's database. More users = fresher data. | Weeks 6-8 | $0 | Privacy policy required. Opt-in only. |
| **3. Link-out model** | Seats.aero / Point.me / airline sites | For web users without the extension, Wayloft provides the intelligence layer and links out to existing search tools. | Day 1 | $0 | No data dependency |
| **4. Seats.aero API (optional)** | Licensed data | Approach Seats.aero from strength once Wayloft has users. Additive, not foundational. | Month 6+ | $200-1k/mo | They can say no. Product works without it. |

### Loyalty Balance Data

| Layer | Source | How It Works | Timeline | Cost | Risk |
|-------|--------|-------------|----------|------|------|
| **1. Manual entry** | User self-reports | Onboarding quiz: "What cards do you have? Roughly how many points?" Beautiful UI with card picker, sliders. Monthly nudges to update. | Day 1 | $0 | Users may not maintain it |
| **2. Extension capture** | User visits loyalty sites | When user visits chase.com/ultimate-rewards, the extension reads the balance from the page and syncs to Wayloft. | Weeks 4-6 | $0 | Only works when user visits the site |
| **3. Email parsing** | Gmail/Outlook API | With permission, scan for loyalty program emails (statements, confirmations, bonus posts). Extract balance data via pattern matching. | Month 2-3 | $0 | Requires email access permission. Not real-time. |
| **4. Screenshot OCR** | User uploads screenshot | "Snap your balance" — user takes screenshot of loyalty app, Wayloft OCR extracts the number. Mobile-first fallback. | Month 3-4 | $0 | Manual, but frictionless |
| **5. AwardWallet (optional)** | OAuth partnership | Approach AwardWallet from strength. Position Wayloft as distribution channel. | Month 6+ | $500-2k/mo | Competitive conflict with Point.me. They can say no. |

### Transfer Bonus Data

| Source | How It Works | Timeline | Cost | Risk |
|--------|-------------|----------|------|------|
| **Own scrapers** | Python scrapers hit Chase, Amex, Citi, Capital One, Bilt transfer pages 3x/day. Detect bonus changes. Alert users. | Weeks 5-6 | $0 (infra only) | Medium legal risk. Stop if C&D. |

### Commercial Flight Data

| Source | How It Works | Timeline | Cost | Risk |
|--------|-------------|----------|------|------|
| **Duffel API** | Managed Content model. 300+ airlines. No accreditation needed. | Weeks 3-4 (sandbox), Week 6-7 (live) | ~$0 Year 1 | Low. Well-funded company. Search-to-book ratio (1500:1) needs caching. |

---

## Technology Stack

### Frontend
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router)** | SSR for SEO. API routes eliminate separate backend. |
| Styling | **Tailwind CSS v4** | Utility-first. |
| Components | **shadcn/ui** | Accessible, customizable. |
| State | **TanStack Query + Zustand** | Server state + client state. |
| Forms | **React Hook Form + Zod** | Type-safe validation. |
| PWA | **Serwist** | Installable, push notifications. |

### Backend
| Layer | Choice | Why |
|-------|--------|-----|
| API | **Next.js API Routes + Hono (edge)** | Hybrid approach. |
| Jobs | **Trigger.dev** | TS-native scheduled jobs. |
| Scraping | **Python (Playwright + BeautifulSoup)** | Bank transfer bonus pages. Railway hosting. |

### Browser Extension
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Chrome Extension Manifest V3** | Required for Chrome Web Store. |
| UI | **React + Tailwind** (popup/options) | Same stack as web app. |
| Content Scripts | **TypeScript** | DOM reading, overlay injection. |
| Storage | **chrome.storage.sync** | Cross-device settings sync. |
| Messaging | **Chrome runtime messaging** | Content script ↔ background worker communication. |

### Data Layer
| Layer | Choice | Why |
|-------|--------|-----|
| Database | **Supabase (PostgreSQL)** | Free tier. Auth. RLS. Real-time. |
| Cache | **Upstash Redis** | Serverless. Flight cache, rate limiting. |
| File Storage | **Cloudflare R2** | Zero egress. |
| Search | **pg_trgm → Meilisearch** | Start Postgres trigram, upgrade later. |

### Infrastructure
| Layer | Choice | Why |
|-------|--------|-----|
| App Hosting | **Vercel** | Native Next.js. |
| Edge Workers | **Cloudflare Workers** | Hono edge functions. |
| Scraper Hosting | **Railway** | Python containers. $5/mo. |
| Monorepo | **Turborepo** | Manages all packages. |
| CI/CD | **GitHub Actions** | Lint, type-check, test, deploy. |
| Errors | **Sentry** | Runtime error tracking. |
| Analytics | **PostHog** | Product analytics, session replay. |
| Email | **Resend** | Transactional + marketing. |
| Payments | **Stripe** | Subscriptions. |

---

## Updated Monorepo Structure

```
wayloft/
├── apps/
│   ├── web/                    # Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── (marketing)/    # Public pages (landing, blog, pricing)
│   │   │   ├── (app)/          # Authenticated app pages
│   │   │   │   ├── dashboard/
│   │   │   │   ├── search/
│   │   │   │   ├── bonuses/
│   │   │   │   ├── cards/
│   │   │   │   ├── portfolio/  # Manual entry + extension-synced balances
│   │   │   │   ├── calendar/
│   │   │   │   └── settings/
│   │   │   └── api/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── styles/
│   │   └── public/
│   ├── extension/              # NEW: Chrome Extension (Manifest V3)
│   │   ├── manifest.json
│   │   ├── background/         # Service worker
│   │   ├── content/            # Content scripts (airline site enrichment)
│   │   │   ├── enrichers/      # Per-airline DOM readers
│   │   │   │   ├── united.ts
│   │   │   │   ├── american.ts
│   │   │   │   ├── delta.ts
│   │   │   │   ├── chase.ts    # Balance capture
│   │   │   │   ├── amex.ts     # Balance capture
│   │   │   │   └── generic.ts  # Fallback enricher
│   │   │   └── overlay/        # Injected UI components
│   │   │       ├── CppBadge.tsx
│   │   │       ├── TransferPath.tsx
│   │   │       └── BonusAlert.tsx
│   │   ├── popup/              # Extension popup UI
│   │   ├── options/            # Extension settings page
│   │   └── shared/             # Shared utils between scripts
│   └── workers/                # Cloudflare Workers (Hono)
│       ├── flight-cache/
│       └── webhooks/
├── packages/
│   ├── shared/                 # Types, constants, Zod validators
│   ├── db/                     # Migrations, queries, client
│   └── email/                  # React Email templates
├── scrapers/                   # Python (transfer bonuses only)
│   ├── bonuses/
│   ├── semi_private/
│   └── utils/
├── data/                       # Seed files
├── skills/                     # Claude Code skills (13 total)
│   ├── next-api-route/
│   ├── supabase-migration/
│   ├── bonus-scraper/
│   ├── flight-search-feature/
│   ├── chrome-extension/
│   ├── deploy-pipeline/
│   ├── stripe-billing/
│   ├── card-recommendation/    # NEW: scoring logic, issuer rules, 5/24
│   ├── seo-content-page/       # NEW: card reviews, comparison articles
│   ├── react-email-template/   # NEW: branded responsive emails
│   ├── ui-component/           # NEW: design system enforcement
│   ├── test-generator/         # NEW: API + component + algorithm tests
│   └── data-seed-builder/      # NEW: JSON catalog validation
├── .github/workflows/
├── turbo.json
├── package.json
└── README.md
```

Key change: `scrapers/awards/` directory removed. `apps/extension/` added. `scrapers/` now only contains transfer bonus and semi-private scrapers.

---

## Updated Database Schema (v3.0 additions)

```sql
-- New in v3.0: Manual balance entry + extension-synced balances
CREATE TABLE public.loyalty_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,          -- "Chase Ultimate Rewards", "United MileagePlus"
  program_type TEXT NOT NULL,          -- "credit_card", "airline", "hotel"
  balance INTEGER NOT NULL,
  currency TEXT NOT NULL,              -- "UR", "MR", "UA", "AA", etc.
  source TEXT NOT NULL DEFAULT 'manual', -- "manual", "extension", "email", "awardwallet"
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at DATE,                     -- For programs with expiring points
  tier_status TEXT,                    -- "Gold", "Platinum", etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_name)
);

-- New in v3.0: Crowdsourced award availability (from extension)
CREATE TABLE public.crowdsourced_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  program TEXT NOT NULL,
  cabin_class TEXT NOT NULL,
  miles_price INTEGER,
  taxes_cents INTEGER,
  seats_available INTEGER,
  is_saver BOOLEAN,
  contributed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contributed_at TIMESTAMPTZ DEFAULT NOW(),
  confidence_score FLOAT DEFAULT 1.0,  -- Decays over time
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours'
);

-- New in v3.0: Email parsing connection tracking
CREATE TABLE public.email_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,              -- "gmail", "outlook"
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  last_parsed_at TIMESTAMPTZ,
  programs_detected TEXT[],            -- Programs found in emails
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE public.loyalty_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowdsourced_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own balances" ON public.loyalty_balances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view crowdsourced availability" ON public.crowdsourced_availability FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Authenticated users can contribute" ON public.crowdsourced_availability FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage own email connections" ON public.email_connections FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_balances_user ON public.loyalty_balances(user_id);
CREATE INDEX idx_crowdsourced_route ON public.crowdsourced_availability(origin, destination, departure_date);
CREATE INDEX idx_crowdsourced_expiry ON public.crowdsourced_availability(expires_at);
CREATE INDEX idx_crowdsourced_confidence ON public.crowdsourced_availability(confidence_score DESC);
```

Note: Original schema tables (profiles, searches, favorites, alerts, transfer_bonuses, transfer_bonus_history, card_quiz_responses, notification_preferences, semi_private_flights) remain unchanged from v2.0. The `award_cache` table is repurposed — it now stores crowdsourced data rather than scraped data.

---

## TRACK 1: Business & Legal Foundation

Unchanged from v2.0, except:
- Domain: wayloft.com (not milesoptimizer.com)
- Trademark: "Wayloft" (not "Miles Optimizer")
- Add to Week 2: Chrome Web Store developer account ($5 one-time fee)

---

## TRACK 2: Technical Infrastructure Setup

### Phase 0 (Weeks 1-2)

Same as v2.0 for all cloud accounts, MCP connections, and environment configuration.

**New addition:** Chrome Web Store developer account signup (Week 2, $5).

**Updated .env.example:**
```bash
# Add to existing .env.example:

# Extension
NEXT_PUBLIC_EXTENSION_ID=          # Chrome extension ID (after first publish)
EXTENSION_SYNC_API_KEY=            # API key for extension → Wayloft data sync

# Email Parsing (Month 2-3)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

---

## TRACK 3: Design System & UI Foundation

Unchanged from v2.0 in structure. Brand identity needs to be established for "Wayloft" (not "Miles Optimizer"). The midnight blue + gold palette from v2.0 can evolve to fit Wayloft's personality — elevation, openness, modern loft aesthetic.

**New component additions for v3.0:**

| Component | Priority | Purpose |
|-----------|----------|---------|
| BalanceEntryCard | P0 | Manual balance entry with program logo, slider, quick-edit |
| BalancePortfolio | P0 | Dashboard showing all balances with source indicators |
| ExtensionPrompt | P0 | "Install Wayloft extension" CTA with value prop |
| CppOverlay | P1 | Injected overlay component for extension enrichment |
| TransferPathOverlay | P1 | Extension overlay showing transfer recommendations |
| DataFreshnessIndicator | P1 | "Last updated 3 hours ago" with confidence score |

---

## TRACK 4: Core Feature Development

### Phase 1 (Weeks 3-8) — REORDERED: Credit Cards → Flights → Semi-Private

**Build priority rationale:** Credit card management and recommendations are the core product identity AND the primary revenue driver (55-65% via affiliates). Flight search is the second pillar. Semi-private is the differentiator but least urgent. Duffel is integrated in Weeks 5-7 — earlier than v3.0 — because commercial flight data enriches card recommendations ("your Chase Sapphire Reserve earns 3x on travel, saving you $47 on this flight").

#### Loop 1: Auth + Credit Card Portfolio (Weeks 3-4)

**Goal:** Users sign up, add their credit cards, and see their full points portfolio with card details.

This is the foundation of everything. A user's card portfolio is the lens through which all other features work — transfer bonuses are relevant because of their cards, flight recommendations are personalized because of their earning rates, and affiliate recommendations are smart because we know what they already have.

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| Auth pages (login, signup, forgot PW) | Magic link + Google OAuth working |
| Google OAuth callback | Social login flow complete |
| **"My Cards" page** | Visual grid of user's credit cards with card art, points balance, key earning rates, status badges |
| **Add Card flow (2-field UX)** | User picks card from visual picker → Wayloft auto-fills everything from catalog (name, issuer, AF, signup bonus, earning rates, perks, transfer partners, expiration policy). User optionally sets "when I got this card" (defaults to today). That's it. |
| **Card detail view** | Full earning rates by category, transfer partners, annual fee, key perks, lifecycle timeline — all auto-populated |
| **Signup bonus tracker** | Auto-calculated deadline from catalog timeframe + card_since. Progress bar ("$1,200 of $4,000"), days remaining, urgency badges. User updates spend progress via quick slider. If card_since predates deadline, auto-marked as complete. |
| **Annual fee reminder system** | Auto-calculated from card_since anniversary. "AF posts in 28 days — call for retention offer or downgrade?" with action buttons |
| **Card lifecycle timeline** | Visual history: opened → retention offer → product change → etc. |
| **Retention offer tracker** | Log retention calls, offers received/declined, spending requirements for retention bonuses |
| **Points expiration alerts** | Auto-populated from expiration_policies in transfer-partners.json. Dashboard widget showing expiring balances with urgency levels and "how to save them" suggestions |
| **"Action Items" dashboard widget** | Unified feed of all upcoming deadlines: signup spends, AF dates, expiring points, retention windows |
| **Points portfolio dashboard** | Total points across all programs, value estimate (CPP from catalog), breakdown by currency |
| **Manual balance entry** | Only field regularly updated by user. Quick-edit inline. Optional — defaults to 0. |
| Profile & settings | Home airport, cabin preference, notification prefs |
| Onboarding quiz (2 screens) | "What cards do you have?" → visual card picker (multi-select) → "When did you get each one?" (optional date pickers) → Done. Everything else auto-populates. |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| Supabase Auth config | Email + Google OAuth, magic link |
| Profile auto-creation trigger | New user → profiles row |
| /api/user/profile | CRUD for profile |
| **/api/cards/catalog** | Public endpoint. Returns full credit-cards.json for card picker UI + search. Cached aggressively. |
| **/api/cards/catalog/[slug]** | Public. Single card detail with earning rates, perks, transfer partners, signup bonus. Powers card detail pages + SEO. |
| **/api/user/cards** | POST: accepts only `{ card_slug, card_since? }` — API looks up catalog, auto-populates all fields (name, issuer, AF, signup bonus, deadline, expiration policy). GET: returns user's cards with all computed fields. |
| /api/user/cards/[id]/spend | PATCH: update signup spend progress (the one field users update). Auto-marks bonus_met when threshold hit. |
| /api/user/cards/[id]/lifecycle | POST: log lifecycle events (product change, retention offer, cancel, etc.) |
| /api/user/balances | CRUD for loyalty_balances table. Auto-sets expiration_policy from transfer-partners.json when program_code provided. |
| /api/user/balances/bulk | Bulk update (for extension sync later) |
| /api/user/actions | Query upcoming_card_actions view + expiring_points view for dashboard widget |
| Auth middleware | Protect all /api/user/* routes |
| credit-cards.json catalog | 50+ cards — the single source of truth. All card data flows from here. |
| transfer-partners.json catalog | Transfer partners + CPP valuations + expiration policies. Also single source of truth. |

**Database (see 001_initial_schema.sql for full SQL):**

The key pattern: `credit-cards.json` and `transfer-partners.json` are the **catalog** (single source of truth for card data). The database stores only **user-specific** data. When a user adds a card, the API reads the catalog and auto-populates everything. A Postgres trigger auto-calculates derived fields (deadlines, AF dates, bonus status).

```
user_cards
├── User provides: card_slug + card_since (optional, defaults to today)
├── Auto-populated from catalog: card_name, issuer, currency, annual_fee,
│   signup_bonus_points, signup_spend_requirement, signup_spend_timeframe
├── Auto-calculated by DB trigger: signup_spend_deadline, annual_fee_date,
│   signup_bonus_met (if card_since predates deadline)
└── User updates over time: signup_spend_progress_cents (the ONE field they maintain)

card_lifecycle_events
├── event_type: opened, product_change, downgrade, upgrade, cancelled,
│               retention_offer, retention_declined, annual_fee_posted,
│               annual_fee_waived, signup_bonus_met, signup_bonus_earned
├── product change fields (from_card_slug, to_card_slug)
└── retention offer fields (offer_type, value, spend_requirement)

loyalty_balances
├── User provides: program_code + balance (optional)
├── Auto-populated from catalog: expiration_policy, expiration_notes
└── User updates over time: balance, last_activity_date

upcoming_card_actions (VIEW) — powers dashboard "Action Items" widget
└── Signup spend deadlines + annual fee reminders with urgency levels

expiring_points (VIEW) — powers "Expiring Points" dashboard widget
└── Days until expiration + urgency (critical/warning/ok)
```

**The user experience: pick your cards, set approximate dates, and Wayloft handles everything else.**

**SKILL USED:** next-api-route, supabase-migration.

**SUB-AGENTS dispatched at start of Loop 1:**

| Sub-Agent Task | Deliverable |
|----------------|-------------|
| Build comprehensive credit-cards.json: 50+ popular cards with IATA/issuer codes, earning rates by all categories (dining, travel, groceries, gas, streaming, etc.), transfer partners with ratios, signup bonuses, annual fees, card art URLs, key perks. Production-ready. | credit-cards.json |
| Build transfer-partners.json: Every bank currency (UR, MR, TYP, C1, Bilt) mapped to all airline/hotel transfer partners with ratios, transfer times, and transfer minimums. | transfer-partners.json |
| Build airports.json from OpenFlights. Clean, validate IATA codes, include lat/lng, city, country. Production-ready. | airports.json |

---

#### Loop 2: Credit Card Recommendation Engine (Weeks 4-5)

**Goal:** Personalized card recommendations based on spending profile. Affiliate revenue infrastructure.

This is the primary monetization feature. The recommendation engine needs to be genuinely useful (not just an affiliate funnel) — users should feel like Wayloft understands their situation and is giving advice their smartest travel-hacking friend would give.

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| 5-step spending quiz wizard | Monthly spend by category, travel goals, credit score range, cards opened in 24mo, annual fee comfort |
| Results page | Top 5 recommended cards with reasoning, "why this card for you" |
| **Card comparison view** | Side-by-side compare 2-3 cards on all dimensions |
| Card detail page (public, SEO) | Full card review with earning rates, pros/cons, "best for" use cases |
| **"Cards I should get next" widget** | Dashboard widget based on current portfolio gaps |
| Affiliate link infrastructure | FTC disclosure component, affiliate click tracking, UTM parameters |
| Card review content pages (10-15) | Individual card reviews optimized for SEO — prerequisite for affiliate network applications |
| "Best cards for X" comparison articles (3-5) | "Best cards for dining," "Best first travel card," etc. |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| Scoring algorithm | Weighted scoring based on spend profile, current cards, travel goals |
| /api/cards/recommend | Takes quiz responses, returns ranked cards with reasoning |
| /api/cards | Public card listing with filters |
| /api/cards/[slug] | Individual card detail |
| /api/cards/compare | Compare 2-3 cards |
| Affiliate click tracking | PostHog events for affiliate link clicks (card_slug, source_page, user_id) |
| Card quiz response storage | card_quiz_responses table |

**SKILL USED:** next-api-route for all card endpoints.

---

#### Loop 3: Transfer Bonus Tracker (Weeks 5-6)

**Goal:** Real-time transfer bonus tracking with alerts. Natural extension of the card portfolio.

Transfer bonuses are where the card portfolio becomes actionable: "You have 80,000 Chase UR. Chase is running a 25% bonus to Hyatt right now. That's like having 100,000 Hyatt points — enough for 5 nights at a Category 4."

**Scraper Tasks (Python):**
- Base scraper class (fetch, parse, store, diff detection)
- Chase, Amex, Citi, Capital One, Bilt scrapers
- Trigger.dev scheduling (3x daily: 6am, 12pm, 6pm ET)
- Diff detection → alert dispatch (email + push)

**Frontend:** Bonuses page (filterable by user's cards), BonusCard component, historical bonus view, alert preferences, "What this means for your portfolio" personalization.

**Backend:** /api/bonuses (public, cached), /api/bonuses/history, /api/bonuses/subscribe, email alert templates, web push.

**SKILL USED:** bonus-scraper

---

#### Loop 4: Flight Search + Duffel Integration (Weeks 5-7)

**Goal:** Commercial flight search via Duffel API. Integrated earlier than v3.0 because flight data enriches card recommendations.

Duffel integration runs in parallel with Loop 3. By Week 7, users can search flights AND see which card earns the most on their booking, what their points are worth vs cash, and whether a transfer bonus makes an award booking cheaper.

**Frontend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| Search form (AirportInput, DatePicker, passengers, cabin) | Autocomplete, Zod validation, flexible dates |
| Results page with FlightCards | Results sorted by price, airline, duration. Loading skeleton. |
| FlightCard component | Airline logo, times, duration, stops, price (cash), expandable details |
| **PriceToggle: Cash / Points / CPP** | Toggle between cash price and "how much this costs in points from your portfolio" |
| **"Best card to book with" indicator** | Per-flight recommendation based on user's cards |
| **Value comparison** | "Pay $450 cash or use 30,000 UR (1.5 cpp via portal). Cash is better." |
| Flight detail panel | Sheet on mobile, dialog on desktop. Full booking details. |

**Backend Tasks:**

| Task | Acceptance Criteria |
|------|-------------------|
| Duffel API integration | Search, offers in sandbox. Live by Week 7. |
| /api/flights/search | <3s cached, <10s live, proper error handling |
| Airport autocomplete endpoint | <100ms, fuzzy matching against airports.json |
| Redis flight cache (4hr TTL) | Cache hit <500ms. Respects Duffel 1500:1 search-to-book ratio. |
| Search logging | Writes to searches table |
| **Points valuation engine** | Calculate "this flight costs X points via Y transfer path" for user's portfolio |

**SKILL USED:** flight-search-feature

**SUB-AGENTS dispatched at start of Loop 4:**

| Sub-Agent Task | Deliverable |
|----------------|-------------|
| Build airlines.json: IATA code, name, logo URL, alliance, loyalty program, hub airports. Top 100 airlines. | airlines.json |

---

#### Loop 5: Browser Extension (Weeks 5-7, parallel)

**Goal:** Chrome extension that enriches airline award search pages with Wayloft intelligence AND captures balance/availability data.

Same scope as v3.0 — see v3.0 for full extension architecture, week-by-week breakdown, and sub-agent tasks.

Key change: Extension work now benefits from Loops 1-2 being complete — the extension can reference the user's actual card portfolio and credit card data when generating overlays.

**SKILL USED:** chrome-extension

---

#### Semi-Private Discovery (Week 8)

**Goal:** Semi-private flights (JSX, Tradewind, Contour, Cape Air, Southern Airways) integrated into search results.

| Task | Acceptance Criteria |
|------|-------------------|
| semi-private.json seed data | All routes, carriers, typical pricing |
| SemiPrivateBadge component | Visual badge distinguishing from commercial results |
| Semi-private in search results | Appear alongside Duffel results when route overlaps |
| Carrier info cards | JSX, Tradewind, etc. with value prop, link-out to booking |
| Time savings calculator | "Skip TSA: arrive 15min before departure" |

---

#### Loop 5a: Email Parsing (Month 2-3) — UNCHANGED FROM v3.0

Same scope: Gmail/Outlook API integration for automatic balance tracking.

---

### Phase 2: Polish & Launch (Weeks 9-12)

#### Loop 6: Monetization (Weeks 9-10) — UPDATED

Same Stripe setup as v2.0, with updated tier structure:

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Commercial search (Duffel), transfer bonus tracker (view only), 1 card quiz run, 3 manual balance entries, extension enrichment (basic CPP only) |
| **Pro** | $9.99/mo or $79/yr | Unlimited search, full extension enrichment (transfer paths, bonus alerts, booking guidance), unlimited balances, email parsing, alerts, calendar view, full optimization engine |

**New in v3.0:** Apply to CardRatings + CJ Affiliate + FlexOffers in Week 9. Requires 10-15 card review pages and FTC disclosure (built in Weeks 7-8).

#### Loop 7: Testing & Analytics (Weeks 11-12) — UNCHANGED

#### Loop 8: Launch Prep (Week 12) — UPDATED

Launch now includes Chrome Web Store listing as a launch asset alongside the web app.

---

### Phase 3: Growth (Months 4-9) — UPDATED

| Month | Features | Data Layer | Automation |
|-------|----------|-----------|------------|
| **4** | Email parsing live. Extended calendar (crowdsourced data). | Crowdsourced dataset growing. Email parsing adds balance freshness. | SEO Agent starts. |
| **5** | Seat maps, nonstop filter. Extension v2 (more airlines). | 1,000+ extension users contributing data. | Content engine. 1,000 users. First affiliate revenue. |
| **6** | **Approach Seats.aero from strength.** Real-time card recs from portfolio data. | If Seats.aero says yes: licensed data supplements crowdsourced. If no: crowdsourced is sufficient. | 2,000+ users. |
| **7** | **Approach AwardWallet from strength.** Creative routing. | If AwardWallet says yes: OAuth enriches portfolio. If no: manual + extension + email is sufficient. | 3,000+ users. |
| **8** | Price monitoring, watchlist. Firefox extension. | Dataset maturing. Price Monitor Agent starts. | 5,000 users. |
| **9** | LLM Copilot (Anthropic API). Safari extension (if viable). | | 10,000 users. $100k ARR. |

**The key difference from v2.0:** Seats.aero and AwardWallet partnerships move from "required for MVP" to "nice-to-have acceleration." They're pursued from a position of strength (with users and data), not desperation.

---

## TRACK 5: Data & Scraping Infrastructure — UPDATED

### Architecture (v3.0)

```
                    ┌──────────────────────────┐
                    │   Chrome Extension        │
                    │   (enrichment + capture)  │
                    └──────────┬───────────────┘
                               │ sync
                               ▼
Trigger.dev ──────→ Supabase (PostgreSQL)
  │                    │
  ├── Bonus Scrapers   ├── loyalty_balances (manual + extension + email)
  │   (3x/day)        ├── crowdsourced_availability (extension)
  │                    ├── transfer_bonuses (scrapers)
  ├── Email Parser     └── semi_private_flights (scrapers)
  │   (1x/day)              │
  │                    ┌────┴────┐
  └── Semi-Private     │  API    │  Upstash Redis
      (1x/day)         │(Next.js)│  (cache layer)
                       └─────────┘
```

**What's gone:** Award scraper track (was Python Playwright hitting airline sites). Replaced by extension crowdsource.

**What's new:** Extension data pipeline, email parser pipeline.

### Research Register — UPDATED

| ID | Question | Priority | Status | Outcome |
|----|----------|----------|--------|---------|
| R1 | Scraping legality | P0 | **DONE** | Don't scrape airlines. Transfer bonus scraping OK with caution. |
| R2 | IATA/ARC requirements | P0 | **DONE** | Not needed — Duffel Managed Content. |
| R3 | Trademark "Wayloft" | P0 | **NEEDS RUN** | Original was for "Miles Optimizer." Run USPTO TESS for "Wayloft." |
| R4 | Airline logo usage | P1 | Open | Needed for extension overlays and card UI. Week 4. |
| R5 | Affiliate requirements | P0 | **DONE** | Full report. Apply Week 9. |
| R6 | Scrape vs license awards | P0 | **DONE** | Neither — build extension + crowdsource. License later from strength. |
| R7 | Scraping frequency | — | **MOOT** | Not scraping airlines. |
| R8 | Proxy evaluation | P2 | **REDUCED** | Only for transfer bonus scraping. Smaller scale. |
| R9 | Playwright vs HTTP | — | **MOOT** | Not scraping airlines. |
| R10 | Award data licensing | P2 | **DEFERRED** | Approach Seats.aero Month 6+ from strength. |
| R11 | Point.me teardown | P1 | **DONE** | Full report delivered. |
| R12 | Seats.aero teardown | P1 | **DONE** | Full report delivered. |
| R13 | Affiliate network apps | P0 | **DONE** | CardRatings #1, CJ #2, FlexOffers backup. |
| R14 | TAM analysis | P2 | Open | Week 10. |
| R15 | Acquirer mapping | P2 | Open | Week 11. |
| R16 | UI pain points | P1 | **DONE** | Covered in design teardown. |
| R17 | Competitor UX teardown | P1 | **DONE** | Full report (5 competitors). |
| R18 | Mobile UX research | P1 | **DONE** | Covered in design teardown. |
| R19 | DOT requirements | P0 | **DONE** | Full compliance checklist. |
| R20 | Duffel Managed Content | P0 | **DONE** | Full technical deep dive. |
| **R21** | **Chrome Extension Manifest V3** | **P0** | **NEW** | Research best practices, review requirements, permission model. |
| **R22** | **Airline site DOM structure** | **P0** | **NEW** | Blueprint for United, AA, Delta award search page parsing. |
| **R23** | **Bank site DOM structure** | **P0** | **NEW** | Blueprint for Chase, Amex, Citi balance page parsing. |
| **R24** | **Gmail/Outlook API scopes** | **P1** | **NEW** | Minimum permissions for email parsing. OAuth flow requirements. |

---

## TRACK 6: Go-to-Market — UPDATED

### Extension as GTM Channel

The browser extension is not just a technical feature — it's a distribution strategy:

1. **Chrome Web Store discovery** — users searching for "miles optimizer," "award travel," "credit card points" find Wayloft extension
2. **Viral loop** — extension enriches existing tools (Seats.aero, Point.me, airline sites), so users get value immediately without switching. They then discover the full Wayloft web app.
3. **Community credibility** — "try the free extension" is a much easier ask on r/awardtravel than "sign up for our new paid tool"
4. **Data moat building** — each extension user contributes to the crowdsourced dataset, improving the product for everyone

### Content Strategy — UPDATED

| Content Type | Purpose | Start |
|-------------|---------|-------|
| Transfer bonus posts | SEO + community value | Week 4 |
| **"Best credit cards for X" articles** | **Affiliate revenue prerequisite** | **Week 7** |
| **Individual card review pages (15+)** | **Affiliate network application requirement** | **Week 7-8** |
| Route guides | SEO + demonstrate optimization value | Week 8 |
| Extension tutorials | Drive installs | Week 8 |
| Tool comparisons (Wayloft vs alternatives) | SEO capture | Week 10 |

---

## TRACK 7: Operations & Monitoring — v3.1 (12 Agents)

### Agent Registry

| # | Agent | Purpose | Starts | Runs |
|---|-------|---------|--------|------|
| 1 | **Transfer Bonus Monitor** | Scrapers, validation, diff detection, user alerts | Week 6 | 3x daily |
| 2 | **Card Deadline Notifier** | Scan user_cards for approaching signup spend deadlines (30/14/7 day), AF dates (30 day), expiring points (90/30 day). Triggers email/push via Resend. The "proactive advisor" — #1 retention feature. | Week 6 | Daily 8am ET |
| 3 | **Card Catalog Monitor** | Monitor issuer sites + travel blogs for signup bonus changes, new card launches, AF increases, perk changes. Auto-update credit-cards.json. Without this, catalog goes stale and users see wrong data. | Week 8 | Weekly |
| 4 | **Extension Health Monitor** | Daily checks against known DOM selectors for each airline/bank site. Alert when enrichers likely broken. Critical — extension silently fails without this. | Week 8 | Daily |
| 5 | **Competitive Intel** | Weekly competitor checks (Point.me, Seats.aero, AwardWallet, Cardpointers). Feature parity tracking, pricing changes, new entrants. | Week 8 | Weekly |
| 6 | **Data Quality Monitor** | Check for stale balances (60+ days), expired crowdsourced data, broken card art URLs, orphaned records, API response degradation. Weekly health report. Prevents "phantom data" problem. | Week 10 | Daily |
| 7 | **Community Monitor** | Reddit/FlyerTalk/X scanning for brand mentions, user complaints, feature requests, competitor discussion. | Week 10 | Daily |
| 8 | **Code Quality / DevOps** | Sentry error monitoring, API performance, scraper success rates, deploy health, dependency updates. | Week 12 | Continuous |
| 9 | **SEO Content Pipeline** | Keyword research, content outlines, stale content flagging, internal link opportunities, search ranking tracking. | Month 4 | Weekly |
| 10 | **User Engagement Monitor** | Detect at-risk users (14+ days inactive, abandoned onboarding, stale cards). Trigger re-engagement emails. Monitor onboarding completion rates. Flag UX friction. | Month 4 | Daily |
| 11 | **Affiliate Revenue Monitor** | Track conversion rates per card per placement per page. Flag broken links, underperforming placements. Identify top-converting cards. Suggest rate renegotiation at volume thresholds. | Month 5 | Weekly |
| 12 | **Price Monitor** | Route price checks, drop detection, alert dispatch to subscribed users. | Month 8 | 4x daily |

**Agent architecture:** Each agent is a Trigger.dev scheduled job with its own error handling, retry logic, and Slack/email alerting on failure. Agents 1-2 are the most critical for user retention. Agent 3 protects data integrity. Agent 4 protects the extension.

---

## TRACK 8: Automation Layer — v3.1 (13 Skills, 30 Sub-Agents)

### Skills Registry (13 total — build Week 2)

#### Skill 1: next-api-route
**Pattern:** Sequential Workflow | **Frequency:** 20+ uses
```yaml
name: next-api-route
description: Creates Next.js API route handlers with Supabase auth
  middleware, Zod request validation, typed responses, error handling.
  Use for "create endpoint", "add API route", "backend for".
```
Steps: Create route in app/api/ → Add Zod schema → Add types → Verify auth middleware → Test with curl.

#### Skill 2: supabase-migration
**Pattern:** Multi-MCP Coordination | **Frequency:** 10+ uses
```yaml
name: supabase-migration
description: Creates and runs Supabase database migrations with RLS
  policies, indexes, triggers. Use for "add table", "database change",
  "new migration", "update schema".
```
Steps: Generate SQL (RLS, indexes, timestamps) → Run migration → Update types.

#### Skill 3: bonus-scraper
**Pattern:** Domain-Specific Intelligence | **Frequency:** 5-7 uses
```yaml
name: bonus-scraper
description: Creates Python web scrapers for transfer bonus detection
  on bank websites. Handles automation, proxy rotation, bonus parsing,
  diff detection, Supabase storage. Use for "scrape bonuses", "new
  scraper for", "add bank scraper".
```
Embedded Knowledge: Known page structures per bank, anti-bot patterns, bonus validation, diff detection.

#### Skill 4: flight-search-feature
**Pattern:** Iterative Refinement | **Frequency:** 5-8 uses
```yaml
name: flight-search-feature
description: Builds flight search features including Duffel API
  integration, Redis caching, result display, points valuation.
  Use for "search feature", "flight results", "Duffel", "booking flow".
```
Loop: Initial draft → Quality check (API? UI? Cache? Loading? Mobile?) → Refine → Finalize.

#### Skill 5: chrome-extension
**Pattern:** Domain-Specific Intelligence | **Frequency:** 10+ uses
```yaml
name: chrome-extension
description: Builds Chrome Extension features including content script
  enrichers, DOM readers, overlay components, background worker sync,
  popup UI. Use for "extension feature", "enricher", "content script",
  "balance reader", "overlay component", "Chrome Web Store".
```
Embedded Knowledge: Manifest V3 permissions, SPA content script injection (MutationObserver), per-airline DOM selectors, Chrome Web Store review requirements, cross-origin messaging.

#### Skill 6: deploy-pipeline
**Pattern:** Multi-MCP Coordination | **Frequency:** Ongoing
```yaml
name: deploy-pipeline
description: Manages deployment across Vercel, Cloudflare Workers,
  Railway. Handles preview deploys, production releases, env var
  management. Use for "deploy", "push to production", "preview build".
```
Phases: GitHub CI → Vercel deploy → Cloudflare workers → Railway scrapers. Validation gates between each.

#### Skill 7: stripe-billing
**Pattern:** Sequential Workflow | **Frequency:** 3-5 uses
```yaml
name: stripe-billing
description: Implements Stripe subscription billing including checkout,
  webhooks, portal, feature gating by tier (free/pro). Use for "add
  payments", "subscription", "billing", "pricing page", "feature gate".
```
Embedded Knowledge: Tier structure ($0 free / $9.99 pro), feature gates per tier, webhook event handling.

#### Skill 8: card-recommendation ← NEW
**Pattern:** Domain-Specific Intelligence | **Frequency:** 5-8 uses
```yaml
name: card-recommendation
description: Builds card recommendation engine components including
  scoring algorithms, quiz logic, portfolio gap analysis, "next card"
  suggestions. Use for "recommend card", "card quiz", "scoring",
  "portfolio gap", "next card to get".
```
Embedded Knowledge: Chase 5/24 rule, Amex once-per-lifetime rules, Citi 8/48 and 48-month rules, issuer velocity limits, optimal card ordering strategy (which card to get first), signup bonus valuation formulas, annual fee break-even calculations.

#### Skill 9: seo-content-page ← NEW
**Pattern:** Template Generation | **Frequency:** 15-20 uses
```yaml
name: seo-content-page
description: Creates SEO-optimized card review pages and comparison
  articles. Follows strict template with meta tags, structured data,
  affiliate disclosure, comparison tables. Use for "card review page",
  "best cards for", "comparison article", "SEO content".
```
Embedded Knowledge: SEO title formulas, meta description patterns, schema.org/CreditCard structured data, FTC affiliate disclosure placement, internal linking strategy, keyword targeting per card category.

#### Skill 10: react-email-template ← NEW
**Pattern:** Template Generation | **Frequency:** 8-12 uses
```yaml
name: react-email-template
description: Creates React Email templates for Wayloft notifications.
  Brand-consistent responsive HTML. Use for "email template", "bonus
  alert email", "welcome email", "digest email", "notification email".
```
Embedded Knowledge: Brand colors, email-safe CSS, responsive patterns, CAN-SPAM requirements, unsubscribe link placement, UTM parameter conventions, React Email component library.

#### Skill 11: ui-component ← NEW
**Pattern:** Iterative Refinement | **Frequency:** 20+ uses
```yaml
name: ui-component
description: Creates UI components following Wayloft design system.
  Enforces consistent spacing, color tokens, responsive breakpoints,
  accessibility standards. Use for any new component: "build card
  picker", "create bonus card", "flight card component", etc.
```
Embedded Knowledge: Design token values, shadcn/ui extension patterns, Tailwind v4 conventions, accessibility checklist (ARIA labels, keyboard nav, contrast ratios, focus management), mobile-first responsive breakpoints.

#### Skill 12: test-generator ← NEW
**Pattern:** Sequential Workflow | **Frequency:** 30+ uses
```yaml
name: test-generator
description: Generates tests for API routes, components, and algorithms.
  Use for "test this endpoint", "add tests", "test the scoring",
  "component tests for". Produces Vitest integration + unit tests.
```
Embedded Knowledge: Vitest + Next.js setup, Supabase test client patterns, mock auth user creation, testing-library conventions, API route test patterns, edge case generation for scoring algorithms.

#### Skill 13: data-seed-builder ← NEW
**Pattern:** Domain-Specific Intelligence | **Frequency:** 5-8 uses
```yaml
name: data-seed-builder
description: Builds and validates JSON seed/catalog files (credit-cards,
  transfer-partners, airports, airlines, semi-private, expiration
  policies). Use for "build airports.json", "enrich card data", "add
  cards to catalog", "validate seed data".
```
Embedded Knowledge: JSON schema validation, data source URLs for verification, deduplication logic, IATA code validation, required fields per data type, cross-reference validation (e.g., transfer partner codes match airline codes).

### Sub-Agent Master Registry (30 total)

#### Phase 0 (Weeks 1-2) — 8 sub-agents

| # | Sub-Agent Task | Deliverable | When |
|---|---------------|-------------|------|
| 1 | Legal: Trademark search for "Wayloft" | Trademark clearance report | Week 1 |
| 2 | Legal: DOT compliance for travel metasearch | Compliance checklist | Week 1 |
| 3 | **Card art collection:** Find/create card images for all 50+ cards. Consistent sizing (340x215px). Source from issuer marketing pages. | Card art image set | Week 1 |
| 4 | **Chase 5/24 + issuer rules research:** Document every known application rule (Chase 5/24, Amex once-per-lifetime, Citi 8/48, Barclays 6/24, etc.) with edge cases and workarounds. | Issuer rules database (JSON) | Week 1 |
| 5 | **Expiration policy verification:** Verify all 25+ program expiration policies in transfer-partners.json are current as of 2026. Cross-reference with program T&Cs. | Verified expiration policies | Week 2 |
| 6 | Research: Airline award page DOM structure (United, AA, Delta) | Airline DOM blueprint | Week 2 |
| 7 | Research: Bank account page DOM structure (Chase, Amex, Citi) | Bank balance DOM blueprint | Week 2 |
| 8 | Research: Chrome Extension Manifest V3 best practices | Extension architecture guide | Week 2 |

#### Phase 1 (Weeks 3-8) — 15 sub-agents

| # | Sub-Agent Task | Deliverable | When |
|---|---------------|-------------|------|
| 9 | Data: airports.json from OpenFlights (IATA codes, lat/lng, city, country) | airports.json | Week 3 |
| 10 | Data: airlines.json (IATA code, name, logo URL, alliance, loyalty program, hubs) | airlines.json | Week 5 |
| 11 | **Retention offer aggregation:** Research common retention offers for top 20 cards. Average values, success rates, best time to call. Source: Reddit, FlyerTalk, Doctor of Credit. | retention-offers.json | Week 4 |
| 12 | **Signup bonus history:** For top 30 cards, historical signup bonus amounts over past 3 years. "60k UR is standard. All-time high was 80k." | bonus-history.json | Week 4 |
| 13 | Content: React Email templates (welcome, bonus alert, AF reminder, signup spend warning, weekly digest, re-engagement) | 6 email template files | Week 5 |
| 14 | Data: Zod validation schemas for all API endpoints | Validator files | Week 5 |
| 15 | **FTC compliance audit:** Review FTC endorsement guidelines for affiliate disclosures. Exact language, placement rules, common violations. | FTC compliance checklist | Week 7 |
| 16 | **Card affiliate CPA rates:** Research current CPA rates per card per network (CardRatings, CJ, Impact, FlexOffers). Which cards pay most? | CPA rate spreadsheet | Week 7 |
| 17 | Data: semi-private.json (JSX, Tradewind, Contour, Cape Air routes, pricing) | semi-private.json | Week 7 |
| 18 | Data: Award calendar seed (top 100 routes with typical award pricing) | calendar-seed.json | Week 7 |
| 19 | Content: 3-5 "Best cards for X" comparison article outlines | Article outlines | Week 7 |
| 20 | **Email parser template research:** Collect sample loyalty emails from 20 programs. Document HTML structure, balance location, subject line patterns. | Email parsing blueprints | Week 8 |
| 21 | **SOT state-by-state research:** CA, FL, HI, WA seller of travel requirements. Fees, forms, timelines, exemptions. | SOT compliance guide | Week 8 |
| 22 | **Landing page teardown:** Analyze 10 best SaaS landing pages in fintech/travel. Document conversion patterns, hero sections, social proof, CTAs. | Landing page playbook | Week 8 |
| 23 | Data: Popular routes seed (top 100 domestic + 50 international with avg award pricing by program) | routes-seed.json | Week 8 |

#### Phase 2 (Weeks 9-12) — 4 sub-agents

| # | Sub-Agent Task | Deliverable | When |
|---|---------------|-------------|------|
| 24 | Market: TAM analysis for award travel intelligence market | TAM report | Week 10 |
| 25 | Market: Acquirer/investor mapping for travel tech exits | Acquirer map | Week 10 |
| 26 | Market: Point.me + Seats.aero updated competitive teardown | Competitive analysis | Week 10 |
| 27 | Content: Onboarding email sequence (5-email drip) | Email sequence | Week 11 |

#### Phase 3 (Months 4-9) — 3 sub-agents

| # | Sub-Agent Task | Deliverable | When |
|---|---------------|-------------|------|
| 28 | Data: Award licensing partnership brief (Seats.aero approach strategy) | Partnership brief | Month 6 |
| 29 | **Card issuer partnership research:** Who at Chase, Amex, Capital One handles affiliate relationships? LinkedIn contacts, org structure, approach strategy for direct deals (2-3x CPA vs networks). | Partnership contact map | Month 6 |
| 30 | Data: Firefox extension porting guide (Chrome → Firefox differences) | Porting guide | Month 8 |

### How It All Works Together (Updated Example)

**Adding a new credit card to the catalog:**
1. **Card Catalog Monitor Agent** (weekly) detects Chase launched a new card
2. **data-seed-builder skill** activates to add card to credit-cards.json with proper schema
3. **seo-content-page skill** generates the card review page
4. **test-generator skill** adds tests for the new card's recommendation scoring
5. **Card Deadline Notifier Agent** automatically starts tracking deadlines for any user who adds the new card

**User adds Chase Sapphire Reserve:**
1. Frontend card picker → `/api/user/cards` POST with `{ card_slug: "chase-sapphire-reserve" }`
2. API uses credit-cards.json catalog to auto-populate all fields
3. Postgres trigger calculates signup deadline, AF date
4. **Card Deadline Notifier Agent** (daily 8am) picks up the new card in its next scan
5. At 30 days before signup spend deadline → email: "You have 30 days to spend $2,800 to earn 60,000 UR"
6. At 30 days before AF → email: "Your $550 AF posts in 30 days. Call for retention offer?"

**Solo founder leverage:** 13 skills codify every repeatable pattern. 12 agents run continuously. 30 sub-agents deliver research in parallel. Result: one person operates with the throughput of a 5-person team.

---

## Master Timeline — Week by Week (v3.0)

### Phase 0: Foundation (Weeks 1-2)

| Week  | Business                                             | Tech                                                               | Design                                       | GTM                                 | Automation                                                                                                          |
| ----- | ---------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **1** | File Corp. Bank. wayloft.com.                        | Repo. Turborepo + Next.js. Cloud accounts. CI/CD. MCP connections. | Brand identity. shadcn/ui.                   | Reddit/Twitter/FlyerTalk. Waitlist. | **4 sub-agents:** trademark, DOT, card art collection, issuer rules research.                                       |
| **2** | ToS, Privacy (Termly). Chrome Web Store dev account. | DB migrations. Auth config. Deploy skeleton.                       | Core components. Extension popup wireframes. | Community engagement.               | **Build 13 skills.** Test each. **4 sub-agents:** expiration policy verification, airline DOM, bank DOM, MV3 guide. |

### Phase 1: Core Build (Weeks 3-8)

| Week | Features | Automation |
|------|----------|------------|
| **3** | **Loop 1: Auth + Card Portfolio.** Supabase Auth, card picker UI, "My Cards" page. Duffel sandbox signup. | **1 sub-agent** (airports.json) |
| **4** | **Loop 1: Portfolio dashboard.** Lifecycle timeline, signup tracker. **Loop 2 starts: Card recommendation engine.** | **2 sub-agents** (retention-offers.json, bonus-history.json) |
| **5** | **Loop 2: Card quiz + results.** Card review pages start. **Loop 3: Bonus scrapers.** **Loop 4: Duffel integration begins.** **Loop 5: Extension foundation.** | **3 sub-agents** (airlines.json, email templates, Zod schemas) |
| **6** | **Loop 3: Bonus UI + alerts.** **Loop 4: FlightCard, results page, PriceToggle.** Loop 5: Extension enrichers. | **Transfer Bonus Monitor + Card Deadline Notifier Agents start** |
| **7** | **Loop 4: Points valuation engine + "best card to book" per flight.** Loop 5: Crowdsource pipeline. **Card review content (10-15 pages).** | **4 sub-agents** (semi-private.json, calendar seed, comparison articles, FTC compliance, CPA rates) |
| **8** | **Semi-Private Discovery.** Loop 5: Chrome Web Store publish. "Best cards for X" comparisons (3-5). | **Card Catalog Monitor + Extension Health Monitor + Competitive Intel Agents start.** **4 sub-agents** (email parser blueprints, SOT guide, landing page playbook, routes seed) |

### Phase 2: Polish & Launch (Weeks 9-12)

| Week | Features | Automation |
|------|----------|------------|
| **9** | Stripe. **Apply to CardRatings + CJ + FlexOffers.** | Build deploy-pipeline skill. |
| **10** | Billing portal, webhooks, feature gating. | **Data Quality Monitor Agent starts.** **3 sub-agents** (TAM, acquirers, competitive teardown). **Community Monitor Agent starts.** |
| **11** | Lighthouse, errors, PostHog. Soft launch (50 beta users + extension). | **1 sub-agent** (onboarding email sequence). |
| **12** | Final bugs, onboarding. **PUBLIC BETA.** | **Code Quality Agent starts.** All 12 agents running. |

### Phase 3: Growth (Months 4-9)

| Month | Features | Automation |
|-------|----------|------------|
| **4** | Email parsing (Gmail + Outlook). Extended calendar from crowdsourced data. | **SEO Agent + User Engagement Monitor Agents start.** |
| **5** | Extension v2 (more airlines). Seat maps. | **Affiliate Revenue Monitor Agent starts.** 1,000 users. First affiliate revenue. |
| **6** | Approach Seats.aero (optional). Real-time card recs. | **2 sub-agents** (partnership brief, issuer contact map). 2,000+ users. |
| **7** | Approach AwardWallet (optional). Creative routing. | 3,000+ users. |
| **8** | Price monitoring. Firefox extension. | **Price Monitor Agent starts.** **1 sub-agent** (Firefox porting guide). 5,000 users. |
| **9** | LLM Copilot. | 10,000 users. $100k ARR. |

---

## Risk Register (v3.0)

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Airline sites change DOM, breaking extension enrichers | HIGH | High (monthly) | Extension Health Monitor Agent. Automated selector testing. Fallback to generic enricher. |
| Chrome Web Store rejects extension | MEDIUM | Low-Medium | Follow MV3 best practices. Minimum permissions. Clear privacy policy. Appeal process. |
| Crowdsourced data insufficient for useful calendar | MEDIUM | Medium | Supplement with link-out to Seats.aero. Focus crowdsource on top 20 routes first. Quality > breadth. |
| Extension adoption too slow | MEDIUM | Medium | Web app works without extension. Extension is additive. Drive installs via community, content, CWS discovery. |
| Transfer bonus scraping draws C&D | MEDIUM | Low | Rate limiting. No trademark abuse. Stop if C&D received. |
| Duffel search-to-book ratio exceeded | HIGH | Medium | Aggressive Redis caching (4hr TTL). Debounced searches. Monitor weekly. |
| Affiliate network rejection | LOW | Low | Apply to 3+ networks. FlexOffers lowest barrier. Quality content before applying. |
| No Southwest in Duffel | MEDIUM | Certain | Clear UI disclosure. "Check Southwest" link. Affects all APIs. |
| Google enters award travel | LOW | Low (3-5yr) | Focus on intelligence + personalization Google won't build. |

---

## Decision Log (v3.0)

| Date | Decision | Chosen | Rationale |
|------|----------|--------|-----------|
| 2026-02-16 | Frontend framework | Next.js 15 | SSR for SEO, unified stack |
| 2026-02-16 | Background jobs | Trigger.dev | TS-native, managed, free tier |
| 2026-02-16 | Automation approach | Agents + Skills + Sub-agents | Maximize leverage |
| 2026-02-17 | Build priority | **Credit Cards → Flights → Semi-Private** | Cards are core identity + primary revenue (affiliates) |
| 2026-02-17 | Card UX | **Auto-populate from catalog** | User provides card_slug + date. Everything else auto-fills. |
| 2026-02-17 | Automation scale | **13 skills, 12 agents, 30 sub-agents** | Maximum solo founder leverage |
| 2026-02-16 | Award data strategy | **Self-reliant (extension + crowdsource)** | No single-point-of-failure dependency |
| 2026-02-16 | Balance tracking | **Manual + extension + email parsing** | No AwardWallet dependency |
| 2026-02-16 | Airline scraping | **DO NOT scrape** | Legal risk. Active litigation. |
| 2026-02-16 | Revenue model | **Affiliates primary (55-65%)** | Research proves 2-3x subscription revenue |
| 2026-02-16 | Entity type | TBD (C-Corp recommended) | Exit optionality |
| 2026-02-16 | Brand | Wayloft | Elevation, openness, modern |

---

## Success Milestones (v3.0)

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| All 13 skills built and tested | Week 2 | Not started |
| Skeleton app deployed | Week 2 | Not started |
| Card portfolio with auto-populate working | Week 4 | Not started |
| First card recommendation generated | Week 5 | Not started |
| First bonus detected | Week 6 | Not started |
| Transfer Bonus Monitor + Card Deadline Notifier live | Week 6 | Not started |
| First flight search works | Week 6 | Not started |
| Extension MVP published to CWS | Week 8 | Not started |
| 15 card review pages published | Week 8 | Not started |
| 6 agents running (Bonus, Deadline, Catalog, Extension, Intel, Quality) | Week 10 | Not started |
| Applied to CardRatings + CJ | Week 9 | Not started |
| First external user signup | Week 10 | Not started |
| 50 beta users | Week 10 | Not started |
| First paying customer | Week 12 | Not started |
| All 12 agents running | Week 12 | Not started |
| 30 sub-agents dispatched and delivered | Week 12 | Not started |
| 100 extension installs | Month 4 | Not started |
| Email parsing live | Month 4 | Not started |
| 1,000 users | Month 5 | Not started |
| First affiliate revenue | Month 5 | Not started |
| 10,000 users | Month 9 | Not started |
| $100k ARR | Month 9 | Not started |

---

## Budget (Phase 0-2, Months 1-3)

| Item | Cost | When |
|------|------|------|
| Stripe Atlas (C-Corp) | $500 | Week 1 |
| Domain (4 variants) | $60-100 | Week 1 |
| Chrome Web Store dev account | $5 | Week 2 |
| Trademark ITU filing (2 classes) | $500-1,000 | Week 2 |
| Termly (legal pages) | $10/mo | Week 2 |
| Hosting (Vercel, Supabase, Upstash) | $0 (free tiers) | Ongoing |
| Railway (scrapers) | $5/mo | Week 5+ |
| Duffel | $0 sandbox, ~$15 beta | Ongoing |
| Trademark attorney (optional) | $1,500-3,000 | Week 2-4 |
| SOT registration (4 states) | $2,000-3,000 | Weeks 9-10 |
| **Total Phase 0-2** | **$5,000-8,000** | |

Note: Seats.aero API ($200-1k/mo) and AwardWallet ($500-2k/mo) are no longer Phase 0-2 costs. They become optional Phase 3 costs if partnerships materialize.

---

## The One-Sentence Strategy

**Build the self-reliant intelligence layer — powered by a browser extension, crowdsourced data, and manual entry — that makes award travel accessible to the millions of people with credit card points, monetized primarily through affiliate revenue.**

---

*Living document. v3.1 replaces v3.0. Update after each milestone.*
