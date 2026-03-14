import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap } from "lucide-react";
import { BANK_DISPLAY_NAMES, enrichBonusWithBalance } from "@/lib/bonuses/utils";
import { getAllCppValuations } from "@/lib/cards/valuations";
import type { TransferBonus, LoyaltyBalance } from "@wayloft/shared";

interface BonusSpotlightProps {
  userId: string;
}

function urgencyBadge(daysRemaining: number) {
  if (daysRemaining <= 2) {
    return { label: `${daysRemaining}d left`, className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900" };
  }
  if (daysRemaining <= 7) {
    return { label: `${daysRemaining}d left`, className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 border-orange-200 dark:border-orange-900" };
  }
  return { label: `${daysRemaining}d left`, className: "bg-muted text-muted-foreground" };
}

function estimateDollarValue(
  bonus: TransferBonus,
  balances: Pick<LoyaltyBalance, "program_code" | "balance" | "currency">[],
  valuations: Record<string, { cpp: number }>
): string | null {
  const balance = balances.find((b) => b.currency === bonus.currency);
  if (!balance || balance.balance <= 0) return null;

  const bonusPoints = Math.round(balance.balance * (bonus.bonus_percentage / 100));
  const partnerValuation = valuations[bonus.partner_code];
  if (!partnerValuation) return null;

  const dollarValue = Math.round((bonusPoints * partnerValuation.cpp) / 100);
  if (dollarValue < 1) return null;

  return `+$${dollarValue.toLocaleString()} extra value`;
}

export async function BonusSpotlight({ userId }: BonusSpotlightProps) {
  const supabase = await createClient();

  const [bonusesRes, balancesRes, userCardsRes] = await Promise.all([
    supabase
      .from("transfer_bonuses")
      .select("*")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("end_date", { ascending: true }),
    supabase
      .from("loyalty_balances")
      .select("program_code, balance, currency")
      .eq("user_id", userId),
    supabase
      .from("user_cards")
      .select("currency")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  const allBonuses = (bonusesRes.data ?? []) as TransferBonus[];
  const balances = (balancesRes.data ?? []) as Pick<LoyaltyBalance, "program_code" | "balance" | "currency">[];
  const userCurrencies = new Set(
    (userCardsRes.data ?? []).map((c: { currency: string }) => c.currency)
  );
  const valuations = getAllCppValuations();

  // Prioritize user's currencies, then show all
  const myBonuses = allBonuses.filter((b) => userCurrencies.has(b.currency));
  const otherBonuses = allBonuses.filter((b) => !userCurrencies.has(b.currency));
  const sorted = [...myBonuses, ...otherBonuses];
  const display = sorted.slice(0, 6);
  const totalCount = allBonuses.length;

  // Empty state
  if (display.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center">
        <Zap className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          No active transfer bonuses right now
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Banks typically run promotions every few weeks. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Transfer Bonuses</h2>
        {totalCount > 6 && (
          <Link
            href="/bonuses"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all {totalCount}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {display.map((bonus) => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const end = new Date(bonus.end_date + "T00:00:00");
          const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
          const badge = urgencyBadge(daysRemaining);
          const bankName = BANK_DISPLAY_NAMES[bonus.bank] ?? bonus.bank;
          const isMyBonus = userCurrencies.has(bonus.currency);
          const conversion = isMyBonus
            ? enrichBonusWithBalance(bonus, balances)
            : null;
          const dollarEst = isMyBonus
            ? estimateDollarValue(bonus, balances, valuations)
            : null;

          return (
            <Link
              key={bonus.id}
              href="/bonuses"
              className="group flex-none"
            >
              <Card className={`w-56 transition-colors group-hover:bg-muted/50 ${isMyBonus ? "ring-1 ring-primary/20" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">
                      {bankName} → {bonus.partner}
                    </p>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${badge.className}`}>
                      {badge.label}
                    </Badge>
                  </div>

                  <p className="mt-2 text-2xl font-bold text-primary">
                    +{bonus.bonus_percentage}%
                  </p>

                  {conversion ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {conversion}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      100K → {(100000 * (1 + bonus.bonus_percentage / 100)).toLocaleString()} pts
                    </p>
                  )}

                  {dollarEst && (
                    <p className="mt-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                      {dollarEst}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
