Pre-flight check before updating `credit-cards.json` or `transfer-partners.json`. Run this before making any catalog edits.

**Arguments:** $ARGUMENTS (describe the changes you're about to make)

**Check 1 — Source citation:**
For every field being changed, confirm:
- Is there a source URL?
- Is there a retrieved date (within the last 30 days)?
- Is the source an official issuer page, or a third-party aggregator?

Flag any change without a primary source. Third-party sources (TPG, NerdWallet, Doctor of Credit) are acceptable as supporting evidence but not as the sole citation for financial data.

**Check 2 — Conflict annotation:**
If the new value conflicts with what's currently in the JSON, or if two sources disagree:
- Do NOT silently resolve it
- Annotate both values with sources and dates
- Output a `ConflictingField` entry for review

**Check 3 — Date freshness:**
Flag any signup bonus or earning rate being added with a retrieved date older than 60 days. These change frequently and stale data directly harms users.

**Check 4 — Downstream impact:**
For each changed field, identify what breaks or changes in the UI:
- `signup_bonus.points` → affects recommendation engine scoring, card review pages, dashboard widgets
- `annual_fee_cents` → affects AF decision helper, optimizer gap scoring
- `earning_rates` → affects spending optimizer, recommendation engine
- `transfer_partners` → affects card detail page, comparison view

List the affected components so they can be verified after the update.

**Output format:**

```
## Pre-flight: [description of changes]

### Source Citations
- [field]: [source URL] — retrieved [date] ✓/⚠️

### Conflicts
- [field]: [value A] (source, date) vs [value B] (source, date) — REVIEW REQUIRED

### Freshness Warnings
- [field]: retrieved [date] — [N] days old ⚠️

### Downstream Impact
- [field change] affects: [component list]

### Verdict
PROCEED / HOLD — [reason if HOLD]
```

If all checks pass: "Looks good. Proceed with the edits."
If any check fails: "Hold — [specific issue]. Resolve before editing."
