"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface StepConfirmProps {
  spending: Record<string, number>;
  creditScore: string;
  cardsOpened24mo: number;
  cardsOpened48mo: number;
  currentCardSlugs: string[];
  annualFeeComfort: string;
  travelGoal: string;
  cardNames: Map<string, string>;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
  isSubmitted: boolean;
}

const spendingLabels: Record<string, string> = {
  monthly_dining_spend: "Dining",
  monthly_travel_spend: "Travel",
  monthly_grocery_spend: "Groceries",
  monthly_gas_spend: "Gas",
  monthly_streaming_spend: "Streaming",
  monthly_other_spend: "Everything Else",
};

const creditScoreLabels: Record<string, string> = {
  excellent: "Excellent (750+)",
  good: "Good (700–749)",
  fair: "Fair (650–699)",
  poor: "Building (<650)",
};

const feeLabels: Record<string, string> = {
  none: "No annual fee",
  low: "Up to $95/yr",
  medium: "Up to $250/yr",
  high: "$250+/yr",
};

const goalLabels: Record<string, string> = {
  maximize_travel: "Maximize travel",
  cashback: "Cashback rewards",
  hotel_stays: "Hotel stays",
  airline_status: "Airline status",
};

export function StepConfirm({
  spending,
  creditScore,
  cardsOpened24mo,
  cardsOpened48mo,
  currentCardSlugs,
  annualFeeComfort,
  travelGoal,
  cardNames,
  onSubmit,
  onBack,
  isPending,
  isSubmitted,
}: StepConfirmProps) {
  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Quiz saved!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your spending profile has been saved. Personalized card
            recommendations are coming soon — we'll use this data to find
            cards that maximize your rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Review your answers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Make sure everything looks right before saving.
        </p>
      </div>

      {/* Spending summary */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Monthly Spending</p>
        <div className="grid gap-1">
          {Object.entries(spendingLabels).map(([key, label]) => {
            const amount = spending[key] ?? 0;
            return (
              <div
                key={key}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums">${amount.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Credit profile */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Credit Profile</p>
        <div className="grid gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score range</span>
            <span>{creditScoreLabels[creditScore] ?? "Not set"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cards opened (2 yrs)</span>
            <span>{cardsOpened24mo}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cards opened (4 yrs)</span>
            <span>{cardsOpened48mo}</span>
          </div>
        </div>
      </div>

      {/* Current cards */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Current Cards</p>
        {currentCardSlugs.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {currentCardSlugs.map((slug) => (
              <span
                key={slug}
                className="rounded-md bg-muted px-2 py-1 text-xs"
              >
                {cardNames.get(slug) ?? slug}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">None selected</p>
        )}
      </div>

      {/* Preferences */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Preferences</p>
        <div className="grid gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Annual fee</span>
            <span>{feeLabels[annualFeeComfort] ?? "Not set"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Goal</span>
            <span>{goalLabels[travelGoal] ?? "Not set"}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending ? "Saving..." : "Save my profile"}
        </Button>
      </div>
    </div>
  );
}
