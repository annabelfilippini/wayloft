import { Suspense } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { TravelClient } from "@/components/travel/travel-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCurrencies } from "@/lib/bonuses/utils";
import { getTravelGuide } from "@/lib/cards/sweet-spots";
import type { TransferBonus, LoyaltyBalance } from "@wayloft/shared";
import type { CurrencyTravelGuide } from "@/lib/cards/sweet-spots";

async function TravelContent({
  initialDestination,
}: {
  initialDestination?: string;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const [cardsRes, balancesRes, bonusesRes] = await Promise.all([
    supabase
      .from("user_cards")
      .select("currency")
      .eq("user_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("loyalty_balances")
      .select("program_code, balance, currency")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("transfer_bonuses")
      .select("id, bank, currency, partner, partner_code, partner_type, bonus_percentage, start_date, end_date, source_url, is_active, scraped_at")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("end_date", { ascending: true }),
  ]);

  const userCards = cardsRes.data ?? [];
  const balances = (balancesRes.data ?? []) as Pick<
    LoyaltyBalance,
    "program_code" | "balance" | "currency"
  >[];
  const allBonuses = (bonusesRes.data ?? []) as TransferBonus[];

  const userCurrencies = getUserCurrencies(
    userCards as { currency: string }[]
  );

  // Build sweet spots for user's currencies
  const sweetSpots: Record<string, CurrencyTravelGuide> = {};
  for (const currency of userCurrencies) {
    const guide = getTravelGuide(currency);
    if (guide) sweetSpots[currency] = guide;
  }

  // Split bonuses: user's first, sorted by urgency
  const myBonuses = allBonuses.filter((b) =>
    userCurrencies.includes(b.currency)
  );

  return (
    <TravelClient
      sweetSpots={sweetSpots}
      userCurrencies={userCurrencies}
      myBonuses={myBonuses}
      allBonuses={allBonuses}
      balances={balances}
      initialDestination={initialDestination}
    />
  );
}

export default async function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const { to } = await searchParams;

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-8">
      <h1 className="text-lg font-semibold tracking-[-0.01em]">Travel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search flights and maximize your transfer bonuses.
      </p>

      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <TravelContent initialDestination={to} />
        </Suspense>
      </div>
    </div>
  );
}
