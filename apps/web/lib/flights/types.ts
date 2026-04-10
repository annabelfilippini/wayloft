export interface FlightSlice {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  airline: string;
  airlineName: string;
  flightNumbers: string[];
  operatingCarriers: string[];
}

export interface FlightOffer {
  id: string;
  totalAmount: string;
  totalCurrency: string;
  slices: FlightSlice[];
  cabinClass: string;
  baggageIncluded: boolean;
}

export interface CardRecommendation {
  cardName: string;
  cardSlug: string;
  issuer: string;
  currency: string;
  multiplier: number;
  cpp: number;
  effectiveCents: number;
  pointsEarned: number;
  pointsValue: number;
  portalCpp: number | null;
  portalPointsCost: number | null;
  hasForeignTransactionFee: boolean;
}

export interface EnrichedFlight extends FlightOffer {
  cardRecommendations: CardRecommendation[];
  bestPortalOption: {
    cardName: string;
    currency: string;
    pointsCost: number;
    portalCpp: number;
  } | null;
}

// ---------- Seats.aero award availability ----------

export type AwardCabin = "Y" | "W" | "J" | "F";

export interface AwardSearchParams {
  origin: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  onlyDirect?: boolean;
  cabins?: AwardCabin[];
  sources?: string[];
  take?: number;
  cursor?: number;
}

export interface AwardRoute {
  id: string;
  originAirport: string;
  originRegion: string;
  destinationAirport: string;
  destinationRegion: string;
  distance: number;
  source: string;
}

export interface AwardCabinOption {
  cabin: AwardCabin;
  available: boolean;
  mileageCost: number;
  airlines: string[];
  direct: boolean;
  remainingSeats: number;
}

export interface AwardAvailability {
  id: string;
  routeId: string;
  route: AwardRoute;
  date: string;
  parsedDate: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  cabins: AwardCabinOption[];
}

export interface AwardSearchResult {
  data: AwardAvailability[];
  count: number;
  hasMore: boolean;
  cursor: number;
  rateLimitRemaining: number | null;
}
