import type { AirlineKey } from "@wayloft/shared";

export interface AirlineInfo {
  name: string;
  code: string; // IATA
  checkinWindowHours: number;
  awardCancellationFee: number | null;
  awardCancellationPolicy: string;
  hasAssignedSeats: boolean;
  color: string;
  pointsProgram: string;
  pointsCurrency: string;
}

export const AIRLINES: Record<AirlineKey, AirlineInfo> = {
  southwest: {
    name: "Southwest",
    code: "WN",
    checkinWindowHours: 24,
    awardCancellationFee: 0,
    awardCancellationPolicy: "Free — points refund instantly",
    hasAssignedSeats: false,
    color: "#304CB2",
    pointsProgram: "rapid-rewards",
    pointsCurrency: "Rapid Rewards",
  },
  united: {
    name: "United",
    code: "UA",
    checkinWindowHours: 24,
    awardCancellationFee: 0,
    awardCancellationPolicy: "Free — points redeposited",
    hasAssignedSeats: true,
    color: "#002244",
    pointsProgram: "mileageplus",
    pointsCurrency: "MileagePlus",
  },
  delta: {
    name: "Delta",
    code: "DL",
    checkinWindowHours: 24,
    awardCancellationFee: 0,
    awardCancellationPolicy: "No fee on SkyMiles awards",
    hasAssignedSeats: true,
    color: "#003366",
    pointsProgram: "skymiles",
    pointsCurrency: "SkyMiles",
  },
  frontier: {
    name: "Frontier",
    code: "F9",
    checkinWindowHours: 24,
    awardCancellationFee: null,
    awardCancellationPolicy: "Varies by fare class",
    hasAssignedSeats: true,
    color: "#006847",
    pointsProgram: "frontier-miles",
    pointsCurrency: "Frontier Miles",
  },
} as const;

export const AIRLINE_KEYS = Object.keys(AIRLINES) as AirlineKey[];

export function getAirline(key: AirlineKey): AirlineInfo {
  return AIRLINES[key];
}
