"use client";

import { Check, X, AlertTriangle, Plane, Bell, CreditCard, Send } from "lucide-react";
import type {
  AwardPath,
  ComparisonResult,
  Verdict,
} from "@/lib/flights/compare";
import { cabinLabel } from "@/lib/flights/compare";
import { Button } from "@/components/ui/button";

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
    label: "Book with cash",
    sublabel: "Points value too low here",
    Icon: X,
    tone: "muted",
  },
  points: {
    label: "Book with points",
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
    label: "Use cash",
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

function formatStops(stops: number): string {
  if (stops === 0) return "direct";
  return `${stops} stop${stops === 1 ? "" : "s"}`;
}

function getBonusSavings(path: AwardPath): number | null {
  const transfer = path.transferFrom;
  if (!transfer || transfer.bonusPercentage <= 0 || transfer.ratio <= 0) {
    return null;
  }
  if (path.mileageCostPerPerson <= 0) return null;

  const withoutBonus =
    Math.ceil(path.mileageCostPerPerson / transfer.ratio) *
    (path.totalMileageCost / path.mileageCostPerPerson);

  return Math.max(0, withoutBonus - transfer.totalPointsNeeded);
}

function getVerdictReason(
  verdict: Verdict,
  bestAwardPath: AwardPath | null,
  cashPrice: number | null,
  verdictCpp: number | null
): string {
  if (verdict === "points" && bestAwardPath?.transferFrom) {
    return `${verdictCpp?.toFixed(2)} cents per point beats our 2.0 cents target. This is a strong use of ${bestAwardPath.transferFrom.currency}.`;
  }

  if (verdict === "cash" && verdictCpp !== null) {
    return `${verdictCpp.toFixed(2)} cents per point is below our 1.5 cents floor. Keep the points for a better trip.`;
  }

  if (verdict === "close" && verdictCpp !== null) {
    return `${verdictCpp.toFixed(2)} cents per point is usable but not a slam dunk. Choose points if saving cash matters more today.`;
  }

  if (verdict === "no_cash") {
    return "Cash fares did not return, so use the award path as a manual booking lead.";
  }

  if (bestAwardPath && !bestAwardPath.transferFrom) {
    return "Award space exists, but this program is not reachable from the points in your wallet.";
  }

  if (cashPrice !== null) {
    return "No transferable award path came back for this date. Cash is the cleanest path right now.";
  }

  return "No useful cash or points path came back for this search.";
}

function getNextAction(result: ComparisonResult): {
  label: string;
  detail: string;
  Icon: typeof Check;
} {
  const { verdict, bestAwardPath, cashOffer } = result;

  if (verdict === "points" && bestAwardPath?.transferFrom?.hasEnough) {
    return {
      label: "Transfer points",
      detail: `${bestAwardPath.transferFrom.currency} to ${bestAwardPath.sourceAirlineName}. Confirm award space before transferring.`,
      Icon: Send,
    };
  }

  if (verdict === "points" && bestAwardPath?.transferFrom) {
    return {
      label: "Close the points gap",
      detail: `You are short ${formatPoints(bestAwardPath.transferFrom.gap)} ${bestAwardPath.transferFrom.currency}.`,
      Icon: Send,
    };
  }

  if (verdict === "close") {
    return {
      label: "Hold or watch",
      detail: "The math is close enough to compare convenience, cash flow, and availability before booking.",
      Icon: Bell,
    };
  }

  if (cashOffer) {
    return {
      label: "Book cash fare",
      detail: "Use the best cash fare and save points for a higher-value redemption.",
      Icon: CreditCard,
    };
  }

  return {
    label: "Watch this trip",
    detail: "Saved trip watches are next on the roadmap.",
    Icon: Bell,
  };
}

function AwardPathLine({ path }: { path: AwardPath }) {
  const transfer = path.transferFrom;
  const cabin = cabinLabel(path.cabin);
  const direct = path.direct ? "direct" : "with stops";
  const bonusSavings = getBonusSavings(path);

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
            Use{" "}
            <span className="mono">
              {formatPoints(transfer.totalPointsNeeded)}
            </span>{" "}
            {transfer.currency}
            {transfer.bonusPercentage > 0 && (
              <span className="ml-1 text-primary">
                (+{transfer.bonusPercentage}% bonus)
              </span>
            )}
            {" to book "}
            <span className="mono">
              {formatPoints(path.totalMileageCost)}
            </span>{" "}
            {path.sourceAirlineName} miles
          </div>
          {bonusSavings !== null && bonusSavings > 0 && (
            <div className="mt-0.5 text-primary">
              Bonus saves about {formatPoints(bonusSavings)}{" "}
              {transfer.currency} on this trip.
            </div>
          )}
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
  const bonusSavings = bestAwardPath ? getBonusSavings(bestAwardPath) : null;
  const nextAction = getNextAction(result);
  const NextActionIcon = nextAction.Icon;
  const verdictReason = getVerdictReason(
    verdict,
    bestAwardPath,
    cashPrice,
    verdictCpp
  );

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
          TRIP DECISION
        </span>
      </div>

      {/* Verdict lead */}
      <div className={`border-b border-l-4 p-4 ${verdictToneClass}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <VerdictIcon className="h-5 w-5" />
              <h2 className="text-2xl font-semibold tracking-[-0.01em]">
                {verdictCfg.label}
              </h2>
            </div>
            <p className="mt-1 max-w-2xl text-sm opacity-85">
              {verdictReason}
            </p>
          </div>
          {verdictCpp !== null && (
            <div className="shrink-0 sm:text-right">
              <div className="mono text-3xl font-light">
                {verdictCpp.toFixed(2)}¢
              </div>
              <div className="label-signal opacity-75">PER POINT</div>
            </div>
          )}
        </div>
      </div>

      {/* Next action */}
      <div className="flex flex-col gap-3 border-t bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border bg-card">
            <NextActionIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{nextAction.label}</div>
            <div className="text-xs text-muted-foreground">
              {nextAction.detail}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled>
            {nextAction.label}
          </Button>
          <Button size="sm" variant="outline" disabled>
            Watch this trip
          </Button>
        </div>
      </div>

      <details className="border-t">
        <summary className="cursor-pointer px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50">
          Show cash, points, and program details
        </summary>

        {/* Two columns */}
        <div className="grid grid-cols-1 divide-y border-t md:grid-cols-2 md:divide-x md:divide-y-0">
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
                      <span className="mono">{formatUsd(cashPerPerson)}</span>
                      /pp
                    </span>
                  )}
                </div>
                {cashCarrier && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {cashCarrier}
                    {typeof cashStops === "number" && (
                      <> · {formatStops(cashStops)}</>
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
              BEST POINTS PATH
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
                  Transfer to book {formatPoints(bestAwardPath.totalMileageCost)}{" "}
                  {bestAwardPath.sourceAirlineName} miles ·{" "}
                  {cabinLabel(bestAwardPath.cabin)}
                </div>
                {bonusSavings !== null && bonusSavings > 0 && (
                  <div className="mt-2 border-l-2 border-primary pl-3 text-xs text-primary">
                    This transfer bonus saves about{" "}
                    {formatPoints(bonusSavings)}{" "}
                    {bestAwardPath.transferFrom.currency} on this trip.
                  </div>
                )}
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
                      Short {formatPoints(bestAwardPath.transferFrom.gap)}{" "}
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
          <div className="space-y-1 border-t px-4 py-3">
            <div className="text-xs text-muted-foreground">
              {additionalPaths.length} other program
              {additionalPaths.length === 1 ? "" : "s"} available
            </div>
            {additionalPaths.map((path) => (
              <AwardPathLine
                key={path.sourceAirlineCode + path.cabin}
                path={path}
              />
            ))}
          </div>
        )}
      </details>
    </div>
  );
}
