-- 010_soft_delete.sql
-- Soft delete support for user_cards, user_payment_info, and loyalty_balances
-- Converts hard deletes to soft deletes (set deleted_at instead of DELETE)
-- Paste into Supabase Dashboard SQL Editor

-- ============================================
-- 1. ADD deleted_at COLUMNS
-- ============================================

ALTER TABLE public.user_cards
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.user_payment_info
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.loyalty_balances
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;


-- ============================================
-- 2. REPLACE UNIQUE CONSTRAINTS WITH PARTIAL INDEXES
-- Allows re-adding a previously soft-deleted card/balance
-- ============================================

-- user_cards: UNIQUE(user_id, card_slug) → partial unique on active rows only
ALTER TABLE public.user_cards
  DROP CONSTRAINT IF EXISTS user_cards_user_id_card_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_cards_user_id_card_slug_active
  ON public.user_cards(user_id, card_slug)
  WHERE deleted_at IS NULL;

-- loyalty_balances: UNIQUE(user_id, program_code) → partial unique on active rows only
ALTER TABLE public.loyalty_balances
  DROP CONSTRAINT IF EXISTS loyalty_balances_user_id_program_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_balances_user_id_program_code_active
  ON public.loyalty_balances(user_id, program_code)
  WHERE deleted_at IS NULL;

-- user_payment_info: UNIQUE(user_id, user_card_id) → partial unique on active rows only
ALTER TABLE public.user_payment_info
  DROP CONSTRAINT IF EXISTS unique_user_card_payment;
CREATE UNIQUE INDEX IF NOT EXISTS user_payment_info_user_card_active
  ON public.user_payment_info(user_id, user_card_id)
  WHERE deleted_at IS NULL;


-- ============================================
-- 3. INDEXES FOR SOFT DELETE FILTERING
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_cards_not_deleted
  ON public.user_cards(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_loyalty_balances_not_deleted
  ON public.loyalty_balances(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_payment_info_not_deleted
  ON public.user_payment_info(user_id)
  WHERE deleted_at IS NULL;


-- ============================================
-- 4. RECREATE ALL VIEWS TO FILTER deleted_at IS NULL
-- ============================================

-- 4a. upcoming_card_actions (from 001)
CREATE OR REPLACE VIEW public.upcoming_card_actions AS
SELECT
  uc.user_id,
  uc.id AS user_card_id,
  uc.card_name,
  uc.card_slug,
  uc.issuer,
  CASE
    WHEN uc.signup_bonus_met = false
      AND uc.signup_spend_deadline IS NOT NULL
      AND uc.signup_spend_deadline > CURRENT_DATE
    THEN jsonb_build_object(
      'type', 'signup_spend',
      'urgency', CASE
        WHEN uc.signup_spend_deadline - CURRENT_DATE <= 14 THEN 'critical'
        WHEN uc.signup_spend_deadline - CURRENT_DATE <= 30 THEN 'warning'
        ELSE 'info'
      END,
      'days_remaining', uc.signup_spend_deadline - CURRENT_DATE,
      'spend_remaining_cents', GREATEST(uc.signup_spend_requirement_cents - uc.signup_spend_progress_cents, 0),
      'spend_total_cents', uc.signup_spend_requirement_cents,
      'bonus_points', uc.signup_bonus_points,
      'deadline', uc.signup_spend_deadline
    )
    ELSE NULL
  END AS signup_action,
  CASE
    WHEN uc.annual_fee_date IS NOT NULL
      AND uc.annual_fee_cents > 0
      AND uc.status = 'active'
      AND public.next_anniversary_date(uc.annual_fee_date) - CURRENT_DATE <= uc.af_reminder_days_before
    THEN jsonb_build_object(
      'type', 'annual_fee',
      'urgency', CASE
        WHEN public.next_anniversary_date(uc.annual_fee_date) - CURRENT_DATE <= 7 THEN 'critical'
        WHEN public.next_anniversary_date(uc.annual_fee_date) - CURRENT_DATE <= 14 THEN 'warning'
        ELSE 'info'
      END,
      'annual_fee_cents', uc.annual_fee_cents,
      'card_name', uc.card_name
    )
    ELSE NULL
  END AS af_action
FROM public.user_cards uc
WHERE uc.status = 'active'
  AND uc.deleted_at IS NULL;


-- 4b. expiring_points (from 001)
CREATE OR REPLACE VIEW public.expiring_points AS
SELECT
  lb.user_id,
  lb.id AS balance_id,
  lb.program_name,
  lb.program_code,
  lb.balance,
  lb.currency,
  lb.expires_at,
  lb.expiration_policy,
  lb.last_activity_date,
  CASE
    WHEN lb.expiration_policy = 'fixed_date' AND lb.expires_at IS NOT NULL THEN
      lb.expires_at - CURRENT_DATE
    WHEN lb.expiration_policy = 'activity_based' AND lb.last_activity_date IS NOT NULL AND lb.inactivity_months IS NOT NULL THEN
      (lb.last_activity_date + (lb.inactivity_months || ' months')::INTERVAL)::DATE - CURRENT_DATE
    ELSE NULL
  END AS days_until_expiration,
  CASE
    WHEN lb.expiration_policy = 'fixed_date' AND lb.expires_at IS NOT NULL AND lb.expires_at - CURRENT_DATE <= 30 THEN 'critical'
    WHEN lb.expiration_policy = 'fixed_date' AND lb.expires_at IS NOT NULL AND lb.expires_at - CURRENT_DATE <= 90 THEN 'warning'
    WHEN lb.expiration_policy = 'activity_based' AND lb.last_activity_date IS NOT NULL AND lb.inactivity_months IS NOT NULL
      AND (lb.last_activity_date + (lb.inactivity_months || ' months')::INTERVAL)::DATE - CURRENT_DATE <= 30 THEN 'critical'
    WHEN lb.expiration_policy = 'activity_based' AND lb.last_activity_date IS NOT NULL AND lb.inactivity_months IS NOT NULL
      AND (lb.last_activity_date + (lb.inactivity_months || ' months')::INTERVAL)::DATE - CURRENT_DATE <= 90 THEN 'warning'
    ELSE 'ok'
  END AS urgency
FROM public.loyalty_balances lb
WHERE lb.balance > 0
  AND lb.expiration_policy IS NOT NULL
  AND lb.expiration_policy != 'no_expiration'
  AND lb.deleted_at IS NULL;


-- 4c. expiring_credits (from 003)
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
WHERE ucu.status IN ('available', 'partial')
  AND uc.deleted_at IS NULL;


-- 4d. unused_perks (from 004)
CREATE OR REPLACE VIEW public.unused_perks AS
SELECT
  ups.id,
  ups.user_id,
  ups.user_card_id,
  uc.card_name,
  uc.card_slug,
  ups.perk_id,
  ups.perk_name,
  ups.category,
  ups.perk_type,
  ups.status,
  ups.estimated_annual_value_cents,
  ups.created_at,
  CASE
    WHEN ups.perk_type = 'enrollment_required' THEN 'warning'
    WHEN ups.perk_type = 'one_time_setup' THEN 'info'
    ELSE 'info'
  END AS urgency
FROM public.user_perk_setup ups
JOIN public.user_cards uc ON uc.id = ups.user_card_id
WHERE ups.status IN ('not_started', 'in_progress')
  AND ups.perk_type IN ('one_time_setup', 'enrollment_required')
  AND uc.deleted_at IS NULL;


-- 4e. upcoming_payments (from 005)
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
WHERE uc.status = 'active'
  AND uc.deleted_at IS NULL
  AND upi.deleted_at IS NULL;


-- 4f. cards_missing_autopay (from 005)
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
  ON upi.user_card_id = uc.id AND upi.user_id = uc.user_id AND upi.deleted_at IS NULL
WHERE uc.status = 'active'
  AND uc.deleted_at IS NULL
  AND (upi.id IS NULL OR upi.autopay_enabled = false);
