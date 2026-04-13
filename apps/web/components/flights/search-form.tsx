"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ArrowRightLeft } from "lucide-react";
import { AirportInput } from "./airport-input";
import type { AwardSearchResult, EnrichedFlight } from "@/lib/flights/types";

export interface SearchFormSubmission {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
  cabinClass: string;
}

interface SearchFormProps {
  onResults: (flights: EnrichedFlight[]) => void;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
  onAwardResults?: (result: AwardSearchResult | null) => void;
  onSubmission?: (submission: SearchFormSubmission) => void;
  initialDestination?: string;
}

export function SearchForm({
  onResults,
  onError,
  onLoading,
  onAwardResults,
  onSubmission,
  initialDestination,
}: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState(initialDestination ?? "");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<string>("economy");
  const [isSearching, setIsSearching] = useState(false);

  // Sync destination when initialDestination changes (e.g. sweet spot click)
  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  function swapAirports() {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!origin || !destination || !departureDate) {
      onError("Please fill in origin, destination, and departure date.");
      return;
    }

    setIsSearching(true);
    onLoading(true);
    onError("");
    onSubmission?.({
      origin,
      destination,
      departureDate,
      passengers,
      cabinClass,
    });

    const cashPromise = fetch("/api/flights/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        passengers,
        cabinClass,
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Search failed (${res.status})`);
      }
      return res.json();
    });

    const awardsUrl = new URL("/api/flights/awards", window.location.origin);
    awardsUrl.searchParams.set("origin", origin.toUpperCase());
    awardsUrl.searchParams.set("destination", destination.toUpperCase());
    awardsUrl.searchParams.set("start_date", departureDate);
    awardsUrl.searchParams.set("end_date", departureDate);
    const awardsPromise = fetch(awardsUrl.toString()).then(async (res) => {
      if (!res.ok) return null;
      const body = await res.json().catch(() => null);
      if (!body?.success) return null;
      return body.data as AwardSearchResult;
    });

    const [cashResult, awardsResult] = await Promise.allSettled([
      cashPromise,
      awardsPromise,
    ]);

    if (cashResult.status === "fulfilled") {
      onResults(cashResult.value.offers ?? []);
    } else {
      onResults([]);
      onError(
        cashResult.reason instanceof Error
          ? cashResult.reason.message
          : "Search failed"
      );
    }

    if (onAwardResults) {
      onAwardResults(
        awardsResult.status === "fulfilled" ? awardsResult.value : null
      );
    }

    setIsSearching(false);
    onLoading(false);
  }

  // Min date is today
  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Airports row */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <AirportInput
            value={origin}
            onChange={setOrigin}
            placeholder="e.g. JFK"
            label="From"
          />
        </div>
        <button
          type="button"
          onClick={swapAirports}
          className="mb-0.5 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
          title="Swap airports"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <AirportInput
            value={destination}
            onChange={setDestination}
            placeholder="e.g. LAX"
            label="To"
          />
        </div>
      </div>

      {/* Dates + options row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Depart
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={today}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Return (optional)
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={departureDate || today}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Passengers
          </label>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "passenger" : "passengers"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Cabin
          </label>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="economy">Economy</option>
            <option value="premium_economy">Premium Economy</option>
            <option value="business">Business</option>
            <option value="first">First</option>
          </select>
        </div>
      </div>

      {/* Search button */}
      <button
        type="submit"
        disabled={isSearching || !origin || !destination || !departureDate}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isSearching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching flights...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Search Flights
          </>
        )}
      </button>
    </form>
  );
}
