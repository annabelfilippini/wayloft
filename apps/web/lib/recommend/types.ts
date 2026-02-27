import type { CatalogCard } from "@wayloft/shared";

export interface QuizInput {
  spending: {
    dining: number;
    travel: number;
    groceries: number;
    gas: number;
    streaming: number;
    other: number;
  };
  creditScore: "excellent" | "good" | "fair" | "poor";
  cardsOpened24mo: number;
  cardsOpened48mo: number;
  currentCardSlugs: string[];
  annualFeeComfort: "none" | "low" | "medium" | "high";
  travelGoal: "maximize_travel" | "cashback" | "hotel_stays" | "airline_status";
}

export interface ScoreBreakdown {
  ongoing: number;
  signupBonus: number;
  creditsOffset: number;
  goalBonus: number;
  annualFee: number;
  firstYearValue: number;
}

export type WarningSeverity = "hard" | "info";
export type WarningType =
  | "five_twenty_four"
  | "barclays_six_twenty_four"
  | "amex_lifetime"
  | "marriott_cross_issuer"
  | "citi_eight_forty_eight"
  | "capital_one_triple_pull";

export interface EligibilityWarning {
  type: WarningType;
  severity: WarningSeverity;
  message: string;
}

export interface CategoryEarning {
  category: string;
  displayName: string;
  monthlySpend: number;
  multiplier: number;
  annualValue: number;
}

export interface ScoredCard {
  card: CatalogCard;
  rank: number;
  breakdown: ScoreBreakdown;
  year2Value: number; // ongoing rewards + credits - AF (no signup, no goal bonus)
  topEarnings: CategoryEarning[];
  allEarnings: CategoryEarning[];
  reasoning: string;
  warnings: EligibilityWarning[];
}
