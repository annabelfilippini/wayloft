"use client";

import { useState } from "react";
import {
  Plane,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import type { EnrichedFlight } from "@/lib/flights/types";
import type { PriceView } from "./price-toggle";

interface FlightCardProps {
  flight: EnrichedFlight;
  priceView?: PriceView;
}

export function FlightCard({ flight, priceView = "cash" }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const cashPrice = parseFloat(flight.totalAmount);
  const bestCard = flight.cardRecommendations[0];
  const portal = flight.bestPortalOption;

  return (
    <div className="border bg-card transition-colors hover:border-foreground/20">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        {/* Flight info */}
        <div className="flex-1 space-y-2">
          {flight.slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 shrink-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  {slice.airlineName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {slice.flightNumbers.join(", ")}
                </p>
              </div>

              <div className="flex flex-1 items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatTime(slice.departureTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {slice.origin}
                  </p>
                </div>

                <div className="flex flex-1 flex-col items-center">
                  <p className="text-[10px] text-muted-foreground">
                    {slice.duration}
                  </p>
                  <div className="flex w-full items-center gap-1">
                    <div className="h-px flex-1 bg-border" />
                    <Plane className="h-3 w-3 text-muted-foreground" />
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {slice.stops === 0
                      ? "Nonstop"
                      : `${slice.stops} stop${slice.stops > 1 ? "s" : ""}`}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    {formatTime(slice.arrivalTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {slice.destination}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price display — adapts to priceView */}
        <div className="shrink-0 text-right">
          <PriceDisplay
            cashPrice={cashPrice}
            portal={portal}
            bestCard={bestCard}
            priceView={priceView}
          />
          {expanded ? (
            <ChevronUp className="mt-1 ml-auto h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="mt-1 ml-auto h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* Card recommendations */}
          {flight.cardRecommendations.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="label-signal text-muted-foreground">BEST CARDS FOR THIS FLIGHT</span>
              </h4>
              <div className="mt-2 space-y-1.5">
                {flight.cardRecommendations.slice(0, 3).map((rec, i) => (
                  <div
                    key={rec.cardSlug}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                      i === 0 ? "bg-primary/5 font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <div>
                      <span>{rec.cardName}</span>
                      {rec.hasForeignTransactionFee && (
                        <span className="ml-2 text-xs text-amber-500">
                          FTF
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="mono">
                        {rec.multiplier}x {rec.currency}
                      </span>
                      <span className="mono ml-2 text-xs text-muted-foreground">
                        (~${rec.pointsValue.toFixed(0)} back)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cash vs points comparison */}
          {portal && (
            <div>
              <h4 className="flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="label-signal text-muted-foreground">CASH VS POINTS</span>
              </h4>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="border px-3 py-2">
                  <p className="label-signal text-muted-foreground">
                    PAY CASH
                  </p>
                  <p className="mono text-sm font-semibold mt-1">
                    ${cashPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  {bestCard && (
                    <p className="mono text-[10px] text-muted-foreground">
                      Earn {bestCard.pointsEarned.toLocaleString()} {bestCard.currency} ({bestCard.multiplier}x)
                    </p>
                  )}
                </div>
                <div className="border px-3 py-2">
                  <p className="label-signal text-muted-foreground">
                    PAY WITH POINTS
                  </p>
                  <p className="mono text-sm font-semibold mt-1">
                    {portal.pointsCost.toLocaleString()} {portal.currency}
                  </p>
                  <p className="mono text-[10px] text-muted-foreground">
                    via {portal.cardName} portal ({portal.portalCpp}cpp)
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {compareValue(cashPrice, portal.pointsCost, portal.portalCpp)}
              </p>
            </div>
          )}

          {/* Flight details */}
          <div className="text-xs text-muted-foreground">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {flight.cabinClass.replace("_", " ")}
              </span>
              {flight.baggageIncluded && (
                <span>Checked bag included</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceDisplay({
  cashPrice,
  portal,
  bestCard,
  priceView,
}: {
  cashPrice: number;
  portal: EnrichedFlight["bestPortalOption"];
  bestCard: EnrichedFlight["cardRecommendations"][0] | undefined;
  priceView: PriceView;
}) {
  if (priceView === "points" && portal) {
    return (
      <>
        <p className="mono text-lg">
          {portal.pointsCost.toLocaleString()} pts
        </p>
        <p className="text-xs text-muted-foreground">
          {portal.currency} via {portal.cardName.split(" ").slice(-1)}
        </p>
        <p className="mono text-[10px] text-muted-foreground">
          ${cashPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} cash
        </p>
      </>
    );
  }

  if (priceView === "cpp" && portal) {
    const effectiveCpp = (cashPrice / portal.pointsCost) * 100;
    const isGoodDeal = effectiveCpp >= portal.portalCpp;
    return (
      <>
        <p className={`mono text-lg ${isGoodDeal ? "text-success" : ""}`}>
          {effectiveCpp.toFixed(1)}cpp
        </p>
        <p className="mono text-xs text-muted-foreground">
          {portal.pointsCost.toLocaleString()} {portal.currency}
        </p>
        <p className="mono text-[10px] text-muted-foreground">
          ${cashPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} cash
        </p>
      </>
    );
  }

  // Default: cash view
  return (
    <>
      <p className="mono text-lg">
        ${cashPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </p>
      {bestCard && (
        <p className="mono text-xs text-muted-foreground">
          {bestCard.multiplier}x on {bestCard.cardName.split(" ").slice(-1)}
        </p>
      )}
    </>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function compareValue(
  cashPrice: number,
  pointsCost: number,
  portalCpp: number
): string {
  const pointsValueInDollars = (pointsCost * portalCpp) / 100;
  const diff = cashPrice - pointsValueInDollars;

  if (Math.abs(diff) < 1) {
    return "About the same value as paying cash.";
  } else if (diff > 0) {
    return `Points save you ~$${diff.toFixed(0)} vs cash. Good deal.`;
  } else {
    return `Cash is ~$${Math.abs(diff).toFixed(0)} cheaper. Pay cash and earn points instead.`;
  }
}
