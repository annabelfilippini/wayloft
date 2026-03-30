Review the current branch changes as an independent code reviewer. Never self-review — treat this as a fresh set of eyes.

**Read first:**
- `git diff main...HEAD` to see all changes in this branch
- Any files modified that have corresponding rule files in `.claude/rules/`

**Pass 1 — Per-file local issues:**
For each changed file, check:
- Does it follow the relevant `.claude/rules/` for its path?
- Error handling: `ActionResult<T>` shape, no raw DB errors exposed, no silent suppression
- DB: no `SELECT *`, no hard deletes on user data, no unprotected queries
- API: CRON_SECRET or auth check present on any new routes

**Pass 2 — Cross-file integration issues:**
- Do callers of changed server actions handle the new return shape correctly?
- Are there type mismatches between what an action returns and what the component expects?
- Is any new data flow missing attribution or source citation?

**Output format — JSON only, no prose:**

```json
{
  "findings": [
    {
      "file": "path/to/file.ts",
      "line": 42,
      "severity": "high|medium",
      "issue": "Short description of the problem",
      "confidence": 0.95,
      "confidence_reason": "Why you're confident this is actually a bug",
      "suggested_fix": "What to change"
    }
  ],
  "summary": {
    "high": 0,
    "medium": 0,
    "skipped_low_confidence": 0
  }
}
```

**Rules:**
- Only report findings with confidence > 0.80
- Skip anything that's subjective style preference
- High = data loss, security issue, broken user flow
- Medium = rule violation, potential bug, missing error handling
- If no findings: output `{ "findings": [], "summary": { "high": 0, "medium": 0 } }` — do not add filler commentary
