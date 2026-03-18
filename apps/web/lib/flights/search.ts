import { Duffel } from "@duffel/api";
import type { FlightOffer } from "./types";

export type { FlightOffer };

let _duffel: Duffel | null = null;

function getDuffel(): Duffel {
  if (!_duffel) {
    if (!process.env.DUFFEL_API_KEY) {
      throw new Error("DUFFEL_API_KEY is not set");
    }
    _duffel = new Duffel({ token: process.env.DUFFEL_API_KEY });
  }
  return _duffel;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
}

function formatDuration(isoOrMinutes: string): string {
  // Duffel returns ISO 8601 duration like "PT5H30M"
  const match = isoOrMinutes.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    return `${hours}h ${minutes}m`;
  }
  return isoOrMinutes;
}

export async function searchFlights(
  params: FlightSearchParams
): Promise<FlightOffer[]> {
  const slices = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
      arrival_time: null,
      departure_time: null,
    },
  ];

  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
      arrival_time: null,
      departure_time: null,
    });
  }

  const passengers: Array<{ type: "adult" }> = Array.from(
    { length: params.passengers },
    () => ({ type: "adult" as const })
  );

  const duffel = getDuffel();

  const offerRequest = await duffel.offerRequests.create({
    slices,
    passengers,
    cabin_class: params.cabinClass,
    return_offers: true,
  });

  const offers = offerRequest.data.offers ?? [];

  return offers.slice(0, 20).map((offer) => ({
    id: offer.id,
    totalAmount: offer.total_amount,
    totalCurrency: offer.total_currency,
    cabinClass: params.cabinClass,
    baggageIncluded: offer.slices.some((slice) =>
      slice.segments.some(
        (seg) =>
          seg.passengers?.[0]?.baggages?.some(
            (b) => b.type === "checked" && b.quantity > 0
          ) ?? false
      )
    ),
    slices: offer.slices.map((slice) => ({
      origin: slice.origin.iata_code ?? "",
      destination: slice.destination.iata_code ?? "",
      departureTime: slice.segments[0].departing_at,
      arrivalTime:
        slice.segments[slice.segments.length - 1].arriving_at,
      duration: formatDuration(slice.duration ?? ""),
      stops: slice.segments.length - 1,
      airline: slice.segments[0].marketing_carrier?.iata_code ?? "",
      airlineName: slice.segments[0].marketing_carrier?.name ?? "Unknown",
      flightNumbers: slice.segments.map(
        (seg) =>
          `${seg.marketing_carrier?.iata_code ?? ""}${seg.marketing_carrier_flight_number}`
      ),
      operatingCarriers: [
        ...new Set(
          slice.segments.map(
            (seg) => seg.operating_carrier?.name ?? seg.marketing_carrier?.name ?? ""
          )
        ),
      ],
    })),
  }));
}
