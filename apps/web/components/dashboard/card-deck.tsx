"use client";

import Link from "next/link";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";

export interface CardData {
  id: string;
  issuer: string;
  network: string;
  name: string;
  annualFeeCents: number;
  bonusPercent: number | null;
  payment: { daysUntilDue: number; autopayEnabled: boolean } | null;
  perks: { name: string; valueCents: number }[];
}

interface CardDeckProps {
  cards: CardData[];
}

export function CardDeck({ cards }: CardDeckProps) {
  if (cards.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-6">
        <span className="text-lg font-semibold tracking-[-0.01em]">Cards</span>
        <Link
          href="/cards"
          className="mono text-xs text-muted-foreground uppercase tracking-[0.03em] border-b border-border pb-0.5 hover:text-foreground hover:border-muted-foreground transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="flex gap-7 px-8 py-7 overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        {cards.map((card) => {
          const afLabel =
            card.annualFeeCents === 0
              ? "No AF"
              : `$${card.annualFeeCents / 100}/yr`;

          let statusLabel = "Active";
          let statusColor = "";

          if (card.bonusPercent != null) {
            statusLabel = `${card.bonusPercent}% toward bonus`;
            statusColor = "text-primary";
          }

          return (
            <Link
              key={card.id}
              href={`/cards/${card.id}`}
              className="flex-shrink-0 snap-start cursor-pointer group"
            >
              <div className="w-[353px] md:w-[454px]">
                <CardArtPlaceholder
                  issuer={card.issuer}
                  network={card.network}
                  cardName={card.name}
                  className="transition-transform duration-150 group-hover:-translate-y-0.5"
                />
                <div className="flex justify-between px-0.5 pt-1.5">
                  <span className="mono text-xs text-muted-foreground">{afLabel}</span>
                  <span className={`mono text-xs ${statusColor || (card.bonusPercent != null ? "" : "text-muted-foreground")}`}>
                    {statusLabel}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
