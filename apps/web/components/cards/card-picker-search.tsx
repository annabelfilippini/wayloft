"use client";

import type { CatalogCard } from "@wayloft/shared";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CardArtPlaceholder } from "./card-art-placeholder";

interface CardPickerSearchProps {
  catalog: CatalogCard[];
  onSelect: (card: CatalogCard) => void;
}

export function CardPickerSearch({ catalog, onSelect }: CardPickerSearchProps) {
  // Group cards by issuer for better organization
  const byIssuer = catalog.reduce<Record<string, CatalogCard[]>>((acc, card) => {
    const key = card.issuer;
    if (!acc[key]) acc[key] = [];
    acc[key].push(card);
    return acc;
  }, {});

  const issuers = Object.keys(byIssuer).sort();

  return (
    <Command className="rounded-lg">
      <CommandInput placeholder="Search cards..." />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>No cards found.</CommandEmpty>
        {issuers.map((issuer) => (
          <CommandGroup
            key={issuer}
            heading={issuer.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          >
            {byIssuer[issuer].map((card) => (
              <CommandItem
                key={card.slug}
                value={`${card.name} ${card.issuer} ${card.currency}`}
                onSelect={() => onSelect(card)}
                className="flex items-center gap-3 py-2"
              >
                <div className="w-16 shrink-0">
                  <CardArtPlaceholder
                    issuer={card.issuer}
                    network={card.network}
                    cardName={card.name}
                    hideLabels
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{card.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.currency} &middot;{" "}
                    {card.annual_fee_cents > 0
                      ? `$${card.annual_fee_cents / 100}/yr`
                      : "No AF"}
                    {card.signup_bonus?.points > 0 &&
                      ` \u00b7 ${(card.signup_bonus.points / 1000).toFixed(0)}k bonus`}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
