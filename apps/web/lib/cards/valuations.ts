import "server-only";
import partnersData from "../../../../data/transfer-partners.json";

export interface CppEntry {
  cpp: number;
  range: string;
  source: string;
}

const raw = (partnersData as Record<string, unknown>)["cpp_valuations"] as Record<
  string,
  CppEntry & { _note?: never }
>;

const valuations = Object.fromEntries(
  Object.entries(raw).filter(([key]) => key !== "_note")
) as Record<string, CppEntry>;

export function getCppValuation(code: string): CppEntry | null {
  return valuations[code] ?? null;
}

export function getAllCppValuations(): Record<string, CppEntry> {
  return valuations;
}

export function estimateValue(balance: number, code: string): number | null {
  const entry = valuations[code];
  if (!entry) return null;
  return (balance * entry.cpp) / 100;
}
