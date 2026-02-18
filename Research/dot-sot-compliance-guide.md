# DOT Compliance & Seller of Travel Registration Guide

**Date:** February 18, 2026
**Status:** Research Complete
**Classification:** INTERNAL -- Regulatory Compliance

---

## Executive Summary

Wayloft's flight search and booking feature (via Duffel API) triggers two categories of regulatory obligations: (1) DOT consumer protection rules that must be built into the UI, and (2) Seller of Travel registration in 4 states. Duffel's role as merchant of record may reduce but not eliminate SOT requirements -- attorney analysis recommended. DOT compliance is non-negotiable and must be built into every price display and booking flow component.

---

## 1. DOT Frontend Compliance Checklist

### 1.1 Full Fare Advertising -- 14 CFR 399.84

| Requirement | Regulation | UI Location | Implementation Notes |
|---|---|---|---|
| Display total price including all taxes and mandatory fees | 399.84(a) | Search results, offer cards, checkout | Use Duffel's `total_amount` (includes taxes). Never show base fare as the primary price. |
| Total price must be the most prominently displayed price | 399.84(b) | All price displays | Base fare breakdown can be shown in expandable detail, but total price must be largest/first. |
| If showing price per person, clearly state "per person" | 399.84 | Search results | Add "per person" label on all fare displays for multi-passenger searches. |
| Include all carrier-imposed surcharges in the displayed price | 399.84(a) | Search results | Duffel includes these in `total_amount`. Verify no surcharges are excluded. |

### 1.2 24-Hour Hold/Cancellation -- 14 CFR 259.5(b)(4-5)

| Requirement | Regulation | UI Location | Implementation Notes |
|---|---|---|---|
| Allow free cancellation within 24 hours of purchase (if departure 7+ days out) | 259.5(b)(4) | Booking confirmation, order management | Implement one-click cancellation during 24hr window. Show countdown timer. |
| OR offer a 24-hour hold at the quoted fare without payment | 259.5(b)(5) | Checkout page | Duffel supports hold-then-pay via `payment_type: hold`. Either option satisfies the rule. |
| Clearly disclose the 24-hour policy before purchase | 259.5 | Checkout page | Add notice: "Free cancellation within 24 hours of booking, if departure is 7+ days away." |

### 1.3 Automatic Refunds -- 14 CFR Part 260 (effective Oct 28, 2024)

| Requirement | Regulation | UI Location | Implementation Notes |
|---|---|---|---|
| Automatic cash refund for cancelled flights | 260.5 | Order management, email notifications | Monitor Duffel webhooks for cancellations. Trigger refund automatically. |
| Automatic refund for "significant changes" (3+ hr domestic, 6+ hr international) | 260.5 | Flight change alerts | Track schedule changes via Duffel. Notify user with refund option FIRST. |
| Refund to original payment method within 7 business days (credit card) | 260.7 | Refund flow | Duffel processes as MoR. Monitor their SLA. Contractual backstop needed. |
| Refund of ancillary fees for services not provided | 260.6 | Order management | If bag fee paid but bags delayed >12hrs, refund due. Complex -- may defer to Phase 3. |

### 1.4 Baggage Fee Disclosure -- 14 CFR 399.85

| Requirement | Regulation | UI Location | Implementation Notes |
|---|---|---|---|
| Display first and second checked bag fees | 399.85(a) | Search results (inline or tooltip) | Use Duffel's baggage data. For GDS fares without data: "Bag fees may apply. [View airline policy]" |
| Display carry-on allowance | 399.85(b) | Offer details | Show included bags per fare class. |
| Link to airline's complete fee schedule | 399.85(c) | Offer details footer | "View complete fee policy" link to airline website. |

### 1.5 Code-Share Disclosure -- 14 CFR 257

| Requirement | Regulation | UI Location | Implementation Notes |
|---|---|---|---|
| Disclose operating carrier when different from marketing carrier | 257.5(a) | Search results, offer details, confirmation | Compare Duffel's `marketing_carrier` vs `operating_carrier`. Show "Operated by [X]" if different. |
| Disclosure must appear in search results, not just checkout | 257.5(b) | Search results list | Inline label below marketing carrier name. |
| Booking confirmation must include operating carrier | 257.5(d) | Confirmation email, order details | Include per-segment operating carrier info. |

### 1.6 Display Neutrality -- 14 CFR Part 256

| Requirement | Regulation | UI Location | Implementation Notes |
|---|---|---|---|
| No carrier-based bias in default sort order | 256.4 | Search results sort logic | Default sort by price, duration, or departure -- never by carrier. |
| User-selectable sort criteria | Best practice | Search toolbar | Offer: Price, Duration, Stops, Departure, Arrival. |
| No suppression of carriers | 256.4 | Search results | Display all Duffel results. Don't hide airlines based on business relationships. |

### 1.7 Compliance Summary Matrix

| DOT Requirement | Duffel Handles? | Wayloft Responsibility |
|---|---|---|
| Full fare advertising | Provides data | Display total price in all UI touchpoints |
| 24-hour cancellation | Processes cancellation | Disclose policy, enable cancellation flow |
| Automatic refunds | Processes refund as MoR | Monitor disruptions, notify consumers |
| Baggage fee disclosure | Provides data (NDC) | Display fees, build fallback for GDS gaps |
| Code-share disclosure | Provides data | Display operating carrier in results + confirmation |
| Display neutrality | N/A | Implement unbiased sort, no carrier suppression |

---

## 2. Seller of Travel -- State-by-State Registration Guide

### 2.1 State-by-State Comparison

| Dimension | California | Florida | Hawaii | Washington |
|---|---|---|---|---|
| **Authority** | CA Attorney General / TCRF | FL Dept. of Agriculture | HI DCCA | WA Dept. of Licensing |
| **Statute** | Bus. & Prof. Code 17550-17556.5 | FL Statutes 559.926-559.9365 | HI Rev. Statutes 468L | WA Rev. Code 19.138 |
| **Application Fee** | ~$100 | $300 + $50 filing | ~$146-215 | ~$178 |
| **Annual Renewal** | ~$100 | $300/year | Biennial (~$146-215) | ~$178/year |
| **Bond Requirement** | No bond; trust account + TCRF | $25,000 surety bond (first 5 years) | No bond; trust account | $10,000-50,000 (varies) |
| **Trust Account** | Required (CA bank) | Not required if bonded | Required (HI bank) | Not required if bonded |
| **Display Requirements** | CST# on ALL advertising | SOT# on advertising | Registration# required | Registration# required |
| **Processing Time** | 4-8 weeks | 2-4 weeks | 4-6 weeks | 2-4 weeks |
| **Penalties** | Up to $10,000/violation | $1,000-5,000/violation | $500/day | Up to $2,000/violation |

### 2.2 Total SOT Cost Estimate

| Cost Category | Year 1 Estimate | Annual Ongoing |
|---|---|---|
| Registration fees (4 states) | $825-1,040 | $775-990 |
| Bonds (FL + WA) | $350-750 | $350-750 |
| Trust accounts (CA + HI) | $400-1,000 | $200-500 |
| TCRC assessment (CA) | $50-200 | $50-200 |
| Attorney review | $1,000-2,000 | $0 (one-time) |
| **Total** | **$2,625-4,990** | **$1,375-2,440** |

---

## 3. Duffel Merchant-of-Record Analysis

### 3.1 What "Merchant of Record" Means

In Duffel's Managed Content model:
- **Duffel collects payment** from the consumer
- **Duffel processes refunds** to consumer's payment method
- **Duffel holds IATA/ARC accreditation** and issues tickets
- **Wayloft's role** is a technology platform / referral layer

### 3.2 Impact on SOT Requirements

**Arguments FOR exemption:**
1. Wayloft never handles consumer travel funds
2. Trust account / bond requirements become moot (no funds to safeguard)
3. Wayloft functions as a "referral service" (similar to Google Flights, Kayak)

**Arguments AGAINST exemption:**
1. Wayloft "holds itself out" as selling travel (UI presents booking flow)
2. Consumer perception -- users think they're buying "on Wayloft"
3. California's broad definition includes "advertises" travel services
4. No clear legal precedent for this specific model

### 3.3 State-by-State MoR Impact

| State | Exemption Likelihood | Recommendation |
|---|---|---|
| California | 40-50% | Register regardless (most aggressive enforcer) |
| Florida | 50-60% | Seek attorney opinion |
| Hawaii | 50-60% | Seek attorney opinion |
| Washington | 50-60% | Registration is cheap -- register to be safe |

### 3.4 Recommended Approach

1. **Engage travel/tech attorney** for formal MoR exemption analysis ($1,500-3,000)
2. **Register in California regardless** -- broadest definition, highest penalties, cheapest insurance
3. **Follow attorney guidance** for FL, HI, WA
4. **Negotiate Duffel contract** to confirm MoR status, refund SLA, 24-hour cancellation handling

---

## 4. Implementation Timeline

| Week | Action | Cost |
|---|---|---|
| Week 2 (now) | Engage travel/tech attorney | $1,500-3,000 |
| Week 3-4 | Build DOT-compliant UI components | $0 (dev time) |
| Week 5 | Receive attorney MoR opinion | (included) |
| Week 5-6 | File CA SOT application | ~$500 |
| Week 6 | File FL, HI, WA if recommended | ~$1,200 |
| Week 7-8 | Obtain bonds, set up trust accounts | $750-1,750 |
| Week 9 | DOT compliance QA | $0 (dev time) |
| Week 12 | Launch booking feature (beta) | $0 |

---

## 5. UI Component Mapping

### Search Results Page (`/app/(app)/flights/search`)
- `<FlightOfferCard>` -- full fare (399.84), bag fees (399.85), code-share (257)
- `<SortToolbar>` -- display neutrality (256)
- `<BagFeeIndicator>` -- inline bag fee icons/tooltip

### Booking/Checkout (`/app/(app)/flights/book`)
- `<TotalPriceSummary>` -- final price matching search results
- `<CancellationPolicyNotice>` -- 24-hour cancellation disclosure
- `<RefundRightsDisclosure>` -- Part 260 rights
- `<AncillaryFeeSummary>` -- itemized add-ons

### Confirmation Page & Email
- `<BookingConfirmation>` -- operating carriers, 24hr cancellation countdown
- `<CancelBookingButton>` -- prominent during 24-hour window

### Order Management (`/app/(app)/trips`)
- `<FlightChangeAlert>` -- webhook-driven, refund option displayed first
- `<RefundStatusTracker>` -- processing status and timeline

---

## 6. Decision Checklist

- [ ] Engage travel/tech attorney ($2-5k)
- [ ] Request MoR exemption analysis for SOT
- [ ] Review Duffel contract for MoR terms, refund SLA
- [ ] File CA SOT registration (regardless of MoR outcome)
- [ ] File FL, HI, WA registrations (if attorney recommends)
- [ ] Build DOT-compliant FlightOfferCard component
- [ ] Build DOT-compliant checkout flow
- [ ] Build order management with automatic refund detection
- [ ] Implement neutral sort algorithms
- [ ] Add CST/SOT registration numbers to website footer
- [ ] QA all price display touchpoints

---

*Based on publicly available regulations and Duffel documentation. Not legal advice. Verify current requirements at ecfr.gov and state agency websites.*
