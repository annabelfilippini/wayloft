-- 002_issuer_rules_user_data.sql
-- Adds fields required by the issuer rules / recommendation engine.
-- See Research/issuer-rules-database.md Section 14 (Data Collection Requirements).

-- ============================================
-- 1. PROFILES: add state of residence
-- ============================================
-- Needed for: bureau pull map, SOT compliance, state-specific rules
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS state_of_residence TEXT;

COMMENT ON COLUMN public.profiles.state_of_residence IS 'US state code (e.g. MI, CA). Powers bureau pull map and SOT compliance.';


-- ============================================
-- 2. USER_CARDS: add bonus posted date
-- ============================================
-- Needed for: 48-month cooldowns, lifetime/7-year checks, cross-issuer restrictions
-- The boolean signup_bonus_earned exists; this adds the actual date for cooldown math.
ALTER TABLE public.user_cards
  ADD COLUMN IF NOT EXISTS signup_bonus_posted_at DATE;

COMMENT ON COLUMN public.user_cards.signup_bonus_posted_at IS 'Date the signup bonus actually posted. Used for cooldown calculations (Chase 48mo, Amex lifetime, Citi 48mo, etc).';


-- ============================================
-- 3. USER_CARDS: add card closed date
-- ============================================
-- Needed for: Barclays 24-month (counts from closure), Citi 48-month (also checks closure)
ALTER TABLE public.user_cards
  ADD COLUMN IF NOT EXISTS closed_at DATE;

COMMENT ON COLUMN public.user_cards.closed_at IS 'Date the card was closed. Used by Barclays 24mo (counts from closure) and Citi 48mo restriction.';


-- ============================================
-- 4. CREDIT PROFILE: hard inquiries + velocity tracking
-- ============================================
-- Needed for: Citi 6/6, US Bank inquiry sensitivity, Barclays 6/24,
--   Chase 5/24, BofA 7/12, overall application order optimization.
-- Tracks cards opened across ALL issuers (not just our 52-card catalog).

CREATE TABLE IF NOT EXISTS public.user_credit_profile (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,

  -- 5/24 and velocity tracking: total cards opened across all issuers
  cards_opened_6mo INTEGER DEFAULT 0 CHECK (cards_opened_6mo >= 0),
  cards_opened_12mo INTEGER DEFAULT 0 CHECK (cards_opened_12mo >= 0),
  cards_opened_24mo INTEGER DEFAULT 0 CHECK (cards_opened_24mo >= 0),

  -- Hard inquiry tracking
  hard_inquiries_6mo INTEGER DEFAULT 0 CHECK (hard_inquiries_6mo >= 0),
  hard_inquiries_12mo INTEGER DEFAULT 0 CHECK (hard_inquiries_12mo >= 0),

  -- Credit score range (self-reported or from credit report)
  credit_score_range TEXT CHECK (credit_score_range IN (
    'excellent',  -- 750+
    'good',       -- 700-749
    'fair',       -- 650-699
    'poor'        -- <650
  )),

  -- Data source: how this data was obtained
  data_source TEXT DEFAULT 'self_report' CHECK (data_source IN (
    'self_report',     -- User entered manually
    'credit_report',   -- Imported from credit report
    'extension'        -- Captured by browser extension
  )),

  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_credit_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own credit profile"
  ON public.user_credit_profile FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER set_credit_profile_updated_at
  BEFORE UPDATE ON public.user_credit_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.user_credit_profile IS 'User credit profile for issuer rule checks. Tracks cards opened (all issuers), hard inquiries, and credit score.';


-- ============================================
-- 5. BANKING RELATIONSHIPS
-- ============================================
-- Needed for: US Bank relationship preference, BofA Preferred Rewards boost
CREATE TABLE IF NOT EXISTS public.user_banking_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  bank_id TEXT NOT NULL,       -- matches issuer id in issuer-rules.json (e.g. 'us_bank', 'boa')
  bank_name TEXT NOT NULL,     -- display name
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'checking', 'savings', 'investment', 'mortgage', 'other'
  )),

  -- BofA Preferred Rewards: investment balance determines tier
  balance_tier TEXT CHECK (balance_tier IN (
    'none',             -- No tier / not applicable
    'gold',             -- BofA: $20k+
    'platinum',         -- BofA: $50k+
    'platinum_honors'   -- BofA: $100k+
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, bank_id, relationship_type)
);

ALTER TABLE public.user_banking_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own banking relationships"
  ON public.user_banking_relationships FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER set_banking_relationships_updated_at
  BEFORE UPDATE ON public.user_banking_relationships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_banking_rel_user ON public.user_banking_relationships(user_id);
CREATE INDEX idx_banking_rel_bank ON public.user_banking_relationships(user_id, bank_id);

COMMENT ON TABLE public.user_banking_relationships IS 'Banking relationships that affect card approval odds (US Bank) and rewards tiers (BofA Preferred Rewards).';


-- ============================================
-- 6. EXTERNAL CARDS (non-catalog cards for 5/24 counting)
-- ============================================
-- user_cards only tracks our 52-card catalog. But 5/24/Barclays 6/24/BofA 7/12
-- count ALL cards from ALL issuers, including store cards, cards we don't track, etc.
-- This table captures those "other" cards for accurate velocity counting.

CREATE TABLE IF NOT EXISTS public.user_external_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  card_name TEXT NOT NULL,           -- free text, e.g. "Target RedCard", "Apple Card"
  issuer TEXT,                       -- optional, e.g. "synchrony", "goldman_sachs"
  is_business BOOLEAN DEFAULT false, -- business cards may not count for 5/24
  opened_at DATE NOT NULL,           -- when the card was opened (for velocity counting)
  closed_at DATE,                    -- when closed (for Barclays/Citi closure-based rules)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_external_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own external cards"
  ON public.user_external_cards FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER set_external_cards_updated_at
  BEFORE UPDATE ON public.user_external_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_external_cards_user ON public.user_external_cards(user_id);
CREATE INDEX idx_external_cards_opened ON public.user_external_cards(user_id, opened_at);

COMMENT ON TABLE public.user_external_cards IS 'Cards not in our 52-card catalog, for accurate 5/24 and velocity counting across all issuers.';
