# Wayloft Award Intel Pipeline

**Created:** May 11, 2026
**Status:** Ready for implementation
**Decision:** Use licensed/API and public aggregator sources. Do not scrape airline websites.

## Goal

Turn Wayloft's existing Seats.aero award search integration into a recurring
opportunity engine:

1. Watch high-value routes, booked trips, and transfer-bonus windows.
2. Pull award availability from authorized sources.
3. Compare availability against user balances, card portfolio, transfer partners,
   and current cash prices.
4. Emit structured opportunities for the product, alerts, and editorial research.

This should make Wayloft the decision layer, not another raw award-search clone.

## Source Policy

Allowed sources:

- Seats.aero partner/commercial API.
- Duffel API for cash fare context.
- Manually maintained route/value data.
- Public travel blogs, deal posts, community discussions, and aggregator pages
  when attribution is preserved.

Disallowed for MVP:

- Direct scraping of airline websites.
- Login/session automation against airline accounts.
- CAPTCHA, bot-detection, or rate-limit circumvention.

This follows `Research/P0-RESEARCH-KEY-DECISIONS.md` and
`.claude/rules/data-pipeline.md`.

## Phase 1: Local Probe

Use `scripts/award-intel-probe.mjs` to call Seats.aero for a small route set and
write JSONL to `Research/award-intel/`.

```bash
SEATS_AERO_API_KEY=... node scripts/award-intel-probe.mjs \
  --routes DTW-MCO,DTW-LHR,DTW-CDG,LAX-HND,JFK-MAD \
  --start-date 2026-06-01 \
  --end-date 2026-06-30 \
  --cabins economy,business
```

Suggested routes:

| Segment | Why |
|---|---|
| DTW-MCO | Family/domestic use case and booked-trip relevance |
| DTW-LHR | Europe anchor route |
| DTW-CDG | Flying Blue transfer-bonus relevance |
| LAX-HND | Premium-cabin sweet spot benchmark |
| JFK-MAD | Iberia/Avios benchmark |

Output shape:

```json
{
  "type": "award_availability_snapshot",
  "route": "DTW-MCO",
  "source": "seats.aero",
  "retrieved_date": "2026-05-11T00:00:00.000Z",
  "availability": [],
  "confidence": 0.95,
  "gaps": []
}
```

Rules:

- Never print `SEATS_AERO_API_KEY`.
- Keep raw snapshots out of source-controlled app folders.
- Preserve `source_url`, `retrieved_date`, `confidence`, and upstream freshness
  timestamps.
- If a route fails, write a partial result with an explicit `gaps` entry.

## Phase 2: Opportunity Scoring

Convert raw snapshots into `AwardOpportunity` records:

```ts
type AwardOpportunity = {
  route: string;
  date: string;
  cabin: "Y" | "W" | "J" | "F";
  program: string;
  pointsCost: number;
  seatsAvailable: number;
  direct: boolean;
  cashComparableCents: number | null;
  estimatedCpp: number | null;
  matchedTransferCurrencies: string[];
  transferBonusContext: string[];
  userAction: "book_with_points" | "watch" | "use_cash" | "manual_review";
  source: {
    provider: "seats.aero";
    retrievedDate: string;
    upstreamUpdatedAt: string;
  };
  confidence: number;
};
```

Scoring should favor:

- Routes the user already tracks.
- Trips where booked award prices have dropped.
- Transfer-bonus windows that improve value.
- At least two available seats for family travel.
- Direct flights or low-friction one-stop itineraries.

## Phase 3: Product Surfaces

Use the scored opportunities in three places:

- Travel dashboard: "your booked flight may be cheaper in miles now."
- Search result comparison: richer cash-vs-points reasoning.
- Editorial/research queue: recurring sweet-spot ideas for SEO pages.

## CLI Skill Flow

Use `skills.sh` only for safe skill inspection unless Annabel approves install or
update operations:

```bash
DISABLE_TELEMETRY=1 npx skills list
DISABLE_TELEMETRY=1 npx skills show <skill>
```

Do not install third-party scraping skills or browser automation skills for this
pipeline without an explicit source review.

## Open Questions

- Confirm current Seats.aero API endpoint coverage and rate limits against the
  account actually available to Wayloft.
- Decide whether snapshots live in Supabase, `Research/award-intel/`, or both.
- Decide whether alerts should use the existing Telegram path from check-in
  alerts or a separate digest.
