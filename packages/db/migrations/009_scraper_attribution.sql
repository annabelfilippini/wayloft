-- Migration 009: Scraper Attribution
-- Adds retrieved_at and confidence to transfer_bonuses and transfer_bonus_history
-- for extraction-and-attribution rule compliance.

-- ── transfer_bonuses ──

ALTER TABLE public.transfer_bonuses
  ADD COLUMN IF NOT EXISTS retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1);

-- Backfill existing rows: set retrieved_at = scraped_at (best available proxy)
UPDATE public.transfer_bonuses
SET retrieved_at = scraped_at
WHERE retrieved_at IS NULL AND scraped_at IS NOT NULL;

-- ── transfer_bonus_history ──

ALTER TABLE public.transfer_bonus_history
  ADD COLUMN IF NOT EXISTS retrieved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1);
