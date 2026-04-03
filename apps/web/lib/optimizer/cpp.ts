import partnersData from "../../../../data/transfer-partners.json";

interface CppEntry {
  cpp: number;
  range: string;
  source: string;
}

const valuations = (partnersData as unknown as { cpp_valuations: Record<string, CppEntry> }).cpp_valuations;

// Cash-back currencies always worth exactly 1.0 cpp
export const CASH_CURRENCIES = new Set([
  "BCP_CASH",
  "BCE_CASH",
  "DISCOVER_CASH",
  "DISCOVER_MILES",
  "BOA_CASH",
  "WF_CASH",
]);

// Transferable point currencies (for tie-breaking)
const TRANSFERABLE_CURRENCIES = new Set(["UR", "MR", "TYP", "C1", "BILT"]);

// Airline/hotel currencies (mid-tier for tie-breaking)
const AIRLINE_HOTEL_CURRENCIES = new Set([
  "UA", "AA", "DL", "WN", "B6", "BA", "AS", "HA",
  "HYATT", "HILTON", "MARRIOTT", "IHG", "WYNDHAM",
]);

export function getCpp(currency: string): number {
  if (CASH_CURRENCIES.has(currency)) return 1.0;
  const entry = valuations[currency];
  if (entry) return entry.cpp;
  // Unknown currency — assume 1.0 (cash-equivalent)
  return 1.0;
}

/** Returns 0 for transferable, 1 for airline/hotel, 2 for cash — lower = better for tie-break */
export function getCurrencyTier(currency: string): number {
  if (TRANSFERABLE_CURRENCIES.has(currency)) return 0;
  if (AIRLINE_HOTEL_CURRENCIES.has(currency)) return 1;
  return 2;
}

export function isTransferable(currency: string): boolean {
  return TRANSFERABLE_CURRENCIES.has(currency);
}
