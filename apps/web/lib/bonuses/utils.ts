import type { TransferBonus, TransferBonusHistory, UserCard, LoyaltyBalance, BonusPattern } from "@wayloft/shared";

/** Map issuer slug → transferable currency code */
export const BANK_CURRENCY_MAP: Record<string, string> = {
  chase: "UR",
  amex: "MR",
  citi: "TYP",
  capital_one: "C1",
  bilt: "BILT",
  wells_fargo: "WF",
  us_bank: "ALTITUDE",
};

/** Map currency code → display name */
export const CURRENCY_DISPLAY_NAMES: Record<string, string> = {
  UR: "Chase Ultimate Rewards",
  MR: "Amex Membership Rewards",
  TYP: "Citi ThankYou Points",
  C1: "Capital One Miles",
  BILT: "Bilt Rewards",
  WF: "Wells Fargo Rewards",
  ALTITUDE: "U.S. Bank Altitude Rewards",
};

/** Map bank slug → display name */
export const BANK_DISPLAY_NAMES: Record<string, string> = {
  chase: "Chase",
  amex: "Amex",
  citi: "Citi",
  capital_one: "Capital One",
  bilt: "Bilt",
  wells_fargo: "Wells Fargo",
  us_bank: "U.S. Bank",
};

/**
 * Derive which bank currencies a user holds based on their active cards.
 */
export function getUserCurrencies(userCards: Pick<UserCard, "currency">[]): string[] {
  return [...new Set(userCards.map((c) => c.currency))];
}

export type BonusUrgency = "critical" | "warning" | "info";

/**
 * Determine urgency based on how soon a bonus ends.
 */
export function getBonusUrgency(endDate: string | null): BonusUrgency {
  if (!endDate) return "info";

  const now = new Date();
  const end = new Date(endDate + "T23:59:59");
  const diffMs = end.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 48) return "critical";
  if (diffHours <= 7 * 24) return "warning";
  return "info";
}

/**
 * Calculate days remaining until end date.
 */
export function getDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate + "T00:00:00");
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Enrich a bonus with a personalized message based on user's balance.
 * Returns a string like "Your 80,000 UR → 104,000 Hyatt points"
 */
export function enrichBonusWithBalance(
  bonus: TransferBonus,
  balances: Pick<LoyaltyBalance, "program_code" | "balance" | "currency">[],
  _transferPartners?: unknown
): string | null {
  // Find user's balance for this currency
  const balance = balances.find((b) => b.currency === bonus.currency);
  if (!balance || balance.balance <= 0) return null;

  const baseRatio = 1; // Most transfer ratios are 1:1
  const bonusMultiplier = 1 + bonus.bonus_percentage / 100;
  const transferredPoints = Math.round(balance.balance * baseRatio * bonusMultiplier);

  return `Your ${balance.balance.toLocaleString()} ${bonus.currency} → ${transferredPoints.toLocaleString()} ${bonus.partner} points`;
}

/**
 * Compute frequency label from average days between occurrences.
 */
function frequencyLabel(avgDays: number): string {
  if (avgDays <= 45) return "~monthly";
  if (avgDays <= 105) return "~quarterly";
  if (avgDays <= 150) return "~3x/year";
  if (avgDays <= 210) return "~2x/year";
  if (avgDays <= 400) return "~yearly";
  return "rare";
}

/**
 * Analyze transfer bonus history to surface patterns.
 * Groups by bank+partner, computes frequency and typical bonus range.
 */
export function analyzePatterns(history: TransferBonusHistory[]): BonusPattern[] {
  // Group by bank + partner_code
  const groups = new Map<string, TransferBonusHistory[]>();
  for (const h of history) {
    const key = `${h.bank}::${h.partner_code}`;
    const list = groups.get(key) ?? [];
    list.push(h);
    groups.set(key, list);
  }

  const now = new Date();
  const patterns: BonusPattern[] = [];

  for (const [, records] of groups) {
    if (records.length < 2) continue; // Need at least 2 data points

    // Sort by start_date ascending
    const sorted = [...records].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    const bonuses = sorted.map((r) => r.bonus_percentage);
    const avgBonus = Math.round(bonuses.reduce((s, v) => s + v, 0) / bonuses.length);

    // Compute average gap between start dates
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].start_date).getTime();
      const curr = new Date(sorted[i].start_date).getTime();
      gaps.push((curr - prev) / 86_400_000);
    }
    const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((s, v) => s + v, 0) / gaps.length) : 365;

    const lastRecord = sorted[sorted.length - 1];
    const lastEnd = new Date(lastRecord.end_date);
    const daysSince = Math.max(0, Math.ceil((now.getTime() - lastEnd.getTime()) / 86_400_000));

    patterns.push({
      bank: lastRecord.bank,
      currency: lastRecord.currency,
      partner: lastRecord.partner,
      partnerCode: lastRecord.partner_code,
      occurrences: sorted.length,
      avgBonusPercentage: avgBonus,
      minBonusPercentage: Math.min(...bonuses),
      maxBonusPercentage: Math.max(...bonuses),
      avgFrequencyDays: avgGap,
      frequencyLabel: frequencyLabel(avgGap),
      lastSeen: lastRecord.end_date,
      daysSinceLastSeen: daysSince,
      confidenceNote: sorted.length < 4 ? "Limited history — patterns will improve over time" : null,
    });
  }

  // Sort: most frequent first, then alphabetically
  patterns.sort((a, b) => a.avgFrequencyDays - b.avgFrequencyDays || a.partner.localeCompare(b.partner));

  return patterns;
}

/**
 * Format a date string as "Mar 15, 2026"
 */
export function formatBonusDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
