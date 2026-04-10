-- Migration 012: Add checkin_alerted_at for duplicate alert suppression
-- Tracks when a check-in alert was sent so the cron never double-alerts

ALTER TABLE public.user_flights
  ADD COLUMN checkin_alerted_at TIMESTAMPTZ;

-- Must DROP + CREATE (not CREATE OR REPLACE) because column order changed
DROP VIEW IF EXISTS public.upcoming_flights;

CREATE VIEW public.upcoming_flights AS
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
  f.checkin_alerted_at,
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
