# Miles Optimizer — P0 Legal & Regulatory Research Report

**Version:** 1.0
**Date:** February 16, 2026
**Status:** Research Complete — Awaiting Attorney Review
**Classification:** INTERNAL — Business Strategy

---

## Executive Summary

This report covers the five P0 legal/regulatory research items that must be resolved before development begins. The findings are mixed: some areas are clear green lights, others require careful navigation. The single most important takeaway is that **Duffel's Managed Content eliminates the biggest regulatory barrier** (IATA/ARC accreditation), but award scraping carries real legal risk that must be mitigated through architecture decisions.

**Bottom Line Recommendations:**
1. Use Duffel for commercial flight search/booking (no accreditation needed)
2. Do NOT scrape award availability directly from airline websites at MVP
3. Pursue data licensing from Seats.aero or AwardWallet instead
4. Register as Seller of Travel in CA, FL, HI, WA before accepting bookings
5. Consult a travel/tech attorney before launch ($2-5k, essential investment)

---

## R1: Scraping Legality — Award Availability

### Risk Level: HIGH

### The Legal Landscape

The legality of scraping airline award availability is genuinely contested, with active litigation and no definitive resolution. Here is the current state:

**Key Case: hiQ Labs v. LinkedIn (9th Circuit, 2022)**

The Ninth Circuit held twice that scraping publicly accessible data does not violate the Computer Fraud and Abuse Act (CFAA). The court applied a "gates-up-or-down" framework: if a website doesn't require authentication to access data, the CFAA's "without authorization" clause doesn't apply. This was reinforced by the Supreme Court's Van Buren v. United States (2021) decision, which narrowed CFAA's scope.

However, the hiQ case ultimately settled with hiQ agreeing to stop scraping and pay $500k in damages — but on breach of contract grounds (violating LinkedIn's terms of service), not CFAA grounds. This is the critical nuance: CFAA may not apply to public data scraping, but breach of contract claims based on website terms of service can still succeed.

**Key Case: Air Canada v. Seats.aero (D. Del., 2023-present)**

This is the most directly relevant case to Miles Optimizer. Air Canada sued Seats.aero in October 2023 under eight claims including CFAA violations, breach of contract (website ToS), trademark infringement (using Aeroplan logo), and trespass to chattels. Air Canada sought $2M+ in statutory damages.

Critical outcome so far: In March 2024, the judge rejected Air Canada's request for a preliminary injunction, allowing Seats.aero to continue operating while the case proceeds. This is a positive signal but not a final ruling.

Air Canada's legal theory centers on: (1) Seats.aero agreed to website ToS by accessing the site, (2) the ToS prohibits automated scraping, (3) Seats.aero circumvented technical blocking measures, and (4) the scraping burdened Air Canada's IT infrastructure.

**Key Case: Southwest Airlines v. Kiwi.com (N.D. Tex., 2021)**

Southwest obtained a preliminary injunction against Kiwi.com, and later a permanent injunction, barring Kiwi from scraping Southwest's website and publishing fare information. The court found Kiwi had breached Southwest's terms of service. Southwest has a long history of successfully suing scrapers going back to 2004, winning against FareChase, Roundpipe, and others.

Notably, Southwest also sued Skiplagged, which didn't directly scrape Southwest but obtained data from Kiwi.com — arguing that even indirect use of scraped data violated their rights.

### Key Legal Principles

1. **CFAA likely does not apply** to scraping publicly accessible websites that don't require authentication. The hiQ and Van Buren decisions established this fairly clearly.

2. **Breach of contract claims CAN succeed.** If you access a website and its ToS prohibits scraping, courts may find you agreed to those terms and breached them. This is the primary legal weapon airlines are using.

3. **Trademark claims add risk.** Using airline logos, program names (Aeroplan, MileagePlus, etc.) in your service without permission creates additional exposure. Seats.aero is facing this claim.

4. **"Trespass to chattels" claims** allege that scraping burdens airline servers. If you can show your scraping is rate-limited and doesn't cause material harm, this claim is weaker.

5. **Circumventing technical measures** (CAPTCHAs, IP blocks, rate limiters) significantly increases legal risk. The CFAA may apply if you actively bypass access controls.

6. **14 CFR Part 256** — DOT's Electronic Airline Information Systems regulation explicitly states airlines are NOT required to allow screen scraping.

### Risk Assessment for Miles Optimizer

| Approach | Risk Level | Notes |
|----------|-----------|-------|
| Scraping airline websites directly | **HIGH** | Breach of contract exposure, possible CFAA if auth required |
| Using APIs provided by airlines | **LOW** | Authorized use, but few airlines offer public APIs for award data |
| Licensing data from aggregators (Seats.aero, AwardWallet) | **LOW** | Contractually authorized, transfers risk to provider |
| Using Duffel for commercial flights | **VERY LOW** | Authorized API with managed accreditation |
| Scraping bank transfer bonus pages | **MEDIUM** | Less litigious than airlines, but ToS still apply |

### Recommendation

**For MVP (Phase 1-2):** Do NOT scrape airline award availability directly. Instead:
- Use Duffel API for commercial flight search (authorized, no risk)
- Pursue a data licensing partnership with Seats.aero or AwardWallet for award data
- If you must build award features before licensing is secured, let users manually input their loyalty program data or link accounts via AwardWallet's OAuth

**For Phase 3+:** Re-evaluate based on how Air Canada v. Seats.aero resolves. If Seats.aero prevails, the landscape shifts significantly in favor of scrapers. If Air Canada prevails, data licensing becomes the only viable path.

**For transfer bonus scraping:** This is medium risk. Banks are less litigious than airlines about this, and the data (bonus percentages, partner lists) is publicly displayed marketing information. Mitigate by: rate-limiting aggressively, not circumventing any access controls, not using bank trademarks prominently, and being prepared to stop scraping any bank that sends a cease and desist.

**Must-do before launch:** Retain a tech/travel attorney to review your scraping practices. Budget $2-5k. This is non-negotiable.

---

## R2: IATA/ARC Accreditation Requirements

### Risk Level: LOW (with Duffel)

### Finding: Duffel Eliminates This Barrier

Duffel's Managed Content program completely eliminates the need for Miles Optimizer to obtain its own IATA or ARC accreditation. Here is why this matters enormously:

**What accreditation normally requires:**
- IATA/ARC application process: 90 days to 12+ months
- Surety bond: minimum $20,000 (ARC), average $50,000 (IATA)
- ARC application fee: $2,300
- Agent security training every 6 months
- Annual financial reviews by IATA
- Dedicated ARC Specialist on staff
- PCI DSS compliance
- Reading a 245-page ARC handbook and 60-page Agent Reporting Agreement

**What Duffel provides instead:**
- Managed Content includes access to 5 IATA accreditations worldwide (US, UK, Ireland, France, Australia)
- NDC exclusive pricing from 20+ airlines
- No bonds, no application fees, no waiting period
- Start selling flights from Day 1
- You can mix Managed Content with your own accreditation later if desired
- Content fee of 0.5% per booking applies when using their accreditation

**Search-to-book ratio note:** Duffel charges a fee if you exceed a 1500:1 search-to-book ratio. For a tool that many users will use for research without booking, this could trigger. Monitor this metric carefully and consider caching strategies to reduce API calls.

### Recommendation

Use Duffel Managed Content for MVP. No accreditation needed. The 0.5% content fee is a reasonable cost of doing business at our stage. If/when booking volume justifies it ($100k+ in bookings), evaluate getting your own ARC accreditation to eliminate the content fee.

---

## R3: DOT Requirements for Online Travel Platforms

### Risk Level: MEDIUM

### Miles Optimizer as a "Ticket Agent" Under DOT Rules

The key question is whether Miles Optimizer qualifies as a "ticket agent" under 49 U.S.C. Section 40102(a)(45). A ticket agent is defined as any person (except an air carrier) that "sells, offers for sale, negotiates for, or holds itself out as selling, providing, or arranging for, air transportation."

**If Miles Optimizer enables booking through Duffel:** Yes, you are likely a ticket agent. This triggers DOT compliance requirements.

**If Miles Optimizer only shows flight information and links to airlines/OTAs:** The classification is murkier. DOT has been expanding its interpretation to include entities that "manipulate fare, schedule, and availability information in response to consumer inquiries and receive a form of compensation."

### DOT Requirements That Apply to Ticket Agents

**Full fare advertising rule (14 CFR 399.84):**
- All fares displayed must include taxes and mandatory fees
- No drip pricing — the total price must be shown upfront
- Cannot advertise a fare that is not available

**24-hour hold/cancellation (14 CFR 259.5(b)(4)):**
- Must allow reservations made 7+ days before departure to be held without payment or cancelled without penalty for 24 hours
- Must disclose your 24-hour policy on the last page of the booking process
- If you don't offer a 24-hour hold, you must disclose that

**Automatic refund rule (14 CFR Part 260, effective 2024):**
- Must provide automatic refunds when a carrier cancels or significantly changes a flight and the consumer doesn't accept alternatives
- Refunds must be issued within 7 business days for credit cards, 20 calendar days for other payment methods
- Must inform consumers of refund rights before offering vouchers

**Ancillary fee transparency (14 CFR 399.85):**
- Must disclose fees for first/second checked bags, carry-on bags, and seat selection
- Must display these fees alongside fare information
- Must include a "seat guarantee notice" when offering paid seat selection

**Electronic Airline Information Systems (14 CFR Part 256):**
- Integrated displays must not give system-imposed preference to any carrier based on carrier identity
- Must disclose if carrier identity affects display ordering
- Important note: This regulation explicitly states it does NOT require airlines to permit screen scraping

**Code-share disclosure:**
- Must disclose when a flight is operated by a carrier different from the marketing carrier

### Compliance Checklist for Miles Optimizer

| Requirement | Applies If Booking Enabled | Applies If Search Only |
|-------------|---------------------------|----------------------|
| Full fare advertising | Yes | Maybe (if showing fares) |
| 24-hour hold/cancellation | Yes | No |
| Automatic refunds | Yes | No |
| Ancillary fee transparency | Yes | Maybe |
| Display neutrality | Yes | Yes |
| Code-share disclosure | Yes | Yes |

### Recommendation

**For MVP with Duffel booking:** Build DOT compliance into your UI from Day 1. It is much easier to design for compliance than to retrofit. Specifically:
- Always display total fares including taxes (Duffel provides this data)
- Implement 24-hour cancellation support in your booking flow
- Disclose code-share information when present
- Don't artificially bias search results by carrier

**Important:** Duffel handles much of this compliance on their end (ticketing, refunds, BSP settlement), but front-end disclosure requirements are YOUR responsibility.

---

## R4: State Seller of Travel Registration

### Risk Level: MEDIUM (if booking enabled)

### The "Big Four" States

Four states require Seller of Travel (SOT) registration. These laws are extraterritorial — they apply if you sell to residents of these states regardless of where your company is based.

**California:**
- Must register with the Attorney General's Office
- Must join the Travel Consumer Restitution Corporation (TCRC)
- Must set up a trust account for client funds
- Registration fee: $100/year per location
- CST number must appear on all advertising
- Most complex and strict of all states

**Florida:**
- Register with Florida Dept. of Agriculture and Consumer Services
- Registration fee: $300/year + $50 filing fee
- Surety bond: $25,000 (new registrants), reducible after 5 years
- ARC-contracted agencies with 3+ years can request exemption
- $5,000 fine per violation for operating unregistered

**Hawaii:**
- Register with Dept. of Commerce and Consumer Affairs
- Registration fee: $146-$215 (varies by year)
- Must establish client trust account at Hawaii-based bank
- Biennial registration

**Washington:**
- Register with Dept. of Licensing
- Must file a registration with business details
- Financial security requirements vary

**Iowa:**
- Also has SOT laws but more lenient for out-of-state sellers

### Does This Apply to Miles Optimizer?

**If you enable booking through Duffel:** Almost certainly yes. You are selling air transportation and will have customers in all 50 states. Registration in CA, FL, HI, WA is required before you accept bookings from residents of those states.

**If you are search/comparison only:** Probably not. SOT laws generally target entities that sell or arrange travel, not those that provide information.

**Possible exemption:** If Duffel (as the accredited agent) is the merchant of record and handles all payment processing, you may be operating as a referral service rather than a seller of travel. This is a gray area that requires attorney review.

### Cost Estimate for Registration

| State | Annual Fees | Bond/Trust | One-Time Setup |
|-------|------------|------------|---------------|
| California | ~$100 + TCRC | Trust account | ~$500 |
| Florida | $350 | $25,000 bond (~$250/yr premium) | ~$300 |
| Hawaii | ~$215 | Trust account | ~$200 |
| Washington | ~$100 | Varies | ~$200 |
| **Total Year 1** | **~$765** | **~$250-500/yr bond + trust accounts** | **~$1,200** |

### Recommendation

**For MVP (Phase 1-2):** If you're only showing flight search results and linking users to book elsewhere (airlines, Duffel-hosted checkout), you likely don't need SOT registration yet.

**Before enabling in-app booking:** Register in CA, FL, HI, WA. Budget $2-3k for Year 1 (fees, bonds, attorney review). Do this during Phase 2 (Weeks 9-10) before public launch.

**Clarify with attorney:** Whether Duffel's merchant-of-record status exempts you. This single question could save or require $2k+/year in compliance costs.

---

## R5: Trademark — "Miles Optimizer"

### Risk Level: LOW (pending search)

### Action Required

A USPTO TESS search needs to be run for "Miles Optimizer" in:
- Class 9 (Software, mobile applications)
- Class 39 (Travel arrangement services)
- Class 35 (Advertising, business management — for the comparison/recommendation features)

### Preliminary Assessment

"Miles Optimizer" is a descriptive mark (it describes what the product does — optimizing miles). Descriptive marks are harder to register and protect. However, if it acquires "secondary meaning" (consumers associate it specifically with your product), it becomes protectable.

### Recommendation

1. Run the USPTO TESS search immediately (free, takes 10 minutes)
2. If clear, file an Intent-to-Use (ITU) trademark application ($250 per class)
3. File in Classes 9 and 39 at minimum ($500 total filing fees)
4. Consider whether a more distinctive brand name would be strategically better long-term
5. Budget $1,500-3,000 if using a trademark attorney to file (recommended for proper classification)

---

## Overall Risk Matrix

| Research Item | Risk Level | Blocker? | Action Required | Budget |
|---------------|-----------|----------|----------------|--------|
| R1: Scraping legality | HIGH | Yes (for award scraping) | Don't scrape airlines; license data instead | $2-5k attorney |
| R2: IATA/ARC accreditation | LOW | No (Duffel handles it) | Sign up for Duffel Managed Content | $0 upfront |
| R3: DOT requirements | MEDIUM | No (build into UI) | Comply with disclosure requirements | $0 (design effort) |
| R4: State SOT registration | MEDIUM | Only if booking | Register in 4 states before enabling bookings | $2-3k Year 1 |
| R5: Trademark | LOW | No | Run search, file ITU application | $500-3,000 |

**Total estimated legal budget for Phase 0-1: $5,000-11,000**

This is a critical investment. Skipping it creates existential risk — a cease and desist from an airline or a $5,000/violation fine from Florida could end the business before it starts.

---

## Next Steps

1. **This week:** Retain a tech/travel attorney. Look for someone who has worked with travel startups or OTAs. Budget $2-5k for initial engagement covering scraping review, SOT guidance, and ToS/Privacy Policy review.

2. **This week:** Run USPTO TESS search for "Miles Optimizer."

3. **This week:** Sign up for Duffel sandbox account and review their Managed Content terms.

4. **Week 2:** Based on attorney guidance, begin SOT registration in CA, FL, HI, WA if booking will be enabled.

5. **Week 3-4:** Begin outreach to Seats.aero and AwardWallet about data licensing partnerships.

6. **Ongoing:** Monitor Air Canada v. Seats.aero case for developments that affect the scraping landscape.

---

*This report is based on publicly available legal analysis and case law. It is not legal advice. Retain qualified counsel before making final decisions on any of these items.*
