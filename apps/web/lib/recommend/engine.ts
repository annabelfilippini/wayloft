import type { CatalogCard } from "@wayloft/shared";
import { getCpp, getCurrencyTier, isTransferable } from "../optimizer/cpp";
import type {
  QuizInput,
  ScoredCard,
  ScoreBreakdown,
  EligibilityWarning,
  CategoryEarning,
} from "./types";
import {
  SAPPHIRE_SLUGS,
  CHASE_524_MAX,
  CHASE_524_AFFECTED,
  BARCLAYS_624_MAX,
  BARCLAYS_624_AFFECTED,
  CITI_848_MAX,
  CITI_848_AFFECTED,
  AMEX_LIFETIME_AFFECTED,
  MARRIOTT_CROSS_SLUGS,
  C1_TRIPLE_PULL_AFFECTED,
} from "./issuer-rules";

// --- Constants ---

const CREDIT_UTILIZATION_FACTOR = 0.7;
const GOAL_BONUS_FACTOR = 0.25;
const GOAL_MISMATCH_PENALTY = -0.1;
const TOP_RESULTS = 5;

/** Map quiz spending keys → catalog earning_rate keys */
export const SPENDING_CATEGORY_MAP: Record<
  string,
  { catalogKeys: string[]; displayName: string }
> = {
  dining: { catalogKeys: ["dining"], displayName: "Dining" },
  travel: {
    catalogKeys: ["travel", "flights", "hotels"],
    displayName: "Travel",
  },
  groceries: { catalogKeys: ["groceries"], displayName: "Groceries" },
  gas: { catalogKeys: ["gas"], displayName: "Gas" },
  streaming: { catalogKeys: ["streaming"], displayName: "Streaming" },
  other: { catalogKeys: ["other"], displayName: "Everything Else" },
};

const CREDIT_SCORE_RANK: Record<string, number> = {
  excellent: 4,
  good: 3,
  fair: 2,
  poor: 1,
};

/** Annual fee comfort → max annual_fee_cents */
const FEE_CEILING: Record<string, number> = {
  none: 0,
  low: 9500,
  medium: 25000,
  high: Infinity,
};

const HOTEL_ISSUERS = new Set(["HYATT", "HILTON", "MARRIOTT", "IHG"]);
const AIRLINE_ISSUERS = new Set(["UA", "AA", "DL", "WN"]);

const PERIODS_PER_YEAR: Record<string, number> = {
  monthly: 12,
  quarterly: 4,
  semi_annual: 2,
  annual: 1,
  card_year: 1,
};

/**
 * Cards that unlock transfer partner access for a given currency.
 * Without one of these in the user's portfolio, feeder cards in the
 * same ecosystem can only redeem at ~1.0 cpp (cash/statement credit).
 */
const TRANSFER_GATEWAY_SLUGS: Record<string, Set<string>> = {
  UR: new Set([
    "chase-sapphire-preferred",
    "chase-sapphire-reserve",
    "chase-ink-preferred",
  ]),
  MR: new Set([
    "amex-platinum",
    "amex-gold",
    "amex-green",
    "amex-business-platinum",
  ]),
  TYP: new Set(["citi-strata-premier"]),
  C1: new Set([
    "capital-one-venture-x",
    "capital-one-venture",
    "capital-one-venture-x-business",
  ]),
  // All Bilt cards have transfer access
  BILT: new Set(["bilt-blue", "bilt-obsidian", "bilt-palladium"]),
};

// --- Main Entry Point ---

export function scoreCards(
  quiz: QuizInput,
  catalog: CatalogCard[]
): ScoredCard[] {
  const candidates = filterCandidates(quiz, catalog);
  const scored = candidates.map((card) => scoreOneCard(quiz, card));

  scored.sort((a, b) => {
    const valueDiff = b.breakdown.firstYearValue - a.breakdown.firstYearValue;
    if (Math.abs(valueDiff) > 0.01) return valueDiff;
    return getCurrencyTier(a.card.currency) - getCurrencyTier(b.card.currency);
  });

  return scored.slice(0, TOP_RESULTS).map((s, i) => ({ ...s, rank: i + 1 }));
}

// --- Portfolio Synergy ---

/**
 * Returns the effective CPP for a card, accounting for whether the user
 * (or the card itself) has transfer partner access for its currency.
 *
 * Example: Citi Double Cash earns TYP (1.8 cpp raw), but without a
 * Citi Premier in the portfolio, those points redeem at 1.0 cpp.
 * Meanwhile CFU earns UR — if the user already has a CSR, full 2.0 cpp applies.
 */
function getEffectiveCpp(card: CatalogCard, ownedSlugs: string[]): number {
  const rawCpp = getCpp(card.currency);

  // Non-transferable currencies always use raw CPP (cash or airline/hotel)
  if (!isTransferable(card.currency)) return rawCpp;

  const gateways = TRANSFER_GATEWAY_SLUGS[card.currency];
  if (!gateways) return rawCpp;

  // Card IS a gateway — it unlocks its own transfers
  if (gateways.has(card.slug)) return rawCpp;

  // User already owns a gateway for this currency — full CPP
  for (const slug of ownedSlugs) {
    if (gateways.has(slug)) return rawCpp;
  }

  // No transfer access — cash redemption only
  return 1.0;
}

/** Is this card effectively a cashback card given the user's portfolio? */
function isEffectivelyCashback(
  card: CatalogCard,
  ownedSlugs: string[]
): boolean {
  // Actual cashback currencies
  if (getCurrencyTier(card.currency) === 2) return true;

  // Transferable currency but no transfer access → effectively cashback
  if (isTransferable(card.currency)) {
    const cpp = getEffectiveCpp(card, ownedSlugs);
    if (cpp <= 1.0) return true;
  }

  return false;
}

// --- Filtering ---

function filterCandidates(
  quiz: QuizInput,
  catalog: CatalogCard[]
): CatalogCard[] {
  const ownedSet = new Set(quiz.currentCardSlugs);
  const userScoreRank = CREDIT_SCORE_RANK[quiz.creditScore] ?? 0;
  const feeCeiling = FEE_CEILING[quiz.annualFeeComfort] ?? Infinity;

  return catalog.filter((card) => {
    // Exclude already-owned
    if (ownedSet.has(card.slug)) return false;

    // Chase One Sapphire: can't hold both CSR + CSP simultaneously
    if (SAPPHIRE_SLUGS.has(card.slug)) {
      const ownsOtherSapphire = quiz.currentCardSlugs.some(
        (s) => SAPPHIRE_SLUGS.has(s) && s !== card.slug
      );
      if (ownsOtherSapphire) return false;
    }

    // Exclude business cards
    if (card.is_business) return false;

    // Credit score gate
    const cardScoreRank = CREDIT_SCORE_RANK[card.credit_score_min] ?? 0;
    if (cardScoreRank > userScoreRank) return false;

    // Annual fee comfort
    if (card.annual_fee_cents > feeCeiling) return false;

    return true;
  });
}

// --- Scoring ---

function scoreOneCard(quiz: QuizInput, card: CatalogCard): ScoredCard {
  const cpp = getEffectiveCpp(card, quiz.currentCardSlugs);

  // 1. Ongoing annual value
  const categoryEarnings = computeCategoryEarnings(quiz, card, cpp);
  const ongoing = categoryEarnings.reduce((sum, c) => sum + c.annualValue, 0);

  // 2. Signup bonus value (with achievability discount)
  const signupBonus = computeSignupBonusValue(quiz, card, cpp);

  // 3. Credits offset
  const creditsOffset = computeCreditsOffset(card);

  // 4. Annual fee
  const annualFee = card.annual_fee_cents / 100;

  // 5. Subtotal before goal bonus
  const subtotal = ongoing + signupBonus + creditsOffset - annualFee;

  // 6. Goal alignment bonus/penalty
  const goalBonus = computeGoalBonus(quiz, card, subtotal);

  const firstYearValue = subtotal + goalBonus;

  const breakdown: ScoreBreakdown = {
    ongoing: round2(ongoing),
    signupBonus: round2(signupBonus),
    creditsOffset: round2(creditsOffset),
    goalBonus: round2(goalBonus),
    annualFee: round2(annualFee),
    firstYearValue: round2(firstYearValue),
  };

  // Year 2+ value: ongoing rewards + credits - AF (no signup bonus, no goal bonus)
  const year2Value = round2(ongoing + creditsOffset - annualFee);

  // Top 3 earning categories by annual value
  const topEarnings = [...categoryEarnings]
    .filter((c) => c.annualValue > 0)
    .sort((a, b) => b.annualValue - a.annualValue)
    .slice(0, 3);

  const reasoning = buildReasoning(quiz, card, topEarnings, cpp);
  const warnings = buildWarnings(quiz, card);

  return {
    card,
    rank: 0, // set after sorting
    breakdown,
    year2Value,
    topEarnings,
    allEarnings: categoryEarnings,
    reasoning,
    warnings,
  };
}

function computeCategoryEarnings(
  quiz: QuizInput,
  card: CatalogCard,
  cpp: number
): CategoryEarning[] {
  const earnings: CategoryEarning[] = [];

  for (const [quizKey, { catalogKeys, displayName }] of Object.entries(
    SPENDING_CATEGORY_MAP
  )) {
    const monthlySpend =
      quiz.spending[quizKey as keyof typeof quiz.spending] ?? 0;
    if (monthlySpend === 0) continue;

    const multiplier = getBestRate(card, catalogKeys);
    const annualValue = monthlySpend * 12 * multiplier * (cpp / 100);

    earnings.push({
      category: quizKey,
      displayName,
      monthlySpend,
      multiplier,
      annualValue: round2(annualValue),
    });
  }

  return earnings;
}

function getBestRate(card: CatalogCard, catalogKeys: string[]): number {
  let best = 0;
  for (const key of catalogKeys) {
    const rate = card.earning_rates[key];
    if (rate !== undefined && rate > best) {
      best = rate;
    }
  }
  if (best === 0) {
    return card.earning_rates["other"] ?? 1;
  }
  return best;
}

function computeSignupBonusValue(
  quiz: QuizInput,
  card: CatalogCard,
  cpp: number
): number {
  if (!card.signup_bonus) return 0;
  const { points, spend_requirement_cents, timeframe_months } =
    card.signup_bonus;
  if (points === 0) return 0;

  const totalMonthlySpend = Object.values(quiz.spending).reduce(
    (sum, v) => sum + v,
    0
  );
  const canSpend = totalMonthlySpend * timeframe_months * 100; // cents
  const achievability = Math.min(1, canSpend / spend_requirement_cents);

  return points * (cpp / 100) * achievability;
}

function computeCreditsOffset(card: CatalogCard): number {
  if (!card.credits || card.credits.length === 0) return 0;

  let total = 0;
  for (const credit of card.credits) {
    const periodsPerYear = PERIODS_PER_YEAR[credit.period] ?? 1;
    total += (credit.amount_cents / 100) * periodsPerYear;
  }

  return total * CREDIT_UTILIZATION_FACTOR;
}

function computeGoalBonus(
  quiz: QuizInput,
  card: CatalogCard,
  subtotal: number
): number {
  if (subtotal <= 0) return 0;

  const alignment = getGoalAlignment(quiz.travelGoal, card, quiz);

  if (alignment === "strong") return subtotal * GOAL_BONUS_FACTOR;
  if (alignment === "mismatch") return subtotal * GOAL_MISMATCH_PENALTY;
  return 0;
}

/** Returns "strong" match, "neutral", or "mismatch" for a card vs the user's goal */
function getGoalAlignment(
  goal: string,
  card: CatalogCard,
  quiz: QuizInput
): "strong" | "neutral" | "mismatch" {
  const baseRate = card.earning_rates["other"] ?? 1;
  const travelRate = getBestRate(card, ["travel", "flights"]);
  const hasTravelBonus = travelRate > baseRate;
  const effectivelyCash = isEffectivelyCashback(card, quiz.currentCardSlugs);

  switch (goal) {
    case "maximize_travel":
      // Strong: transferable currency with transfer access AND above-base travel earning, OR 4x+ travel
      if (
        isTransferable(card.currency) &&
        !effectivelyCash &&
        hasTravelBonus
      )
        return "strong";
      if (travelRate >= 4) return "strong";
      // Mismatch: effectively cashback (includes transferable without transfer access)
      if (effectivelyCash) return "mismatch";
      return "neutral";

    case "cashback":
      if (effectivelyCash) return "strong";
      return "neutral";

    case "hotel_stays":
      if (HOTEL_ISSUERS.has(card.currency)) return "strong";
      if (isTransferable(card.currency) && !effectivelyCash) return "neutral";
      if (effectivelyCash) return "mismatch";
      return "neutral";

    case "airline_status":
      if (AIRLINE_ISSUERS.has(card.currency)) return "strong";
      if (isTransferable(card.currency) && !effectivelyCash) return "neutral";
      if (effectivelyCash) return "mismatch";
      return "neutral";

    default:
      return "neutral";
  }
}

// --- Reasoning & Warnings ---

const GOAL_LABELS: Record<string, string> = {
  maximize_travel: "travel maximization",
  cashback: "cashback rewards",
  hotel_stays: "hotel stays",
  airline_status: "airline status",
};

function buildReasoning(
  quiz: QuizInput,
  card: CatalogCard,
  topEarnings: CategoryEarning[],
  cpp: number
): string {
  const parts: string[] = [];

  // Lead with top earning category
  if (topEarnings.length > 0) {
    const best = topEarnings[0];
    const effectiveCents = (best.multiplier * cpp).toFixed(1);
    parts.push(
      `Earns ${best.multiplier}x ${card.currency} (${effectiveCents}¢/$1) on your $${best.monthlySpend.toLocaleString()}/mo ${best.displayName.toLowerCase()}`
    );
  } else {
    parts.push(
      `Flat ${card.earning_rates["other"] ?? 1}x on all spending`
    );
  }

  // Goal alignment context
  const alignment = getGoalAlignment(quiz.travelGoal, card, quiz);
  const goalLabel = GOAL_LABELS[quiz.travelGoal] ?? quiz.travelGoal;
  if (alignment === "strong") {
    parts.push(`Strong fit for ${goalLabel}`);
  }

  // Portfolio synergy note
  if (isTransferable(card.currency) && cpp > 1.0) {
    const gateways = TRANSFER_GATEWAY_SLUGS[card.currency];
    if (gateways && !gateways.has(card.slug)) {
      parts.push(
        `Points pool with your existing ${card.currency} cards for transfers`
      );
    }
  }

  return parts.join(". ") + ".";
}

function buildWarnings(
  quiz: QuizInput,
  card: CatalogCard
): EligibilityWarning[] {
  const warnings: EligibilityWarning[] = [];

  // Chase 5/24 (data-driven)
  if (quiz.cardsOpened24mo >= CHASE_524_MAX && CHASE_524_AFFECTED.has(card.slug)) {
    warnings.push({
      type: "five_twenty_four",
      severity: "hard",
      message: `You've opened ${quiz.cardsOpened24mo} cards in 24 months — Chase will likely deny this application (5/24 rule).`,
    });
  }

  // Barclays 6/24
  if (quiz.cardsOpened24mo >= BARCLAYS_624_MAX && BARCLAYS_624_AFFECTED.has(card.slug)) {
    warnings.push({
      type: "barclays_six_twenty_four",
      severity: "hard",
      message: `You've opened ${quiz.cardsOpened24mo} cards in 24 months — Barclays is likely to deny with 6+ new accounts (6/24 sensitivity).`,
    });
  }

  // Citi 8/48
  if (quiz.cardsOpened48mo >= CITI_848_MAX && CITI_848_AFFECTED.has(card.slug)) {
    warnings.push({
      type: "citi_eight_forty_eight",
      severity: "hard",
      message: `You've opened ${quiz.cardsOpened48mo} cards in 4 years — Citi is likely to deny with 8+ new accounts in 48 months (8/48 rule).`,
    });
  }

  // Amex once-per-lifetime
  if (AMEX_LIFETIME_AFFECTED.has(card.slug)) {
    warnings.push({
      type: "amex_lifetime",
      severity: "info",
      message: "Amex welcome bonus may not be available if you've previously held this card (once-per-lifetime rule).",
    });
  }

  // Marriott cross-issuer
  if (MARRIOTT_CROSS_SLUGS.has(card.slug)) {
    const ownsOtherMarriott = quiz.currentCardSlugs.some(
      (s) => MARRIOTT_CROSS_SLUGS.has(s) && s !== card.slug
    );
    if (ownsOtherMarriott) {
      warnings.push({
        type: "marriott_cross_issuer",
        severity: "info",
        message: "You hold another Marriott card — the signup bonus may be restricted across Chase/Amex (cross-issuer rule).",
      });
    }
  }

  // Capital One triple pull
  if (C1_TRIPLE_PULL_AFFECTED.has(card.slug)) {
    warnings.push({
      type: "capital_one_triple_pull",
      severity: "info",
      message: "Capital One often pulls all 3 credit bureaus per application — plan accordingly if inquiry-sensitive.",
    });
  }

  return warnings;
}

// --- Helpers ---

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
