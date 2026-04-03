---
globs: ["tests/**", "**/*.test.ts", "**/*.spec.ts"]
---

# Testing Rules

## Coverage Requirements

Every server action needs three tests minimum:
1. **Happy path** — valid input, successful DB write, correct return shape
2. **Validation error** — invalid input returns `{ success: false, error: { category: 'validation' } }`
3. **DB failure** — Supabase returns error, action returns `{ success: false, error: { category: 'transient', isRetryable: true } }`

Never ship a new server action to production without all three.

## Supabase in Tests

**Mock the Supabase client — never hit the live database.**

Use a mock that returns controlled `{ data, error }` responses. Verify the mock was called with the expected query, not just that the action returned successfully.

```ts
// Correct pattern
const mockFrom = vi.fn().mockReturnValue({
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
});
vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as any);
```

## Recommendation Engine Tests

`lib/recommend/engine.ts` must cover:
- Owned cards are filtered from results
- Chase 5/24 hard filter: user at 5/24 cannot see Chase cards
- CPP weighting: UR value is higher for users who own CSR vs CFU-only
- Annual fee comfort gate: cards above user's comfort are excluded
- Signup bonus achievability discount applies when user's monthly spend is too low

## Scraper Tests

`lib/bonuses/scraper.ts` must cover:
- Successful parse with valid HTML → returns expected bonus records
- Malformed HTML → returns `partialResult` (not empty array, not throw)
- Rate limit / 429 response → `isRetryable: true`
- Empty result from source → `{ data: [], error: null }` (distinguished from access failure)

## File Naming

Test file mirrors source file location:
- `lib/recommend/engine.ts` → `tests/recommend/engine.test.ts`
- `app/actions/cards.ts` → `tests/actions/cards.test.ts`
- `lib/bonuses/scraper.ts` → `tests/bonuses/scraper.test.ts`

## Before Building New Features

Run `/test-gen {{feature}}` before writing implementation code. The interview it runs will surface edge cases that change the implementation.
