import Link from "next/link";
import type { CatalogCard } from "@wayloft/shared";
import type { BestForCategory } from "@/lib/cards/best-for";
import { getAllBestForCategories } from "@/lib/cards/best-for";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { AffiliateDisclosure } from "./affiliate-disclosure";
import { AffiliateLink } from "./affiliate-link";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Trophy,
  CheckCircle2,
} from "lucide-react";

const ISSUER_LABELS: Record<string, string> = {
  chase: "Chase",
  amex: "Amex",
  citi: "Citi",
  capital_one: "Capital One",
  bilt: "Bilt",
  wells_fargo: "Wells Fargo",
  barclays: "Barclays",
  us_bank: "U.S. Bank",
  bank_of_america: "Bank of America",
  discover: "Discover",
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

export function BestForArticle({
  category,
  cards,
}: {
  category: BestForCategory;
  cards: CatalogCard[];
}) {
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12 md:px-10">
      {/* Hero */}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Wayloft Picks &middot; {new Date().getFullYear()}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-tight md:text-3xl">
          {category.title}
        </h1>
        <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-muted-foreground">
          {category.headline}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {category.description}
        </p>
      </div>

      <AffiliateDisclosure />

      {/* Category nav */}
      <div className="mt-6 flex flex-wrap gap-2">
        {getAllBestForCategories().map((cat) => (
          <Link
            key={cat.slug}
            href={`/credit-cards/best-for/${cat.slug}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              cat.slug === category.slug
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            {cat.slug
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </Link>
        ))}
      </div>

      {/* Quick comparison table */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">At a Glance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Card</th>
                <th className="pb-2 pr-4 font-medium">Annual Fee</th>
                <th className="pb-2 pr-4 font-medium">Signup Bonus</th>
                <th className="hidden pb-2 pr-4 font-medium sm:table-cell">
                  Best For
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, i) => (
                <tr key={card.slug} className="border-b last:border-0">
                  <td className="py-3 pr-4 align-top">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    <Link
                      href={`/credit-cards/${card.slug}`}
                      className="font-medium hover:underline"
                    >
                      {card.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {ISSUER_LABELS[card.issuer] ?? card.issuer}
                    </p>
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {card.annual_fee_cents === 0
                      ? "$0"
                      : formatCents(card.annual_fee_cents)}
                  </td>
                  <td className="py-3 pr-4 align-top">
                    {card.signup_bonus
                      ? `${card.signup_bonus.points.toLocaleString()} pts`
                      : "None"}
                  </td>
                  <td className="hidden py-3 pr-4 align-top sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {card.best_for.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Individual card breakdowns */}
      <section className="mt-12 space-y-10">
        {cards.map((card, i) => (
          <CardBreakdown key={card.slug} card={card} rank={i + 1} />
        ))}
      </section>

      {/* Quiz CTA */}
      <section className="mt-12 rounded-xl border bg-muted/30 p-8 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
          Want a personalized recommendation?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Our quiz factors in your spending, credit score, and existing cards to
          find the best match for you.
        </p>
        <Link
          href="/recommend"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Take the Quiz
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Browse more */}
      <div className="mt-8 text-center">
        <Link
          href="/credit-cards"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Browse all cards
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function CardBreakdown({
  card,
  rank,
}: {
  card: CatalogCard;
  rank: number;
}) {
  const topEarning = Object.entries(card.earning_rates)
    .filter(([cat]) => cat !== "other" && cat !== "brand_portal")
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="rounded-xl border p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Card art */}
        <div className="w-full max-w-[200px] shrink-0">
          <CardArtPlaceholder
            issuer={card.issuer}
            network={card.network}
            cardName={card.name}
          />
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {rank === 1 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-400">
                <Trophy className="h-3 w-3" />
                Top Pick
              </span>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              #{rank}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-semibold">{card.name}</h3>
          <p className="text-sm text-muted-foreground">
            {card.annual_fee_cents === 0
              ? "No annual fee"
              : `${formatCents(card.annual_fee_cents)}/year`}
            {card.signup_bonus && (
              <>
                {" · "}
                {card.signup_bonus.points.toLocaleString()} pts after{" "}
                {formatCents(card.signup_bonus.spend_requirement_cents)} in{" "}
                {card.signup_bonus.timeframe_months}mo
              </>
            )}
          </p>

          {/* Top earning categories */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {topEarning.map(([category, rate]) => (
              <div key={category} className="rounded-lg border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground capitalize">
                  {category.replace(/_/g, " ")}
                </p>
                <p className="text-sm font-semibold">{rate}x</p>
              </div>
            ))}
          </div>

          {/* Key perks (top 3) */}
          <div className="mt-4 space-y-1.5">
            {card.key_perks.slice(0, 3).map((perk) => (
              <div
                key={perk}
                className="flex items-start gap-2 text-xs text-muted-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                {perk}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {card.application_url && (
              <AffiliateLink
                applicationUrl={card.application_url}
                cardSlug={card.slug}
                sourcePage="best-for"
                rank={rank}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              />
            )}
            <Link
              href={`/credit-cards/${card.slug}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Full Review
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
