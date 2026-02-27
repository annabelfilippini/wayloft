import transferPartnersData from "../../../../data/transfer-partners.json";

export interface TransferPartnerInfo {
  partner: string;
  code: string;
  type: "airline" | "hotel";
  alliance?: string | null;
}

export interface TransferPartnerOverlap {
  sameCurrency: boolean;
  currencyName?: string;
  shared: TransferPartnerInfo[];
  unique: Record<string, TransferPartnerInfo[]>;
}

/**
 * Returns the slug of the winning card, or null if tied.
 * For dollar values, a $1 threshold prevents false wins on rounding differences.
 */
export function getWinner(
  values: { slug: string; value: number }[],
  mode: "highest" | "lowest"
): string | null {
  if (values.length < 2) return null;

  const sorted = [...values].sort((a, b) =>
    mode === "highest" ? b.value - a.value : a.value - b.value
  );

  const best = sorted[0];
  const runnerUp = sorted[1];

  if (Math.abs(best.value - runnerUp.value) <= 1) return null;
  return best.slug;
}

/**
 * Computes transfer partner overlap between currencies.
 * If all currencies are the same, short-circuits with sameCurrency: true.
 * Otherwise, computes shared vs unique partners by code.
 */
export function computeTransferOverlap(
  currencies: string[]
): TransferPartnerOverlap {
  const uniqueCurrencies = [...new Set(currencies)];

  // Same currency — short circuit
  if (uniqueCurrencies.length === 1) {
    const currency = uniqueCurrencies[0];
    const data =
      (transferPartnersData as Record<string, unknown>).currencies !== undefined
        ? (
            transferPartnersData as {
              currencies: Record<
                string,
                {
                  name: string;
                  transfer_partners: {
                    airlines: Array<{
                      partner: string;
                      code: string;
                      alliance?: string | null;
                    }>;
                    hotels: Array<{
                      partner: string;
                      code: string;
                    }>;
                  };
                }
              >;
            }
          ).currencies[currency]
        : null;

    return {
      sameCurrency: true,
      currencyName: data?.name ?? currency,
      shared: [],
      unique: {},
    };
  }

  // Different currencies — compute overlap
  const partnersByCurrency: Record<string, TransferPartnerInfo[]> = {};
  const tpData = (
    transferPartnersData as {
      currencies: Record<
        string,
        {
          name: string;
          transfer_partners: {
            airlines: Array<{
              partner: string;
              code: string;
              alliance?: string | null;
            }>;
            hotels: Array<{ partner: string; code: string }>;
          };
        }
      >;
    }
  ).currencies;

  for (const currency of uniqueCurrencies) {
    const data = tpData[currency];
    if (!data) {
      partnersByCurrency[currency] = [];
      continue;
    }

    const partners: TransferPartnerInfo[] = [];
    for (const airline of data.transfer_partners.airlines) {
      partners.push({
        partner: airline.partner,
        code: airline.code,
        type: "airline",
        alliance: airline.alliance,
      });
    }
    for (const hotel of data.transfer_partners.hotels) {
      partners.push({
        partner: hotel.partner,
        code: hotel.code,
        type: "hotel",
      });
    }
    partnersByCurrency[currency] = partners;
  }

  // Find shared partners (present in ALL currencies)
  const allCodeSets = uniqueCurrencies.map(
    (c) => new Set(partnersByCurrency[c].map((p) => p.code))
  );
  const sharedCodes = new Set(
    [...allCodeSets[0]].filter((code) =>
      allCodeSets.every((s) => s.has(code))
    )
  );

  // Build shared list from first currency's partner info
  const shared = partnersByCurrency[uniqueCurrencies[0]].filter((p) =>
    sharedCodes.has(p.code)
  );

  // Build unique per currency
  const unique: Record<string, TransferPartnerInfo[]> = {};
  for (const currency of uniqueCurrencies) {
    unique[currency] = partnersByCurrency[currency].filter(
      (p) => !sharedCodes.has(p.code)
    );
  }

  return { sameCurrency: false, shared, unique };
}
