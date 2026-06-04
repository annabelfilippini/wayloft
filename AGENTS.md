# Wayloft Router

Wayloft is Annabel's travel decision engine. The current center is helping a
user decide whether to book with cash, points, or a better travel path.

Credit cards, balances, transfer partners, transfer bonuses, and card reviews
remain important, but they support the trip decision instead of defining the
primary product surface.

## Start Here

- App code: `apps/web`
- Data catalogs: `data/`
- Project docs map: `docs/README.md`
- Research map: `Research/README.md`

## Current Default

- Treat `apps/web` as the active product surface.
- Treat `/travel` as the active product center when travel is enabled.
- Check package scripts before running commands.
- Use existing UI conventions and the Signal design system.
- Keep generated output out of source folders.
- Reinstall dependencies only when needed.

## Context Rule

Read `docs/README.md` first, then only the task-specific active doc.

Do not read archived plans or full historical context unless the task explicitly
asks for old roadmap/business history. Do not bulk-read `Research/`; use
`Research/README.md` as the router and pull only the relevant report.

Current source-policy guardrail: do not scrape airline websites or automate
airline sessions unless Annabel deliberately reopens that legal/product
decision.
