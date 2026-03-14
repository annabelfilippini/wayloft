"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { CommandPalette } from "./command-palette";

interface AppHeaderProps {
  cards: { slug: string; name: string; issuer: string }[];
}

export function AppHeader({ cards }: AppHeaderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="flex h-14 items-center justify-end border-b px-4">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </header>
      <CommandPalette cards={cards} open={open} onOpenChange={setOpen} />
    </>
  );
}
