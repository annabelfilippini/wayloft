// Worth-It verdict logic — extracted from af-decision-helper.tsx
// Used by both the authenticated AF decision helper and the public worth-it tool.

export type Verdict = "keep" | "call" | "downgrade";

export interface ValueBreakdownResult {
  creditsValueCents: number;
  perksValueCents: number;
  totalValueCents: number;
  netValueCents: number;
  verdict: Verdict;
}

/**
 * Compute whether a card is "worth it" based on credits used + perks activated vs annual fee.
 *
 * Thresholds:
 *   net >= +$50 → keep
 *   net between -$50 and +$50 → call (retention)
 *   net < -$50 → downgrade
 */
export function computeValueBreakdown(
  annualFeeCents: number,
  creditsUsedCents: number,
  perksActivatedCents: number
): ValueBreakdownResult {
  const creditsValueCents = creditsUsedCents;
  const perksValueCents = perksActivatedCents;
  const totalValueCents = creditsValueCents + perksValueCents;
  const netValueCents = totalValueCents - annualFeeCents;

  let verdict: Verdict;
  if (netValueCents >= 5000) {
    verdict = "keep";
  } else if (netValueCents >= -5000) {
    verdict = "call";
  } else {
    verdict = "downgrade";
  }

  return { creditsValueCents, perksValueCents, totalValueCents, netValueCents, verdict };
}

/**
 * Compute verdict from toggle-based inputs (for the public worth-it tool).
 * Each toggle maps to a credit or perk with a known cent value.
 */
export function computeWorthItVerdict(
  annualFeeCents: number,
  creditToggles: Record<string, boolean>,
  creditValues: Record<string, number>,
  perkToggles: Record<string, boolean>,
  perkValues: Record<string, number>
): ValueBreakdownResult {
  const creditsUsedCents = Object.entries(creditToggles)
    .filter(([, on]) => on)
    .reduce((sum, [key]) => sum + (creditValues[key] ?? 0), 0);

  const perksActivatedCents = Object.entries(perkToggles)
    .filter(([, on]) => on)
    .reduce((sum, [key]) => sum + (perkValues[key] ?? 0), 0);

  return computeValueBreakdown(annualFeeCents, creditsUsedCents, perksActivatedCents);
}

export const verdictConfig: Record<
  Verdict,
  { label: string; color: string; bgColor: string }
> = {
  keep: {
    label: "KEEP",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  call: {
    label: "CALL FOR RETENTION",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  downgrade: {
    label: "CONSIDER DOWNGRADE",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
