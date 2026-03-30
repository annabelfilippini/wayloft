import { describe, it, expect } from "vitest";
import { scoreCards } from "@/lib/recommend/engine";
import {
  CHASE_524_AFFECTED,
  CITI_848_AFFECTED,
  SAPPHIRE_SLUGS,
} from "@/lib/recommend/issuer-rules";
import type { CatalogCard } from "@wayloft/shared";
import type { QuizInput } from "@/lib/recommend/types";

// --- Helpers ---

const CARD_DEFAULTS: Omit<CatalogCard, "slug" | "currency"> = {
  name: "Test Card",
  issuer: "test",
  network: "visa",
  annual_fee_cents: 0,
  signup_bonus: { points: 0, spend_requirement_cents: 500000, timeframe_months: 3 },
  earning_rates: { other: 1 },
  earning_caps: [],
  portal_cpp: 1.0,
  key_perks: [],
  best_for: [],
  credit_score_min: "good",
  card_art_url: "",
  application_url: "",
  is_business: false,
  foreign_transaction_fee: false,
};

function makeCard(slug: string, overrides: Partial<CatalogCard> = {}): CatalogCard {
  return { ...CARD_DEFAULTS, slug, currency: "WF", ...overrides } as CatalogCard;
}

const BASE_QUIZ: QuizInput = {
  spending: { dining: 500, travel: 200, groceries: 300, gas: 100, streaming: 50, other: 200 },
  creditScore: "excellent",
  cardsOpened24mo: 0,
  cardsOpened48mo: 0,
  currentCardSlugs: [],
  annualFeeComfort: "high",
  travelGoal: "maximize_travel",
};

function makeQuiz(overrides: Partial<QuizInput> = {}): QuizInput {
  return { ...BASE_QUIZ, ...overrides };
}

// --- Filtering ---

describe("scoreCards — filtering", () => {
  it("excludes cards the user already owns", () => {
    const card = makeCard("already-owned");
    const results = scoreCards(makeQuiz({ currentCardSlugs: ["already-owned"] }), [card]);
    expect(results).toHaveLength(0);
  });

  it("excludes business cards", () => {
    const card = makeCard("biz-card", { is_business: true });
    const results = scoreCards(makeQuiz(), [card]);
    expect(results).toHaveLength(0);
  });

  it("excludes cards above the annual fee comfort ceiling", () => {
    // medium ceiling = $250 (25000 cents)
    const expensive = makeCard("expensive-card", { annual_fee_cents: 55000 }); // $550
    const affordable = makeCard("affordable-card", { annual_fee_cents: 9500 }); // $95

    const results = scoreCards(makeQuiz({ annualFeeComfort: "medium" }), [expensive, affordable]);
    const slugs = results.map((r) => r.card.slug);

    expect(slugs).not.toContain("expensive-card");
    expect(slugs).toContain("affordable-card");
  });

  it("excludes no-annual-fee cards when comfort is 'none'", () => {
    const free = makeCard("free-card", { annual_fee_cents: 0 });
    const paid = makeCard("paid-card", { annual_fee_cents: 9500 });

    const results = scoreCards(makeQuiz({ annualFeeComfort: "none" }), [free, paid]);
    const slugs = results.map((r) => r.card.slug);

    expect(slugs).toContain("free-card");
    expect(slugs).not.toContain("paid-card");
  });

  it("excludes cards requiring a higher credit score than the user has", () => {
    const premium = makeCard("premium-card", { credit_score_min: "excellent" });

    const goodCredit = scoreCards(makeQuiz({ creditScore: "good" }), [premium]);
    expect(goodCredit).toHaveLength(0);

    const excellentCredit = scoreCards(makeQuiz({ creditScore: "excellent" }), [premium]);
    expect(excellentCredit).toHaveLength(1);
  });

  it("excludes second Sapphire card when user already holds one", () => {
    const csr = "chase-sapphire-reserve";
    const csp = "chase-sapphire-preferred";

    if (!SAPPHIRE_SLUGS.has(csr) || !SAPPHIRE_SLUGS.has(csp)) {
      throw new Error("Sapphire slugs missing from issuer-rules.json — test data may be stale");
    }

    const csrCard = makeCard(csr, { currency: "UR", issuer: "chase" });
    const cspCard = makeCard(csp, { currency: "UR", issuer: "chase" });

    // User owns CSR: CSP should be excluded (and CSR is excluded as already-owned)
    const ownsCSR = scoreCards(makeQuiz({ currentCardSlugs: [csr] }), [csrCard, cspCard]);
    expect(ownsCSR).toHaveLength(0);

    // User owns neither: both should be candidates
    const ownsNeither = scoreCards(makeQuiz(), [csrCard, cspCard]);
    expect(ownsNeither).toHaveLength(2);
  });
});

// --- Issuer rule warnings (5/24, 8/48) ---
// Note: 5/24 is a hard WARNING that surfaces in warnings[], NOT a filter that removes
// cards from results. Cards still appear but with { type: 'five_twenty_four', severity: 'hard' }.

describe("scoreCards — issuer rule warnings", () => {
  it("adds five_twenty_four hard warning for Chase cards when cardsOpened24mo >= 5", () => {
    const slug = [...CHASE_524_AFFECTED][0];
    if (!slug) throw new Error("CHASE_524_AFFECTED is empty — issuer-rules.json may be stale");

    const card = makeCard(slug, { currency: "UR", issuer: "chase" });

    const atLimit = scoreCards(makeQuiz({ cardsOpened24mo: 5 }), [card]);
    expect(atLimit).toHaveLength(1);
    expect(atLimit[0].warnings).toContainEqual(
      expect.objectContaining({ type: "five_twenty_four", severity: "hard" })
    );
  });

  it("does not add five_twenty_four warning when cardsOpened24mo < 5", () => {
    const slug = [...CHASE_524_AFFECTED][0];
    if (!slug) throw new Error("CHASE_524_AFFECTED is empty");

    const card = makeCard(slug, { currency: "UR", issuer: "chase" });
    const results = scoreCards(makeQuiz({ cardsOpened24mo: 4 }), [card]);

    expect(results[0].warnings.some((w) => w.type === "five_twenty_four")).toBe(false);
  });

  it("adds citi_eight_forty_eight hard warning for Citi cards when cardsOpened48mo >= 8", () => {
    const slug = [...CITI_848_AFFECTED][0];
    if (!slug) throw new Error("CITI_848_AFFECTED is empty — issuer-rules.json may be stale");

    const card = makeCard(slug, { currency: "TYP", issuer: "citi" });

    const atLimit = scoreCards(makeQuiz({ cardsOpened48mo: 8 }), [card]);
    expect(atLimit).toHaveLength(1);
    expect(atLimit[0].warnings).toContainEqual(
      expect.objectContaining({ type: "citi_eight_forty_eight", severity: "hard" })
    );
  });

  it("does not add citi_eight_forty_eight warning when cardsOpened48mo < 8", () => {
    const slug = [...CITI_848_AFFECTED][0];
    if (!slug) throw new Error("CITI_848_AFFECTED is empty");

    const card = makeCard(slug, { currency: "TYP", issuer: "citi" });
    const results = scoreCards(makeQuiz({ cardsOpened48mo: 7 }), [card]);

    expect(results[0].warnings.some((w) => w.type === "citi_eight_forty_eight")).toBe(false);
  });
});

// --- CPP weighting via portfolio synergy ---

describe("scoreCards — CPP weighting", () => {
  it("scores UR feeder card higher when user owns a UR gateway card", () => {
    // chase-freedom-unlimited is not in TRANSFER_GATEWAY_SLUGS.UR
    // Without a gateway: UR redeems at 1.0 cpp (cash only)
    // With CSR in portfolio: UR gets full transferable cpp (~2.0)
    const cfu = makeCard("chase-freedom-unlimited", {
      currency: "UR",
      earning_rates: { other: 1.5 },
    });

    const withoutGateway = scoreCards(makeQuiz(), [cfu]);
    const withGateway = scoreCards(
      makeQuiz({ currentCardSlugs: ["chase-sapphire-reserve"] }),
      [cfu]
    );

    expect(withGateway[0].breakdown.firstYearValue).toBeGreaterThan(
      withoutGateway[0].breakdown.firstYearValue
    );
  });

  it("scores two UR feeder cards identically when neither user portfolio has a gateway", () => {
    const cfu = makeCard("chase-freedom-unlimited", {
      currency: "UR",
      earning_rates: { other: 1.5 },
    });
    const cfuCopy = makeCard("chase-freedom-unlimited-copy", {
      currency: "UR",
      earning_rates: { other: 1.5 },
    });

    // Both are feeder cards, no gateway in portfolio — should score the same
    const results = scoreCards(makeQuiz(), [cfu, cfuCopy]);
    expect(results[0].breakdown.firstYearValue).toBeCloseTo(
      results[1].breakdown.firstYearValue,
      2
    );
  });

  it("gateway card scores itself at full cpp (not the 1.0 fallback)", () => {
    const csr = makeCard("chase-sapphire-reserve", {
      currency: "UR",
      earning_rates: { travel: 3, dining: 3, other: 1 },
    });

    // CSR is its own gateway — should get full UR cpp, not 1.0
    const withoutPortfolio = scoreCards(makeQuiz(), [csr]);
    const cashEquivalent = makeCard("cash-card", {
      currency: "WF",
      earning_rates: { travel: 3, dining: 3, other: 1 },
    });
    const cashResults = scoreCards(makeQuiz(), [cashEquivalent]);

    // CSR (full UR cpp ~2.0) should score higher than identical-multiplier cashback card (1.0 cpp)
    expect(withoutPortfolio[0].breakdown.firstYearValue).toBeGreaterThan(
      cashResults[0].breakdown.firstYearValue
    );
  });
});

// --- Signup bonus achievability ---

describe("scoreCards — signup bonus achievability", () => {
  it("applies no discount when user can meet the spend requirement", () => {
    const card = makeCard("bonus-card", {
      currency: "UR",
      signup_bonus: { points: 60000, spend_requirement_cents: 100000, timeframe_months: 3 },
      earning_rates: { other: 1 },
    });

    // $2000/mo * 3 months = $6000 (600000 cents) — can meet $1000 (100000 cents) requirement
    const highSpend = makeQuiz({
      spending: { dining: 800, travel: 400, groceries: 400, gas: 200, streaming: 100, other: 100 },
    });
    // $50/mo * 3 months = $150 (15000 cents) — cannot meet $1000 requirement, 15% achievability
    const lowSpend = makeQuiz({
      spending: { dining: 20, travel: 10, groceries: 10, gas: 5, streaming: 2, other: 3 },
    });

    const fullResults = scoreCards(highSpend, [card]);
    const discountedResults = scoreCards(lowSpend, [card]);

    expect(fullResults[0].breakdown.signupBonus).toBeGreaterThan(
      discountedResults[0].breakdown.signupBonus
    );
  });

  it("achievability is proportional — half the spend yields half the bonus", () => {
    const card = makeCard("proportional-card", {
      currency: "UR",
      signup_bonus: { points: 60000, spend_requirement_cents: 600000, timeframe_months: 3 },
      // Need $6000 in 3 months = $2000/mo
      earning_rates: { other: 1 },
    });

    // $2000/mo total → achievability = 1.0
    const fullSpend = makeQuiz({
      spending: { dining: 800, travel: 400, groceries: 400, gas: 200, streaming: 100, other: 100 },
    });
    // $1000/mo total → achievability = 0.5
    const halfSpend = makeQuiz({
      spending: { dining: 400, travel: 200, groceries: 200, gas: 100, streaming: 50, other: 50 },
    });

    const full = scoreCards(fullSpend, [card]);
    const half = scoreCards(halfSpend, [card]);

    const ratio = full[0].breakdown.signupBonus / half[0].breakdown.signupBonus;
    expect(ratio).toBeCloseTo(2.0, 1);
  });

  it("signup bonus is zero when signup_bonus.points is 0", () => {
    const card = makeCard("no-bonus-card", {
      currency: "UR",
      signup_bonus: { points: 0, spend_requirement_cents: 500000, timeframe_months: 3 },
      earning_rates: { other: 1 },
    });

    const results = scoreCards(makeQuiz(), [card]);
    expect(results[0].breakdown.signupBonus).toBe(0);
  });
});

// --- Goal alignment bonus ---

describe("scoreCards — goal alignment bonus", () => {
  it("applies positive goal bonus when transferable card aligns with travel goal", () => {
    const csr = makeCard("chase-sapphire-reserve", {
      currency: "UR",
      earning_rates: { travel: 3, dining: 3, other: 1 },
    });

    // CSR is UR gateway + has travel bonus → strong alignment with maximize_travel
    const results = scoreCards(makeQuiz({ travelGoal: "maximize_travel" }), [csr]);
    expect(results[0].breakdown.goalBonus).toBeGreaterThan(0);
  });

  it("applies zero goal bonus for neutral alignment (transferable card + cashback goal)", () => {
    const csr = makeCard("chase-sapphire-reserve", {
      currency: "UR",
      earning_rates: { travel: 3, dining: 3, other: 1 },
    });

    // CSR is transferable (not cashback) → neutral alignment with cashback goal
    const results = scoreCards(makeQuiz({ travelGoal: "cashback" }), [csr]);
    expect(results[0].breakdown.goalBonus).toBe(0);
  });

  it("applies negative goal bonus (penalty) when UR feeder card has no gateway and user wants travel", () => {
    const cfu = makeCard("chase-freedom-unlimited", {
      currency: "UR",
      earning_rates: { other: 1.5 },
    });

    // CFU with no gateway in portfolio → effectively cashback (1.0 cpp)
    // maximize_travel goal + effectively cashback card → mismatch penalty
    const results = scoreCards(makeQuiz({ travelGoal: "maximize_travel" }), [cfu]);
    expect(results[0].breakdown.goalBonus).toBeLessThan(0);
  });

  it("goal bonus is exactly 25% of subtotal for strong alignment", () => {
    // Use a UR gateway card (CSR is its own gateway → always gets full cpp)
    // so alignment is deterministically "strong" for maximize_travel
    const card = makeCard("chase-sapphire-reserve", {
      currency: "UR",
      earning_rates: { travel: 3, dining: 3, other: 1 },
      annual_fee_cents: 0,
    });

    const results = scoreCards(makeQuiz({ travelGoal: "maximize_travel" }), [card]);
    const { goalBonus, ongoing, signupBonus, creditsOffset, annualFee } =
      results[0].breakdown;

    const subtotal = ongoing + signupBonus + creditsOffset - annualFee;
    // GOAL_BONUS_FACTOR = 0.25 for strong alignment
    expect(goalBonus).toBeCloseTo(subtotal * 0.25, 1);
  });
});

// --- Result shape ---

describe("scoreCards — result shape", () => {
  it("returns at most 5 results", () => {
    const catalog = Array.from({ length: 10 }, (_, i) =>
      makeCard(`card-${i}`, { currency: "WF" })
    );
    const results = scoreCards(makeQuiz(), catalog);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it("assigns rank starting at 1, incrementing by 1", () => {
    const catalog = [
      makeCard("card-a", { currency: "UR", earning_rates: { other: 3 } }),
      makeCard("card-b", { currency: "WF", earning_rates: { other: 1 } }),
    ];
    const results = scoreCards(makeQuiz(), catalog);
    results.forEach((r, i) => {
      expect(r.rank).toBe(i + 1);
    });
  });

  it("returns empty array when no cards pass the filters", () => {
    const card = makeCard("only-card", { credit_score_min: "excellent" });
    const results = scoreCards(makeQuiz({ creditScore: "poor" }), [card]);
    expect(results).toHaveLength(0);
  });

  it("results are sorted descending by firstYearValue", () => {
    const catalog = [
      makeCard("low-value", { currency: "WF", earning_rates: { other: 1 } }),
      makeCard("high-value", { currency: "WF", earning_rates: { other: 5 } }),
      makeCard("mid-value", { currency: "WF", earning_rates: { other: 2 } }),
    ];
    const results = scoreCards(makeQuiz(), catalog);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].breakdown.firstYearValue).toBeGreaterThanOrEqual(
        results[i].breakdown.firstYearValue
      );
    }
  });
});
