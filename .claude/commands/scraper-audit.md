Perform a deep analysis of the scraper pipeline for correctness and resilience. Read-only — do NOT modify any files.

**Files to read:**
- `apps/web/lib/bonuses/scraper.ts` (full)
- `apps/web/app/api/cron/scrape-bonuses/route.ts` (full)
- `apps/web/lib/supabase/admin.ts`

**Check 1 — Error shape compliance:**
Does `scrapeAllSources()` return structured errors per source? Can a single source failure be isolated without aborting the full pipeline?

**Check 2 — Partial result handling:**
If source A fails mid-parse, are the records collected before the failure returned (partialResult pattern)? Or does the function return empty and discard them?

**Check 3 — Empty vs failure distinction:**
Does the scraper distinguish between:
- Source returned 0 bonuses (valid — no current promotions)
- Source returned an error or was unreachable (access failure)

These must produce different outcomes — not both `[]`.

**Check 4 — Attribution fields:**
Do scraped records include `source_url` and a date marker? Is `confidence` tracked per parse strategy (table parse vs heading scan vs content scan)?

**Check 5 — Cron route resilience:**
- Does the cron route log per-source status (not just aggregate)?
- If `applyChanges()` returns errors, are they logged with enough context to debug?
- Is the idempotency check tight enough (4hr threshold)?

**Check 6 — Alias map coverage:**
Are there bank/partner name aliases that are clearly missing? Look for patterns like failed normalizations or `unknown_bank` fallbacks.

**Output — clean summary:**

```
## Scraper Audit Report

### Critical Issues
[Any issue that causes data loss or silent failures]

### Resilience Gaps
[Partial result handling, empty vs failure distinction]

### Attribution Gaps
[Missing source_url, confidence, date fields]

### Alias Map Gaps
[Obvious missing aliases]

### Overall Assessment
SOUND / NEEDS WORK — [1-2 sentence verdict]
```
