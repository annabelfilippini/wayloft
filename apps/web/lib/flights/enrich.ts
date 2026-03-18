import type { CatalogCard } from "@wayloft/shared";
import { getAllCards } from "@/lib/cards/catalog";
import { getCpp } from "@/lib/optimizer/cpp";
import type { FlightOffer, CardRecommendation, EnrichedFlight } from "./types";

export type { EnrichedFlight, CardRecommendation };

/**
 * Enriches flight offers with portfolio-specific card recommendations.
 * For each flight, determines: best card to book with, effective return,
 * and points-via-portal comparison.
 */
export function enrichFlights(
  offers: FlightOffer[],
  userCardSlugs: string[]
): EnrichedFlight[] {
  const catalog = getAllCards();
  const catalogMap = new Map(catalog.map((c) => [c.slug, c]));
  const userCards = userCardSlugs
    .map((slug) => catalogMap.get(slug))
    .filter((c): c is CatalogCard => c !== undefined);

  return offers.map((offer) => {
    const cashAmount = parseFloat(offer.totalAmount);
    const recommendations = rankCardsForFlight(userCards, cashAmount);
    const bestPortal = findBestPortalOption(userCards, cashAmount);

    return {
      ...offer,
      cardRecommendations: recommendations,
      bestPortalOption: bestPortal,
    };
  });
}

function rankCardsForFlight(
  cards: CatalogCard[],
  cashAmount: number
): CardRecommendation[] {
  const recs: CardRecommendation[] = cards.map((card) => {
    // Travel earn rate — check travel, flights, then fall back to other
    const travelRate =
      card.earning_rates["travel"] ??
      card.earning_rates["flights"] ??
      card.earning_rates["other"] ??
      1;

    const cpp = getCpp(card.currency);
    const effectiveCents = travelRate * cpp;
    const pointsEarned = Math.round(cashAmount * travelRate);
    const pointsValue = (pointsEarned * cpp) / 100;

    // Portal option: some cards let you book through a portal at a fixed CPP
    const portalCpp = card.portal_cpp > 0 ? card.portal_cpp : null;
    const portalPointsCost =
      portalCpp && portalCpp > 0
        ? Math.ceil((cashAmount * 100) / portalCpp)
        : null;

    return {
      cardName: card.name,
      cardSlug: card.slug,
      issuer: card.issuer,
      currency: card.currency,
      multiplier: travelRate,
      cpp,
      effectiveCents,
      pointsEarned,
      pointsValue,
      portalCpp,
      portalPointsCost,
      hasForeignTransactionFee: card.foreign_transaction_fee,
    };
  });

  // Sort by effective value (highest return first)
  recs.sort((a, b) => b.effectiveCents - a.effectiveCents);

  return recs;
}

function findBestPortalOption(
  cards: CatalogCard[],
  cashAmount: number
): EnrichedFlight["bestPortalOption"] {
  let best: EnrichedFlight["bestPortalOption"] = null;

  for (const card of cards) {
    if (card.portal_cpp <= 0) continue;

    const pointsCost = Math.ceil((cashAmount * 100) / card.portal_cpp);

    if (!best || pointsCost < best.pointsCost) {
      best = {
        cardName: card.name,
        currency: card.currency,
        pointsCost,
        portalCpp: card.portal_cpp,
      };
    }
  }

  return best;
}
