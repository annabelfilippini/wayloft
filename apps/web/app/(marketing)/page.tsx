import Link from "next/link";
import { ArrowRight, CreditCard, ArrowLeftRight, Search } from "lucide-react";

const features = [
  {
    icon: CreditCard,
    label: "Card Portfolio",
    heading: "Every card, one view",
    description:
      "Track signup bonuses, annual fee dates, and spending progress across your entire portfolio. Never miss a deadline again.",
  },
  {
    icon: ArrowLeftRight,
    label: "Transfer Bonuses",
    heading: "Catch every bonus",
    description:
      "Real-time alerts when airlines and hotels run transfer promotions. Know exactly when your points are worth more.",
  },
  {
    icon: Search,
    label: "Flight Search",
    heading: "Book for less",
    description:
      "Search award flights across programs and see the true cost in points. Find routes others miss.",
  },
];

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen bg-[#0F0F0F] text-white">
      {/* Subtle top-down ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,50,90,0.4) 0%, transparent 70%)",
        }}
      />

      {/* ═══════════════════════════════ */}
      {/*  NAV                            */}
      {/* ═══════════════════════════════ */}
      <nav className="relative z-10 mx-auto flex max-w-[1120px] items-center justify-between px-6 pt-8 md:px-10 md:pt-12">
        <span className="mono text-[15px] font-bold tracking-[-0.04em] text-primary">
          WAYLOFT
        </span>
        <div className="flex items-center gap-6 text-[13px] text-white/40 md:gap-8">
          <Link href="/credit-cards" className="hidden transition-colors hover:text-white/70 md:block">
            Cards
          </Link>
          <Link href="#features" className="hidden transition-colors hover:text-white/70 md:block">
            Features
          </Link>
          <Link href="/login" className="transition-colors hover:text-white/70">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="border border-white/[0.12] px-4 py-1.5 text-white/60 transition-all hover:border-white/25 hover:text-white/90"
          >
            Join
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════ */}
      {/*  HERO                           */}
      {/* ═══════════════════════════════ */}
      <section className="relative z-10 mx-auto flex max-w-[1120px] flex-col items-center px-6 pb-28 pt-32 text-center md:px-10 md:pb-36 md:pt-44">
        {/* Eyebrow */}
        <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.25em] text-[#D4A020]/70">
          Travel rewards, optimized
        </p>

        <h1 className="mx-auto max-w-[720px] text-[clamp(2.6rem,6.5vw,5.4rem)] font-normal leading-[0.92] tracking-[-0.02em] text-white/95">
          Your points are
          <br />
          <span className="text-white/40">worth more</span>
        </h1>

        <p className="mx-auto mt-8 max-w-[420px] text-[15px] leading-[1.7] text-white/30">
          Track every card, catch every transfer bonus, and book flights
          for fewer points than you thought possible.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="group flex items-center gap-2.5 bg-[#D4A020] px-7 py-3 text-[13px] font-medium text-[#0F0F0F] transition-all hover:brightness-110"
          >
            Get Started
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#features"
            className="text-[13px] text-white/35 transition-colors hover:text-white/60"
          >
            See how it works
          </Link>
        </div>

        {/* Stat pills */}
        <div className="mt-20 flex flex-wrap justify-center gap-x-10 gap-y-4 md:mt-28">
          {[
            ["52+", "Cards tracked"],
            ["5", "Bank currencies"],
            ["Real-time", "Bonus alerts"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="mono text-[28px] font-bold tracking-[-0.02em] text-white/80 md:text-[32px]">
                {value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/25">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider line */}
      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* ═══════════════════════════════ */}
      {/*  FEATURES                       */}
      {/* ═══════════════════════════════ */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-[1120px] px-6 py-28 md:px-10 md:py-36"
      >
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-[#D4A020]/70">
          Built for points nerds
        </p>
        <h2 className="max-w-[480px] text-[clamp(1.8rem,4vw,2.8rem)] font-normal leading-[1] tracking-[-0.02em] text-white/90">
          Everything you need,
          <br />
          <span className="text-white/35">nothing you don&apos;t</span>
        </h2>

        <div className="mt-16 grid gap-1 md:grid-cols-3 md:mt-20">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="group border border-white/[0.04] bg-white/[0.015] p-8 transition-colors hover:border-white/[0.08] hover:bg-white/[0.025] md:p-10"
            >
              <div className="mb-6 flex h-10 w-10 items-center justify-center border border-white/[0.08] bg-white/[0.03]">
                <feature.icon className="h-[18px] w-[18px] text-[#D4A020]/80" />
              </div>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
                {feature.label}
              </p>
              <h3 className="text-[22px] font-normal leading-[1.15] tracking-[-0.01em] text-white/85 md:text-[24px]">
                {feature.heading}
              </h3>
              <p className="mt-3 text-[13.5px] leading-[1.65] text-white/30">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider line */}
      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        <div className="h-px bg-white/[0.06]" />
      </div>

      {/* ═══════════════════════════════ */}
      {/*  CTA                            */}
      {/* ═══════════════════════════════ */}
      <section className="relative z-10 mx-auto flex max-w-[1120px] flex-col items-center px-6 py-28 text-center md:px-10 md:py-36">
        <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-normal leading-[1] tracking-[-0.02em] text-white/90">
          Stop leaving value
          <br />
          <span className="text-white/35">on the table</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[380px] text-[14px] leading-[1.7] text-white/30">
          Join Wayloft and start making every point count. Free to start, no credit card required.
        </p>
        <Link
          href="/signup"
          className="group mt-10 flex items-center gap-2.5 bg-[#D4A020] px-7 py-3 text-[13px] font-medium text-[#0F0F0F] transition-all hover:brightness-110"
        >
          Get Started Free
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>

      {/* ═══════════════════════════════ */}
      {/*  FOOTER                         */}
      {/* ═══════════════════════════════ */}
      <footer className="relative z-10 mx-auto flex max-w-[1120px] items-center justify-between border-t border-white/[0.06] px-6 py-8 md:px-10">
        <span className="mono text-[15px] font-bold tracking-[-0.04em] text-primary">
          WAYLOFT
        </span>
        <span className="text-[11px] tracking-[0.1em] text-white/20">
          &copy; {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
