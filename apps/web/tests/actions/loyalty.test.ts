import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import {
  addLoyaltyBalance,
  updateLoyaltyBalance,
  removeLoyaltyBalance,
} from "@/app/actions/loyalty";

// --- Helpers ---

function fd(fields: Record<string, string>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.set(k, v);
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

const VALID_BALANCE_FIELDS = {
  program_name: "Chase Ultimate Rewards",
  program_code: "UR",
  program_type: "credit_card",
  balance: "75000",
  currency: "UR",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── addLoyaltyBalance ─────────────────────────────────────────────────────────

describe("addLoyaltyBalance", () => {
  it("happy path: inserts a loyalty balance and returns success", async () => {
    const { chain } = makeSupabaseClient();

    const result = await addLoyaltyBalance(fd(VALID_BALANCE_FIELDS));

    expect(result.success).toBe(true);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ balance: 75000, program_code: "UR" })
    );
  });

  it("validation error: missing required fields", async () => {
    makeSupabaseClient();

    // omit program_name
    const result = await addLoyaltyBalance(
      fd({ program_code: "UR", program_type: "credit_card", balance: "1000", currency: "UR" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("validation");
    }
  });

  it("validation error: balance is not a number", async () => {
    makeSupabaseClient();

    const result = await addLoyaltyBalance(
      fd({ ...VALID_BALANCE_FIELDS, balance: "not-a-number" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("validation");
    }
  });

  it("validation error: invalid program_type", async () => {
    makeSupabaseClient();

    const result = await addLoyaltyBalance(
      fd({ ...VALID_BALANCE_FIELDS, program_type: "crypto" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("validation");
      expect(result.error!.field).toBe("program_type");
    }
  });

  it("transient error: DB insert fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await addLoyaltyBalance(fd(VALID_BALANCE_FIELDS));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.isRetryable).toBe(true);
    }
  });

  it("validation error: duplicate program balance (unique violation 23505)", async () => {
    makeSupabaseClient({
      defaultFromResult: { error: { message: "duplicate key value", code: "23505" } },
    });

    const result = await addLoyaltyBalance(fd(VALID_BALANCE_FIELDS));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("validation");
      expect(result.error!.message).toContain("already exists");
    }
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await addLoyaltyBalance(fd(VALID_BALANCE_FIELDS));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("permission");
    }
  });
});

// ─── updateLoyaltyBalance ──────────────────────────────────────────────────────

describe("updateLoyaltyBalance", () => {
  it("happy path: updates balance and sets last_verified_at", async () => {
    const { chain } = makeSupabaseClient();

    const result = await updateLoyaltyBalance(
      fd({ balance_id: "bal-1", balance: "80000" })
    );

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ balance: 80000, last_verified_at: expect.any(String) })
    );
  });

  it("validation error: missing balance_id", async () => {
    makeSupabaseClient();

    const result = await updateLoyaltyBalance(fd({ balance: "80000" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("validation");
    }
  });

  it("validation error: balance is not a number", async () => {
    makeSupabaseClient();

    const result = await updateLoyaltyBalance(
      fd({ balance_id: "bal-1", balance: "abc" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("validation");
    }
  });

  it("transient error: DB update fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await updateLoyaltyBalance(
      fd({ balance_id: "bal-1", balance: "80000" })
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.isRetryable).toBe(true);
    }
  });
});

// ─── removeLoyaltyBalance ──────────────────────────────────────────────────────

describe("removeLoyaltyBalance", () => {
  it("happy path: soft-deletes the balance row and returns success", async () => {
    const { chain } = makeSupabaseClient();

    const result = await removeLoyaltyBalance(fd({ balance_id: "bal-1" }));

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalled();
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
  });

  it("validation error: missing balance_id", async () => {
    makeSupabaseClient();

    const result = await removeLoyaltyBalance(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("validation");
    }
  });

  it("transient error: DB soft-delete fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await removeLoyaltyBalance(fd({ balance_id: "bal-1" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.isRetryable).toBe(true);
    }
  });
});
