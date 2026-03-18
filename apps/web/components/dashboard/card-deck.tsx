"use client";

import { useState } from "react";
import Link from "next/link";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [expanded, setExpanded] = useState(false);

  if (cards.length === 0) return null;

  return (
    <div>
      {/* Header — click to toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 text-left"
      >
        <h2 className="text-lg font-bold uppercase tracking-wide">
          My Cards
        </h2>
        <span className="text-sm text-muted-foreground">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
        </span>
        {expanded ? (
          <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Card deck */}
      <div className="mt-4">
        {expanded ? (
          <ExpandedView cards={cards} />
        ) : (
          <StackedView cards={cards} onExpand={() => setExpanded(true)} />
        )}
      </div>
    </div>
  );
}

/** Stacked cards — overlapping horizontal fan */
function StackedView({
  cards,
  onExpand,
}: {
  cards: CardData[];
  onExpand: () => void;
}) {
  // Each card peeks out 32px from behind the previous one
  const peekWidth = 32;
  const cardWidth = 176; // w-44
  const totalWidth = cardWidth + (cards.length - 1) * peekWidth;

  return (
    <button
      onClick={onExpand}
      className="group relative block text-left"
      style={{ width: totalWidth, height: cardWidth / 1.586 + 8 }}
    >
      {cards.map((card, i) => (
        <div
          key={card.id}
          className="absolute top-0 w-44 transition-all duration-500 ease-out group-hover:brightness-105"
          style={{
            left: i * peekWidth,
            zIndex: cards.length - i,
            transform: `rotate(${(i - Math.floor(cards.length / 2)) * 1.5}deg)`,
          }}
        >
          <CardArtPlaceholder
            issuer={card.issuer}
            network={card.network}
            cardName={card.name}
            className="shadow-lg"
          />
        </div>
      ))}
      <span className="absolute -bottom-6 left-0 text-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
        Click to expand
      </span>
    </button>
  );
}

/** Expanded cards — horizontal scroll with details below each card */
function ExpandedView({ cards }: { cards: CardData[] }) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-2">
      {cards.map((card) => {
        const stats = buildStats(card);

        return (
          <Link
            key={card.id}
            href={`/cards/${card.id}`}
            className="group flex-none"
          >
            <div className="w-44">
              <CardArtPlaceholder
                issuer={card.issuer}
                network={card.network}
                cardName={card.name}
                className="shadow-md transition-transform group-hover:scale-[1.02]"
              />

              {/* Details below card */}
              <div className="mt-2 space-y-1 px-0.5">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className={stat.accent ?? "font-medium"}>
                      {stat.value}
                    </span>
                  </div>
                ))}

                {/* Perks list */}
                {card.perks.length > 0 && (
                  <div className="mt-1.5 border-t pt-1.5">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {card.perks.length} perk{card.perks.length !== 1 ? "s" : ""} to activate
                    </p>
                    {card.perks.map((perk) => (
                      <p
                        key={perk.name}
                        className="truncate text-sm text-muted-foreground"
                      >
                        {perk.name}
                        {perk.valueCents > 0 && (
                          <span className="ml-1 text-green-600 dark:text-green-400">
                            ~${Math.round(perk.valueCents / 100)}/yr
                          </span>
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

interface Stat {
  label: string;
  value: string;
  accent?: string;
}

function buildStats(card: CardData): Stat[] {
  const stats: Stat[] = [];

  if (card.bonusPercent != null) {
    stats.push({
      label: "Bonus",
      value: `${card.bonusPercent}%`,
      accent: "text-orange-500 dark:text-orange-400 font-medium",
    });
  }

  if (card.payment) {
    stats.push({
      label: "Payment",
      value: card.payment.autopayEnabled
        ? "Autopay on"
        : `Due in ${card.payment.daysUntilDue}d`,
      accent:
        !card.payment.autopayEnabled && card.payment.daysUntilDue <= 7
          ? "text-red-500 dark:text-red-400 font-medium"
          : undefined,
    });
  }

  stats.push({
    label: "AF",
    value:
      card.annualFeeCents === 0
        ? "None"
        : `$${card.annualFeeCents / 100}/yr`,
  });

  return stats;
}
