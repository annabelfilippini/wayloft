-- Migration 011: User Flights for flight lifecycle tracking
-- Phase 1: dashboard + check-in alerts

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

  -- Price monitoring (Phase 2 — columns present, unused for now)
  current_award_price INTEGER,
  lowest_seen_price INTEGER,
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

-- Partial unique index: one active entry per user + airline + confirmation
CREATE UNIQUE INDEX user_flights_unique_active
  ON public.user_flights (user_id, airline, confirmation_number)
  WHERE deleted_at IS NULL;

-- Index for upcoming flights queries
CREATE INDEX user_flights_departure
  ON public.user_flights (user_id, departure_at)
  WHERE deleted_at IS NULL;

-- View: upcoming flights with check-in countdown and status
CREATE OR REPLACE VIEW public.upcoming_flights AS
SELECT
  f.id,
  f.user_id,
  f.airline,
  f.confirmation_number,
  f.origin,
  f.destination,
  f.departure_at,
  f.arrival_at,
  f.return_departure_at,
  f.return_arrival_at,
  f.passenger_name,
  f.booking_type,
  f.miles_paid,
  f.cash_paid_cents,
  f.points_program,
  f.cabin_class,
  f.seat_preference,
  f.preferred_seat_number,
  f.checkin_opens_at,
  f.checkin_completed_at,
  f.boarding_position,
  f.current_award_price,
  f.lowest_seen_price,
  f.price_last_checked_at,
  f.notes,
  f.created_at,
  f.updated_at,
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
