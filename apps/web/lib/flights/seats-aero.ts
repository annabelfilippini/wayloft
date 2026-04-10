import type {
  AwardAvailability,
  AwardCabin,
  AwardCabinOption,
  AwardRoute,
  AwardSearchParams,
  AwardSearchResult,
} from "./types";

const SEATS_AERO_BASE_URL = "https://seats.aero/partnerapi";

export class SeatsAeroError extends Error {
  constructor(
    message: string,
    public readonly category: "validation" | "auth" | "rate_limit" | "transient" | "upstream",
    public readonly status?: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = "SeatsAeroError";
  }
}

interface RawAvailability {
  ID: string;
  RouteID: string;
  Route: {
    ID: string;
    OriginAirport: string;
    OriginRegion: string;
    DestinationAirport: string;
    DestinationRegion: string;
    Distance: number;
    Source: string;
  };
  Date: string;
  ParsedDate: string;
  Source: string;
  CreatedAt: string;
  UpdatedAt: string;
  YAvailable: boolean;
  WAvailable: boolean;
  JAvailable: boolean;
  FAvailable: boolean;
  YMileageCost: string;
  WMileageCost: string;
  JMileageCost: string;
  FMileageCost: string;
  YRemainingSeats: number;
  WRemainingSeats: number;
  JRemainingSeats: number;
  FRemainingSeats: number;
  YAirlines: string;
  WAirlines: string;
  JAirlines: string;
  FAirlines: string;
  YDirect: boolean;
  WDirect: boolean;
  JDirect: boolean;
  FDirect: boolean;
}

interface RawSearchResponse {
  data: RawAvailability[];
  count: number;
  hasMore: boolean;
  cursor: number;
}

function requireApiKey(): string {
  const key = process.env.SEATS_AERO_API_KEY;
  if (!key) {
    throw new SeatsAeroError(
      "SEATS_AERO_API_KEY is not set",
      "validation",
      undefined,
      false
    );
  }
  return key;
}

function parseAirlines(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseMileageCost(raw: string): number {
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function mapRoute(raw: RawAvailability["Route"]): AwardRoute {
  return {
    id: raw.ID,
    originAirport: raw.OriginAirport,
    originRegion: raw.OriginRegion,
    destinationAirport: raw.DestinationAirport,
    destinationRegion: raw.DestinationRegion,
    distance: raw.Distance,
    source: raw.Source,
  };
}

function mapCabins(raw: RawAvailability): AwardCabinOption[] {
  const rows: Array<[AwardCabin, boolean, string, number, string, boolean]> = [
    ["Y", raw.YAvailable, raw.YMileageCost, raw.YRemainingSeats, raw.YAirlines, raw.YDirect],
    ["W", raw.WAvailable, raw.WMileageCost, raw.WRemainingSeats, raw.WAirlines, raw.WDirect],
    ["J", raw.JAvailable, raw.JMileageCost, raw.JRemainingSeats, raw.JAirlines, raw.JDirect],
    ["F", raw.FAvailable, raw.FMileageCost, raw.FRemainingSeats, raw.FAirlines, raw.FDirect],
  ];
  return rows
    .filter(([, available]) => available)
    .map(([cabin, available, cost, seats, airlines, direct]) => ({
      cabin,
      available,
      mileageCost: parseMileageCost(cost),
      airlines: parseAirlines(airlines),
      direct,
      remainingSeats: seats,
    }));
}

function mapAvailability(raw: RawAvailability): AwardAvailability {
  return {
    id: raw.ID,
    routeId: raw.RouteID,
    route: mapRoute(raw.Route),
    date: raw.Date,
    parsedDate: raw.ParsedDate,
    source: raw.Source,
    createdAt: raw.CreatedAt,
    updatedAt: raw.UpdatedAt,
    cabins: mapCabins(raw),
  };
}

function validateIata(code: string, field: string): void {
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new SeatsAeroError(
      `${field} must be a 3-letter IATA code`,
      "validation",
      undefined,
      false
    );
  }
}

function buildQuery(params: AwardSearchParams): string {
  const qs = new URLSearchParams();
  qs.set("origin_airport", params.origin);
  qs.set("destination_airport", params.destination);
  if (params.startDate) qs.set("start_date", params.startDate);
  if (params.endDate) qs.set("end_date", params.endDate);
  if (params.onlyDirect) qs.set("only_direct_flights", "true");
  if (params.cabins && params.cabins.length > 0) {
    const names = params.cabins.map(
      (c) =>
        ({ Y: "economy", W: "premium", J: "business", F: "first" })[c]
    );
    qs.set("cabins", names.join(","));
  }
  if (params.sources && params.sources.length > 0) {
    qs.set("sources", params.sources.join(","));
  }
  qs.set("take", String(params.take ?? 100));
  if (params.cursor !== undefined) qs.set("cursor", String(params.cursor));
  return qs.toString();
}

export async function searchAwards(
  params: AwardSearchParams
): Promise<AwardSearchResult> {
  const origin = params.origin.toUpperCase().trim();
  const destination = params.destination.toUpperCase().trim();
  validateIata(origin, "origin");
  validateIata(destination, "destination");

  const apiKey = requireApiKey();
  const query = buildQuery({ ...params, origin, destination });
  const url = `${SEATS_AERO_BASE_URL}/search?${query}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "Partner-Authorization": apiKey,
        Accept: "application/json",
      },
    });
  } catch (err) {
    throw new SeatsAeroError(
      "Failed to reach Seats.aero",
      "transient",
      undefined,
      true
    );
  }

  const remainingHeader = res.headers.get("X-RateLimit-Remaining");
  const rateLimitRemaining = remainingHeader ? parseInt(remainingHeader, 10) : null;

  if (res.status === 401 || res.status === 403) {
    throw new SeatsAeroError(
      "Seats.aero authentication failed — check API key",
      "auth",
      res.status,
      false
    );
  }
  if (res.status === 429) {
    throw new SeatsAeroError(
      "Seats.aero rate limit hit",
      "rate_limit",
      429,
      true
    );
  }
  if (!res.ok) {
    throw new SeatsAeroError(
      `Seats.aero returned ${res.status}`,
      "upstream",
      res.status,
      res.status >= 500
    );
  }

  let json: RawSearchResponse;
  try {
    json = (await res.json()) as RawSearchResponse;
  } catch {
    throw new SeatsAeroError(
      "Seats.aero returned invalid JSON",
      "upstream",
      res.status,
      false
    );
  }

  if (!json || !Array.isArray(json.data)) {
    throw new SeatsAeroError(
      "Seats.aero returned unexpected payload shape",
      "upstream",
      res.status,
      false
    );
  }

  return {
    data: json.data.map(mapAvailability),
    count: json.count ?? json.data.length,
    hasMore: Boolean(json.hasMore),
    cursor: json.cursor ?? 0,
    rateLimitRemaining,
  };
}
