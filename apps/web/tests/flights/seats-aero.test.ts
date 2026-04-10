import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { searchAwards, SeatsAeroError } from "@/lib/flights/seats-aero";

const ORIGINAL_KEY = process.env.SEATS_AERO_API_KEY;

const VALID_RESPONSE = {
  data: [
    {
      ID: "avail-1",
      RouteID: "route-1",
      Route: {
        ID: "route-1",
        OriginAirport: "SFO",
        OriginRegion: "North America",
        DestinationAirport: "NRT",
        DestinationRegion: "Asia",
        Distance: 5135,
        Source: "united",
      },
      Date: "2026-06-15",
      ParsedDate: "2026-06-15T00:00:00Z",
      Source: "united",
      CreatedAt: "2026-04-10T12:00:00Z",
      UpdatedAt: "2026-04-10T12:00:00Z",
      YAvailable: true,
      WAvailable: false,
      JAvailable: true,
      FAvailable: false,
      YMileageCost: "35000",
      WMileageCost: "",
      JMileageCost: "88000",
      FMileageCost: "",
      YRemainingSeats: 4,
      WRemainingSeats: 0,
      JRemainingSeats: 2,
      FRemainingSeats: 0,
      YAirlines: "UA, NH",
      WAirlines: "",
      JAirlines: "NH",
      FAirlines: "",
      YDirect: true,
      WDirect: false,
      JDirect: true,
      FDirect: false,
    },
  ],
  count: 1,
  hasMore: false,
  cursor: 0,
};

function mockFetch(response: {
  status?: number;
  json?: unknown;
  headers?: Record<string, string>;
  throws?: boolean;
}) {
  const headers = new Map(Object.entries(response.headers ?? {}));
  return vi.fn().mockImplementation(async () => {
    if (response.throws) throw new Error("network down");
    return {
      ok: (response.status ?? 200) < 400,
      status: response.status ?? 200,
      headers: {
        get: (name: string) => headers.get(name) ?? null,
      },
      json: async () => response.json,
    } as unknown as Response;
  });
}

describe("searchAwards", () => {
  beforeEach(() => {
    process.env.SEATS_AERO_API_KEY = "test_key_123";
  });
  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.SEATS_AERO_API_KEY;
    else process.env.SEATS_AERO_API_KEY = ORIGINAL_KEY;
    vi.restoreAllMocks();
  });

  it("parses a valid response into typed AwardSearchResult", async () => {
    global.fetch = mockFetch({
      status: 200,
      json: VALID_RESPONSE,
      headers: { "X-RateLimit-Remaining": "987" },
    });

    const result = await searchAwards({ origin: "SFO", destination: "NRT" });

    expect(result.count).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.rateLimitRemaining).toBe(987);
    expect(result.data).toHaveLength(1);

    const avail = result.data[0];
    expect(avail.id).toBe("avail-1");
    expect(avail.route.originAirport).toBe("SFO");
    expect(avail.route.destinationAirport).toBe("NRT");
    expect(avail.cabins).toHaveLength(2);

    const economy = avail.cabins.find((c) => c.cabin === "Y");
    expect(economy).toBeDefined();
    expect(economy?.mileageCost).toBe(35000);
    expect(economy?.airlines).toEqual(["UA", "NH"]);
    expect(economy?.direct).toBe(true);
    expect(economy?.remainingSeats).toBe(4);

    const business = avail.cabins.find((c) => c.cabin === "J");
    expect(business?.mileageCost).toBe(88000);
    expect(business?.airlines).toEqual(["NH"]);
  });

  it("throws SeatsAeroError with category 'validation' when API key is missing", async () => {
    delete process.env.SEATS_AERO_API_KEY;
    global.fetch = mockFetch({ status: 200, json: VALID_RESPONSE });

    await expect(
      searchAwards({ origin: "SFO", destination: "NRT" })
    ).rejects.toMatchObject({
      name: "SeatsAeroError",
      category: "validation",
      isRetryable: false,
    });
  });

  it("throws SeatsAeroError with category 'upstream' on malformed JSON payload", async () => {
    global.fetch = mockFetch({
      status: 200,
      json: { unexpected: "shape" },
    });

    await expect(
      searchAwards({ origin: "LAX", destination: "LHR" })
    ).rejects.toMatchObject({
      name: "SeatsAeroError",
      category: "upstream",
    });
  });

  it("rejects invalid IATA codes before making a network call", async () => {
    const fetchMock = mockFetch({ status: 200, json: VALID_RESPONSE });
    global.fetch = fetchMock;

    await expect(
      searchAwards({ origin: "sf", destination: "NRT" })
    ).rejects.toMatchObject({
      name: "SeatsAeroError",
      category: "validation",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps 429 responses to rate_limit category with isRetryable=true", async () => {
    global.fetch = mockFetch({ status: 429, json: {} });

    await expect(
      searchAwards({ origin: "SFO", destination: "NRT" })
    ).rejects.toMatchObject({
      name: "SeatsAeroError",
      category: "rate_limit",
      isRetryable: true,
    });
  });

  it("maps 401 responses to auth category", async () => {
    global.fetch = mockFetch({ status: 401, json: {} });

    await expect(
      searchAwards({ origin: "SFO", destination: "NRT" })
    ).rejects.toMatchObject({
      name: "SeatsAeroError",
      category: "auth",
      isRetryable: false,
    });
  });

  it("sends the Partner-Authorization header with the raw API key", async () => {
    const fetchMock = mockFetch({ status: 200, json: VALID_RESPONSE });
    global.fetch = fetchMock;

    await searchAwards({ origin: "SFO", destination: "NRT" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Partner-Authorization"]).toBe("test_key_123");
  });
});
