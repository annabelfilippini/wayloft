"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { CategoryRecommendation } from "@wayloft/shared";

interface QuickReferenceProps {
  categories: CategoryRecommendation[];
}

export function QuickReference({ categories }: QuickReferenceProps) {
  const [copied, setCopied] = useState(false);

  const lines = categories
    .filter((cat) => cat.rankings.length > 0)
    .map((cat) => {
      const top = cat.rankings[0];
      return `${cat.displayName} → ${top.cardName} · ${top.multiplier}x`;
    });

  const text = lines.join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick Reference
        </h2>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="mt-3 space-y-1 font-mono text-sm">
        {lines.map((line, i) => (
          <p key={i} className="text-foreground/90">{line}</p>
        ))}
      </div>
    </div>
  );
}
