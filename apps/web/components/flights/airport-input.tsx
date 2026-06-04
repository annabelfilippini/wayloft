"use client";

import { useState, useRef, useEffect } from "react";
import airports from "../../../../data/airports.json";

interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
}

const airportList = airports as Airport[];

interface AirportInputProps {
  value: string;
  onChange: (iata: string) => void;
  placeholder: string;
  label: string;
}

export function AirportInput({
  value,
  onChange,
  placeholder,
  label,
}: AirportInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);
    setSelectedLabel("");
    onChange("");

    if (text.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const q = text.toLowerCase();
    const matches = airportList
      .filter(
        (a) =>
          a.iata.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
      )
      .slice(0, 8);

    setResults(matches);
    setIsOpen(matches.length > 0);
  }

  function selectAirport(airport: Airport) {
    onChange(airport.iata);
    setSelectedLabel(`${airport.iata} — ${airport.city}`);
    setQuery("");
    setIsOpen(false);
  }

  const valueLabel = value
    ? airportList.find((a) => a.iata === value)?.city
    : null;
  const displayValue =
    selectedLabel || query || (valueLabel ? `${value} — ${valueLabel}` : "");

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-base font-semibold text-foreground">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (selectedLabel || value) {
            setSelectedLabel("");
            setQuery("");
            onChange("");
          }
        }}
        placeholder={placeholder}
        className="h-[58px] w-full rounded-xl border border-input bg-card px-4 text-2xl font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full border bg-popover">
          {results.map((airport) => (
            <button
              key={airport.iata}
              type="button"
              onClick={() => selectAirport(airport)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="mono font-semibold">{airport.iata}</span>
              <span className="text-muted-foreground">
                {airport.city} — {airport.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
