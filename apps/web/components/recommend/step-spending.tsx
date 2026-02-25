"use client";

import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed,
  Plane,
  ShoppingCart,
  Fuel,
  Tv,
  CircleDollarSign,
} from "lucide-react";

interface StepSpendingProps {
  spending: Record<string, number>;
  onUpdate: (spending: Record<string, number>) => void;
  onNext: () => void;
}

const categories = [
  { key: "monthly_dining_spend", label: "Dining", icon: UtensilsCrossed },
  { key: "monthly_travel_spend", label: "Travel", icon: Plane },
  { key: "monthly_grocery_spend", label: "Groceries", icon: ShoppingCart },
  { key: "monthly_gas_spend", label: "Gas", icon: Fuel },
  { key: "monthly_streaming_spend", label: "Streaming", icon: Tv },
  { key: "monthly_other_spend", label: "Everything Else", icon: CircleDollarSign },
];

const quickAmounts = [0, 100, 250, 500, 1000];

function formatQuick(amount: number) {
  return amount >= 1000 ? `$${amount / 1000}k` : `$${amount}`;
}

export function StepSpending({ spending, onUpdate, onNext }: StepSpendingProps) {
  function setAmount(key: string, value: number) {
    onUpdate({ ...spending, [key]: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">What do you spend each month?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rough estimates are fine — this helps us find cards that maximize your
          rewards.
        </p>
      </div>

      <div className="space-y-4">
        {categories.map(({ key, label, icon: Icon }) => {
          const current = spending[key] ?? 0;
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{label}</span>
                <span className="ml-auto text-sm font-semibold tabular-nums">
                  ${current.toLocaleString()}/mo
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setAmount(key, amount)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      current === amount
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {formatQuick(amount)}
                  </button>
                ))}
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={99999}
                    value={
                      quickAmounts.includes(current) ? "" : current || ""
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setAmount(key, isNaN(val) ? 0 : val);
                    }}
                    placeholder="Other"
                    className="h-8 w-24 rounded-md border bg-transparent pl-5 pr-2 text-xs tabular-nums focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>
  );
}
