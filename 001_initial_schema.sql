-- 001_initial_schema.sql
-- Wayloft v3.1 — Card-First Schema
-- Run this as the first migration in Supabase

-- ============================================
-- CORE: User Profiles
-- ============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  home_airport TEXT,
  alternate_airports TEXT[],
  preferred_cabin TEXT DEFAULT 'economy',
  preferred_airlines TEXT[],
  max_connections INTEGER DEFAULT 2,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- LOOP 1: Credit Card Portfolio + Lifecycle Management
-- ============================================

-- Which credit cards the user holds
-- Most fields auto-populate from credit-cards.json catalog on insert.
-- User only provides: card_slug (which card) + card_since (when they got it, optional).
-- The API endpoint looks up everything else from the catalog.
CREATE TABLE public.user_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Card identity (auto-populated from credit-cards.json on insert)
  card_slug TEXT NOT NULL,                        -- Lookup key into credit-cards.json
  card_name TEXT NOT NULL,                        -- Denormalized for query convenience
  issuer TEXT NOT NULL,
  currency TEXT NOT NULL,
  annual_fee_cents INTEGER DEFAULT 0 CHECK (annual_fee_cents >= 0),

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upgraded', 'downgraded', 'cancelled', 'product_changed')),

  -- USER-PROVIDED: when they got the card (optional, defaults to today)
  card_since DATE DEFAULT CURRENT_DATE,
  is_primary BOOLEAN DEFAULT false,

  -- Auto-calculated from credit-cards.json signup_bonus + card_since
  annual_fee_date DATE,                           -- = card_since anniversary (auto-set)
  af_reminder_days_before INTEGER DEFAULT 30,

  -- Auto-populated from credit-cards.json signup_bonus fields
  signup_bonus_points INTEGER CHECK (signup_bonus_points >= 0),  -- From catalog
  signup_spend_requirement_cents INTEGER CHECK (signup_spend_requirement_cents >= 0),  -- From catalog
  signup_spend_timeframe_months INTEGER,           -- From catalog
  signup_spend_deadline DATE,                      -- = card_since + timeframe (auto-calculated)

  -- USER-PROVIDED: only field user updates over time
  signup_spend_progress_cents INTEGER DEFAULT 0 CHECK (signup_spend_progress_cents >= 0),

  -- Auto-determined from card_since vs deadline
  signup_bonus_met BOOLEAN DEFAULT false,
  signup_bonus_earned BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_slug)
);

-- Auto-calculate derived fields on insert
CREATE OR REPLACE FUNCTION public.auto_populate_card_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate signup spend deadline from card_since + timeframe
  IF NEW.signup_spend_timeframe_months IS NOT NULL AND NEW.card_since IS NOT NULL THEN
    NEW.signup_spend_deadline := NEW.card_since + (NEW.signup_spend_timeframe_months || ' months')::INTERVAL;
  END IF;

  -- Set annual fee date to card anniversary
  IF NEW.card_since IS NOT NULL AND NEW.annual_fee_cents > 0 THEN
    NEW.annual_fee_date := NEW.card_since + INTERVAL '1 year';
  END IF;

  -- Auto-flip signup_bonus_met when spend progress meets or exceeds requirement
  IF NEW.signup_spend_requirement_cents IS NOT NULL
    AND NEW.signup_spend_progress_cents >= NEW.signup_spend_requirement_cents THEN
    NEW.signup_bonus_met := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_populate_card_on_insert
  BEFORE INSERT ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_card_fields();

CREATE TRIGGER auto_populate_card_on_update
  BEFORE UPDATE ON public.user_cards
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_card_fields();

-- Card lifecycle events (upgrades, downgrades, product changes, cancellations, retention offers)
CREATE TABLE public.card_lifecycle_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_card_id UUID REFERENCES public.user_cards(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'opened',            -- Card initially opened
    'product_change',    -- Changed to different card (e.g. CSR → CSP)
    'downgrade',         -- Downgraded to no-AF version
    'upgrade',           -- Upgraded to premium version
    'cancelled',         -- Card closed
    'retention_offer',   -- Called and received retention offer
    'retention_declined',-- Called but declined offer / no offer given
    'annual_fee_posted', -- AF posted to account
    'annual_fee_waived', -- AF waived (retention or first year)
    'signup_bonus_met',  -- Hit the minimum spend requirement
    'signup_bonus_earned'-- Points actually posted to account
  )),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- For product changes / upgrades / downgrades
  from_card_slug TEXT,
  to_card_slug TEXT,

  -- For retention offers
  retention_offer_type TEXT,       -- "statement_credit", "bonus_points", "af_waiver", "spending_bonus"
  retention_offer_value TEXT,      -- "$150 statement credit", "20,000 bonus MR", etc.
  retention_spend_requirement TEXT, -- "$2,000 in 3 months" if applicable

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty program balances (manual, extension, email, or partner-sourced)
CREATE TABLE public.loyalty_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  program_code TEXT NOT NULL,
  program_type TEXT NOT NULL CHECK (program_type IN ('credit_card', 'airline', 'hotel')),
  balance INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'extension', 'email', 'awardwallet')),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),

  -- Expiration tracking (works for ALL point types)
  expires_at DATE,                              -- When points expire (null = no expiration)
  expiration_policy TEXT,                        -- "no_expiration", "activity_based", "fixed_date", "annual_forfeiture"
  expiration_notes TEXT,                         -- "Points expire after 24 months of no activity"
  last_activity_date DATE,                       -- For activity-based programs, when was last earn/burn
  inactivity_months INTEGER,                     -- Auto-populated from transfer-partners.json on insert (e.g. IHG=12, UA=18, BA=36)

  tier_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_code)
);

-- Upcoming reminders (computed view for dashboard)
-- This view powers the "Action Items" widget on the dashboard
CREATE OR REPLACE VIEW public.upcoming_card_actions AS
SELECT
  uc.user_id,
  uc.id AS user_card_id,
  uc.card_name,
  uc.card_slug,
  uc.issuer,

  -- Signup bonus deadline
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

  -- Annual fee reminder (uses next_anniversary_date helper)
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
WHERE uc.status = 'active';

-- Points expiration alerts
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
  AND lb.expiration_policy != 'no_expiration';


-- ============================================
-- LOOP 2: Card Recommendation Engine
-- ============================================

CREATE TABLE public.card_quiz_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  travel_goal TEXT,
  monthly_dining_spend INTEGER,
  monthly_travel_spend INTEGER,
  monthly_grocery_spend INTEGER,
  monthly_gas_spend INTEGER,
  monthly_streaming_spend INTEGER,
  monthly_other_spend INTEGER,
  credit_score_range TEXT,
  cards_opened_24mo INTEGER DEFAULT 0,
  current_card_slugs TEXT[],
  annual_fee_comfort TEXT CHECK (annual_fee_comfort IN ('none', 'low', 'medium', 'high')),
  recommended_card_slugs TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate click tracking
CREATE TABLE public.affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  card_slug TEXT NOT NULL,
  source_page TEXT NOT NULL,
  affiliate_network TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- LOOP 3: Transfer Bonus Tracker
-- ============================================

CREATE TABLE public.transfer_bonuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank TEXT NOT NULL,
  currency TEXT NOT NULL,
  partner TEXT NOT NULL,
  partner_code TEXT NOT NULL,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('airline', 'hotel')),
  bonus_percentage INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  source_url TEXT,
  is_active BOOLEAN DEFAULT true,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bank, partner_code, start_date)
);

CREATE TABLE public.transfer_bonus_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank TEXT NOT NULL,
  currency TEXT NOT NULL,
  partner TEXT NOT NULL,
  partner_code TEXT NOT NULL,
  bonus_percentage INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (end_date - start_date) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- LOOP 4: Flight Search
-- ============================================

CREATE TABLE public.searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  passengers INTEGER DEFAULT 1,
  cabin_class TEXT DEFAULT 'economy',
  results_count INTEGER,
  best_price_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  flight_data JSONB NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  price_cents INTEGER,
  miles_price INTEGER,
  airline TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  cabin_class TEXT DEFAULT 'economy',
  target_price_cents INTEGER,
  current_price_cents INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- LOOP 5: Extension + Crowdsourced Data
-- ============================================

CREATE TABLE public.crowdsourced_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  program TEXT NOT NULL,
  cabin_class TEXT NOT NULL,
  miles_price INTEGER,
  taxes_cents INTEGER,
  seats_available INTEGER,
  is_saver BOOLEAN,
  contributed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contributed_at TIMESTAMPTZ DEFAULT NOW(),
  confidence_score FLOAT DEFAULT 1.0,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours'
);

CREATE TABLE public.email_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  last_parsed_at TIMESTAMPTZ,
  programs_detected TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- SEMI-PRIVATE FLIGHTS
-- ============================================

CREATE TABLE public.semi_private_flights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMPTZ,
  arrival_time TIMESTAMPTZ,
  price_cents INTEGER,
  aircraft_type TEXT,
  seats_available INTEGER,
  booking_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);


-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE public.notification_preferences (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_bonus_alerts BOOLEAN DEFAULT true,
  email_price_alerts BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT true,
  push_bonus_alerts BOOLEAN DEFAULT true,
  push_price_alerts BOOLEAN DEFAULT true,
  bonus_banks TEXT[] DEFAULT ARRAY['chase','amex','citi','capital_one','bilt'],
  bonus_min_percentage INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crowdsourced_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- User's own data
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users manage own cards" ON public.user_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own lifecycle events" ON public.card_lifecycle_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own balances" ON public.loyalty_balances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own quiz" ON public.card_quiz_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own searches" ON public.searches FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own alerts" ON public.alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own email connections" ON public.email_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notifications" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Affiliate clicks: users can insert, admins can read all
CREATE POLICY "Users insert own affiliate clicks" ON public.affiliate_clicks FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Transfer bonus history (public read)
ALTER TABLE public.transfer_bonus_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views bonus history" ON public.transfer_bonus_history FOR SELECT USING (true);

-- Public data
CREATE POLICY "Anyone views active bonuses" ON public.transfer_bonuses FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone views crowdsourced availability" ON public.crowdsourced_availability FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Authenticated users contribute availability" ON public.crowdsourced_availability FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone views semi-private flights" ON public.semi_private_flights FOR SELECT USING (is_active = true);


-- ============================================
-- INDEXES
-- ============================================

-- Card portfolio & lifecycle
CREATE INDEX idx_user_cards_user ON public.user_cards(user_id);
CREATE INDEX idx_user_cards_issuer ON public.user_cards(user_id, issuer);
CREATE INDEX idx_user_cards_status ON public.user_cards(user_id, status) WHERE status = 'active';
CREATE INDEX idx_user_cards_signup_deadline ON public.user_cards(signup_spend_deadline) WHERE signup_bonus_met = false;
CREATE INDEX idx_user_cards_af_date ON public.user_cards(annual_fee_date) WHERE status = 'active' AND annual_fee_cents > 0;
CREATE INDEX idx_lifecycle_user ON public.card_lifecycle_events(user_id);
CREATE INDEX idx_lifecycle_card ON public.card_lifecycle_events(user_card_id);
CREATE INDEX idx_lifecycle_type ON public.card_lifecycle_events(user_id, event_type);
CREATE INDEX idx_balances_user ON public.loyalty_balances(user_id);
CREATE INDEX idx_balances_currency ON public.loyalty_balances(user_id, currency);
CREATE INDEX idx_balances_expiring ON public.loyalty_balances(expires_at) WHERE expires_at IS NOT NULL AND balance > 0;

-- Quiz & affiliates
CREATE INDEX idx_quiz_user ON public.card_quiz_responses(user_id);
CREATE INDEX idx_affiliate_clicks_card ON public.affiliate_clicks(card_slug);
CREATE INDEX idx_affiliate_clicks_time ON public.affiliate_clicks(clicked_at);

-- Transfer bonuses
CREATE INDEX idx_bonuses_active ON public.transfer_bonuses(is_active, bank) WHERE is_active = true;
CREATE INDEX idx_bonus_history_bank ON public.transfer_bonus_history(bank, partner_code);

-- Flights
CREATE INDEX idx_searches_user ON public.searches(user_id);
CREATE INDEX idx_searches_route ON public.searches(origin, destination);
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_alerts_active ON public.alerts(is_active) WHERE is_active = true;

-- Crowdsourced
CREATE INDEX idx_crowdsourced_route ON public.crowdsourced_availability(origin, destination, departure_date);
CREATE INDEX idx_crowdsourced_expiry ON public.crowdsourced_availability(expires_at);
CREATE INDEX idx_crowdsourced_confidence ON public.crowdsourced_availability(confidence_score DESC);


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate next anniversary date from a card_since date
CREATE OR REPLACE FUNCTION public.next_anniversary_date(card_since DATE)
RETURNS DATE AS $$
BEGIN
  RETURN CASE
    WHEN (DATE_TRUNC('year', CURRENT_DATE) + (card_since - DATE_TRUNC('year', card_since))) >= CURRENT_DATE
    THEN (DATE_TRUNC('year', CURRENT_DATE) + (card_since - DATE_TRUNC('year', card_since)))::DATE
    ELSE (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' + (card_since - DATE_TRUNC('year', card_since)))::DATE
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_user_cards_updated_at BEFORE UPDATE ON public.user_cards FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_balances_updated_at BEFORE UPDATE ON public.loyalty_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_quiz_updated_at BEFORE UPDATE ON public.card_quiz_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_notifications_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
