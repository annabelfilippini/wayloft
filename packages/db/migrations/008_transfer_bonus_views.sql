-- 008_transfer_bonus_views.sql
-- Active transfer bonuses ending within 14 days (powers dashboard widget)
-- Paste into Supabase Dashboard SQL Editor

CREATE OR REPLACE VIEW public.active_transfer_bonuses_ending_soon AS
SELECT
  tb.*,
  (tb.end_date - CURRENT_DATE) AS days_remaining,
  CASE
    WHEN (tb.end_date - CURRENT_DATE) <= 2 THEN 'critical'
    WHEN (tb.end_date - CURRENT_DATE) <= 7 THEN 'warning'
    ELSE 'info'
  END AS urgency
FROM public.transfer_bonuses tb
WHERE tb.is_active = true
  AND tb.end_date IS NOT NULL
  AND tb.end_date >= CURRENT_DATE
  AND tb.end_date - CURRENT_DATE <= 14;
