import "server-only";
import type { CatalogCard } from "@wayloft/shared";
import catalogData from "../../../../data/credit-cards.json";

const cards = catalogData as unknown as CatalogCard[];

export function getAllCards(): CatalogCard[] {
  return cards;
}

export function getCardBySlug(slug: string): CatalogCard | undefined {
  return cards.find((c) => c.slug === slug);
}

export function searchCards(query: string): CatalogCard[] {
  const q = query.toLowerCase().trim();
  if (!q) return cards;
  return cards.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.issuer.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q) ||
      c.best_for.some((b) => b.toLowerCase().includes(q))
  );
}
