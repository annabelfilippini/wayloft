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
  is_business: boolean;
  foreign_transaction_fee: boolean;
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
  type: "signup_spend" | "annual_fee";
  urgency: "critical" | "warning" | "info";
  days_remaining?: number;
  spend_remaining_cents?: number;
  spend_total_cents?: number;
  bonus_points?: number;
  deadline?: string;
  annual_fee_cents?: number;
}

// Legacy alias — keep for backward compat
export type CreditCard = CatalogCard;
