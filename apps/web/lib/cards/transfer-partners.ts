import "server-only";
import partnersData from "../../../../data/transfer-partners.json";

interface TransferPartnerEntry {
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
  transfer_partners: {
    airlines: TransferPartnerEntry[];
    hotels: TransferPartnerEntry[];
  };
}

const data = partnersData as { currencies: Record<string, CurrencyData> };

export function getTransferPartners(currency: string) {
  const entry = data.currencies[currency];
  if (!entry) return null;
  return entry;
}

export function getAllCurrencies() {
  return Object.keys(data.currencies);
}
