"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface StepCreditProps {
  creditScore: string;
  cardsOpened24mo: number;
  onCreditScoreChange: (value: string) => void;
  onCardsOpenedChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const scoreOptions = [
  {
    value: "excellent",
    label: "Excellent",
    description: "750+",
    icon: ShieldCheck,
  },
  {
    value: "good",
    label: "Good",
    description: "700–749",
    icon: Shield,
  },
  {
    value: "fair",
    label: "Fair",
    description: "650–699",
    icon: ShieldAlert,
  },
  {
    value: "poor",
    label: "Building",
    description: "Below 650",
    icon: ShieldX,
  },
];

export function StepCredit({
  creditScore,
  cardsOpened24mo,
  onCreditScoreChange,
  onCardsOpenedChange,
  onNext,
  onBack,
}: StepCreditProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Your credit profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This helps us recommend cards you're likely to be approved for.
        </p>
      </div>

      {/* Credit score */}
      <div className="space-y-3">
        <Label>Credit score range</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {scoreOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = creditScore === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onCreditScoreChange(option.value)}
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

      {/* Cards opened in 24 months */}
      <div className="space-y-2">
        <Label htmlFor="cards_opened">
          Cards opened in the past 24 months
        </Label>
        <p className="text-xs text-muted-foreground">
          This affects eligibility for Chase cards (5/24 rule) and others.
        </p>
        <Input
          id="cards_opened"
          type="number"
          min={0}
          max={15}
          value={cardsOpened24mo}
          onChange={(e) =>
            onCardsOpenedChange(parseInt(e.target.value, 10) || 0)
          }
          className="w-20"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!creditScore}>
          Continue
        </Button>
      </div>
    </div>
  );
}
