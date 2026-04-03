import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CreditCard, Search, BarChart3 } from "lucide-react";
import { getAllCards } from "@/lib/cards/catalog";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Wayloft — Credit Card Rewards, Optimized",
  description:
    "Is your card worth the annual fee? Toggle the benefits you actually use and get a verdict in 30 seconds. Plus card reviews, comparisons, and a spending-based recommendation quiz.",
  openGraph: {
    title: "Wayloft — Credit Card Rewards, Optimized",
    description:
      "Is your card worth the annual fee? Analyze any premium card in 30 seconds. Free, no signup required.",
    url: "https://wayloft.app",
  },
};

const featuredSlugs = [
  "chase-sapphire-reserve",
  "amex-platinum",
  "amex-gold",
];

const tools = [
  {
    icon: CreditCard,
    href: "/credit-cards",
    title: "Card Reviews",
    stat: "52 cards",
    description:
      "Earning rates, transfer partners, perks, and annual fee breakdowns for every major rewards card.",
  },
  {
    icon: BarChart3,
    href: "/credit-cards/best-for/travel",
    title: "Best Cards",
    stat: "5 categories",
    description:
      "Top picks for dining, travel, cash-back, hotels, and no-annual-fee. Ranked by first-year value.",
  },
  {
    icon: Search,
    href: "/recommend",
    title: "Find Your Card",
    stat: "5 questions",
    description:
      "Tell us how you spend. Get a ranked list of cards scored against your actual spending patterns.",
  },
];

export default function HomePage() {
  const allCards = getAllCards();

  const featuredCards = featuredSlugs
    .map((slug) => allCards.find((c) => c.slug === slug))
    .filter(
      (c): c is NonNullable<typeof c> => c !== undefined
    );

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />

      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1120px] px-6 pb-14 pt-16 md:px-10 md:pb-20 md:pt-24">
        <span className="label-signal text-primary">FREE TOOL</span>
        <h1 className="mt-3 max-w-[560px] text-4xl font-semibold tracking-[-0.025em] sm:text-5xl">
          Is your card worth it?
        </h1>
        <p className="mt-4 max-w-[460px] text-[15px] leading-[1.7] text-muted-foreground">
          Toggle the benefits you actually use. See if your annual fee pays for
          itself&mdash;or if it&apos;s time to downgrade. Free, no signup.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/credit-cards/worth-it"
            className="flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110"
          >
            Analyze a Card
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/credit-cards"
            className="flex items-center gap-2 border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            Browse {allCards.length} Cards
          </Link>
        </div>
      </section>

      {/* ── Featured Cards ── */}
      <section className="mx-auto max-w-[1120px] px-6 md:px-10">
        <div className="border-t pb-14 pt-12 md:pb-20 md:pt-16">
          <span className="label-signal text-muted-foreground">
            ANALYZE NOW
          </span>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {featuredCards.map((card) => {
              const benefitCount =
                (card.credits?.length ?? 0) + (card.perks?.length ?? 0);
              return (
                <Link
                  key={card.slug}
                  href={`/credit-cards/${card.slug}/worth-it`}
                  className="group border p-5 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                >
                  <div className="w-[100px]">
                    <CardArtPlaceholder
                      issuer={card.issuer}
                      network={card.network}
                      cardName={card.name}
                      hideLabels
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold">{card.name}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="mono text-xs text-muted-foreground">
                      ${(card.annual_fee_cents / 100).toFixed(0)}/yr
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {benefitCount} benefits to analyze
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Analyze
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section className="mx-auto max-w-[1120px] px-6 md:px-10">
        <div className="border-t pb-14 pt-12 md:pb-20 md:pt-16">
          <span className="label-signal text-muted-foreground">EXPLORE</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.015em]">
            More tools
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group border p-6 transition-colors hover:border-foreground/15"
              >
                <div className="flex items-center gap-3">
                  <tool.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="mono text-[10px] text-muted-foreground">
                    {tool.stat}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold">{tool.title}</p>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-muted-foreground">
                  {tool.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ellis Church ── */}
      <section className="mx-auto max-w-[1120px] px-6 md:px-10">
        <div className="border-t pb-14 pt-12 md:pb-16 md:pt-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-[480px]">
              <span className="label-signal text-muted-foreground">
                ANALYSIS BY
              </span>
              <p className="mt-2 text-lg font-semibold tracking-[-0.01em]">
                Ellis Church
              </p>
              <p className="mt-2 text-[14px] leading-[1.7] text-muted-foreground">
                Every number on this site is computed, not guessed. Ellis shows
                the math first, tells you when a card isn&apos;t worth it, and
                never manufactures urgency. If the data says downgrade, that&apos;s the
                recommendation&mdash;affiliate link or not.
              </p>
            </div>
            <Link
              href="/about"
              className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              About Wayloft &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sign Up CTA ── */}
      <section className="mx-auto max-w-[1120px] px-6 md:px-10">
        <div className="border-t pb-16 pt-12 text-center md:pb-24 md:pt-16">
          <h2 className="text-2xl font-semibold tracking-[-0.015em]">
            Track your full portfolio
          </h2>
          <p className="mx-auto mt-3 max-w-[400px] text-[14px] leading-[1.7] text-muted-foreground">
            Spending optimizer, transfer bonus alerts, annual fee reminders,
            statement credit trackers. Free to start.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110"
          >
            Get Started Free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
