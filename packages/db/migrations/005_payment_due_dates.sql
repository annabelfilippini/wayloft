-- 005_payment_due_dates.sql
-- Payment due date tracking: due day, autopay status, upcoming payment views

-- ── Table: user_payment_info ──
CREATE TABLE IF NOT EXISTS public.user_payment_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_card_id UUID NOT NULL REFERENCES public.user_cards(id) ON DELETE CASCADE,
  card_slug TEXT NOT NULL,
  due_day INT NOT NULL CHECK (due_day >= 1 AND due_day <= 28),
  autopay_enabled BOOLEAN NOT NULL DEFAULT false,
  autopay_type TEXT NOT NULL DEFAULT 'none' CHECK (autopay_type IN ('full_balance', 'minimum', 'fixed_amount', 'none')),
  minimum_payment_cents INT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_card_payment UNIQUE (user_id, user_card_id)
);

-- Index for fast lookups by user + card
CREATE INDEX IF NOT EXISTS idx_user_payment_info_user_card
  ON public.user_payment_info(user_id, user_card_id);

-- Index for due day queries (dashboard upcoming payments)
CREATE INDEX IF NOT EXISTS idx_user_payment_info_user_due_day
  ON public.user_payment_info(user_id, due_day);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_user_payment_info
  BEFORE UPDATE ON public.user_payment_info
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ──
ALTER TABLE public.user_payment_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment info"
  ON public.user_payment_info FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment info"
  ON public.user_payment_info FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment info"
  ON public.user_payment_info FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own payment info"
  ON public.user_payment_info FOR DELETE
  USING (user_id = auth.uid());

-- ── View: upcoming_payments ──
-- Calculates next due date and days until due for each card with payment info
CREATE OR REPLACE VIEW public.upcoming_payments AS
SELECT
  upi.id,
  upi.user_id,
  upi.user_card_id,
  uc.card_name,
  uc.card_slug,
  uc.issuer,
  upi.due_day,
  upi.autopay_enabled,
  upi.autopay_type,
  upi.minimum_payment_cents,
  upi.notes,
  -- Calculate next due date
  CASE
    WHEN EXTRACT(DAY FROM CURRENT_DATE) < upi.due_day
      THEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::INT,
        EXTRACT(MONTH FROM CURRENT_DATE)::INT,
        upi.due_day
      )
    ELSE make_date(
        EXTRACT(YEAR FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
        EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
        upi.due_day
      )
  END AS next_due_date,
  -- Calculate days until due
  CASE
    WHEN EXTRACT(DAY FROM CURRENT_DATE) < upi.due_day
      THEN make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::INT,
        EXTRACT(MONTH FROM CURRENT_DATE)::INT,
        upi.due_day
      ) - CURRENT_DATE
    ELSE make_date(
        EXTRACT(YEAR FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
        EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
        upi.due_day
      ) - CURRENT_DATE
  END AS days_until_due,
  -- Urgency level
  CASE
    WHEN upi.autopay_enabled THEN 'info'
    WHEN CASE
           WHEN EXTRACT(DAY FROM CURRENT_DATE) < upi.due_day
             THEN make_date(
               EXTRACT(YEAR FROM CURRENT_DATE)::INT,
               EXTRACT(MONTH FROM CURRENT_DATE)::INT,
               upi.due_day
             ) - CURRENT_DATE
           ELSE make_date(
               EXTRACT(YEAR FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
               EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
               upi.due_day
             ) - CURRENT_DATE
         END <= 3 THEN 'critical'
    WHEN CASE
           WHEN EXTRACT(DAY FROM CURRENT_DATE) < upi.due_day
             THEN make_date(
               EXTRACT(YEAR FROM CURRENT_DATE)::INT,
               EXTRACT(MONTH FROM CURRENT_DATE)::INT,
               upi.due_day
             ) - CURRENT_DATE
           ELSE make_date(
               EXTRACT(YEAR FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
               EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 month'))::INT,
               upi.due_day
             ) - CURRENT_DATE
         END <= 7 THEN 'warning'
    ELSE 'info'
  END AS urgency
FROM public.user_payment_info upi
JOIN public.user_cards uc ON uc.id = upi.user_card_id
WHERE uc.status = 'active';

-- ── View: cards_missing_autopay ──
-- Surfaces active cards where payment info is missing or autopay is off
CREATE OR REPLACE VIEW public.cards_missing_autopay AS
SELECT
  uc.id AS user_card_id,
  uc.user_id,
  uc.card_name,
  uc.card_slug,
  uc.issuer,
  CASE
    WHEN upi.id IS NULL THEN 'no_payment_info'
    ELSE 'no_autopay'
  END AS reason
FROM public.user_cards uc
LEFT JOIN public.user_payment_info upi
  ON upi.user_card_id = uc.id AND upi.user_id = uc.user_id
WHERE uc.status = 'active'
  AND (upi.id IS NULL OR upi.autopay_enabled = false);
