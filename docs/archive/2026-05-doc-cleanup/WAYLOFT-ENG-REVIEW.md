# Engineering Review: Wayloft Three-Layer Funnel Distribution Strategy

**Date:** 2026-04-01
**Branch:** main (MO folder: /Users/annabelfilippini/Documents/AI-OS/MO)
**Input:** Office Hours design doc + CEO Plan (Three-Layer Funnel)
**Scope:** Full architecture, code quality, test, and performance review of the planned 4-week sprint

## What's Being Reviewed

The CEO plan accepted 6 scope expansions on top of the office hours design (Three-Layer Funnel):

| # | Feature | Effort | Type |
|---|---------|--------|------|
| 0 | "Is Your Card Worth It?" tool (prerequisite) | S | New route + extraction |
| 0 | Chrome Extension scaffold (prerequisite) | M | New app |
| 0 | Beehiiv newsletter setup (prerequisite) | S | External platform |
| 1 | OG Image Generator for AF Analyzer | S | New API route |
| 2 | Extension Weekly Rewards Report | S | Extension feature |
| 4 | Reddit Launch Playbook | S | Non-engineering |
| 5 | Cards-Flights Integration in Extension | M | Extension feature |
| 6 | Newsletter Savings Counter | M | Beehiiv integration |
| 7 | Card of the Month template | S | Content ops |

4-week sprint. Week 1: worth-it tool + OG. Week 2: extension scaffold. Week 3: extension features + newsletter. Week 4: travel integration + savings counter.

---

## Step 0: Scope Challenge

### 0.1 What existing code already partially/fully solves each sub-problem?

| Sub-problem | Existing Code | Reuse Potential |
|-------------|--------------|-----------------|
| AF verdict calculation | `computeValueBreakdown()` in `components/cards/af-decision-helper.tsx:~L50-80` | HIGH — extract as pure function to lib/ |
| Retention data + downgrade options | `retention_data` + `downgrade_options` on 3 cards in `credit-cards.json` | FULL — no new data needed for MVP |
| Card catalog display | `CardReview` component (541 lines), `CardCatalogGrid` (136 lines) | MEDIUM — need public simplified version |
| "Which card to use" logic | `lib/recommend/engine.ts` (282 lines, pure function) | HIGH — extract scoring for extension |
| CPP valuations | `lib/optimizer/cpp.ts` | HIGH — needed in extension |
| Category detection | `SPENDING_CATEGORY_MAP` in engine.ts (6 categories) | MEDIUM — need domain-to-category mapping |
| Affiliate tracking | `lib/affiliate.ts` + `app/actions/affiliate.ts` + `AffiliateLink` component | FULL — already built |
| OG image generation | Nothing exists | NEW BUILD |
| Newsletter integration | Nothing exists | NEW BUILD (external: Beehiiv) |
| Extension scaffold | `apps/extension/` has only .gitkeep | NEW BUILD |

### 0.2 Minimum set of changes for stated goal?

The core goal is DISTRIBUTION — getting users into the funnel. Minimum engineering:

1. **Worth-It Tool** (Week 1): New route `/credit-cards/[slug]/worth-it`. Extract `computeValueBreakdown()` to a shared utility. Build public page with card picker + benefit toggles. No auth. ~3 files.
2. **OG Image** (Week 1): New API route using `@vercel/og` (Satori). ~1-2 files.
3. **Extension** (Weeks 2-4): Full Manifest V3 scaffold. This is genuinely new. ~15-20 files.
4. **Newsletter** (Weeks 3-4): Beehiiv is external. Engineering = signup form component + API integration. ~3-5 files.

Everything else (Reddit playbook, Card of the Month, persona design) is content/ops — no code review needed.

### 0.3 Complexity check

**Triggers: YES.** The extension alone is 15-20 new files plus a new build pipeline. Total across all features: ~25-30 new files, 1 new app (extension), 0 new backend services.

However: most of this is NET NEW code, not modifications to existing code. The existing web app changes are minimal (2-3 new routes, extract 1 function). The extension is an entirely separate build target. This is complexity from scope, not from coupling.

**Assessment:** The complexity is justified. The extension is a new product surface — it inherently requires many files. The web app changes are small and well-scoped.

### 0.4 TODOS.md check

No TODOS.md exists. Notable deferred items from CLAUDE.md:
- Priority 5: Browser Extension (now being built)
- Redis flight cache (deferred to scale)
- Card Catalog Monitor Agent (deferred)
- 28 untested functions (from build plan — may be partially addressed by 143 tests)

### 0.5 Completeness check

The plan is thorough for a 4-week sprint. Key completeness gaps:
- **Tests not in CI** — GitHub Actions only runs lint/type-check/build, NOT tests
- **No E2E tests** — 143 unit tests but zero integration/E2E
- **Extension build pipeline** — plan doesn't specify how extension gets built/published to Chrome Web Store
- **Extension testing** — no test strategy for extension code

### 0.6 Distribution check

**Critical flag:** The extension needs a build/publish pipeline. The plan mentions "Chrome Web Store dev account" but doesn't include:
- Extension build tooling (webpack/vite for bundling)
- Chrome Web Store CI/CD (automated publish on merge)
- Version management strategy
- Extension review/approval timeline (Chrome Web Store reviews can take 1-7 days)

---

## Review Sections

(Sections will be filled interactively as issues are discussed)

### Section 1: Architecture Review

**Scope decision:** Proceed as-is with full 4-week sprint. Add CI test runner, extension build pipeline, and E2E plan as requirements.

#### Issue 1: Worth-It Tool — Verdict Function Decoupling (no question needed)

The existing `computeValueBreakdown()` in `af-decision-helper.tsx` takes `UserCreditUsage[]` and `UserPerkSetup[]` (DB row types). The public tool needs raw toggle inputs (checkboxes for "I use this credit" / "I activated this perk"). 

**Fix:** Extract verdict logic to `lib/cards/worth-it.ts` as a pure function accepting `{creditToggles: Record<string, boolean>, perkToggles: Record<string, boolean>}` alongside the catalog card. Both the existing AF decision helper and the new public tool call this. Minimal diff.

**Confidence: 9/10** — verified by reading the component at `components/cards/af-decision-helper.tsx`.

#### Issue 2: OG Image Route — Server-Side Compute (RESOLVED → A)

OG route computes verdict from slug + toggled benefit IDs, not from raw query params. URL: `/api/og/worth-it?slug=csr&credits=dining,streaming&perks=lounge,tsa`. Prevents fabrication. Cacheable by URL.

**Confidence: 9/10** — verified CEO plan spec specifies query params, which is the insecure variant.

#### Issue 3: Extension Catalog — Bundle + Version Check (RESOLVED → A)

Bundle credit-cards.json in extension for speed/offline. Add lightweight `/api/catalog-version` endpoint that extension checks daily. If stale, show "update available" badge. Aligns with Annabel's data freshness priority. Adds ~15 min CC work over pure bundling.

**Confidence: 8/10** — user preference for data freshness confirmed.

#### Issue 4: Extension Build — Vite + CRXJS (RESOLVED → A)

Vite + CRXJS plugin for extension build tooling. Purpose-built for Manifest V3, reads manifest.json, auto-generates output, hot reload, integrates into Turborepo workspace. [Layer 2 — purpose-built for this exact use case.]

#### Issue 5: Newsletter Savings — Weekly Cron (RESOLVED → B)

New Vercel Cron job `/api/cron/newsletter-savings`. Same pattern as scraper: `CRON_SECRET` auth, weekly schedule (before send day), fetches Beehiiv subscribers via API, computes per-subscriber savings, writes `savings_cents` custom field back. Consistent with existing cron architecture.

#### Issue 6: Extension-App Sync — Deferred (flagged only)

The CEO plan says "Optional: connect to Wayloft account for full portfolio sync" but provides no engineering spec. This is fine for MVP — extension works standalone with chrome.storage.sync. But when this eventually ships, it needs: API auth flow (Supabase magic link or OAuth token exchange), bidirectional sync (extension cards → app, app portfolio → extension), conflict resolution (user adds card in extension but already has it in app). **Flag for future.** Not blocking.

### Section 2: Code Quality Review

#### CQ-1: DRY — Verdict logic must be shared (no question needed)

`computeValueBreakdown()` at `af-decision-helper.tsx:27-52` is a pure function with 3 inputs. The public worth-it tool needs the same thresholds ($50 keep / -$50 downgrade). Extract to `lib/cards/worth-it.ts`. Both the existing AF helper and the new public page import from there. Zero risk of threshold drift.

**Fix:** Extract `computeValueBreakdown()`, `Verdict` type, and `verdictConfig` to `lib/cards/worth-it.ts`. Import in both consumers. ~15 min CC.

#### CQ-2: DRY — Money formatting scattered (no question needed)

`(cents / 100).toFixed(0)` appears 6+ times in af-decision-helper.tsx alone, and will appear again in the worth-it page, OG image, and extension. Extract `formatCents(cents: number): string` to `lib/utils.ts` or `@wayloft/shared`.

#### CQ-3: Stale files — Delete wayloft-main/ and pnpm-lock 2.yaml (RESOLVED → A)

Delete both. `wayloft-main/` is 600MB stale duplicate. `pnpm-lock 2.yaml` is unused artifact. Add to `.gitignore` if needed to prevent reappearance.

**Action:** `rm -rf wayloft-main/ && rm "pnpm-lock 2.yaml"` (after confirming no unique content in wayloft-main/)

#### CQ-4: cards.ts is 696 lines (flagged, not actionable now)

Largest server action file. Handles card CRUD, credit tracking, perk management, payment info, lifecycle events. Cohesive (all card-related) but approaching the point where splitting by subdomain would help. Not blocking this plan since we're not modifying it. Flag for future: split into `cards-crud.ts`, `cards-credits.ts`, `cards-perks.ts`.

### Section 3: Test Review

**Framework:** Vitest 2.1.9, Node environment, path alias `@/`
**Current:** 148 test cases across 9 files (2,673 lines)
**CI gap:** Tests NOT in GitHub Actions (only lint/type-check/build)

#### Code Path Coverage — Existing Code Being Extracted/Reused

```
CODE PATH COVERAGE (existing code this plan depends on)
=========================================================

[+] components/cards/af-decision-helper.tsx
    │
    └── computeValueBreakdown()
        ├── [GAP] Happy path: credits + perks > AF → verdict "keep"
        ├── [GAP] Borderline: net value between -$50 and +$50 → "call"
        ├── [GAP] Negative: net < -$50 → "downgrade"
        ├── [GAP] Zero credits, zero perks → net = -AF → "downgrade"
        └── [GAP] Card with $0 AF → always "keep"

[+] lib/optimizer/cpp.ts
    │
    ├── getCpp()
    │   ├── [GAP] Known currency (UR) → returns valuation
    │   ├── [GAP] Cash currency → returns 1.0
    │   └── [GAP] Unknown currency → returns 1.0 fallback
    │
    ├── getCurrencyTier()
    │   └── [GAP] Transferable=0, airline/hotel=1, cash=2
    │
    └── isTransferable()
        └── [GAP] UR=true, CASH=false

[+] lib/affiliate.ts
    │
    └── buildAffiliateUrl()
        ├── [GAP] All UTM params constructed correctly
        ├── [GAP] Rank param included when provided
        └── [GAP] URL encoding of special characters

[+] app/actions/affiliate.ts
    │
    └── trackAffiliateClick()
        ├── [GAP] Logged-in user → user_id set
        ├── [GAP] Anonymous user → user_id null
        └── [GAP] DB failure → silent (fire-and-forget)

[+] lib/recommend/engine.ts
    │
    └── scoreCards()
        ├── [★★★ TESTED] Filtering (owned, business, AF, credit score) — engine.test.ts
        ├── [★★★ TESTED] Scoring (ongoing rewards, signup bonus, goal alignment)
        ├── [★★  TESTED] Issuer rules (5/24, One Sapphire)
        └── [★★  TESTED] CPP weighting (gateway detection)

[+] lib/cards/catalog.ts
    │
    ├── getAllCards()     — [GAP] Never tested (always mocked)
    ├── getCardBySlug()  — [GAP] Never tested (always mocked)
    └── searchCards()    — [GAP] Never tested

NEW CODE PATHS (planned features)
=========================================================

[+] Worth-It Tool (lib/cards/worth-it.ts + page)
    │
    ├── [PLAN] computeWorthItVerdict(card, toggles) — UNIT TEST
    ├── [PLAN] Toggle → value mapping (credit name → cents) — UNIT TEST
    ├── [PLAN] Page renders verdict correctly — UNIT TEST
    ├── [PLAN] Invalid slug → 404 — UNIT TEST
    ├── [PLAN] Card with no credits/perks data → "Insufficient data" — UNIT TEST
    └── [PLAN] [→E2E] Full flow: pick card → toggle benefits → see verdict

[+] OG Image Route (api/og/worth-it)
    │
    ├── [PLAN] Valid inputs → 200 + image — UNIT TEST
    ├── [PLAN] Invalid slug → fallback image — UNIT TEST
    └── [PLAN] Correct verdict computation from toggle params — UNIT TEST

[+] Extension: Category Detection
    │
    ├── [PLAN] Known domain → correct category — UNIT TEST
    ├── [PLAN] Unknown domain → null/generic — UNIT TEST
    └── [PLAN] Domain variants (www., m., sub.) — UNIT TEST

[+] Extension: Card Recommendation
    │
    ├── [PLAN] Best card for category from user's deck — UNIT TEST
    ├── [PLAN] User has no cards → empty state — UNIT TEST
    └── [PLAN] Tie-breaking by CPP — UNIT TEST

[+] Extension: Weekly Report
    │
    ├── [PLAN] Compute optimal usage percentage — UNIT TEST
    ├── [PLAN] Compute estimated rewards value — UNIT TEST
    └── [PLAN] Zero tracked visits → empty state — UNIT TEST

[+] Extension: Catalog Version Check
    │
    ├── [PLAN] API returns current version — UNIT TEST
    └── [PLAN] Stale version → shows update badge — UNIT TEST

[+] Newsletter Savings Cron (api/cron/newsletter-savings)
    │
    ├── [PLAN] Computes per-subscriber savings correctly — UNIT TEST
    ├── [PLAN] Subscriber with no matching banks → default estimate — UNIT TEST
    ├── [PLAN] CRON_SECRET auth check — UNIT TEST
    └── [PLAN] Beehiiv API failure → graceful error — UNIT TEST

USER FLOW COVERAGE
=========================================================

[+] "Is Your Card Worth It?" user journey
    │
    ├── [PLAN] [→E2E] Stranger lands on /credit-cards/csr → clicks "Is it worth it?" → selects benefits → sees verdict → shares
    └── [PLAN] [→E2E] Verdict page OG meta tags render correctly for social sharing

[+] Extension install → first recommendation
    │
    ├── [PLAN] [→E2E] Install → pick cards → visit amazon.com → see badge with card recommendation
    └── [PLAN] [→E2E] After 7 days → popup shows weekly report

─────────────────────────────────────────
COVERAGE (existing code this plan depends on):
  Tested:    1/6 modules (engine.ts only) — 17%
  GAPS:      5 modules with 0 test coverage
  CRITICAL:  computeValueBreakdown() — THE verdict function — untested

PLAN (new code):
  Test specs: 22 unit tests + 4 E2E tests planned
─────────────────────────────────────────
```

#### CRITICAL GAP: computeValueBreakdown() has ZERO tests

This is the function you're extracting into a public-facing, SEO-critical tool. It determines whether strangers see "KEEP" or "DOWNGRADE" for their credit card. If the thresholds are wrong or the math is off, your first impression with every new user is broken.

Tests needed (all unit, all fast):
1. Credits + perks > AF by $50+ → "keep"
2. Credits + perks within $50 of AF → "call"
3. Credits + perks < AF by $50+ → "downgrade"
4. $0 AF card → always "keep" (net is always positive)
5. No credits, no perks → net = -AF → depends on AF amount
6. Partial credit usage (some used, some not)

**File:** `tests/cards/worth-it.test.ts` (after extraction to `lib/cards/worth-it.ts`)
**Effort:** human: ~30 min / CC: ~10 min

### Section 4: Performance Review

#### PERF-1: OG Image generation cold starts on Vercel (confidence: 7/10)

Satori-based OG image routes on Vercel serverless can have 2-5 second cold starts. For SEO/social sharing, this matters: crawlers (Twitter, Facebook, Reddit) have short timeouts for fetching OG images.

**Mitigation:** Vercel Edge Runtime for the OG route (Satori works on Edge). Edge functions have ~50ms cold starts vs. 2-5s for Node serverless. Use `export const runtime = 'edge'` in the route.

**Fix:** Use `@vercel/og` (which uses Satori internally and is designed for Edge Runtime). One-line config.

#### PERF-2: Worth-it page is purely client-side computation — no perf concern

The verdict calculation is simple math on in-memory catalog data. No DB queries, no API calls. Renders instantly. Static generation via `generateStaticParams()` means the page shell is cached at the CDN. Good.

#### PERF-3: Extension popup React bundle size (confidence: 6/10, verify)

React + Tailwind popup for a Chrome extension. Full React bundle is ~40KB gzipped. For an extension popup that opens in <100ms, this might cause a visible flash. 

**Mitigation:** Consider Preact (3KB) if the popup is simple enough. But if reusing components from the web app, React is fine. Monitor popup open time after building — optimize only if >200ms.

**Decision:** Not actionable now. Flag for post-build measurement.

#### PERF-4: Catalog version check — minimize API calls

Extension checks `/api/catalog-version` daily. With 200+ extension users, that's 200 requests/day — negligible for Vercel. But the endpoint should:
- Return just a version hash (not the full catalog)
- Set `Cache-Control: public, max-age=86400` (24hr CDN cache)
- Be a static edge function for speed

**Fix:** Simple GET route returning `{ version: md5(credit-cards.json), updatedAt: "2026-04-01" }`. Edge-cached.

#### No N+1 queries — no new DB queries in this plan

The worth-it tool reads from JSON catalog (no DB). The extension is client-side. The newsletter cron does batch reads. No N+1 risk.

---

### Outside Voice Findings

An independent Claude subagent reviewed the plan cold. Key challenges:

1. **Strategic focus** — Building 4 channels in 4 weeks risks 4 half-baked surfaces. Single founder starting full-time job.
2. **Extension is hardest surface** — MV3 constraints (30s service worker timeout, review delays), domain mapping is a data problem, competitors have teams on it.
3. **Worth-it tool acquisition gap** — No plan for how strangers find it. SEO takes months. Calculators don't go viral.
4. **Newsletter has no subscriber source** — Building plumbing without supply.
5. **Missing analytics** — No event tracking plan, no conversion funnel, no success metrics.
6. **Missing legal/compliance** — Credit card tool regulatory considerations.

**Resolution:** Added explicit go/no-go checkpoint after Week 1 (worth-it tool + Reddit posts). If <50 uses, pivot to content/SEO instead of extension. Extension tension left unresolved for user to decide after checkpoint.

**Unresolved:** Whether extension is the right Week 2-4 investment vs. content/SEO. Outside voice recommends content. Review defers to post-checkpoint data.

---

## Required Outputs

### NOT in scope

| Item | Rationale |
|------|-----------|
| Flight search improvements | Duffel sandbox works. Live access blocked on business registration. Not distribution. |
| Redis flight cache | Scale-phase optimization. Zero users. |
| Plaid transaction scoring | Phase 3 feature. Requires user scale. |
| Extension airline DOM enrichment | Deferred per design doc. Legal gray area + maintenance burden. |
| Extension balance capture | Privacy-sensitive. Needs careful UX design. |
| Extension crowdsourced data | Requires user scale that doesn't exist. |
| AI chat/copilot | Deferred to Month 9 per master plan. |
| Stripe billing | Post-launch. No users to bill yet. |
| cards.ts refactoring (696 lines) | Not blocking. Split to cards-crud/credits/perks when next modified. |
| API abstraction layer | Only needed when extension syncs with web app. MVP extension is standalone. |
| Persona "Hot Take" ratings | Skipped in CEO plan. Persona design happens separately. |

### What already exists

| Existing Code | How Plan Reuses It | Rebuilds? |
|--------------|-------------------|-----------|
| `computeValueBreakdown()` (af-decision-helper.tsx:27-52) | Extract to `lib/cards/worth-it.ts`, used by both AF helper and public tool | NO — extract, don't rebuild |
| `verdictConfig` (af-decision-helper.tsx:54-73) | Extract alongside verdict function | NO |
| `RetentionGuide` + `DowngradeComparison` subcomponents | Reuse in public worth-it page (may need styling adaptation for light theme) | NO — reuse |
| `lib/recommend/engine.ts` (282 lines, pure function) | Bundle in extension for card recommendations | NO — bundle as-is |
| `lib/optimizer/cpp.ts` (48 lines) | Bundle in extension for CPP valuations | NO — bundle as-is |
| `SPENDING_CATEGORY_MAP` in engine.ts | Base for extension domain-to-category mapping | EXTEND — add domain mappings |
| `lib/affiliate.ts` + `AffiliateLink` component | Worth-it page CTA links to card review with affiliate | NO — reuse |
| `lib/cards/catalog.ts` (26 lines) | Worth-it page uses `getCardBySlug()` | NO — reuse |
| `data/credit-cards.json` (54 cards) | Bundled in extension, read by worth-it tool | NO |
| `data/transfer-partners.json` | CPP valuations for extension | NO |
| Card review pages (54 SSG pages) | Worth-it tool links from card review "Is it worth it?" CTA | NO — add CTA link |
| Cron pattern (`/api/cron/scrape-bonuses`) | Newsletter savings cron follows same architecture | EXTEND pattern |
| `vercel.json` cron config | Add newsletter-savings schedule | EXTEND |
| `.github/workflows/ci.yml` | Add `pnpm turbo test` step | EXTEND |

### Failure Modes

| Codepath | Failure Scenario | Test? | Error Handling? | User Sees? |
|----------|-----------------|-------|-----------------|------------|
| Worth-it: invalid slug | User navigates to `/credit-cards/nonexistent/worth-it` | PLANNED | Return 404 | Clear 404 page |
| Worth-it: card with no credits/perks | Card has `annual_fee_cents` but no `credits` or `perks` array | PLANNED | Show "Insufficient data" | Informative message |
| OG: Satori render failure | Font loading fails, image generation crashes | PLANNED | Fall back to default Wayloft OG | Generic brand image |
| OG: invalid toggle params | Malformed query string for credit/perk toggles | NO | Compute with empty toggles → show "no benefits selected" | Verdict with $0 value |
| Extension: chrome.storage.sync quota | User selects too many cards, exceeds 100KB sync limit | NO | NO | **SILENT FAILURE** — CRITICAL GAP |
| Extension: content script blocked by CSP | Target site blocks extension injection | NO | NO | Badge doesn't appear, no error shown |
| Newsletter cron: Beehiiv API down | API returns 5xx during savings computation | PLANNED | Log error, skip subscriber, continue | No visible failure (backend) |
| Newsletter cron: CRON_SECRET missing | Env var not set on Vercel | PLANNED | Return 401 | No visible failure (backend) |
| Catalog version: API down | Extension can't reach version endpoint | NO | Extension continues with bundled catalog | No visible failure — **GOOD** graceful degradation |

**Critical gaps:** Extension chrome.storage.sync overflow has no test AND no error handling AND would be silent. Add quota check + fallback to chrome.storage.local.

### Diagrams

```
WORTH-IT TOOL DATA FLOW
========================

  User (stranger, no auth)
    │
    ├── Lands on /credit-cards/[slug] (existing card review page)
    │   └── Clicks "Is Your Card Worth It?" CTA
    │
    └── /credit-cards/[slug]/worth-it (NEW public page)
        │
        ├── getCardBySlug(slug)  ← lib/cards/catalog.ts ← data/credit-cards.json
        │   Returns: credits[], perks[], annual_fee_cents, retention_data, downgrade_options
        │
        ├── User toggles benefit checkboxes
        │   ├── Credits: "Dining credit $10/mo" ☑ "Streaming credit $15/mo" ☐ ...
        │   └── Perks: "Lounge access ~$400/yr" ☑ "TSA PreCheck ~$100" ☐ ...
        │
        ├── computeWorthItVerdict(card, toggles)  ← lib/cards/worth-it.ts (EXTRACTED)
        │   ├── Sum toggled credits (annual value)
        │   ├── Sum toggled perks (estimated_annual_value_cents)
        │   ├── Net = total - annual_fee_cents
        │   └── Verdict: net >= $50 → KEEP | -$50 to $50 → CALL | < -$50 → DOWNGRADE
        │
        ├── Renders verdict badge + value breakdown + recommendation
        │   ├── RetentionGuide (if retention_data exists)
        │   └── DowngradeComparison (if downgrade_options exist)
        │
        ├── Share button → generates OG URL
        │   └── /api/og/worth-it?slug=csr&credits=dining,streaming&perks=lounge
        │       └── @vercel/og (Edge Runtime) → computes same verdict → renders 1200x630 PNG
        │
        └── CTA: "Track ALL your cards → Sign up free" (affiliate link)


EXTENSION DATA FLOW
========================

  chrome.storage.sync ← User's selected cards (onboarding)
    │
    ├── Content Script (injected on matching domains)
    │   ├── Match URL domain → category (domain-to-category.json)
    │   ├── Load user's cards from chrome.storage.sync
    │   ├── Score cards for category (reuse engine scoring logic)
    │   └── Inject floating badge: "Use [Card] for [X]x [category]"
    │
    ├── Background Service Worker
    │   ├── Track badge impressions: { date, site, category, card, estimatedValue }
    │   │   └── Store in chrome.storage.local (no server roundtrip)
    │   └── Daily: check /api/catalog-version → compare to bundled version
    │       └── If stale → set badge "Update available"
    │
    └── Popup UI (React + Tailwind via Vite + CRXJS)
        ├── Card onboarding picker (simplified card selector)
        ├── "This Week" tab: optimal card usage % + estimated extra rewards
        │   └── Computed from chrome.storage.local tracking data
        └── Footer: "Manage your cards on Wayloft" → web app link


NEWSLETTER SAVINGS FLOW
========================

  Vercel Cron (weekly, before send day)
    │
    └── /api/cron/newsletter-savings
        ├── Auth: CRON_SECRET
        ├── Fetch all subscribers via Beehiiv API
        │   └── Read custom fields: has_chase, has_amex, etc.
        ├── Fetch current transfer bonuses (from DB)
        ├── For each subscriber:
        │   ├── Filter bonuses by subscriber's banks
        │   ├── Estimate value: bonus% × estimated balance per bank
        │   ├── Add credit expiration value (from catalog)
        │   ├── Increment savings_cents custom field
        │   └── Update savings_last_updated
        └── Write back to Beehiiv via API
```

### Worktree Parallelization Strategy

| Step | Modules Touched | Depends On |
|------|----------------|------------|
| Worth-it extraction + tests | lib/cards/, components/cards/, tests/cards/ | — |
| OG image route | app/api/og/ | Worth-it extraction (needs verdict function) |
| CI test runner | .github/workflows/ | — |
| Extension scaffold | apps/extension/ (new) | — |
| Extension features | apps/extension/ | Extension scaffold |
| Newsletter cron | app/api/cron/, vercel.json | — |
| Catalog version API | app/api/ | — |
| Stale file cleanup | root (delete wayloft-main/, pnpm-lock 2.yaml) | — |

**Parallel lanes:**
- **Lane A:** Worth-it extraction + tests → OG image route (sequential, shared lib/cards/)
- **Lane B:** Extension scaffold → Extension features (sequential, shared apps/extension/)
- **Lane C:** CI test runner + Catalog version API + Newsletter cron + Stale cleanup (all independent)

Launch A + B + C in parallel. No merge conflicts expected — all touch different directories.

### Completion Summary

- **Step 0: Scope Challenge** — Scope accepted as-is + additive fixes (CI tests, extension build pipeline, checkpoint)
- **Architecture Review:** 6 issues found (2 resolved with decisions, 1 flagged, 3 obvious fixes)
- **Code Quality Review:** 4 issues found (2 obvious fixes, 1 resolved, 1 flagged)
- **Test Review:** Diagram produced, 17 gaps in existing code, 22 planned tests + 4 E2E for new code. CRITICAL: computeValueBreakdown() untested.
- **Performance Review:** 4 items noted (1 actionable fix — Edge Runtime for OG, rest are flags)
- **NOT in scope:** Written (11 items)
- **What already exists:** Written (14 reusable items)
- **TODOS.md updates:** Pending (items below)
- **Failure modes:** 9 scenarios mapped, 1 critical gap (chrome.storage.sync overflow)
- **Outside voice:** Ran (Claude subagent). 6 findings. 1 cross-model tension resolved (add checkpoint). 1 unresolved (extension vs content for Weeks 2-4).
- **Parallelization:** 3 lanes, all parallel, no conflicts
- **Lake Score:** 8/9 recommendations chose complete option (1 unresolved)

### Unresolved Decisions

1. **Extension vs content for Weeks 2-4** — Outside voice recommends content/SEO over extension. Review defers to post-Week-1 checkpoint data. If worth-it tool gets <50 Reddit uses, pivot to content. If >50, decide then whether extension or content is higher leverage. This decision should not be made now — it should be made with data.

### TODOS

The following items emerged during this review and should be captured:

1. **Add analytics/event tracking** — Outside voice flagged: no conversion funnel defined, no way to measure which channel works. Add PostHog or similar before shipping worth-it tool. Measures: tool loads, toggle interactions, share clicks, CTA clicks, signup conversions.

2. **Add financial disclaimer to worth-it tool** — Outside voice flagged legal/compliance. Credit card recommendation tools need "not financial advice" disclaimer. FTC disclosure for affiliate links already exists. Add general disclaimer to worth-it page.

3. **Extension chrome.storage.sync quota handling** — Critical gap from failure modes. Add quota check before writing to sync storage. Fallback to chrome.storage.local if quota exceeded.

4. **Split cards.ts (696 lines)** — Flagged during code quality. Not blocking this sprint. Split when next modifying card actions.

5. **Extension-app portfolio sync spec** — Flagged during architecture. When extension eventually connects to web app account, needs: API auth flow, bidirectional sync, conflict resolution. Spec before building.

6. **Data freshness for public worth-it tool** — Outside voice flagged: if catalog data is stale (wrong AF, wrong signup bonus), first impression is broken. Ensure credit-cards.json is verified before worth-it tool launch. Add `last_verified` field to catalog entries.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 7 proposals, 6 accepted, 0 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | ISSUES_FOUND | Strategic focus, extension risk, acquisition gap |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_OPEN (PLAN) | 15 issues, 1 critical gap |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |

- **UNRESOLVED:** 1 decision (extension vs content for Weeks 2-4)
- **VERDICT:** ENG REVIEW completed with 1 unresolved decision + 1 critical test gap (computeValueBreakdown). Fix test gap before building. Unresolved decision deferred to post-Week-1 checkpoint.
