import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "Wayloft — Your Points, Properly Spent",
  description:
    "Wayloft connects your credit cards, points, and flights into one view. See what your rewards are worth — and where to spend them.",
  openGraph: {
    title: "Wayloft — Your Points, Properly Spent",
    description:
      "Credit card rewards optimization. Track your portfolio, find the best value, and travel smarter.",
    url: "https://wayloft.app",
  },
};

/** Worth-It section: cards with actual worth-it pages */
const worthItCards = [
  { slug: "chase-sapphire-reserve", issuer: "chase", network: "visa", name: "Sapphire Reserve" },
  { slug: "amex-platinum", issuer: "amex", network: "amex", name: "Platinum" },
  { slug: "amex-gold", issuer: "amex", network: "amex", name: "Gold" },
];

/**
 * Landing page uses Playfair Display (--font-display) for all text,
 * with Geist Mono for data and labels. The serif treatment is
 * intentionally different from the rest of the site.
 */
const serif = "var(--font-display), Georgia, serif";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: serif }}>
      <MarketingHeader />

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-[1120px] overflow-hidden px-6 md:px-10">
        {/* Contrails — bottom-left to top-right */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <svg
            viewBox="0 0 1120 480"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="trail-fade" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
                <stop offset="30%" stopColor="var(--color-primary)" stopOpacity="0.04" />
                <stop offset="60%" stopColor="var(--color-primary)" stopOpacity="0.08" />
                <stop offset="85%" stopColor="var(--color-primary)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.18" />
              </linearGradient>
              <linearGradient id="trail-glow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0" />
                <stop offset="40%" stopColor="var(--color-primary)" stopOpacity="0.02" />
                <stop offset="70%" stopColor="var(--color-primary)" stopOpacity="0.04" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.07" />
              </linearGradient>
              <filter id="wispy" x="-20%" y="-40%" width="140%" height="180%">
                <feTurbulence type="fractalNoise" baseFrequency="0.015 0.003" numOctaves={4} seed={2} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={8} xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="wispy-soft" x="-20%" y="-60%" width="140%" height="220%">
                <feTurbulence type="fractalNoise" baseFrequency="0.01 0.002" numOctaves={3} seed={5} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={12} xChannelSelector="R" yChannelSelector="G" />
                <feGaussianBlur stdDeviation={3} />
              </filter>
              <g id="plane">
                <ellipse cx="0" cy="0" rx="10" ry="2" fill="var(--color-primary)" opacity="0.35" />
                <line x1="-2" y1="-8" x2="3" y2="8" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.3" />
                <line x1="-8" y1="-4" x2="-5" y2="4" stroke="var(--color-primary)" strokeWidth="1" opacity="0.25" />
              </g>
            </defs>
            {/* Upper trail */}
            <path d="M -40,210 C 200,205 500,165 1080,143" stroke="url(#trail-glow)" strokeWidth="14" fill="none" strokeLinecap="round" filter="url(#wispy-soft)" />
            <path d="M -40,210 C 200,205 500,165 1080,143" stroke="url(#trail-fade)" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#wispy)" />
            {/* Lower trail */}
            <path d="M -40,224 C 200,219 500,179 1080,157" stroke="url(#trail-glow)" strokeWidth="14" fill="none" strokeLinecap="round" filter="url(#wispy-soft)" />
            <path d="M -40,224 C 200,219 500,179 1080,157" stroke="url(#trail-fade)" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#wispy)" />
            {/* Plane silhouette */}
            <use href="#plane" x="1100" y="148" transform="rotate(-5, 1100, 148)" />
          </svg>
        </div>

        <div className="relative z-10 pb-20 pt-24 md:pb-32 md:pt-32">
          <h1 className="text-[clamp(3rem,7vw,5rem)] font-medium leading-[1.05] tracking-[-0.02em]">
            Your points,
            <br />
            properly spent.
          </h1>
          <p className="mt-8 max-w-[480px] text-[17px] leading-[1.7] text-muted-foreground">
            Wayloft connects your credit cards, points, and travel into one
            view. See exactly what your rewards are worth&mdash;and where to
            spend them.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Get Started Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/credit-cards/worth-it"
              className="flex items-center gap-2 border px-8 py-3.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Try Worth It?
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platform ── */}
      <section className="border-t">
        <div className="mx-auto max-w-[1120px] px-6 py-16 md:px-10 md:py-24">
          <span className="label-signal text-muted-foreground">
            THE PLATFORM
          </span>
          <h2 className="mt-3 max-w-[520px] text-[clamp(1.5rem,3vw,2rem)] font-medium tracking-[-0.01em]">
            Cards, points, and flights.{" "}
            <span className="text-muted-foreground">Connected.</span>
          </h2>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Portfolio Preview */}
            <div className="border p-6">
              <span className="label-signal text-primary">PORTFOLIO</span>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="mono text-3xl font-light">$12,450</span>
              </div>
              <p className="mono mt-1 text-xs text-muted-foreground">
                estimated annual value
              </p>
              <div className="mt-4 flex gap-1.5">
                <div
                  className="h-1.5 w-10"
                  style={{
                    background: "linear-gradient(90deg, #1a1f71, #0a0e3a)",
                  }}
                />
                <div
                  className="h-1.5 w-10"
                  style={{
                    background: "linear-gradient(90deg, #c6993e, #b8922f)",
                  }}
                />
                <div
                  className="h-1.5 w-10"
                  style={{
                    background: "linear-gradient(90deg, #c6993e, #a67c2e)",
                  }}
                />
              </div>
              <p className="mt-6 text-[14px] leading-[1.6] text-muted-foreground">
                Add your cards. Wayloft calculates what every point, mile,
                and credit is worth across your entire portfolio.
              </p>
            </div>

            {/* Optimizer Preview */}
            <div className="border p-6">
              <span className="label-signal text-primary">OPTIMIZER</span>
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px]">Dining</span>
                  <span className="mono text-xs text-muted-foreground">
                    Gold &middot;{" "}
                    <span className="text-foreground">4x</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px]">Travel</span>
                  <span className="mono text-xs text-muted-foreground">
                    CSR &middot;{" "}
                    <span className="text-foreground">3x</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px]">Groceries</span>
                  <span className="mono text-xs text-muted-foreground">
                    Gold &middot;{" "}
                    <span className="text-foreground">4x</span>
                  </span>
                </div>
              </div>
              <p className="mt-6 text-[14px] leading-[1.6] text-muted-foreground">
                For every purchase category, see which card earns the most.
                Never use the wrong card again.
              </p>
            </div>

            {/* Bonuses Preview */}
            <div className="border p-6">
              <span className="label-signal text-primary">BONUSES</span>
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px]">Amex → Delta</span>
                  <span className="mono text-xs font-medium text-primary">
                    +30%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px]">Chase → Hyatt</span>
                  <span className="mono text-xs font-medium text-primary">
                    +25%
                  </span>
                </div>
                <div className="mono mt-1 text-[10px] text-destructive">
                  6 days left
                </div>
              </div>
              <p className="mt-6 text-[14px] leading-[1.6] text-muted-foreground">
                Real-time transfer bonus tracking across every bank. Get
                alerts before bonuses expire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="border-t">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-12 gap-y-6 px-6 py-10 md:px-10 md:py-12">
          {[
            { number: "52", label: "cards analyzed" },
            { number: "15", label: "transfer partners" },
            { number: "13", label: "spending categories" },
            { number: "24/7", label: "bonus monitoring" },
          ].map((stat) => (
            <div key={stat.label}>
              <span className="mono text-2xl font-light">{stat.number}</span>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Worth-It Tool ── */}
      <section className="border-t">
        <div className="mx-auto max-w-[1120px] px-6 md:px-10">
          <div className="flex flex-col gap-10 py-16 md:flex-row md:items-center md:gap-16 md:py-24">
            <div className="flex-1">
              <span className="label-signal text-primary">FREE TOOL</span>
              <h2 className="mt-3 text-[clamp(1.4rem,2.5vw,1.75rem)] font-medium tracking-[-0.01em]">
                Is your card worth the annual fee?
              </h2>
              <p className="mt-4 max-w-[400px] text-[15px] leading-[1.7] text-muted-foreground">
                Toggle the credits and perks you actually use. Get an instant
                verdict&mdash;keep, call for a retention offer, or downgrade.
                No signup required.
              </p>
              <Link
                href="/credit-cards/worth-it"
                className="mt-8 inline-flex items-center gap-2 bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Analyze a Card
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 md:w-auto md:flex md:shrink-0">
              {worthItCards.map((card) => (
                <Link
                  key={card.slug}
                  href={`/credit-cards/${card.slug}/worth-it`}
                  className="group border p-3 transition-colors hover:border-primary/30 md:w-[130px]"
                >
                  <CardArtPlaceholder
                    issuer={card.issuer}
                    network={card.network}
                    cardName={card.name}
                    hideLabels
                  />
                  <p className="mt-2.5 text-xs font-medium">{card.name}</p>
                  <span className="mono mt-0.5 block text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Analyze &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="border-t">
        <div className="mx-auto max-w-[1120px] px-6 py-24 text-center md:px-10 md:py-32">
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.015em]">
            Your next first-class seat
            <br />
            is already paid for.
          </h2>
          <p className="mx-auto mt-5 max-w-[400px] text-[15px] leading-[1.7] text-muted-foreground">
            Stop leaving value on the table. Wayloft shows you what your cards
            are worth and how to use every point.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-flex items-center gap-2 bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110"
            style={{ fontFamily: "var(--font-sans)" }}
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
