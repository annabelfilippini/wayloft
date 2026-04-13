"use client";

import { useState, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import {
  SearchForm,
  type SearchFormSubmission,
} from "@/components/flights/search-form";
import { FlightCard } from "@/components/flights/flight-card";
import { PriceToggle, type PriceView } from "@/components/flights/price-toggle";
import { BonusSidebar } from "./bonus-sidebar";
import { SweetSpotsPanel } from "./sweet-spots-panel";
import { ComparisonView } from "./comparison-view";
import type { AwardSearchResult, EnrichedFlight } from "@/lib/flights/types";
import { computeCashVsPoints } from "@/lib/flights/compare";
import type { TransferBonus, LoyaltyBalance } from "@wayloft/shared";
import type { CurrencyTravelGuide } from "@/lib/cards/sweet-spots";

interface TravelClientProps {
  sweetSpots: Record<string, CurrencyTravelGuide>;
  userCurrencies: string[];
  myBonuses: TransferBonus[];
  allBonuses: TransferBonus[];
  balances: Pick<LoyaltyBalance, "program_code" | "balance" | "currency">[];
  initialDestination?: string;
}

export function TravelClient({
  sweetSpots,
  userCurrencies,
  myBonuses,
  allBonuses,
  balances,
  initialDestination,
}: TravelClientProps) {
  const [flights, setFlights] = useState<EnrichedFlight[]>([]);
  const [awardResult, setAwardResult] = useState<AwardSearchResult | null>(
    null
  );
  const [submission, setSubmission] = useState<SearchFormSubmission | null>(
    null
  );
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [priceView, setPriceView] = useState<PriceView>("cash");
  const [selectedDestination, setSelectedDestination] = useState(
    initialDestination ?? ""
  );

  const hasPortalOptions = flights.some((f) => f.bestPortalOption !== null);

  const comparison = useMemo(() => {
    if (!submission) return null;
    return computeCashVsPoints({
      origin: submission.origin,
      destination: submission.destination,
      date: submission.departureDate,
      passengers: submission.passengers,
      cabinClass: submission.cabinClass,
      flights,
      awardResult,
      balances,
      bonuses: myBonuses,
    });
  }, [submission, flights, awardResult, balances, myBonuses]);

  // Extract currencies from flight card recommendations to highlight relevant bonuses
  const highlightCurrencies = useMemo(() => {
    if (flights.length === 0) return undefined;
    const currencies = new Set<string>();
    for (const flight of flights) {
      for (const rec of flight.cardRecommendations) {
        if (rec.currency) currencies.add(rec.currency.toUpperCase());
      }
    }
    return currencies.size > 0 ? Array.from(currencies) : undefined;
  }, [flights]);

  function handleResults(results: EnrichedFlight[]) {
    setFlights(results);
    setHasSearched(true);
  }

  function handleSelectDestination(code: string) {
    setSelectedDestination(code);
    // Scroll to search form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Search form — full width */}
      <div className="border bg-card p-4">
        <SearchForm
          onResults={handleResults}
          onError={setError}
          onLoading={setIsLoading}
          onAwardResults={setAwardResult}
          onSubmission={setSubmission}
          initialDestination={selectedDestination}
        />
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Powered by Duffel. Southwest, Allegiant, and Breeze not available.
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main content: results/sweet spots + bonus sidebar */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        {/* Left column */}
        <div>
          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse border bg-muted/50" />
              ))}
            </div>
          )}

          {/* Comparison card (cash vs points) */}
          {!isLoading && hasSearched && comparison && (
            <div className="mb-6">
              <ComparisonView result={comparison} />
            </div>
          )}

          {/* Flight results */}
          {!isLoading && flights.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="mono">{flights.length}</span> flight
                  {flights.length !== 1 ? "s" : ""} found
                </p>
                {hasPortalOptions && (
                  <PriceToggle value={priceView} onChange={setPriceView} />
                )}
              </div>
              {flights.map((flight) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  priceView={priceView}
                />
              ))}
            </div>
          )}

          {/* No results */}
          {!isLoading && hasSearched && flights.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center border border-dashed py-12 text-center">
              <h2 className="text-lg font-semibold tracking-[-0.01em]">
                No flights found
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try different dates or airports.
              </p>
            </div>
          )}

          {/* Pre-search: sweet spots */}
          {!isLoading && !hasSearched && (
            <div>
              <span className="label-signal text-muted-foreground">
                WHERE TO GO
              </span>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">
                Popular redemptions for your points. Tap a destination to search
                flights.
              </p>
              <SweetSpotsPanel
                sweetSpots={sweetSpots}
                userCurrencies={userCurrencies}
                onSelectDestination={handleSelectDestination}
              />
            </div>
          )}
        </div>

        {/* Right column: bonus sidebar */}
        <div>
          <BonusSidebar
            myBonuses={myBonuses}
            allBonuses={allBonuses}
            balances={balances}
            highlightCurrencies={highlightCurrencies}
          />
        </div>
      </div>
    </div>
  );
}
