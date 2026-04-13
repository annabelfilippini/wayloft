import type { LoyaltyBalance, TransferBonus } from "@wayloft/shared";
import type {
  AwardAvailability,
  AwardCabin,
  AwardCabinOption,
  AwardSearchResult,
  EnrichedFlight,
} from "./types";
import { sourceToCode } from "./source-currency-map";
import partnersData from "../../../../data/transfer-partners.json";

type Balance = Pick<LoyaltyBalance, "program_code" | "balance" | "currency">;

interface PartnerEntry {
  partner: string;
  code: string;
  ratio: string;
  transfer_time: string;
  alliance?: string | null;
  note?: string;
}

interface CurrencyData {
  name: string;
  issuer: string;
  transfer_partners: { airlines: PartnerEntry[]; hotels: PartnerEntry[] };
}

const PARTNERS = partnersData as { currencies: Record<string, CurrencyData> };

export type Verdict = "cash" | "points" | "close" | "no_awards" | "no_cash";

export interface TransferPath {
  currency: string;
  currencyName: string;
  ratio: number;
  transferTime: string;
  bonusPercentage: number;
  pointsNeededPerPerson: number;
  totalPointsNeeded: number;
  userBalance: number;
  hasEnough: boolean;
  gap: number;
  hypothetical: boolean;
}

export interface AwardPath {
  sourceAirlineCode: string;
  sourceAirlineName: string;
  sourceRaw: string;
  cabin: AwardCabin;
  mileageCostPerPerson: number;
  totalMileageCost: number;
  operatingAirlines: string[];
  direct: boolean;
  remainingSeats: number;
  transferFrom: TransferPath | null;
  effectiveCpp: number | null;
}

export interface BusinessUpsell {
  pointsPerPerson: number;
  totalPoints: number;
  ratioVsSearched: number;
  cabin: AwardCabin;
}

export interface ComparisonResult {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  cashOffer: EnrichedFlight | null;
  cashPrice: number | null;
  awardPaths: AwardPath[];
  bestAwardPath: AwardPath | null;
  verdict: Verdict;
  verdictCpp: number | null;
  businessUpsell: BusinessUpsell | null;
}

const CABIN_CLASS_TO_AWARD: Record<string, AwardCabin> = {
  economy: "Y",
  premium_economy: "W",
  business: "J",
  first: "F",
};

const CABIN_LABEL: Record<AwardCabin, string> = {
  Y: "Economy",
  W: "Premium Economy",
  J: "Business",
  F: "First",
};

const SOURCE_DISPLAY_NAME: Record<string, string> = {
  UA: "United",
  AA: "American",
  DL: "Delta",
  AS: "Alaska",
  B6: "JetBlue",
  HA: "Hawaiian",
  WN: "Southwest",
  AC: "Aeroplan",
  AF: "Flying Blue",
  BA: "British Airways",
  IB: "Iberia",
  VS: "Virgin Atlantic",
  EI: "Aer Lingus",
  AY: "Finnair",
  TP: "TAP",
  EK: "Emirates",
  EY: "Etihad",
  QR: "Qatar",
  TK: "Turkish",
  SQ: "Singapore",
  NH: "ANA",
  CX: "Cathay",
  QF: "Qantas",
  AV: "Avianca",
};

/**
 * Parse a "1:1" or "1:0.25" ratio string into a number representing
 * destination-miles per 1 source-point.
 */
function parseRatio(raw: string): number {
  const match = raw.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!match) return 1;
  const src = parseFloat(match[1]);
  const dst = parseFloat(match[2]);
  if (!Number.isFinite(src) || !Number.isFinite(dst) || src <= 0) return 1;
  return dst / src;
}

/**
 * For a given destination airline code and cabin mileage cost, find the
 * cheapest way for the user to get there through their wallet.
 * Returns null if no user currency can transfer to this airline.
 * Includes hypothetical paths (userBalance = 0) so we can show the math.
 */
export function findBestTransferPath(
  sourceAirlineCode: string,
  mileageCostPerPerson: number,
  passengers: number,
  balances: Balance[],
  bonuses: TransferBonus[]
): TransferPath | null {
  const candidates: TransferPath[] = [];

  for (const [currency, cdata] of Object.entries(PARTNERS.currencies)) {
    const match = cdata.transfer_partners.airlines.find(
      (a) => a.code === sourceAirlineCode
    );
    if (!match) continue;

    const ratio = parseRatio(match.ratio);
    if (ratio <= 0) continue;

    const bonus = bonuses.find(
      (b) => b.currency === currency && b.partner_code === sourceAirlineCode
    );
    const bonusPct = bonus?.bonus_percentage ?? 0;

    const effectivePerSource = ratio * (1 + bonusPct / 100);
    if (effectivePerSource <= 0) continue;

    const pointsNeededPerPerson = Math.ceil(
      mileageCostPerPerson / effectivePerSource
    );
    const totalPointsNeeded = pointsNeededPerPerson * passengers;

    const balanceEntry = balances.find((b) => b.currency === currency);
    const userBalance = balanceEntry?.balance ?? 0;
    const hasEnough = userBalance >= totalPointsNeeded;
    const gap = Math.max(0, totalPointsNeeded - userBalance);
    const hypothetical = userBalance === 0;

    candidates.push({
      currency,
      currencyName: cdata.name,
      ratio,
      transferTime: match.transfer_time,
      bonusPercentage: bonusPct,
      pointsNeededPerPerson,
      totalPointsNeeded,
      userBalance,
      hasEnough,
      gap,
      hypothetical,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.hasEnough !== b.hasEnough) return a.hasEnough ? -1 : 1;
    return a.totalPointsNeeded - b.totalPointsNeeded;
  });

  return candidates[0];
}

function pickCabinOption(
  availability: AwardAvailability,
  preferred: AwardCabin
): AwardCabinOption | null {
  const exact = availability.cabins.find(
    (c) => c.cabin === preferred && c.available
  );
  if (exact) return exact;
  return null;
}

function getBusinessOption(
  availability: AwardAvailability
): AwardCabinOption | null {
  return availability.cabins.find((c) => c.cabin === "J" && c.available) ?? null;
}

function bestCashOffer(flights: EnrichedFlight[]): EnrichedFlight | null {
  if (flights.length === 0) return null;
  const sorted = [...flights].sort(
    (a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount)
  );
  return sorted[0];
}

function computeVerdict(
  cashPrice: number | null,
  bestAward: AwardPath | null
): { verdict: Verdict; cpp: number | null } {
  if (cashPrice === null && bestAward === null) {
    return { verdict: "no_awards", cpp: null };
  }
  if (cashPrice === null) return { verdict: "no_cash", cpp: null };
  if (bestAward === null || bestAward.transferFrom === null) {
    return { verdict: "no_awards", cpp: null };
  }

  const totalPoints = bestAward.transferFrom.totalPointsNeeded;
  if (totalPoints <= 0) return { verdict: "no_awards", cpp: null };

  const cpp = (cashPrice / totalPoints) * 100;

  if (cpp < 1.5) return { verdict: "cash", cpp };
  if (cpp >= 2.0) return { verdict: "points", cpp };
  return { verdict: "close", cpp };
}

/**
 * Pure comparison engine. Merges Duffel cash offers with Seats.aero award
 * availability and returns a single ComparisonResult per search. Designed
 * for client-side use — the caller passes pre-fetched data.
 */
export function computeCashVsPoints(params: {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  cabinClass: string;
  flights: EnrichedFlight[];
  awardResult: AwardSearchResult | null;
  balances: Balance[];
  bonuses: TransferBonus[];
}): ComparisonResult {
  const {
    origin,
    destination,
    date,
    passengers,
    cabinClass,
    flights,
    awardResult,
    balances,
    bonuses,
  } = params;

  const cashOffer = bestCashOffer(flights);
  const cashPrice = cashOffer ? parseFloat(cashOffer.totalAmount) : null;

  const preferredCabin = CABIN_CLASS_TO_AWARD[cabinClass] ?? "Y";

  const matchingAvailability = (awardResult?.data ?? []).filter((a) => {
    if (a.route.originAirport !== origin.toUpperCase()) return false;
    if (a.route.destinationAirport !== destination.toUpperCase()) return false;
    if (a.parsedDate.slice(0, 10) !== date) return false;
    return true;
  });

  const awardPaths: AwardPath[] = [];
  let bestBusiness: { perPerson: number; total: number } | null = null;
  let searchedMilesFloor: number | null = null;

  for (const availability of matchingAvailability) {
    const code = sourceToCode(availability.source);
    const sourceAirlineName = code
      ? SOURCE_DISPLAY_NAME[code] ?? code
      : availability.source;

    const cabinOption = pickCabinOption(availability, preferredCabin);
    if (cabinOption && cabinOption.remainingSeats >= passengers) {
      const totalMileage = cabinOption.mileageCost * passengers;
      const transferFrom = code
        ? findBestTransferPath(
            code,
            cabinOption.mileageCost,
            passengers,
            balances,
            bonuses
          )
        : null;

      awardPaths.push({
        sourceAirlineCode: code ?? "",
        sourceAirlineName,
        sourceRaw: availability.source,
        cabin: cabinOption.cabin,
        mileageCostPerPerson: cabinOption.mileageCost,
        totalMileageCost: totalMileage,
        operatingAirlines: cabinOption.airlines,
        direct: cabinOption.direct,
        remainingSeats: cabinOption.remainingSeats,
        transferFrom,
        effectiveCpp:
          cashPrice !== null && transferFrom
            ? (cashPrice / transferFrom.totalPointsNeeded) * 100
            : null,
      });

      if (
        searchedMilesFloor === null ||
        cabinOption.mileageCost < searchedMilesFloor
      ) {
        searchedMilesFloor = cabinOption.mileageCost;
      }
    }

    if (preferredCabin !== "J") {
      const businessOption = getBusinessOption(availability);
      if (businessOption && businessOption.remainingSeats >= passengers) {
        const perPerson = businessOption.mileageCost;
        if (!bestBusiness || perPerson < bestBusiness.perPerson) {
          bestBusiness = { perPerson, total: perPerson * passengers };
        }
      }
    }
  }

  awardPaths.sort((a, b) => {
    const aPoints = a.transferFrom?.totalPointsNeeded ?? Infinity;
    const bPoints = b.transferFrom?.totalPointsNeeded ?? Infinity;
    const aHas = a.transferFrom?.hasEnough ?? false;
    const bHas = b.transferFrom?.hasEnough ?? false;
    if (aHas !== bHas) return aHas ? -1 : 1;
    return aPoints - bPoints;
  });

  const bestAwardPath = awardPaths[0] ?? null;
  const { verdict, cpp } = computeVerdict(cashPrice, bestAwardPath);

  let businessUpsell: BusinessUpsell | null = null;
  if (bestBusiness && searchedMilesFloor && searchedMilesFloor > 0) {
    const ratioVsSearched = bestBusiness.perPerson / searchedMilesFloor;
    if (ratioVsSearched <= 2) {
      businessUpsell = {
        pointsPerPerson: bestBusiness.perPerson,
        totalPoints: bestBusiness.total,
        ratioVsSearched,
        cabin: "J",
      };
    }
  }

  return {
    origin: origin.toUpperCase(),
    destination: destination.toUpperCase(),
    date,
    passengers,
    cashOffer,
    cashPrice,
    awardPaths,
    bestAwardPath,
    verdict,
    verdictCpp: cpp,
    businessUpsell,
  };
}

export function cabinLabel(cabin: AwardCabin): string {
  return CABIN_LABEL[cabin];
}
