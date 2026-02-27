"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { Trophy, X, Info, Check, Plane, Building2, Lightbulb } from "lucide-react";
import type { ScoredCard, QuizInput } from "@/lib/recommend/types";
import { getWinner, computeTransferOverlap } from "@/lib/recommend/compare-utils";
import type { TransferPartnerInfo } from "@/lib/recommend/compare-utils";

interface ComparisonPanelProps {
  cards: ScoredCard[];
  quizInput: QuizInput;
  onClose: () => void;
}

function formatDollars(n: number): string {
  if (n >= 0) return `$${Math.round(n).toLocaleString()}`;
  return `-$${Math.round(Math.abs(n)).toLocaleString()}`;
}

function WinnerCell({
  isWinner,
  children,
  className = "",
}: {
  isWinner: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md px-3 py-2 ${
        isWinner
          ? "bg-emerald-50 dark:bg-emerald-950/30"
          : ""
      } ${className}`}
    >
      <div className="flex items-center gap-1">
        {isWinner && (
          <Trophy className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function ComparisonPanel({ cards, quizInput, onClose }: ComparisonPanelProps) {
  const totalMonthlySpend = useMemo(
    () => Object.values(quizInput.spending).reduce((s, v) => s + v, 0),
    [quizInput.spending]
  );

  const transferOverlap = useMemo(
    () => computeTransferOverlap(cards.map((c) => c.card.currency)),
    [cards]
  );

  const colCount = cards.length;

  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <h3 className="text-base font-bold">
          Comparing {cards.map((c) => c.card.name).join(" vs ")}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-0 divide-y">
        {/* Section 1: Value Summary */}
        <ValueSummary cards={cards} />

        {/* Section 2: Value Breakdown Grid */}
        <BreakdownGrid cards={cards} quizInput={quizInput} totalMonthlySpend={totalMonthlySpend} />

        {/* Section 3: Category Earnings */}
        <CategoryEarnings cards={cards} />

        {/* Section 4: Quick Features */}
        <QuickFeatures cards={cards} />

        {/* Section 5: Transfer Partners */}
        <TransferPartners cards={cards} overlap={transferOverlap} />
      </div>
    </div>
  );
}

// ─── Section 1: Value Summary ───

function ValueSummary({ cards }: { cards: ScoredCard[] }) {
  const firstYearWinner = getWinner(
    cards.map((c) => ({ slug: c.card.slug, value: c.breakdown.firstYearValue })),
    "highest"
  );

  const year2Winner = getWinner(
    cards.map((c) => ({ slug: c.card.slug, value: c.year2Value })),
    "highest"
  );

  // Divergent winner: first-year winner differs from year 2+ winner
  const hasDivergentWinner =
    firstYearWinner && year2Winner && firstYearWinner !== year2Winner;

  const firstYearWinnerCard = hasDivergentWinner
    ? cards.find((c) => c.card.slug === firstYearWinner)
    : null;
  const year2WinnerCard = hasDivergentWinner
    ? cards.find((c) => c.card.slug === year2Winner)
    : null;

  return (
    <div className="px-4 py-4 sm:px-6">
      <div className={`grid gap-4 ${cards.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {cards.map((c) => (
          <div key={c.card.slug} className="flex flex-col items-center text-center gap-2">
            <div className="w-24">
              <CardArtPlaceholder
                issuer={c.card.issuer}
                network={c.card.network}
                cardName={c.card.name}
              />
            </div>
            <div>
              <p className="text-sm font-semibold">{c.card.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {c.card.issuer.replace("_", " ")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-primary tabular-nums">
                {formatDollars(c.breakdown.firstYearValue)}
              </span>
              {firstYearWinner === c.card.slug && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px]">
                  Best Value
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">est. first-year value</span>
            <p className={`text-sm tabular-nums ${c.year2Value < 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {formatDollars(c.year2Value)}/yr after year 1
            </p>
          </div>
        ))}
      </div>

      {hasDivergentWinner && firstYearWinnerCard && year2WinnerCard && (
        <div className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            {firstYearWinnerCard.card.name} wins in year one, but{" "}
            {year2WinnerCard.card.name} earns more in year 2+{" "}
            ({formatDollars(year2WinnerCard.year2Value)}/yr vs{" "}
            {formatDollars(firstYearWinnerCard.year2Value)}/yr ongoing).
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Section 2: Value Breakdown Grid ───

interface BreakdownRow {
  label: string;
  values: { slug: string; value: number; display: string; subtext?: string }[];
  winMode: "highest" | "lowest";
}

function BreakdownGrid({
  cards,
  quizInput,
  totalMonthlySpend,
}: {
  cards: ScoredCard[];
  quizInput: QuizInput;
  totalMonthlySpend: number;
}) {
  const rows: BreakdownRow[] = useMemo(() => {
    const r: BreakdownRow[] = [];

    // Ongoing rewards
    r.push({
      label: "Ongoing rewards",
      values: cards.map((c) => ({
        slug: c.card.slug,
        value: c.breakdown.ongoing,
        display: formatDollars(c.breakdown.ongoing),
      })),
      winMode: "highest",
    });

    // Signup bonus
    r.push({
      label: "Signup bonus",
      values: cards.map((c) => ({
        slug: c.card.slug,
        value: c.breakdown.signupBonus,
        display: formatDollars(c.breakdown.signupBonus),
      })),
      winMode: "highest",
    });

    // Signup spend requirement
    r.push({
      label: "Spend requirement",
      values: cards.map((c) => {
        const sb = c.card.signup_bonus;
        if (!sb || sb.spend_requirement_cents === 0) {
          return { slug: c.card.slug, value: 0, display: "None" };
        }
        const reqDollars = sb.spend_requirement_cents / 100;
        const canHit = totalMonthlySpend * sb.timeframe_months >= reqDollars;
        return {
          slug: c.card.slug,
          value: reqDollars,
          display: `$${reqDollars.toLocaleString()} in ${sb.timeframe_months}mo`,
          subtext: canHit ? undefined : "may be hard to hit",
        };
      }),
      winMode: "lowest",
    });

    // Statement credits
    r.push({
      label: "Statement credits",
      values: cards.map((c) => ({
        slug: c.card.slug,
        value: c.breakdown.creditsOffset,
        display: formatDollars(c.breakdown.creditsOffset),
      })),
      winMode: "highest",
    });

    // Goal bonus
    r.push({
      label: "Goal alignment",
      values: cards.map((c) => ({
        slug: c.card.slug,
        value: c.breakdown.goalBonus,
        display:
          c.breakdown.goalBonus > 0
            ? `+${formatDollars(c.breakdown.goalBonus)}`
            : c.breakdown.goalBonus < 0
              ? formatDollars(c.breakdown.goalBonus)
              : "$0",
      })),
      winMode: "highest",
    });

    // Annual fee
    r.push({
      label: "Annual fee",
      values: cards.map((c) => ({
        slug: c.card.slug,
        value: c.breakdown.annualFee,
        display: c.breakdown.annualFee > 0 ? `-${formatDollars(c.breakdown.annualFee)}` : "$0",
      })),
      winMode: "lowest",
    });

    // Net first-year
    r.push({
      label: "Net first-year value",
      values: cards.map((c) => ({
        slug: c.card.slug,
        value: c.breakdown.firstYearValue,
        display: formatDollars(c.breakdown.firstYearValue),
      })),
      winMode: "highest",
    });

    // Year 2+ ongoing
    r.push({
      label: "Year 2+ ongoing",
      values: cards.map((c) => ({
        slug: c.card.slug,
        value: c.year2Value,
        display: `${formatDollars(c.year2Value)}/yr`,
      })),
      winMode: "highest",
    });

    return r;
  }, [cards, totalMonthlySpend]);

  const colClass =
    cards.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="px-4 py-4 sm:px-6 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Value Breakdown
      </p>

      {/* Column headers (card names) */}
      <div className={`grid gap-2 ${colClass}`}>
        {cards.map((c) => (
          <div key={c.card.slug} className="text-center">
            <p className="text-xs font-medium truncate">{c.card.name}</p>
          </div>
        ))}
      </div>

      {rows.map((row) => {
        const winner = getWinner(row.values, row.winMode);
        const isNetRow = row.label === "Net first-year value";
        const isYear2Row = row.label === "Year 2+ ongoing";
        const isSummaryRow = isNetRow || isYear2Row;

        return (
          <div key={row.label}>
            <p className={`text-xs text-muted-foreground mb-1 ${isNetRow ? "font-semibold text-foreground border-t pt-2" : ""} ${isYear2Row ? "font-semibold text-foreground" : ""}`}>
              {row.label}
            </p>
            <div className={`grid gap-2 ${colClass}`}>
              {row.values.map((v) => (
                <WinnerCell key={v.slug} isWinner={winner === v.slug}>
                  <span className={`text-sm tabular-nums ${isSummaryRow ? "font-bold text-primary" : "font-medium"} ${isYear2Row && v.value < 0 ? "text-destructive" : ""}`}>
                    {v.display}
                  </span>
                  {v.subtext && (
                    <p className="text-[10px] text-destructive/70 mt-0.5">{v.subtext}</p>
                  )}
                </WinnerCell>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section 3: Category Earnings ───

function CategoryEarnings({ cards }: { cards: ScoredCard[] }) {
  // Collect all categories where any card has spending > $0
  const allCategories = useMemo(() => {
    const catSet = new Map<string, string>(); // category key → displayName
    for (const card of cards) {
      for (const e of card.allEarnings) {
        if (!catSet.has(e.category)) {
          catSet.set(e.category, e.displayName);
        }
      }
    }
    return [...catSet.entries()];
  }, [cards]);

  if (allCategories.length === 0) return null;

  const colClass = cards.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="px-4 py-4 sm:px-6 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Category Earnings (Your Spending)
      </p>

      {/* Column headers */}
      <div className={`grid gap-2 ${colClass}`}>
        {cards.map((c) => (
          <div key={c.card.slug} className="text-center">
            <p className="text-xs font-medium truncate">{c.card.name}</p>
          </div>
        ))}
      </div>

      {allCategories.map(([catKey, displayName]) => {
        const values = cards.map((c) => {
          const earning = c.allEarnings.find((e) => e.category === catKey);
          return {
            slug: c.card.slug,
            value: earning?.annualValue ?? 0,
            multiplier: earning?.multiplier ?? 0,
            monthlySpend: earning?.monthlySpend ?? 0,
          };
        });

        const winner = getWinner(
          values.map((v) => ({ slug: v.slug, value: v.value })),
          "highest"
        );

        return (
          <div key={catKey}>
            <p className="text-xs text-muted-foreground mb-1">{displayName}</p>
            <div className={`grid gap-2 ${colClass}`}>
              {values.map((v) => (
                <WinnerCell key={v.slug} isWinner={winner === v.slug}>
                  <span className="text-sm font-medium tabular-nums">
                    {v.multiplier}x = {formatDollars(v.value)}/yr
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    on your ${v.monthlySpend.toLocaleString()}/mo
                  </p>
                </WinnerCell>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section 4: Quick Features ───

function QuickFeatures({ cards }: { cards: ScoredCard[] }) {
  const colClass = cards.length === 3 ? "grid-cols-3" : "grid-cols-2";

  // Foreign transaction fee
  const ftfWinner = getWinner(
    cards.map((c) => ({
      slug: c.card.slug,
      value: c.card.foreign_transaction_fee ? 1 : 0,
    })),
    "lowest"
  );

  // Portal CPP
  const portalWinner = getWinner(
    cards.map((c) => ({ slug: c.card.slug, value: c.card.portal_cpp })),
    "highest"
  );

  // Credit score
  const scoreRank: Record<string, number> = {
    poor: 1,
    fair: 2,
    good: 3,
    excellent: 4,
  };
  const scoreWinner = getWinner(
    cards.map((c) => ({
      slug: c.card.slug,
      value: scoreRank[c.card.credit_score_min] ?? 3,
    })),
    "lowest"
  );

  const features = [
    {
      label: "Foreign transaction fee",
      values: cards.map((c) => ({
        slug: c.card.slug,
        winner: ftfWinner === c.card.slug,
        content: c.card.foreign_transaction_fee ? (
          <span className="text-destructive/70 text-sm">3% fee</span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" /> No FTF
          </span>
        ),
      })),
    },
    {
      label: "Portal CPP",
      values: cards.map((c) => ({
        slug: c.card.slug,
        winner: portalWinner === c.card.slug,
        content: (
          <span className="text-sm font-medium tabular-nums">
            {c.card.portal_cpp}¢ per point
          </span>
        ),
      })),
    },
    {
      label: "Credit score minimum",
      values: cards.map((c) => ({
        slug: c.card.slug,
        winner: scoreWinner === c.card.slug,
        content: (
          <span className="text-sm capitalize">{c.card.credit_score_min}</span>
        ),
      })),
    },
  ];

  return (
    <div className="px-4 py-4 sm:px-6 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Quick Features
      </p>

      {/* Column headers */}
      <div className={`grid gap-2 ${colClass}`}>
        {cards.map((c) => (
          <div key={c.card.slug} className="text-center">
            <p className="text-xs font-medium truncate">{c.card.name}</p>
          </div>
        ))}
      </div>

      {features.map((feat) => (
        <div key={feat.label}>
          <p className="text-xs text-muted-foreground mb-1">{feat.label}</p>
          <div className={`grid gap-2 ${colClass}`}>
            {feat.values.map((v) => (
              <WinnerCell key={v.slug} isWinner={v.winner}>
                {v.content}
              </WinnerCell>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section 5: Transfer Partners ───

function TransferPartners({
  cards,
  overlap,
}: {
  cards: ScoredCard[];
  overlap: ReturnType<typeof computeTransferOverlap>;
}) {
  if (overlap.sameCurrency) {
    return (
      <div className="px-4 py-4 sm:px-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Transfer Partners
        </p>
        <div className="flex items-start gap-2 rounded-md bg-blue-50 dark:bg-blue-950/40 px-3 py-2.5 text-sm text-blue-800 dark:text-blue-200">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Both cards earn <strong>{overlap.currencyName}</strong> — same transfer partners.
          </span>
        </div>
      </div>
    );
  }

  const currencies = [...new Set(cards.map((c) => c.card.currency))];

  return (
    <div className="px-4 py-4 sm:px-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Transfer Partners
      </p>

      <div className="overflow-x-auto">
        <div className={`grid gap-3 min-w-[400px] ${currencies.length === 2 ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-3"}`}>
          {/* Column headers */}
          {currencies.length === 2 ? (
            <>
              <div className="text-center">
                <p className="text-xs font-semibold capitalize">
                  Only {currencies[0]}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold">Shared</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold capitalize">
                  Only {currencies[1]}
                </p>
              </div>
            </>
          ) : (
            currencies.map((c) => (
              <div key={c} className="text-center">
                <p className="text-xs font-semibold capitalize">{c}</p>
              </div>
            ))
          )}

          {/* Partner lists */}
          {currencies.length === 2 ? (
            <>
              <PartnerList partners={overlap.unique[currencies[0]] ?? []} />
              <PartnerList partners={overlap.shared} />
              <PartnerList partners={overlap.unique[currencies[1]] ?? []} />
            </>
          ) : (
            currencies.map((c) => (
              <PartnerList key={c} partners={overlap.unique[c] ?? []} />
            ))
          )}
        </div>
      </div>

      {currencies.length !== 2 && overlap.shared.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold mb-1">Shared Partners</p>
          <PartnerList partners={overlap.shared} />
        </div>
      )}
    </div>
  );
}

function PartnerList({ partners }: { partners: TransferPartnerInfo[] }) {
  if (partners.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic px-2">None</div>
    );
  }

  return (
    <div className="space-y-1 px-1">
      {partners.map((p) => (
        <div key={p.code} className="flex items-center gap-1.5 text-xs">
          {p.type === "airline" ? (
            <Plane className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{p.partner}</span>
          {p.alliance && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {p.alliance}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
