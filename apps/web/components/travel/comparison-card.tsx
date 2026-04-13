"use client";

import { Check, X, AlertTriangle, Plane } from "lucide-react";
import type {
  AwardPath,
  ComparisonResult,
  Verdict,
} from "@/lib/flights/compare";
import { cabinLabel } from "@/lib/flights/compare";

interface ComparisonCardProps {
  result: ComparisonResult;
}

const VERDICT_CONFIG: Record<
  Verdict,
  {
    label: string;
    sublabel: string;
    Icon: typeof Check;
    tone: "amber" | "muted" | "destructive";
  }
> = {
  cash: {
    label: "Pay cash",
    sublabel: "Points value too low here",
    Icon: X,
    tone: "muted",
  },
  points: {
    label: "Use points",
    sublabel: "Strong redemption",
    Icon: Check,
    tone: "amber",
  },
  close: {
    label: "Close call",
    sublabel: "Decent redemption, your call",
    Icon: AlertTriangle,
    tone: "muted",
  },
  no_awards: {
    label: "No awards",
    sublabel: "No transferable award space",
    Icon: X,
    tone: "muted",
  },
  no_cash: {
    label: "Cash unavailable",
    sublabel: "Only awards returned",
    Icon: AlertTriangle,
    tone: "muted",
  },
};

function formatPoints(n: number): string {
  return n.toLocaleString();
}

function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function AwardPathLine({ path }: { path: AwardPath }) {
  const transfer = path.transferFrom;
  const cabin = cabinLabel(path.cabin);
  const direct = path.direct ? "direct" : "with stops";

  if (!transfer) {
    return (
      <div className="flex items-start justify-between border-l-2 border-muted pl-3 py-1.5 text-xs">
        <div>
          <div className="font-medium">{path.sourceAirlineName}</div>
          <div className="text-muted-foreground">
            {cabin} · {direct} ·{" "}
            <span className="mono">{formatPoints(path.totalMileageCost)}</span>{" "}
            miles
          </div>
          <div className="text-muted-foreground">
            No transfer partner in your wallet
          </div>
        </div>
      </div>
    );
  }

  const borderTone = transfer.hasEnough
    ? "border-primary"
    : transfer.hypothetical
      ? "border-muted"
      : "border-amber-500/60";

  return (
    <div
      className={`border-l-2 ${borderTone} pl-3 py-1.5 text-xs`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">
            {path.sourceAirlineName}{" "}
            <span className="text-muted-foreground font-normal">
              · {cabin} · {direct}
            </span>
          </div>
          <div className="mt-0.5 text-muted-foreground">
            <span className="mono">
              {formatPoints(transfer.totalPointsNeeded)}
            </span>{" "}
            {transfer.currency}
            {transfer.bonusPercentage > 0 && (
              <span className="ml-1 text-primary">
                (+{transfer.bonusPercentage}% bonus)
              </span>
            )}
            {" → "}
            <span className="mono">
              {formatPoints(path.totalMileageCost)}
            </span>{" "}
            {path.sourceAirlineCode}
          </div>
        </div>
        {path.effectiveCpp !== null && (
          <div className="shrink-0 text-right">
            <div className="mono font-semibold">
              {path.effectiveCpp.toFixed(2)}¢
            </div>
            <div className="label-signal text-muted-foreground">PER PT</div>
          </div>
        )}
      </div>
      <div className="mt-1 text-muted-foreground">
        {transfer.hypothetical ? (
          <span>You have 0 {transfer.currency} — hypothetical</span>
        ) : transfer.hasEnough ? (
          <span className="text-primary">
            ✓ You have {formatPoints(transfer.userBalance)} {transfer.currency}
          </span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">
            {formatPoints(transfer.userBalance)} {transfer.currency} — short{" "}
            {formatPoints(transfer.gap)}
          </span>
        )}
        {" · "}
        <span>{transfer.transferTime}</span>
      </div>
    </div>
  );
}

export function ComparisonCard({ result }: ComparisonCardProps) {
  const {
    origin,
    destination,
    date,
    passengers,
    cashOffer,
    cashPrice,
    bestAwardPath,
    awardPaths,
    verdict,
    verdictCpp,
    businessUpsell,
  } = result;

  const verdictCfg = VERDICT_CONFIG[verdict];
  const VerdictIcon = verdictCfg.Icon;

  const cashPerPerson = cashPrice !== null ? cashPrice / passengers : null;
  const cashCarrier = cashOffer?.slices?.[0]?.airlineName;
  const cashStops = cashOffer?.slices?.[0]?.stops;

  const verdictToneClass =
    verdictCfg.tone === "amber"
      ? "bg-primary/10 text-primary border-primary"
      : verdictCfg.tone === "destructive"
        ? "bg-destructive/10 text-destructive border-destructive"
        : "bg-muted text-foreground border-border";

  const additionalPaths = awardPaths.filter(
    (p) => p !== bestAwardPath && p.transferFrom !== null
  );

  return (
    <div className="border bg-card">
      {/* Header row */}
      <div className="flex items-center justify-between border-b bg-background/50 px-4 py-2">
        <div className="flex items-baseline gap-2">
          <span className="mono text-base font-semibold tracking-tight">
            {origin} → {destination}
          </span>
          <span className="label-signal text-muted-foreground">
            {date} · {passengers} PAX
          </span>
        </div>
        <span className="label-signal text-muted-foreground">
          CASH VS POINTS
        </span>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 divide-y md:grid-cols-[1fr_1.4fr_0.9fr] md:divide-x md:divide-y-0">
        {/* CASH */}
        <div className="p-4">
          <div className="label-signal text-muted-foreground">CASH</div>
          {cashPrice !== null ? (
            <>
              <div className="mt-2">
                <span className="mono text-2xl font-light">
                  {formatUsd(cashPrice)}
                </span>
                {passengers > 1 && cashPerPerson !== null && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    <span className="mono">{formatUsd(cashPerPerson)}</span>/pp
                  </span>
                )}
              </div>
              {cashCarrier && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {cashCarrier}
                  {typeof cashStops === "number" && (
                    <> · {cashStops === 0 ? "direct" : `${cashStops} stop${cashStops === 1 ? "" : "s"}`}</>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">
              No cash offers returned
            </div>
          )}
        </div>

        {/* POINTS */}
        <div className="p-4">
          <div className="label-signal text-muted-foreground">
            POINTS (BEST)
          </div>
          {bestAwardPath && bestAwardPath.transferFrom ? (
            <>
              <div className="mt-2">
                <span className="mono text-2xl font-light">
                  {formatPoints(bestAwardPath.transferFrom.totalPointsNeeded)}
                </span>
                <span className="ml-1.5 text-sm text-muted-foreground">
                  {bestAwardPath.transferFrom.currency}
                </span>
                {bestAwardPath.transferFrom.bonusPercentage > 0 && (
                  <span className="ml-2 text-xs text-primary">
                    +{bestAwardPath.transferFrom.bonusPercentage}% bonus
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                → {formatPoints(bestAwardPath.totalMileageCost)}{" "}
                {bestAwardPath.sourceAirlineName} miles ·{" "}
                {cabinLabel(bestAwardPath.cabin)}
              </div>
              <div className="mt-2 text-xs">
                {bestAwardPath.transferFrom.hypothetical ? (
                  <span className="text-muted-foreground">
                    You have 0 {bestAwardPath.transferFrom.currency} —
                    hypothetical
                  </span>
                ) : bestAwardPath.transferFrom.hasEnough ? (
                  <span className="text-primary">
                    ✓ You have{" "}
                    {formatPoints(bestAwardPath.transferFrom.userBalance)}{" "}
                    {bestAwardPath.transferFrom.currency}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Short{" "}
                    {formatPoints(bestAwardPath.transferFrom.gap)}{" "}
                    {bestAwardPath.transferFrom.currency}
                  </span>
                )}
              </div>
            </>
          ) : bestAwardPath ? (
            <div className="mt-3 text-sm text-muted-foreground">
              {bestAwardPath.sourceAirlineName} available but not a transfer
              partner
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">
              No award space on this date
            </div>
          )}
        </div>

        {/* VERDICT */}
        <div
          className={`flex flex-col items-start justify-center border-l-4 p-4 ${verdictToneClass}`}
        >
          <div className="flex items-center gap-1.5">
            <VerdictIcon className="h-4 w-4" />
            <span className="label-signal">{verdictCfg.label}</span>
          </div>
          {verdictCpp !== null && (
            <div className="mono mt-1 text-2xl font-light">
              {verdictCpp.toFixed(2)}¢
            </div>
          )}
          <div className="mt-1 text-xs opacity-80">{verdictCfg.sublabel}</div>
        </div>
      </div>

      {/* Business upsell */}
      {businessUpsell && (
        <div className="flex items-center gap-2 border-t bg-primary/5 px-4 py-2 text-xs">
          <Plane className="h-3.5 w-3.5 text-primary" />
          <span>
            <span className="font-medium">Business class also open:</span>{" "}
            <span className="mono">
              {formatPoints(businessUpsell.totalPoints)}
            </span>{" "}
            miles ({businessUpsell.ratioVsSearched.toFixed(1)}x economy)
          </span>
        </div>
      )}

      {/* Other award paths */}
      {additionalPaths.length > 0 && (
        <details className="border-t">
          <summary className="cursor-pointer px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50">
            {additionalPaths.length} other program
            {additionalPaths.length === 1 ? "" : "s"} available
          </summary>
          <div className="space-y-1 px-4 pb-3">
            {additionalPaths.map((path) => (
              <AwardPathLine key={path.sourceAirlineCode + path.cabin} path={path} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
