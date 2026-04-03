import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import {
  updateProfile,
  updateNotificationPreferences,
  exportUserData,
  deleteAccount,
} from "@/app/actions/profile";

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
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: fromFn,
  };
  vi.mocked(createClient).mockResolvedValue(client as any);
  return { client, chain, fromFn };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── updateProfile ─────────────────────────────────────────────────────────────

describe("updateProfile", () => {
  it("happy path: updates profile with normalized values", async () => {
    const { chain } = makeSupabaseClient();

    const result = await updateProfile(
      fd({
        full_name: "Annabel",
        home_airport: "  ord  ",
        preferred_cabin: "business",
        experience_level: "advanced",
        preferred_airlines: "AA, UA, DL",
      })
    );

    expect(result.success).toBe(true);
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Annabel",
        home_airport: "ORD",
        preferred_cabin: "business",
        experience_level: "advanced",
        preferred_airlines: ["AA", "UA", "DL"],
      })
    );
  });

  it("defaults preferred_cabin to 'economy' when not provided", async () => {
    const { chain } = makeSupabaseClient();

    await updateProfile(fd({}));

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ preferred_cabin: "economy" })
    );
  });

  it("sets experience_level to null for an invalid value", async () => {
    const { chain } = makeSupabaseClient();

    await updateProfile(fd({ experience_level: "expert" }));

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ experience_level: null })
    );
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await updateProfile(fd({ full_name: "Test" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("permission");
    }
  });

  it("transient error: DB update fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await updateProfile(fd({ full_name: "Test" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.isRetryable).toBe(true);
    }
  });
});

// ─── updateNotificationPreferences ────────────────────────────────────────────

describe("updateNotificationPreferences", () => {
  it("happy path: upserts preferences with correct boolean values", async () => {
    const { chain } = makeSupabaseClient();

    const result = await updateNotificationPreferences(
      fd({ email_bonus_alerts: "on", email_weekly_digest: "on" })
      // email_price_alerts omitted → should be false
    );

    expect(result.success).toBe(true);
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email_bonus_alerts: true,
        email_price_alerts: false,
        email_weekly_digest: true,
      })
    );
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await updateNotificationPreferences(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("permission");
    }
  });

  it("transient error: DB upsert fails", async () => {
    makeSupabaseClient({ defaultFromResult: { error: { message: "timeout" } } });

    const result = await updateNotificationPreferences(fd({}));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.isRetryable).toBe(true);
    }
  });
});

// ─── exportUserData ────────────────────────────────────────────────────────────

describe("exportUserData", () => {
  it("happy path: returns assembled data from all three queries", async () => {
    const { fromFn } = makeSupabaseClient();
    const mockCard = { id: "card-1", card_slug: "chase-sapphire-preferred" };
    const mockBalance = { id: "bal-1", program_code: "UR" };
    const mockProfile = { id: "user-123", email: "test@example.com" };

    // Promise.all fires from() in order: cards → balances → profile
    const cardsChain = makeMockChain({ data: [mockCard] });
    const balancesChain = makeMockChain({ data: [mockBalance] });
    const profileChain = makeMockChain({ data: mockProfile });
    fromFn
      .mockReturnValueOnce(cardsChain)
      .mockReturnValueOnce(balancesChain)
      .mockReturnValueOnce(profileChain);

    const result = await exportUserData();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.cards).toEqual([mockCard]);
      expect(result.data?.loyalty_balances).toEqual([mockBalance]);
      expect(result.data?.profile).toEqual(mockProfile);
      expect(result.data?.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await exportUserData();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("permission");
    }
  });

  it("transient error: cards query fails", async () => {
    const { fromFn } = makeSupabaseClient();
    fromFn
      .mockReturnValueOnce(makeMockChain({ error: { message: "timeout" } }))
      .mockReturnValueOnce(makeMockChain({ data: [] }))
      .mockReturnValueOnce(makeMockChain({ data: { id: "user-123" } }));

    const result = await exportUserData();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.message).toContain("card");
    }
  });

  it("transient error: balances query fails", async () => {
    const { fromFn } = makeSupabaseClient();
    fromFn
      .mockReturnValueOnce(makeMockChain({ data: [] }))
      .mockReturnValueOnce(makeMockChain({ error: { message: "timeout" } }))
      .mockReturnValueOnce(makeMockChain({ data: { id: "user-123" } }));

    const result = await exportUserData();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.message).toContain("balance");
    }
  });

  it("transient error: profile query fails", async () => {
    const { fromFn } = makeSupabaseClient();
    fromFn
      .mockReturnValueOnce(makeMockChain({ data: [] }))
      .mockReturnValueOnce(makeMockChain({ data: [] }))
      .mockReturnValueOnce(makeMockChain({ error: { message: "timeout" } }));

    const result = await exportUserData();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.message).toContain("profile");
    }
  });
});

// ─── deleteAccount ─────────────────────────────────────────────────────────────

describe("deleteAccount", () => {
  it("happy path: deletes profile row and signs the user out", async () => {
    const { client, chain } = makeSupabaseClient();

    const result = await deleteAccount();

    expect(result.success).toBe(true);
    expect(chain.delete).toHaveBeenCalled();
    expect(client.auth.signOut).toHaveBeenCalled();
  });

  it("permission error: unauthenticated user", async () => {
    makeSupabaseClient({ user: null });

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("permission");
    }
  });

  it("transient error: DB delete fails — does not sign out", async () => {
    const { client } = makeSupabaseClient({
      defaultFromResult: { error: { message: "timeout" } },
    });

    const result = await deleteAccount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error!.category).toBe("transient");
      expect(result.error!.isRetryable).toBe(true);
    }
    // signOut should not be called if the delete failed
    expect(client.auth.signOut).not.toHaveBeenCalled();
  });
});
