"use client";

import { useState } from "react";
import type { CatalogCard } from "@wayloft/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { X } from "lucide-react";

interface StepCardsProps {
  catalog: CatalogCard[];
  selected: string[];
  onSelect: (slugs: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  onSkip: () => void;
}

// Popular cards shown as quick picks
const popularSlugs = [
  "chase-sapphire-preferred",
  "chase-sapphire-reserve",
  "amex-gold",
  "amex-platinum",
  "capital-one-venture-x",
  "citi-staar",
  "chase-freedom-unlimited",
  "amex-blue-cash-preferred",
];

export function StepCards({
  catalog,
  selected,
  onSelect,
  onNext,
  onBack,
  onSkip,
}: StepCardsProps) {
  const [showSearch, setShowSearch] = useState(false);
  const catalogMap = new Map(catalog.map((c) => [c.slug, c]));
  const popularCards = popularSlugs
    .map((s) => catalogMap.get(s))
    .filter(Boolean) as CatalogCard[];

  function toggleCard(slug: string) {
    if (selected.includes(slug)) {
      onSelect(selected.filter((s) => s !== slug));
    } else {
      onSelect([...selected, slug]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Which cards do you have?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the credit cards in your wallet. You can always add more later.
        </p>
      </div>

      {/* Selected cards */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((slug) => {
            const card = catalogMap.get(slug);
            return (
              <Badge
                key={slug}
                variant="secondary"
                className="gap-1 py-1 pl-2 pr-1"
              >
                {card?.name ?? slug}
                <button
                  type="button"
                  onClick={() => toggleCard(slug)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Popular cards grid */}
      {!showSearch && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            Popular cards
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {popularCards.map((card) => {
              const isSelected = selected.includes(card.slug);
              return (
                <button
                  key={card.slug}
                  type="button"
                  onClick={() => toggleCard(card.slug)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="w-12 shrink-0">
                    <CardArtPlaceholder
                      issuer={card.issuer}
                      network={card.network}
                      cardName=""
                      className="text-[5px]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{card.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.currency}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search all cards */}
      {showSearch ? (
        <div className="space-y-2">
          <Command className="rounded-lg border">
            <CommandInput placeholder="Search all cards..." />
            <CommandList className="max-h-[200px]">
              <CommandEmpty>No cards found.</CommandEmpty>
              <CommandGroup>
                {catalog.map((card) => (
                  <CommandItem
                    key={card.slug}
                    value={`${card.name} ${card.issuer} ${card.currency}`}
                    onSelect={() => toggleCard(card.slug)}
                    className="flex items-center gap-3 py-2"
                  >
                    <div
                      className={`h-3 w-3 rounded-sm border ${
                        selected.includes(card.slug)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    />
                    <span className="truncate text-sm">{card.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {card.currency}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(false)}
          >
            Show popular cards
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSearch(true)}
        >
          Search all {catalog.length} cards
        </Button>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              Back
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
        <Button onClick={onNext}>
          {selected.length > 0
            ? `Continue with ${selected.length} card${selected.length !== 1 ? "s" : ""}`
            : "Continue"}
        </Button>
      </div>
    </div>
  );
}
