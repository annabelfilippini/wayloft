# Wayloft Flight Lifecycle Manager

**Created:** April 9, 2026
**Status:** Planning complete, ready to build Phase 1
**Scope:** Family flight optimization tool inside Wayloft
**Target airlines:** United, Delta, Southwest, Frontier

---

## Vision

A flight lifecycle manager that takes you from booking through check-in:

```
Book with miles → Track in Wayloft → Monitor for price drops → Alert & rebook → Auto check-in → Get your seat
```

Connects to Wayloft's existing card portfolio: you know what points the user has, their transfer partners, and whether a price drop is worth acting on.

### Why this matters

Award bookings on all four target airlines can be cancelled and rebooked for free. Most people don't realize this, and those who do check manually every few days. Automating this saves real miles on every trip.

| Airline | Cancellation policy | Rebooking friction |
|---|---|---|
| Southwest | Free, points refund instantly | Zero — easiest of all airlines |
| United | Free, points redeposited | Low — online self-service |
| Delta | No fee on SkyMiles awards | Low — online self-service |
| Frontier | Varies (mostly cash bookings) | Medium — depends on fare class |

---

## Phase 1: Flight Dashboard + Check-in Alerts

**Goal:** Add flights, see them on a dashboard, get Telegram alerts when check-in opens.
**Dependencies:** None. Zero APIs, zero scraping.
**Effort:** ~1 day

### Database

New migration (`011_user_flights.sql`):

```sql
-- Flight entries for tracking
CREATE TABLE public.user_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Flight identity
  airline TEXT NOT NULL,              -- 'southwest', 'united', 'delta', 'frontier'
  confirmation_number TEXT NOT NULL,
  
  -- Route
  origin TEXT NOT NULL,               -- IATA code: 'DTW', 'LAX'
  destination TEXT NOT NULL,          -- IATA code
  departure_at TIMESTAMPTZ NOT NULL,
  arrival_at TIMESTAMPTZ,
  return_departure_at TIMESTAMPTZ,    -- null for one-way
  return_arrival_at TIMESTAMPTZ,

  -- Booking details
  passenger_name TEXT NOT NULL,       -- as on ticket
  booking_type TEXT NOT NULL DEFAULT 'miles',  -- 'miles' | 'cash'
  miles_paid INTEGER,                 -- null for cash bookings
  cash_paid_cents INTEGER,            -- null for miles bookings
  points_program TEXT,                -- 'rapid-rewards', 'mileageplus', 'skymiles'
  cabin_class TEXT DEFAULT 'economy', -- 'economy', 'premium_economy', 'business', 'first'
  
  -- Preferences
  seat_preference TEXT,               -- 'window', 'aisle', 'middle', 'exit_row'
  preferred_seat_number TEXT,         -- specific seat if known: '12A'
  
  -- Check-in tracking
  checkin_opens_at TIMESTAMPTZ,       -- computed: departure_at - 24h (varies by airline)
  checkin_completed_at TIMESTAMPTZ,   -- null until checked in
  boarding_position TEXT,             -- Southwest only: 'A32', 'B15'
  
  -- Price monitoring (Phase 2)
  current_award_price INTEGER,        -- latest known price in miles
  lowest_seen_price INTEGER,          -- historical low
  price_last_checked_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  deleted_at TIMESTAMPTZ,            -- soft delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flights"
  ON public.user_flights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_flights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Partial unique index for soft delete
CREATE UNIQUE INDEX user_flights_unique_active
  ON public.user_flights (user_id, airline, confirmation_number)
  WHERE deleted_at IS NULL;

-- View: upcoming flights with check-in countdown
CREATE OR REPLACE VIEW public.upcoming_flights AS
SELECT
  f.*,
  f.departure_at - INTERVAL '24 hours' AS checkin_opens_at_computed,
  EXTRACT(EPOCH FROM (f.departure_at - INTERVAL '24 hours' - NOW())) / 3600 AS hours_until_checkin,
  EXTRACT(EPOCH FROM (f.departure_at - NOW())) / 3600 AS hours_until_departure,
  CASE
    WHEN f.checkin_completed_at IS NOT NULL THEN 'checked_in'
    WHEN NOW() >= f.departure_at THEN 'departed'
    WHEN NOW() >= f.departure_at - INTERVAL '24 hours' THEN 'checkin_open'
    WHEN NOW() >= f.departure_at - INTERVAL '48 hours' THEN 'checkin_soon'
    ELSE 'upcoming'
  END AS flight_status
FROM public.user_flights f
WHERE f.deleted_at IS NULL
  AND f.departure_at > NOW() - INTERVAL '1 day'
ORDER BY f.departure_at ASC;
```

### Components

**New files:**

| File | Purpose |
|---|---|
| `components/travel/flight-dashboard.tsx` | Main flight list — cards sorted by departure date |
| `components/travel/flight-card.tsx` | Single flight: airline, route, date, check-in countdown, status badge |
| `components/travel/add-flight-dialog.tsx` | Form: airline picker, confirmation #, route, dates, miles paid, passenger, seat pref |
| `app/actions/flights.ts` | Server actions: `addFlight`, `updateFlight`, `removeFlight`, `getUpcomingFlights` |
| `lib/flights/airlines.ts` | Airline metadata: names, IATA codes, check-in window timing, colors |

**Modify:**

| File | Change |
|---|---|
| `components/travel/travel-client.tsx` | Add flight dashboard tab/section alongside existing search + bonuses |
| `packages/shared/src/types.ts` | Add `UserFlight`, `FlightStatus`, `Airline` types |

### Check-in Alert (Telegram)

Cron job on Hetzner (alongside Annie):
- Runs every 15 minutes
- Queries `upcoming_flights` view for flights where `hours_until_checkin` between 0 and 0.25 (check-in just opened)
- Sends Telegram message: "Check-in is NOW OPEN for your Southwest DTW→MCO flight tomorrow at 2:30 PM. Confirmation: ABC123."
- For Southwest, add urgency: "Check in NOW for the best boarding position!"

### Airline metadata

```typescript
const AIRLINES = {
  southwest: {
    name: 'Southwest',
    code: 'WN',
    checkinWindowHours: 24,
    awardCancellationFee: 0,
    awardCancellationPolicy: 'Free — points refund instantly',
    hasAssignedSeats: false,  // boarding position instead
    color: '#304CB2',
  },
  united: {
    name: 'United',
    code: 'UA',
    checkinWindowHours: 24,
    awardCancellationFee: 0,
    awardCancellationPolicy: 'Free — points redeposited',
    hasAssignedSeats: true,
    color: '#002244',
  },
  delta: {
    name: 'Delta',
    code: 'DL',
    checkinWindowHours: 24,
    awardCancellationFee: 0,
    awardCancellationPolicy: 'No fee on SkyMiles awards',
    hasAssignedSeats: true,
    color: '#003366',
  },
  frontier: {
    name: 'Frontier',
    code: 'F9',
    checkinWindowHours: 24,
    awardCancellationFee: null,  // varies
    awardCancellationPolicy: 'Varies by fare class',
    hasAssignedSeats: true,
    color: '#006847',
  },
} as const;
```

---

## Phase 2: Award Price Drop Monitoring

**Goal:** Monitor booked flights for award price drops. Alert when rebooking saves miles.
**Dependencies:** Seats.aero API key ($10/mo), Playwright for Southwest
**Effort:** ~3-4 days

### Monitoring approach per airline

**United + Delta — Seats.aero API:**
- Sign up for Seats.aero Pro ($10/mo, 1000 req/day)
- Cron job every 4 hours: for each booked United/Delta award flight, query Seats.aero for current award availability on that route + date
- Compare current price to `miles_paid`
- If current < paid → update `current_award_price`, send Telegram alert with savings calculation

**Southwest — Playwright scraper:**
- Southwest has zero API access. Fully walled off.
- Approach: Playwright hits southwest.com "manage reservation" page with confirmation # + passenger name
- Reads current Wanna Get Away / Wanna Get Away Plus price in points
- Compares to `miles_paid`
- If lower → alert: "Your SW DTW→MCO dropped from 12,400 to 8,200 pts. Cancel and rebook to save 4,200 Rapid Rewards points."
- Runs on Hetzner. At family scale (5-10 flights), this is <20 requests/day.

**Frontier — Duffel API (cash monitoring):**
- Frontier flights are mostly cash. Use Duffel to check current cash price.
- If price dropped → alert (Frontier allows some fare adjustments as travel credits)

### Price history

Store each price check result:

```sql
CREATE TABLE public.flight_price_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id UUID NOT NULL REFERENCES public.user_flights(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,              -- 'seats_aero', 'southwest_scraper', 'duffel'
  price_miles INTEGER,               -- award price in miles
  price_cash_cents INTEGER,          -- cash price in cents
  cabin_class TEXT,
  availability_count INTEGER,        -- number of seats at this price
  raw_response JSONB                 -- for debugging
);
```

This enables trend charts: "Your flight's award price over the last 2 weeks" — helps decide whether to rebook now or wait.

### Alert logic

Don't alert on every tiny fluctuation. Thresholds:

- **Southwest:** Alert if drop >= 500 points (even small drops are free to rebook)
- **United/Delta:** Alert if drop >= 2,000 miles (worth the 5 min to rebook)
- **Cash flights:** Alert if drop >= $20
- **Always alert** if price drops to historical low for that route

Alert includes:
- Current price vs. what you paid
- Savings in miles/points
- Estimated dollar value of savings (using Wayloft's CPP data from card portfolio)
- One-line instruction: "Log into united.com → My Trips → Cancel → Rebook"

---

## Phase 3: Auto Check-in + Seat Selection

**Goal:** Automatically check in at T-24h and select preferred seat.
**Dependencies:** Playwright on Hetzner, airline-specific automation scripts
**Effort:** ~1 week (Southwest first, then others)

### Priority order

1. **Southwest** — Most valuable. No assigned seats; boarding position depends on check-in speed. Checking in at exactly T-24h:00s vs T-24h:02m can be the difference between A15 and B30.
2. **United** — Auto check-in + select preferred seat from seat map
3. **Delta** — Same as United
4. **Frontier** — Same pattern, lower priority

### How it works

1. Cron on Hetzner fires every 30 seconds starting at T-24h:00s for the flight
2. Playwright opens airline check-in page
3. Enters confirmation # + passenger last name
4. Submits check-in
5. **Southwest:** Records boarding position (A/B/C + number)
6. **Others:** Navigates to seat selection, picks best available matching `seat_preference`
7. Updates `user_flights.checkin_completed_at` and `boarding_position`
8. Sends Telegram confirmation: "Checked in for DTW→MCO. Boarding position: A22"

### Credential requirements

| Airline | What's needed | Stored where |
|---|---|---|
| Southwest | Confirmation # + last name | `user_flights` table |
| United | Confirmation # + last name | `user_flights` table |
| Delta | Confirmation # + last name | `user_flights` table |
| Frontier | Confirmation # + last name | `user_flights` table |

No airline account passwords needed for basic check-in. Just confirmation number and name, which we already store.

### Anti-bot considerations

Airlines use bot detection (Akamai, Cloudflare). At family scale:
- Use real Chrome (not headless) with stealth flags
- Realistic timing (don't fire 0.1s after window opens — add 2-5s jitter)
- One check-in per execution (not batched)
- Residential IP (Hetzner may need a proxy for this — evaluate)

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│              Wayloft (Vercel)                │
│  Next.js app — flight dashboard, forms,     │
│  server actions, all UI                     │
│  Supabase — user_flights, price_checks      │
└──────────────────┬──────────────────────────┘
                   │ reads/writes via
                   │ Supabase JS client
                   │
┌──────────────────▼──────────────────────────┐
│           Hetzner Worker (Python)            │
│                                              │
│  Cron jobs:                                  │
│  ├── check_in_alerts.py    (every 15 min)   │
│  ├── price_monitor.py      (every 4 hours)  │
│  │   ├── seats_aero.py     (United/Delta)   │
│  │   ├── sw_scraper.py     (Southwest)      │
│  │   └── duffel_check.py   (Frontier/cash)  │
│  └── auto_checkin.py       (T-24h trigger)  │
│                                              │
│  Sends alerts via Telegram bot (Annie infra) │
└─────────────────────────────────────────────┘
```

---

## Open Questions (resolve during build)

1. **Family member model:** One Wayloft account with multiple passengers (simplest), or separate accounts? Recommendation: one account, `passenger_name` field on each flight. Family members don't need their own login.

2. **Seats.aero API specifics:** Does their API support querying a specific route+date+cabin for current award price? Or only broad availability search? Need to test after signing up.

3. **Southwest scraper reliability:** The "manage reservation" approach (check price on already-booked flight) vs. general search (check price on route/date). Manage reservation is simpler but requires an existing booking. General search works for route watching before booking.

4. **Hetzner infra:** Annie already runs there. Should the flight worker be a separate service or part of annie-intake? Recommendation: separate service, shared Telegram bot token.

5. **Price monitoring frequency:** Every 4 hours is 6 checks/day per flight. With 10-15 active flights, that's 60-90 checks. Well within Seats.aero's 1000/day limit. Southwest scraping should be less frequent (every 6-8 hours) to stay invisible.

6. **Notification preferences:** Always Telegram? Add email? Add push (if PWA)? Start with Telegram only (already works), add channels later.

---

## Success criteria

- [ ] Phase 1: Family adds flights and gets check-in reminders via Telegram
- [ ] Phase 2: At least one successful rebook-and-save from a price drop alert
- [ ] Phase 3: Southwest auto check-in gets an A-group boarding position
