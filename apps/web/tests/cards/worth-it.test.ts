import { describe, it, expect } from "vitest";
import {
  computeValueBreakdown,
  computeWorthItVerdict,
  formatCents,
} from "@/lib/cards/worth-it";

describe("computeValueBreakdown", () => {
  it("returns 'keep' when credits + perks exceed AF by $50+", () => {
    // AF: $550, Credits: $400, Perks: $300 → net = +$150
    const result = computeValueBreakdown(55000, 40000, 30000);
    expect(result.verdict).toBe("keep");
    expect(result.netValueCents).toBe(15000);
    expect(result.creditsValueCents).toBe(40000);
    expect(result.perksValueCents).toBe(30000);
    expect(result.totalValueCents).toBe(70000);
  });

  it("returns 'call' when net value is between -$50 and +$50", () => {
    // AF: $550, Credits: $300, Perks: $200 → net = -$50 (exactly at boundary)
    const result = computeValueBreakdown(55000, 30000, 20000);
    expect(result.verdict).toBe("call");
    expect(result.netValueCents).toBe(-5000);
  });

  it("returns 'call' when net value is exactly +$49", () => {
    // AF: $550, Credits: $350, Perks: $249 → net = +$49
    const result = computeValueBreakdown(55000, 35000, 24900);
    expect(result.verdict).toBe("call");
    expect(result.netValueCents).toBe(4900);
  });

  it("returns 'downgrade' when net value is below -$50", () => {
    // AF: $550, Credits: $100, Perks: $50 → net = -$400
    const result = computeValueBreakdown(55000, 10000, 5000);
    expect(result.verdict).toBe("downgrade");
    expect(result.netValueCents).toBe(-40000);
  });

  it("returns 'keep' for $0 AF card (net is always non-negative)", () => {
    const result = computeValueBreakdown(0, 0, 0);
    expect(result.verdict).toBe("call"); // net = 0, within -$50 to +$50
    expect(result.netValueCents).toBe(0);
  });

  it("returns 'keep' for $0 AF card with any credits", () => {
    const result = computeValueBreakdown(0, 10000, 5000);
    expect(result.verdict).toBe("keep");
    expect(result.netValueCents).toBe(15000);
  });

  it("returns 'downgrade' with no credits and no perks on premium card", () => {
    // AF: $695, Credits: $0, Perks: $0 → net = -$695
    const result = computeValueBreakdown(69500, 0, 0);
    expect(result.verdict).toBe("downgrade");
    expect(result.netValueCents).toBe(-69500);
  });

  it("returns 'keep' at exact +$50 boundary", () => {
    // AF: $100, Credits: $100, Perks: $50 → net = +$50
    const result = computeValueBreakdown(10000, 10000, 5000);
    expect(result.verdict).toBe("keep");
    expect(result.netValueCents).toBe(5000);
  });

  it("returns 'call' just below +$50 boundary", () => {
    // AF: $100, Credits: $100, Perks: $49.99 → net = +$49.99
    const result = computeValueBreakdown(10000, 10000, 4999);
    expect(result.verdict).toBe("call");
    expect(result.netValueCents).toBe(4999);
  });

  it("returns 'downgrade' just below -$50 boundary", () => {
    // AF: $100, Credits: $25, Perks: $24.99 → net = -$50.01
    const result = computeValueBreakdown(10000, 2500, 2499);
    expect(result.verdict).toBe("downgrade");
    expect(result.netValueCents).toBe(-5001);
  });
});

describe("computeWorthItVerdict", () => {
  it("computes verdict from toggled credits and perks", () => {
    const creditToggles = { dining: true, streaming: true, uber: false };
    const creditValues = { dining: 12000, streaming: 18000, uber: 24000 };
    const perkToggles = { lounge: true, tsa: false };
    const perkValues = { lounge: 40000, tsa: 10000 };

    // Credits: $120 + $180 = $300, Perks: $400, AF: $695 → net = +$5
    const result = computeWorthItVerdict(69500, creditToggles, creditValues, perkToggles, perkValues);
    expect(result.verdict).toBe("call");
    expect(result.creditsValueCents).toBe(30000);
    expect(result.perksValueCents).toBe(40000);
    expect(result.netValueCents).toBe(500);
  });

  it("returns 'downgrade' with all toggles off", () => {
    const result = computeWorthItVerdict(
      55000,
      { dining: false, streaming: false },
      { dining: 12000, streaming: 18000 },
      { lounge: false },
      { lounge: 40000 }
    );
    expect(result.verdict).toBe("downgrade");
    expect(result.creditsValueCents).toBe(0);
    expect(result.perksValueCents).toBe(0);
    expect(result.netValueCents).toBe(-55000);
  });

  it("returns 'keep' with all toggles on for a valuable card", () => {
    const result = computeWorthItVerdict(
      55000,
      { dining: true, streaming: true, uber: true },
      { dining: 12000, streaming: 18000, uber: 24000 },
      { lounge: true, tsa: true },
      { lounge: 40000, tsa: 10000 }
    );
    // Credits: $540, Perks: $500, AF: $550 → net = +$490
    expect(result.verdict).toBe("keep");
    expect(result.netValueCents).toBe(49000);
  });

  it("handles unknown toggle keys gracefully (defaults to 0)", () => {
    const result = computeWorthItVerdict(
      10000,
      { nonexistent: true },
      { other_key: 5000 },
      {},
      {}
    );
    expect(result.creditsValueCents).toBe(0);
    expect(result.netValueCents).toBe(-10000);
  });
});

describe("formatCents", () => {
  it("formats cents to dollar string", () => {
    expect(formatCents(55000)).toBe("$550");
    expect(formatCents(0)).toBe("$0");
    expect(formatCents(9900)).toBe("$99");
  });

  it("truncates partial cents", () => {
    expect(formatCents(55050)).toBe("$551");
  });
});
