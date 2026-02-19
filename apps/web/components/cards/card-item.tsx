"use client";

import type { UserCard, CatalogCard } from "@wayloft/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardArtPlaceholder } from "./card-art-placeholder";
import { BonusProgress } from "./bonus-progress";
import { SpendUpdateForm } from "./spend-update-form";
import { CardActionsMenu } from "./card-actions-menu";

interface CardItemProps {
  card: UserCard;
  catalogCard?: CatalogCard;
}

export function CardItem({ card, catalogCard }: CardItemProps) {
  const hasBonus =
    card.signup_spend_requirement_cents != null &&
    card.signup_spend_requirement_cents > 0 &&
    !card.signup_bonus_met;

  const annualFeeDollars = card.annual_fee_cents / 100;

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <CardArtPlaceholder
          issuer={card.issuer}
          network={catalogCard?.network ?? "visa"}
          cardName={card.card_name}
        />
        <div className="absolute top-2 right-2">
          <CardActionsMenu cardId={card.id} cardName={card.card_name} />
        </div>
      </div>

      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{card.card_name}</p>
            <p className="text-xs text-muted-foreground">
              {card.currency} &middot;{" "}
              {annualFeeDollars > 0 ? `$${annualFeeDollars}/yr` : "No AF"}
            </p>
          </div>
          {card.signup_bonus_met && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Bonus met
            </Badge>
          )}
        </div>

        {hasBonus && (
          <>
            <BonusProgress
              progressCents={card.signup_spend_progress_cents}
              requirementCents={card.signup_spend_requirement_cents!}
              deadline={card.signup_spend_deadline}
              bonusPoints={card.signup_bonus_points}
            />
            <SpendUpdateForm
              cardId={card.id}
              currentCents={card.signup_spend_progress_cents}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
