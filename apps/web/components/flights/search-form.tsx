"use client";

import { useState } from "react";
import { Search, Loader2, ArrowRightLeft } from "lucide-react";
import { AirportInput } from "./airport-input";
import type { AwardSearchResult, EnrichedFlight } from "@/lib/flights/types";

export interface SearchFormSubmission {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  tripType: "round_trip" | "one_way";
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
  const [tripType, setTripType] = useState<"round_trip" | "one_way">(
    "round_trip"
  );
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

  function handleTripTypeChange(nextTripType: "round_trip" | "one_way") {
    setTripType(nextTripType);
    if (nextTripType === "one_way") setReturnDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!origin || !destination || !departureDate) {
      onError("Please fill in origin, destination, and departure date.");
      return;
    }

    if (tripType === "round_trip" && !returnDate) {
      onError("Please add a return date or choose one-way.");
      return;
    }

    setIsSearching(true);
    onLoading(true);
    onError("");
    onSubmission?.({
      origin,
      destination,
      departureDate,
      returnDate: tripType === "round_trip" ? returnDate : undefined,
      tripType,
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
        returnDate: tripType === "round_trip" ? returnDate : undefined,
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
  const inputClass =
    "h-[58px] w-full rounded-xl border border-input bg-card px-4 text-xl font-medium focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form
      onSubmit={handleSubmit}
      className="[font-family:Arial,Helvetica,sans-serif]"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[
          { value: "round_trip", label: "Round trip" },
          { value: "one_way", label: "One-way" },
        ].map((option) => {
          const active = tripType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                handleTripTypeChange(option.value as "round_trip" | "one_way")
              }
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/70"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1.15fr)_32px_minmax(0,1.15fr)_minmax(150px,0.9fr)_minmax(150px,0.9fr)_minmax(160px,0.9fr)_minmax(150px,0.9fr)_200px]">
        <div>
          <AirportInput
            value={origin}
            onChange={setOrigin}
            placeholder="SJC"
            label="From"
          />
        </div>
        <button
          type="button"
          onClick={swapAirports}
          className="mb-[14px] flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-card"
          title="Swap airports"
        >
          <ArrowRightLeft className="h-6 w-6" />
        </button>
        <div>
          <AirportInput
            value={destination}
            onChange={setDestination}
            placeholder="DEN"
            label="To"
          />
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold text-foreground">
            Depart
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => {
              setDepartureDate(e.target.value);
              if (returnDate && returnDate < e.target.value) {
                setReturnDate("");
              }
            }}
            min={today}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold text-foreground">
            Return
          </label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={departureDate || today}
            required={tripType === "round_trip"}
            disabled={tripType === "one_way"}
            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-45`}
          />
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold text-foreground">
            Travelers
          </label>
          <select
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
            className={inputClass}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "Adult" : "Adults"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-base font-semibold text-foreground">
            Show price in
          </label>
          <select
            className={inputClass}
            defaultValue="best"
          >
            <option value="best">Best option</option>
            <option value="cash">Money</option>
            <option value="points">Points</option>
          </select>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={
              isSearching ||
              !origin ||
              !destination ||
              !departureDate ||
              (tripType === "round_trip" && !returnDate)
            }
            className="h-[58px] rounded-full border-2 border-primary bg-primary px-8 text-xl font-bold text-primary-foreground transition-[filter,opacity] hover:brightness-110 disabled:opacity-50"
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Checking
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Search className="h-5 w-5" />
                Update
              </span>
            )}
          </button>
        </div>
      </div>

      <details className="mt-4 text-right">
        <summary className="cursor-pointer text-sm font-medium text-primary underline">
          Advanced Search
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Cabin
            </label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
              className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>
      </details>
    </form>
  );
}
