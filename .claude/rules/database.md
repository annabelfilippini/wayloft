---
globs: ["packages/db/migrations/**", "apps/web/lib/supabase/**", "apps/web/app/actions/**", "apps/web/app/api/**"]
---

# Database Rules

## Connection

- **Supabase JS client only.** Never use Supabase CLI, psql, or direct DB connection strings.
- Server components and actions: `createClient()` from `@/lib/supabase/server`
- Admin/cron operations only: `createAdminClient()` from `@/lib/supabase/admin`
- **Running migrations:** Output SQL and have Annabel paste into the Supabase Dashboard SQL Editor. Never attempt `supabase login`, `supabase db execute`, or REST-based SQL execution.

## Schema Conventions

Every new table must have:
- UUID primary key via `gen_random_uuid()`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()` managed by `set_updated_at()` trigger
- RLS enabled with explicit user-owns-their-data policies
- `user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE` for all user data tables

## Queries

- **Never `SELECT *`** — always name columns explicitly
- Distinguish empty result from connection failure: a `.data` of `[]` with no `.error` is valid empty; an `.error` present is an access or connection failure — never return `{ success: true, data: [] }` after a failed query
- Always chain `.eq("user_id", user.id)` on user data queries — never rely on RLS alone as the only guard

## Deletes

- **Soft delete only for user data.** Never hard-delete rows from user-facing tables (`user_cards`, `user_credit_usage`, `user_perk_setup`, `user_payment_info`, `loyalty_balances`, `card_lifecycle_events`).
- Soft delete pattern: add `deleted_at TIMESTAMPTZ` column, filter `WHERE deleted_at IS NULL` in queries.
- Hard delete is only acceptable for: account deletion (cascades from `profiles`), and internal/admin cleanup of system tables.
- When soft-deleting a parent row (e.g., `user_cards`), also soft-delete related child rows (e.g., `user_payment_info` for that card).
- All queries on soft-deletable tables must include `.is("deleted_at", null)` filter.
- Unique constraints on soft-deletable tables use partial indexes (`WHERE deleted_at IS NULL`) to allow re-adding previously deleted rows.
