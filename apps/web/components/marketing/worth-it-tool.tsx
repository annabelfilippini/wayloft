"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Share2, Check } from "lucide-react";
import type { CatalogCard, CatalogCredit, CatalogPerk } from "@wayloft/shared";
import {
  computeWorthItVerdict,
  verdictConfig,
  formatCents,
  type ValueBreakdownResult,
} from "@/lib/cards/worth-it";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";

// Annualize a credit based on its period
function annualizeCreditCents(credit: CatalogCredit): number {
  const multipliers: Record<string, number> = {
    monthly: 12,
    quarterly: 4,
    semi_annual: 2,
    annual: 1,
    card_year: 1,
  };
  return credit.amount_cents * (multipliers[credit.period] ?? 1);
}

interface WorthItToolProps {
  card: CatalogCard;
  hasData: boolean;
}

export function WorthItTool({ card, hasData }: WorthItToolProps) {
  const credits = card.credits ?? [];
  const perks = card.perks ?? [];

  // Initialize all toggles to ON
  const [creditToggles, setCreditToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(credits.map((c) => [c.name, true]))
  );
  const [perkToggles, setPerkToggles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(perks.map((p) => [p.id, true]))
  );
  const [copied, setCopied] = useState(false);

  // Build value maps
  const creditValues = useMemo(
    () => Object.fromEntries(credits.map((c) => [c.name, annualizeCreditCents(c)])),
    [credits]
  );
  const perkValues = useMemo(
    () => Object.fromEntries(perks.map((p) => [p.id, p.estimated_annual_value_cents])),
    [perks]
  );

  // Compute verdict
  const result: ValueBreakdownResult = useMemo(
    () =>
      computeWorthItVerdict(
        card.annual_fee_cents,
        creditToggles,
        creditValues,
        perkToggles,
        perkValues
      ),
    [card.annual_fee_cents, creditToggles, creditValues, perkToggles, perkValues]
  );

  const config = verdictConfig[result.verdict];
  const afDollars = card.annual_fee_cents / 100;

  function toggleCredit(name: string) {
    setCreditToggles((prev) => ({ ...prev, [name]: !prev[name] }));
  }
  function togglePerk(id: string) {
    setPerkToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `Is ${card.name.startsWith("The ") ? "" : "the "}${card.name} Worth It?`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!hasData) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.01em]">
          {card.name}
        </h1>
        <p className="mt-4 text-muted-foreground">
          This card doesn&apos;t have enough benefit data for the worth-it analyzer yet.
        </p>
        <Link
          href={`/credit-cards/${card.slug}`}
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to review
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12 md:py-20">
      {/* Back link */}
      <Link
        href={`/credit-cards/${card.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {card.name} Review
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-10">
        <div className="w-[180px] shrink-0">
          <CardArtPlaceholder
            issuer={card.issuer}
            network={card.network}
            cardName={card.name}
          />
        </div>
        <div>
          <span className="label-signal text-muted-foreground">Card Analyzer</span>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] mt-1">
            Is {card.name.startsWith("The ") ? "" : "the "}{card.name} worth it?
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Toggle the benefits you actually use. The math updates instantly.
          </p>
        </div>
      </div>

      {/* ── Verdict Banner ── */}
      <div className="border p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="label-signal text-muted-foreground">Verdict</span>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex items-center px-3 py-1 text-sm font-semibold ${config.color} ${config.bgColor}`}
              >
                {config.label}
              </span>
            </div>
          </div>
          <div className="sm:text-right">
            <span className="label-signal text-muted-foreground">Net Value</span>
            <div
              className={`mono text-[36px] sm:text-[48px] font-normal leading-none tracking-[-0.02em] ${
                result.netValueCents >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {result.netValueCents >= 0 ? "+" : "-"}
              {formatCents(Math.abs(result.netValueCents))}
            </div>
          </div>
        </div>

        {/* Breakdown row */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-5 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Credits</span>
            <span className="mono text-success">+{formatCents(result.creditsValueCents)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Perks</span>
            <span className="mono text-success">+{formatCents(result.perksValueCents)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Annual Fee</span>
            <span className="mono text-destructive">-{formatCents(card.annual_fee_cents)}</span>
          </div>
        </div>
      </div>

      {/* ── Statement Credits ── */}
      {credits.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="label-signal text-muted-foreground">Statement Credits</span>
            <span className="mono text-xs text-muted-foreground">
              {Object.values(creditToggles).filter(Boolean).length}/{credits.length} active
            </span>
          </div>
          <div className="space-y-1">
            {credits.map((credit) => {
              const annualValue = annualizeCreditCents(credit);
              const isOn = creditToggles[credit.name] ?? false;
              return (
                <button
                  key={credit.name}
                  onClick={() => toggleCredit(credit.name)}
                  className={`w-full flex items-center justify-between p-3 border text-left transition-colors ${
                    isOn
                      ? "border-primary/30 bg-primary/5"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                        isOn ? "bg-primary border-primary" : "border-border"
                      }`}
                    >
                      {isOn && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {credit.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCents(credit.amount_cents)}/{credit.period.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <span className={`mono text-sm shrink-0 ${isOn ? "text-success" : ""}`}>
                    +{formatCents(annualValue)}/yr
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Perks & Benefits ── */}
      {perks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="label-signal text-muted-foreground">Perks & Benefits</span>
            <span className="mono text-xs text-muted-foreground">
              {Object.values(perkToggles).filter(Boolean).length}/{perks.length} active
            </span>
          </div>
          <div className="space-y-1">
            {perks.map((perk) => {
              const isOn = perkToggles[perk.id] ?? false;
              return (
                <button
                  key={perk.id}
                  onClick={() => togglePerk(perk.id)}
                  className={`w-full flex items-center justify-between p-3 border text-left transition-colors ${
                    isOn
                      ? "border-primary/30 bg-primary/5"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
                        isOn ? "bg-primary border-primary" : "border-border"
                      }`}
                    >
                      {isOn && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">
                        {perk.name}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {perk.category}
                      </span>
                    </div>
                  </div>
                  <span className={`mono text-sm shrink-0 ${isOn ? "text-success" : ""}`}>
                    +{formatCents(perk.estimated_annual_value_cents)}/yr
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Annual Fee ── */}
      <section className="border p-4 mb-10 bg-destructive/5 border-destructive/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Annual Fee</span>
          <span className="mono text-lg text-destructive">
            {afDollars === 0 ? "$0" : `-$${afDollars}`}/yr
          </span>
        </div>
      </section>

      {/* ── Actions ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 border px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
        >
          <Share2 className="h-4 w-4" />
          {copied ? "Copied!" : "Share Result"}
        </button>
        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:brightness-110 transition-[filter]"
        >
          Track ALL your cards free
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Disclaimer ── */}
      <p className="mt-10 text-xs text-muted-foreground leading-relaxed">
        This tool provides estimates based on published card benefits and is not financial advice.
        Actual value depends on your usage patterns. Credit values are annualized from their
        stated period. Perk values are estimated. Always verify current terms with your card issuer.
      </p>
    </div>
  );
}
