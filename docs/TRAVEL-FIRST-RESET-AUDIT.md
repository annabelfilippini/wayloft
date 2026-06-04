# Wayloft Travel-First Reset Audit

**Created:** May 11, 2026
**Purpose:** Reframe Wayloft around travel decisions while preserving the
valuable credit-card and points infrastructure already built.

## Recommendation

Do not restart the codebase. Restart the product hierarchy.

Wayloft already has the hard parts of a travel decision engine:

- Duffel cash flight search in `apps/web/lib/flights/search.ts`.
- Seats.aero award search in `apps/web/lib/flights/seats-aero.ts`.
- Cash-vs-points comparison in `apps/web/lib/flights/compare.ts`.
- User balances in `loyalty_balances`.
- Transfer-bonus tracking and scraper logic.
- Transfer-partner catalog in `data/transfer-partners.json`.
- Credit-card catalog and wallet logic in `data/credit-cards.json` and
  `user_cards`.

The problem is not lack of travel capability. The problem is that the product
still introduces itself as a card/portfolio optimizer, and travel feels like a
feature tab instead of the main reason to use Wayloft.

## New Product Center

Wayloft should become:

> A travel decision engine that tells you when to book with cash, when to book
> with points, and which points or transfer path make the trip cheapest.

Credit cards remain important, but as the funding layer:

- Which points do I have?
- Which cards earn the points I need?
- Which transfer partners can I use?
- Which transfer bonuses improve this specific trip?
- Which card should I use if cash is better?

## What To Keep

### Travel Search

Keep and elevate:

- `apps/web/app/(app)/travel/page.tsx`
- `apps/web/components/travel/travel-client.tsx`
- `apps/web/components/flights/search-form.tsx`
- `apps/web/components/travel/comparison-card.tsx`
- `apps/web/lib/flights/compare.ts`
- `apps/web/app/api/flights/search/route.ts`
- `apps/web/app/api/flights/awards/route.ts`

This is the Santa Clara insight already in code: compare a cash fare against
award cost and give a verdict.

### Credit Card And Points Infrastructure

Keep:

- `data/credit-cards.json`
- `data/transfer-partners.json`
- `apps/web/lib/flights/enrich.ts`
- `apps/web/lib/cards/transfer-partners.ts`
- `apps/web/lib/cards/valuations.ts`
- `user_cards`
- `loyalty_balances`

These should power travel decisions rather than define the primary UI.

### Transfer Bonus System

Keep and integrate more deeply:

- `apps/web/lib/bonuses/scraper.ts`
- `transfer_bonuses`
- `transfer_bonus_history`
- `apps/web/components/travel/bonus-sidebar.tsx`

The strongest use is not "here are all bonuses." It is "this bonus makes this
specific trip materially better."

### Booked Trip Layer

Keep:

- `user_flights`
- `upcoming_flights`
- `apps/web/components/travel/flight-dashboard.tsx`
- `scripts/checkin-alert.py`

This can become "my trips" and later "watch this trip for a better points
price."

## What To Demote

### Dashboard As Portfolio Center

Current dashboard hierarchy is portfolio-first:

- portfolio value hero
- card strip
- transfer bonuses
- card action tasks
- spending optimizer

Useful, but it should become secondary to trip planning. The dashboard should
lead with:

1. next trip / plan a trip
2. current best opportunities for my points
3. expiring or urgent actions
4. portfolio/cards as supporting context

### Card Recommendation As Primary Nav

`Find a Card` should not be the main next action for most users. It should be
renamed/repositioned around a travel goal:

- "Earn for a Trip"
- "Build My Points"
- "Need More Points"

### Marketing Homepage

The public homepage says "Your points, properly spent," which is close, but the
body still centers cards, optimizer, bonuses, and annual-fee tools. It should
lead with trip examples:

- "$400 cash vs 15,000 points"
- "Use Chase points, not cash"
- "Transfer now because this bonus changes the math"

## Proposed App Hierarchy

Primary nav:

1. Travel
2. Trips
3. Points
4. Cards
5. Reviews
6. Settings

Travel should be the default signed-in landing surface once the reset is
complete.

## First MVP Screen

Create a "Trip Decision" screen:

Input:

- From
- To
- Dates
- Passengers
- Cabin

Output:

- Cash price
- Best points price
- Cents-per-point value
- Verdict: use cash, use points, or close call
- Transfer path from the user's actual balances
- Current transfer bonus impact
- Best card to use if paying cash

This preserves the credit-card component exactly where it matters: in the
decision, not as the headline.

## Implementation Path

1. Rename/reframe `/travel` UI copy around "Should I book with cash or points?"
2. Make `/travel` the default post-login destination when
   `NEXT_PUBLIC_ENABLE_TRAVEL=true`.
3. Move `FlightDashboard` below trip search or into a dedicated "Trips" view.
4. Convert transfer bonus sidebar into trip-specific insight cards.
5. Add a saved "watch this trip" action after search.
6. Keep card portfolio pages, but make them answer "what trips can these points
   unlock?"

## Non-Goals For Now

- Do not scrape airline websites directly.
- Do not rebuild the app from scratch.
- Do not make credit cards disappear.
- Do not build full airline checkout until the regulatory and booking-provider
  path is deliberately chosen.

## One-Sentence Product Test

If a user searches a trip and Wayloft cannot clearly say "cash, points, or wait,"
the product is still too card-centered.
