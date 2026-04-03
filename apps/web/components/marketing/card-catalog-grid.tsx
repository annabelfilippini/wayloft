"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { CatalogCard } from "@wayloft/shared";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { Badge } from "@/components/ui/badge";

const ISSUER_LABELS: Record<string, string> = {
  chase: "Chase",
  amex: "Amex",
  citi: "Citi",
  capital_one: "Capital One",
  bilt: "Bilt",
  wells_fargo: "Wells Fargo",
  barclays: "Barclays",
  us_bank: "U.S. Bank",
  bank_of_america: "Bank of America",
  discover: "Discover",
};

export function CardCatalogGrid({ cards }: { cards: CatalogCard[] }) {
  const [issuerFilter, setIssuerFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const issuers = useMemo(() => {
    const set = new Set(cards.map((c) => c.issuer));
    return [...set].sort();
  }, [cards]);

  const filtered = useMemo(() => {
    let result = cards;
    if (issuerFilter !== "all") {
      result = result.filter((c) => c.issuer === issuerFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.best_for.some((b) => b.toLowerCase().includes(q))
      );
    }
    return result;
  }, [cards, issuerFilter, search]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-64"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIssuerFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              issuerFilter === "all"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {issuers.map((issuer) => (
            <button
              key={issuer}
              onClick={() =>
                setIssuerFilter(issuerFilter === issuer ? "all" : issuer)
              }
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                issuerFilter === issuer
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {ISSUER_LABELS[issuer] ?? issuer}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((card) => (
          <Link
            key={card.slug}
            href={`/credit-cards/${card.slug}`}
            className="group border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-accent/30"
          >
            <CardArtPlaceholder
              issuer={card.issuer}
              network={card.network}
              cardName={card.name}
              className="mb-4"
            />
            <h2 className="text-sm font-semibold group-hover:underline">
              {card.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {ISSUER_LABELS[card.issuer] ?? card.issuer}
              {" · "}
              {card.annual_fee_cents === 0
                ? "No annual fee"
                : `$${(card.annual_fee_cents / 100).toFixed(0)}/yr`}
            </p>
            {card.best_for.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.best_for.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 text-[10px] dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No cards match your filters.
        </p>
      )}
    </div>
  );
}
