---
globs: ["apps/web/lib/bonuses/**", "scrapers/**", "scripts/**", "data/**", "apps/web/app/api/cron/**"]
---

# Extraction and Attribution Rules

Applies to all scraping, data extraction, catalog audits, and synthesis tasks.

## Attribution Schema

Every extracted claim must include full attribution. Attribution must travel with content through every pipeline step — once dropped it's gone permanently.

```ts
type AttributedClaim = {
  claim: string;
  value: string | number;
  source: {
    url: string;
    document_name: string;
    excerpt: string;          // exact text Claude pulled from
    publication_date: string; // when the source was written (ISO 8601)
    retrieved_date: string;   // when Claude fetched it (ISO 8601)
  };
  confidence: number;         // 0–1
};
```

Never return attribution as prose ("based on the issuer website"). Always structured.

## Conflicting Values

When sources disagree, annotate both — never pick arbitrarily.

```ts
type ConflictingField = {
  status: 'conflicting';
  values: Array<{
    value: string;
    source: string;
    date: string;
    characterization: string; // e.g. "primary issuer source", "third party — may be outdated"
  }>;
  coordinator_action_required: true;
};
```

Subagent never resolves conflicts unilaterally. Always escalate with both values.

## Temporal Data

Dates prevent false conflicts. Always include both dates:

- `publication_date` — when the source was written
- `retrieved_date` — when Claude fetched it

A $95 AF in 2022 and a $550 AF in 2026 are not a conflict — they're two time periods.
Without dates, they look like a contradiction.

## Synthesis Output Format

Final synthesis must separate findings by confidence level:

```markdown
## Established Findings
(consistent across all sources — safe to publish)

## Contested Findings
(sources disagree — review before publishing)
For each: list values side-by-side with source + date + characterization

## Data Gaps
(sources unavailable, blocked, or not checked)
```

Never present partial findings as complete. Always include the gaps section.

## Rendering by Content Type

| Content | Format |
|---------|--------|
| Financial data (fees, rates, bonuses) | Tables |
| Card news / updates | Prose paragraphs |
| Conflicting values | Annotated side-by-side |
| Data gaps | Explicit gap section |

## Field Confidence Thresholds (Wayloft)

These fields have known failure rates — apply stricter review gates:

| Field | Notes |
|-------|-------|
| `annual_fee` | Highly reliable — issuer pages consistent |
| `signup_bonus` | Reliable but changes frequently — verify date |
| `earning_rate` | Less reliable — portal vs direct often confused |
| `bonus_expiry_terms` | Least reliable — highest false confidence risk |

Flag any `bonus_expiry_terms` extraction below 0.90 confidence for manual review.

## Segment Accuracy

Aggregate accuracy hides segment failures. Track separately:

- Issuer webpages — most reliable, automate first
- PDF terms — reliable
- Third-party blogs — least reliable, flag for review
- Scanned mailers — always human review

Don't automate a segment until it passes accuracy threshold independently.
97% overall accuracy means nothing if bonus expiry terms are wrong 33% of the time.
