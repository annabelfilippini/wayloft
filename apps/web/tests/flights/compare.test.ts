import { describe, it, expect } from "vitest";
import { computeCashVsPoints, findBestTransferPath } from "@/lib/flights/compare";
import type {
  AwardSearchResult,
  EnrichedFlight,
} from "@/lib/flights/types";
import type { LoyaltyBalance, TransferBonus } from "@wayloft/shared";

type Balance = Pick<LoyaltyBalance, "program_code" | "balance" | "currency">;

function makeFlight(totalAmount: string, id = "offer-1"): EnrichedFlight {
  return {
    id,
    totalAmount,
    totalCurrency: "USD",
    slices: [],
    cabinClass: "economy",
    baggageIncluded: false,
    cardRecommendations: [],
    bestPortalOption: null,
  };
}

function makeAvailability(overrides: {
  source: string;
  origin?: string;
  destination?: string;
  date?: string;
  yMiles?: number;
  ySeats?: number;
  jMiles?: number;
  jSeats?: number;
  direct?: boolean;
}): AwardSearchResult["data"][number] {
  const cabins = [];
  if (overrides.yMiles !== undefined) {
    cabins.push({
      cabin: "Y" as const,
      available: true,
      mileageCost: overrides.yMiles,
      airlines: ["United"],
      direct: overrides.direct ?? true,
      remainingSeats: overrides.ySeats ?? 4,
    });
  }
  if (overrides.jMiles !== undefined) {
    cabins.push({
      cabin: "J" as const,
      available: true,
      mileageCost: overrides.jMiles,
      airlines: ["United"],
      direct: overrides.direct ?? true,
      remainingSeats: overrides.jSeats ?? 2,
    });
  }
  return {
    id: `avail-${overrides.source}`,
    routeId: "route-1",
    route: {
      id: "route-1",
      originAirport: overrides.origin ?? "SFO",
      originRegion: "North America",
      destinationAirport: overrides.destination ?? "JFK",
      destinationRegion: "North America",
      distance: 2586,
      source: overrides.source,
    },
    date: overrides.date ?? "2026-12-20",
    parsedDate: `${overrides.date ?? "2026-12-20"}T00:00:00Z`,
    source: overrides.source,
    createdAt: "2026-04-10T00:00:00Z",
    updatedAt: "2026-04-10T00:00:00Z",
    cabins,
  };
}

function makeBonus(
  currency: string,
  partnerCode: string,
  pct: number
): TransferBonus {
  return {
    id: `bonus-${currency}-${partnerCode}`,
    bank:
      currency === "UR"
        ? "chase"
        : currency === "MR"
          ? "amex"
          : "unknown",
    currency,
    partner: "Test Partner",
    partner_code: partnerCode,
    partner_type: "airline",
    bonus_percentage: pct,
    start_date: "2026-04-01",
    end_date: "2026-05-01",
    source_url: null,
    is_active: true,
    scraped_at: "2026-04-10T00:00:00Z",
    retrieved_at: null,
    confidence: null,
    created_at: "2026-04-10T00:00:00Z",
  };
}

const BASE_PARAMS = {
  origin: "SFO",
  destination: "JFK",
  date: "2026-12-20",
  passengers: 2,
  cabinClass: "economy",
  bonuses: [] as TransferBonus[],
};

describe("findBestTransferPath", () => {
  it("returns null when no currency in the catalog transfers to that airline code", () => {
    // "ZZ" is not a real airline — no partner entry will match.
    const balances: Balance[] = [
      { program_code: "UR", currency: "UR", balance: 100_000 },
    ];
    const path = findBestTransferPath("ZZ", 30_000, 1, balances, []);
    expect(path).toBeNull();
  });

  it("picks hasEnough candidate over a short one, even when the short one is numerically identical", () => {
    // Aeroplan (AC) is a partner of both UR and MR. User has 20k UR (short)
    // and 80k MR (has enough). Both are 1:1 ratios with no bonus, so the
    // "cheaper" comparison is a tie — hasEnough must break it.
    const balances: Balance[] = [
      { program_code: "UR", currency: "UR", balance: 20_000 },
      { program_code: "MR", currency: "MR", balance: 80_000 },
    ];
    const path = findBestTransferPath("AC", 30_000, 1, balances, []);
    expect(path).not.toBeNull();
    expect(path!.currency).toBe("MR");
    expect(path!.hasEnough).toBe(true);
  });

  it("applies transfer bonus to reduce source points needed", () => {
    const balances: Balance[] = [
      { program_code: "UR", currency: "UR", balance: 100_000 },
    ];
    const bonuses = [makeBonus("UR", "UA", 30)];
    const withoutBonus = findBestTransferPath("UA", 30_000, 1, balances, []);
    const withBonus = findBestTransferPath("UA", 30_000, 1, balances, bonuses);
    expect(withoutBonus!.pointsNeededPerPerson).toBe(30_000);
    expect(withBonus!.pointsNeededPerPerson).toBeLessThan(30_000);
    expect(withBonus!.bonusPercentage).toBe(30);
  });

  it("marks hypothetical when user balance is zero", () => {
    const path = findBestTransferPath("UA", 30_000, 1, [], []);
    expect(path).not.toBeNull();
    expect(path!.hypothetical).toBe(true);
    expect(path!.userBalance).toBe(0);
    expect(path!.hasEnough).toBe(false);
  });

  it("multiplies by passengers for total", () => {
    const path = findBestTransferPath("UA", 30_000, 4, [], []);
    expect(path!.pointsNeededPerPerson).toBe(30_000);
    expect(path!.totalPointsNeeded).toBe(120_000);
  });
});

describe("computeCashVsPoints", () => {
  it("verdict='points' when award CPP >= 2.0", () => {
    // Cash $600 for 1 pax, award 25k miles → 600/25000*100 = 2.4 cpp
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("600.00")],
      awardResult: {
        data: [makeAvailability({ source: "united", yMiles: 25_000 })],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [{ program_code: "UR", currency: "UR", balance: 50_000 }],
    });
    expect(result.verdict).toBe("points");
    expect(result.verdictCpp).toBeCloseTo(2.4, 1);
    expect(result.bestAwardPath?.sourceAirlineCode).toBe("UA");
  });

  it("verdict='cash' when award CPP < 1.5", () => {
    // Cash $200 for 1 pax, award 25k miles → 200/25000*100 = 0.8 cpp
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("200.00")],
      awardResult: {
        data: [makeAvailability({ source: "united", yMiles: 25_000 })],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [{ program_code: "UR", currency: "UR", balance: 50_000 }],
    });
    expect(result.verdict).toBe("cash");
    expect(result.verdictCpp).toBeCloseTo(0.8, 1);
  });

  it("verdict='close' between 1.5 and 2.0", () => {
    // Cash $440 for 1 pax, 25k miles → 1.76 cpp
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("440.00")],
      awardResult: {
        data: [makeAvailability({ source: "united", yMiles: 25_000 })],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [{ program_code: "UR", currency: "UR", balance: 50_000 }],
    });
    expect(result.verdict).toBe("close");
  });

  it("returns no_awards when nothing matches route/date", () => {
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      flights: [makeFlight("500.00")],
      awardResult: {
        data: [
          makeAvailability({
            source: "united",
            origin: "LAX",
            destination: "JFK",
            yMiles: 25_000,
          }),
        ],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [],
    });
    expect(result.verdict).toBe("no_awards");
    expect(result.awardPaths).toHaveLength(0);
  });

  it("returns no_cash when cash offers empty but awards exist", () => {
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [],
      awardResult: {
        data: [makeAvailability({ source: "united", yMiles: 25_000 })],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [],
    });
    expect(result.verdict).toBe("no_cash");
    expect(result.bestAwardPath).not.toBeNull();
  });

  it("filters award options where remainingSeats < passengers", () => {
    // 4 passengers, award only has 2 seats
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 4,
      flights: [makeFlight("1600.00")],
      awardResult: {
        data: [
          makeAvailability({ source: "united", yMiles: 30_000, ySeats: 2 }),
        ],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [],
    });
    expect(result.awardPaths).toHaveLength(0);
    expect(result.verdict).toBe("no_awards");
  });

  it("picks cheapest award across multiple programs", () => {
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("500.00")],
      awardResult: {
        data: [
          makeAvailability({ source: "united", yMiles: 35_000 }),
          makeAvailability({ source: "aeroplan", yMiles: 22_500 }),
        ],
        count: 2,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [{ program_code: "UR", currency: "UR", balance: 100_000 }],
    });
    expect(result.bestAwardPath?.sourceAirlineCode).toBe("AC");
    expect(result.awardPaths).toHaveLength(2);
  });

  it("surfaces business upsell when J <= 2x economy miles", () => {
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("500.00")],
      awardResult: {
        data: [
          makeAvailability({
            source: "united",
            yMiles: 30_000,
            jMiles: 55_000,
          }),
        ],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [{ program_code: "UR", currency: "UR", balance: 100_000 }],
    });
    expect(result.businessUpsell).not.toBeNull();
    expect(result.businessUpsell!.ratioVsSearched).toBeCloseTo(55 / 30, 1);
  });

  it("hides business upsell when J > 2x economy miles", () => {
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("500.00")],
      awardResult: {
        data: [
          makeAvailability({
            source: "united",
            yMiles: 30_000,
            jMiles: 120_000,
          }),
        ],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [{ program_code: "UR", currency: "UR", balance: 200_000 }],
    });
    expect(result.businessUpsell).toBeNull();
  });

  it("shows hypothetical path when user has zero balance", () => {
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("500.00")],
      awardResult: {
        data: [makeAvailability({ source: "united", yMiles: 25_000 })],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [],
    });
    expect(result.bestAwardPath?.transferFrom?.hypothetical).toBe(true);
    expect(result.verdict).toBe("points");
  });

  it("applies transfer bonus end-to-end", () => {
    // 30k United miles, 30% UR→UA bonus → only 23,077 UR needed (ceil)
    const result = computeCashVsPoints({
      ...BASE_PARAMS,
      passengers: 1,
      flights: [makeFlight("500.00")],
      awardResult: {
        data: [makeAvailability({ source: "united", yMiles: 30_000 })],
        count: 1,
        hasMore: false,
        cursor: 0,
        rateLimitRemaining: 999,
      },
      balances: [{ program_code: "UR", currency: "UR", balance: 50_000 }],
      bonuses: [makeBonus("UR", "UA", 30)],
    });
    expect(result.bestAwardPath?.transferFrom?.bonusPercentage).toBe(30);
    expect(
      result.bestAwardPath!.transferFrom!.pointsNeededPerPerson
    ).toBeLessThan(30_000);
  });
});
