"use server";

import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { computeFiveTwentyFour } from "@/lib/cards/five-twenty-four";
import type {
  UserCard,
  UserExternalCard,
  CreditHealth,
  VelocityWarning,
} from "@wayloft/shared";
import {
  CHASE_524_MAX,
  CHASE_524_AFFECTED,
  BARCLAYS_624_MAX,
  BARCLAYS_624_AFFECTED,
  CITI_848_MAX,
  CITI_848_AFFECTED,
} from "@/lib/recommend/issuer-rules";

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
}

function countCardsInWindow(
  allCards: Array<{ openedDate: string }>,
  windowDays: number
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  return allCards.filter((c) => new Date(c.openedDate) >= cutoff).length;
}

function buildVelocityWarnings(
  allOpenDates: Array<{ openedDate: string }>,
  userCardSlugs: Set<string>
): VelocityWarning[] {
  const warnings: VelocityWarning[] = [];

  // Count cards in various windows
  const last30 = countCardsInWindow(allOpenDates, 30);
  const last90 = countCardsInWindow(allOpenDates, 90);
  const last24mo = countCardsInWindow(allOpenDates, 730);
  // Approximate 48 months
  const last48mo = countCardsInWindow(allOpenDates, 1460);

  // Chase 5/24 — only warn if user has or might want Chase cards
  const hasChaseCards = [...userCardSlugs].some((s) => CHASE_524_AFFECTED.has(s));
  if (last24mo >= CHASE_524_MAX - 1) {
    warnings.push({
      issuer: "Chase",
      rule: "5/24",
      description:
        last24mo >= CHASE_524_MAX
          ? `You're at ${last24mo}/5 — Chase will auto-decline most applications.`
          : `You're at ${last24mo}/5 — one more card locks you out of Chase.`,
      severity: last24mo >= CHASE_524_MAX ? "critical" : "warning",
      currentCount: last24mo,
      maxCount: CHASE_524_MAX,
      windowMonths: 24,
    });
  }

  // Barclays 6/24
  if (last24mo >= BARCLAYS_624_MAX - 1) {
    warnings.push({
      issuer: "Barclays",
      rule: "6/24",
      description:
        last24mo >= BARCLAYS_624_MAX
          ? `At ${last24mo}/6 — Barclays will likely decline.`
          : `At ${last24mo}/6 — approaching Barclays limit.`,
      severity: last24mo >= BARCLAYS_624_MAX ? "warning" : "info",
      currentCount: last24mo,
      maxCount: BARCLAYS_624_MAX,
      windowMonths: 24,
    });
  }

  // Citi 8/48
  if (last48mo >= CITI_848_MAX - 1) {
    warnings.push({
      issuer: "Citi",
      rule: "8/48",
      description:
        last48mo >= CITI_848_MAX
          ? `At ${last48mo}/8 in 48 months — Citi will decline.`
          : `At ${last48mo}/8 in 48 months — approaching Citi limit.`,
      severity: last48mo >= CITI_848_MAX ? "warning" : "info",
      currentCount: last48mo,
      maxCount: CITI_848_MAX,
      windowMonths: 48,
    });
  }

  // General velocity: 2+ cards in 30 days is aggressive
  if (last30 >= 2) {
    warnings.push({
      issuer: "All issuers",
      rule: "Velocity",
      description: `${last30} applications in 30 days. Most issuers flag rapid applications. Consider waiting 60-90 days.`,
      severity: last30 >= 3 ? "critical" : "warning",
      currentCount: last30,
      maxCount: 2,
      windowMonths: 1,
    });
  }

  return warnings;
}

function getRecommendedSpacing(
  recentCount30: number,
  recentCount90: number
): string | null {
  if (recentCount30 >= 2) {
    return "Wait at least 60-90 days before your next application. Multiple recent apps raise red flags with issuers.";
  }
  if (recentCount90 >= 3) {
    return "You've been active recently. Space your next application at least 30 days out to avoid velocity denials.";
  }
  return null;
}

export async function getCreditHealth(): Promise<CreditHealth | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [cardsRes, externalRes] = await Promise.all([
    supabase.from("user_cards").select("*").eq("user_id", user.id),
    supabase.from("user_external_cards").select("*").eq("user_id", user.id),
  ]);

  const userCards = (cardsRes.data ?? []) as UserCard[];
  const externalCards = (externalRes.data ?? []) as UserExternalCard[];
  const catalog = getAllCards();

  // Compute 5/24
  const fiveTwentyFour = computeFiveTwentyFour(userCards, externalCards, catalog);

  // Build unified open dates list for velocity calculations
  const allOpenDates: Array<{ openedDate: string }> = [
    ...userCards
      .filter((c) => c.card_since)
      .map((c) => ({ openedDate: c.card_since })),
    ...externalCards
      .filter((c) => c.opened_at)
      .map((c) => ({ openedDate: c.opened_at })),
  ];

  const userCardSlugs = new Set(userCards.map((c) => c.card_slug));
  const velocityWarnings = buildVelocityWarnings(allOpenDates, userCardSlugs);

  const last30 = countCardsInWindow(allOpenDates, 30);
  const last90 = countCardsInWindow(allOpenDates, 90);
  const last6mo = countCardsInWindow(allOpenDates, 180);

  const recommendedSpacing = getRecommendedSpacing(last30, last90);

  // Next card to fall off 5/24
  let nextCardFallsOff: CreditHealth["nextCardFallsOff"] = null;
  if (fiveTwentyFour.countedCards.length > 0) {
    // Sorted oldest first — the first card ages out soonest
    const first = fiveTwentyFour.countedCards[0];
    const days = daysUntil(first.agesOutDate);
    nextCardFallsOff = {
      name: first.name,
      date: first.agesOutDate,
      daysUntil: days,
    };
  }

  return {
    fiveTwentyFour,
    velocityWarnings,
    recentApplications: {
      last30Days: last30,
      last90Days: last90,
      last6Months: last6mo,
    },
    recommendedSpacing,
    nextCardFallsOff,
  };
}
