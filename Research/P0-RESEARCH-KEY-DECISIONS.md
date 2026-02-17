# Miles Optimizer — Key Decisions from P0 Legal Research
**Session Date:** February 16, 2026
**Status:** Decisions made, pending attorney review

---

## Critical Strategic Decisions

### 1. DO NOT scrape airline websites for award availability
- **Why:** Active litigation (Air Canada v. Seats.aero, Southwest v. Kiwi.com permanent injunction). Breach of contract claims based on website ToS are succeeding in court even though CFAA likely doesn't apply to public data.
- **Impact:** Removed scraper track from MVP. No Python scrapers on Railway for award data at launch.

### 2. Preferred data strategy (in priority order)
1. **Seats.aero commercial API** — Email developers@seats.aero. If approved, licensed award data with zero legal risk. Cost TBD (~$200-1,000/mo estimated).
2. **"Login with Seats.aero" OAuth** — Fallback if commercial API denied. Users with existing Pro accounts ($9.99/mo) connect their own access. 1,000 requests/day per user.
3. **Link-out model** — If neither Seats.aero option works, Miles Optimizer becomes the "brain" (optimization, recommendations, alerts) and hands off search to existing tools. Still a strong product.
4. **Revisit own scraping** — Only after Air Canada v. Seats.aero resolves. If Seats.aero prevails, landscape shifts.

### 3. Use Duffel for commercial flight search/booking
- Managed Content = no IATA/ARC accreditation needed
- 0.5% content fee per booking (acceptable at our stage)
- Watch the 1500:1 search-to-book ratio limit
- Covers 5 points of sale (US, UK, Ireland, France, Australia)
- NDC exclusive pricing from 20+ airlines

### 4. AwardWallet APIs — use for portfolio tracking, NOT award search
- **Web Parsing API:** User loyalty balances, tier status, expiration dates (OAuth-based)
- **Credit Card Bonus API:** Real-time category bonus data for card recommendation engine
- **Email Parsing API:** Extract travel reservations from confirmation emails
- None of these do award availability search

### 5. Register as Seller of Travel in 4 states before enabling bookings
- California, Florida, Hawaii, Washington
- Extraterritorial — applies if you sell to residents regardless of where company is based
- Florida requires $25,000 surety bond (~$250/yr premium for good credit)
- California is most complex (trust account, TCRC membership, CST# on all advertising)
- Estimated Year 1 cost: $2-3k total
- **Timing:** Do this during Phase 2 (Weeks 9-10), before public launch
- Possible exemption if Duffel is merchant of record — needs attorney review

### 6. DOT compliance must be built into UI from Day 1
- Full fare advertising (total price including taxes)
- 24-hour hold/cancellation disclosure
- Ancillary fee transparency (bags, seats)
- Code-share disclosure
- Display neutrality (no carrier bias)
- Duffel handles backend compliance; frontend disclosures are YOUR responsibility

### 7. Transfer bonus scraping is MEDIUM risk — proceed with caution
- Banks are less litigious than airlines
- Data is publicly displayed marketing information
- Mitigations: aggressive rate limiting, no circumventing access controls, no prominent use of bank trademarks, stop if C&D received

---

## What Miles Optimizer Actually Is (Post-Research Clarity)

**Not** another award search engine competing with Seats.aero/Point.me.

**Instead:** The optimization and intelligence layer that sits on top of existing data sources:
- **Card recommendation engine** — which card for which purchase category
- **Portfolio tracker** — all points in one place with expiration alerts (via AwardWallet API)
- **Transfer bonus monitor** — real-time alerts when banks run bonus promotions
- **Optimization engine** — cents-per-point calculations, best redemption path, when to transfer
- **Award search** — via Seats.aero API/OAuth or link-out to existing tools
- **Commercial flight search & booking** — via Duffel API

This is arguably more defensible than trying to out-scrape established players.

---

## Legal Budget Required

| Item | Estimated Cost |
|------|---------------|
| Tech/travel attorney (initial engagement) | $2,000-5,000 |
| SOT registration (4 states, Year 1) | $2,000-3,000 |
| Trademark search + ITU filing | $500-3,000 |
| **Total Phase 0-1 legal budget** | **$5,000-11,000** |

---

## Key Case Law to Monitor

| Case | Status | Why It Matters |
|------|--------|---------------|
| Air Canada v. Seats.aero (D. Del.) | Active — preliminary injunction denied Mar 2024 | If Seats.aero wins, scraping landscape opens up |
| hiQ v. LinkedIn (9th Cir.) | Settled 2022 — $500k, hiQ agreed to stop | CFAA doesn't apply to public data, but contract claims can |
| Southwest v. Kiwi.com (N.D. Tex.) | Permanent injunction entered Jan 2022 | Breach of contract/ToS claims succeed even post-hiQ |
| Van Buren v. United States (SCOTUS 2021) | Decided | Narrowed CFAA — "exceeds authorized access" only applies to accessing off-limits areas |

---

## Files Produced This Session

- `/mnt/user-data/outputs/P0-LEGAL-RESEARCH-REPORT.md` — Full 17k+ word research report
- `/mnt/user-data/outputs/P0-RESEARCH-KEY-DECISIONS.md` — This file
- `/mnt/user-data/outputs/MILES-OPTIMIZER-MASTER-PLAN.md` — v2.0 master plan (from earlier in session)

---

## What's Next (for future chats)

Remaining P0 research items not yet completed:
- **Competitive teardowns:** Point.me and Seats.aero deep dives (business model, pricing, features, gaps)
- **Credit card affiliate program research:** How to monetize card recommendations (affiliate networks, compliance)
- **Design/UX research:** Competitor UI teardowns, mobile UX patterns, pain points
- **Duffel API deep dive:** Sandbox testing, pricing tiers, rate limits, NDC coverage
- **AwardWallet API evaluation:** Pricing, supported programs, integration complexity
- **Trademark search:** Run USPTO TESS for "Miles Optimizer"
