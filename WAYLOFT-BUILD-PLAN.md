# Wayloft — Consolidated Build Plan

**Updated:** February 24, 2026
**Source:** Merged from WAYLOFT-MASTER-PLAN-V3.md + wayloft-master-plan-additions-v3.2.md
**Purpose:** Single source of truth for what to build next. Check boxes as you go.

---

## What's Done

Everything below is built and functional in the codebase.

### Infrastructure (Phase 0)
- [x] Turborepo monorepo, Next.js 16, Tailwind v4, shadcn/ui
- [x] Supabase (16+ tables, 4 migrations, RLS, triggers, views)
- [x] Supabase Auth (email + Google OAuth)
- [x] Vercel auto-deploy, GitHub Actions CI
- [x] Brand identity (Instrument Serif + DM Sans, navy/amber palette)
- [x] Data catalogs: credit-cards.json (52 cards), transfer-partners.json, issuer-rules.json

### Auth
- [x] Login, signup, forgot/reset password, email verification
- [x] Google OAuth with callback
- [x] Server actions, middleware, user menu

### Card Portfolio (Loop 1 — partial)
- [x] Card picker search with fuzzy matching
- [x] Add card dialog (2-field UX: slug + date)
- [x] Card grid with issuer-colored art placeholders
- [x] Card detail page (5 tabs: Earning, Perks, Credits, Transfer Partners, History)
- [x] Signup bonus tracker (progress bar, spend update form)
- [x] Annual fee section with retention offer logging + offset calculator
- [x] Card lifecycle timeline (History tab, log event form, auto-log on create)
- [x] Points expiration alerts (dashboard widget)
- [x] Action items widget (unified deadlines: signup spend + AF + expiring points + expiring credits)
- [x] Points portfolio dashboard (balance list, CPP valuations, estimated value)
- [x] CPP valuation utility (from transfer-partners.json)
- [x] Add balance dialog (24 programs)

### Statement Credit Tracker (Priority 1A — complete)
- [x] `credits` array in credit-cards.json (Amex Platinum 7, CSR 4, Amex Gold 4)
- [x] `CatalogCredit` + `UserCreditUsage` types in @wayloft/shared
- [x] Migration 003: `user_credit_usage` table + `expiring_credits` view + RLS
- [x] Auto-generate credit rows on card add (`calculatePeriodDates` helper)
- [x] Credits tab on card detail (grouped by period, progress bars, status badges)
- [x] Mark-as-used (full/partial) + enrollment actions
- [x] Annual fee offset calculator (effective cost = AF - credits used)
- [x] Expiring credits in dashboard action items (≤30 days)

### Perks & Benefits Reference (Priority 1B — complete)
- [x] `perks` array in credit-cards.json (CSR 8, Amex Platinum 11, Amex Gold 5) — non-monetary benefits only
- [x] `CatalogPerk`, `UserPerkSetup`, `PerkCategory`, `PerkType`, `PerkSetupStatus` types in @wayloft/shared
- [x] Migration 004: `user_perk_setup` table + `unused_perks` view + RLS
- [x] Auto-generate perk rows on card add (`always_on` → auto-completed, others → `not_started`)
- [x] Lazy backfill for cards added before 1B (inserts perk rows on card detail page load)
- [x] Interactive PerkChecklist component (grouped by category, value summary + progress bar)
- [x] Status toggle (not_started → in_progress → completed), dismiss as not_applicable
- [x] Perk status badges (Active / In progress / Setup needed)
- [x] Server actions: `markPerkSetup`, `dismissPerk`
- [x] Dashboard: top 3 unused perks by estimated value in action items feed
- [x] Fallback: cards without structured perks render original key_perks string list
- [x] Updated `CardAction.type` union to include `perk_setup`

### Annual Fee Decision Helper (Priority 1C — complete)
- [x] `DowngradeOption`, `RetentionOffer`, `RetentionData` types in @wayloft/shared
- [x] `downgrade_options` + `retention_data` optional fields on `CatalogCard`
- [x] Catalog data for CSR (3 downgrade paths), Amex Platinum (2), Amex Gold (1)
- [x] Retention data with phone numbers, success rates, common offers for all 3 premium cards
- [x] `AFDecisionHelper` component: value breakdown (credits + perks vs AF), verdict badge (KEEP/CALL/DOWNGRADE), retention guide, downgrade comparison with lose/keep lists
- [x] Verdict logic: net value ≥ +$50 → KEEP, -$50 to +$50 → CALL, < -$50 → DOWNGRADE
- [x] Wired into AnnualFeeSection with expand/collapse CTA (shows when AF ≤ 60 days away)
- [x] Dashboard AF action items show enhanced subtitle for cards with decision data
- [x] No new DB migration — all computed client-side from existing tables + catalog JSON

### Spending Optimizer (Loop 1.5)
- [x] Wallet guide page with category grid
- [x] Quick reference card
- [x] Category row components
- [x] Optimizer engine (pure function: cards + catalog → ranked card/category)

### Other
- [x] Onboarding wizard (2-step: pick cards → goals/airport)
- [x] Settings page (profile, notifications, subscription stub, data/privacy)
- [x] App sidebar navigation
- [x] Route stubs: bonuses, search, calendar, portfolio

---

## UX Issues to Fix (from Feb 23 review)

These are real usability problems spotted during a hands-on walkthrough. They should be addressed alongside or before new feature work — shipping broken UX on top of broken UX just compounds the problem.

### Card Grid / My Cards Page
- **Too much visual noise.** Everything is the same font weight and size, nothing stands out. Need visual hierarchy — make card name and key stats (AF, currency) prominent, push secondary info down.
- **Simplify the card tile.** Show the 2-3 most important things per card (name, AF, bonus status). Let users click into the card for detail. Don't try to show everything on the grid.
- **Tags ("premium travel", etc.) need contrast.** Currently blend in — make them visually distinct badges that pop.

### Card Detail Page
- **Signup bonus tracker is impractical.** Users won't manually input every purchase. Explore alternatives: Plaid auto-sync (Phase 3), monthly bulk update prompt ("roughly how much did you spend this month?"), or a simple slider/quick-entry instead of exact dollar amounts.
- **Annual fee section is overbuilt.** Simplify to: "Annual fee: $550. Due: March 15, 2027." Add a reminder toggle and a link to the AF Decision Helper (when built). Don't show the full retention form by default.
- **"Portal redemption value" is jargon.** Clarify: "If you book travel through Chase's travel portal, each point is worth X¢." Tie to education layer tooltips.
- **Perks tab needs booking context.** Some perks require booking through the issuer's portal to activate (e.g., Amex hotel credit = amextravel.com only). Make this obvious with a callout per perk.
- **Transfer Partners tab needs alliance explanation.** Users don't understand that transferring to United also covers Star Alliance partners. Add a one-liner: "United is in Star Alliance — your miles work on 25+ partner airlines."
- **Transfer Partners tab is reference-only, not actionable.** Three tiers planned:
  - **Tier 1 (current):** Reference list on card detail. Keep it, but add alliance context.
  - **Tier 2 (Loop 4):** Flight search shows "pay with points" breakdown. PriceToggle + "best card to book with" — already in the Loop 4 spec.
  - **Tier 3 (future):** "Plan a Trip" — user inputs destination, Wayloft does full analysis: which points, which partner, how many points, step-by-step booking guide. The killer feature nobody does well.
  - If the best option is a partner the user doesn't have an account with (e.g., Virgin Atlantic), Wayloft should advise them to create one.

### Points Portfolio (Dashboard)
- **Not immediately clear what it is.** Add a subtitle or one-line explainer: "Your points across all programs and what they're worth."
- **Consider renaming** to something more intuitive — "My Points" or "Points & Miles" instead of "Points Portfolio."

### Spending Optimizer
- **Gap detection is missing.** When no card earns a bonus in a category (e.g., Gas showing 1x), the optimizer should say: "No gas bonus card in your wallet. Consider: Citi Custom Cash (5x)." This bridges to Loop 2 recommendations.

### Action Items Widget — Needs to Aggregate Everything
The Action Items widget currently pulls from signup spend deadlines, AF dates, and expiring points. It needs to become the single unified feed across ALL systems:

**Sources (add as each feature ships):**
- Signup spend deadlines (existing)
- Annual fee dates (existing)
- Expiring points (existing)
- ~~Statement credits expiring (Priority 1A)~~ ✓ shipped
- Credits needing enrollment (Priority 1A — enrollment tracked, dashboard nudge TBD)
- Quarterly category activations (spending optimizer)
- ~~Perks not yet set up (Priority 1B)~~ ✓ shipped
- Transfer bonuses ending soon (Priority 3)
- 5/24 approaching (Priority 2)
- Payment due dates without autopay (Priority 1D)
- ~~Retention call windows (Priority 1C)~~ ✓ shipped

**Tag types:** Bonus, Credit, AF, Activate, Expiring, Setup, Transfer, Call, Payment, Alert

**Priority ranking:** Critical (red) → Warning (yellow) → Info (blue). Sort by urgency then days remaining — same pattern as current widget, just more sources.

### Bonuses Page (when built)
- Make expiration prominent. If a transfer bonus is ending soon, surface urgency: "25% bonus to Hyatt ends in 48 hours — transfer now or lose it."

---

## What's Next — Build Order

### Priority 0: UX Polish Pass — COMPLETE (Feb 23)

- [x] **Card grid visual hierarchy** — card name bumped to `text-base font-semibold`, clear hierarchy
- [x] **Card tile simplification** — removed SpendUpdateForm from grid tiles (detail page only), kept BonusProgress bar
- [x] **Tag styling** — `best_for` badges now amber (`bg-amber-100 text-amber-800`) for contrast
- [x] **Simplify signup spend tracker** — added quick-increment buttons (+$500/+$1k/+$2k) with server-side increment support, kept manual input as fallback
- [x] **Simplify annual fee section** — removed "Your options" block, retention CTA downgraded to subtle text link
- [x] **Clarify "portal redemption value"** — now "Travel portal value" with issuer-specific sublabel
- [x] **Transfer partners: add alliance explainer** — Star Alliance/oneworld/SkyTeam descriptions, only shows alliances present in card's partners
- [x] **Points portfolio clarity** — renamed to "My Points & Miles" with subtitle
- [x] **Dashboard headers** — all section headers bumped to `text-lg font-bold`
- [x] **Optimizer gap detection** — amber suggestions with lightbulb icon for uncovered categories (dining, gas, groceries, streaming, transit)
- [x] **Optimizer quick reference removed** — redundant with category rows

---

### Priority 1: Finish Loop 1 (Card Portfolio Completion)

These are the remaining Loop 1 features from the plan. They deepen the card portfolio from "tracking" to "intelligence" — and they're what make users come back.

#### ~~1A. Statement Credit Tracker~~ — COMPLETE (Feb 23)
Built. See "What's Done" section above for full checklist.

#### ~~1B. Perks & Benefits Reference~~ — COMPLETE (Feb 24)
Built. See "What's Done" section above for full checklist.

#### ~~1C. Annual Fee Decision Helper~~ — COMPLETE (Feb 24)
Built. See "What's Done" section above for full checklist.

#### 1D. Payment Due Date Tracker
**Why:** #1 fear for new cardholders. Late payments = fees + credit score damage.
**What to build:**
- Expand `credit-cards.json` with `payment_info` per card (grace period, autopay URL, late fee)
- New DB table: `user_payment_info` (due day, autopay status, minimum payment)
- New DB table: `payment_history` (payment log)
- Payment due date UI on card detail
- "Upcoming Payments" dashboard widget
- Autopay setup checklist for new cards

#### 1E. Experience Level Selector
**Why:** Makes Wayloft work for first-time cardholder to 15-card optimizer.
**What to build:**
- Add `experience_level` column to profiles (`beginner`/`intermediate`/`advanced`)
- Onboarding screen 0: "How experienced are you?"
- `lib/experience.ts` utility for conditional formatting
- Conditional rendering across wallet guide, points display, card detail

#### 1F. Education Layer
**Why:** Teach at the moment of relevance, not in a separate "learn" section.
**What to build:**
- `data/glossary.json` (10+ terms with short/full/example/show_for_levels)
- `<Tooltip>`, `<ExplainerCard>`, `<FirstTimeHint>`, `<GlossaryModal>` components
- Wire tooltips into existing jargon across the app
- Glossary accessible from settings/help

---

### Priority 2: Loop 2 — Card Recommendation Engine (Weeks 4-5)

**Why:** Primary monetization feature (affiliate revenue = 55-65% of revenue).

- [ ] 5-step spending quiz wizard
- [ ] Scoring algorithm (weighted by spend, goals, credit score, existing cards)
- [ ] **Bonus value personalizer** — rank signup bonuses by how valuable they are *for this user* based on their spending patterns and travel goals, not just raw point count. "80K UR is worth more to you than 100K Hilton because you fly 6x/year and rarely stay at Hiltons."
- [ ] Results page with top 5 cards + reasoning
- [ ] Card comparison view (side-by-side 2-3 cards)
- [ ] Card review pages (10-15, SEO-optimized) — prerequisite for affiliate applications
- [ ] "Best cards for X" comparison articles (3-5)
- [ ] Affiliate link infrastructure (FTC disclosure, click tracking, UTM params)
- [ ] "Cards I should get next" dashboard widget
- [ ] 5/24 counter widget (auto-calculated from user_cards)
- [ ] Issuer rule checking in recommendations (5/24, Amex lifetime, Citi 8/48)
- [ ] Credit health endpoint (/api/user/credit-health)

**Data needed:**
- Expand `credit-cards.json` to v3.2 schema (pros, cons, ideal_user, best_for expanded)
- `issuer-rules.json` already exists

---

### Priority 3: Loop 3 — Transfer Bonus Tracker (Weeks 5-6)

- [ ] Python base scraper class (fetch, parse, store, diff detection)
- [ ] Chase, Amex, Citi, Capital One, Bilt scrapers
- [ ] Scheduling (Trigger.dev, 3x daily)
- [ ] Bonuses page (filterable by user's cards)
- [ ] BonusCard component
- [ ] Historical bonus view
- [ ] Diff detection → alert dispatch (email + push)
- [ ] "What this means for your portfolio" personalization

---

### Priority 4: Loop 4 — Flight Search via Duffel (Weeks 5-7)

- [ ] Duffel API integration (sandbox → live)
- [ ] Search form (AirportInput, DatePicker, passengers, cabin)
- [ ] Results page with FlightCard components
- [ ] Redis flight cache (4hr TTL, respects 1500:1 search-to-book)
- [ ] PriceToggle: Cash / Points / CPP
- [ ] "Best card to book with" per flight
- [ ] Value comparison ("Pay $450 cash or 30K UR at 1.5cpp")
- [ ] airports.json from OpenFlights

---

### Priority 5: Loop 5 — Browser Extension (Weeks 5-7, parallel)

- [ ] Manifest V3 foundation
- [ ] Content scripts for airline sites (United, AA, Delta)
- [ ] Balance capture scripts (Chase, Amex, Citi)
- [ ] CppBadge, TransferPath, BonusAlert overlay components
- [ ] Popup UI (portfolio summary)
- [ ] Crowdsource data pipeline (opt-in)
- [ ] Chrome Web Store listing

---

### Priority 6: Semi-Private Discovery (Week 8)

- [ ] semi-private.json seed data
- [ ] SemiPrivateBadge component
- [ ] Integrate into search results
- [ ] Time savings calculator

---

### Phase 2: Polish & Launch (Weeks 9-12)

- [ ] Stripe billing (Free / $9.99 Pro)
- [ ] Apply to CardRatings + CJ + FlexOffers
- [ ] Feature gating by tier
- [ ] Lighthouse, Sentry, PostHog
- [ ] Soft launch (50 beta users)
- [ ] PUBLIC BETA (Week 12)

---

### Phase 3: Growth (Months 4-9)

- [ ] Email parsing (Gmail/Outlook) for balance auto-update
- [ ] Extension v2 (more airlines)
- [ ] Approach Seats.aero from strength (Month 6)
- [ ] Approach AwardWallet from strength (Month 7)
- [ ] Household card management (Month 6-7, Pro)
- [ ] Plaid transaction scoring (Month 7-8, Pro)
- [ ] Price monitoring + watchlists (Month 8)
- [ ] LLM Copilot (Month 9)
- [ ] Firefox extension (Month 8)

**Targets:** 1K users (Month 5) → 10K users (Month 9) → $100K ARR (Month 9)

---

## Immediate Next Action

**Priority 1A, 1B, and 1C are done. Next up: Priority 1D (Payment Due Date Tracker).**

1. Expand `credit-cards.json` with `payment_info` per card (grace period, autopay URL, late fee)
2. New DB table: `user_payment_info` (due day, autopay status, minimum payment)
3. New DB table: `payment_history` (payment log)
4. Payment due date UI on card detail
5. "Upcoming Payments" dashboard widget
6. Autopay setup checklist for new cards

---

## Key Architecture Decisions (locked in)

| Decision | Choice | Why |
|----------|--------|-----|
| Data strategy | Self-reliant (extension + crowdsource + manual) | No single-point-of-failure dependency |
| Revenue | Affiliates primary (55-65%), subscriptions secondary | Research-backed |
| Card data | credit-cards.json is single source of truth | Auto-populate everything from catalog |
| User input | card_slug + card_since, everything else auto-fills | Minimal friction |
| Scraping | DO NOT scrape airline sites | Active litigation risk |
| Flight data | Duffel API (the one worthy external dependency) | Well-funded, startup-friendly |

---

## Reference

For detailed specs (DB schemas, JSON formats, algorithm details, notification catalog, agent registry):
- **Full plan:** `WAYLOFT-MASTER-PLAN-V3.md`
- **v3.2 additions:** `wayloft-master-plan-additions-v3.2.md`

Those documents contain the complete SQL, JSON examples, and acceptance criteria for every feature above.
