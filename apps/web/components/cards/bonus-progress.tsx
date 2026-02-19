"use client";

import { Progress } from "@/components/ui/progress";

interface BonusProgressProps {
  progressCents: number;
  requirementCents: number;
  deadline: string | null;
  bonusPoints: number | null;
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
    ? Math.max(
        0,
        Math.ceil(
          (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const progressDollars = (progressCents / 100).toLocaleString();
  const requirementDollars = (requirementCents / 100).toLocaleString();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          ${progressDollars} of ${requirementDollars}
        </span>
        {bonusPoints && (
          <span className="font-medium">
            {bonusPoints.toLocaleString()} pts
          </span>
        )}
      </div>
      <Progress value={percent} className="h-2" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{percent}%</span>
        {daysRemaining !== null && (
          <span
            className={
              daysRemaining <= 14
                ? "font-medium text-destructive"
                : daysRemaining <= 30
                  ? "font-medium text-yellow-600"
                  : "text-muted-foreground"
            }
          >
            {daysRemaining} days left
          </span>
        )}
      </div>
    </div>
  );
}
