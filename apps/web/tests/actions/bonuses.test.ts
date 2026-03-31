import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import {
  getActiveBonuses,
  getActiveBonusesForUser,
  getBonusHistory,
} from "@/app/actions/bonuses";

// --- Helpers ---

function makeMockChain(result: {
  data?: unknown;
  error?: { message: string } | null;
} = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null };
  const promise = Promise.resolve(resolved);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    single: vi.fn().mockResolvedValue(resolved),
  };
  // All builder methods — includes bonus-specific ones (gte, in, order, limit)
  for (const m of [
    "select", "insert", "update", "delete", "eq", "upsert",
    "gte", "lte", "in", "order", "limit", "not", "is",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain as any;
}

function makeSupabaseClient(options: {
  user?: { id: string } | null;
  defaultFromResult?: { data?: unknown; error?: { message: string } | null };
} = {}) {
  const { user = { id: "user-123" }, defaultFromResult = {} } = options;
  const chain = makeMockChain(defaultFromResult);
  const fromFn = vi.fn().mockReturnValue(chain);
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: fromFn,
  };
  vi.mocked(createClient).mockResolvedValue(client as any);
  return { client, chain, fromFn };
}

const MOCK_BONUS = {
  id: "b1",
  bank: "chase",
  currency: "UR",
  partner: "United Airlines",
  partner_code: "UA",
  partner_type: "airline",
  bonus_percentage: 30,
  start_date: "2026-03-01",
  end_date: "2026-04-30",
  source_url: "https://example.com",
  is_active: true,
  scraped_at: "2026-03-31",
  created_at: "2026-03-01",
};

beforeEach(() => vi.clearAllMocks());

// ─── getActiveBonuses ──────────────────────────────────────────────────────────

describe("getActiveBonuses", () => {
  it("happy path: returns active bonus array", async () => {
    makeSupabaseClient({ defaultFromResult: { data: [MOCK_BONUS] } });

    const result = await getActiveBonuses();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].partner_code).toBe("UA");
    }
  });

  it("happy path: empty result returns success with empty array", async () => {
    makeSupabaseClient({ defaultFromResult: { data: [] } });

    const result = await getActiveBonuses();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it("transient error: DB query fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await getActiveBonuses();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── getActiveBonusesForUser ───────────────────────────────────────────────────

describe("getActiveBonusesForUser", () => {
  it("happy path: returns bonuses matching user's card currencies", async () => {
    const { fromFn } = makeSupabaseClient();
    const cardsChain = makeMockChain({ data: [{ currency: "UR" }, { currency: "MR" }] });
    const bonusesChain = makeMockChain({ data: [MOCK_BONUS] });
    fromFn.mockReturnValueOnce(cardsChain).mockReturnValue(bonusesChain);

    const result = await getActiveBonusesForUser();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
    // Bonus query should filter by the user's currencies
    expect(bonusesChain.in).toHaveBeenCalledWith("currency", expect.arrayContaining(["UR", "MR"]));
  });

  it("happy path: user has no cards — returns empty array without querying bonuses", async () => {
    const { fromFn } = makeSupabaseClient();
    const cardsChain = makeMockChain({ data: [] });
    fromFn.mockReturnValue(cardsChain);

    const result = await getActiveBonusesForUser();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
    // Should stop after the cards query — no second from() call for bonuses
    expect(fromFn).toHaveBeenCalledTimes(1);
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await getActiveBonusesForUser();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("permission");
    }
  });

  it("transient error: user_cards query fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await getActiveBonusesForUser();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
      expect(result.error.message).toContain("portfolio");
    }
  });

  it("transient error: transfer_bonuses query fails", async () => {
    const { fromFn } = makeSupabaseClient();
    const cardsChain = makeMockChain({ data: [{ currency: "UR" }] });
    const bonusesChain = makeMockChain({ error: { message: "timeout" } });
    fromFn.mockReturnValueOnce(cardsChain).mockReturnValue(bonusesChain);

    const result = await getActiveBonusesForUser();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── getBonusHistory ───────────────────────────────────────────────────────────

describe("getBonusHistory", () => {
  it("happy path: returns history without filters", async () => {
    const { chain } = makeSupabaseClient({ defaultFromResult: { data: [{ id: "h1" }] } });

    const result = await getBonusHistory();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
    }
    // No eq filter calls when no args passed
    expect(chain.eq).not.toHaveBeenCalled();
  });

  it("happy path: applies bank and partnerCode filters", async () => {
    const { chain } = makeSupabaseClient({ defaultFromResult: { data: [] } });

    const result = await getBonusHistory("chase", "UA");

    expect(result.success).toBe(true);
    expect(chain.eq).toHaveBeenCalledWith("bank", "chase");
    expect(chain.eq).toHaveBeenCalledWith("partner_code", "UA");
  });

  it("transient error: DB query fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await getBonusHistory();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});
