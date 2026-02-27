import "server-only";
import type { CatalogCard } from "@wayloft/shared";

export function getRelatedCards(
  card: CatalogCard,
  allCards: CatalogCard[],
  limit = 3
): CatalogCard[] {
  const candidates = allCards.filter((c) => c.slug !== card.slug);

  const scored = candidates.map((c) => {
    let score = 0;
    if (c.currency === card.currency) score += 3;
    if (c.issuer === card.issuer) score += 2;
    // Similar annual fee (within 50% or $100)
    const afDiff = Math.abs(c.annual_fee_cents - card.annual_fee_cents);
    if (afDiff <= 10000 || afDiff <= card.annual_fee_cents * 0.5) score += 1;
    return { card: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.card);
}
