---
globs: ["apps/web/app/actions/**", "apps/web/app/api/**", "apps/web/lib/bonuses/**", "scrapers/**"]
---

# Error Handling Rules

## Server Actions — Required Shape

Every server action MUST return `ActionResult<T>`. Never throw. Never return early with a bare string.

```ts
type ActionResult<T = void> =
  | { success: true; data?: T }
  | {
      success: false;
      error: {
        category: 'transient' | 'validation' | 'permission';
        message: string;       // shown to user
        description?: string;  // logged only, never shown
        isRetryable: boolean;
        field?: string;
      };
    };
```

## Absolute Rules

- **Never** pass `error.message` directly to `message` — it may expose DB internals
- **Never** return `{ success: true, data: [] }` after a failed query — that's silent suppression
- **Never** use `"Invalid input"` as a message — say what's invalid
- **`permission` errors** → redirect to `/login`, do not show inline
- **`transient` errors** → `isRetryable: true`
- **`validation` errors** → `isRetryable: false`

## UI Rendering

- Inline errors: `<p className="text-sm text-destructive flex items-center gap-1.5 mt-1"><AlertCircle size={14} />{error.message}</p>`
- Toast (fire-and-forget mutations): use Sonner `toast.error()`
- Show "Try again" only when `isRetryable: true`

## Scraper / Background Jobs

Use full Tier 2 schema — include `partialResult`, `attemptedActions`, `suggestion`.
Retry transient errors locally (3x) before returning failure.
Never abort entire pipeline on a single source failure.
