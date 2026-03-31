import { vi, describe, it, expect, afterEach } from "vitest";
import { diffBonuses, applyChanges, scrapeAllSources } from "@/lib/bonuses/scraper";
import type { DiffResult } from "@/lib/bonuses/scraper";

// --- Mock chain for applyChanges (takes SupabaseClient directly, no createClient needed) ---

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

function makeMockSupabaseClient(defaultResult: {
  data?: unknown;
  error?: { message: string } | null;
} = {}) {
  const chain = makeMockChain(defaultResult);
  const fromFn = vi.fn().mockReturnValue(chain);
  const supabase = { from: fromFn };
  return { supabase, chain, fromFn };
}

// Minimal valid NormalizedBonus shape
const makeBonus = (bank: string, partnerCode: string, confidence = 0.85) => ({
  bank,
  currency: "UR",
  partner: "Test Partner",
  partner_code: partnerCode,
  partner_type: "airline" as const,
  bonus_percentage: 30,
  start_date: "2026-03-01",
  end_date: "2026-04-30",
  source_url: "https://example.com",
  retrieved_date: "2026-03-31T12:00:00.000Z",
  confidence,
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── diffBonuses ───────────────────────────────────────────────────────────────

describe("diffBonuses", () => {
  it("identifies new bonuses: in scraped but not in existing", () => {
    const scraped = [makeBonus("chase", "UA"), makeBonus("amex", "DL")];
    const existing = [{ id: "e1", bank: "chase", partner_code: "UA", bonus_percentage: 30 }];

    const result = diffBonuses(scraped, existing);

    expect(result.newBonuses).toHaveLength(1);
    expect(result.newBonuses[0].partner_code).toBe("DL");
    expect(result.unchanged).toHaveLength(1);
    expect(result.expiredBonuses).toHaveLength(0);
  });

  it("identifies unchanged bonuses: key present in both scraped and existing", () => {
    const scraped = [makeBonus("chase", "UA")];
    const existing = [{ id: "e1", bank: "chase", partner_code: "UA", bonus_percentage: 30 }];

    const result = diffBonuses(scraped, existing);

    expect(result.unchanged).toHaveLength(1);
    expect(result.newBonuses).toHaveLength(0);
    expect(result.expiredBonuses).toHaveLength(0);
  });

  it("identifies expired bonuses: in existing but not in scraped", () => {
    const scraped: ReturnType<typeof makeBonus>[] = [];
    const existing = [{ id: "e1", bank: "chase", partner_code: "UA", bonus_percentage: 30 }];

    const result = diffBonuses(scraped, existing);

    expect(result.expiredBonuses).toHaveLength(1);
    expect(result.expiredBonuses[0].id).toBe("e1");
    expect(result.newBonuses).toHaveLength(0);
    expect(result.unchanged).toHaveLength(0);
  });

  it("handles all three cases simultaneously", () => {
    const scraped = [makeBonus("chase", "UA"), makeBonus("amex", "SQ")]; // UA=unchanged, SQ=new
    const existing = [
      { id: "e1", bank: "chase", partner_code: "UA", bonus_percentage: 30 }, // unchanged
      { id: "e2", bank: "citi", partner_code: "TK", bonus_percentage: 25 }, // expired
    ];

    const result = diffBonuses(scraped, existing);

    expect(result.newBonuses).toHaveLength(1);
    expect(result.newBonuses[0].partner_code).toBe("SQ");
    expect(result.unchanged).toHaveLength(1);
    expect(result.unchanged[0].partner_code).toBe("UA");
    expect(result.expiredBonuses).toHaveLength(1);
    expect(result.expiredBonuses[0].id).toBe("e2");
  });

  it("preserves retrieved_date and confidence through diff output", () => {
    const scraped = [makeBonus("chase", "UA", 0.90)];
    const existing: Array<{ id: string; bank: string; partner_code: string; bonus_percentage: number }> = [];

    const result = diffBonuses(scraped, existing);

    expect(result.newBonuses).toHaveLength(1);
    expect(result.newBonuses[0].retrieved_date).toBe("2026-03-31T12:00:00.000Z");
    expect(result.newBonuses[0].confidence).toBe(0.90);
  });
});

// ─── applyChanges ──────────────────────────────────────────────────────────────

describe("applyChanges", () => {
  it("happy path: inserts new bonuses and returns inserted count", async () => {
    const { supabase } = makeMockSupabaseClient();
    const changes: DiffResult = {
      newBonuses: [makeBonus("chase", "UA"), makeBonus("amex", "DL")],
      expiredBonuses: [],
      unchanged: [],
    };

    const result = await applyChanges(supabase as any, changes, "2026-03-31");

    expect(result.inserted).toBe(2);
    expect(result.expired).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("upsert payload includes retrieved_at and confidence from normalized bonus", async () => {
    const { supabase, chain } = makeMockSupabaseClient();
    const bonus = makeBonus("chase", "UA", 0.90);
    const changes: DiffResult = {
      newBonuses: [bonus],
      expiredBonuses: [],
      unchanged: [],
    };

    await applyChanges(supabase as any, changes, "2026-03-31");

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        retrieved_at: "2026-03-31T12:00:00.000Z",
        confidence: 0.90,
      }),
      expect.any(Object)
    );
  });

  it("happy path: expires old bonuses — deactivates and copies to history", async () => {
    const fullBonus = {
      id: "b1", bank: "chase", currency: "UR", partner: "United",
      partner_code: "UA", bonus_percentage: 30,
      start_date: "2026-01-01", end_date: "2026-02-28",
      retrieved_at: "2026-01-01T10:00:00.000Z", confidence: 0.85,
    };
    const { fromFn } = makeMockSupabaseClient();
    // Call sequence per expired bonus: select (single), history insert, deactivate update
    const fetchChain = makeMockChain({ data: fullBonus });
    const histChain = makeMockChain({});
    const deactivateChain = makeMockChain({});
    fromFn
      .mockReturnValueOnce(fetchChain)   // select full bonus
      .mockReturnValueOnce(histChain)    // insert into history
      .mockReturnValue(deactivateChain); // update is_active = false

    const changes: DiffResult = {
      newBonuses: [],
      expiredBonuses: [{ id: "b1", bank: "chase", partner_code: "UA" }],
      unchanged: [],
    };

    const result = await applyChanges({ from: fromFn } as any, changes, "2026-03-31");

    expect(result.expired).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(deactivateChain.update).toHaveBeenCalledWith({ is_active: false });
    // Verify history copy includes attribution fields
    expect(histChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        retrieved_at: "2026-01-01T10:00:00.000Z",
        confidence: 0.85,
      })
    );
  });

  it("DB error on upsert: records error but does not throw — continues processing", async () => {
    const { fromFn } = makeMockSupabaseClient();
    const errorChain = makeMockChain({ error: { message: "db failure" } });
    const successChain = makeMockChain({});
    fromFn
      .mockReturnValueOnce(errorChain)  // first bonus fails
      .mockReturnValue(successChain);   // second bonus succeeds

    const changes: DiffResult = {
      newBonuses: [makeBonus("chase", "UA"), makeBonus("amex", "DL")],
      expiredBonuses: [],
      unchanged: [],
    };

    const result = await applyChanges({ from: fromFn } as any, changes, "2026-03-31");

    // One error, one success — pipeline didn't abort
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("INSERT");
    expect(result.inserted).toBe(1);
  });
});

// ─── scrapeAllSources ──────────────────────────────────────────────────────────

describe("scrapeAllSources", () => {
  it("fetch_failure: all source statuses are fetch_failure when network throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { sourceResults, allBonuses } = await scrapeAllSources();

    expect(allBonuses).toHaveLength(0);
    for (const name of Object.keys(sourceResults)) {
      expect(sourceResults[name].status).toBe("fetch_failure");
      expect(sourceResults[name].bonusesFound).toBe(0);
    }
  });

  it("parse_failure: fetch succeeds but HTML yields 0 bonuses — status is parse_failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        text: vi.fn().mockResolvedValue("<html><body><p>No bonuses here.</p></body></html>"),
      })
    );

    const { sourceResults, allBonuses } = await scrapeAllSources();

    expect(allBonuses).toHaveLength(0);
    for (const name of Object.keys(sourceResults)) {
      expect(sourceResults[name].status).toBe("parse_failure");
      expect(sourceResults[name].bonusesFound).toBe(0);
    }
  });

  it("non-200 response: HTTP error triggers fetch_failure for that source", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: { get: () => null },
        text: vi.fn().mockResolvedValue(""),
      })
    );

    const { sourceResults, allBonuses } = await scrapeAllSources();

    expect(allBonuses).toHaveLength(0);
    for (const name of Object.keys(sourceResults)) {
      // safeFetch throws on non-ok response → caught as fetch_failure
      expect(sourceResults[name].status).toBe("fetch_failure");
    }
  });
});
