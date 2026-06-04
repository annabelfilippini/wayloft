import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { TravelClient } from "@/components/travel/travel-client";
import { FlightDashboard } from "@/components/travel/flight-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCurrencies } from "@/lib/bonuses/utils";
import { getTravelGuide } from "@/lib/cards/sweet-spots";
import { getDefaultAppRoute, TRAVEL_ENABLED } from "@/lib/routes";
import type { TransferBonus, LoyaltyBalance, UpcomingFlight } from "@wayloft/shared";
import type { CurrencyTravelGuide } from "@/lib/cards/sweet-spots";

async function TravelContent({
  initialDestination,
  mode = "decision",
}: {
  initialDestination?: string;
  mode?: "decision" | "trips";
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

  if (mode === "trips") {
    return (
      <div id="trips" className="scroll-mt-20">
        <FlightDashboard flights={flights} />
      </div>
    );
  }

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
  if (!TRAVEL_ENABLED) redirect(getDefaultAppRoute());
  const { to } = await searchParams;

  return (
    <div className="bg-background">
      <div className="border-b bg-muted">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8">
          <Suspense fallback={<Skeleton className="h-44 w-full" />}>
            <TravelContent initialDestination={to} />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <TravelContent initialDestination={to} mode="trips" />
        </Suspense>
      </div>
    </div>
  );
}
