import type { ExperienceLevel } from "@wayloft/shared";

/**
 * Returns the effective experience level, defaulting null to "intermediate"
 * for backward compatibility with existing users.
 */
export function getEffectiveLevel(
  level: ExperienceLevel | null | undefined
): ExperienceLevel {
  return level ?? "intermediate";
}

export function isBeginnerOrBelow(
  level: ExperienceLevel | null | undefined
): boolean {
  return getEffectiveLevel(level) === "beginner";
}

export function isAdvanced(
  level: ExperienceLevel | null | undefined
): boolean {
  return getEffectiveLevel(level) === "advanced";
}

/** Maps currency codes to beginner-friendly names */
export const CURRENCY_FRIENDLY_NAMES: Record<string, string> = {
  UR: "Chase points",
  MR: "Amex points",
  TYP: "Citi points",
  C1: "Capital One miles",
  BILT: "Bilt points",
  WF: "Wells Fargo rewards",
  ALTITUDE: "U.S. Bank points",
};

/**
 * Returns the display name for a currency based on experience level.
 * Beginners see friendly names ("Chase points"), others see codes ("UR").
 */
export function formatCurrencyName(
  currency: string,
  level: ExperienceLevel | null | undefined
): string {
  if (isBeginnerOrBelow(level)) {
    return CURRENCY_FRIENDLY_NAMES[currency] ?? currency;
  }
  return currency;
}
