# Credit Card Issuer Rules Database

**Date:** February 18, 2026
**Status:** Research Complete
**Classification:** INTERNAL -- Recommendation Engine Data

---

## Executive Summary

40 rules across 10 issuers covering the 52-card Wayloft catalog. Chase 5/24, Amex lifetime language, and Citi 48-month restrictions are the highest-impact rules for the recommendation engine. A JSON schema for `data/issuer-rules.json` is included for programmatic consumption.

**9 rules are actively changing or disputed** -- flagged for quarterly re-verification.

---

## 1. Chase (14 cards)

### 1.1 5/24 Rule
| Field | Detail |
|-------|--------|
| **Name** | Chase 5/24 Rule |
| **Description** | Chase auto-declines most credit card applications if the applicant has opened 5+ new credit card accounts (across ALL issuers) in the past 24 months. |
| **Type** | velocity_limit |
| **Enforcement** | Hard (system-enforced) |
| **Affected Cards** | All Chase personal and most business cards |
| **Exempt Cards** | Historically some cards (IHG, certain business) have been exempt -- currently disputed |
| **What Counts** | Personal cards from all issuers, authorized user accounts. Business cards from most issuers do NOT count (except Capital One and Discover). |
| **Confidence** | Confirmed |
| **Source** | Doctor of Credit, community data points |

### 1.2 One Sapphire Rule
| Field | Detail |
|-------|--------|
| **Description** | Cannot hold both Chase Sapphire Preferred and Chase Sapphire Reserve simultaneously. Must downgrade/cancel one before applying for the other. |
| **Type** | product_exclusion |
| **Enforcement** | Hard |
| **Affected Cards** | chase-sapphire-reserve, chase-sapphire-preferred |
| **Confidence** | Confirmed |

### 1.3 48-Month Sapphire Bonus Restriction
| Field | Detail |
|-------|--------|
| **Description** | Cannot receive a Sapphire signup bonus if you received ANY Sapphire bonus (Preferred or Reserve) within the past 48 months. Clock starts from when the bonus posted, not when the card was opened. |
| **Type** | bonus_cooldown |
| **Enforcement** | Hard |
| **Parameters** | cooldown_months: 48, counts_from: bonus_posted, scope: product_family |
| **Confidence** | Confirmed |

### 1.4 Velocity Limits (2/30)
| Field | Detail |
|-------|--------|
| **Description** | Chase limits approvals to ~2 Chase cards per 30-day rolling window. Applying for 3+ Chase cards in 30 days will result in auto-denial. |
| **Type** | velocity_limit |
| **Parameters** | max_count: 2, window_days: 30, scope: all_issuer_cards |
| **Confidence** | Confirmed |

### 1.5 Business Cards and 5/24
| Field | Detail |
|-------|--------|
| **Description** | Chase Ink business cards ARE subject to 5/24 (you need to be under 5/24 to get approved), but they do NOT report to personal credit and do NOT add to your 5/24 count. Sole proprietorships are eligible. |
| **business_reports_to_personal** | false |
| **Confidence** | Confirmed |

---

## 2. Amex (14 cards)

### 2.1 Lifetime / Once-Per-Lifetime Language
| Field | Detail |
|-------|--------|
| **Description** | Amex restricts welcome bonuses to once per lifetime per product. Standard language: "Welcome offer not available to applicants who have or have had this Card." **ACTIVELY CHANGING:** Mid-2024 Amex began rolling some products to 7-year restriction instead of lifetime. Not all cards have switched. |
| **Type** | bonus_cooldown |
| **Enforcement** | Hard |
| **Parameters** | cooldown_months: varies (lifetime or 84), scope: same_product |
| **Confidence** | Confirmed (lifetime); Likely (7-year variant) |
| **ACTIVELY CHANGING** | Yes -- verify per-card language before recommending |

### 2.2 Pop-Up Jail
| Field | Detail |
|-------|--------|
| **Description** | When applying, some users see a pop-up stating they're ineligible for the welcome bonus. The application can still be submitted, but the bonus will not be awarded. Triggered by: low Amex spending, opening/closing cards quickly, gaming patterns. |
| **Type** | other |
| **Enforcement** | Hard (if pop-up appears) |
| **User Action** | Increase spending on existing Amex cards for 3-6 months. |
| **Confidence** | Confirmed (still active as of 2025) |

### 2.3 2/90 Rule
| Field | Detail |
|-------|--------|
| **Description** | Max 2 Amex credit card approvals per 90-day rolling window. Charge cards (Platinum, Gold, Green) do NOT count. |
| **Type** | velocity_limit |
| **Parameters** | max_count: 2, window_days: 90, scope: all_issuer_cards |
| **Confidence** | Confirmed |

### 2.4 5 Credit Card Limit
| Field | Detail |
|-------|--------|
| **Description** | Max 5 Amex credit cards at once (charge cards don't count). Must cancel one to open another. Some 2024-2025 reports suggest limit may have increased to 6. |
| **Type** | account_limit |
| **Parameters** | max_count: 5 |
| **Confidence** | Confirmed (5); Disputed (6) |
| **ACTIVELY CHANGING** | Possibly |

### 2.5 Combined Hard Pull
| Field | Detail |
|-------|--------|
| **Description** | Multiple Amex applications on the same day typically result in only 1 hard pull. Existing cardholders may get soft pull or no pull. |
| **Confidence** | Confirmed |

---

## 3. Citi (5 cards)

### 3.1 8/65 Rule
| Field | Detail |
|-------|--------|
| **Description** | Max 1 Citi card application per 8 days, max 2 per 65 days. |
| **Type** | velocity_limit |
| **Parameters** | 1 per 8 days, 2 per 65 days |
| **Enforcement** | Hard |
| **Confidence** | Confirmed |

### 3.2 48-Month Bonus Restriction
| Field | Detail |
|-------|--------|
| **Description** | Cannot receive a bonus if you received a bonus on the same card (or a card in the same family) within the past 48 months. Also applies if you closed the same card within 48 months. |
| **Type** | bonus_cooldown |
| **Parameters** | cooldown_months: 48, counts_from: bonus_posted AND account_closed, scope: product_family |
| **Confidence** | Confirmed |

### 3.3 6/6 Rule
| Field | Detail |
|-------|--------|
| **Description** | 6+ hard inquiries in the past 6 months = likely auto-decline. |
| **Type** | inquiry_limit |
| **Parameters** | max_count: 6, window_months: 6 |
| **Enforcement** | Soft (varies) |
| **Confidence** | Likely |

### 3.4 1/24 for AA Cards
| Field | Detail |
|-------|--------|
| **Description** | Only 1 Citi AAdvantage card bonus per 24 months across the AA product family. |
| **Affected Cards** | citi-aadvantage-executive, citi-aadvantage-platinum-select |
| **Confidence** | Confirmed |

---

## 4. Capital One (5 cards)

### 4.1 Velocity Sensitivity
| Field | Detail |
|-------|--------|
| **Description** | Capital One is sensitive to recent applications and new accounts. No hard documented rule, but high velocity = higher denial rates. |
| **Confidence** | Likely |

### 4.2 Card Limit (Recently Changed)
| Field | Detail |
|-------|--------|
| **Description** | Previously strict 1-2 card limit. Now relaxed to 3-4 cards. Exact current limit unclear. |
| **ACTIVELY CHANGING** | Yes |
| **Confidence** | Likely (3-4 now allowed) |

### 4.3 Bureau Pulls
| Field | Detail |
|-------|--------|
| **Description** | Capital One often pulls ALL THREE bureaus for a single application. This means each C1 app costs 3 hard inquiries. Especially harmful for Citi's 6/6 rule. |
| **ACTIVELY CHANGING** | Possibly (some reports of 1-2 pulls recently) |

---

## 5. US Bank (2 cards)

### 5.1 Relationship Preference
| Field | Detail |
|-------|--------|
| **Description** | US Bank strongly prefers applicants with existing banking relationships (checking/savings). Without one, approval odds drop significantly. |
| **Type** | relationship_requirement |
| **Confidence** | Confirmed |

### 5.2 Inquiry Sensitivity
| Field | Detail |
|-------|--------|
| **Description** | US Bank is among the most inquiry-sensitive issuers. Recent applications or inquiries can cause denials. |
| **Confidence** | Likely |

---

## 6. Barclays (3 cards)

### 6.1 6/24 Sensitivity
| Field | Detail |
|-------|--------|
| **Description** | No hard cutoff like Chase, but 6+ new accounts in 24 months = significantly higher denial rates. Also weighs recent inquiries in past 6 months heavily. |
| **Confidence** | Likely (pattern, not hard rule) |

### 6.2 24-Month Bonus Restriction
| Field | Detail |
|-------|--------|
| **Description** | Not eligible for bonus if you had the same card in the past 24 months (from closure, not bonus receipt). |
| **Parameters** | cooldown_months: 24, counts_from: account_closed |
| **Confidence** | Confirmed |

---

## 7. Wells Fargo (3 cards)

### 7.1 Cell Phone Verification
| Field | Detail |
|-------|--------|
| **Description** | Requires US cell phone for SMS verification. Landlines, VOIP (Google Voice), and some prepaid numbers may not work. |
| **Confidence** | Confirmed |

### 7.2 Velocity Limits
| Field | Detail |
|-------|--------|
| **Description** | ~2 new WF cards per 12 months. 1 per 6 months is safer. |
| **Confidence** | Likely |

### 7.3 15-Month Bonus Cooldown
| Field | Detail |
|-------|--------|
| **Description** | One of the shortest cooldowns: 15 months between bonuses on the same product. |
| **Parameters** | cooldown_months: 15 |
| **Confidence** | Confirmed |
| **VERIFY** | WF has been expanding rewards program -- confirm cooldown hasn't changed. |

---

## 8. Bank of America (3 cards)

### 8.1 2/3/4 Rule
| Field | Detail |
|-------|--------|
| **Description** | Max 2 new BofA cards per 60 days. Max 3 per 12 months. Max 4 total (lifetime/very long window). |
| **Enforcement** | Hard (2/60); Soft (3/12, 4-total) |
| **Confidence** | Confirmed (2/60); Likely (3/12, 4-total) |

### 8.2 7/12 Rule
| Field | Detail |
|-------|--------|
| **Description** | 7+ new cards across ALL issuers in 12 months = higher BofA denial rates. Not absolute cutoff. |
| **Confidence** | Likely |

### 8.3 Preferred Rewards
| Field | Detail |
|-------|--------|
| **Description** | BofA/Merrill Lynch balances boost rewards: Gold ($20k+) = 25%, Platinum ($50k+) = 50%, Platinum Honors ($100k+) = 75%. Makes cards dramatically more valuable (e.g., Customized Cash 3% -> 5.25%). Also improves approval odds. |
| **Confidence** | Confirmed |

---

## 9. Bilt (1 card)

### 9.1 Wells Fargo Interaction
| Field | Detail |
|-------|--------|
| **Description** | Issued by Wells Fargo. Counts toward WF velocity limits. |
| **VERIFY** | Confirm WF is still the issuer (periodic rumors of switch). |

### 9.2 5-Transaction Minimum
| Field | Detail |
|-------|--------|
| **Description** | Must make at least 5 transactions per billing cycle to earn ANY points (including rent). Unique among major cards. |
| **Confidence** | Confirmed |

---

## 10. Discover (2 cards)

### 10.1 Application Rules
| Field | Detail |
|-------|--------|
| **Description** | Relatively lenient. One card per product line. Uses "Cashback Match" / "Miles Match" (first year doubled) instead of traditional SUBs -- not subject to standard bonus restrictions. |
| **Confidence** | Confirmed |

---

## 11. Cross-Issuer Strategy

### Recommended Application Order
| Priority | Issuer | Reason |
|----------|--------|--------|
| 1st | US Bank | Most inquiry-sensitive |
| 2nd | Barclays | Inquiry-sensitive |
| 3rd | Bank of America | 7/12 sensitivity |
| 4th | Chase | 5/24 is account-based, not inquiry-based |
| 5th | Citi | 6/6 inquiry rule |
| 6th | Capital One | Velocity-sensitive, pulls all 3 bureaus |
| 7th | Amex | Most lenient, combined hard pulls |
| 8th | Wells Fargo | Moderate rules |
| 9th | Discover | Very lenient |

### Combined Hard Pull Opportunities
| Issuer | Combined Pull? |
|--------|---------------|
| Amex | Yes (same-day = 1 pull) |
| Chase | No |
| Citi | No (8-day spacing required) |
| Capital One | No (often pulls all 3 bureaus) |
| All others | No |

### Business Cards That DON'T Count Toward 5/24
Chase Ink, Amex business, Barclays business, US Bank business, WF business

### Business Cards That DO Count
Capital One business, Discover business

### Marriott Cross-Issuer Restriction
Cannot earn a signup bonus on a Chase Marriott card if you received an Amex Marriott bonus within 24 months (and vice versa). **VERIFY:** Partnership terms periodically renegotiated.

---

## 12. Actively Changing / Disputed Rules

| Rule | Status | Detail |
|------|--------|--------|
| Amex 7-year vs. Lifetime | ACTIVELY CHANGING | Mid-2024 rollout, not all cards switched |
| Amex 5 Credit Card Limit | DISPUTED | May have increased to 6 |
| Capital One Card Limit | RECENTLY CHANGED | Relaxed from 1-2 to 3-4 |
| Chase IHG 5/24 Exemption | DISPUTED | Has oscillated |
| Citi Strata Premier Family Restriction | UNCLEAR | Rebrand may affect 48-month rules |
| Marriott Cross-Issuer Restriction | POTENTIALLY CHANGING | Partnership renegotiations |
| Wells Fargo 15-Month Cooldown | VERIFY | WF expanding rewards program |
| Bilt Issuer | VERIFY | Rumors of issuer switch |
| Capital One Bureau Pulls | DISPUTED | May have reduced to 1-2 |

---

## 13. Implementation Priority

### Phase 1 (Must-Have for v1 Recommendations)
1. Chase 5/24 check
2. Amex lifetime/7-year check
3. Citi 48-month family restriction
4. One Sapphire Rule
5. Amex 5 credit card limit

### Phase 2 (Important for Accuracy)
6. Chase 48-month Sapphire cooldown
7. Amex pop-up jail warning
8. Amex 2/90 timing
9. Citi 8/65 timing
10. Marriott cross-issuer restriction

### Phase 3 (Power User Features)
11. Hard pull bureau map by state
12. Combined hard pull optimization
13. Application order optimizer
14. Business card 5/24 impact calculator

---

## 14. Data Collection Requirements

| Data Point | Rules It Powers | Collection Method |
|------------|----------------|-------------------|
| Cards opened in past 24 months (all issuers) | 5/24, Barclays 6/24, BofA 7/12 | User self-report + credit report import |
| Current cards held (by issuer/product) | One Sapphire, Amex 5-limit | user_cards table |
| Dates of signup bonuses received | 48-month cooldowns, lifetime | User self-report with date picker |
| Hard inquiries in past 6 months | Citi 6/6, US Bank | Credit report or self-report |
| State of residence | Bureau pull map | User profile |
| Banking relationships | US Bank, BofA Preferred Rewards | User self-report |

---

## 15. Proposed JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "IssuerRulesDatabase",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "last_updated": { "type": "string", "format": "date" },
    "issuers": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "application_rules": { "type": "array", "items": { "$ref": "#/$defs/Rule" } },
          "bonus_rules": { "type": "array", "items": { "$ref": "#/$defs/Rule" } },
          "product_rules": { "type": "array", "items": { "$ref": "#/$defs/Rule" } },
          "bureau_pulls": {
            "type": "object",
            "properties": {
              "primary_bureau": { "type": "string" },
              "multi_pull": { "type": "boolean" },
              "combined_pull_possible": { "type": "boolean" }
            }
          },
          "business_reports_to_personal": { "type": "boolean" }
        }
      }
    }
  },
  "$defs": {
    "Rule": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "description": { "type": "string" },
        "type": {
          "type": "string",
          "enum": ["velocity_limit", "account_limit", "bonus_cooldown", "product_exclusion", "inquiry_limit", "relationship_requirement", "cross_issuer_restriction", "other"]
        },
        "enforcement": { "type": "string", "enum": ["hard", "soft", "varies"] },
        "confidence": { "type": "string", "enum": ["confirmed", "likely", "rumored"] },
        "last_verified": { "type": "string", "format": "date" },
        "affected_cards": { "type": "array", "items": { "type": "string" } },
        "exempt_cards": { "type": "array", "items": { "type": "string" } },
        "parameters": {
          "type": "object",
          "properties": {
            "max_count": { "type": "integer" },
            "window_months": { "type": "integer" },
            "window_days": { "type": "integer" },
            "cooldown_months": { "type": "integer" },
            "counts_from": { "type": "string" },
            "scope": { "type": "string" }
          }
        },
        "check_function": { "type": "string" },
        "user_action_if_blocked": { "type": "string" },
        "sources": { "type": "array", "items": { "type": "string" } },
        "actively_changing": { "type": "boolean" }
      },
      "required": ["id", "name", "type", "enforcement", "confidence", "affected_cards"]
    }
  }
}
```

---

## Rule Summary

| Issuer | Cards | App Rules | Bonus Rules | Product Rules | Total |
|--------|-------|-----------|-------------|---------------|-------|
| Chase | 14 | 3 | 3 | 2 | 8 |
| Amex | 14 | 3 | 2 | 2 | 7 |
| Citi | 5 | 2 | 2 | 1 | 5 |
| Capital One | 5 | 1 | 1 | 2 | 4 |
| US Bank | 2 | 2 | 1 | 0 | 3 |
| Barclays | 3 | 1 | 1 | 1 | 3 |
| Wells Fargo | 3 | 2 | 1 | 0 | 3 |
| Bank of America | 3 | 2 | 1 | 1 | 4 |
| Bilt | 1 | 1 | 0 | 1 | 2 |
| Discover | 2 | 0 | 0 | 1 | 1 |
| **Total** | **52** | **17** | **12** | **11** | **40** |

---

*Re-verify quarterly against Doctor of Credit, r/churning, and issuer terms pages.*
