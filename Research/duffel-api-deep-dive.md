# Duffel API Deep Dive -- Technical Research Report

**Prepared for:** Miles Optimizer
**Date:** February 16, 2026
**Status:** Research Complete
**Classification:** Internal -- Technical Evaluation
**Research Note:** This report is compiled from Duffel's public documentation, developer forums, API changelog, pricing pages, SDK repositories, third-party reviews, and industry analysis through early 2025. Pricing and coverage should be verified against Duffel's current website before finalizing integration decisions, as these may have evolved.

---

## Executive Summary

Duffel is a modern flight booking API founded in 2017 (London, UK) that provides a single, clean REST API for searching, booking, and managing flights across 300+ airlines. Unlike legacy GDS systems (Amadeus, Sabre, Travelport) that require IATA accreditation, complex EDIFACT message formats, and enterprise sales cycles, Duffel abstracts all of this behind a developer-friendly JSON API with pay-as-you-go pricing and no accreditation requirements.

**For Miles Optimizer, Duffel is the right choice for commercial flight search and booking in the MVP.** The "Managed Content" model means no IATA/ARC accreditation is needed, the sandbox is free and functional, and the $0 upfront cost makes it startup-friendly. However, there are important limitations -- particularly the 1500:1 search-to-book ratio, US domestic coverage gaps (no Southwest), and the fact that Duffel handles cash bookings only, not award redemptions.

---

## 1. Pricing Tiers and Cost Structure

### How Duffel Pricing Works

Duffel operates on a **pay-per-booking** model with no upfront fees, no monthly minimums, and no charge for searches. This is unusually startup-friendly compared to legacy GDS providers.

#### Pricing Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| **Sandbox (test mode)** | Free | Unlimited searches and test bookings |
| **Live searches** | Free | No per-search charge |
| **Live bookings** | Markup-based | Duffel takes a content fee per booking |
| **Content fee (Managed)** | ~0.5% of ticket value | Duffel is merchant of record |
| **Content fee (Self-Connect)** | Higher % | For self-assembled itineraries |
| **Monthly minimum** | None | True pay-as-you-go |
| **Setup fee** | $0 | Self-service signup |

#### Content Models

Duffel offers two content access models:

1. **Managed Content** (recommended for Miles Optimizer):
   - Duffel acts as the merchant of record (MoR)
   - Duffel handles payment collection, refunds, and airline settlement
   - You do NOT need IATA/ARC accreditation
   - Duffel charges approximately 0.5% of the ticket value as a content fee
   - This is deducted from the fare; you can add your own markup on top
   - Available for 5 points of sale: US, UK, Ireland, France, Australia

2. **Self-Managed Content**:
   - You are the merchant of record
   - Requires your own IATA accreditation
   - Lower content fees but much higher operational complexity
   - Only relevant for established travel agencies

#### What "$3/booking" Means

The master plan lists "$3/booking" -- this is an approximation. Duffel's actual model is percentage-based. On a $600 domestic round-trip, 0.5% = $3. On a $2,000 international business class ticket, 0.5% = $10. The percentage is more accurate than a flat fee.

#### Enterprise Pricing

For high-volume customers (typically 1,000+ bookings/month), Duffel offers negotiated enterprise pricing with:
- Lower content fee percentages
- Dedicated account management
- Custom SLAs
- Higher rate limits
- Priority support

### Cost Projection for Miles Optimizer

| Phase | Monthly Searches | Monthly Bookings | Est. Monthly Cost |
|-------|-----------------|------------------|-------------------|
| Sandbox/MVP build | Unlimited | 0 (test) | $0 |
| Beta (50 users) | ~5,000 | ~5-10 | $15-50 |
| Early growth (1k users) | ~50,000 | ~50-100 | $150-500 |
| Scale (10k users) | ~500,000 | ~500-1,000 | $1,500-5,000 |

These estimates assume average booking value of $500-600 and a realistic conversion rate of ~1% of searches leading to bookings.

---

## 2. Rate Limits and Throttling

### Published Rate Limits

Duffel applies rate limiting on a per-access-token basis:

| Tier | Rate Limit | Notes |
|------|-----------|-------|
| **Sandbox** | ~100 requests/minute | Sufficient for development and testing |
| **Live (standard)** | ~200 requests/minute | Per access token |
| **Live (enterprise)** | Negotiable | Can be increased with enterprise agreement |

### Offer Request (Search) Specific Limits

Flight searches ("offer requests") are the most resource-intensive endpoint:

- **Offer Request creation**: This is the search endpoint. Each search fans out to multiple airline sources, so Duffel limits concurrency.
- **Typical observed limit**: ~10-20 concurrent offer requests at a time.
- **Search-to-book ratio**: **1500:1 maximum.** This is critical. For every booking you make, you are allowed up to 1,500 searches. If you exceed this ratio consistently, Duffel may throttle or suspend your account.

### Rate Limit Headers

Duffel returns standard rate limit headers:
- `RateLimit-Limit`: Maximum requests in the window
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: When the window resets

### Throttling Behavior

When rate limited, Duffel returns HTTP `429 Too Many Requests` with a `Retry-After` header. The API is well-behaved -- it does not hard-block; it asks you to wait and retry.

### Implications for Miles Optimizer

The **1500:1 search-to-book ratio is the most important constraint.** Miles Optimizer is fundamentally a search-heavy product where many users will search but few will book through the platform (especially initially, when users may search on Miles Optimizer but book directly with airlines). Mitigation strategies:

1. **Aggressive caching**: Cache search results in Upstash Redis with 4-hour TTL (already in the master plan). Serve cached results for identical or similar queries.
2. **Debounce searches**: Don't fire API calls on every keystroke. Wait for user to finalize search parameters.
3. **Lazy loading**: Only fetch detailed offers when user clicks "View Details."
4. **Drive bookings**: The ratio is only a problem if people search but don't book through you. Build the booking flow to be frictionless.

---

## 3. NDC Airline Coverage

### What is NDC?

New Distribution Capability (NDC) is an IATA standard that allows airlines to distribute rich content (branded fares, ancillaries, dynamic pricing) directly to travel sellers without going through legacy GDS intermediaries. Duffel was built as an NDC-first platform.

### Duffel's Content Sources

Duffel aggregates content from three source types:

1. **Direct NDC connections**: Real-time API connections to airlines' own NDC-enabled systems. This provides the richest content (branded fares, ancillary offers, exclusive pricing).
2. **GDS content**: Duffel also connects through Travelport (one of the three major GDS systems) for airlines that are not yet NDC-enabled or where NDC content is limited.
3. **Low-cost carrier (LCC) direct connections**: Some LCCs have proprietary APIs that Duffel connects to directly.

### Airlines with NDC Connections Through Duffel

As of early 2025, Duffel has direct NDC integrations with approximately 20-30 airlines, including:

| Airline | IATA Code | NDC Status | Notes |
|---------|-----------|------------|-------|
| American Airlines | AA | NDC direct | Major US carrier, rich content |
| United Airlines | UA | NDC direct | Major US carrier |
| British Airways | BA | NDC direct | Oneworld hub |
| Lufthansa Group | LH/LX/OS/SN | NDC direct | Includes Swiss, Austrian, Brussels |
| Air France-KLM | AF/KL | NDC direct | SkyTeam |
| Emirates | EK | NDC direct | Premium carrier |
| Qatar Airways | QR | NDC direct | Premium carrier |
| Singapore Airlines | SQ | NDC direct | Premium carrier |
| Cathay Pacific | CX | NDC direct | Asia hub |
| Qantas | QF | NDC direct | Australia |
| Finnair | AY | NDC direct | Oneworld |
| Turkish Airlines | TK | NDC direct | Star Alliance hub |
| Vueling | VY | NDC direct | European LCC |
| Iberia | IB | NDC direct | Oneworld |
| Air Canada | AC | NDC direct | Star Alliance |

### Total Airline Count

Duffel claims access to **300+ airlines** when combining NDC direct connections and GDS (Travelport) content. The GDS fills in the long tail of carriers that don't yet support NDC.

### NDC vs GDS Content Differences

| Feature | NDC Content | GDS Content |
|---------|-------------|-------------|
| Branded fares | Yes - full fare families | Basic fare classes only |
| Ancillary pricing | Real-time bags, seats, meals | Limited or unavailable |
| Dynamic pricing | Yes - airline-direct pricing | Published fares only |
| Exclusive fares | Sometimes NDC-only fares | Standard published fares |
| Rich media | Cabin images, amenity details | Minimal |
| Booking modifications | More flexible via NDC | Standard GDS change rules |

---

## 4. US Domestic Coverage

This is a critical section for Miles Optimizer given the US-focused user base.

### US Airlines Available Through Duffel

| Airline | Available | Connection Type | Notes |
|---------|-----------|----------------|-------|
| **American Airlines** | Yes | NDC direct | Full NDC content, branded fares, ancillaries |
| **United Airlines** | Yes | NDC direct | Full NDC content |
| **Delta Air Lines** | Yes | GDS (Travelport) | No NDC direct as of early 2025; Delta has been slow to adopt NDC |
| **Alaska Airlines** | Yes | GDS | Available through Travelport |
| **JetBlue** | Yes | GDS / Direct | Available; ancillary content may be limited |
| **Spirit Airlines** | Partial | GDS | Limited content; Spirit's ULCC model means most revenue is ancillary, which GDS handles poorly |
| **Frontier Airlines** | Partial | GDS | Similar to Spirit -- base fares available but ancillary bundles may not be |
| **Southwest Airlines** | **NO** | Not available | Southwest does not distribute through any GDS or NDC channel. They are exclusively direct-to-consumer. This is a **permanent gap** in any third-party API. |
| **Hawaiian Airlines** | Yes | GDS | Now merged with Alaska Airlines |
| **Sun Country** | Partial | GDS | Limited |
| **Allegiant Air** | **NO** | Not available | Direct-only distribution, similar to Southwest |
| **Breeze Airways** | **NO** | Not available | Too new, direct-only |

### Coverage Gap Analysis

The **Southwest gap is the single biggest limitation** for a US domestic flight tool. Southwest carries approximately 15-17% of US domestic passengers. No third-party API (Duffel, Amadeus, Sabre, or any other) can access Southwest inventory -- this is a deliberate business decision by Southwest.

**Allegiant and Breeze** are smaller gaps but meaningful for budget-conscious travelers (exactly the audience Miles Optimizer targets).

**Delta via GDS only** means Delta content through Duffel will have less rich data than American or United (no branded fare families, limited ancillary pricing). This may improve as Delta progresses its NDC rollout.

### Mitigation for Miles Optimizer

- Display a clear notice: "Southwest, Allegiant, and Breeze flights are not available through our search. Check their websites directly."
- Consider a "Check Southwest too" link-out feature in search results.
- For Delta, note that fare details may be less comprehensive than AA/UA.

---

## 5. Sandbox and Testing Environment

### Sandbox Overview

Duffel provides a fully functional sandbox environment that mirrors the live API.

| Feature | Sandbox Details |
|---------|----------------|
| **Access** | Free, instant signup at duffel.com |
| **API key** | Separate test token (prefix `duffel_test_`) |
| **Rate limits** | ~100 requests/minute |
| **Data** | Simulated -- uses "Duffel Airways" as a test airline |
| **Booking flow** | Full flow works: search -> offer -> order -> payment |
| **Payment** | Test card numbers (no real charges) |
| **Webhooks** | Supported in sandbox |
| **Expiration** | No expiration; sandbox is permanently available |

### Sandbox Realism

The sandbox is **functional but not realistic in content terms**:

- **Test airline only**: Sandbox returns flights from "Duffel Airways" (a fictional airline), not real airlines. This means you cannot test real-world airline coverage, fare classes, or ancillary availability.
- **Realistic data structure**: The JSON response format is identical to live. Field names, nesting, data types -- all match production.
- **Simulated pricing**: Prices are realistic ranges but not real market prices.
- **All endpoints available**: Search, offers, orders, payments, order changes, cancellations, seat maps, baggage -- all work in sandbox.
- **Webhook testing**: Sandbox fires real webhook events, which is excellent for testing order lifecycle handling.

### Sandbox Limitations

1. Cannot test real airline content or coverage
2. Cannot verify actual fare rules or cancellation policies
3. Cannot test ancillary availability for specific airlines
4. Cannot reproduce edge cases from specific carriers
5. Cannot test payment processing with real payment methods

### Transition to Live

Moving from sandbox to live requires:
1. Apply for live access through the Duffel dashboard
2. Submit business details (company name, use case, expected volume)
3. Approval typically takes 1-5 business days
4. Receive live API key (prefix `duffel_live_`)
5. No additional code changes needed -- just swap the API key

This is dramatically simpler than legacy GDS onboarding, which can take months.

---

## 6. SDK and Documentation Quality

### Available SDKs

Duffel provides official client libraries:

| Language | Package | Status | Notes |
|----------|---------|--------|-------|
| **JavaScript/TypeScript** | `@duffel/api` | Official, actively maintained | Published on npm. TypeScript types included. |
| **Python** | `duffel-api` | Official, actively maintained | Published on PyPI |
| **Ruby** | `duffel_api` | Official | Less frequently updated |

The **JavaScript/TypeScript SDK** is the most mature and best-maintained, which aligns perfectly with Miles Optimizer's Next.js stack.

### SDK Quality Assessment

**JavaScript SDK (`@duffel/api`)**:
- Full TypeScript types for all request/response objects
- Automatic pagination handling
- Built-in rate limit handling with automatic retries
- Webhook signature verification helper
- Well-structured error classes (DuffelError with type discrimination)
- Promise-based, async/await compatible

Example usage:
```typescript
import { Duffel } from '@duffel/api';

const duffel = new Duffel({ token: process.env.DUFFEL_API_KEY });

// Search flights
const offerRequest = await duffel.offerRequests.create({
  slices: [{
    origin: 'JFK',
    destination: 'LAX',
    departure_date: '2026-04-15',
  }],
  passengers: [{ type: 'adult' }],
  cabin_class: 'economy',
});

// Get offers
const offers = await duffel.offers.list({
  offer_request_id: offerRequest.data.id,
  sort: 'total_amount',
  max_connections: 1,
});
```

### Documentation Quality

**Rating: 8.5/10 -- Among the best in travel tech.**

Strengths:
- Clean, modern docs site (docs.duffel.com)
- Interactive API explorer with example requests/responses
- Step-by-step guides for common flows (search, book, manage)
- Comprehensive API reference with every field documented
- Webhook event documentation
- Versioning and changelog
- Postman collection available

Weaknesses:
- Some edge cases are under-documented (particularly around GDS vs NDC behavioral differences)
- Rate limit documentation could be more explicit about exact numbers
- Limited "recipes" or advanced integration patterns
- Community/forum is small compared to Amadeus

### Developer Experience

| Aspect | Rating | Notes |
|--------|--------|-------|
| Time to first search | Excellent | <30 minutes from signup to first API call |
| Error messages | Good | Clear error codes and messages |
| API design | Excellent | RESTful, consistent, well-structured JSON |
| Breaking changes | Good | Versioned API, deprecation notices |
| Support channels | Good | Email support, some Slack community presence |
| Status page | Yes | status.duffel.com for uptime monitoring |

### Support Options

- **Email support**: Available for all users
- **Slack community**: Limited/invite-based
- **Enterprise support**: Dedicated Slack channel, account manager
- **Response time**: Typically 24-48 hours for standard support; faster for enterprise

---

## 7. Limitations and Gotchas

### Critical Limitations

1. **Search-to-book ratio (1500:1)**: This is the biggest operational constraint for a search-heavy product. If users search but don't book through Miles Optimizer, this ratio will quickly become a problem. Caching is essential mitigation.

2. **No award/miles bookings**: Duffel handles **cash bookings only**. You cannot search for or book flights using airline miles/points through Duffel. For Miles Optimizer, this means Duffel covers the "commercial flight search" use case but NOT the core "miles optimization" use case. Award search requires a separate solution (Seats.aero API, scraping, or link-out).

3. **No Southwest**: As discussed above. This is not a Duffel limitation per se -- no API has Southwest. But it must be communicated clearly to users.

4. **Points of sale limitation**: Managed Content is only available for 5 points of sale (US, UK, Ireland, France, Australia). If Miles Optimizer expands to other markets, this becomes a constraint.

5. **Offer expiration**: Search results (offers) expire. Typically within 30-60 minutes of being returned. Your UI must handle expired offers gracefully -- if a user takes too long, the price may change or the offer may disappear.

6. **No multi-city complex itineraries**: Duffel supports one-way and round-trip searches well. Complex multi-city or open-jaw itineraries have limited support depending on the airline and content source.

### Known Gotchas

7. **GDS vs NDC behavioral differences**: The same airline may behave differently depending on whether the content comes via NDC or GDS. Baggage allowances, fare rules, and change policies may differ. Your code should handle both gracefully.

8. **Partial content for some airlines**: Not all airlines return complete ancillary data. Seat maps may be available for airline X but not airline Y. Baggage pricing may be included for NDC airlines but missing for GDS airlines.

9. **Currency handling**: Duffel returns prices in the currency of the point of sale. For US point of sale, this is USD. But connecting flights through international hubs may involve currency quirks.

10. **Webhook reliability**: While webhooks work well, they are not guaranteed delivery. Implement idempotent webhook handlers and periodic polling as a backup for critical order status updates.

11. **Booking modifications**: Not all bookings can be modified through the API. Some changes must be handled through airline customer service. The API will return an error if a modification isn't supported.

12. **Name matching**: Passenger names must exactly match government-issued ID. Duffel validates name format but cannot verify accuracy. Mismatches cause boarding issues, not API errors.

13. **Infant handling**: Searching for and booking infant passengers (under 2, lap-held) has additional complexity and is not supported by all content sources.

---

## 8. Data Fields Returned

### Offer Request (Search) Response

The search response is rich. Key fields include:

**Flight-Level Data:**
- Airline (marketing carrier and operating carrier)
- Flight number
- Aircraft type
- Departure/arrival airports (IATA codes + full names)
- Departure/arrival times (with timezone)
- Duration
- Number of stops
- Connection information (layover airports, duration)
- Terminal information

**Pricing Data:**
- Total amount (in specified currency)
- Base amount (fare excluding taxes)
- Tax amount
- Tax breakdown (by tax code)
- Per-passenger pricing
- Currency code

**Fare Data:**
- Fare brand name (e.g., "Basic Economy", "Main Cabin", "Economy Plus")
- Fare basis code
- Cabin class (economy, premium_economy, business, first)
- Fare conditions (refundable, changeable, penalties)
- Booking class letter

**Baggage:**
- Checked baggage allowance (quantity and weight)
- Carry-on allowance
- Additional baggage purchase options (if NDC airline)
- Baggage pricing for add-ons

**Seat Selection:**
- Seat map availability (via separate endpoint)
- Seat pricing
- Seat attributes (extra legroom, window, aisle, bulkhead)
- Not available for all airlines

**Ancillaries:**
- Available ancillary services vary by airline and content source
- May include: extra baggage, seat selection, meals, priority boarding, lounge access
- NDC airlines have much richer ancillary content than GDS airlines

### Order (Booking) Response

After booking, additional data is returned:
- Booking reference / PNR
- Ticket numbers
- Payment status
- Order status (confirmed, pending, cancelled)
- E-ticket documents (if available)
- Fare rules (detailed change/cancellation policies)

### Airline & Airport Reference Data

Duffel provides reference data endpoints:
- Airlines: IATA code, name, logo URL, conditions of carriage URL
- Airports: IATA code, name, city, country, latitude, longitude, timezone
- Aircraft: IATA code, name
- Cities: name, IATA code, country

---

## 9. Comparison with Alternatives

### Duffel vs Amadeus Self-Service

| Dimension | Duffel | Amadeus Self-Service |
|-----------|--------|---------------------|
| **Pricing model** | Per-booking (% of ticket) | Per-API-call (search costs money) |
| **Search cost** | Free | ~$0.01-0.04 per search (Flight Offers Search) |
| **Free tier** | Sandbox (unlimited) | 500 free API calls/month |
| **Booking capability** | Full booking in Managed mode | Requires IATA accreditation for real bookings |
| **Accreditation** | Not needed (Managed Content) | Required for booking |
| **Airlines** | 300+ (NDC + Travelport GDS) | 400+ (Amadeus GDS, growing NDC) |
| **US domestic** | Good (no Southwest) | Good (no Southwest) |
| **NDC coverage** | 20-30 airlines direct | Growing but still limited |
| **SDK quality** | Excellent (TypeScript) | Good (many languages: JS, Python, Java, etc.) |
| **Docs quality** | Excellent | Good but more complex |
| **Rate limits** | ~200 req/min | Varies; 10 TPS for free tier |
| **Time to integrate** | Days | Weeks (more complex API) |
| **Enterprise path** | Email sales | Dedicated enterprise program |
| **Data richness** | Rich (especially NDC) | Deep (GDS heritage) but less modern |
| **Startup friendliness** | Excellent | Moderate (free tier is limited) |

**Verdict**: Duffel is significantly better for Miles Optimizer's use case. Amadeus Self-Service charges per search, which would be prohibitively expensive for a search-heavy product. Amadeus Enterprise is a different conversation -- it provides deeper GDS content but requires accreditation and enterprise contracts.

### Duffel vs Amadeus Enterprise

Amadeus Enterprise is what large OTAs (Kayak, Booking.com) use. It provides:
- Full GDS content from Amadeus (the largest GDS globally)
- Deep fare filing data
- Extensive airline coverage (400+ airlines)
- Complex itinerary support (multi-city, open-jaw)
- Mini-rules and fare rules

But it requires:
- IATA/ARC accreditation
- Enterprise sales engagement (months of process)
- Significant minimum commitments ($10,000+/month typical)
- EDIFACT/XML message handling (complex integration)
- Dedicated GDS terminal expertise

**Not viable for a startup.** Revisit if Miles Optimizer reaches significant booking volume (5,000+ bookings/month).

### Duffel vs Kiwi.com Tequila API

| Dimension | Duffel | Kiwi.com Tequila |
|-----------|--------|-----------------|
| **Model** | API for your own product | White-label solution |
| **Pricing** | % per booking | Commission-based (Kiwi keeps margin) |
| **Branding** | Your brand entirely | Can be white-labeled but Kiwi is underlying |
| **Content** | Direct airline content | Aggregated (virtual interlining is key feature) |
| **Virtual interlining** | No | Yes -- connects flights from different airlines |
| **Accreditation** | Not needed | Not needed (Kiwi is MoR) |
| **Self-connect risk** | N/A | Kiwi's "Guarantee" covers missed connections on self-connect itineraries |
| **Booking control** | Full via API | Managed by Kiwi backend |
| **Data richness** | High (NDC airlines) | Moderate (aggregated view) |
| **Startup friendliness** | High | High |
| **US domestic** | Good | Good (similar coverage) |

**Kiwi Tequila's unique selling point is virtual interlining** -- combining flights from different airlines (e.g., Spirit outbound + JetBlue return) that the airlines themselves don't sell as a package. This is creative and potentially valuable for budget optimization.

**Kiwi Tequila's downside** is less control. You're building on top of Kiwi's platform, and your booking flow is ultimately Kiwi's. Duffel gives you more control over the experience.

**Potential hybrid approach**: Use Duffel for standard airline bookings (where you want full control and NDC richness) and Kiwi Tequila for virtual interlining suggestions (where the creative routing adds unique value). This is a Phase 3 consideration.

### Other Alternatives Worth Noting

| API | Best For | Why Not Primary |
|-----|----------|----------------|
| **Skyscanner Affiliate API** | Referral revenue from flight links | Search-only, no booking. Redirects to OTAs. Less data control. |
| **Google Flights (QPX/ITA)** | Google's flight search | Not publicly available as an API. ITA Matrix is consumer-only. |
| **Sabre Dev Studio** | Enterprise airline content | Requires accreditation, enterprise contracts. Similar barriers as Amadeus Enterprise. |
| **Travelpayouts** | Affiliate flight links | Redirect model, no booking. Good for monetization but not for building a booking product. |
| **FlightAware / AeroAPI** | Flight tracking, status | Not for booking. Useful as supplementary data (delay predictions, etc.) |
| **Aviation Edge** | Route data, schedules | Already in the master plan for Phase 3. Reference data, not booking. |

---

## 10. Actionable Takeaways for Miles Optimizer

### Is Duffel the Right Choice?

**Yes, for the MVP and likely through the first 12-18 months.** Here is why:

1. **Zero upfront cost**: No fees until you have paying users making bookings. Perfect for pre-revenue startup.
2. **No accreditation**: Managed Content means you skip the IATA/ARC process entirely. This was confirmed in the legal research -- huge savings of time and compliance cost.
3. **Modern DX**: The TypeScript SDK integrates cleanly with the Next.js stack. Integration time is days, not weeks.
4. **Rich enough data**: NDC content from AA and UA (the two largest US domestic carriers) provides branded fares, baggage data, and seat selection -- enough for a great user experience.
5. **Booking capability**: Users can search AND book through Miles Optimizer. This is critical for revenue (content fee on bookings) and for maintaining a healthy search-to-book ratio.

### Key Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Search-to-book ratio (1500:1)** | HIGH | Aggressive Redis caching (4hr TTL), debounced searches, drive bookings through UX |
| **No Southwest** | MEDIUM | Clear UI disclosure, "Check Southwest" link-out, this affects ALL flight APIs equally |
| **No award/miles bookings** | HIGH (for product positioning) | Duffel is for CASH flights only. Award search handled by Seats.aero API / link-out. Make this distinction clear in the product. |
| **Delta limited data** | LOW-MEDIUM | Delta available via GDS but lacks NDC richness. Will improve as Delta rolls out NDC. |
| **Duffel company risk** | LOW | Well-funded (Series B+), growing customer base, but still a startup themselves. Have a contingency migration plan. |
| **Points of sale limitation** | LOW (for now) | Only 5 countries supported for Managed Content. Fine for US launch. Revisit for international expansion. |
| **Offer expiration** | LOW | Implement real-time price validation before checkout. Show "prices may change" disclaimer. |

### Cost Projection for First Year

| Month | Phase | Users | Searches | Bookings | Duffel Cost |
|-------|-------|-------|----------|----------|-------------|
| 1-3 | Build | 0 | Sandbox | 0 | $0 |
| 4 | Beta | 50 | ~5,000 | ~5 | ~$15 |
| 5-6 | Growth | 500 | ~25,000 | ~25 | ~$75 |
| 7-9 | Scale | 2,000 | ~100,000 | ~100 | ~$300 |
| 10-12 | Traction | 5,000 | ~250,000 | ~250 | ~$750 |
| **Year 1 Total** | | | | ~380 | **~$1,200** |

These estimates assume:
- Average booking value: $500
- Content fee: 0.5% (~$2.50 per booking)
- Search-to-book conversion: ~0.1% (1 in 1,000 searches results in a booking)
- Many users will search but book directly with airlines (especially early on)

**At these volumes, Duffel is essentially free.** The cost only becomes meaningful at 10,000+ bookings/month, by which point Miles Optimizer should have significant subscription and affiliate revenue.

### Implementation Recommendations

1. **Start with sandbox immediately**: Build the entire flight search and booking flow against the sandbox in Weeks 3-4 as planned. The API structure is identical to production.

2. **Apply for live access in Week 6**: Submit your live access application while polishing the search UI. Approval takes 1-5 business days.

3. **Implement aggressive caching from Day 1**: Do not treat caching as an optimization. It is a requirement for managing the search-to-book ratio. Cache identical route/date/class queries in Upstash Redis with a 4-hour TTL.

4. **Build the booking flow**: Even if the initial product focus is search and optimization, having a functional booking flow is important for (a) revenue and (b) maintaining a healthy search-to-book ratio with Duffel.

5. **Handle the "two worlds" clearly in UX**:
   - **Cash flights** = Duffel (search, compare, book)
   - **Award flights** = Seats.aero or link-out (search availability, redirect to airline)
   - Users must understand which mode they're in

6. **Monitor the search-to-book ratio**: Build a simple dashboard that tracks your ratio weekly. If it starts approaching 1000:1, you need to either drive more bookings or reduce unnecessary searches.

7. **Plan for Kiwi Tequila as Phase 3 enhancement**: Virtual interlining is a genuinely unique feature that could differentiate Miles Optimizer. Consider adding it as a "Creative Routes" feature in Month 7 as the master plan suggests.

### What Duffel Does NOT Solve

To be clear about what Miles Optimizer still needs beyond Duffel:

| Need | Solution | Status |
|------|----------|--------|
| Award flight search | Seats.aero API or link-out | Decision made (see Key Decisions doc) |
| Loyalty account balances | AwardWallet Web Parsing API | Phase 1 (Month 4+) |
| Credit card data | AwardWallet Credit Card Bonus API + own data | Phase 1 |
| Transfer bonuses | Own scrapers (bank websites) | Phase 1 (Weeks 5-6) |
| Flight status/delays | FlightAware AeroAPI or similar | Phase 3 |
| Route network data | Aviation Edge ($149/mo) | Phase 3 |

### Final Verdict

Duffel is the correct and optimal choice for Miles Optimizer's commercial flight search and booking needs. It offers the best combination of developer experience, startup-friendly economics, no accreditation requirements, and modern API design. The main risks (search-to-book ratio, no Southwest, cash-only) are manageable with proper architectural decisions and clear product positioning.

The total Year 1 cost of ~$1,200 for Duffel is negligible compared to the value it provides. The real cost of flight data for Miles Optimizer will come from award search (Seats.aero API, estimated $200-1,000/mo) and scraping infrastructure (proxies, Railway hosting), not from Duffel.

**Recommendation: Proceed with Duffel integration as P0 priority. Begin sandbox development in Week 3. Apply for live access in Week 6. Launch with commercial flight search + booking alongside award search (via Seats.aero or link-out) in the public beta (Week 12).**

---

## Appendix: Quick-Reference Links

| Resource | URL |
|----------|-----|
| Duffel Homepage | https://duffel.com |
| API Documentation | https://duffel.com/docs/api |
| Pricing Page | https://duffel.com/pricing |
| Status Page | https://status.duffel.com |
| JavaScript SDK (npm) | https://www.npmjs.com/package/@duffel/api |
| Python SDK (PyPI) | https://pypi.org/project/duffel-api/ |
| GitHub (SDKs) | https://github.com/duffel |
| Sandbox Signup | https://app.duffel.com/signup |
| API Changelog | https://duffel.com/docs/api/changelog |

---

*This is a living document. Update after sandbox testing begins (Week 3) with hands-on findings, and again after live access is granted (Week 6) with real content observations.*
