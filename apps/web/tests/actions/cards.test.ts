import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cards/catalog", () => ({ getCardBySlug: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import {
  addCard,
  updateSpendProgress,
  removeCard,
  logLifecycleEvent,
  logAnnualFeeEvent,
  markCreditUsed,
  enrollCredit,
  markPerkSetup,
  dismissPerk,
  addPaymentInfo,
  updatePaymentInfo,
  deletePaymentInfo,
} from "@/app/actions/cards";

// --- Helpers ---

function fd(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.set(k, v);
  }
  return form;
}

/**
 * Creates a chainable Supabase builder mock.
 *
 * - `await chain` resolves via the `then` binding (covers .update().eq().eq(), .delete().eq(), etc.)
 * - `chain.single()` resolves to the same result (covers .select().eq().single())
 * - All builder methods return `chain` so chains of any depth work.
 */
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
  slug: "test-card",
  name: "Test Card",
  issuer: "test",
  currency: "WF",
  annual_fee_cents: 9500,
  signup_bonus: { points: 50000, spend_requirement_cents: 400000, timeframe_months: 3 },
  credits: [],
  perks: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── addCard ───────────────────────────────────────────────────────────────────

describe("addCard", () => {
  beforeEach(() => {
    vi.mocked(getCardBySlug).mockReturnValue(MOCK_CATALOG_CARD as any);
  });

  it("happy path: inserts card and returns success", async () => {
    const { chain } = makeSupabaseClient();
    chain.single.mockResolvedValue({ data: { id: "new-card-id" }, error: null });

    const result = await addCard(fd({ card_slug: "test-card", card_since: "2024-01-01" }));

    expect(result.success).toBe(true);
    expect(chain.insert).toHaveBeenCalled();
  });

  it("validation error: missing card_slug", async () => {
    makeSupabaseClient();

    const result = await addCard(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("validation error: card_slug not in catalog", async () => {
    makeSupabaseClient();
    vi.mocked(getCardBySlug).mockReturnValue(undefined);

    const result = await addCard(fd({ card_slug: "not-a-real-card" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.message).toContain("not found");
    }
  });

  it("transient error: DB insert fails", async () => {
    const { chain } = makeSupabaseClient();
    chain.single.mockResolvedValue({
      data: null,
      error: { message: "connection error", code: "PGRST503" },
    });

    const result = await addCard(fd({ card_slug: "test-card" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });

  it("validation error: duplicate card (unique violation 23505)", async () => {
    const { chain } = makeSupabaseClient();
    chain.single.mockResolvedValue({
      data: null,
      error: { message: "duplicate key value", code: "23505" },
    });

    const result = await addCard(fd({ card_slug: "test-card" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.message).toContain("already have this card");
    }
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await addCard(fd({ card_slug: "test-card" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("permission");
    }
  });
});

// ─── updateSpendProgress ───────────────────────────────────────────────────────

describe("updateSpendProgress", () => {
  it("happy path: sets spend progress from an absolute dollar amount", async () => {
    const { chain } = makeSupabaseClient();

    const result = await updateSpendProgress(fd({ card_id: "card-1", amount: "500" }));

    expect(result.success).toBe(true);
    // $500 → 50000 cents
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ signup_spend_progress_cents: 50000 })
    );
  });

  it("happy path: increments spend from existing progress", async () => {
    const { fromFn } = makeSupabaseClient();
    const fetchChain = makeMockChain({ data: { signup_spend_progress_cents: 100000 } });
    const updateChain = makeMockChain({});
    fromFn.mockReturnValueOnce(fetchChain).mockReturnValue(updateChain);

    const result = await updateSpendProgress(fd({ card_id: "card-1", increment: "500" }));

    expect(result.success).toBe(true);
    // 100000 (existing) + 50000 ($500 increment) = 150000
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ signup_spend_progress_cents: 150000 })
    );
  });

  it("validation error: missing card_id", async () => {
    makeSupabaseClient();

    const result = await updateSpendProgress(fd({ amount: "500" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("validation error: negative increment value", async () => {
    makeSupabaseClient();

    const result = await updateSpendProgress(fd({ card_id: "card-1", increment: "-100" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.field).toBe("increment");
    }
  });

  it("transient error: DB update fails", async () => {
    const { fromFn } = makeSupabaseClient();
    const fetchChain = makeMockChain({ data: { signup_spend_progress_cents: 0 } });
    const updateChain = makeMockChain({ error: { message: "timeout" } });
    fromFn.mockReturnValueOnce(fetchChain).mockReturnValue(updateChain);

    const result = await updateSpendProgress(fd({ card_id: "card-1", increment: "100" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── removeCard ────────────────────────────────────────────────────────────────

describe("removeCard", () => {
  it("happy path: soft-deletes the card row and returns success", async () => {
    const { chain, fromFn } = makeSupabaseClient();
    // First call: soft-delete user_cards, second call: soft-delete user_payment_info
    const paymentChain = makeMockChain();
    fromFn.mockReturnValueOnce(chain).mockReturnValueOnce(paymentChain);

    const result = await removeCard(fd({ card_id: "card-1" }));

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalled();
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("validation error: missing card_id", async () => {
    makeSupabaseClient();

    const result = await removeCard(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB soft-delete fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await removeCard(fd({ card_id: "card-1" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── logLifecycleEvent ─────────────────────────────────────────────────────────

describe("logLifecycleEvent", () => {
  it("happy path: inserts a valid lifecycle event", async () => {
    const { chain } = makeSupabaseClient();

    const result = await logLifecycleEvent(
      fd({ user_card_id: "card-1", event_type: "annual_fee_posted" })
    );

    expect(result.success).toBe(true);
    expect(chain.insert).toHaveBeenCalled();
  });

  it("validation error: unknown event_type is rejected", async () => {
    makeSupabaseClient();

    const result = await logLifecycleEvent(
      fd({ user_card_id: "card-1", event_type: "not_a_real_event" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("validation error: missing user_card_id", async () => {
    makeSupabaseClient();

    const result = await logLifecycleEvent(fd({ event_type: "opened" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB insert fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "db error" } } });

    const result = await logLifecycleEvent(
      fd({ user_card_id: "card-1", event_type: "opened" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── logAnnualFeeEvent ─────────────────────────────────────────────────────────

describe("logAnnualFeeEvent", () => {
  it("happy path: inserts a valid annual fee event", async () => {
    const { chain } = makeSupabaseClient();

    const result = await logAnnualFeeEvent(
      fd({ user_card_id: "card-1", event_type: "annual_fee_posted" })
    );

    expect(result.success).toBe(true);
    expect(chain.insert).toHaveBeenCalled();
  });

  it("validation error: 'opened' is not a valid AF event type", async () => {
    makeSupabaseClient();

    // "opened" is a valid lifecycle event but NOT a valid annual_fee event
    const result = await logAnnualFeeEvent(
      fd({ user_card_id: "card-1", event_type: "opened" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB insert fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "db error" } } });

    const result = await logAnnualFeeEvent(
      fd({ user_card_id: "card-1", event_type: "retention_offer" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── markCreditUsed ────────────────────────────────────────────────────────────

describe("markCreditUsed", () => {
  it("happy path: marks a credit as fully used when no amount is specified", async () => {
    const { fromFn } = makeSupabaseClient();
    const fetchChain = makeMockChain({
      data: {
        id: "credit-1",
        user_id: "user-123",
        credit_amount_cents: 2500,
        amount_used_cents: 0,
      },
    });
    const updateChain = makeMockChain({});
    fromFn.mockReturnValueOnce(fetchChain).mockReturnValue(updateChain);

    const result = await markCreditUsed(fd({ credit_id: "credit-1" }));

    expect(result.success).toBe(true);
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount_used_cents: 2500, status: "used" })
    );
  });

  it("validation error: missing credit_id", async () => {
    makeSupabaseClient();

    const result = await markCreditUsed(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("validation error: credit not found in DB", async () => {
    // Default chain: single() returns { data: null, error: null } → credit is null
    makeSupabaseClient();

    const result = await markCreditUsed(fd({ credit_id: "nonexistent" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.message).toBe("Credit not found.");
    }
  });

  it("transient error: DB update fails", async () => {
    const { fromFn } = makeSupabaseClient();
    const fetchChain = makeMockChain({
      data: {
        id: "credit-1",
        user_id: "user-123",
        credit_amount_cents: 2500,
        amount_used_cents: 0,
      },
    });
    const updateChain = makeMockChain({ error: { message: "timeout" } });
    fromFn.mockReturnValueOnce(fetchChain).mockReturnValue(updateChain);

    const result = await markCreditUsed(fd({ credit_id: "credit-1" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── enrollCredit ──────────────────────────────────────────────────────────────

describe("enrollCredit", () => {
  it("happy path: sets enrolled=true on the credit row", async () => {
    const { chain } = makeSupabaseClient();

    const result = await enrollCredit(fd({ credit_id: "credit-1" }));

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({ enrolled: true });
  });

  it("validation error: missing credit_id", async () => {
    makeSupabaseClient();

    const result = await enrollCredit(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB update fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "db error" } } });

    const result = await enrollCredit(fd({ credit_id: "credit-1" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── markPerkSetup ─────────────────────────────────────────────────────────────

describe("markPerkSetup", () => {
  it("happy path: updates perk status to in_progress", async () => {
    const { chain } = makeSupabaseClient();

    const result = await markPerkSetup(fd({ perk_id: "perk-1", status: "in_progress" }));

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "in_progress" })
    );
  });

  it("happy path: sets completed_at when marking completed", async () => {
    const { chain } = makeSupabaseClient();

    const result = await markPerkSetup(fd({ perk_id: "perk-1", status: "completed" }));

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", completed_at: expect.any(String) })
    );
  });

  it("validation error: invalid status value", async () => {
    makeSupabaseClient();

    const result = await markPerkSetup(fd({ perk_id: "perk-1", status: "invalid_status" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.field).toBe("status");
    }
  });

  it("validation error: missing perk_id", async () => {
    makeSupabaseClient();

    const result = await markPerkSetup(fd({ status: "completed" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB update fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "db error" } } });

    const result = await markPerkSetup(fd({ perk_id: "perk-1", status: "in_progress" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── dismissPerk ───────────────────────────────────────────────────────────────

describe("dismissPerk", () => {
  it("happy path: sets perk status to not_applicable", async () => {
    const { chain } = makeSupabaseClient();

    const result = await dismissPerk(fd({ perk_id: "perk-1" }));

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith({ status: "not_applicable" });
  });

  it("validation error: missing perk_id", async () => {
    makeSupabaseClient();

    const result = await dismissPerk(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB update fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "db error" } } });

    const result = await dismissPerk(fd({ perk_id: "perk-1" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── addPaymentInfo ────────────────────────────────────────────────────────────

describe("addPaymentInfo", () => {
  it("happy path: inserts payment info with autopay enabled", async () => {
    const { chain } = makeSupabaseClient();

    const result = await addPaymentInfo(
      fd({
        user_card_id: "card-1",
        card_slug: "test-card",
        due_day: "15",
        autopay_enabled: "true",
        autopay_type: "full_balance",
      })
    );

    expect(result.success).toBe(true);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        due_day: 15,
        autopay_enabled: true,
        autopay_type: "full_balance",
      })
    );
  });

  it("validation error: due_day > 28 is out of range", async () => {
    makeSupabaseClient();

    const result = await addPaymentInfo(
      fd({ user_card_id: "card-1", card_slug: "test-card", due_day: "31" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.field).toBe("due_day");
    }
  });

  it("validation error: missing required fields (user_card_id + card_slug)", async () => {
    makeSupabaseClient();

    const result = await addPaymentInfo(fd({ due_day: "15" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB insert fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await addPaymentInfo(
      fd({ user_card_id: "card-1", card_slug: "test-card", due_day: "15" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });

  it("validation error: duplicate payment info (unique violation 23505)", async () => {
    makeSupabaseClient({
      defaultFromResult: { error: { message: "duplicate key value", code: "23505" } },
    });

    const result = await addPaymentInfo(
      fd({ user_card_id: "card-1", card_slug: "test-card", due_day: "15" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.message).toContain("already exists");
    }
  });
});

// ─── updatePaymentInfo ─────────────────────────────────────────────────────────

describe("updatePaymentInfo", () => {
  it("happy path: updates due_day", async () => {
    const { chain } = makeSupabaseClient();

    const result = await updatePaymentInfo(
      fd({ payment_info_id: "pi-1", due_day: "20" })
    );

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ due_day: 20 }));
  });

  it("validation error: no changes provided", async () => {
    makeSupabaseClient();

    const result = await updatePaymentInfo(fd({ payment_info_id: "pi-1" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
      expect(result.error.message).toBe("No changes provided.");
    }
  });

  it("validation error: missing payment_info_id", async () => {
    makeSupabaseClient();

    const result = await updatePaymentInfo(fd({ due_day: "15" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB update fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await updatePaymentInfo(
      fd({ payment_info_id: "pi-1", due_day: "20" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});

// ─── deletePaymentInfo ─────────────────────────────────────────────────────────

describe("deletePaymentInfo", () => {
  it("happy path: soft-deletes the payment info row and returns success", async () => {
    const { chain } = makeSupabaseClient();

    const result = await deletePaymentInfo(fd({ payment_info_id: "pi-1" }));

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalled();
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("validation error: missing payment_info_id", async () => {
    makeSupabaseClient();

    const result = await deletePaymentInfo(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("validation");
    }
  });

  it("transient error: DB soft-delete fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await deletePaymentInfo(fd({ payment_info_id: "pi-1" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.category).toBe("transient");
      expect(result.error.isRetryable).toBe(true);
    }
  });
});
