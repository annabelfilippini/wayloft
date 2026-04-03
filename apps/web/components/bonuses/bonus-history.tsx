"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import type { TransferBonusHistory, BonusPattern } from "@wayloft/shared";
import { BANK_DISPLAY_NAMES, formatBonusDate } from "@/lib/bonuses/utils";

interface BonusHistoryProps {
  history: TransferBonusHistory[];
  patterns: BonusPattern[];
}

function PatternCardWithHistory({
  pattern,
  history,
}: {
  pattern: BonusPattern;
  history: TransferBonusHistory[];
}) {
  const [expanded, setExpanded] = useState(false);
  const bankName = BANK_DISPLAY_NAMES[pattern.bank] ?? pattern.bank;

  const matchingHistory = useMemo(
    () =>
      history
        .filter(
          (h) => h.bank === pattern.bank && h.partner_code === pattern.partnerCode
        )
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        ),
    [history, pattern.bank, pattern.partnerCode]
  );

  const isOverdue =
    pattern.daysSinceLastSeen > pattern.avgFrequencyDays * 1.3 &&
    pattern.daysSinceLastSeen > 30;

  return (
    <Card className="transition-colors hover:border-muted-foreground/30">
      <CardContent className="pt-5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {bankName} → {pattern.partner}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {pattern.frequencyLabel}
              </Badge>
              <span className="text-sm font-medium">
                {pattern.minBonusPercentage === pattern.maxBonusPercentage
                  ? `+${pattern.avgBonusPercentage}%`
                  : `+${pattern.minBonusPercentage}-${pattern.maxBonusPercentage}%`}
              </span>
              <span className="text-xs text-muted-foreground">typical</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Last seen {formatBonusDate(pattern.lastSeen)}
              </span>
              {isOverdue && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-amber-100 text-amber-800"
                >
                  Overdue
                </Badge>
              )}
            </div>
            {pattern.confidenceNote && (
              <p className="mt-1.5 flex items-center gap-1 text-xs italic text-muted-foreground">
                <Info className="h-3 w-3 shrink-0" />
                {pattern.confidenceNote}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="text-right">
              <p className="text-lg font-bold">{pattern.occurrences}</p>
              <p className="text-xs text-muted-foreground">times</p>
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {expanded && matchingHistory.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Past bonuses
            </p>
            <div className="space-y-1.5">
              {matchingHistory.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {formatBonusDate(h.start_date)} —{" "}
                    {formatBonusDate(h.end_date)}
                  </span>
                  <span className="font-medium">+{h.bonus_percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type BankFilter = "all" | string;

export function BonusHistory({ history, patterns }: BonusHistoryProps) {
  const [bankFilter, setBankFilter] = useState<BankFilter>("all");

  // Get unique banks from patterns
  const banks = useMemo(() => {
    const set = new Set(patterns.map((p) => p.bank));
    return Array.from(set).sort();
  }, [patterns]);

  const filtered = useMemo(() => {
    if (bankFilter === "all") return patterns;
    return patterns.filter((p) => p.bank === bankFilter);
  }, [patterns, bankFilter]);

  if (patterns.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border py-16 text-center">
        <TrendingUp className="h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">No History Yet</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Transfer bonus history will accumulate as we track promotions over
          time. Check back later for pattern analysis.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Bank filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-muted-foreground">
          Bank:
        </span>
        <button
          onClick={() => setBankFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            bankFilter === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        {banks.map((bank) => (
          <button
            key={bank}
            onClick={() => setBankFilter(bank)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              bankFilter === bank
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {BANK_DISPLAY_NAMES[bank] ?? bank}
          </button>
        ))}
      </div>

      {/* Pattern cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((pattern) => (
          <PatternCardWithHistory
            key={`${pattern.bank}::${pattern.partnerCode}`}
            pattern={pattern}
            history={history}
          />
        ))}
      </div>
    </div>
  );
}
