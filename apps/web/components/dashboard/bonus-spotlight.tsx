import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Info, Zap } from "lucide-react";
import { BANK_DISPLAY_NAMES } from "@/lib/bonuses/utils";
import { getAllCppValuations } from "@/lib/cards/valuations";
import { isBeginnerOrBelow } from "@/lib/experience";
import type { TransferBonus, LoyaltyBalance, ExperienceLevel } from "@wayloft/shared";

interface BonusSpotlightProps {
  userId: string;
  experienceLevel?: ExperienceLevel | null;
}

/** Shorten loyalty program names to just the brand */
const SHORT_PARTNER_NAMES: Record<string, string> = {
  "United MileagePlus": "United",
  "Southwest Rapid Rewards": "Southwest",
  "British Airways Avios": "British Airways",
  "Air Canada Aeroplan": "Air Canada",
  "Singapore KrisFlyer": "Singapore Airlines",
  "Emirates Skywards": "Emirates",
  "Air France/KLM Flying Blue": "Air France/KLM",
  "Iberia Avios": "Iberia",
  "Virgin Atlantic Flying Club": "Virgin Atlantic",
  "JetBlue TrueBlue": "JetBlue",
  "Delta SkyMiles": "Delta",
  "ANA Mileage Club": "ANA",
  "Cathay Pacific Asia Miles": "Cathay Pacific",
  "Qantas Frequent Flyer": "Qantas",
  "Avianca LifeMiles": "Avianca",
  "Aer Lingus AerClub": "Aer Lingus",
  "Etihad Guest": "Etihad",
  "Hawaiian Airlines HawaiianMiles": "Hawaiian Airlines",
  "Turkish Miles&Smiles": "Turkish Airlines",
  "Alaska Airlines Mileage Plan": "Alaska Airlines",
  "American Airlines AAdvantage": "American Airlines",
  "Qatar Airways Privilege Club": "Qatar Airways",
  "Finnair Plus": "Finnair",
  "TAP Miles&Go": "TAP Portugal",
  "World of Hyatt": "Hyatt",
  "IHG One Rewards": "IHG",
  "Marriott Bonvoy": "Marriott",
  "Hilton Honors": "Hilton",
  "Choice Privileges": "Choice Hotels",
  "Wyndham Rewards": "Wyndham",
  "Accor Live Limitless": "Accor",
};

function shortPartnerName(fullName: string): string {
  return SHORT_PARTNER_NAMES[fullName] ?? fullName;
}

/** "airline" → "miles", "hotel" → "points" */
function partnerUnit(type: "airline" | "hotel"): string {
  return type === "airline" ? "miles" : "points";
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

/** Format numbers compactly: 10000 → "10K", 130000 → "130K", 8500 → "8.5K" */
function formatCompact(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toLocaleString();
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

export async function BonusSpotlight({ userId, experienceLevel }: BonusSpotlightProps) {
  const isBeginner = isBeginnerOrBelow(experienceLevel);
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
        <p className="mt-1 text-sm text-muted-foreground">
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
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all {totalCount}
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Limited-time bonus rates when you move points to airlines &amp; hotels
      </p>

      {isBeginner && (
        <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Your credit card points can be transferred to airline and hotel loyalty programs.
            During a bonus, you get extra miles — like a sale on your rewards.
          </span>
        </div>
      )}

      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {display.map((bonus) => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const end = new Date(bonus.end_date + "T00:00:00");
          const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
          const badge = urgencyBadge(daysRemaining);
          const bankName = BANK_DISPLAY_NAMES[bonus.bank] ?? bonus.bank;
          const partner = shortPartnerName(bonus.partner);
          const unit = partnerUnit(bonus.partner_type);
          const isMyBonus = userCurrencies.has(bonus.currency);
          const dollarEst = isMyBonus
            ? estimateDollarValue(bonus, balances, valuations)
            : null;

          // Personalized conversion for users who have a balance in this currency
          const balance = isMyBonus
            ? balances.find((b) => b.currency === bonus.currency)
            : null;
          const hasBalance = balance && balance.balance > 0;

          // Format conversion math
          let conversionLine: string;
          if (hasBalance) {
            const base = balance.balance;
            const result = Math.round(base * (1 + bonus.bonus_percentage / 100));
            conversionLine = `Your ${formatCompact(base)} pts → ${formatCompact(result)} ${unit}`;
          } else {
            const base = 10000;
            const result = Math.round(base * (1 + bonus.bonus_percentage / 100));
            conversionLine = `e.g. ${formatCompact(base)} pts → ${formatCompact(result)} ${unit}`;
          }

          return (
            <Link
              key={bonus.id}
              href="/bonuses"
              className="group flex-none"
            >
              <Card className={`w-56 transition-colors group-hover:bg-muted/50 ${isMyBonus ? "ring-1 ring-primary/20" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${badge.className}`}>
                      {badge.label}
                    </Badge>
                  </div>

                  <p className="mt-1.5 text-sm font-semibold leading-tight">
                    {bankName} → {partner}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-primary">
                    +{bonus.bonus_percentage}%
                    <span className="ml-1 text-sm font-medium text-primary/70">
                      bonus {unit}
                    </span>
                  </p>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {conversionLine}
                  </p>

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
