-- 003_statement_credits.sql
-- Statement credit tracking: per-period usage, enrollment, expiration alerts

-- ── Table: user_credit_usage ──
CREATE TABLE IF NOT EXISTS public.user_credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_card_id UUID NOT NULL REFERENCES public.user_cards(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL,
  credit_name TEXT NOT NULL,
  credit_amount_cents INT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'card_year')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_used_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'partial', 'used', 'expired')),
  enrollment_required BOOLEAN NOT NULL DEFAULT false,
  enrolled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by user + card
CREATE INDEX IF NOT EXISTS idx_user_credit_usage_user_card
  ON public.user_credit_usage(user_id, user_card_id);

-- Index for expiration queries
CREATE INDEX IF NOT EXISTS idx_user_credit_usage_status_period_end
  ON public.user_credit_usage(status, period_end);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_user_credit_usage
  BEFORE UPDATE ON public.user_credit_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ──
ALTER TABLE public.user_credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit usage"
  ON public.user_credit_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own credit usage"
  ON public.user_credit_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own credit usage"
  ON public.user_credit_usage FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own credit usage"
  ON public.user_credit_usage FOR DELETE
  USING (user_id = auth.uid());

-- ── View: expiring_credits ──
-- Surfaces credits expiring within 30 days for dashboard action items
CREATE OR REPLACE VIEW public.expiring_credits AS
SELECT
  ucu.id,
  ucu.user_id,
  ucu.user_card_id,
  uc.card_name,
  uc.card_slug,
  uc.issuer,
  ucu.credit_type,
  ucu.credit_name,
  ucu.credit_amount_cents,
  ucu.amount_used_cents,
  (ucu.credit_amount_cents - ucu.amount_used_cents) AS remaining_cents,
  ucu.period,
  ucu.period_start,
  ucu.period_end,
  ucu.status,
  ucu.enrollment_required,
  ucu.enrolled,
  (ucu.period_end - CURRENT_DATE) AS days_until_expiration,
  CASE
    WHEN (ucu.period_end - CURRENT_DATE) <= 14 THEN 'critical'
    WHEN (ucu.period_end - CURRENT_DATE) <= 30 THEN 'warning'
    ELSE 'info'
  END AS urgency
FROM public.user_credit_usage ucu
JOIN public.user_cards uc ON uc.id = ucu.user_card_id
WHERE ucu.status IN ('available', 'partial');
