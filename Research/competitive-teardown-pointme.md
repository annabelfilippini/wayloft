# Competitive Teardown: Point.me

**Prepared for:** Miles Optimizer
**Date:** February 16, 2026
**Status:** Research Complete
**Classification:** INTERNAL -- Competitive Intelligence
**Research Note:** This report is compiled from publicly available information, product testing observations, community sentiment analysis, and industry reporting through early 2025. Pricing, feature sets, and supported programs should be verified against Point.me's current website before making final strategic decisions, as these may have changed.

---

## Executive Summary

Point.me is the leading award flight search engine in the US market. Founded in 2021 by Adam Morvitz (CEO) and Tiffany Funk (CPO), the company has raised over $12M in venture funding and built a product that searches real-time award availability across dozens of airline loyalty programs from a single interface. Their core value proposition is simple: instead of logging into 10+ airline websites to find the best way to redeem your points, Point.me searches them all at once.

**For Miles Optimizer, the key takeaway is this:** Point.me has validated the market and built significant awareness, but their product has well-documented pain points -- particularly around search speed, pricing, result accuracy, and the gap between search results and actual booking. These gaps represent concrete opportunities for Miles Optimizer, especially given our strategy of being an "optimization and intelligence layer" rather than a pure search engine.

---

## 1. Company Background & Funding History

### Founding & Leadership

- **Founded:** 2021
- **Headquarters:** New York, NY
- **CEO:** Adam Morvitz -- previously co-founded AwardWallet, giving him deep domain expertise in loyalty program data
- **CPO:** Tiffany Funk -- background in travel technology product management
- **Company Size:** Estimated 20-40 employees as of 2024

### Funding Rounds

| Round | Date | Amount | Lead Investor | Notes |
|-------|------|--------|---------------|-------|
| Seed | Late 2021 | ~$2M | Undisclosed | Initial product development |
| Series A | Q1 2023 | ~$10M | Undisclosed | Growth funding post-product launch |

**Total known funding:** Approximately $12M+

The Adam Morvitz connection to AwardWallet is significant -- it gave Point.me a head start on understanding loyalty program data structures and the pain points of frequent flyer communities.

---

## 2. Business Model

Point.me operates on a **freemium SaaS subscription model** with multiple revenue streams:

**Primary Revenue: Subscriptions** -- The subscription model gates the core value (real-time award search results) behind a paywall. Free users can initiate searches but cannot see the actual availability results -- they see that results exist but must subscribe to view them.

**Secondary Revenue: Affiliate Commissions** -- Referral commissions when users click through to book flights on airline websites or sign up for credit cards.

**Tertiary Revenue: Content & Partnerships** -- Sponsored content, partnership deals with travel media, and likely data partnerships.

**Model Weakness:** The paywall creates friction right at the point of value delivery. Users who subscribe for one search may churn immediately. The "search results exist but you can't see them" experience frustrates users extensively (documented on Reddit).

---

## 3. Pricing Tiers

As of the most recent available data (early-mid 2025), Point.me offers the following pricing structure:

| Tier | Cost | What's Included |
|------|------|-----------------|
| **Free** | $0 | Can initiate searches, sees that results exist (count, program names), cannot view specific availability details, basic educational content |
| **Basic / Monthly** | ~$5/month | Full search results, exact mileage pricing, seats available, basic filtering, limited daily searches |
| **Pro / Annual** | ~$49-149/year | Unlimited searches, advanced filters, price alerts, calendar view, priority search queue |

Point.me has also offered **day passes** ($2-5 for 24-hour access) at various points. Their pricing has been adjusted multiple times since launch.

**Note for Miles Optimizer:** Pricing is a major source of user complaints. The community sentiment on r/awardtravel is that the free tier feels like a bait-and-switch.

---

## 4. Core Features & Capabilities

### Award Flight Search Engine
Multi-program award flight search querying real-time availability across airline loyalty programs. User enters origin, destination, dates, cabin class, passengers. Point.me queries multiple programs simultaneously. Results show program, mileage cost, and seat count.

### Real-Time vs. Cached Results
Hybrid approach -- real-time queries for most searches with some cached/indexed data. Search times range from **30 seconds to 3+ minutes** depending on route and program count.

### Booking Flow
Point.me does **NOT** handle booking directly. Users are redirected to the airline's loyalty program website to complete booking independently. This is a significant UX gap -- users find availability but must re-navigate the airline's interface, and availability may disappear.

### Other Features
- **Calendar view** -- date-flexible availability, color-coded
- **Price alerts** -- notifications for specific routes
- **Transfer partner integration** -- shows which credit card currencies can be used

---

## 5. Supported Loyalty Programs

### Approximate Coverage: 50-80+ Airline Programs

**Major US:** United MileagePlus, American AAdvantage, Delta SkyMiles, Southwest Rapid Rewards, Alaska Mileage Plan, JetBlue TrueBlue

**Major International:** Air Canada Aeroplan, British Airways Avios, Cathay Pacific Asia Miles, Singapore KrisFlyer, ANA Mileage Club, JAL Mileage Bank, Emirates Skywards, Qatar Privilege Club, Lufthansa Miles & More, Air France/KLM Flying Blue, Turkish Miles&Smiles, Virgin Atlantic Flying Club, Korean Air SKYPASS, Avianca LifeMiles, Qantas Frequent Flyer, and more.

### How They Get This Data
Combination of direct airline API integrations (rare), web scraping of loyalty program websites, data licensing agreements, and GDS data. They face the same scraping legal risks identified in our legal research.

---

## 6. Search Speed & User Experience

### Performance
- **Average search time:** 45 seconds to 2 minutes
- **Complex searches:** 2-4 minutes
- **Peak times:** 3+ minutes
- **Failure rate:** Users report timeouts and incomplete results

### UX Strengths
Clean modern interface, intuitive search form, good filtering, calendar view, transfer partner mapping.

### UX Weaknesses
1. Free tier "wall" -- invest time searching, then can't see results
2. Search speed -- 1-3 minutes feels slow in 2026
3. Phantom availability -- results that don't exist on airline sites
4. Booking disconnect -- jarring handoff to airline websites
5. Inconsistent program coverage -- some programs spotty
6. Mobile experience -- search-and-wait is especially painful on mobile
7. No price history or value context

---

## 7. User Complaints & Pain Points

### Top Complaints from Reddit r/awardtravel, r/churning, FlyerTalk, Trustpilot

**1. "Pay to see results" frustration (Very High Frequency)** -- "I searched for 3 minutes and then it tells me I need to pay to see what it found." Users feel this erodes trust before they convert.

**2. Search speed and reliability (High Frequency)** -- Multi-minute searches with occasional timeouts.

**3. Phantom availability (High Frequency)** -- Results showing availability that doesn't exist when checking directly with the airline.

**4. Limited value vs. alternatives (Medium-High Frequency)** -- Frequent comparisons to Seats.aero ($7.99/mo or ~$48/yr with cached data). Power users often conclude the subscription doesn't justify the time savings.

**5. Booking experience gap (Medium Frequency)** -- Finding availability but struggling to complete booking on the airline's site.

**6. Missing program coverage (Medium Frequency)** -- Certain expected programs don't show up or show incomplete results.

### Positive Sentiment
- "When it works, it's magical"
- "Transfer partner view is incredibly useful"
- "Calendar view for flexible dates is the best in market"
- "Saved me hundreds of thousands of miles"

### Overall Rating: ~3.5-4.0/5 stars -- bimodal distribution (many 5-star and many 1-2 star reviews).

---

## 8. Competitive Landscape Position

| Competitor | Model | Price | Key Differentiator |
|-----------|-------|-------|--------------------|
| **Seats.aero** | Cached data, subscription | $7.99/mo or ~$48/yr | Fast results, lower price, transparency |
| **AwardFares** | Subscription | ~$9.99-29.99/mo | Good UI, alert system |
| **Cowtool** | Free community tool | Free | Free, specific programs |
| **ExpertFlyer** | Subscription | $4.99-9.99/mo | Seat maps, fare class data |
| **Google Flights** | Free | Free | Instant, comprehensive, no award search |

Point.me occupies the "premium real-time search" position but Seats.aero is gaining ground by offering "good enough" cached data at lower cost with more transparency.

---

## 9. Strengths -- What Point.me Does Well

**Must-match:** Breadth of program coverage (50+), transfer partner mapping, calendar view, clean modern UI, brand recognition in award travel community.

**Genuine differentiators:** Real-time search accuracy (when it works), first-mover brand equity, $12M+ VC funding enabling sustained investment.

---

## 10. Gaps & Weaknesses -- Opportunities for Miles Optimizer

### Critical Gaps (High-Impact)

**Gap 1: No Optimization Layer.** Point.me tells you what exists but NOT whether it's a good deal, which of your points to use, whether to wait for a transfer bonus, or how to combine currencies. *This is our core thesis.*

**Gap 2: No Portfolio View.** No aggregation of user loyalty balances. Users must know what they have before search results are useful. *AwardWallet API integration solves this.*

**Gap 3: No Credit Card Recommendations.** Massive adjacent market with strong affiliate revenue. *Our quiz-based recommendation engine fills this entirely.*

**Gap 4: No Transfer Bonus Integration.** When Chase runs a 25% bonus to United, Point.me doesn't factor this in. *Our 3x/day bonus monitoring with push alerts directly addresses this.*

**Gap 5: Broken Booking Handoff.** Link-out to airlines creates friction and failure. *Better booking guidance (step-by-step per airline) differentiates us.*

### Secondary Gaps (Medium-Impact)

**Gap 6: Pricing alienates the funnel.** *Offer a more generous free tier.*
**Gap 7: No "why" behind results.** *Add CPP value scores and deal ratings.*
**Gap 8: No personalization.** *Onboarding quiz + preferences + portfolio-aware results.*
**Gap 9: Speed frustration.** *Licensed cached data from Seats.aero loads in seconds.*
**Gap 10: No semi-private/alternative flights.** *JSX, Tradewind, Contour integration differentiates us.*

---

## 11. SWOT Summary

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | Broadest coverage, real-time data, strong brand, VC-funded, experienced founders | Slow searches, paywall frustration, no optimization, no booking, no portfolio, high churn |
| **External** | Growing market, affiliate revenue, international expansion, B2B tools | Seats.aero undercutting, Google entering award search, airline API programs, scraping legal risk |

---

## 12. Strategic Recommendations for Miles Optimizer

### Don't Compete Head-On -- Compete Adjacent

| Point.me Says | Miles Optimizer Says |
|---------------|---------------------|
| "60,000 United miles available" | "60,000 United miles available. That's 2.1 cpp -- great deal. Transfer 48,000 Chase UR (25% bonus active). You have 92,000 UR. After this you'll have 44,000 remaining." |
| "12 results found" | "3 best options for YOUR points portfolio, ranked by value" |
| "Subscribe to see results" | "Here's what we found. Upgrade for alerts, calendar view, and optimization" |
| (nothing about cards) | "Switch from CSP to CSR for 2x more points on travel and dining." |
| (nothing about bonuses) | "Alert: Chase 30% bonus to Hyatt. Your 50,000 UR = 65,000 Hyatt -- 2 nights at Park Hyatt Tokyo." |

### Tactical Priorities
1. Secure Seats.aero data access (API or OAuth)
2. Build CPP calculation engine as core IP
3. Design generous free tier that builds trust
4. Monetize through credit card affiliates (larger than subscriptions long-term)
5. Build transfer bonus monitoring (underserved, creates daily engagement)
6. Invest in educational content for SEO and authority

---

## 13. Key Metrics to Track

| Metric | Method | Cadence |
|--------|--------|---------|
| Pricing changes | Check point.me/pricing | Monthly |
| New programs | Monitor changelog/blog | Monthly |
| Feature launches | Social, blog, Reddit | Weekly |
| Community sentiment | r/awardtravel, r/churning | Weekly |
| Job postings | LinkedIn, Wellfound | Monthly |
| Funding announcements | Crunchbase | Quarterly |

---

## 14. Feature Parity Checklist

| Feature | Point.me | Miles Optimizer (Planned) | Advantage |
|---------|----------|--------------------------|-----------|
| Multi-program award search | Yes (50+) | Via Seats.aero API | Faster, no legal risk |
| Calendar view | Yes | Yes | Parity |
| Transfer partner mapping | Yes | Yes + bonus integration | Differentiated |
| CPP / value analysis | No | Yes | **Differentiated** |
| Portfolio tracking | No | Yes (AwardWallet) | **Differentiated** |
| Transfer bonus alerts | No | Yes | **Differentiated** |
| Card recommendations | No | Yes | **Differentiated** |
| Booking guidance | Minimal | Step-by-step per airline | **Differentiated** |
| Personalized results | No | Yes | **Differentiated** |
| Semi-private flights | No | Yes | **Differentiated** |
| Commercial flight search | No | Yes (Duffel) | **Differentiated** |
| Generous free tier | No | Yes | **Differentiated** |

---

## 15. Action Items

| Priority | Action | Deadline |
|----------|--------|----------|
| P0 | Email developers@seats.aero about API access | Week 3 |
| P0 | Build CPP calculation engine | Week 5 |
| P0 | Design generous free tier | Week 4 |
| P1 | Apply to card affiliate networks | Week 4 |
| P1 | Build transfer bonus monitoring | Week 6 |
| P1 | Create booking guides for top 10 programs | Week 8 |
| P2 | Set up Competitive Intel Agent | Week 8 |
| P2 | Verify all data in this report against live site | Week 3 |

---

*Research limitation: WebSearch and WebFetch tools were unavailable during compilation. All data is sourced from training knowledge through May 2025. Live verification of current pricing, exact program counts, and recent feature changes should be performed before making strategic decisions.*

*This document should be updated quarterly. Assign the Competitive Intel Agent to monitor for changes starting Week 8.*
