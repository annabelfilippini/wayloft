"use client";

import { useState } from "react";
import type {
  CatalogCard,
  UserCreditUsage,
  UserPerkSetup,
} from "@wayloft/shared";
import {
  ChevronDown,
  DollarSign,
  ShieldCheck,
  Globe,
  Plane,
  Utensils,
  Building2,
  Car,
  Gift,
  Star,
  Sparkles,
} from "lucide-react";
import { PerkChecklist } from "./perk-checklist";
import { CreditTracker } from "./credit-tracker";

// --- Types ---

interface BenefitItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: {
    label: string;
    variant: "active" | "unused" | "automatic" | "upcoming";
  };
  progress?: { current: number; max: number };
  expiresLabel?: string;
  valueCents?: number;
}

// --- Props ---

interface CardBenefitsSectionProps {
  catalogCard: CatalogCard;
  creditUsage: UserCreditUsage[];
  perkSetup: UserPerkSetup[];
}

// --- Helpers ---

function guessIcon(
  text: string,
): React.ComponentType<{ className?: string }> {
  const lower = text.toLowerCase();
  if (
    lower.includes("insurance") ||
    lower.includes("protection") ||
    lower.includes("warranty") ||
    lower.includes("coverage")
  )
    return ShieldCheck;
  if (
    lower.includes("hotel") ||
    lower.includes("lounge") ||
    lower.includes("priority pass")
  )
    return Building2;
  if (
    lower.includes("foreign") ||
    lower.includes("international") ||
    lower.includes("no ftf")
  )
    return Globe;
  if (
    lower.includes("travel") ||
    lower.includes("flight") ||
    lower.includes("tsa") ||
    lower.includes("global entry")
  )
    return Plane;
  if (lower.includes("dining") || lower.includes("restaurant"))
    return Utensils;
  if (lower.includes("credit") || lower.includes("$")) return DollarSign;
  if (lower.includes("uber") || lower.includes("lyft") || lower.includes("ride"))
    return Car;
  if (lower.includes("anniversary") || lower.includes("bonus"))
    return Sparkles;
  return Gift;
}

function formatPeriod(period: string): string {
  const map: Record<string, string> = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    semi_annual: "Semi-annual",
    annual: "Annual",
    card_year: "Card year",
  };
  return map[period] ?? period;
}

const STATUS_STYLES: Record<string, string> = {
  active:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  unused:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  automatic:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  upcoming:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

// --- Benefit derivation ---

function deriveBenefits(
  catalogCard: CatalogCard,
  creditUsage: UserCreditUsage[],
  perkSetup: UserPerkSetup[],
): BenefitItem[] {
  const benefits: BenefitItem[] = [];
  const now = new Date();

  // 1. Statement credits (highest priority — monetary, actionable)
  if (catalogCard.credits) {
    for (const credit of catalogCard.credits) {
      // Find current period usage
      const currentUsage = creditUsage.find(
        (u) =>
          u.credit_name === credit.name &&
          new Date(u.period_start) <= now &&
          now <= new Date(u.period_end),
      );

      const usedCents = currentUsage?.amount_used_cents ?? 0;
      const maxCents = credit.amount_cents;
      const isFullyUsed = usedCents >= maxCents;

      const expiresDate = currentUsage
        ? new Date(currentUsage.period_end)
        : null;

      benefits.push({
        id: `credit-${credit.name}`,
        icon: DollarSign,
        title: `$${maxCents / 100} ${credit.name}`,
        description:
          credit.merchants.length > 0
            ? `Use at ${credit.merchants.slice(0, 3).join(", ")}`
            : `${formatPeriod(credit.period)} credit`,
        status: isFullyUsed
          ? { label: "Used", variant: "active" }
          : { label: "Unused", variant: "unused" },
        progress: { current: usedCents / 100, max: maxCents / 100 },
        expiresLabel: expiresDate
          ? `Expires ${expiresDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : undefined,
        valueCents: maxCents,
      });
    }
  }

  // 2. Structured perks (if available)
  if (perkSetup.length > 0) {
    for (const perk of perkSetup) {
      if (perk.status === "not_applicable") continue;

      let statusVariant: "active" | "unused" | "automatic";
      let statusLabel: string;

      if (perk.perk_type === "always_on") {
        statusVariant = "automatic";
        statusLabel = "Always active";
      } else if (perk.status === "completed") {
        statusVariant = "active";
        statusLabel = "Active";
      } else if (perk.status === "in_progress") {
        statusVariant = "unused";
        statusLabel = "In progress";
      } else {
        statusVariant = "unused";
        statusLabel = "Not set up";
      }

      benefits.push({
        id: perk.perk_id,
        icon: guessIcon(perk.perk_name),
        title: perk.perk_name,
        description:
          perk.status === "completed"
            ? "Set up and ready"
            : perk.perk_type === "always_on"
              ? "Automatic benefit"
              : "Requires activation",
        status: { label: statusLabel, variant: statusVariant },
        valueCents: perk.estimated_annual_value_cents,
      });
    }
  }

  // 3. Key perks fallback (cards without structured perk data)
  if (perkSetup.length === 0 && catalogCard.key_perks.length > 0) {
    for (const perk of catalogCard.key_perks) {
      benefits.push({
        id: `key-${perk}`,
        icon: guessIcon(perk),
        title: perk,
        description: "",
        status: { label: "Included", variant: "automatic" },
      });
    }
  }

  // 4. No Foreign Transaction Fees (card feature)
  if (!catalogCard.foreign_transaction_fee) {
    // Avoid duplicate if already in key_perks
    const alreadyListed = benefits.some(
      (b) =>
        b.title.toLowerCase().includes("foreign") ||
        b.title.toLowerCase().includes("ftf"),
    );
    if (!alreadyListed) {
      benefits.push({
        id: "no-ftf",
        icon: Globe,
        title: "No Foreign Transaction Fees",
        description: "Good for international travel",
        status: { label: "Automatic", variant: "automatic" },
      });
    }
  }

  return benefits;
}

// --- Components ---

function BenefitRow({ benefit }: { benefit: BenefitItem }) {
  const Icon = benefit.icon;
  const progressPct =
    benefit.progress && benefit.progress.max > 0
      ? Math.min(
          (benefit.progress.current / benefit.progress.max) * 100,
          100,
        )
      : 0;

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
      {/* Icon */}
      <div className="shrink-0 rounded-md bg-muted/50 p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{benefit.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              STATUS_STYLES[benefit.status.variant]
            }`}
          >
            {benefit.status.label}
          </span>
        </div>

        {benefit.description && (
          <p className="text-[11px] text-muted-foreground">
            {benefit.description}
          </p>
        )}

        {/* Progress bar (for credits) */}
        {benefit.progress && (
          <div className="space-y-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>
                ${benefit.progress.current} / ${benefit.progress.max}
              </span>
              {benefit.expiresLabel && <span>{benefit.expiresLabel}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Section ---

export function CardBenefitsSection({
  catalogCard,
  creditUsage,
  perkSetup,
}: CardBenefitsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const benefits = deriveBenefits(catalogCard, creditUsage, perkSetup);
  const estimatedValue = benefits.reduce(
    (sum, b) => sum + (b.valueCents ?? 0),
    0,
  );

  if (benefits.length === 0) return null;

  const cardClass = "rounded-2xl bg-card shadow-sm border overflow-hidden";

  return (
    <section className={cardClass}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Card Benefits</h2>
          {!isOpen && benefits.length > 0 && (
            <span className="text-sm text-muted-foreground">
              · {benefits.length} benefit{benefits.length !== 1 ? "s" : ""}
              {estimatedValue > 0 &&
                ` · ~$${Math.round(estimatedValue / 100)}/yr`}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t">
          {/* Estimated value header */}
          {estimatedValue > 0 && (
            <div className="px-5 pb-2 pt-4">
              <p className="text-sm text-muted-foreground">
                Estimated annual value:{" "}
                <span className="font-semibold text-foreground">
                  ${Math.round(estimatedValue / 100)}+
                </span>
              </p>
            </div>
          )}

          {/* Benefit rows */}
          <div className="space-y-3 px-5 pb-5 pt-2">
            {benefits.map((benefit) => (
              <BenefitRow key={benefit.id} benefit={benefit} />
            ))}
          </div>

          {/* Manage benefits expand */}
          {(perkSetup.length > 0 || creditUsage.length > 0) && (
            <>
              <div className="border-t px-5 py-3">
                <button
                  type="button"
                  onClick={() => setShowManage(!showManage)}
                  className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {showManage ? "Hide management" : "Manage Benefits"}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showManage ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showManage && (
                <div className="space-y-6 border-t px-5 py-5">
                  {perkSetup.length > 0 && (
                    <PerkChecklist
                      perks={perkSetup}
                      keyPerks={catalogCard.key_perks}
                    />
                  )}
                  {creditUsage.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">
                        Statement Credits
                      </h3>
                      <CreditTracker credits={creditUsage} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
