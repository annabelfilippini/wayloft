"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Banknote, Building2, Star } from "lucide-react";

interface StepGoalsProps {
  onSubmit: (goal: string, airport: string) => void;
  onBack: () => void;
  onSkip: () => void;
  isPending: boolean;
}

const goals = [
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

export function StepGoals({ onSubmit, onBack, onSkip, isPending }: StepGoalsProps) {
  const [selectedGoal, setSelectedGoal] = useState("");
  const [airport, setAirport] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">What are your travel goals?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This helps us prioritize the most relevant insights for you.
        </p>
      </div>

      {/* Goals grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.value;
          return (
            <button
              key={goal.value}
              type="button"
              onClick={() => setSelectedGoal(goal.value)}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{goal.label}</p>
                <p className="text-xs text-muted-foreground">
                  {goal.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Home airport */}
      <div className="space-y-2">
        <Label htmlFor="home_airport">Home airport (optional)</Label>
        <Input
          id="home_airport"
          value={airport}
          onChange={(e) => setAirport(e.target.value.toUpperCase())}
          placeholder="e.g. DTW"
          maxLength={4}
          className="w-32 uppercase"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip
          </Button>
        </div>
        <Button
          onClick={() => onSubmit(selectedGoal, airport)}
          disabled={isPending}
        >
          {isPending ? "Setting up..." : "Finish setup"}
        </Button>
      </div>
    </div>
  );
}
