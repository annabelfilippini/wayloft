---
paths:
  - "data/**"
  - "apps/web/lib/bonuses/**/*.ts"
  - "apps/web/app/api/cron/**/*.ts"
  - "scrapers/**"
---

# Data Pipeline Rules

Applies to catalog management, scraper pipeline, and all data ingestion.

## Source of Truth

- `data/credit-cards.json` is the single source of truth for card metadata. Never hardcode card data (annual fees, earning rates, signup bonuses, transfer partners) anywhere else in the codebase.
- `data/transfer-partners.json` is the single source of truth for transfer partner data.
- `data/issuer-rules.json` is the single source of truth for issuer application rules.

When catalog data is needed in code, read it via `getCatalogCards()` / `getCardBySlug()` from `lib/cards/catalog.ts` — never import the JSON directly outside of that lib.

## Scraper Output

Every scraped record must include:
- `source_url` — exact URL fetched
- `retrieved_date` — ISO 8601 date when Claude/scraper fetched it
- `confidence` — 0–1 score based on parse strategy used

Never return an empty array to mask a failed scrape. If records were fetched before failure, return `partialResult` with what was collected before failing.

## Conflict Handling

When two sources disagree on a field value, annotate both — never silently pick one. Use the `ConflictingField` schema from `extraction-and-attribution.md`. Flag it for human review; do not auto-resolve.

## Legal Constraints

- **Do NOT scrape airline websites.** Active litigation risk. Use Duffel API for flight data.
- Scraping issuer websites for card terms is acceptable.
- Scraping Doctor of Credit, Frequent Miler, and similar aggregators is acceptable.

## Catalog Updates

Before modifying `credit-cards.json` or `transfer-partners.json`, run `/card-data-check` to verify source citations, conflict annotation, and downstream impact.

Card fields with known high variability (signup bonuses, earning rates) require a `source_url` and `retrieved_date` annotation in the surrounding context or PR description — not necessarily in the JSON itself.
