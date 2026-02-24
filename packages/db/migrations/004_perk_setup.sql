-- 004_perk_setup.sql
-- Perk setup tracking: boolean activation status for non-monetary card benefits

-- ── Table: user_perk_setup ──
CREATE TABLE IF NOT EXISTS public.user_perk_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_card_id UUID NOT NULL REFERENCES public.user_cards(id) ON DELETE CASCADE,
  card_slug TEXT NOT NULL,
  perk_id TEXT NOT NULL,
  perk_name TEXT NOT NULL,
  category TEXT NOT NULL,
  perk_type TEXT NOT NULL CHECK (perk_type IN ('always_on', 'one_time_setup', 'enrollment_required', 'periodic_activation')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'not_applicable')),
  completed_at TIMESTAMPTZ,
  renewal_due DATE,
  notes TEXT,
  estimated_annual_value_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_card_perk UNIQUE (user_id, user_card_id, perk_id)
);

-- Index for fast lookups by user + card
CREATE INDEX IF NOT EXISTS idx_user_perk_setup_user_card
  ON public.user_perk_setup(user_id, user_card_id);

-- Index for unused perks queries
CREATE INDEX IF NOT EXISTS idx_user_perk_setup_user_status
  ON public.user_perk_setup(user_id, status);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_user_perk_setup
  BEFORE UPDATE ON public.user_perk_setup
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ── RLS ──
ALTER TABLE public.user_perk_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own perk setup"
  ON public.user_perk_setup FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own perk setup"
  ON public.user_perk_setup FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own perk setup"
  ON public.user_perk_setup FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own perk setup"
  ON public.user_perk_setup FOR DELETE
  USING (user_id = auth.uid());

-- ── View: unused_perks ──
-- Surfaces perks that need setup for dashboard action items
-- Only shows actionable perks (one_time_setup / enrollment_required) that aren't done
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
  AND ups.perk_type IN ('one_time_setup', 'enrollment_required');
