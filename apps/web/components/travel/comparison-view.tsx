"use client";

import type { ComparisonResult } from "@/lib/flights/compare";
import { ComparisonCard } from "./comparison-card";

interface ComparisonViewProps {
  result: ComparisonResult | null;
}

export function ComparisonView({ result }: ComparisonViewProps) {
  if (!result) return null;
  if (result.cashPrice === null && result.awardPaths.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="label-signal text-muted-foreground">
        BOOKING DECISION
      </span>
      <ComparisonCard result={result} />
    </div>
  );
}
