import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCppValuations } from "@/lib/cards/valuations";
import { Card, CardContent } from "@/components/ui/card";
import type { LoyaltyBalance, UserCard } from "@wayloft/shared";

interface TopStatsProps {
  userId: string;
}

export async function TopStats({ userId }: TopStatsProps) {
  const supabase = await createClient();

  const [balancesRes, actionsRes, creditsRes, bonusesRes, userCardsRes] = await Promise.all([
    supabase
      .from("loyalty_balances")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("balance", { ascending: false }),
    supabase.from("upcoming_card_actions").select("*").eq("user_id", userId),
    supabase
      .from("expiring_credits")
      .select("*")
      .eq("user_id", userId)
      .order("days_until_expiration", { ascending: true })
      .limit(1),
    supabase
      .from("active_transfer_bonuses_ending_soon")
      .select("*")
      .order("days_remaining", { ascending: true })
      .limit(1),
    supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null),
  ]);

  // ── Card A: Total Points Value ──
  const balances = (balancesRes.data ?? []) as LoyaltyBalance[];
  const valuations = getAllCppValuations();
  let totalValue = 0;
  const topCurrencies: { label: string; balance: number }[] = [];

  for (const b of balances) {
    const v = valuations[b.program_code];
    if (v) totalValue += (b.balance * v.cpp) / 100;
    topCurrencies.push({ label: `${Math.round(b.balance / 1000)}K ${b.currency}`, balance: b.balance });
  }
  topCurrencies.sort((a, b) => b.balance - a.balance);
  const topLabel = topCurrencies.slice(0, 3).map((c) => c.label).join(" · ");

  // ── Card B: Next Deadline ──
  interface Deadline {
    label: string;
    days: number;
    href: string;
  }
  const deadlines: Deadline[] = [];

  // Card actions (signup spend deadlines, AF)
  for (const row of actionsRes.data ?? []) {
    if (row.signup_action) {
      const sa = row.signup_action as { days_remaining?: number };
      if (sa.days_remaining != null) {
        deadlines.push({
          label: `${row.card_name} spend deadline`,
          days: sa.days_remaining,
          href: `/cards/${row.user_card_id}`,
        });
      }
    }
  }

  // Expiring credits
  for (const ec of creditsRes.data ?? []) {
    deadlines.push({
      label: `${ec.credit_name} expires`,
      days: ec.days_until_expiration,
      href: `/cards/${ec.user_card_id}`,
    });
  }

  // Transfer bonuses ending soon
  for (const tb of bonusesRes.data ?? []) {
    deadlines.push({
      label: `${tb.bank} → ${tb.partner} bonus ends`,
      days: tb.days_remaining,
      href: "/bonuses",
    });
  }

  deadlines.sort((a, b) => a.days - b.days);
  const nextDeadline = deadlines[0] ?? null;

  function deadlineColor(days: number): string {
    if (days <= 3) return "text-red-600 dark:text-red-400";
    if (days <= 7) return "text-orange-600 dark:text-orange-400";
    return "";
  }

  // ── Card C: Active Bonuses ──
  const userCards = (userCardsRes.data ?? []) as UserCard[];
  const activeBonusCards = userCards.filter(
    (c) =>
      c.signup_spend_requirement_cents != null &&
      c.signup_spend_requirement_cents > 0 &&
      !c.signup_bonus_met
  );
  const activeBonusCount = activeBonusCards.length;
  const totalBonusPoints = activeBonusCards.reduce(
    (sum, c) => sum + (c.signup_bonus_points ?? 0),
    0
  );

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Card A */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Points Value</p>
          {balances.length > 0 ? (
            <>
              <p className="text-2xl font-bold">
                ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              {topLabel && (
                <p className="truncate text-xs text-muted-foreground">{topLabel}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-2xl font-bold">$0</p>
              <Link
                href="/dashboard#balances"
                className="text-xs text-primary hover:underline"
              >
                Add your balances
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card B */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Next Deadline</p>
          {nextDeadline ? (
            <Link href={nextDeadline.href} className="group block">
              <p className={`text-2xl font-bold ${deadlineColor(nextDeadline.days)}`}>
                {nextDeadline.days}d
              </p>
              <p className="truncate text-xs text-muted-foreground group-hover:text-foreground">
                {nextDeadline.label}
              </p>
            </Link>
          ) : (
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              All clear
            </p>
          )}
        </CardContent>
      </Card>

      {/* Card C */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Active Bonuses</p>
          {activeBonusCount > 0 ? (
            <>
              <p className="text-2xl font-bold">{activeBonusCount}</p>
              <p className="text-xs text-muted-foreground">
                {totalBonusPoints.toLocaleString()} pts at stake
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold">0</p>
              <Link
                href="/recommend"
                className="text-xs text-primary hover:underline"
              >
                Find a new card
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
