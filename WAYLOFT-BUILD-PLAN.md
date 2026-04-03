# Wayloft — Consolidated Build Plan

**Updated:** February 27, 2026
**Source:** Derived from WAYLOFT-MASTER-PLAN-V3.md (consolidated)
**Purpose:** Single source of truth for what to build next. Check boxes as you go.

---

## What's Done

Everything below is built and functional in the codebase.

### Infrastructure (Phase 0)
- [x] Turborepo monorepo, Next.js 16, Tailwind v4, shadcn/ui
- [x] Supabase (20+ tables, 7 migrations, RLS, triggers, views)
- [x] Supabase Auth (email + Google OAuth)
- [x] Vercel auto-deploy, GitHub Actions CI
- [x] Brand identity (Instrument Serif + DM Sans, navy/amber palette)
- [x] Data catalogs: credit-cards.json (52 cards), transfer-partners.json, issuer-rules.json

### Auth
- [x] Login, signup, forgot/reset password, email verification
- [x] Google OAuth with callback
- [x] Server actions, middleware, user menu

### Card Portfolio (Loop 1 — complete)
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
- ~~Payment due dates without autopay (Priority 1D)~~ ✓ shipped
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

#### ~~1D. Payment Due Date Tracker~~ — COMPLETE (Feb 24)
Built. `payment_info` added to all 54 cards in catalog. Migration 005: `user_payment_info` table + `upcoming_payments` and `cards_missing_autopay` views + RLS. PaymentTracker component on card detail (empty state form + display state with autopay badge, late fee warning, external autopay link). Server actions: `addPaymentInfo`, `updatePaymentInfo`, `deletePaymentInfo`. Dashboard integration: upcoming payments (≤14 days, no autopay) + missing autopay nudges in action items feed. Skipped `payment_history` table for MVP — payment logging can come later.

#### ~~1E. Experience Level Selector~~ — COMPLETE (Feb 24)
Built. Migration 006: `experience_level` column on profiles (`beginner`/`intermediate`/`advanced`, default `intermediate`). Onboarding step 0: "How experienced are you?" with 3 visual options. `lib/experience.ts` utilities (`getEffectiveLevel`, `isBeginnerOrBelow`, `isAdvanced`, `formatCurrencyName`). Settings dropdown to change level. Conditional rendering: beginner-friendly currency names ("Chase points" vs "UR"), portfolio value/cpp hidden for beginners. `ExperienceLevel` type in @wayloft/shared.

#### ~~1F. Education Layer~~ — COMPLETE (Feb 24)
Built. `lib/glossary.ts` with 8-term glossary (beginner + intermediate definitions). `JargonTip` component: dotted-underline tooltip for beginner/intermediate, plain text for advanced. `TooltipProvider` in app layout. Card detail: earning caps hidden for beginners, portal cpp rewritten as friendly sentence. Optimizer: ¢/$ wrapped in JargonTip, cap warnings hidden for beginners. Dashboard: "AF" → "Fee" label for beginners, cpp tooltips on points portfolio.

---

### Priority 2: Loop 2 — Card Recommendation Engine (Weeks 4-5)

**Why:** Primary monetization feature (affiliate revenue = 55-65% of revenue).

- [x] 5-step spending quiz wizard (route: `/recommend`, saves to `card_quiz_responses`)
- [x] Scoring algorithm (weighted by spend, goals, credit score, existing cards) — `lib/recommend/engine.ts`
- [x] **Bonus value personalizer** — signup bonuses valued by portfolio-aware CPP (gateway card detection) and achievability discount. Goal alignment: 3-tier (+25% strong / 0% neutral / -10% mismatch).
- [x] Results page with top 5 cards + reasoning — `components/recommend/results.tsx`, `score-card.tsx`
- [x] **Catalog data audit** — portal rates separated from direct earning on CSR/Venture X/Strata Premier, signup bonuses verified against current public offers
- [x] Card comparison view (side-by-side 2-3 cards) — inline on results page with selection checkboxes, sticky comparison bar, 5-section panel (value summary, breakdown grid with wins highlighting, context-aware category earnings, quick features, transfer partner overlap)
- [x] Card review pages (54 SSG pages at /credit-cards/[slug]) — 10-section template, filterable index, marketing header/footer, affiliate disclosure, JSON-LD, sitemap
- [x] "Best cards for X" comparison articles (9 categories: dining, travel, cash-back, no-annual-fee, hotels, groceries, gas, streaming, points-transfer) — SSG at `/credit-cards/best-for/[category]`, comparison table + ranked breakdowns + category nav pills
- [x] Affiliate link infrastructure — `AffiliateLink` component with UTM params + `trackAffiliateClick` server action → `affiliate_clicks` table, wired into card reviews, recommendations, and best-for articles
- [x] "Cards I should get next" dashboard widget
- [x] 5/24 counter widget (auto-calculated from user_cards)
- [x] Issuer rule checking in recommendations (7 rules: One Sapphire filter, Chase 5/24, Barclays 6/24, Citi 8/48, Amex lifetime, Marriott cross-issuer, C1 triple pull) + quiz 48mo field + migration 007
- [x] Credit health endpoint (/api/user/credit-health)

---

### Priority 3: Loop 3 — Transfer Bonus Tracker (Weeks 5-6)

- [x] TransferBonus + TransferBonusHistory types in @wayloft/shared
- [x] Server actions: getActiveBonuses, getActiveBonusesForUser, getBonusHistory
- [x] Seed data (10 bonuses across 5 banks) via SQL
- [x] Bonuses page (filterable by user's cards, My Bonuses / All Bonuses tabs)
- [x] BonusCard component (urgency badges, days remaining, portfolio personalization)
- [x] BonusFilters component (bank pills, partner type, sort)
- [x] Dashboard integration: ending-soon bonuses in unified action items (migration 008 view)
- [x] Scraper pipeline (Node.js + cheerio, NOT Python): 2 sources (Frequent Miler + Doctor of Credit), normalize against transfer-partners.json, validate, diff, upsert
- [x] Admin Supabase client (service role for scraper writes)
- [x] Cron API route with CRON_SECRET auth, idempotency check, expiration cleanup
- [x] Vercel Cron config (daily 6 AM ET)
- [x] Historical bonus view with pattern analysis
- [x] Scraper parser tuning against live HTML
- [ ] Diff detection → alert dispatch (email + push) — deferred to notification infra

---

### Priority 3.5: Infrastructure Hardening + Card Content (pre-flight prep)

**Why:** Database backups are the #1 vulnerability in the stack. Editorial card content is the prerequisite for affiliate network applications (primary revenue). Both unblock more value than flight search right now.

#### 3.5A. Database Backup Strategy
- [x] Automated Supabase pg_dump to Cloudflare R2 (daily via GitHub Actions)
- [x] Document restore procedure (`docs/database-backup-restore.md`)
- [x] Set up GitHub Secrets + R2 bucket (Cloudflare R2 + 5 GitHub secrets configured)
- [x] Verify backup integrity (manual run passed Mar 11)
- [ ] Test restore from backup (do once when convenient)

#### 3.5B. Card Review Editorial Content (10-15 cards)
- [x] Write editorial content (tagline, pros, cons, verdict, rating) for 15 cards
- [x] Cards completed: CSR (5/5), CSP (5/5), CFU (4/5), CFF (4/5), Amex Platinum (4/5), Amex Gold (5/5), Venture X (5/5), SavorOne (4/5), Citi Strata Premier (4/5), Citi Custom Cash (4/5), Citi Double Cash (4/5), Bilt Blue (4/5), IHG Premier (4/5), Delta Gold (3/5), Marriott Bonvoy Boundless (4/5)
- [ ] Apply to affiliate networks (CardRatings, CJ, FlexOffers) — 15 reviews now live

#### 3.5C. Additional Best-For Articles
- [x] Identify high-traffic categories beyond current 5 (dining, travel, cash-back, no-annual-fee, hotels)
- [x] Added 4 new categories: groceries, gas, streaming, points-transfer (9 total best-for articles)
- Candidates skipped (insufficient catalog depth): business (7 cards, separate audience), balance-transfer (only 2 cards), first-card (no low credit-score cards in catalog)

---

### Priority 4: Loop 4 — Flight Search via Duffel (Weeks 5-7)

**Status: MOSTLY COMPLETE (Mar 19).** Duffel sandbox integration shipped. Search, results, card recommendations, price toggle, and value comparison all working. Live access blocked on business registration (zero code changes needed — swap API key).

- [x] Duffel API integration (sandbox working, live key swap when registered)
- [x] Search form (AirportInput with autocomplete, DatePicker, passengers, cabin class)
- [x] Results page with FlightCard components (expandable details, airline/stops/duration)
- [x] "Best card to book with" per flight (portfolio-aware, ranked by effective return)
- [x] PriceToggle: Cash / Points / CPP view switching
- [x] Value comparison (side-by-side cash vs points with earn/redeem breakdown)
- [x] airports.json (100+ airports seeded)
- [ ] Redis flight cache (4hr TTL, respects 1500:1 search-to-book) — deferred to scale phase

---

### Distribution Sprint — Three-Layer Funnel (Apr 2 — in progress)

**Week 1: Worth-It Tool + Reddit Checkpoint**
- [x] Signal design system cleanup (shadows, rounded corners, purple colors — 12 files)
- [x] DESIGN.md synced with implementation (theme default, nav labels, label font)
- [x] Extract `computeValueBreakdown()` to `lib/cards/worth-it.ts` (pure function + toggle variant)
- [x] 16 unit tests for worth-it verdict logic (159 total tests passing)
- [x] Public Worth-It page at `/credit-cards/[slug]/worth-it` (SSG, no auth required)
- [x] Worth-It index page at `/credit-cards/worth-it` (lists analyzable cards)
- [x] "Analyze This Card" CTA on card review pages (cards with AF > $0)
- [x] Marketing nav restructure: left-aligned nav matching app pattern, "Worth It?" as primary nav item
- [ ] QA pass on Worth-It pages (visual, functional, responsive)
- [ ] Reddit launch: post CSR + Amex Platinum worth-it links to r/creditcards, r/churning
- [ ] **CHECKPOINT:** If <50 uses → pivot to content/SEO. If >50 → evaluate extension.

**Weeks 2-4: Decided after checkpoint**
- [ ] OG image route (`/api/og/worth-it`) for social sharing
- [ ] Chrome extension scaffold (conditional on checkpoint)
- [ ] Beehiiv newsletter integration (conditional on checkpoint)

---

### Priority 5: Loop 5 — Browser Extension (deferred to post-checkpoint)

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

### Pre-Launch Code Quality (blocking Phase 2)

- [x] ActionResult<T> schema on all server actions (bonuses.ts complete Mar 30)
- [x] Eliminate SELECT * in server actions (profile, cards, credit-health complete Mar 30)
- [x] Error-check all DB writes in onboarding.ts (Mar 30)
- [x] Vitest installed + 24 engine tests passing (Mar 30)
- [ ] **Test coverage** — 28 untested functions across cards, loyalty, onboarding, profile, recommend, bonuses, credit-health, scraper (3 tests minimum each per rules)
- [x] **Hard deletes** → soft delete: removeCard, deletePaymentInfo, removeLoyaltyBalance (migration 010, deleted_at columns on 3 tables, partial unique indexes, 6 views recreated, ~20 files updated with `.is("deleted_at", null)` filters)
- [x] **Scraper attribution** — retrieved_date + confidence on all scraped records (migration 009, confidence by parse strategy: 0.90 table → 0.50 content scan), `SELECT *` fixed in applyChanges, 143 tests passing

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

**Apr 2: Distribution sprint Week 1 built. Worth-It tool live (3 cards: CSR, Amex Platinum, Amex Gold). Marketing nav restructured. 159 tests passing. Signal design system at 9/10. Next: QA pass on worth-it pages, then Reddit launch for checkpoint. Extension decision deferred to post-checkpoint data.**

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
- **Full plan:** `WAYLOFT-MASTER-PLAN-V3.md` (consolidated — includes all v3.2 additions)

Those documents contain the complete SQL, JSON examples, and acceptance criteria for every feature above.
