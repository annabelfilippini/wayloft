"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";

const STORAGE_KEY = "wayloft-bonus-explainer-dismissed";

export function BonusExplainer() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <div className="flex-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Transfer bonuses</span> are
          limited-time promotions where banks offer extra points when you transfer to
          airline or hotel partners. A 30% bonus means 100K points becomes 130K miles.
          They typically last 1-4 weeks.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
