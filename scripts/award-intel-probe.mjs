#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://seats.aero/partnerapi/search";
const DEFAULT_ROUTES = ["DTW-MCO", "DTW-LHR", "DTW-CDG", "LAX-HND", "JFK-MAD"];
const DEFAULT_TAKE = 50;

function parseArgs(argv) {
  const args = {
    routes: DEFAULT_ROUTES,
    startDate: undefined,
    endDate: undefined,
    cabins: undefined,
    take: DEFAULT_TAKE,
    outDir: "Research/award-intel",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--routes" && next) {
      args.routes = next.split(",").map((route) => route.trim()).filter(Boolean);
      i += 1;
    } else if (arg === "--start-date" && next) {
      args.startDate = next;
      i += 1;
    } else if (arg === "--end-date" && next) {
      args.endDate = next;
      i += 1;
    } else if (arg === "--cabins" && next) {
      args.cabins = next.split(",").map((cabin) => cabin.trim()).filter(Boolean);
      i += 1;
    } else if (arg === "--take" && next) {
      const parsed = Number.parseInt(next, 10);
      args.take = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 1000) : DEFAULT_TAKE;
      i += 1;
    } else if (arg === "--out-dir" && next) {
      args.outDir = next;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  SEATS_AERO_API_KEY=... node scripts/award-intel-probe.mjs [options]

Options:
  --routes DTW-MCO,JFK-MAD   Comma-separated origin-destination pairs
  --start-date 2026-06-01    Optional Seats.aero start_date
  --end-date 2026-06-30      Optional Seats.aero end_date
  --cabins economy,business  Optional Seats.aero cabin names
  --take 100                 Records per route, capped at 1000
  --out-dir PATH             Default: Research/award-intel
`);
}

function assertIataPair(route) {
  const [origin, destination] = route.toUpperCase().split("-");
  if (!/^[A-Z]{3}$/.test(origin ?? "") || !/^[A-Z]{3}$/.test(destination ?? "")) {
    throw new Error(`Invalid route "${route}". Use IATA-IATA, e.g. DTW-MCO.`);
  }
  return { origin, destination, route: `${origin}-${destination}` };
}

function buildUrl({ origin, destination, startDate, endDate, cabins, take }) {
  const url = new URL(BASE_URL);
  url.searchParams.set("origin_airport", origin);
  url.searchParams.set("destination_airport", destination);
  url.searchParams.set("take", String(take));
  if (startDate) url.searchParams.set("start_date", startDate);
  if (endDate) url.searchParams.set("end_date", endDate);
  if (cabins?.length) url.searchParams.set("cabins", cabins.join(","));
  return url;
}

function summarizeAvailability(data) {
  return data.map((row) => ({
    id: row.ID,
    routeId: row.RouteID,
    date: row.Date,
    parsedDate: row.ParsedDate,
    source: row.Source,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    economy: cabinSummary(row, "Y"),
    premium: cabinSummary(row, "W"),
    business: cabinSummary(row, "J"),
    first: cabinSummary(row, "F"),
  }));
}

function cabinSummary(row, prefix) {
  if (!row[`${prefix}Available`]) return null;
  return {
    mileageCost: parseMileage(row[`${prefix}MileageCost`]),
    remainingSeats: row[`${prefix}RemainingSeats`] ?? 0,
    airlines: parseCsv(row[`${prefix}Airlines`]),
    direct: Boolean(row[`${prefix}Direct`]),
  };
}

function parseMileage(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCsv(value) {
  if (!value) return [];
  return String(value).split(",").map((part) => part.trim()).filter(Boolean);
}

async function fetchRoute(routeInput, args, apiKey) {
  const route = assertIataPair(routeInput);
  const retrievedDate = new Date().toISOString();
  const url = buildUrl({ ...route, ...args });

  try {
    const response = await fetch(url, {
      headers: {
        "Partner-Authorization": apiKey,
        Accept: "application/json",
      },
    });

    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");

    if (!response.ok) {
      return {
        type: "award_availability_snapshot",
        route: route.route,
        source: "seats.aero",
        source_url: url.toString(),
        retrieved_date: retrievedDate,
        availability: [],
        confidence: 0,
        partialResult: true,
        gaps: [
          {
            category: "upstream_error",
            message: `Seats.aero returned HTTP ${response.status}`,
            retryable: response.status === 429 || response.status >= 500,
          },
        ],
        rateLimitRemaining,
      };
    }

    const json = await response.json();
    const rows = Array.isArray(json.data) ? json.data : [];

    return {
      type: "award_availability_snapshot",
      route: route.route,
      source: "seats.aero",
      source_url: url.toString(),
      retrieved_date: retrievedDate,
      upstream_count: json.count ?? rows.length,
      hasMore: Boolean(json.hasMore),
      cursor: json.cursor ?? 0,
      availability: summarizeAvailability(rows),
      confidence: 0.95,
      partialResult: false,
      gaps: rows.length === 0 ? [{ category: "no_results", message: "No matching award rows returned." }] : [],
      rateLimitRemaining,
    };
  } catch (error) {
    return {
      type: "award_availability_snapshot",
      route: route.route,
      source: "seats.aero",
      source_url: url.toString(),
      retrieved_date: retrievedDate,
      availability: [],
      confidence: 0,
      partialResult: true,
      gaps: [
        {
          category: "fetch_failed",
          message: error instanceof Error ? error.message : "Unknown fetch error",
          retryable: true,
        },
      ],
    };
  }
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const apiKey = process.env.SEATS_AERO_API_KEY;
  if (!apiKey) {
    console.error("SEATS_AERO_API_KEY is required. The key is read from env and never printed.");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const snapshots = [];

  for (const route of args.routes) {
    snapshots.push(await fetchRoute(route, args, apiKey));
  }

  const outDir = path.resolve(process.cwd(), args.outDir);
  await mkdir(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(outDir, `${stamp}-seats-aero-snapshot.jsonl`);
  const body = snapshots.map((snapshot) => JSON.stringify(snapshot)).join("\n") + "\n";
  await writeFile(outPath, body, "utf8");

  const failed = snapshots.filter((snapshot) => snapshot.partialResult).length;
  console.log(`Wrote ${snapshots.length} route snapshots to ${outPath}`);
  if (failed > 0) console.log(`${failed} route(s) returned partial results; inspect gaps in the JSONL.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
