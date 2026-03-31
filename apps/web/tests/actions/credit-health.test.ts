import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cards/catalog", () => ({ getAllCards: vi.fn() }));
// five-twenty-four imports "server-only" — replace entirely so it never loads
vi.mock("@/lib/cards/five-twenty-four", () => ({ computeFiveTwentyFour: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { computeFiveTwentyFour } from "@/lib/cards/five-twenty-four";
import { getCreditHealth } from "@/app/actions/credit-health";

// --- Helpers ---

function makeMockChain(result: { data?: unknown; error?: { message: string } | null } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null };
  const promise = Promise.resolve(resolved);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    single: vi.fn().mockResolvedValue(resolved),
  };
  for (const m of ["select", "insert", "update", "delete", "eq", "is", "upsert"]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain as any;
}

function makeSupabaseClient(options: {
  user?: { id: string } | null;
  cardsData?: unknown[];
  externalCardsData?: unknown[];
} = {}) {
  const { user = { id: "user-123" }, cardsData = [], externalCardsData = [] } = options;
  const cardsChain = makeMockChain({ data: cardsData });
  const externalChain = makeMockChain({ data: externalCardsData });
  const fromFn = vi.fn()
    .mockReturnValueOnce(cardsChain)   // user_cards (first Promise.all slot)
    .mockReturnValue(externalChain);   // user_external_cards (second)
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: fromFn,
  };
  vi.mocked(createClient).mockResolvedValue(client as any);
  return { client, fromFn };
}

const MOCK_524_STATUS = {
  count: 0,
  maxAllowed: 5,
  isEligible: true,
  slotsRemaining: 5,
  nextEligibleDate: null,
  countedCards: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAllCards).mockReturnValue([]);
  vi.mocked(computeFiveTwentyFour).mockReturnValue(MOCK_524_STATUS as any);
});

// ─── getCreditHealth ───────────────────────────────────────────────────────────

describe("getCreditHealth", () => {
  it("returns null when unauthenticated", async () => {
    makeSupabaseClient({ user: null });

    const result = await getCreditHealth();

    expect(result).toBeNull();
  });

  it("happy path: returns full CreditHealth structure for user with no cards", async () => {
    makeSupabaseClient({ cardsData: [], externalCardsData: [] });

    const result = await getCreditHealth();

    expect(result).not.toBeNull();
    expect(result?.fiveTwentyFour).toEqual(MOCK_524_STATUS);
    expect(result?.velocityWarnings).toEqual([]);
    expect(result?.recentApplications).toEqual({
      last30Days: 0,
      last90Days: 0,
      last6Months: 0,
    });
    expect(result?.recommendedSpacing).toBeNull();
    expect(result?.nextCardFallsOff).toBeNull();
  });

  it("includes nextCardFallsOff when countedCards has entries", async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const agesOutDate = futureDate.toISOString().split("T")[0];

    vi.mocked(computeFiveTwentyFour).mockReturnValue({
      ...MOCK_524_STATUS,
      count: 1,
      slotsRemaining: 4,
      countedCards: [
        { name: "Chase Sapphire Preferred", openedDate: "2024-01-01", source: "portfolio", agesOutDate },
      ],
    } as any);
    makeSupabaseClient({ cardsData: [], externalCardsData: [] });

    const result = await getCreditHealth();

    expect(result?.nextCardFallsOff).not.toBeNull();
    expect(result?.nextCardFallsOff?.name).toBe("Chase Sapphire Preferred");
    expect(result?.nextCardFallsOff?.daysUntil).toBeGreaterThan(0);
  });

  it("computes velocity warnings for recent applications", async () => {
    // Provide 2 cards opened within last 30 days → velocity warning fires
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);
    const dateStr = recentDate.toISOString().split("T")[0];

    makeSupabaseClient({
      cardsData: [
        { card_since: dateStr, card_slug: "card-a", card_name: "Card A", issuer: "chase" },
        { card_since: dateStr, card_slug: "card-b", card_name: "Card B", issuer: "amex" },
      ],
      externalCardsData: [],
    });

    const result = await getCreditHealth();

    const velocityWarning = result?.velocityWarnings.find((w) => w.rule === "Velocity");
    expect(velocityWarning).toBeDefined();
    expect(velocityWarning?.currentCount).toBeGreaterThanOrEqual(2);
  });
});
