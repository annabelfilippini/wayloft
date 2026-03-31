import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cards/catalog", () => ({ getCardBySlug: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import { completeOnboarding, skipOnboarding } from "@/app/actions/onboarding";

// --- Helpers ---

function fd(fields: Record<string, string | string[]>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (Array.isArray(v)) {
      for (const item of v) form.append(k, item);
    } else {
      form.set(k, v);
    }
  }
  return form;
}

function makeMockChain(result: {
  data?: unknown;
  error?: { message: string; code?: string } | null;
} = {}) {
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
  defaultFromResult?: {
    data?: unknown;
    error?: { message: string; code?: string } | null;
  };
} = {}) {
  const { user = { id: "user-123" }, defaultFromResult = {} } = options;
  const chain = makeMockChain(defaultFromResult);
  const fromFn = vi.fn().mockReturnValue(chain);
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: fromFn,
  };
  vi.mocked(createClient).mockResolvedValue(client as any);
  return { client, chain, fromFn };
}

const MOCK_CATALOG_CARD = {
  slug: "chase-sapphire-preferred",
  name: "Chase Sapphire Preferred",
  issuer: "chase",
  currency: "UR",
  annual_fee_cents: 9500,
  signup_bonus: { points: 60000, spend_requirement_cents: 400000, timeframe_months: 3 },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCardBySlug).mockReturnValue(MOCK_CATALOG_CARD as any);
});

// ─── completeOnboarding ────────────────────────────────────────────────────────

describe("completeOnboarding", () => {
  it("happy path: saves cards, quiz goal, and profile — returns success", async () => {
    const { chain } = makeSupabaseClient();

    const result = await completeOnboarding(
      fd({
        card_slugs: ["chase-sapphire-preferred"],
        travel_goal: "maximize_travel",
        home_airport: "ORD",
        experience_level: "intermediate",
      })
    );

    expect(result.success).toBe(true);
    // cards upserted, quiz upserted, profile updated
    expect(chain.upsert).toHaveBeenCalledTimes(2);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed: true, home_airport: "ORD" })
    );
  });

  it("happy path: no cards or goal — only profile update runs", async () => {
    const { chain } = makeSupabaseClient();

    const result = await completeOnboarding(fd({}));

    expect(result.success).toBe(true);
    expect(chain.upsert).not.toHaveBeenCalled();
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed: true })
    );
  });

  it("trims and uppercases the home_airport value", async () => {
    const { chain } = makeSupabaseClient();

    await completeOnboarding(fd({ home_airport: "  ord  " }));

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ home_airport: "ORD" })
    );
  });

  it("transient error: cards upsert fails", async () => {
    // Provide cards so the upsert runs, then fail on that call
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await completeOnboarding(
      fd({ card_slugs: ["chase-sapphire-preferred"] })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });

  it("transient error: quiz upsert fails", async () => {
    // No cards (skips card upsert), travel_goal provided so quiz upsert is first from() call
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await completeOnboarding(fd({ travel_goal: "maximize_travel" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });

  it("transient error: profile update fails", async () => {
    // No cards, no goal — only the profile update runs
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await completeOnboarding(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await completeOnboarding(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("permission");
    }
  });
});

// ─── skipOnboarding ────────────────────────────────────────────────────────────

describe("skipOnboarding", () => {
  it("happy path: returns success without writing to DB", async () => {
    const { fromFn } = makeSupabaseClient();

    const result = await skipOnboarding();

    expect(result.success).toBe(true);
    expect(fromFn).not.toHaveBeenCalled();
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await skipOnboarding();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("permission");
    }
  });
});
