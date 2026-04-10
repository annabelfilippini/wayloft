import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { TravelClient } from "@/components/travel/travel-client";
import { FlightDashboard } from "@/components/travel/flight-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCurrencies } from "@/lib/bonuses/utils";
import { getTravelGuide } from "@/lib/cards/sweet-spots";
import type { TransferBonus, LoyaltyBalance, UpcomingFlight } from "@wayloft/shared";
import type { CurrencyTravelGuide } from "@/lib/cards/sweet-spots";

const TRAVEL_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TRAVEL === "true";

async function TravelContent({
  initialDestination,
}: {
  initialDestination?: string;
}) {
  const user = await requireUser();
  const supabase = await createClient();

  const [cardsRes, balancesRes, bonusesRes, flightsRes] = await Promise.all([
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
    supabase
      .from("upcoming_flights")
      .select("id, user_id, airline, confirmation_number, origin, destination, departure_at, arrival_at, return_departure_at, return_arrival_at, passenger_name, booking_type, miles_paid, cash_paid_cents, points_program, cabin_class, seat_preference, preferred_seat_number, checkin_opens_at, checkin_completed_at, boarding_position, current_award_price, lowest_seen_price, price_last_checked_at, notes, created_at, updated_at, checkin_opens_at_computed, hours_until_checkin, hours_until_departure, flight_status")
      .eq("user_id", user.id)
      .order("departure_at", { ascending: true }),
  ]);

  const userCards = cardsRes.data ?? [];
  const balances = (balancesRes.data ?? []) as Pick<
    LoyaltyBalance,
    "program_code" | "balance" | "currency"
  >[];
  const allBonuses = (bonusesRes.data ?? []) as TransferBonus[];
  const flights = (flightsRes.data ?? []) as UpcomingFlight[];

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
    <>
      <FlightDashboard flights={flights} />

      <div className="mt-8">
        <TravelClient
          sweetSpots={sweetSpots}
          userCurrencies={userCurrencies}
          myBonuses={myBonuses}
          allBonuses={allBonuses}
          balances={balances}
          initialDestination={initialDestination}
        />
      </div>
    </>
  );
}

export default async function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  if (!TRAVEL_ENABLED) redirect("/dashboard");
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
