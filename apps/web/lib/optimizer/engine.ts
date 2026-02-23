import type {
  CatalogCard,
  CardRanking,
  CategoryRecommendation,
  WalletGuide,
} from "@wayloft/shared";
import { CATEGORY_DEFINITIONS } from "./categories";
import { getCpp, getCurrencyTier } from "./cpp";

/**
 * Pure optimizer function — no DB, no React, no side effects.
 *
 * Takes the user's active card slugs, the full catalog, and produces
 * a WalletGuide with ranked card recommendations per spending category.
 */
export function generateWalletGuide(
  userCardSlugs: string[],
  catalog: CatalogCard[]
): WalletGuide {
  const catalogMap = new Map(catalog.map((c) => [c.slug, c]));
  const userCards = userCardSlugs
    .map((slug) => catalogMap.get(slug))
    .filter((c): c is CatalogCard => c !== undefined);

  const categories: CategoryRecommendation[] = CATEGORY_DEFINITIONS.map(
    (def) => {
      const rankings = rankCardsForCategory(userCards, def.catalogKeys);
      return {
        category: def.category,
        displayName: def.displayName,
        rankings,
      };
    }
  );

  return {
    categories,
    generatedAt: new Date().toISOString(),
  };
}

function rankCardsForCategory(
  cards: CatalogCard[],
  catalogKeys: string[]
): CardRanking[] {
  const rankings: CardRanking[] = cards.map((card) => {
    const { multiplier, usedKey } = getBestMultiplier(card, catalogKeys);
    const cpp = getCpp(card.currency);
    const effectiveCents = multiplier * cpp;
    const capWarning = getCapWarning(card, usedKey, multiplier);
    const notes = buildNotes(card, multiplier, cpp);

    return {
      cardSlug: card.slug,
      cardName: card.name,
      issuer: card.issuer,
      currency: card.currency,
      multiplier,
      effectiveCpp: cpp,
      effectiveCents,
      capWarning,
      notes,
    };
  });

  // Sort descending by effective value, tie-break by currency tier
  rankings.sort((a, b) => {
    const valueDiff = b.effectiveCents - a.effectiveCents;
    if (Math.abs(valueDiff) > 0.001) return valueDiff;
    return getCurrencyTier(a.currency) - getCurrencyTier(b.currency);
  });

  return rankings;
}

function getBestMultiplier(
  card: CatalogCard,
  catalogKeys: string[]
): { multiplier: number; usedKey: string } {
  let best = 0;
  let usedKey = "other";

  for (const key of catalogKeys) {
    const rate = card.earning_rates[key];
    if (rate !== undefined && rate > best) {
      best = rate;
      usedKey = key;
    }
  }

  // If no specific rate found, fall back to "other" (base rate)
  if (best === 0) {
    const baseRate = card.earning_rates["other"] ?? 1;
    return { multiplier: baseRate, usedKey: "other" };
  }

  return { multiplier: best, usedKey };
}

function getCapWarning(
  card: CatalogCard,
  usedKey: string,
  multiplier: number
): string | null {
  const cap = card.earning_caps.find((c) => c.category === usedKey);
  if (!cap) return null;

  const limitDollars = cap.limit_cents / 100;
  const periodLabel =
    cap.period === "quarter"
      ? "/qtr"
      : cap.period === "year"
        ? "/yr"
        : cap.period === "billing_cycle"
          ? "/mo"
          : `/${cap.period}`;

  return `${multiplier}x up to $${limitDollars.toLocaleString()}${periodLabel}`;
}

function buildNotes(
  card: CatalogCard,
  multiplier: number,
  cpp: number
): string | null {
  // Flag Citi Custom Cash auto-detect behavior
  if (card.earning_rates["top_eligible_category"] !== undefined) {
    return "Auto-detects your top category each billing cycle";
  }
  // Flag rotating category cards
  if (
    card.earning_rates["rotating_categories"] !== undefined &&
    multiplier === (card.earning_rates["other"] ?? 1)
  ) {
    return "Has rotating 5x categories (check quarterly activations)";
  }
  return `${multiplier}x ${card.currency} × ${cpp.toFixed(1)}¢ = ${(multiplier * cpp).toFixed(1)}¢ effective`;
}
