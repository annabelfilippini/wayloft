"use client";

import { useState, useMemo, useCallback } from "react";
import type { TransferBonus, LoyaltyBalance } from "@wayloft/shared";
import { BonusCard } from "./bonus-card";
import { enrichBonusWithBalance, getDaysRemaining } from "@/lib/bonuses/utils";

type BankFilter = "all" | "chase" | "amex" | "citi" | "capital_one" | "bilt";
type PartnerTypeFilter = "all" | "airline" | "hotel";
type SortMode = "ending_soonest" | "highest_bonus";

interface BonusFiltersProps {
  bonuses: TransferBonus[];
  balances: Pick<LoyaltyBalance, "program_code" | "balance" | "currency">[];
}

const BANK_OPTIONS: { value: BankFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chase", label: "Chase" },
  { value: "amex", label: "Amex" },
  { value: "citi", label: "Citi" },
  { value: "capital_one", label: "Capital One" },
  { value: "bilt", label: "Bilt" },
];

const PARTNER_TYPE_OPTIONS: { value: PartnerTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "airline", label: "Airlines" },
  { value: "hotel", label: "Hotels" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "ending_soonest", label: "Ending Soonest" },
  { value: "highest_bonus", label: "Highest Bonus" },
];

export function BonusFilters({ bonuses, balances }: BonusFiltersProps) {
  const [bankFilter, setBankFilter] = useState<BankFilter>("all");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<PartnerTypeFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("ending_soonest");

  const handleBankFilter = useCallback((v: BankFilter) => setBankFilter(v), []);
  const handlePartnerTypeFilter = useCallback((v: PartnerTypeFilter) => setPartnerTypeFilter(v), []);
  const handleSortMode = useCallback((v: SortMode) => setSortMode(v), []);

  const filtered = useMemo(() => {
    let result = [...bonuses];

    if (bankFilter !== "all") {
      result = result.filter((b) => b.bank === bankFilter);
    }

    if (partnerTypeFilter !== "all") {
      result = result.filter((b) => b.partner_type === partnerTypeFilter);
    }

    result.sort((a, b) => {
      if (sortMode === "highest_bonus") {
        return b.bonus_percentage - a.bonus_percentage;
      }
      // ending_soonest
      const aDays = getDaysRemaining(a.end_date) ?? 999;
      const bDays = getDaysRemaining(b.end_date) ?? 999;
      return aDays - bDays;
    });

    return result;
  }, [bonuses, bankFilter, partnerTypeFilter, sortMode]);

  return (
    <div>
      {/* Filter controls */}
      <div className="space-y-3">
        {/* Bank pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Bank:</span>
          {BANK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleBankFilter(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                bankFilter === opt.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Partner type + sort */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Type:</span>
            {PARTNER_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handlePartnerTypeFilter(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  partnerTypeFilter === opt.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortMode(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  sortMode === opt.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No bonuses match your filters.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bonus) => (
            <BonusCard
              key={bonus.id}
              bonus={bonus}
              personalization={enrichBonusWithBalance(bonus, balances)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
