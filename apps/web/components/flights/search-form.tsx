"use client";

import { useState } from "react";
import { Search, Loader2, ArrowRightLeft } from "lucide-react";
import { AirportInput } from "./airport-input";
import type { EnrichedFlight } from "@/lib/flights/types";

interface SearchFormProps {
  onResults: (flights: EnrichedFlight[]) => void;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
}

export function SearchForm({ onResults, onError, onLoading }: SearchFormProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<string>("economy");
  const [isSearching, setIsSearching] = useState(false);

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

    try {
      const res = await fetch("/api/flights/search", {
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
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Search failed (${res.status})`);
      }

      const data = await res.json();
      onResults(data.offers);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Search failed";
      onError(msg);
      onResults([]);
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
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
            {[1, 2, 3, 4, 5, 6].map((n) => (
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
