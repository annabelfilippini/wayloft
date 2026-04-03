import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllCards } from "@/lib/cards/catalog";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";

export const metadata: Metadata = {
  title: "Is Your Card Worth It? — Free Card Analyzer | Wayloft",
  description:
    "Toggle the benefits you actually use and find out if your credit card is worth the annual fee. Instant verdict: keep, call for retention, or downgrade.",
};

export default function WorthItIndexPage() {
  const allCards = getAllCards();

  // Cards that have credits or perks data AND an annual fee
  const analyzableCards = allCards.filter(
    (card) =>
      card.annual_fee_cents > 0 &&
      ((card.credits && card.credits.length > 0) ||
        (card.perks && card.perks.length > 0))
  );

  // Cards with AF but no credits/perks data yet
  const comingSoonCards = allCards
    .filter(
      (card) =>
        card.annual_fee_cents > 0 &&
        (!card.credits || card.credits.length === 0) &&
        (!card.perks || card.perks.length === 0)
    )
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12 md:py-20">
      {/* Header */}
      <span className="label-signal text-muted-foreground">Free Tool</span>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mt-1">
        Is your card worth it?
      </h1>
      <p className="text-muted-foreground mt-3 leading-relaxed max-w-[520px]">
        Toggle the benefits you actually use. See if your annual fee pays for
        itself — or if it&apos;s time to downgrade.
      </p>

      {/* Analyzable cards */}
      <section className="mt-10">
        <span className="label-signal text-muted-foreground mb-4 block">
          Analyze Your Card
        </span>
        <div className="grid gap-3">
          {analyzableCards.map((card) => (
            <Link
              key={card.slug}
              href={`/credit-cards/${card.slug}/worth-it`}
              className="group flex items-center gap-4 border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="w-[80px] shrink-0">
                <CardArtPlaceholder
                  issuer={card.issuer}
                  network={card.network}
                  cardName={card.name}
                  hideLabels
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{card.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="mono text-xs text-muted-foreground">
                    ${(card.annual_fee_cents / 100).toFixed(0)}/yr
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(card.credits?.length ?? 0) + (card.perks?.length ?? 0)} benefits to analyze
                  </span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Coming soon */}
      {comingSoonCards.length > 0 && (
        <section className="mt-10">
          <span className="label-signal text-muted-foreground mb-4 block">
            Coming Soon
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {comingSoonCards.map((card) => (
              <Link
                key={card.slug}
                href={`/credit-cards/${card.slug}`}
                className="border p-3 text-center opacity-60 hover:opacity-80 transition-opacity"
              >
                <p className="text-xs font-medium truncate">{card.name}</p>
                <p className="mono text-[11px] text-muted-foreground mt-0.5">
                  ${(card.annual_fee_cents / 100).toFixed(0)}/yr
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-12 border bg-muted/30 p-6 text-center">
        <p className="text-sm font-semibold">Track all your cards in one place</p>
        <p className="text-xs text-muted-foreground mt-1">
          Signup bonuses, annual fee dates, spending optimizer, transfer bonuses — free.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110 transition-[filter]"
        >
          Get Started Free
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
