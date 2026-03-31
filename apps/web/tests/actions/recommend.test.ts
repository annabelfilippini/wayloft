import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { submitQuiz } from "@/app/actions/recommend";

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
  error?: { message: string } | null;
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
  defaultFromResult?: { data?: unknown; error?: { message: string } | null };
} = {}) {
  const { user = { id: "user-123" }, defaultFromResult = {} } = options;
  const chain = makeMockChain(defaultFromResult);
  const client = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) },
    from: vi.fn().mockReturnValue(chain),
  };
  vi.mocked(createClient).mockResolvedValue(client as any);
  return { client, chain };
}

const VALID_QUIZ = {
  monthly_dining_spend: "500",
  monthly_travel_spend: "200",
  monthly_grocery_spend: "300",
  monthly_gas_spend: "100",
  monthly_streaming_spend: "50",
  monthly_other_spend: "200",
  credit_score_range: "excellent",
  cards_opened_24mo: "2",
  cards_opened_48mo: "3",
  annual_fee_comfort: "high",
  travel_goal: "maximize_travel",
};

beforeEach(() => vi.clearAllMocks());

// ─── submitQuiz ────────────────────────────────────────────────────────────────

describe("submitQuiz", () => {
  it("happy path: upserts quiz data and returns parsed QuizData", async () => {
    const { chain } = makeSupabaseClient();

    const result = await submitQuiz(fd(VALID_QUIZ));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.monthly_dining_spend).toBe(500);
      expect(result.data?.travel_goal).toBe("maximize_travel");
      expect(result.data?.credit_score_range).toBe("excellent");
    }
    expect(chain.upsert).toHaveBeenCalled();
  });

  it("happy path: collects multiple current_card_slugs from FormData", async () => {
    const { chain } = makeSupabaseClient();

    const result = await submitQuiz(
      fd({ ...VALID_QUIZ, current_card_slugs: ["chase-sapphire-reserve", "amex-platinum"] })
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.current_card_slugs).toEqual([
        "chase-sapphire-reserve",
        "amex-platinum",
      ]);
    }
  });

  it("happy path: missing spend fields default to 0", async () => {
    const { chain } = makeSupabaseClient();

    // Omit spend fields entirely
    const result = await submitQuiz(
      fd({ credit_score_range: "good", annual_fee_comfort: "low", travel_goal: "cashback" })
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.monthly_dining_spend).toBe(0);
      expect(result.data?.monthly_gas_spend).toBe(0);
    }
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await submitQuiz(fd(VALID_QUIZ));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("permission");
    }
  });

  it("transient error: DB upsert fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await submitQuiz(fd(VALID_QUIZ));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});
