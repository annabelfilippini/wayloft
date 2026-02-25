"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Ban,
  CircleDollarSign,
  DollarSign,
  Gem,
  Plane,
  Banknote,
  Building2,
  Star,
} from "lucide-react";

interface StepPreferencesProps {
  annualFeeComfort: string;
  travelGoal: string;
  onAnnualFeeChange: (value: string) => void;
  onTravelGoalChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const feeOptions = [
  { value: "none", label: "No fee", description: "$0", icon: Ban },
  {
    value: "low",
    label: "Low",
    description: "Up to $95/yr",
    icon: CircleDollarSign,
  },
  {
    value: "medium",
    label: "Medium",
    description: "Up to $250/yr",
    icon: DollarSign,
  },
  {
    value: "high",
    label: "Premium",
    description: "$250+/yr",
    icon: Gem,
  },
];

const goalOptions = [
  {
    value: "maximize_travel",
    label: "Maximize travel",
    description: "Fly further for less with points & miles",
    icon: Plane,
  },
  {
    value: "cashback",
    label: "Cashback rewards",
    description: "Earn cash back on everyday spending",
    icon: Banknote,
  },
  {
    value: "hotel_stays",
    label: "Hotel stays",
    description: "Earn free nights and elite status",
    icon: Building2,
  },
  {
    value: "airline_status",
    label: "Airline status",
    description: "Earn or maintain elite status",
    icon: Star,
  },
];

export function StepPreferences({
  annualFeeComfort,
  travelGoal,
  onAnnualFeeChange,
  onTravelGoalChange,
  onNext,
  onBack,
}: StepPreferencesProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Your preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help us narrow down the right cards for you.
        </p>
      </div>

      {/* Annual fee comfort */}
      <div className="space-y-3">
        <Label>Annual fee comfort</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {feeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = annualFeeComfort === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onAnnualFeeChange(option.value)}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Travel goal */}
      <div className="space-y-3">
        <Label>What's your primary goal?</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {goalOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = travelGoal === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onTravelGoalChange(option.value)}
                className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!annualFeeComfort || !travelGoal}>
          Continue
        </Button>
      </div>
    </div>
  );
}
