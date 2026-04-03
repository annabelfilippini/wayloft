"use client";

import Image from "next/image";
import type { CurrencyTravelGuide } from "@/lib/cards/sweet-spots";
import { CURRENCY_DISPLAY_NAMES } from "@/lib/bonuses/utils";

interface SweetSpotsPanelProps {
  sweetSpots: Record<string, CurrencyTravelGuide>;
  userCurrencies: string[];
  onSelectDestination?: (code: string) => void;
}

export function SweetSpotsPanel({
  sweetSpots,
  userCurrencies,
  onSelectDestination,
}: SweetSpotsPanelProps) {
  const currencies = userCurrencies.filter((c) => sweetSpots[c]);

  if (currencies.length === 0) {
    return (
      <div className="border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Add cards with transferable points to see destination ideas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {currencies.map((currency) => {
        const guide = sweetSpots[currency];
        const displayName = CURRENCY_DISPLAY_NAMES[currency] ?? currency;

        return (
          <div key={currency}>
            <span className="label-signal text-muted-foreground">
              {displayName.toUpperCase()}
            </span>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {guide.sweetSpots.map((spot) => {
                const clickable = spot.airportCode && onSelectDestination;
                return (
                  <button
                    key={`${currency}-${spot.destination}`}
                    type="button"
                    disabled={!clickable}
                    onClick={() => {
                      if (spot.airportCode && onSelectDestination) {
                        onSelectDestination(spot.airportCode);
                      }
                    }}
                    className={`relative overflow-hidden border text-left transition-colors ${
                      clickable ? "hover:border-primary cursor-pointer" : "cursor-default"
                    }`}
                  >
                    {/* Image */}
                    {spot.image && (
                      <div className="relative h-28 w-full">
                        <Image
                          src={spot.image}
                          alt={spot.destination}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 300px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3">
                          <span className="text-sm font-semibold text-white">
                            {spot.destination}
                          </span>
                        </div>
                      </div>
                    )}
                    {!spot.image && (
                      <div className="flex h-28 items-end bg-muted p-3">
                        <span className="text-sm font-semibold">
                          {spot.destination}
                        </span>
                      </div>
                    )}
                    {/* Details */}
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground">{spot.via}</p>
                      <p className="mono mt-0.5 text-sm">{spot.points}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
