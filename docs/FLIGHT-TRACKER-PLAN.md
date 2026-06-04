# Wayloft Flight Tracker Plan

**Created:** April 9, 2026
**Trimmed:** May 11, 2026
**Status:** Phase 1 exists in product; Phase 2 depends on authorized award data.

## Purpose

Booked trips should support the travel-first product center:

> I booked this trip. Should I rebook, watch, or act now?

This plan is now scoped to authorized sources and user-controlled reminders. It
should not be read as permission to automate airline websites.

## Current Product Surface

The repo already has a booked-flight foundation:

- `user_flights`
- `upcoming_flights`
- `apps/web/components/travel/flight-dashboard.tsx`
- `apps/web/components/travel/flight-card.tsx`
- `apps/web/components/travel/add-flight-dialog.tsx`
- `apps/web/app/actions/flights.ts`
- `scripts/checkin-alert.py`

Keep this layer below the primary trip-decision search until saved trip watches
become a core workflow.

## Phase 1: Booked Flights And Check-In Alerts

**Goal:** Let users add booked flights and receive check-in reminders.

Approved behavior:

- Store route, airline, confirmation number, passenger name, departure time,
  booking type, miles/cash paid, cabin, and seat preference.
- Compute check-in window timing from airline metadata.
- Show upcoming flights in the Travel/Trips surface.
- Send reminder alerts when check-in opens.

No award data provider is required for this phase.

## Phase 2: Award Price Drop Monitoring

**Goal:** Alert when a booked award can be rebooked for fewer miles.

Approved data sources:

- Seats.aero partner/commercial API for award availability.
- Duffel API for cash fare context.
- Manual user-entered current prices when no authorized source exists.

Do not scrape airline websites for MVP. This follows
`Research/P0-RESEARCH-KEY-DECISIONS.md` and `.claude/rules/data-pipeline.md`.

Suggested alert thresholds:

- Award flights: alert when savings are large enough to justify manual rebook.
- Southwest/manual entries: alert on smaller point drops because rebooking is low
  friction, but keep data entry user-controlled.
- Cash flights: alert on material cash drops only.

Alert copy should include:

- Current price vs. original price.
- Estimated savings in points/cash.
- One manual next step, such as "Log in to the airline and rebook."

## Phase 3: Direct Airline Automation

**Status:** Deferred. Not approved for MVP.

Direct airline check-in automation, seat-map automation, login/session
automation, CAPTCHA avoidance, bot-detection workarounds, and direct airline
award scraping require a separate legal/product decision before implementation.

If this is ever reopened, create a new decision memo first. Do not add scripts
or browser automation from this plan alone.

## Open Questions

- Does the active Seats.aero account support specific route/date/cabin queries
  at the freshness needed for booked-flight monitoring?
- Should alerts use the existing Telegram path, email, or an in-app digest?
- Should saved trip watches and booked flights share one table, or stay separate
  until the product pattern proves itself?
- What is the minimum manual workflow for Southwest that creates value without
  scraping or automation?

## Success Criteria

- Phase 1: a user can add a booked flight and get a timely check-in reminder.
- Phase 2: Wayloft identifies at least one worthwhile rebook opportunity from an
  authorized data source or manual price entry.
- Phase 3: no work begins until a new approval explicitly changes the current
  source policy.
