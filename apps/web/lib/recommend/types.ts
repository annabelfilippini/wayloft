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

export interface EligibilityWarning {
  type: "five_twenty_four";
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
  topEarnings: CategoryEarning[];
  reasoning: string;
  warnings: EligibilityWarning[];
}
