"use client";

import { useState } from "react";
import type {
  CatalogCard,
  UserCreditUsage,
  UserPerkSetup,
} from "@wayloft/shared";
import { ChevronDown } from "lucide-react";
import { PerkChecklist } from "./perk-checklist";
import { CreditTracker } from "./credit-tracker";

interface CardBenefitsSectionProps {
  catalogCard: CatalogCard;
  creditUsage: UserCreditUsage[];
  perkSetup: UserPerkSetup[];
}

function formatPeriod(period: string): string {
  const map: Record<string, string> = {
    monthly: "/mo",
    quarterly: "/qtr",
    semi_annual: "/6mo",
    annual: "/yr",
    card_year: "/yr",
  };
  return map[period] ?? "";
}

const MATERIAL_ICONS: Record<string, string> = {
  travel: "flight",
  flight: "flight",
  hotel: "hotel",
  lounge: "airline_seat_individual_suite",
  insurance: "shield",
  protection: "shield",
  rental: "directions_car",
  uber: "local_taxi",
  lyft: "local_taxi",
  doordash: "delivery_dining",
  dining: "restaurant",
  foreign: "language",
  global: "shield",
  tsa: "shield",
  peloton: "fitness_center",
  fitness: "fitness_center",
  streaming: "subscriptions",
  stubhub: "confirmation_number",
  entertainment: "theaters",
  credit: "payments",
  anniversary: "celebration",
};

function guessIconName(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, icon] of Object.entries(MATERIAL_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "redeem";
}

/** Map merchant names to their URLs for quick access */
const MERCHANT_URLS: Record<string, string> = {
  lyft: "https://www.lyft.com",
  uber: "https://www.uber.com",
  doordash: "https://www.doordash.com",
  grubhub: "https://www.grubhub.com",
  stubhub: "https://www.stubhub.com",
  peloton: "https://www.onepeloton.com",
  instacart: "https://www.instacart.com",
  gopuff: "https://www.gopuff.com",
  saks: "https://www.saksfifthavenue.com",
  walmart: "https://www.walmart.com",
  "best buy": "https://www.bestbuy.com",
  dunkin: "https://www.dunkindonuts.com",
};

function getMerchantUrl(merchantName: string): string | null {
  const lower = merchantName.toLowerCase();
  for (const [key, url] of Object.entries(MERCHANT_URLS)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

export function CardBenefitsSection({
  catalogCard,
  creditUsage,
  perkSetup,
}: CardBenefitsSectionProps) {
  const [showManage, setShowManage] = useState(false);

  const hasCredits = catalogCard.credits && catalogCard.credits.length > 0;
  const hasPerks = perkSetup.length > 0 || catalogCard.key_perks.length > 0;
  const now = new Date();

  // Calculate estimated value
  let estimatedValueCents = 0;
  if (catalogCard.credits) {
    for (const c of catalogCard.credits) estimatedValueCents += c.amount_cents;
  }
  for (const p of perkSetup) estimatedValueCents += p.estimated_annual_value_cents ?? 0;

  // Calculate unactivated perk value
  const unactivatedPerks = perkSetup.filter(
    (p) => p.status !== "completed" && p.status !== "not_applicable" && p.perk_type !== "always_on"
  );
  const unactivatedValueCents = unactivatedPerks.reduce(
    (sum, p) => sum + (p.estimated_annual_value_cents ?? 0), 0
  );

  // Sort perks: unactivated first, then active, then always_on
  const sortedPerks = perkSetup
    .filter((p) => p.status !== "not_applicable")
    .sort((a, b) => {
      const aActive = a.status === "completed" || a.perk_type === "always_on";
      const bActive = b.status === "completed" || b.perk_type === "always_on";
      if (aActive !== bActive) return aActive ? 1 : -1;
      return (b.estimated_annual_value_cents ?? 0) - (a.estimated_annual_value_cents ?? 0);
    });

  if (!hasCredits && !hasPerks) return null;

  return (
    <section className="pb-10">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-lg font-semibold tracking-[-0.01em]">Card Benefits</span>
        {estimatedValueCents > 0 ? (
          <span className="text-xs text-muted-foreground">~${Math.round(estimatedValueCents / 100)}/yr estimated value</span>
        ) : (
          <span className="text-xs text-muted-foreground">{catalogCard.key_perks.length} benefits included</span>
        )}
      </div>

      {/* Unactivated value callout */}
      {unactivatedValueCents > 0 && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 border border-primary/10">
          <span className="material-symbols-outlined text-primary text-xl">lightbulb</span>
          <span className="text-sm">
            You&apos;re leaving <span className="mono font-semibold text-primary">~${Math.round(unactivatedValueCents / 100)}/yr</span> on the table — {unactivatedPerks.length} perk{unactivatedPerks.length !== 1 ? "s" : ""} to activate
          </span>
        </div>
      )}

      {/* Statement Credits */}
      {hasCredits && (
        <div className="mb-6">
          <span className="label-signal text-muted-foreground/60 block mb-3">Statement Credits</span>
          <div className="space-y-px bg-border">
            {catalogCard.credits!.map((credit) => {
              const currentUsage = creditUsage.find(
                (u) =>
                  u.credit_name === credit.name &&
                  new Date(u.period_start) <= now &&
                  now <= new Date(u.period_end),
              );
              const usedCents = currentUsage?.amount_used_cents ?? 0;
              const maxCents = credit.amount_cents;
              const progressPct = maxCents > 0 ? Math.min((usedCents / maxCents) * 100, 100) : 0;
              const isFullyUsed = usedCents >= maxCents;
              const remainingCents = maxCents - usedCents;
              const remainingDollars = remainingCents / 100;
              const iconName = guessIconName(credit.name);

              // Expiration info
              const expiresDate = currentUsage ? currentUsage.period_end : null;
              const daysLeft = expiresDate ? daysUntil(expiresDate) : null;
              const isExpiringSoon = daysLeft != null && daysLeft <= 30 && !isFullyUsed;

              // Merchant link
              const merchantUrl = credit.merchants.length > 0
                ? getMerchantUrl(credit.merchants[0])
                : null;

              return (
                <div key={credit.name} className="bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-muted-foreground text-xl">{iconName}</span>
                      <div>
                        {!isFullyUsed && remainingCents < maxCents ? (
                          <>
                            <span className="text-sm font-medium">
                              <span className="mono font-semibold text-primary">${remainingDollars}</span> left — {credit.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-medium">{credit.name}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-2">
                          ${maxCents / 100}{formatPeriod(credit.period)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpiringSoon && daysLeft != null && (
                        <span className="mono text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wider bg-destructive/10 text-destructive">
                          {daysLeft}d left
                        </span>
                      )}
                      {isFullyUsed ? (
                        <span className="mono text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wider bg-success/10 text-success">Used</span>
                      ) : !isExpiringSoon && remainingCents < maxCents ? (
                        <span className="mono text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wider bg-primary/10 text-primary">${remainingDollars} left</span>
                      ) : !isExpiringSoon ? (
                        <span className="mono text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wider bg-muted text-muted-foreground">Available</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="w-full h-[3px] bg-border overflow-hidden">
                    <div
                      className={`h-full ${isFullyUsed ? "bg-success" : progressPct > 0 ? "bg-primary" : "bg-border"}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {/* Actionable CTA for unused credits */}
                  {!isFullyUsed && merchantUrl ? (
                    <a
                      href={merchantUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2.5 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Use at {credit.merchants[0]}
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  ) : !isFullyUsed && credit.merchants.length > 0 ? (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {credit.merchants.length === 1
                        ? `Applied automatically to ${credit.merchants[0]} purchases.`
                        : `Use at ${credit.merchants.slice(0, 3).join(", ")}.`}
                    </p>
                  ) : isFullyUsed ? null : (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Applied automatically to qualifying purchases.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Perks & Protections */}
      {hasPerks && (
        <div>
          <span className="label-signal text-muted-foreground/60 block mb-3">Perks &amp; Protections</span>
          <div className="space-y-px bg-border">
            {perkSetup.length > 0 ? (
              sortedPerks.map((perk) => {
                const iconName = guessIconName(perk.perk_name);
                const isActive = perk.status === "completed" || perk.perk_type === "always_on";
                const needsSetup = !isActive && perk.perk_type !== "always_on";
                const valueDollars = perk.estimated_annual_value_cents
                  ? Math.round(perk.estimated_annual_value_cents / 100)
                  : null;

                return (
                  <div key={perk.perk_id} className="bg-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-xl ${needsSetup ? "text-primary" : "text-muted-foreground"}`}>
                        {iconName}
                      </span>
                      <div>
                        <span className="text-sm font-medium">{perk.perk_name}</span>
                        {needsSetup && valueDollars != null && valueDollars > 0 ? (
                          <p className="text-[11px] text-primary mt-0.5">
                            Set up to save ~${valueDollars}/yr
                          </p>
                        ) : perk.perk_type === "always_on" ? (
                          <p className="text-[11px] text-muted-foreground mt-0.5">Automatic benefit</p>
                        ) : isActive ? (
                          <p className="text-[11px] text-success mt-0.5">Active</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && valueDollars != null && valueDollars > 0 && (
                        <span className="text-xs text-muted-foreground">~${valueDollars}/yr</span>
                      )}
                      {needsSetup ? (
                        <span className="mono text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wider bg-primary/10 text-primary cursor-pointer">
                          Set up
                        </span>
                      ) : (
                        <span className="material-symbols-outlined filled text-success text-lg">check_circle</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              (() => {
                // Parse key_perks into credits (has $ value) and features (no $ value)
                const creditPerks: { text: string; value: string; icon: string }[] = [];
                const featurePerks: { text: string; icon: string }[] = [];

                for (const perk of catalogCard.key_perks) {
                  const dollarMatch = perk.match(/\$[\d,]+/);
                  if (dollarMatch) {
                    creditPerks.push({
                      text: perk,
                      value: dollarMatch[0],
                      icon: guessIconName(perk),
                    });
                  } else {
                    featurePerks.push({
                      text: perk,
                      icon: guessIconName(perk),
                    });
                  }
                }

                return (
                  <>
                    {/* Credits-like perks (have dollar values) — show first */}
                    {creditPerks.map((perk) => (
                      <div key={perk.text} className="bg-card p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-xl">{perk.icon}</span>
                          <div>
                            <span className="text-sm font-medium">{perk.text}</span>
                            <p className="text-[11px] text-primary mt-0.5">
                              {perk.value} value — make sure you&apos;re using this
                            </p>
                          </div>
                        </div>
                        <span className="mono text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wider bg-primary/10 text-primary">
                          {perk.value}
                        </span>
                      </div>
                    ))}
                    {/* Feature perks (no dollar value) */}
                    {featurePerks.map((perk) => (
                      <div key={perk.text} className="bg-card p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-muted-foreground text-xl">{perk.icon}</span>
                          <span className="text-sm font-medium">{perk.text}</span>
                        </div>
                        <span className="material-symbols-outlined filled text-success text-lg">check_circle</span>
                      </div>
                    ))}
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Annual Fee Offset Summary */}
      {estimatedValueCents > 0 && catalogCard.annual_fee_cents > 0 && (
        <div className="mt-6 p-5 bg-muted/30 border">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium">Annual Fee Offset</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Credits + perk value vs. ${catalogCard.annual_fee_cents / 100} annual fee
              </p>
            </div>
            <div className="text-right">
              {(() => {
                const net = estimatedValueCents - catalogCard.annual_fee_cents;
                const isPositive = net >= 0;
                return (
                  <>
                    <span className={`mono text-2xl font-light ${isPositive ? "text-success" : "text-destructive"}`}>
                      {isPositive ? "+" : ""}${Math.round(Math.abs(net) / 100)}
                    </span>
                    <span className={`block label-signal mt-1 ${isPositive ? "text-success" : "text-destructive"}`}>
                      {isPositive ? "Net positive" : "Net negative"}
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
          {(() => {
            const net = estimatedValueCents - catalogCard.annual_fee_cents;
            if (net >= 0) return null;
            return (
              <button
                type="button"
                onClick={() => {
                  document.querySelector("[data-slot='card-management-retention']")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-3 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Consider calling for a retention offer →
              </button>
            );
          })()}
        </div>
      )}

      {/* Manage Benefits (detailed tracker) */}
      {(perkSetup.length > 0 || creditUsage.length > 0) && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowManage(!showManage)}
            className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {showManage ? "Hide management" : "Manage Benefits"}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${showManage ? "rotate-180" : ""}`}
            />
          </button>

          {showManage && (
            <div className="space-y-6 mt-4 border-t pt-5">
              {perkSetup.length > 0 && (
                <PerkChecklist perks={perkSetup} keyPerks={catalogCard.key_perks} />
              )}
              {creditUsage.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Statement Credits</h3>
                  <CreditTracker credits={creditUsage} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
