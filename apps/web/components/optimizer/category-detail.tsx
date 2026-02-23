import type { CardRanking } from "@wayloft/shared";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";

interface CategoryDetailProps {
  rankings: CardRanking[];
  catalogMap: Map<string, { network: string }>;
}

export function CategoryDetail({ rankings, catalogMap }: CategoryDetailProps) {
  if (rankings.length === 0) return null;

  return (
    <div className="space-y-2 pt-2">
      {rankings.map((card, idx) => {
        const meta = catalogMap.get(card.cardSlug);
        return (
          <div
            key={card.cardSlug}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${
              idx === 0
                ? "bg-accent/10 border border-accent/20"
                : "bg-muted/50"
            }`}
          >
            {/* Rank */}
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
              {idx + 1}
            </span>

            {/* Card art mini */}
            <div className="w-14 shrink-0">
              <CardArtPlaceholder
                issuer={card.issuer}
                network={meta?.network ?? "visa"}
                cardName={card.cardName}
              />
            </div>

            {/* Card info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{card.cardName}</p>
              <p className="text-xs text-muted-foreground">
                {card.notes}
              </p>
              {card.capWarning && (
                <p className="mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  Cap: {card.capWarning}
                </p>
              )}
            </div>

            {/* Value badges */}
            <div className="shrink-0 text-right">
              <span className="inline-block rounded-md bg-accent/15 px-2 py-0.5 text-sm font-bold text-accent-foreground">
                {card.multiplier}x
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {card.effectiveCents.toFixed(1)}¢/$
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
