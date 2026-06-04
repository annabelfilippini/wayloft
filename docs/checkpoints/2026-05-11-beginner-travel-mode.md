# Checkpoint: Beginner Travel Mode Draft

**Date:** May 11, 2026  
**Status:** Draft implemented, ready for later visual/product review.

## Product Direction

Wayloft should feel less like a rewards dashboard and more like a simple travel
booking decision tool:

1. Where are you going?
2. What points do you have?
3. Should you use cash, points, or wait?

Keep the existing card, bonus, optimizer, review, and data machinery in the
repo, but hide it from the default beginner path unless it changes the trip
answer.

## What Changed This Session

- Made signed-in navigation beginner-first:
  - `Plan Trip`
  - `My Points`
  - `My Trips`
- Moved cards, reviews, earn-for-trip, and optimizer into secondary surfaces.
- Simplified `/travel` around one large trip search form.
- Collapsed cash fare lists, transfer bonuses, and program math behind details.
- Reworked the Trip Decision card so the verdict and next action appear first.
- Shifted the app visual draft toward the provided United reference:
  - black top bar
  - blue action color
  - plain Arial/Helvetica-style typography
  - larger airline-style search inputs
  - fewer words above the fold

## Current Caveat

This is a draft direction, not a finished visual system. It borrows interaction
patterns from the United screenshot without copying United branding. Next pass
should visually QA the authenticated `/travel` page and tighten spacing,
responsive behavior, and empty states.

## Next Recommended Step

Open `/travel` signed in and compare it directly against the United reference.
Focus on:

- search form density and labels
- whether the first screen can be understood in 5 seconds
- whether result details stay hidden until requested
- whether blue/black travel UI should replace the old Signal amber system across
  the whole app or stay scoped to travel

## Verification Run

Before ending the session, run:

- `pnpm --filter web type-check`
- targeted ESLint on changed travel/nav files
- `git diff --check`

