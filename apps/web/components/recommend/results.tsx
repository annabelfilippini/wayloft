"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";
import { ScoreCard } from "./score-card";
import { ComparisonBar } from "./comparison-bar";
import { ComparisonPanel } from "./comparison-panel";
import type { ScoredCard, QuizInput } from "@/lib/recommend/types";

const MAX_COMPARE = 3;

interface ResultsProps {
  results: ScoredCard[];
  quizInput: QuizInput;
  onRetake: () => void;
}

export function Results({ results, quizInput, onRetake }: ResultsProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [isComparing, setIsComparing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleSelect = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < MAX_COMPARE) {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const handleDeselect = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      next.delete(slug);
      return next;
    });
    // Close comparison if less than 2 remaining
    setIsComparing((prev) => {
      if (selectedSlugs.size - 1 < 2) return false;
      return prev;
    });
  }, [selectedSlugs.size]);

  const handleClear = useCallback(() => {
    setSelectedSlugs(new Set());
    setIsComparing(false);
  }, []);

  const handleCompare = useCallback(() => {
    setIsComparing(true);
    // Scroll to panel after render
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleCloseComparison = useCallback(() => {
    setIsComparing(false);
  }, []);

  const selectedCards = results.filter((r) => selectedSlugs.has(r.card.slug));

  return (
    <div className={`space-y-6 ${selectedSlugs.size > 0 ? "pb-24" : ""}`}>
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Your Top Card Recommendations</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ranked by estimated first-year value based on your spending profile.
          {results.length > 1 && " Select cards to compare side-by-side."}
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
            <ScoreCard
              key={result.card.slug}
              result={result}
              isSelected={selectedSlugs.has(result.card.slug)}
              onToggleSelect={() => toggleSelect(result.card.slug)}
              selectionDisabled={
                selectedSlugs.size >= MAX_COMPARE &&
                !selectedSlugs.has(result.card.slug)
              }
            />
          ))}
        </div>
      )}

      {/* Comparison panel — inline between cards and retake */}
      {isComparing && selectedCards.length >= 2 && (
        <div ref={panelRef}>
          <ComparisonPanel
            cards={selectedCards}
            quizInput={quizInput}
            onClose={handleCloseComparison}
          />
        </div>
      )}

      {/* Retake */}
      <div className="flex justify-center pt-2">
        <Button variant="outline" onClick={onRetake}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retake Quiz
        </Button>
      </div>

      {/* Sticky comparison bar */}
      <ComparisonBar
        selected={selectedCards}
        onDeselect={handleDeselect}
        onCompare={handleCompare}
        onClear={handleClear}
      />
    </div>
  );
}
