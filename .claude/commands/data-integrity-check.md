Audit the catalog data files for integrity issues. Read-only — do NOT modify any files.

**Files to read:**
- `data/credit-cards.json` (full)
- `data/transfer-partners.json` (full)

**Check 1 — Internal consistency:**
- Do all `transfer_partners` codes on cards in `credit-cards.json` exist in `transfer-partners.json`?
- Are there any cards referencing currencies not defined in the shared types (`Currency` in `packages/shared/src/types.ts`)?
- Are `earning_rates` keys consistent across cards from the same issuer?

**Check 2 — Known high-risk fields:**
Spot-check these fields across the 10 highest-traffic cards (CSR, Amex Platinum, Amex Gold, CFU, CFF, Sapphire Preferred, Capital One Venture X, Bilt, Citi Premier, US Bank Altitude Reserve):
- `signup_bonus.points` — does it match current public offer?
- `annual_fee_cents` — does it match the card's current AF?
- `portal_cpp` — is it still accurate for the issuer's current portal?

Flag anything that looks stale or suspicious, with a note about what to verify.

**Check 3 — Structural completeness:**
- Do all 54 cards have `payment_info`?
- Do premium cards (AF > $400) have `credits`, `perks`, `downgrade_options`, and `retention_data`?
- Are all `application_url` values non-empty?

**Check 4 — Transfer partner coverage:**
- Are there transfer partners in `transfer-partners.json` that aren't referenced by any card? (orphaned partners)
- Are there card currencies in `credit-cards.json` with zero transfer partners? (might be correct for some, flag for review)

**Output — clean summary:**

```
## Data Integrity Report
**Date:** [today]
**Cards checked:** N
**Partners checked:** N

### Critical Issues
[Broken references, type mismatches — fix before next deploy]

### Stale Data Flags
[Fields that look potentially outdated — verify before next catalog update]

### Structural Gaps
[Missing required fields on specific cards]

### Orphaned Records
[Partners with no card references, etc.]

### All Clear
[Areas that checked out cleanly]
```

Do not suggest fixes — surface findings only. Annabel will decide what to update.
