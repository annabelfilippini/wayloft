import { createClient } from "@/lib/supabase/server";
import { searchFlights, type FlightSearchParams } from "@/lib/flights/search";
import { enrichFlights } from "@/lib/flights/enrich";

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate request
  let params: FlightSearchParams;
  try {
    const body = await request.json();
    params = {
      origin: String(body.origin).toUpperCase().trim(),
      destination: String(body.destination).toUpperCase().trim(),
      departureDate: String(body.departureDate),
      returnDate: body.returnDate ? String(body.returnDate) : undefined,
      passengers: Math.min(Math.max(Number(body.passengers) || 1, 1), 9),
      cabinClass: ["economy", "premium_economy", "business", "first"].includes(
        body.cabinClass
      )
        ? body.cabinClass
        : "economy",
    };
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (
    !params.origin ||
    !params.destination ||
    !params.departureDate ||
    params.origin.length !== 3 ||
    params.destination.length !== 3
  ) {
    return Response.json(
      { error: "Origin, destination (IATA codes), and departure date required" },
      { status: 400 }
    );
  }

  // Get user's cards for portfolio enrichment
  const { data: userCards } = await supabase
    .from("user_cards")
    .select("card_slug")
    .eq("user_id", user.id)
    .eq("status", "active");

  const slugs = (userCards ?? []).map(
    (c: { card_slug: string }) => c.card_slug
  );

  try {
    const offers = await searchFlights(params);
    const enriched = enrichFlights(offers, slugs);

    return Response.json({
      offers: enriched,
      searchParams: params,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Flight search failed";
    console.error("Flight search error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
