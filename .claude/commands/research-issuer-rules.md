# Credit Card Issuer Rules Research

You are a research agent responsible for building a comprehensive database of credit card issuer application and bonus rules for the Wayloft recommendation engine.

## Context

Wayloft's card recommendation engine needs to know issuer-specific rules that affect whether a user can successfully apply for and earn a signup bonus on a recommended card. These rules are critical — recommending a card the user can't get approved for (or can't earn the bonus on) destroys trust.

The card catalog is in `data/credit-cards.json` (52 cards across Chase, Amex, Citi, Capital One, Bilt, US Bank, Barclays, Wells Fargo, Bank of America).

## Research Tasks

### 1. Chase Rules
- **5/24 Rule** — details, which cards are subject, which are exempt, current known bypasses (in-branch offers, business cards)
- **One Sapphire Rule** — can't hold both Sapphire Preferred and Reserve simultaneously
- **48-month bonus restriction** — Sapphire bonus cooldown period
- **Velocity limits** — how many Chase cards can you apply for in what timeframe
- **Business card rules** — sole prop eligibility, separate from 5/24?

### 2. Amex Rules
- **Lifetime language / Once-per-lifetime** — exact current wording and enforcement
- **Recent changes** — has Amex modified lifetime language recently (2024-2026)?
- **Welcome offer eligibility checker** — does Amex offer a pre-check tool?
- **Card family upgrade/downgrade paths** — e.g., Gold → Platinum retention offers
- **Pop-up jail** — what triggers it, how to escape, is it still active?
- **Amex 2/90 Rule** — max 2 credit card approvals per 90 days
- **5 credit card limit** — max Amex credit cards at once

### 3. Citi Rules
- **8/65 Rule** — 1 app per 8 days, 2 per 65 days
- **48-month bonus restriction** — which cards, exact timing
- **6/6 Rule** — 6 hard inquiries in 6 months = auto-decline
- **1/24 for AA cards** — details and current enforcement

### 4. Capital One Rules
- **Velocity sensitivity** — known limits on applications
- **One card per person** rule (relaxed recently?)
- **Business card rules**

### 5. Other Issuers
- **US Bank** — relationship requirements, sensitivity to inquiries
- **Barclays** — 6/24 sensitivity, inquiry limits
- **Wells Fargo** — cell phone rule, velocity
- **Bank of America** — 2/3/4 rule, 7/12 rule, Preferred Rewards impact
- **Bilt** — specific application rules or restrictions

### 6. Cross-Issuer Considerations
- Hard pull policies (which bureau per state)
- Combined hard pull opportunities (e.g., multiple Amex cards)
- Recommended application order strategies

## Output Format

Write your findings to `Research/issuer-rules-database.md` with:
- Per-issuer sections with each rule clearly documented
- For each rule: name, description, affected cards, current enforcement status, data confidence (confirmed/likely/rumored), last verified date, source
- Cross-issuer strategy table
- Data structure recommendation: propose a JSON schema for storing these rules in `data/issuer-rules.json` that the recommendation engine can consume programmatically
- Flag any rules that are actively changing or disputed in the community
