import type { UserCard, CatalogCard } from "@wayloft/shared";
import { CardItem } from "./card-item";

interface CardGridProps {
  cards: UserCard[];
  catalog: CatalogCard[];
}

export function CardGrid({ cards, catalog }: CardGridProps) {
  const catalogMap = new Map(catalog.map((c) => [c.slug, c]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          catalogCard={catalogMap.get(card.card_slug)}
        />
      ))}
    </div>
  );
}
