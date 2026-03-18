"use client";

import { useState } from "react";
import { Plane, AlertCircle } from "lucide-react";
import { SearchForm } from "@/components/flights/search-form";
import { FlightCard } from "@/components/flights/flight-card";
import type { EnrichedFlight } from "@/lib/flights/types";

export default function SearchPage() {
  const [flights, setFlights] = useState<EnrichedFlight[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  function handleResults(results: EnrichedFlight[]) {
    setFlights(results);
    setHasSearched(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Flight Search</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search flights and see which card earns the most on your booking.
      </p>

      {/* Search form */}
      <div className="mt-6 rounded-lg border bg-card p-4">
        <SearchForm
          onResults={handleResults}
          onError={setError}
          onLoading={setIsLoading}
        />
      </div>

      {/* Sandbox notice */}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Powered by Duffel. Southwest, Allegiant, and Breeze not available.
      </p>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border bg-muted/50"
            />
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && flights.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            {flights.length} flight{flights.length !== 1 ? "s" : ""} found
          </p>
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && hasSearched && flights.length === 0 && !error && (
        <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
          <Plane className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No flights found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Try different dates or airports.
          </p>
        </div>
      )}
    </div>
  );
}
