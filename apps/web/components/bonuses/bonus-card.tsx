import Link from "next/link";
import { Plane, Building2, Clock, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TransferBonus } from "@wayloft/shared";
import {
  getBonusUrgency,
  getDaysRemaining,
  formatBonusDate,
  BANK_DISPLAY_NAMES,
} from "@/lib/bonuses/utils";

interface BonusCardProps {
  bonus: TransferBonus;
  personalization?: string | null;
}

const urgencyBadgeVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

export function BonusCard({ bonus, personalization }: BonusCardProps) {
  const urgency = getBonusUrgency(bonus.end_date);
  const daysLeft = getDaysRemaining(bonus.end_date);
  const bankName = BANK_DISPLAY_NAMES[bonus.bank] ?? bonus.bank;
  const PartnerIcon = bonus.partner_type === "airline" ? Plane : Building2;

  return (
    <Card className="relative overflow-hidden transition-colors hover:border-muted-foreground/30">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Bank name */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {bankName} &middot; {bonus.currency}
            </p>

            {/* Partner name + icon */}
            <div className="mt-1 flex items-center gap-2">
              <PartnerIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-base font-semibold truncate">
                {bonus.partner}
              </p>
              <span className="text-xs text-muted-foreground">({bonus.partner_code})</span>
            </div>

            {/* Date range + days remaining */}
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatBonusDate(bonus.start_date)} — {formatBonusDate(bonus.end_date)}
              </span>
              {daysLeft !== null && (
                <Badge variant={urgencyBadgeVariant[urgency]}>
                  {daysLeft === 0
                    ? "Ends today"
                    : daysLeft === 1
                      ? "1 day left"
                      : `${daysLeft} days left`}
                </Badge>
              )}
            </div>

            {/* Personalization line */}
            {personalization && (
              <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                {personalization}
              </p>
            )}
          </div>

          {/* Bonus percentage — prominent */}
          <div className="shrink-0 text-right">
            <p className="text-3xl font-bold tracking-tight text-foreground">
              +{bonus.bonus_percentage}%
            </p>
            <p className="text-xs text-muted-foreground">bonus</p>
          </div>
        </div>

        {/* Source link */}
        {bonus.source_url && (
          <Link
            href={bonus.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View details
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
