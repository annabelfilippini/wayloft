// Core Wayloft types — expand as features are built

export type Currency = "UR" | "MR" | "TYP" | "C1" | "BILT" | "WF" | "ALTITUDE";

export interface TransferPartner {
  name: string;
  code: string;
  type: "airline" | "hotel";
  ratio: number;
  cpp_valuation: number | null;
}

export interface CreditCard {
  slug: string;
  name: string;
  issuer: string;
  network: "visa" | "mastercard" | "amex";
  annual_fee: number;
  currency: Currency;
}
