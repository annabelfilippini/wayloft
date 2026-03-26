"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Plane,
  Building2,
  Compass,
} from "lucide-react";
import { getTravelGuide } from "@/lib/cards/sweet-spots";
import type { SweetSpot, RecommendedProgram } from "@/lib/cards/sweet-spots";
import type { TransferPartnerData } from "./transfer-partners-content";
import { TransferProgramsModal } from "./transfer-programs-modal";

// --- Props ---

interface TravelWithPointsSectionProps {
  currency: string;
  transferPartners: TransferPartnerData;
}

// --- Destination Card ---

function DestinationCard({ spot }: { spot: SweetSpot }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative h-48 w-48 shrink-0 overflow-hidden rounded-xl">
      {/* Gradient fallback (always renders underneath) */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${spot.gradient}`}
      />

      {/* Photo (overlays gradient when loaded) */}
      {spot.image && !imgError && (
        <Image
          src={spot.image}
          alt={spot.destination}
          fill
          className="object-cover"
          sizes="192px"
          onError={() => setImgError(true)}
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative flex h-full flex-col justify-end p-4">
        <h3 className="text-lg font-bold text-white">{spot.destination}</h3>
        <p className="mt-0.5 text-xs text-white/80">{spot.via}</p>
        <p className="mt-1 text-sm font-semibold text-white">{spot.points}</p>
        <span className="mt-2 inline-block self-start rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {spot.badge}
        </span>
      </div>
    </div>
  );
}

// --- Program Card ---

function ProgramCard({ program }: { program: RecommendedProgram }) {
  const Icon = program.type === "airline" ? Plane : Building2;

  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      {/* Icon placeholder */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{program.name}</p>
        <p className="text-xs text-muted-foreground">{program.descriptor}</p>
      </div>

      {/* Badges */}
      <div className="flex shrink-0 items-center gap-1.5">
        {program.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Main Section ---

export function TravelWithPointsSection({
  currency,
  transferPartners,
}: TravelWithPointsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const guide = getTravelGuide(currency);
  const airlineCount = transferPartners.transfer_partners.airlines.length;
  const hotelCount = transferPartners.transfer_partners.hotels.length;

  const cardClass = "rounded-2xl bg-card shadow-sm border overflow-hidden";

  return (
    <>
      <section className={cardClass}>
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between p-5 transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Travel With Your Points</h2>
            {!isOpen && (
              <span className="text-sm text-muted-foreground">
                · {airlineCount} airlines · {hotelCount} hotels
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expanded content */}
        {isOpen && (
          <div className="border-t">
            {/* Layer 1: Destination Inspiration */}
            {guide && guide.sweetSpots.length > 0 && (
              <div className="px-5 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular redemption paths
                </p>
                <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
                  {guide.sweetSpots.map((spot) => (
                    <DestinationCard key={spot.destination} spot={spot} />
                  ))}
                </div>
              </div>
            )}

            {/* Layer 2: Recommended Programs */}
            {guide && guide.recommended.length > 0 && (
              <div className="px-5 pb-2 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended programs
                </p>
                <div className="space-y-2">
                  {guide.recommended.map((program) => (
                    <ProgramCard key={program.code} program={program} />
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: if no guide, show partner counts */}
            {!guide && (
              <div className="px-5 pt-5">
                <p className="text-sm text-muted-foreground">
                  Transfer to {airlineCount} airline
                  {airlineCount !== 1 ? "s" : ""} and {hotelCount} hotel
                  {hotelCount !== 1 ? "s" : ""} to maximize your points.
                </p>
              </div>
            )}

            {/* Layer 3: Explore all — opens modal */}
            <div className="border-t px-5 py-3">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                Explore all transfer programs
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Transfer Programs Modal */}
      <TransferProgramsModal
        open={showModal}
        onOpenChange={setShowModal}
        transferPartners={transferPartners}
        currency={currency}
      />
    </>
  );
}
