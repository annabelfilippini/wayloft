"use client";

import { Button } from "@/components/ui/button";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import { X } from "lucide-react";
import type { ScoredCard } from "@/lib/recommend/types";

interface ComparisonBarProps {
  selected: ScoredCard[];
  onDeselect: (slug: string) => void;
  onCompare: () => void;
  onClear: () => void;
}

export function ComparisonBar({
  selected,
  onDeselect,
  onCompare,
  onClear,
}: ComparisonBarProps) {
  if (selected.length === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-in slide-in-from-bottom-2">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        {/* Selected card thumbnails */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {selected.map((s) => (
            <div key={s.card.slug} className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1">
              <div className="w-12">
                <CardArtPlaceholder
                  issuer={s.card.issuer}
                  network={s.card.network}
                  cardName={s.card.name}
                />
              </div>
              <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
                {s.card.name}
              </span>
              <button
                type="button"
                onClick={() => onDeselect(s.card.slug)}
                className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
          <Button
            size="sm"
            onClick={onCompare}
            disabled={selected.length < 2}
          >
            Compare {selected.length} Card{selected.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
