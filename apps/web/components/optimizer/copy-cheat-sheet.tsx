"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WalletGuide } from "@wayloft/shared";

interface CopyCheatSheetProps {
  guide: WalletGuide;
}

export function CopyCheatSheet({ guide }: CopyCheatSheetProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const lines = guide.categories
      .filter((cat) => cat.rankings.length > 0)
      .map((cat) => {
        const best = cat.rankings[0];
        return `${cat.displayName}: ${best.cardName} (${best.multiplier}x)`;
      });

    const text = "My Wallet Cheat Sheet\n" + lines.join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="mr-1.5 h-3.5 w-3.5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Copy cheat sheet
        </>
      )}
    </Button>
  );
}
