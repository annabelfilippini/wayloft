"use client";

import { useMemo } from "react";
import { Plane, Building2 } from "lucide-react";
import type { TransferBonus, LoyaltyBalance } from "@wayloft/shared";
import {
  getBonusUrgency,
  getDaysRemaining,
  enrichBonusWithBalance,
  BANK_DISPLAY_NAMES,
} from "@/lib/bonuses/utils";

interface BonusSidebarProps {
  myBonuses: TransferBonus[];
  allBonuses: TransferBonus[];
  balances: Pick<LoyaltyBalance, "program_code" | "balance" | "currency">[];
  highlightCurrencies?: string[];
}

function urgencyClasses(urgency: string): string {
  switch (urgency) {
    case "critical":
      return "bg-destructive/15 text-destructive";
    case "warning":
      return "bg-primary/15 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function BonusRow({
  bonus,
  personalization,
  highlighted,
}: {
  bonus: TransferBonus;
  personalization?: string | null;
  highlighted?: boolean;
}) {
  const urgency = getBonusUrgency(bonus.end_date);
  const daysLeft = getDaysRemaining(bonus.end_date);
  const bankName = BANK_DISPLAY_NAMES[bonus.bank] ?? bonus.bank;
  const PartnerIcon = bonus.partner_type === "airline" ? Plane : Building2;

  return (
    <div
      className={`flex items-start justify-between gap-3 py-3 ${
        highlighted ? "border-l-2 border-primary pl-3" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <PartnerIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm truncate">
            {bankName} &rarr; {bonus.partner}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className={`badge-signal ${urgencyClasses(urgency)}`}>
            {daysLeft === 0
              ? "ENDS TODAY"
              : daysLeft === 1
                ? "1 DAY"
                : `${daysLeft} DAYS`}
          </span>
        </div>
        {personalization && (
          <p className="mt-1 text-xs text-primary">{personalization}</p>
        )}
      </div>
      <span className="mono text-xl font-normal shrink-0">
        +{bonus.bonus_percentage}%
      </span>
    </div>
  );
}

export function BonusSidebar({
  myBonuses,
  allBonuses,
  balances,
  highlightCurrencies,
}: BonusSidebarProps) {
  const highlightSet = useMemo(
    () => new Set(highlightCurrencies ?? []),
    [highlightCurrencies]
  );

  // Other bonuses = allBonuses minus myBonuses
  const otherBonuses = useMemo(() => {
    const myIds = new Set(myBonuses.map((b) => b.id));
    return allBonuses.filter((b) => !myIds.has(b.id));
  }, [myBonuses, allBonuses]);

  if (allBonuses.length === 0) {
    return (
      <div className="border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No active transfer bonuses right now.
        </p>
      </div>
    );
  }

  return (
    <div>
      {myBonuses.length > 0 && (
        <div>
          <span className="label-signal text-muted-foreground">
            BONUSES THAT MAY CHANGE THE MATH
          </span>
          <div className="mt-2 divide-y divide-border">
            {myBonuses.map((bonus) => (
              <BonusRow
                key={bonus.id}
                bonus={bonus}
                personalization={enrichBonusWithBalance(bonus, balances)}
                highlighted={highlightSet.has(bonus.currency)}
              />
            ))}
          </div>
        </div>
      )}

      {otherBonuses.length > 0 && (
        <div className={myBonuses.length > 0 ? "mt-6" : ""}>
          <span className="label-signal text-muted-foreground">
            {myBonuses.length > 0 ? "OTHER ACTIVE BONUSES" : "ACTIVE BONUSES"}
          </span>
          <div className="mt-2 divide-y divide-border">
            {otherBonuses.map((bonus) => (
              <BonusRow
                key={bonus.id}
                bonus={bonus}
                highlighted={highlightSet.has(bonus.currency)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
