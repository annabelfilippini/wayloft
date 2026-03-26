import { Plane, Building2, Clock, Info } from "lucide-react";

// --- Types (shared with card-detail and travel-with-points) ---

export interface TransferPartnerEntry {
  partner: string;
  code: string;
  ratio: string;
  transfer_time: string;
  alliance?: string | null;
  note?: string;
}

export interface TransferPartnerData {
  name: string;
  issuer: string;
  transfer_partners: {
    airlines: TransferPartnerEntry[];
    hotels: TransferPartnerEntry[];
  };
}

// --- Alliance descriptions ---

const ALLIANCE_DESCRIPTIONS: Record<string, string> = {
  "Star Alliance":
    "26 airlines including United, Lufthansa, ANA, Air Canada, and Singapore",
  oneworld:
    "13 airlines including American, British Airways, Cathay Pacific, and Qantas",
  SkyTeam: "19 airlines including Delta, Air France/KLM, and Korean Air",
};

// --- Component ---

export function TransferPartnersContent({
  transferPartners,
}: {
  transferPartners: TransferPartnerData;
}) {
  const airlines = transferPartners.transfer_partners.airlines;
  const hotels = transferPartners.transfer_partners.hotels;
  const alliances = [
    ...new Set(airlines.map((a) => a.alliance).filter(Boolean)),
  ] as string[];
  const relevantAlliances = alliances.filter(
    (a) => a in ALLIANCE_DESCRIPTIONS,
  );

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">{transferPartners.name}</p>

      {relevantAlliances.length > 0 && (
        <div className="space-y-1.5">
          {relevantAlliances.map((alliance) => (
            <div
              key={alliance}
              className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
            >
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <p>
                <span className="font-medium text-foreground">
                  {alliance}:
                </span>{" "}
                {ALLIANCE_DESCRIPTIONS[alliance]}
              </p>
            </div>
          ))}
        </div>
      )}

      {airlines.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Plane className="h-3.5 w-3.5" />
            Airlines
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {airlines.map((airline) => (
              <div
                key={airline.code}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{airline.partner}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{airline.code}</span>
                    {airline.alliance && (
                      <>
                        <span>&middot;</span>
                        <span>{airline.alliance}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium">{airline.ratio}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {airline.transfer_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hotels.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Hotels
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {hotels.map((hotel) => (
              <div
                key={hotel.code}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{hotel.partner}</p>
                  {hotel.note && (
                    <p className="text-xs text-muted-foreground">
                      {hotel.note}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium">{hotel.ratio}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {hotel.transfer_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
