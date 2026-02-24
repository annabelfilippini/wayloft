"use client";

import { useState } from "react";
import {
  ChevronDown,
  UtensilsCrossed,
  Plane,
  ShoppingCart,
  Fuel,
  Tv,
  ShoppingBag,
  TrainFront,
  Pill,
  Ticket,
  Home,
  Zap,
  CircleDollarSign,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CategoryRecommendation } from "@wayloft/shared";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { CategoryDetail } from "./category-detail";

const GAP_SUGGESTIONS: Record<string, string> = {
  dining: "Consider: Amex Gold (4x) or Bilt Mastercard (3x)",
  gas: "Consider: Citi Custom Cash (5x) or Amex Blue Cash Preferred (3%)",
  groceries: "Consider: Amex Gold (4x) or Blue Cash Preferred (6%)",
  streaming: "Consider: Citi Custom Cash (5x) or US Bank Altitude Go (4x)",
  transit: "Consider: Bilt Mastercard (2x) or Chase Freedom Flex (3x)",
};

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Plane,
  ShoppingCart,
  Fuel,
  Tv,
  ShoppingBag,
  TrainFront,
  Pill,
  Ticket,
  Home,
  Zap,
  CircleDollarSign,
};

interface CategoryRowProps {
  recommendation: CategoryRecommendation;
  iconName: string;
  catalogMap: Map<string, { network: string }>;
}

export function CategoryRow({
  recommendation,
  iconName,
  catalogMap,
}: CategoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { category, displayName, rankings } = recommendation;
  const top = rankings[0];

  const IconComponent = ICON_MAP[iconName] ?? CircleDollarSign;

  if (!top) {
    const suggestion = GAP_SUGGESTIONS[category] ?? "No bonus card — consider adding one";
    return (
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {displayName}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Lightbulb className="h-3.5 w-3.5 shrink-0" />
          {suggestion}
        </span>
      </div>
    );
  }

  const meta = catalogMap.get(top.cardSlug);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        {/* Category icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Category name */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {top.cardName}
          </p>
        </div>

        {/* Winning card mini art */}
        <div className="hidden w-16 shrink-0 sm:block">
          <CardArtPlaceholder
            issuer={top.issuer}
            network={meta?.network ?? "visa"}
            cardName={top.cardName}
          />
        </div>

        {/* Multiplier badge */}
        <div className="shrink-0 text-right">
          <span className="inline-block rounded-md bg-accent/15 px-2 py-0.5 text-sm font-bold text-accent-foreground">
            {top.multiplier}x
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {top.effectiveCents.toFixed(1)}¢/$
          </p>
        </div>

        {/* Expand chevron */}
        {rankings.length > 1 && (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Cap warning on winner */}
      {top.capWarning && (
        <div className="border-t border-border/50 px-4 py-1.5">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            {top.capWarning}
          </p>
        </div>
      )}

      {/* Expanded detail */}
      {expanded && rankings.length > 1 && (
        <div className="border-t border-border/50 px-4 pb-3">
          <CategoryDetail rankings={rankings} catalogMap={catalogMap} />
        </div>
      )}
    </div>
  );
}
