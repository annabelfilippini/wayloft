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

  // Set label from initial value
  useEffect(() => {
    if (value && !selectedLabel) {
      const match = airportList.find((a) => a.iata === value);
      if (match) setSelectedLabel(`${match.iata} — ${match.city}`);
    }
  }, [value, selectedLabel]);

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

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={selectedLabel || query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (selectedLabel) {
            setSelectedLabel("");
            setQuery("");
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {results.map((airport) => (
            <button
              key={airport.iata}
              type="button"
              onClick={() => selectAirport(airport)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="font-mono font-semibold">{airport.iata}</span>
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
