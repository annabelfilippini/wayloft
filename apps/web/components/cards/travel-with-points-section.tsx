"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getTravelGuide } from "@/lib/cards/sweet-spots";
import type { SweetSpot } from "@/lib/cards/sweet-spots";
import type { TransferPartnerData } from "./transfer-partners-content";

interface TravelWithPointsSectionProps {
  currency: string;
  transferPartners: TransferPartnerData;
}

const ALLIANCE_CODES: Record<string, string> = {
  star_alliance: "Star Alliance",
  oneworld: "oneworld",
  skyteam: "SkyTeam",
};

function DestinationCard({ spot }: { spot: SweetSpot }) {
  const [imgError, setImgError] = useState(false);
  const href = spot.airportCode ? `/travel?to=${spot.airportCode}` : undefined;

  const content = (
    <>
      {/* Image / gradient fallback */}
      <div className="h-44 relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${spot.gradient}`} />
        {spot.image && !imgError && (
          <Image
            src={spot.image}
            alt={spot.destination}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {href && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-white/70 text-lg">arrow_forward</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <span className="label-signal text-primary">{spot.via}</span>
        <h3 className="text-base font-semibold mt-1">{spot.destination}</h3>
        <p className="text-xs text-muted-foreground mt-1">{spot.points}</p>
        <p className="text-xs text-success font-semibold mt-2">{spot.badge}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="group relative overflow-hidden border hover:border-muted-foreground transition-colors block">
        {content}
      </Link>
    );
  }

  return (
    <div className="group relative overflow-hidden border">
      {content}
    </div>
  );
}

export function TravelWithPointsSection({
  currency,
  transferPartners,
}: TravelWithPointsSectionProps) {
  const [showPartners, setShowPartners] = useState(false);
  const guide = getTravelGuide(currency);
  const airlines = transferPartners.transfer_partners.airlines;
  const hotels = transferPartners.transfer_partners.hotels;

  return (
    <>
      <section className="pb-10">
        {/* Sweet Spots — destination images first */}
        {guide && guide.sweetSpots.length > 0 && (
          <div className="mb-10">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-lg font-semibold tracking-[-0.01em]">Where Your Points Go Further</span>
              <span className="text-xs text-muted-foreground">
                {airlines.length} airlines · {hotels.length} hotels
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Use your points to book these trips for a fraction of the cash price
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {guide.sweetSpots.slice(0, 6).map((spot) => (
                <DestinationCard key={spot.destination} spot={spot} />
              ))}
            </div>
          </div>
        )}

        {/* Airlines & Hotels — expandable */}
        <div>
          <button
            type="button"
            onClick={() => setShowPartners(!showPartners)}
            className="flex items-center gap-2 mb-6 group"
          >
            <span className="text-lg font-semibold tracking-[-0.01em]">Transfer Partners</span>
            <span className="mono text-xs text-muted-foreground">
              {airlines.length + hotels.length} PROGRAMS
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showPartners ? "rotate-180" : ""}`}
            />
          </button>

          {showPartners && (
            <div>
              {/* Recommended programs */}
              {guide && guide.recommended.length > 0 && (
                <div className="mb-6">
                  <span className="label-signal text-muted-foreground/60 block mb-3">Recommended Programs</span>
                  <div className="space-y-px bg-border">
                    {guide.recommended.map((program) => (
                      <div key={program.code} className="bg-card p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-muted-foreground text-xl">
                            {program.type === "airline" ? "flight" : "hotel"}
                          </span>
                          <div>
                            <span className="text-sm font-medium">{program.name}</span>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{program.descriptor}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {program.badges.map((badge) => (
                            <span key={badge} className="mono text-[9px] font-bold px-2.5 py-0.5 uppercase tracking-wider bg-primary/10 text-primary">
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Airlines */}
              {airlines.length > 0 && (
                <div className="mb-6">
                  <span className="label-signal text-muted-foreground/60 block mb-3">Airlines</span>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border">
                    {airlines.map((airline) => {
                      const code = airline.code?.toUpperCase() ?? airline.partner.slice(0, 2).toUpperCase();
                      const alliance = airline.alliance ? ALLIANCE_CODES[airline.alliance] : null;
                      const speed = airline.transfer_time === "instant" ? "Instant" : airline.transfer_time ?? "";

                      return (
                        <div key={airline.code ?? airline.partner} className="bg-card p-4 text-center">
                          <span className="mono text-lg font-semibold block">{code}</span>
                          <span className="text-[11px] text-muted-foreground block mt-1">{airline.partner}</span>
                          <span className="label-signal text-muted-foreground/40 mt-1 block">
                            {alliance ?? "\u00A0"}
                          </span>
                          <span className={`text-[9px] mt-1 block ${speed === "Instant" ? "text-success" : "text-primary"}`}>
                            {speed}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hotels */}
              {hotels.length > 0 && (
                <div className="mb-6">
                  <span className="label-signal text-muted-foreground/60 block mb-3">Hotels</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
                    {hotels.map((hotel) => {
                      const speed = hotel.transfer_time === "instant" ? "Instant transfer" : hotel.transfer_time ?? "";

                      return (
                        <div key={hotel.code ?? hotel.partner} className="bg-card p-5 flex items-center justify-between">
                          <div>
                            <span className="text-base font-semibold">{hotel.partner}</span>
                            <span className={`text-[9px] block mt-1 ${speed.includes("Instant") ? "text-success" : "text-primary"}`}>
                              {speed}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="mono text-lg font-light">1:1</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </section>

    </>
  );
}
