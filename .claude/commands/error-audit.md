Scan all server actions and API routes for error handling violations. This is a read-only audit — do NOT modify any files.

**Files to scan:**
- `apps/web/app/actions/*.ts`
- `apps/web/app/api/**/*.ts`

**Skip:** `auth.ts` (redirect pattern is an explicit carve-out), `affiliate.ts` (fire-and-forget)

**What to flag:**

1. **Wrong return shape** — any function that returns `{ error: string }` instead of `ActionResult<T>`
2. **Raw DB error exposed** — `return { ..., error: error.message }` where `error.message` goes directly to `message` (not `description`)
3. **Silent suppression** — returning `{ success: true, data: [] }` or similar after a failed Supabase query
4. **Missing auth check** — server action that writes to DB without checking `user`
5. **Unprotected API route** — `app/api/` route with no CRON_SECRET check and no auth check

**Output — clean summary only:**

```
## Error Audit Report

### Violations

| File | Function | Line | Issue | Severity |
|------|----------|------|-------|----------|
| actions/cards.ts | removeCard | 229 | Hard delete (separate from error handling) | medium |

### Stats
- Files scanned: N
- Functions scanned: N
- Violations: N high, N medium

### Clean files
- actions/bonuses.ts — read-only, no mutations
- [etc.]
```

Severity:
- **High** — wrong return shape, raw DB error exposed, missing auth check
- **Medium** — silent suppression, style inconsistency with `ActionResult` pattern
