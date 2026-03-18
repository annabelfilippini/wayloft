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
