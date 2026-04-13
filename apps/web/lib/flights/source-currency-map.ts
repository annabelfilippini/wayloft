/**
 * Map Seats.aero "source" strings to the airline IATA codes used in
 * data/transfer-partners.json. Only airlines that are transfer partners
 * of at least one bank currency are included. Unmapped sources will
 * surface in the comparison UI as "no transfer path" for the user's wallet.
 *
 * Seats.aero returns source strings lowercase, often as the airline brand
 * (e.g. "united", "americanairlines", "flyingblue"). We normalize to the
 * same IATA/brand code the transfer-partners.json uses for that partner.
 */
export const SEATS_AERO_SOURCE_TO_CODE: Record<string, string> = {
  // North America
  united: "UA",
  americanairlines: "AA",
  delta: "DL",
  alaska: "AS",
  jetblue: "B6",
  hawaiian: "HA",
  southwest: "WN",
  aeroplan: "AC",
  // Europe
  airfrance: "AF",
  flyingblue: "AF",
  klm: "AF",
  britishairways: "BA",
  iberia: "IB",
  virginatlantic: "VS",
  aerlingus: "EI",
  finnair: "AY",
  tapportugal: "TP",
  // Middle East / Asia
  emirates: "EK",
  etihad: "EY",
  qatar: "QR",
  turkish: "TK",
  singapore: "SQ",
  ana: "NH",
  cathay: "CX",
  // South Pacific / Latin America
  qantas: "QF",
  avianca: "AV",
};

/** Lookup helper — case-insensitive, returns null if no mapping. */
export function sourceToCode(source: string | null | undefined): string | null {
  if (!source) return null;
  return SEATS_AERO_SOURCE_TO_CODE[source.toLowerCase()] ?? null;
}
