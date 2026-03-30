---
paths:
  - "apps/web/app/actions/**/*.ts"
  - "apps/web/app/api/**/*.ts"
---

# API Conventions

## Server Actions

All server actions must return `ActionResult<T>` from `@wayloft/shared`. No exceptions.

```ts
import type { ActionResult } from "@wayloft/shared";

export async function myAction(formData: FormData): Promise<ActionResult<MyData>> {
  // ...
}
```

Never return raw Supabase errors to the client. Put `error.message` in `description` (logged only), write a user-safe message in `message`.

**Auth actions are exempt** — `auth.ts` uses `redirect()` for error state (URL-based error pattern). Do not migrate auth actions to `ActionResult`.

**Fire-and-forget actions are exempt** — `affiliate.ts` has no return value by design.

## API Routes

Every API route must have one of:
- `CRON_SECRET` auth check (for cron routes): verify `Authorization: Bearer ${process.env.CRON_SECRET}`
- Supabase user auth check: call `supabase.auth.getUser()` and return 401 if no user

No unprotected endpoints. The `/api/user/credit-health` route is correctly guarded via `getCreditHealth()` returning null — this is acceptable.

## Affiliate Tracking

Affiliate click tracking (`trackAffiliateClick`) is fire-and-forget. Never `await` it in a way that blocks the UI or page render. Never surface a tracking failure to the user.

## Response Shape Consistency

API routes that wrap server actions should pass through the `ActionResult` shape:

```ts
// Correct
const result = await myAction();
if (!result.success) {
  return NextResponse.json({ error: result.error.message }, { status: 400 });
}
return NextResponse.json(result.data);
```

Cron route responses should always include `{ success: boolean, sources?, changes?, errors? }` for observability.
