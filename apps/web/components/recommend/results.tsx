"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";
import { ScoreCard } from "./score-card";
import type { ScoredCard } from "@/lib/recommend/types";

interface ResultsProps {
  results: ScoredCard[];
  onRetake: () => void;
}

export function Results({ results, onRetake }: ResultsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Your Top Card Recommendations</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ranked by estimated first-year value based on your spending profile.
        </p>
      </div>

      {/* Cards */}
      {results.length === 0 ? (
        <div className="rounded-lg border bg-muted/50 px-6 py-8 text-center">
          <p className="font-medium">No matching cards found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your annual fee comfort or credit score range.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <ScoreCard key={result.card.slug} result={result} />
          ))}
        </div>
      )}

      {/* Retake */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={onRetake}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retake Quiz
        </Button>
      </div>
    </div>
  );
}
