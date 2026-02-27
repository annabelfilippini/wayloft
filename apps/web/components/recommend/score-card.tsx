"use client";

import { Badge } from "@/components/ui/badge";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { AlertTriangle, ExternalLink, Info, TrendingUp } from "lucide-react";
import type { ScoredCard } from "@/lib/recommend/types";

interface ScoreCardProps {
  result: ScoredCard;
}

function formatDollars(n: number): string {
  if (n >= 0) return `$${Math.round(n).toLocaleString()}`;
  return `-$${Math.round(Math.abs(n)).toLocaleString()}`;
}

export function ScoreCard({ result }: ScoreCardProps) {
  const { card, rank, breakdown, topEarnings, reasoning, warnings } = result;

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6">
      <div className="flex gap-4">
        {/* Rank badge */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {rank}
          </div>
          <div className="w-24 sm:w-28">
            <CardArtPlaceholder
              issuer={card.issuer}
              network={card.network}
              cardName={card.name}
            />
          </div>
        </div>

        {/* Card info */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Header */}
          <div>
            <h3 className="text-base font-semibold leading-tight">
              {card.name}
            </h3>
            <p className="text-xs text-muted-foreground capitalize">
              {card.issuer.replace("_", " ")}
            </p>
          </div>

          {/* First-year value — big number */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary tabular-nums">
              {formatDollars(breakdown.firstYearValue)}
            </span>
            <span className="text-xs text-muted-foreground">
              est. first-year value
            </span>
          </div>

          {/* Eligibility warnings */}
          {warnings.map((w) => (
            <div
              key={w.type}
              className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                w.severity === "hard"
                  ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200"
              }`}
            >
              {w.severity === "hard" ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-4 space-y-1.5 border-t pt-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Value Breakdown
        </p>
        <div className="grid gap-1 text-sm">
          <Row label="Ongoing rewards" value={breakdown.ongoing} />
          {breakdown.signupBonus > 0 && (
            <Row label="Signup bonus" value={breakdown.signupBonus} />
          )}
          {breakdown.creditsOffset > 0 && (
            <Row label="Statement credits" value={breakdown.creditsOffset} />
          )}
          {breakdown.goalBonus !== 0 && (
            <Row
              label={breakdown.goalBonus > 0 ? "Goal alignment bonus" : "Goal mismatch penalty"}
              value={breakdown.goalBonus}
              negative={breakdown.goalBonus < 0}
            />
          )}
          {breakdown.annualFee > 0 && (
            <Row
              label="Annual fee"
              value={-breakdown.annualFee}
              negative
            />
          )}
          <div className="flex items-center justify-between border-t pt-1 font-semibold">
            <span>Net first-year value</span>
            <span className="tabular-nums text-primary">
              {formatDollars(breakdown.firstYearValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Top earning categories */}
      {topEarnings.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <TrendingUp className="h-3 w-3" />
            Best For Your Spending
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topEarnings.map((e) => (
              <Badge key={e.category} variant="secondary" className="text-xs">
                {e.displayName}: {e.multiplier}x →{" "}
                {formatDollars(e.annualValue)}/yr
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      <p className="mt-3 text-xs text-muted-foreground italic">{reasoning}</p>

      {/* Learn more */}
      {card.application_url && (
        <a
          href={card.application_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Learn More
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums ${negative ? "text-destructive" : ""}`}
      >
        {negative ? `-${formatDollars(Math.abs(value))}` : `+${formatDollars(value)}`}
      </span>
    </div>
  );
}
