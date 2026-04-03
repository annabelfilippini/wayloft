import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "About — Wayloft",
  description:
    "The story behind Wayloft and Ellis Church — AI-powered credit card optimization that earns trust by getting the math right.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-[720px] px-6 py-16 md:px-10 md:py-24">
        <span className="label-signal text-muted-foreground">About</span>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] mt-2">
          About Wayloft
        </h1>

        {/* ── Ellis Church ── */}
        <div className="mt-14">
          <div className="relative">
            <div className="sm:float-right sm:ml-8 sm:mb-4 mb-6 relative h-[280px] w-[200px] sm:h-[320px] sm:w-[220px] mx-auto sm:mx-0">
              <Image
                src="/ellis-church.png"
                alt="Ellis Church"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
            </div>
            <div>
              <span className="label-signal text-muted-foreground">The Voice</span>
              <h2 className="text-xl font-semibold tracking-[-0.01em] mt-2">
                Ellis Church
              </h2>
            </div>

            <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/80">
              <p>
                In 1930, airlines had a problem. Flying was safe, but nobody
                believed it. Passengers were terrified. The engineering was
                sound — the trust wasn&apos;t there.
              </p>

              <p>
                Ellen Church, a nurse and licensed pilot, proposed a solution: put
                someone competent and calm on the plane. Not to fly it — to take
                care of the people in it. She became the first flight attendant,
                and commercial aviation went from terrifying to normal within a
                decade.
              </p>

              <p>
                Wayloft faces a similar moment. AI can track your credit card
                benefits, monitor transfer bonuses, and tell you if your annual
                fee is worth paying — better and faster than you can manually. But
                people don&apos;t trust AI with financial decisions yet.
              </p>

              <p>
                Ellis Church is Wayloft&apos;s answer to that problem. An AI voice
                that earns trust the same way Ellen Church did: by being competent,
                calm, and genuinely useful. Not by pretending to be human. Not by
                performing intelligence. By getting the math right, every time.
              </p>
            </div>
          </div>

          <ul className="mt-6 space-y-4 text-[15px] leading-[1.7] text-foreground/80">
            <li className="flex gap-3">
              <span className="text-muted-foreground shrink-0">—</span>
              <span>
                Shows the math first. Every analysis includes the actual
                numbers, not vibes.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-muted-foreground shrink-0">—</span>
              <span>
                Tells you when a card isn&apos;t worth it, even if
                there&apos;s an affiliate link on the page.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-muted-foreground shrink-0">—</span>
              <span>
                Stays calm. No hype, no urgency, no &ldquo;limited time
                offer&rdquo; pressure.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-muted-foreground shrink-0">—</span>
              <span>
                Doesn&apos;t pretend to be human. Doesn&apos;t make a
                performance out of being AI either.
              </span>
            </li>
          </ul>
        </div>

        {/* ── Annabel Filippini ── */}
        <div className="border-t mt-16 pt-14">
          <div className="relative">
            <div className="sm:float-right sm:ml-8 sm:mb-4 mb-6 relative h-[280px] w-[200px] sm:h-[320px] sm:w-[220px] mx-auto sm:mx-0">
              <Image
                src="/annabel-filippini.png"
                alt="Annabel Filippini"
                fill
                className="object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
            </div>
            <div>
              <span className="label-signal text-muted-foreground">
                The Builder
              </span>
              <h2 className="text-xl font-semibold tracking-[-0.01em] mt-2">
                Annabel Filippini
              </h2>
            </div>

            <div className="mt-6 space-y-6 text-[15px] leading-[1.7] text-foreground/80">
              <p>
                Wayloft started because I couldn&apos;t find a tool that actually
                told me if my credit cards were worth keeping. Every site wanted to
                sell me a new card. None of them helped me evaluate the ones I
                already had.
              </p>

              <p>
                I graduated from the University of Michigan in May 2026, where I
                studied Information Analysis. I built Wayloft to solve my own
                problem first — then realized the tools I was building for myself
                were useful to anyone paying an annual fee and wondering if the
                math still works.
              </p>

              <p>
                Wayloft is built with AI at its core, not bolted on as a feature.
                Ellis Church runs the analysis. I set the direction, make the
                product decisions, and make sure the data is right. If something
                on this site is wrong, that&apos;s on me.
              </p>
            </div>
          </div>

          <div className="border-l-2 border-amber-500/40 pl-6 mt-8">
            <p className="text-foreground/90 italic text-[15px] leading-[1.7]">
              Annabel builds Wayloft and serves as its board. Ellis runs the
              data.
            </p>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="border-t mt-16 pt-10">
          <span className="label-signal text-muted-foreground">
            Try the Tools
          </span>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/credit-cards/worth-it"
              className="flex items-center justify-center gap-2 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:brightness-110 transition-[filter]"
            >
              Is Your Card Worth It?
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/credit-cards"
              className="flex items-center justify-center gap-2 border px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
            >
              Browse Card Reviews
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
