"use client";

import Link from "next/link";
import type { UserCard, CatalogCard } from "@wayloft/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardArtPlaceholder } from "./card-art-placeholder";
import { BonusProgress, BonusUrgencyBadge } from "./bonus-progress";
import { CardActionsMenu } from "./card-actions-menu";

interface CardItemProps {
  card: UserCard;
  catalogCard?: CatalogCard;
}

export function CardItem({ card, catalogCard }: CardItemProps) {
  const hasActiveBonus =
    card.signup_spend_requirement_cents != null &&
    card.signup_spend_requirement_cents > 0 &&
    !card.signup_bonus_met;

  const annualFeeDollars = card.annual_fee_cents / 100;

  // AF badge: show when annual_fee_date is within 30 days
  const afDaysRemaining = card.annual_fee_date
    ? Math.ceil(
        (new Date(card.annual_fee_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const showAfBadge =
    afDaysRemaining !== null &&
    afDaysRemaining <= 30 &&
    afDaysRemaining >= 0 &&
    card.annual_fee_cents > 0;

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Link href={`/cards/${card.id}`}>
          <CardArtPlaceholder
            issuer={card.issuer}
            network={catalogCard?.network ?? "visa"}
            cardName={card.card_name}
          />
        </Link>
        <div className="absolute top-2 right-2">
          <CardActionsMenu cardId={card.id} cardName={card.card_name} />
        </div>
      </div>

      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/cards/${card.id}`}
              className="truncate text-base font-semibold hover:underline"
            >
              {card.card_name}
            </Link>
            <p className="text-xs text-muted-foreground">
              {card.currency} &middot;{" "}
              {annualFeeDollars > 0 ? `$${annualFeeDollars}/yr` : "No AF"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <BonusUrgencyBadge
              deadline={card.signup_spend_deadline}
              bonusMet={card.signup_bonus_met}
              bonusEarned={card.signup_bonus_earned}
            />
            {showAfBadge && (
              <Badge
                variant={afDaysRemaining <= 14 ? "destructive" : "secondary"}
                className="text-xs"
              >
                AF {afDaysRemaining}d
              </Badge>
            )}
          </div>
        </div>

        {hasActiveBonus && (
          <BonusProgress
            progressCents={card.signup_spend_progress_cents}
            requirementCents={card.signup_spend_requirement_cents!}
            deadline={card.signup_spend_deadline}
            bonusPoints={card.signup_bonus_points}
          />
        )}
      </CardContent>
    </Card>
  );
}
