"use client";

import type {
  CatalogCard,
  UserCreditUsage,
  UserPerkSetup,
  CardLifecycleEvent,
  DowngradeOption,
  RetentionData,
} from "@wayloft/shared";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, ArrowDown, Shield, CheckCircle2, XCircle } from "lucide-react";
import { computeValueBreakdown, verdictConfig, type Verdict } from "@/lib/cards/worth-it";

// ── Props ──

interface AFDecisionHelperProps {
  catalogCard: CatalogCard;
  creditUsage: UserCreditUsage[];
  perkSetup: UserPerkSetup[];
  lifecycleEvents: CardLifecycleEvent[];
}

// ── Main Component ──

export function AFDecisionHelper({
  catalogCard,
  creditUsage,
  perkSetup,
  lifecycleEvents,
}: AFDecisionHelperProps) {
  const creditsUsedCents = creditUsage.reduce(
    (sum, c) => sum + c.amount_used_cents,
    0
  );
  const perksActivatedCents = perkSetup
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.estimated_annual_value_cents, 0);

  const breakdown = computeValueBreakdown(
    catalogCard.annual_fee_cents,
    creditsUsedCents,
    perksActivatedCents
  );
  const config = verdictConfig[breakdown.verdict];

  return (
    <div className="space-y-4">
      <Separator />

      {/* Value Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Value Analysis</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color} ${config.bgColor}`}
          >
            {config.label}
          </span>
        </div>

        <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
          {breakdown.creditsValueCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credits redeemed</span>
              <span className="text-green-600">
                +${(breakdown.creditsValueCents / 100).toFixed(0)}
              </span>
            </div>
          )}
          {breakdown.perksValueCents > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Perks activated value
              </span>
              <span className="text-green-600">
                +${(breakdown.perksValueCents / 100).toFixed(0)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Annual fee</span>
            <span className="text-red-600">
              -${(catalogCard.annual_fee_cents / 100).toFixed(0)}
            </span>
          </div>
          <div className="border-t pt-1.5 flex justify-between font-medium">
            <span>Net value</span>
            <span
              className={
                breakdown.netValueCents >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {breakdown.netValueCents >= 0 ? "+" : "-"}$
              {Math.abs(breakdown.netValueCents / 100).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <Recommendation verdict={breakdown.verdict} netValueCents={breakdown.netValueCents} />

      {/* Retention Guide */}
      {catalogCard.retention_data && (
        <RetentionGuide
          retentionData={catalogCard.retention_data}
          lifecycleEvents={lifecycleEvents}
        />
      )}

      {/* Downgrade Comparison */}
      {catalogCard.downgrade_options && catalogCard.downgrade_options.length > 0 && (
        <DowngradeComparison
          currentFeeCents={catalogCard.annual_fee_cents}
          options={catalogCard.downgrade_options}
        />
      )}
    </div>
  );
}

// ── Recommendation ──

function Recommendation({
  verdict,
  netValueCents,
}: {
  verdict: Verdict;
  netValueCents: number;
}) {
  const absDollars = Math.abs(netValueCents / 100).toFixed(0);

  const messages: Record<Verdict, string> = {
    keep: `You're getting $${absDollars} more in value than you pay. This card is pulling its weight — keep it.`,
    call: `You're close to break-even. Call for a retention offer to tip the math in your favor.`,
    downgrade: `You're leaving $${absDollars} on the table. Consider downgrading to save on the annual fee while keeping your points.`,
  };

  return (
    <p className="text-sm text-muted-foreground">{messages[verdict]}</p>
  );
}

// ── Retention Guide ──

function RetentionGuide({
  retentionData,
  lifecycleEvents,
}: {
  retentionData: RetentionData;
  lifecycleEvents: CardLifecycleEvent[];
}) {
  const retentionEvents = lifecycleEvents.filter(
    (e) => e.event_type === "retention_offer" || e.event_type === "retention_declined"
  );

  const successRateLabels: Record<string, string> = {
    low: "Low",
    moderate: "Moderate",
    high: "High",
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5" />
        Retention Guide
      </p>

      <div className="rounded-md border p-3 space-y-2 text-sm">
        {retentionData.phone_number && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Call</span>
            <a
              href={`tel:${retentionData.phone_number}`}
              className="font-medium text-blue-600 hover:underline"
            >
              {retentionData.phone_number}
            </a>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Success rate</span>
          <span className="font-medium">
            {successRateLabels[retentionData.success_rate_estimate] ?? retentionData.success_rate_estimate}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {retentionData.best_time_to_call}
        </p>

        {/* Common offers */}
        {retentionData.common_offers.length > 0 && (
          <div className="pt-1 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Common offers
            </p>
            {retentionData.common_offers.map((offer, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-muted-foreground capitalize">
                  {offer.type.replace(/_/g, " ")}
                </span>
                <span>
                  ~${(offer.typical_value_cents / 100).toFixed(0)}
                  {offer.typical_spend_requirement_cents > 0 &&
                    ` (spend $${(offer.typical_spend_requirement_cents / 100).toLocaleString()})`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Past retention history */}
        {retentionEvents.length > 0 && (
          <div className="pt-1 space-y-1 border-t">
            <p className="text-xs font-medium text-muted-foreground pt-1">
              Your history
            </p>
            {retentionEvents.map((event) => (
              <div key={event.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {new Date(event.event_date).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                  {" — "}
                  {event.event_type === "retention_offer"
                    ? "Received offer"
                    : "No offer"}
                </span>
                {event.retention_offer_value && (
                  <span>{event.retention_offer_value}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Downgrade Comparison ──

function DowngradeComparison({
  currentFeeCents,
  options,
}: {
  currentFeeCents: number;
  options: DowngradeOption[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <ArrowDown className="h-3.5 w-3.5" />
        Downgrade Options
      </p>

      <div className="grid gap-2">
        {options.map((opt) => {
          const savingsCents = currentFeeCents - opt.annual_fee_cents;
          return (
            <div
              key={opt.to_card_slug}
              className="rounded-md border p-3 space-y-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{opt.to_card_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {opt.annual_fee_cents === 0
                      ? "No annual fee"
                      : `$${(opt.annual_fee_cents / 100).toFixed(0)}/yr`}
                    {savingsCents > 0 &&
                      ` — save $${(savingsCents / 100).toFixed(0)}/yr`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {opt.preserves_points && (
                    <Badge
                      variant="outline"
                      className="text-xs text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                    >
                      <Shield className="mr-1 h-3 w-3" />
                      Keeps points
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {/* What you lose */}
                {opt.what_you_lose.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-red-600 dark:text-red-400">
                      You lose
                    </p>
                    {opt.what_you_lose.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-1.5 text-muted-foreground"
                      >
                        <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* What you keep */}
                {opt.what_you_keep.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-green-600 dark:text-green-400">
                      You keep
                    </p>
                    {opt.what_you_keep.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-1.5 text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
