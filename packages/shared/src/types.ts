// Core Wayloft types — expand as features are built

export type Currency = "UR" | "MR" | "TYP" | "C1" | "BILT" | "WF" | "ALTITUDE";

export type Issuer =
  | "chase"
  | "amex"
  | "citi"
  | "capital_one"
  | "bilt"
  | "wells_fargo"
  | "barclays"
  | "us_bank"
  | "bank_of_america";

export type Network = "visa" | "mastercard" | "amex";

export interface TransferPartner {
  name: string;
  code: string;
  type: "airline" | "hotel";
  ratio: number;
  cpp_valuation: number | null;
}

export interface CatalogCredit {
  name: string;
  type: string;
  amount_cents: number;
  period: "monthly" | "quarterly" | "semi_annual" | "annual" | "card_year";
  monthly_cap_cents?: number;
  enrollment_required: boolean;
  merchants: string[];
  gotchas?: string;
}

// ── Perks & Benefits ──

export type PerkCategory = "travel" | "insurance" | "lifestyle" | "financial" | "dining" | "status";
export type PerkType = "always_on" | "one_time_setup" | "enrollment_required" | "periodic_activation";
export type PerkSetupStatus = "not_started" | "in_progress" | "completed" | "not_applicable";

export interface CatalogPerk {
  id: string;
  name: string;
  category: PerkCategory;
  type: PerkType;
  description: string;
  setup_instructions: string | null;
  estimated_annual_value_cents: number;
  enrollment_required: boolean;
  renewal: "annual" | "every_4_years" | null;
}

export interface UserPerkSetup {
  id: string;
  user_id: string;
  user_card_id: string;
  card_slug: string;
  perk_id: string;
  perk_name: string;
  category: string;
  perk_type: PerkType;
  status: PerkSetupStatus;
  completed_at: string | null;
  renewal_due: string | null;
  notes: string | null;
  estimated_annual_value_cents: number;
  created_at: string;
  updated_at: string;
}

// ── Experience Level ──

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

// ── Payment Due Dates ──

export type AutopayType = "full_balance" | "minimum" | "fixed_amount" | "none";

export interface CatalogPaymentInfo {
  autopay_url: string;
  payment_url: string;
  grace_period_days: number;
  late_fee_cents: number;
}

export interface UserPaymentInfo {
  id: string;
  user_id: string;
  user_card_id: string;
  card_slug: string;
  due_day: number; // 1-28
  autopay_enabled: boolean;
  autopay_type: AutopayType;
  minimum_payment_cents: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Card Editorial (SEO review pages) ──

export interface CardEditorial {
  tagline: string;
  pros: string[];
  cons: string[];
  verdict: string;
  rating?: number; // 1-5, triggers schema.org/Review
  updated_at?: string; // ISO date
}

// ── AF Decision Helper ──

export interface DowngradeOption {
  to_card_slug: string;
  to_card_name: string;
  annual_fee_cents: number;
  preserves_points: boolean;
  preserves_credit_line: boolean;
  what_you_lose: string[];
  what_you_keep: string[];
}

export interface RetentionOffer {
  type: "statement_credit" | "bonus_points" | "reduced_fee" | "spend_bonus";
  typical_value_cents: number;
  typical_spend_requirement_cents: number;
}

export interface RetentionData {
  common_offers: RetentionOffer[];
  best_time_to_call: string;
  success_rate_estimate: "low" | "moderate" | "high";
  phone_number?: string;
}

// Matches the shape of data/credit-cards.json entries
export interface CatalogCard {
  slug: string;
  name: string;
  issuer: string;
  currency: Currency;
  network: Network;
  annual_fee_cents: number;
  signup_bonus: {
    points: number;
    spend_requirement_cents: number;
    timeframe_months: number;
  };
  earning_rates: Record<string, number>;
  earning_caps: Array<{ category: string; limit_cents: number; period: string }>;
  portal_cpp: number;
  key_perks: string[];
  best_for: string[];
  credit_score_min: string;
  card_art_url: string;
  application_url: string;
  credits?: CatalogCredit[];
  perks?: CatalogPerk[];
  downgrade_options?: DowngradeOption[];
  retention_data?: RetentionData;
  payment_info?: CatalogPaymentInfo;
  is_business: boolean;
  foreign_transaction_fee: boolean;
  editorial?: CardEditorial;
}

// Matches the user_cards DB table row
export interface UserCard {
  id: string;
  user_id: string;
  card_slug: string;
  card_name: string;
  issuer: string;
  currency: string;
  annual_fee_cents: number;
  status: "active" | "upgraded" | "downgraded" | "cancelled" | "product_changed";
  card_since: string; // date string
  is_primary: boolean;
  annual_fee_date: string | null;
  af_reminder_days_before: number;
  signup_bonus_points: number | null;
  signup_spend_requirement_cents: number | null;
  signup_spend_timeframe_months: number | null;
  signup_spend_deadline: string | null;
  signup_spend_progress_cents: number;
  signup_bonus_met: boolean;
  signup_bonus_earned: boolean;
  created_at: string;
  updated_at: string;
}

// Flattened action item from the upcoming_card_actions view
export interface CardAction {
  user_id: string;
  user_card_id: string;
  card_name: string;
  card_slug: string;
  issuer: string;
  type: "signup_spend" | "annual_fee" | "credit_expiring" | "perk_setup" | "payment_due";
  urgency: "critical" | "warning" | "info";
  days_remaining?: number;
  spend_remaining_cents?: number;
  spend_total_cents?: number;
  bonus_points?: number;
  deadline?: string;
  annual_fee_cents?: number;
}

// Matches user_credit_usage DB table row
export interface UserCreditUsage {
  id: string;
  user_id: string;
  user_card_id: string;
  credit_type: string;
  credit_name: string;
  credit_amount_cents: number;
  period: "monthly" | "quarterly" | "semi_annual" | "annual" | "card_year";
  period_start: string;
  period_end: string;
  amount_used_cents: number;
  status: "available" | "partial" | "used" | "expired";
  enrollment_required: boolean;
  enrolled: boolean;
  created_at: string;
  updated_at: string;
}

// Matches user_external_cards DB table row
export interface UserExternalCard {
  id: string;
  user_id: string;
  card_name: string;
  issuer: string | null;
  is_business: boolean;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── 5/24 Rule ──

export interface FiveTwentyFourStatus {
  count: number;
  maxAllowed: number;
  isEligible: boolean;
  slotsRemaining: number;
  nextEligibleDate: string | null;
  countedCards: Array<{
    name: string;
    openedDate: string;
    source: "portfolio" | "external";
    agesOutDate: string;
  }>;
}

// Legacy alias — keep for backward compat
export type CreditCard = CatalogCard;

// ── Spending Optimizer ──

export type SpendingCategory =
  | "dining"
  | "travel"
  | "groceries"
  | "gas"
  | "streaming"
  | "online_shopping"
  | "transit"
  | "drugstores"
  | "entertainment"
  | "rent"
  | "bills"
  | "other";

export interface CategoryRecommendation {
  category: SpendingCategory;
  displayName: string;
  rankings: CardRanking[];
}

export interface CardRanking {
  cardSlug: string;
  cardName: string;
  issuer: string;
  currency: string;
  multiplier: number;
  effectiveCpp: number;
  effectiveCents: number;
  capWarning: string | null;
  notes: string | null;
}

export interface WalletGuide {
  categories: CategoryRecommendation[];
  generatedAt: string;
}

// ── Card Lifecycle Events ──

export type LifecycleEventType =
  | "opened"
  | "product_change"
  | "downgrade"
  | "upgrade"
  | "cancelled"
  | "retention_offer"
  | "retention_declined"
  | "annual_fee_posted"
  | "annual_fee_waived"
  | "signup_bonus_met"
  | "signup_bonus_earned";

export interface CardLifecycleEvent {
  id: string;
  user_id: string;
  user_card_id: string;
  event_type: LifecycleEventType;
  event_date: string;
  from_card_slug: string | null;
  to_card_slug: string | null;
  retention_offer_type: string | null;
  retention_offer_value: string | null;
  retention_spend_requirement: string | null;
  notes: string | null;
  created_at: string;
}

// ── Loyalty Balances ──

export interface LoyaltyBalance {
  id: string;
  user_id: string;
  program_name: string;
  program_code: string;
  program_type: "credit_card" | "airline" | "hotel";
  balance: number;
  currency: string;
  source: "manual" | "extension" | "email" | "awardwallet";
  last_verified_at: string;
  expires_at: string | null;
  expiration_policy: string | null;
  expiration_notes: string | null;
  last_activity_date: string | null;
  inactivity_months: number | null;
  tier_status: string | null;
  created_at: string;
  updated_at: string;
}
