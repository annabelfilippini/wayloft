"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface BonusProgressProps {
  progressCents: number;
  requirementCents: number;
  deadline: string | null;
  bonusPoints: number | null;
}

function getUrgency(daysRemaining: number | null, bonusMet: boolean) {
  if (bonusMet) return null;
  if (daysRemaining === null) return null;
  if (daysRemaining < 0) return "overdue" as const;
  if (daysRemaining <= 14) return "critical" as const;
  if (daysRemaining <= 30) return "warning" as const;
  return null;
}

function formatCountdown(days: number) {
  if (days < 0) return "OVERDUE";
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  if (days < 14) return `${days} days left`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  if (rem === 0) return `${weeks} weeks left`;
  return `${weeks}w ${rem}d left`;
}

export function BonusProgress({
  progressCents,
  requirementCents,
  deadline,
  bonusPoints,
}: BonusProgressProps) {
  const percent = Math.min(
    Math.round((progressCents / requirementCents) * 100),
    100
  );

  const daysRemaining = deadline
    ? Math.ceil(
        (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const urgency = getUrgency(daysRemaining, percent >= 100);

  const remainingCents = Math.max(requirementCents - progressCents, 0);
  const remainingDollars = (remainingCents / 100).toLocaleString();
  const progressDollars = (progressCents / 100).toLocaleString();
  const requirementDollars = (requirementCents / 100).toLocaleString();

  // Daily spend rate hint
  const dailyRate =
    daysRemaining !== null && daysRemaining > 0 && remainingCents > 0
      ? Math.ceil(remainingCents / 100 / daysRemaining)
      : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          ${progressDollars} of ${requirementDollars}
        </span>
        <div className="flex items-center gap-2">
          {bonusPoints && (
            <span className="font-medium">
              {bonusPoints.toLocaleString()} pts
            </span>
          )}
          {urgency === "critical" && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Urgent
            </Badge>
          )}
          {urgency === "warning" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-yellow-700">
              Soon
            </Badge>
          )}
          {urgency === "overdue" && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              Overdue
            </Badge>
          )}
        </div>
      </div>
      <Progress value={percent} className="h-2" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {percent >= 100 ? (
            "Spend met"
          ) : (
            <>${remainingDollars} remaining</>
          )}
        </span>
        {daysRemaining !== null && (
          <span
            className={
              urgency === "overdue"
                ? "font-medium text-destructive line-through"
                : urgency === "critical"
                  ? "font-medium text-destructive"
                  : urgency === "warning"
                    ? "font-medium text-yellow-600"
                    : "text-muted-foreground"
            }
          >
            {formatCountdown(daysRemaining)}
          </span>
        )}
      </div>
      {dailyRate !== null && dailyRate > 0 && percent < 100 && (
        <p className="text-[11px] text-muted-foreground">
          ~${dailyRate}/day to hit target
        </p>
      )}
    </div>
  );
}

// Exported for use on card tiles
export function BonusUrgencyBadge({
  deadline,
  bonusMet,
  bonusEarned,
}: {
  deadline: string | null;
  bonusMet: boolean;
  bonusEarned: boolean;
}) {
  if (bonusEarned) {
    return (
      <Badge variant="secondary" className="text-xs">
        Bonus earned
      </Badge>
    );
  }

  if (bonusMet) {
    return (
      <Badge variant="secondary" className="shrink-0 text-xs">
        Bonus met
      </Badge>
    );
  }

  if (!deadline) return null;

  const daysRemaining = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const urgency = getUrgency(daysRemaining, false);

  if (urgency === "critical") {
    return (
      <Badge variant="destructive" className="shrink-0 text-xs">
        {daysRemaining}d left
      </Badge>
    );
  }
  if (urgency === "warning") {
    return (
      <Badge variant="secondary" className="shrink-0 text-xs text-yellow-700">
        {daysRemaining}d left
      </Badge>
    );
  }
  if (urgency === "overdue") {
    return (
      <Badge variant="destructive" className="shrink-0 text-xs">
        Overdue
      </Badge>
    );
  }

  return null;
}
