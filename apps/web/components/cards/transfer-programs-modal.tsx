"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  Plane,
  Building2,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTravelGuide } from "@/lib/cards/sweet-spots";
import type { TransferPartnerData, TransferPartnerEntry } from "./transfer-partners-content";

// --- Types ---

interface ProgramEntry {
  name: string;
  code: string;
  type: "airline" | "hotel";
  ratio: string;
  transferTime: string;
  descriptor: string;
  badges: string[];
  isRecommended: boolean;
}

// --- Enrichment data ---
// Descriptors for common transfer partners across all currencies.
// Partners not in this map get a generic descriptor.

const PROGRAM_INFO: Record<string, { descriptor: string; tags: string[] }> = {
  // Airlines
  UA: { descriptor: "Best for domestic flights and Europe", tags: ["Domestic", "Europe"] },
  BA: { descriptor: "Good for short nonstop flights", tags: ["Short-haul", "Popular"] },
  SQ: { descriptor: "Premium cabins to Asia", tags: ["Asia", "Premium"] },
  EK: { descriptor: "Luxury cabin redemptions", tags: ["Luxury", "Popular"] },
  IB: { descriptor: "Europe award deals", tags: ["Europe", "Good value"] },
  AF: { descriptor: "Europe deals and promo awards", tags: ["Promo awards", "Europe"] },
  VS: { descriptor: "Great for partner sweet spots", tags: ["Sweet spot", "Popular"] },
  WN: { descriptor: "Flexible domestic trips", tags: ["Domestic", "Easy to use"] },
  B6: { descriptor: "Simple US redemptions", tags: ["Domestic", "Simple"] },
  AC: { descriptor: "Strong partner network", tags: ["Partners", "Europe"] },
  AA: { descriptor: "Wide domestic and partner network", tags: ["Domestic", "Partners"] },
  DL: { descriptor: "No expiration, wide availability", tags: ["Domestic", "Popular"] },
  NH: { descriptor: "Best business class to Asia", tags: ["Asia", "Premium"] },
  TK: { descriptor: "Great partner award rates", tags: ["Good value"] },
  QF: { descriptor: "Best for Australia", tags: ["Australia"] },
  CX: { descriptor: "Premium cabins to Asia Pacific", tags: ["Asia", "Premium"] },
  HA: { descriptor: "Best for Hawaii routes", tags: ["Hawaii"] },
  AS: { descriptor: "West Coast and partner awards", tags: ["West Coast"] },
  TP: { descriptor: "Europe via Lisbon", tags: ["Europe"] },
  AV: { descriptor: "South America and Star Alliance", tags: ["South America"] },
  ET: { descriptor: "Africa and Middle East routes", tags: ["Africa"] },
  QR: { descriptor: "Premium cabins to Middle East", tags: ["Premium"] },
  // Hotels
  HYATT: { descriptor: "Best hotel redemption value", tags: ["Great value"] },
  IHG: { descriptor: "Broad hotel coverage worldwide", tags: ["Coverage"] },
  MARRIOTT: { descriptor: "Largest hotel network", tags: ["Large network"] },
  HILTON: { descriptor: "Frequent promos and bonuses", tags: ["Promos"] },
  WYNDHAM: { descriptor: "Simple flat-rate redemptions", tags: ["Easy", "Great value"] },
  CHOICE: { descriptor: "Budget-friendly hotel coverage", tags: ["Coverage"] },
  ACCOR: { descriptor: "European hotel network", tags: ["Europe"] },
};

// --- Badge styling ---

const GOLD_BADGES = new Set([
  "Recommended", "Great value", "Top value", "Sweet spot", "Good value",
]);
const GREEN_BADGES = new Set([
  "Instant", "Easy to use", "Simple", "Easy",
]);

function getBadgeStyle(badge: string): string {
  if (GOLD_BADGES.has(badge))
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (GREEN_BADGES.has(badge))
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

// --- Program list builder ---

function buildProgramList(
  transferPartners: TransferPartnerData,
  currency: string,
): ProgramEntry[] {
  const guide = getTravelGuide(currency);
  const recommendedCodes = new Set(
    guide?.recommended.map((r) => r.code) ?? [],
  );
  const recommendedMap = new Map(
    guide?.recommended.map((r) => [r.code, r]) ?? [],
  );

  function enrich(
    entry: TransferPartnerEntry,
    type: "airline" | "hotel",
  ): ProgramEntry {
    const rec = recommendedMap.get(entry.code);
    const info = PROGRAM_INFO[entry.code];
    const isInstant = entry.transfer_time.toLowerCase().includes("instant");

    // Build badges
    const badges: string[] = [];
    if (rec) {
      for (const b of rec.badges) badges.push(b);
    } else {
      if (info) {
        for (const t of info.tags.slice(0, 2)) badges.push(t);
      }
      if (isInstant && !badges.includes("Instant")) badges.push("Instant");
    }
    if (badges.length === 0 && isInstant) badges.push("Instant");

    return {
      name: entry.partner,
      code: entry.code,
      type,
      ratio: entry.ratio,
      transferTime: entry.transfer_time,
      descriptor:
        rec?.descriptor ??
        info?.descriptor ??
        (type === "hotel"
          ? "Hotel loyalty program"
          : "Airline loyalty program"),
      badges,
      isRecommended: recommendedCodes.has(entry.code),
    };
  }

  const airlines = transferPartners.transfer_partners.airlines.map((a) =>
    enrich(a, "airline"),
  );
  const hotels = transferPartners.transfer_partners.hotels.map((h) =>
    enrich(h, "hotel"),
  );

  const sort = (a: ProgramEntry, b: ProgramEntry) => {
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    return a.name.localeCompare(b.name);
  };

  return [...airlines.sort(sort), ...hotels.sort(sort)];
}

// --- Filter tabs ---

type FilterTab = "all";

// --- Program Card ---

function ProgramGridCard({ program }: { program: ProgramEntry }) {
  const Icon = program.type === "airline" ? Plane : Building2;

  return (
    <div className="flex items-center gap-3 border p-4">
      {/* Logo placeholder */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{program.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {program.descriptor}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{program.ratio}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            {program.transferTime.toLowerCase().includes("instant") && (
              <Zap className="h-3 w-3" />
            )}
            {program.transferTime}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        {program.badges.slice(0, 2).map((badge) => (
          <span
            key={badge}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getBadgeStyle(badge)}`}
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Modal ---

interface TransferProgramsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transferPartners: TransferPartnerData;
  currency: string;
}

export function TransferProgramsModal({
  open,
  onOpenChange,
  transferPartners,
  currency,
}: TransferProgramsModalProps) {
  const [search, setSearch] = useState("");

  const allPrograms = useMemo(
    () => buildProgramList(transferPartners, currency),
    [transferPartners, currency],
  );

  const airlineCount = transferPartners.transfer_partners.airlines.length;
  const hotelCount = transferPartners.transfer_partners.hotels.length;
  const instantCount = allPrograms.filter((p) =>
    p.transferTime.toLowerCase().includes("instant"),
  ).length;

  const filtered = allPrograms.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.descriptor.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const airlines = filtered.filter((p) => p.type === "airline");
  const hotels = filtered.filter((p) => p.type === "hotel");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b px-6 pb-4 pt-6">
          <div>
            <DialogTitle className="text-xl font-bold">
              Explore All Transfer Programs
            </DialogTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                {airlineCount} airline program
                {airlineCount !== 1 ? "s" : ""}
              </span>
              <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                {hotelCount} hotel program{hotelCount !== 1 ? "s" : ""}
              </span>
              {instantCount > 0 && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Most transfer instantly
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Search */}
        <div className="border-b px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border bg-muted/30 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No programs match your search.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {airlines.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Plane className="h-3.5 w-3.5" />
                    Airlines
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {airlines.map((program) => (
                      <ProgramGridCard
                        key={program.code}
                        program={program}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hotels.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    Hotels
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {hotels.map((program) => (
                      <ProgramGridCard
                        key={program.code}
                        program={program}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 text-center">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Hide programs
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
