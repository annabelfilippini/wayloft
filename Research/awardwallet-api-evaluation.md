# AwardWallet API Evaluation for Miles Optimizer

**Prepared for:** Miles Optimizer
**Date:** February 16, 2026
**Status:** Research Complete
**Classification:** INTERNAL -- Technical Evaluation
**Research Note:** This report is compiled from publicly available documentation, developer community discussions, industry analysis, and product testing knowledge through early 2025. Pricing and API terms should be confirmed directly with AwardWallet before making integration commitments, as specifics may have changed.

---

## Executive Summary

AwardWallet is the dominant loyalty balance aggregation platform, tracking 700+ loyalty programs across airlines, hotels, credit cards, and retail programs. They offer multiple API products aimed at enterprise and partner integrations. However, AwardWallet does **not** offer a public, self-serve developer API -- access requires a partnership agreement negotiated on a case-by-case basis. For Miles Optimizer, AwardWallet represents the most viable path to loyalty balance aggregation, but it introduces a business dependency and cost structure that must be carefully evaluated.

**Bottom line:** AwardWallet is the recommended approach for loyalty portfolio tracking (balances, tier status, expiration dates). It is NOT a source for award availability search data. The integration path is partnership-first, not developer-first, which means relationship-building and negotiation are prerequisites.

---

## 1. API Availability

### Does AwardWallet Offer a Public API?

**No.** AwardWallet does not offer a public, self-serve API that any developer can sign up for and start using immediately. There is no "Get API Key" button on their website. Their API access is structured as a **partner/enterprise offering** that requires:

1. A business relationship or partnership agreement
2. Negotiation of terms, rate limits, and pricing
3. Approval from AwardWallet's partnership team

### How to Get Access

AwardWallet offers several distinct API products, each with different access models:

| API Product | Description | Access Model |
|-------------|-------------|--------------|
| **Web Parsing API** | Retrieves loyalty balances, tier status, expiration dates by connecting to loyalty program websites on behalf of users | Partnership agreement required |
| **Credit Card Bonus API** | Real-time credit card signup bonus data, category earning rates, and transfer partner information | Partnership agreement required |
| **Email Parsing API** | Extracts travel reservation details from confirmation emails (flights, hotels, car rentals) | Partnership agreement required |
| **AwardWallet Connect (OAuth)** | Allows users to connect their existing AwardWallet accounts to third-party apps | Partnership + OAuth integration |

### Contact Path

- **Email:** partnerships@awardwallet.com (or via contact form on their website)
- **Website:** awardwallet.com/api or awardwallet.com/partners (information pages, not self-serve portals)
- **Timeline:** Expect 2-4 weeks for initial response and evaluation, then additional time for agreement negotiation

### Key Relationship Context

Adam Morvitz, the CEO of Point.me (a direct competitor to Miles Optimizer), co-founded AwardWallet. While this does not necessarily mean AwardWallet would refuse to work with competitors, it is a significant relationship to be aware of. AwardWallet operates as a separate business entity and has partnered with multiple travel technology companies, but the connection should be factored into strategic planning.

---

## 2. Pricing

### Known Pricing Structure

AwardWallet does not publish API pricing. Based on industry knowledge and partner discussions:

| Tier | Estimated Cost | Notes |
|------|---------------|-------|
| **Consumer product (end users)** | Free tier + $12-18/year premium | For individual users tracking their own accounts |
| **API partnership (small startup)** | $500-2,000/month estimated | Volume-dependent, negotiated |
| **API partnership (enterprise)** | $2,000-10,000+/month estimated | Higher volumes, SLA guarantees, priority support |
| **Revenue share model** | Possible | Some partnerships structured as rev-share instead of flat fee |

### Pricing Variables

- **Per-account pricing:** AwardWallet may charge per unique loyalty account connected through your integration
- **Per-refresh pricing:** Charges may apply per balance refresh/update request
- **Volume tiers:** Higher volumes typically get lower per-unit costs
- **Minimum commitments:** Partnership agreements may include minimum monthly spend

### Free Tier for API

**No free API tier exists.** AwardWallet's free consumer product (which allows tracking up to 2-3 loyalty accounts with limited refresh frequency) is separate from API access. There is no sandbox or free developer tier for the API products.

### Cost Comparison

For context, here is how AwardWallet's estimated API costs compare to other services in Miles Optimizer's stack:

| Service | Monthly Cost | What You Get |
|---------|-------------|--------------|
| AwardWallet API (est.) | $500-2,000 | Loyalty balance aggregation for all users |
| Duffel API | $3/booking (sandbox free) | Flight search and booking |
| Seats.aero API (est.) | $200-1,000 | Award availability data |
| Plaid | $0.30-0.50/link | Bank account connection |

---

## 3. Supported Loyalty Programs

### Total Coverage

AwardWallet tracks **700+ loyalty programs** across multiple categories, making it by far the most comprehensive loyalty aggregation service available. This is their core competitive moat.

### Miles Optimizer Priority Programs -- Coverage Assessment

| Program | Category | AwardWallet Support | Priority for MO |
|---------|----------|-------------------|-----------------|
| **United MileagePlus** | Airline | YES -- full support (balance, tier, expiry) | P0 |
| **American AAdvantage** | Airline | YES -- full support | P0 |
| **Delta SkyMiles** | Airline | PARTIAL -- Delta has intermittently blocked AwardWallet; connection reliability varies | P0 |
| **Southwest Rapid Rewards** | Airline | PARTIAL -- Southwest has historically been hostile to third-party access; intermittent blocks | P0 |
| **Alaska Mileage Plan** | Airline | YES -- full support | P1 |
| **JetBlue TrueBlue** | Airline | YES -- full support | P1 |
| **British Airways Avios** | Airline | YES -- full support | P1 |
| **Singapore KrisFlyer** | Airline | YES -- full support | P2 |
| **ANA Mileage Club** | Airline | YES -- full support | P2 |
| **Air Canada Aeroplan** | Airline | YES -- full support | P1 |
| **Chase Ultimate Rewards** | Credit Card | YES -- full support | P0 |
| **Amex Membership Rewards** | Credit Card | YES -- full support | P0 |
| **Citi ThankYou Points** | Credit Card | YES -- full support | P0 |
| **Capital One Miles** | Credit Card | YES -- full support | P0 |
| **Bilt Rewards** | Credit Card | YES -- added in recent years | P0 |
| **Marriott Bonvoy** | Hotel | YES -- full support | P1 |
| **Hilton Honors** | Hotel | YES -- full support | P1 |
| **IHG One Rewards** | Hotel | YES -- full support | P2 |
| **Hyatt World of Hyatt** | Hotel | YES -- full support | P1 |
| **Wyndham Rewards** | Hotel | YES -- full support | P2 |

### Coverage by Category (Approximate)

| Category | Programs Supported | Notable Inclusions |
|----------|-------------------|-------------------|
| Airlines | 200+ | All major US carriers, Star Alliance, OneWorld, SkyTeam, most LCCs |
| Hotels | 50+ | All major chains including boutique programs |
| Credit Card Points | 20+ | Chase, Amex, Citi, Capital One, Bilt, US Bank, Wells Fargo |
| Retail / Other | 400+ | Starbucks, rental cars, dining programs, store loyalty |
| International | 100+ | Programs from EU, Asia, Middle East, Latin America |

### Data Points Retrieved Per Program

For each connected loyalty account, AwardWallet typically retrieves:

- **Current balance** (miles/points)
- **Tier/elite status** (e.g., United Premier Gold, Marriott Titanium)
- **Status qualification progress** (qualifying miles/segments/nights toward next tier)
- **Expiration date** (when points/miles expire, if applicable)
- **Recent activity** (last earning/redemption transactions, varies by program)
- **Account number** (masked)
- **Account holder name**

---

## 4. Integration Complexity

### Architecture: How AwardWallet Actually Works

AwardWallet uses **screen scraping / web parsing** as its primary data retrieval method. This is critical to understand:

```
User provides credentials
        |
        v
AwardWallet's servers log into loyalty program website
        |
        v
Parse HTML/API responses to extract balance data
        |
        v
Store results, return via AwardWallet API
```

This is NOT a direct API integration with loyalty programs. Airlines and hotels do not (with very few exceptions) offer open APIs for balance data. AwardWallet reverse-engineers the login flows and data structures for 700+ programs and maintains those integrations.

### Integration Flow for Miles Optimizer

The recommended integration uses **AwardWallet Connect (OAuth-style flow)**:

```
1. User clicks "Connect Loyalty Accounts" in Miles Optimizer
        |
2. User is redirected to AwardWallet's hosted connection page
        |
3. User enters their loyalty program credentials on AwardWallet's page
   (Miles Optimizer NEVER sees or stores these credentials)
        |
4. AwardWallet stores credentials, performs initial balance fetch
        |
5. User is redirected back to Miles Optimizer with an auth token
        |
6. Miles Optimizer uses auth token to query AwardWallet API for balance data
        |
7. Ongoing: Miles Optimizer can request balance refreshes via API
```

### Technical Integration Details

- **Authentication:** OAuth 2.0 flow with AwardWallet as the identity provider for loyalty connections
- **Data format:** JSON responses via REST API
- **Endpoint structure:** Typical REST patterns -- GET /accounts, GET /accounts/{id}/balance, POST /accounts/{id}/refresh
- **SDKs:** No official SDKs published; integration is raw HTTP/REST
- **Webhooks:** AwardWallet supports webhook notifications for balance changes and connection status updates (available in some partnership tiers)

### Integration Effort Estimate

| Task | Estimated Effort |
|------|-----------------|
| Partnership negotiation and approval | 2-6 weeks |
| OAuth flow implementation | 2-3 days |
| API integration (balance retrieval, caching) | 3-5 days |
| UI for account connection management | 3-5 days |
| Error handling and retry logic | 2-3 days |
| Testing across programs | 3-5 days |
| **Total development effort** | **2-3 weeks** |

### Reliability Considerations

Because AwardWallet relies on screen scraping, reliability is inherently variable:

- **Login flow changes:** When a loyalty program updates its website or login process, AwardWallet's connection breaks until they update their parser. This can take hours to days.
- **Two-factor authentication:** Many programs now require 2FA, which complicates automated login. AwardWallet handles some 2FA flows but not all.
- **CAPTCHAs:** Programs may deploy CAPTCHAs that block automated access.
- **Rate limiting by programs:** Airlines may throttle or block AwardWallet's IP ranges.

---

## 5. Rate Limits

### Known Rate Limit Structure

Exact rate limits are negotiated per partnership, but general guidelines based on community knowledge:

| Operation | Estimated Limit | Notes |
|-----------|----------------|-------|
| Balance queries (cached data) | 100-1,000 requests/minute | Reading cached balance data is relatively unrestricted |
| Balance refreshes (live fetch) | 10-50 per hour per account | Each refresh triggers AwardWallet to log in to the loyalty program |
| Account connection | Throttled | Creating new connections is the most restricted operation |
| Bulk operations | Negotiated | Enterprise tiers may get batch endpoints |

### Important: Refresh vs. Query

There is a critical distinction:

- **Query:** Returns the last-known balance from AwardWallet's cache. Fast, cheap, high rate limit.
- **Refresh:** Triggers AwardWallet to actually log in to the loyalty program and fetch fresh data. Slow (10-60 seconds), expensive, low rate limit.

Miles Optimizer should design its architecture to minimize refreshes and maximize cached queries.

---

## 6. Data Freshness

### Update Frequency

| Update Type | Frequency | Notes |
|-------------|-----------|-------|
| **Automatic refresh (free users)** | Every 7-14 days | AwardWallet's consumer product |
| **Automatic refresh (premium users)** | Every 1-3 days | AwardWallet's paid consumer product |
| **API partner automatic refresh** | Negotiated (typically daily) | Background refresh schedule |
| **On-demand refresh (API)** | User-triggered | Returns results in 10-60 seconds |
| **Webhook notification** | Near real-time after refresh | Push notification when balance updates |

### Can You Force a Refresh?

**Yes**, but with constraints:

- API partners can trigger an on-demand refresh for any connected account
- Each refresh takes 10-60 seconds as AwardWallet logs into the loyalty program
- Refreshes are rate-limited (see Section 5)
- Some programs may fail to refresh due to 2FA, CAPTCHA, or temporary blocks
- Failed refreshes return the last known balance with a "stale" indicator

### Recommended Architecture for Miles Optimizer

```
User opens dashboard
        |
        v
Show cached balances (instant, from Miles Optimizer's DB)
        |
        v
Check staleness (> 24 hours old?)
        |
   Yes --> Trigger background refresh via AwardWallet API
   No  --> Show cached data, offer manual refresh button
        |
        v
When refresh completes (webhook or polling), update UI
```

This gives users instant page loads while keeping data reasonably fresh.

---

## 7. Developer/Partner Program

### Formal Program Structure

AwardWallet has a **partner program** but it is not a traditional developer program with self-serve onboarding:

| Aspect | Details |
|--------|---------|
| **Application process** | Email/contact form, then evaluation by partnerships team |
| **Requirements** | Established business, clear use case, sufficient user base (or credible plan) |
| **Sandbox/test environment** | Limited -- may provide test accounts for evaluation, but no public sandbox |
| **Documentation** | Provided after partnership agreement is signed; not publicly available |
| **Support** | Dedicated partner support contact; response times vary by tier |
| **SLA** | Negotiated per agreement; no published standard SLA |

### What AwardWallet Looks for in Partners

Based on their existing partnerships, AwardWallet favors:

1. **Complementary products** -- Tools that enhance the loyalty ecosystem rather than directly competing with AwardWallet's consumer product
2. **User volume** -- Partners who will drive significant account connection volume
3. **Revenue potential** -- Either through direct API fees or revenue sharing
4. **Brand alignment** -- Professional, consumer-friendly products in the travel/finance space

### Existing Known Partners

AwardWallet has integrated with or provided data to:

- Point.me (co-founder connection)
- Various travel blogs and content sites
- Credit card comparison tools
- Financial planning applications
- Corporate travel management platforms

### Risk: Miles Optimizer as a Competitor

Miles Optimizer's portfolio tracking feature directly overlaps with AwardWallet's core consumer product. This could complicate the partnership pitch. **Mitigation:** Position Miles Optimizer as a distribution channel that drives users TO AwardWallet (via Connect OAuth), not a replacement. Emphasize that Miles Optimizer's value is in optimization intelligence, not in balance tracking itself.

---

## 8. Privacy and Terms of Service Considerations

### User Credential Handling

This is the most sensitive aspect of loyalty balance aggregation:

| Concern | How AwardWallet Handles It |
|---------|---------------------------|
| **Credential storage** | AwardWallet stores encrypted credentials on their servers; they need ongoing access to log in to loyalty programs |
| **Miles Optimizer's exposure** | With OAuth/Connect flow, Miles Optimizer NEVER sees or stores user credentials -- AwardWallet handles this entirely |
| **Encryption** | AwardWallet claims AES-256 encryption for stored credentials |
| **SOC 2 compliance** | AwardWallet has pursued SOC 2 certification (verify current status) |
| **Data breach risk** | AwardWallet is a high-value target; a breach would expose credentials for hundreds of thousands of loyalty accounts |

### Airline Terms of Service Issues

Many airlines explicitly prohibit sharing account credentials with third parties in their terms of service. This creates a legal gray area:

| Airline | Stance on Third-Party Access | Notes |
|---------|------------------------------|-------|
| **Delta SkyMiles** | Actively hostile | Has blocked AwardWallet access multiple times; ToS explicitly prohibits credential sharing |
| **Southwest Rapid Rewards** | Actively hostile | Has blocked AwardWallet; extremely litigious about third-party access (see Kiwi.com lawsuit) |
| **United MileagePlus** | Tolerant but reserved | Has not actively blocked AwardWallet; ToS technically prohibits it |
| **American AAdvantage** | Generally tolerant | Has worked with AwardWallet relatively smoothly |
| **Alaska Mileage Plan** | Tolerant | No known blocking attempts |
| **Chase/Amex/Citi/Capital One** | Generally tolerant | Credit card programs less aggressive than airlines |
| **Marriott Bonvoy** | Generally tolerant | Hotel programs rarely block third-party access |

### Programs Known to Have Blocked or Restricted AwardWallet

1. **Delta SkyMiles** -- Intermittent blocking, sometimes requiring users to re-authenticate more frequently or connection failing entirely for extended periods
2. **Southwest Rapid Rewards** -- Has blocked automated access; connections frequently broken
3. **Some international carriers** -- Varying levels of blocking depending on region
4. **Programs implementing strict 2FA** -- Any program requiring SMS or authenticator-based 2FA can break automated connections

### Privacy Implications for Miles Optimizer

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users uncomfortable sharing loyalty credentials with AwardWallet | MEDIUM | Clear disclosure that credentials go to AwardWallet (established company), not to Miles Optimizer. Provide a "manual entry" alternative. |
| AwardWallet data breach exposes user credentials | LOW-MEDIUM | Miles Optimizer is not liable for AwardWallet's security, but reputational damage is real. Carry cyber insurance. |
| Airlines block AwardWallet, breaking user experience | MEDIUM | Design graceful degradation. If a connection fails, show last known balance with clear "connection issue" messaging. Provide manual refresh option. |
| Regulatory scrutiny (CFPB, state regulators) of credential-sharing model | LOW but increasing | The entire aggregation industry (including Plaid for banking) is under regulatory scrutiny. Monitor regulatory developments. |

### Recommended Privacy Architecture

```
Miles Optimizer Privacy Approach:
1. NEVER store user loyalty credentials (use AwardWallet OAuth exclusively)
2. Cache balance data in Miles Optimizer's DB (reduce API calls, improve UX)
3. Clear disclosure: "We partner with AwardWallet to securely connect your accounts"
4. Provide manual balance entry as an alternative for privacy-conscious users
5. Allow users to disconnect accounts at any time (trigger AwardWallet credential deletion)
6. Privacy policy explicitly covers third-party data aggregation
```

---

## 9. Reliability

### Known Reliability Issues

| Issue | Frequency | Impact | Programs Affected |
|-------|-----------|--------|-------------------|
| Connection breaks after loyalty program website update | Weekly (across 700+ programs) | Individual program unavailable for hours-days | Rotates; any program can be affected |
| Delta SkyMiles connection failures | Chronic | Cannot retrieve Delta balances for extended periods | Delta specifically |
| Southwest connection failures | Chronic | Cannot retrieve Southwest balances | Southwest specifically |
| 2FA challenges requiring user intervention | Increasing | User must manually re-authenticate; automated refresh fails | Programs with mandatory 2FA |
| Slow refresh times | Constant | 10-60 second waits for fresh data | All programs (by design) |
| Incorrect balance data | Rare | Balance shown does not match actual account | Any program (parsing errors) |
| Complete AwardWallet outage | Very rare | All balance data unavailable | All programs |

### Reliability by Program Category

| Category | Reliability | Notes |
|----------|------------|-------|
| Credit card points (Chase, Amex, Citi) | HIGH (90%+ uptime) | Banks have more stable websites and are less hostile to aggregators |
| Major hotel programs | HIGH (90%+ uptime) | Hotel chains rarely block third-party access |
| Most airline programs | MEDIUM-HIGH (80-90% uptime) | Generally works but occasional breaks after website updates |
| Delta SkyMiles | LOW (60-70% estimated) | Actively hostile to third-party access |
| Southwest Rapid Rewards | LOW (50-60% estimated) | Most hostile major US airline |
| International programs | VARIABLE | Depends heavily on the specific program |

### Impact on Miles Optimizer UX

Given these reliability characteristics, Miles Optimizer MUST design for graceful degradation:

1. **Always show last known balance** even if current refresh fails
2. **Timestamp all balances** ("Updated 3 hours ago" vs "Updated 6 days ago")
3. **Connection health indicators** (green/yellow/red per connected account)
4. **Manual entry fallback** for programs with chronic connection issues
5. **Proactive notification** when a connection breaks ("Your Delta connection needs attention")

---

## 10. Alternatives to AwardWallet

### Alternative 1: AwardFares

**What it is:** AwardFares (awardfares.com) is primarily an award flight search tool, not a balance aggregation service. It does NOT offer a public API for balance tracking.

- **API availability:** No public API for balance data; their product is award seat search
- **Relevance to Miles Optimizer:** Could be a supplementary data source for award availability (complementing or replacing Seats.aero), but does NOT solve the balance aggregation problem
- **Conclusion:** Not an AwardWallet alternative for portfolio tracking

### Alternative 2: Manual Scraping (Build Our Own)

**Feasibility:** Technically possible but operationally crushing.

| Factor | Assessment |
|--------|-----------|
| **Development effort** | 6-12 months to reach AwardWallet's coverage for even 20 major programs |
| **Maintenance burden** | Each of 20+ programs requires ongoing parser maintenance as websites change; estimate 0.5-1 FTE dedicated to scraper maintenance |
| **Legal risk** | HIGH -- same ToS violations that AwardWallet faces, but without their established legal position and resources |
| **Credential storage** | Must build SOC 2-compliant credential storage infrastructure; security liability |
| **2FA handling** | Must solve 2FA for each program individually; some (like Delta) are extremely difficult |
| **Anti-bot evasion** | Must maintain residential proxy infrastructure ($500-2,000/month); handle CAPTCHAs |
| **Reliability** | Will be significantly LOWER than AwardWallet's -- they have years of institutional knowledge about each program's quirks |

**Verdict:** Building your own balance aggregation is not viable for a startup. AwardWallet has 15+ years of scraping infrastructure, institutional knowledge, and legal precedent. Replicating this is a company-sized effort, not a feature.

### Alternative 3: Plaid for Loyalty Programs

**What it is:** Plaid is the dominant financial data aggregation platform (bank accounts, credit cards, investments). They do NOT currently aggregate loyalty program balances.

- Plaid's model (screen scraping bank sites, now transitioning to open banking APIs) is analogous to what AwardWallet does for loyalty programs
- As of early 2025, Plaid does not support loyalty program connections
- There have been industry rumors about Plaid expanding into loyalty data, but nothing concrete
- **Conclusion:** Not available today. Worth monitoring for future developments.

### Alternative 4: MX Technologies (Formerly MoneyDesktop)

**What it is:** Financial data aggregation competitor to Plaid. Similar to Plaid, focused on banking/financial data, NOT loyalty programs.

- **Conclusion:** Not an alternative for loyalty balance aggregation.

### Alternative 5: Direct Airline/Hotel APIs

Some loyalty programs offer limited API access:

| Program | API Availability | Notes |
|---------|-----------------|-------|
| United MileagePlus | No public API | Internal APIs exist but are not accessible |
| American AAdvantage | No public API | Same as United |
| Delta SkyMiles | No public API | Most locked-down major US program |
| Marriott Bonvoy | Limited developer program | May offer balance data through partnership; primarily for property management |
| Hilton Honors | No public API for consumer balance data | Partnership-only |

**Verdict:** No major loyalty program offers a public API for consumer balance data. This is exactly why AwardWallet exists.

### Alternative 6: User Self-Reporting (Manual Entry)

The simplest alternative: ask users to manually enter their loyalty balances.

| Pros | Cons |
|------|------|
| Zero legal risk | Terrible UX -- users won't maintain it |
| Zero dependency on third parties | Data is always stale (until user updates) |
| Zero cost | High churn risk -- users abandon products that feel like work |
| Works for every program | No automation possible |
| Privacy-friendly | Cannot provide expiration alerts or proactive notifications |

**Verdict:** Should be offered as a SUPPLEMENT (for users who don't want to connect accounts), but cannot be the primary balance tracking method for a competitive product.

### Alternative 7: Email Parsing (Without AwardWallet)

Parse loyalty program marketing emails and transaction confirmations to extract balance data.

| Approach | Feasibility | Notes |
|----------|------------|-------|
| Gmail API integration | MEDIUM | User grants read access to email; Miles Optimizer parses loyalty emails |
| Outlook/Microsoft Graph API | MEDIUM | Same approach for Microsoft email users |
| Custom email address forwarding | LOW adoption | Ask users to forward loyalty emails to a Miles Optimizer address |

**Pros:** Can extract balance data, transaction history, and earn/burn activity from email confirmations without screen scraping loyalty websites.

**Cons:** Not real-time (only as fresh as latest email); requires email access permissions (privacy concern); complex NLP/parsing for hundreds of email templates; misses balances that don't generate emails.

**Note:** AwardWallet's Email Parsing API does exactly this, but as a managed service. Building this in-house is possible but significant effort.

---

## 11. Actionable Takeaways for Miles Optimizer

### Primary Recommendation: Use AwardWallet, With Eyes Open

**YES, Miles Optimizer should pursue an AwardWallet partnership.** Here is why:

1. **No viable alternative exists** for automated loyalty balance aggregation at scale
2. **Build vs. buy is clear** -- building your own scraping infrastructure for 20+ programs is a 6-12 month diversion that would produce an inferior product
3. **The OAuth model protects Miles Optimizer** from credential storage liability
4. **Coverage is unmatched** -- 700+ programs including all Miles Optimizer priority programs
5. **Point.me uses it** (through co-founder relationship), validating that it works at scale for a consumer travel product

### Key Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **AwardWallet refuses partnership** (competitive concerns due to Point.me connection) | HIGH | Prepare alternative pitch emphasizing distribution value; have manual entry + email parsing fallbacks ready |
| **API costs exceed budget** | MEDIUM | Negotiate volume discounts; implement aggressive caching to minimize API calls; start with limited program support and expand |
| **Delta/Southwest connections unreliable** | HIGH (for those specific programs) | Design graceful degradation; offer manual entry for chronically broken programs; communicate transparently to users |
| **AwardWallet outage affects all users** | MEDIUM | Cache all balance data locally; design app to function (degraded) without live AwardWallet connection |
| **AwardWallet raises prices or changes terms** | MEDIUM | Avoid over-dependence; build email parsing as a secondary data source; maintain manual entry option |
| **Regulatory changes to credential-sharing model** | LOW but long-term | Monitor CFPB developments; structure partnership agreement to allow transition if needed |

### Recommended Integration Strategy

#### Phase 1: Month 4 (Per Master Plan)

1. **Initiate partnership conversation** with AwardWallet (email partnerships@awardwallet.com)
2. **Negotiate terms** -- target $500-1,000/month for initial tier
3. **Implement AwardWallet Connect OAuth** for account linking
4. **Support top 10 programs first:** Chase UR, Amex MR, Citi TY, Capital One, United, American, Delta, Southwest, Marriott, Hilton
5. **Build local caching layer** -- store balance snapshots in Supabase
6. **Implement manual entry** as fallback for any program

#### Phase 2: Month 5-6

7. **Add webhook integration** for real-time balance update notifications
8. **Implement email parsing** (via AwardWallet's Email Parsing API or build own) as supplementary data source
9. **Expand to 20+ programs** based on user demand
10. **Build expiration tracking and alerts** using AwardWallet data

#### Phase 3: Month 7+

11. **Evaluate Credit Card Bonus API** for enriching card recommendation engine
12. **Consider building lightweight own parsing** for the 2-3 most critical programs as redundancy
13. **Monitor Plaid/other entrants** in loyalty aggregation space

### Alternative Path: If AwardWallet Partnership Fails

If AwardWallet declines the partnership or pricing is prohibitive:

1. **Manual entry + email parsing** as primary balance tracking (degraded but functional)
2. **Build own scraping** for top 5 credit card programs only (Chase, Amex, Citi, Capital One, Bilt) -- these are the most stable and least legally risky
3. **Partner with another aggregator** if one emerges
4. **Pivot product positioning** -- de-emphasize portfolio tracking, emphasize optimization intelligence (card recommendations, transfer bonus monitoring, cents-per-point calculations)

### Database Schema Addition for AwardWallet Integration

When the time comes (Month 4), add this to the Miles Optimizer schema:

```sql
-- Loyalty Accounts (connected via AwardWallet)
CREATE TABLE public.loyalty_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  awardwallet_account_id TEXT, -- AwardWallet's internal ID
  program_name TEXT NOT NULL,  -- e.g., "United MileagePlus"
  program_code TEXT NOT NULL,  -- e.g., "UA"
  program_type TEXT NOT NULL,  -- airline, hotel, credit_card, other
  current_balance INTEGER,
  tier_status TEXT,            -- e.g., "Premier Gold"
  expiration_date DATE,
  last_refreshed TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'active', -- active, broken, pending
  is_manual_entry BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Balance History (for trend tracking)
CREATE TABLE public.balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_account_id UUID REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_loyalty_accounts_user ON public.loyalty_accounts(user_id);
CREATE INDEX idx_loyalty_accounts_program ON public.loyalty_accounts(program_code);
CREATE INDEX idx_balance_history_account ON public.balance_history(loyalty_account_id, recorded_at);

-- RLS
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own loyalty accounts" ON public.loyalty_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own balance history" ON public.balance_history FOR ALL USING (
  loyalty_account_id IN (SELECT id FROM public.loyalty_accounts WHERE user_id = auth.uid())
);
```

### Budget Planning

| Item | Month 4 | Month 6 | Month 9 |
|------|---------|---------|---------|
| AwardWallet API (est.) | $500 | $1,000 | $2,000 |
| User accounts connected (est.) | 500 | 2,000 | 10,000 |
| Cost per connected account (est.) | $1.00 | $0.50 | $0.20 |

The unit economics improve with scale. At 10,000+ connected accounts, AwardWallet API cost becomes a small percentage of potential subscription revenue ($10-25/user/month).

---

## Summary Comparison Table

| Approach | Coverage | Reliability | Legal Risk | Cost | Dev Effort | Recommended? |
|----------|----------|-------------|------------|------|-----------|--------------|
| **AwardWallet API** | 700+ programs | Medium-High | Low (for us) | $500-2,000/mo | 2-3 weeks | YES (primary) |
| Build own scraping | 5-20 programs | Low-Medium | High | $1,000-3,000/mo infra | 6-12 months | NO |
| Manual user entry | Unlimited | N/A | None | $0 | 1 week | YES (fallback) |
| Email parsing (own) | 50+ programs | Medium | Low | $200-500/mo | 4-6 weeks | MAYBE (Phase 2) |
| Plaid | 0 (no loyalty) | N/A | N/A | N/A | N/A | NO (not available) |
| Direct airline APIs | 0 (none exist) | N/A | N/A | N/A | N/A | NO (not available) |

---

## Open Questions for AwardWallet Partnership Discussion

When initiating the partnership conversation, seek clarity on:

1. What are the specific API pricing tiers and volume discounts?
2. Is there a trial or evaluation period before committing to a contract?
3. What are the actual SLAs for data freshness and uptime?
4. How do they handle the Point.me competitive dynamic -- are there exclusivity clauses?
5. What programs are currently broken/unreliable in their system?
6. Do they support webhooks for all partnership tiers?
7. What is their roadmap for handling increasing 2FA requirements across programs?
8. Can they provide a test environment for integration development?
9. What are the data retention/deletion obligations when a user disconnects?
10. Is there a revenue-share model option as an alternative to flat monthly fees?

---

*This evaluation should be revisited when the AwardWallet partnership conversation begins (targeted Month 4 per Master Plan). Pricing, availability, and technical details should be confirmed directly with AwardWallet at that time.*
