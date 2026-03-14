import Link from "next/link";
import type { CatalogCard } from "@wayloft/shared";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { AffiliateDisclosure } from "./affiliate-disclosure";
import { AffiliateLink } from "./affiliate-link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plane,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  ArrowRight,
} from "lucide-react";

interface TransferPartnerEntry {
  partner: string;
  code: string;
  ratio: string;
  transfer_time: string;
  alliance?: string | null;
  note?: string;
}

interface TransferPartnersData {
  name: string;
  issuer: string;
  transfer_partners: {
    airlines: TransferPartnerEntry[];
    hotels: TransferPartnerEntry[];
  };
}

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

export function CardReview({
  card,
  transferPartners,
  relatedCards,
}: {
  card: CatalogCard;
  transferPartners: TransferPartnersData | null;
  relatedCards: CatalogCard[];
}) {
  const earningRates = Object.entries(card.earning_rates).sort(
    ([, a], [, b]) => b - a
  );

  const hasTransferPartners =
    transferPartners &&
    (transferPartners.transfer_partners.airlines.length > 0 ||
      transferPartners.transfer_partners.hotels.length > 0);

  const hasPerks =
    (card.perks && card.perks.length > 0) || card.key_perks.length > 0;

  const hasCredits = card.credits && card.credits.length > 0;

  const hasEditorial = card.editorial?.verdict;

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12 md:px-10">
      {/* ── 1. Hero ── */}
      <div className="mb-8 flex flex-col gap-8 md:flex-row md:items-start">
        <div className="w-full max-w-[320px] shrink-0">
          <CardArtPlaceholder
            issuer={card.issuer}
            network={card.network}
            cardName={card.name}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {ISSUER_LABELS[card.issuer] ?? card.issuer}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl tracking-tight md:text-3xl">
            {card.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {card.annual_fee_cents === 0
              ? "No annual fee"
              : `${formatCents(card.annual_fee_cents)}/year`}
            {card.signup_bonus && (
              <>
                {" · "}
                {card.signup_bonus.points.toLocaleString()} point signup bonus
              </>
            )}
            {card.best_for.length > 0 && (
              <>
                {" · "}
                {card.best_for.join(", ")}
              </>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {card.application_url && (
              <AffiliateLink
                applicationUrl={card.application_url}
                cardSlug={card.slug}
                sourcePage="card-review"
              />
            )}
            <Link
              href="/credit-cards"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Compare
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Affiliate Disclosure ── */}
      <AffiliateDisclosure />

      <div className="mt-10 space-y-10">
        {/* ── 3. Quick Stats Grid ── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCell
              label="Annual Fee"
              value={
                card.annual_fee_cents === 0
                  ? "$0"
                  : formatCents(card.annual_fee_cents)
              }
            />
            <StatCell
              label="Signup Bonus"
              value={
                card.signup_bonus
                  ? `${card.signup_bonus.points.toLocaleString()} pts`
                  : "None"
              }
            />
            <StatCell
              label="Spend Requirement"
              value={
                card.signup_bonus
                  ? `${formatCents(card.signup_bonus.spend_requirement_cents)} in ${card.signup_bonus.timeframe_months}mo`
                  : "N/A"
              }
            />
            <StatCell
              label="Foreign Transaction Fee"
              value={card.foreign_transaction_fee ? "Yes" : "None"}
            />
            <StatCell label="Credit Score" value={card.credit_score_min} />
            <StatCell label="Currency" value={card.currency} />
          </div>
        </section>

        {/* ── 4. Earning Rates ── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Earning Rates</h2>
          <div className="space-y-2">
            {earningRates.map(([category, rate]) => (
              <div
                key={category}
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span className="capitalize text-muted-foreground">
                  {category.replace(/_/g, " ")}
                </span>
                <span className="font-medium">{rate}x</span>
              </div>
            ))}
          </div>

          {card.earning_caps.length > 0 && (
            <>
              <Separator className="my-4" />
              <h3 className="mb-2 text-sm font-semibold">Earning Caps</h3>
              <div className="space-y-1.5">
                {card.earning_caps.map((cap) => (
                  <p
                    key={cap.category}
                    className="text-xs text-muted-foreground"
                  >
                    {cap.category}: up to{" "}
                    {formatCents(cap.limit_cents)}/{cap.period}
                  </p>
                ))}
              </div>
            </>
          )}

          {card.portal_cpp > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">
                    Travel portal value
                  </span>
                  <p className="text-xs text-muted-foreground/70">
                    Worth {card.portal_cpp}&cent; per point when booking through{" "}
                    {ISSUER_LABELS[card.issuer] ?? card.issuer}&apos;s travel
                    portal
                  </p>
                </div>
                <span className="shrink-0 font-medium">
                  {card.portal_cpp}&cent;/pt
                </span>
              </div>
            </>
          )}
        </section>

        {/* ── 5. Transfer Partners ── */}
        {hasTransferPartners && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Transfer Partners</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              {transferPartners.name}
            </p>

            {transferPartners.transfer_partners.airlines.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Plane className="h-4 w-4" />
                  Airlines
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {transferPartners.transfer_partners.airlines.map(
                    (airline) => (
                      <div
                        key={airline.code}
                        className="flex items-center justify-between rounded-md border p-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {airline.partner}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{airline.code}</span>
                            {airline.alliance && (
                              <>
                                <span>&middot;</span>
                                <span>{airline.alliance}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-medium">{airline.ratio}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {airline.transfer_time}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {transferPartners.transfer_partners.hotels.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4" />
                  Hotels
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {transferPartners.transfer_partners.hotels.map((hotel) => (
                    <div
                      key={hotel.code}
                      className="flex items-center justify-between rounded-md border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{hotel.partner}</p>
                        {hotel.note && (
                          <p className="text-xs text-muted-foreground">
                            {hotel.note}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-medium">{hotel.ratio}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {hotel.transfer_time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── 6. Perks & Benefits ── */}
        {hasPerks && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Perks & Benefits</h2>
            {card.perks && card.perks.length > 0 ? (
              <div className="space-y-6">
                {(
                  [
                    "travel",
                    "insurance",
                    "lifestyle",
                    "financial",
                    "dining",
                    "status",
                  ] as const
                ).map((category) => {
                  const categoryPerks = card.perks!.filter(
                    (p) => p.category === category
                  );
                  if (categoryPerks.length === 0) return null;
                  return (
                    <div key={category}>
                      <h3 className="mb-2 text-sm font-semibold capitalize">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryPerks.map((perk) => (
                          <div
                            key={perk.id}
                            className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm"
                          >
                            <div>
                              <p className="font-medium">{perk.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {perk.description}
                              </p>
                            </div>
                            {perk.estimated_annual_value_cents > 0 && (
                              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                ~{formatCents(perk.estimated_annual_value_cents)}
                                /yr
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="space-y-2">
                {card.key_perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {perk}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── 7. Statement Credits ── */}
        {hasCredits && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Statement Credits</h2>
            <div className="space-y-3">
              {card.credits!.map((credit) => (
                <div
                  key={credit.name}
                  className="flex items-start justify-between gap-4 rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{credit.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {credit.merchants.join(", ")}
                      {credit.enrollment_required && " · Enrollment required"}
                    </p>
                    {credit.gotchas && (
                      <p className="mt-1 text-xs text-amber-600">
                        {credit.gotchas}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">
                      {formatCents(credit.amount_cents)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {credit.period.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 8. Editorial Review ── */}
        {hasEditorial && card.editorial && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Our Review</h2>
            {card.editorial.rating && (
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < card.editorial!.rating!
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted"
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium">
                  {card.editorial.rating}/5
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-green-700 dark:text-green-400">
                  Pros
                </h3>
                <ul className="space-y-1.5">
                  {card.editorial.pros.map((pro) => (
                    <li
                      key={pro}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
                  Cons
                </h3>
                <ul className="space-y-1.5">
                  {card.editorial.cons.map((con) => (
                    <li
                      key={con}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {card.editorial.verdict}
            </p>
          </section>
        )}

        {/* ── 9. Related Cards ── */}
        {relatedCards.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Related Cards</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedCards.map((related) => (
                <Link
                  key={related.slug}
                  href={`/credit-cards/${related.slug}`}
                  className="group rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-accent/30"
                >
                  <CardArtPlaceholder
                    issuer={related.issuer}
                    network={related.network}
                    cardName={related.name}
                    className="mb-3"
                  />
                  <p className="text-sm font-semibold group-hover:underline">
                    {related.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {related.annual_fee_cents === 0
                      ? "No annual fee"
                      : `${formatCents(related.annual_fee_cents)}/yr`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── 10. Quiz CTA Banner ── */}
        <section className="rounded-xl border bg-muted/30 p-8 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
            Not sure which card is right for you?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Take our 2-minute quiz and get personalized recommendations based on
            your spending.
          </p>
          <Link
            href="/recommend"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Find Your Card
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
