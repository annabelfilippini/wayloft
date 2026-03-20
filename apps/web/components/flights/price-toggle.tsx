"use client";

import { DollarSign, Coins, TrendingUp } from "lucide-react";

export type PriceView = "cash" | "points" | "cpp";

interface PriceToggleProps {
  value: PriceView;
  onChange: (view: PriceView) => void;
}

const OPTIONS: { value: PriceView; label: string; icon: typeof DollarSign }[] = [
  { value: "cash", label: "Cash", icon: DollarSign },
  { value: "points", label: "Points", icon: Coins },
  { value: "cpp", label: "Value", icon: TrendingUp },
];

export function PriceToggle({ value, onChange }: PriceToggleProps) {
  return (
    <div className="flex rounded-md border bg-muted/50 p-0.5">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3 w-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
