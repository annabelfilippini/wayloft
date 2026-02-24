"use client";

import type { ExperienceLevel } from "@wayloft/shared";
import { GLOSSARY } from "@/lib/glossary";
import { getEffectiveLevel } from "@/lib/experience";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JargonTipProps {
  term: string;
  experienceLevel?: ExperienceLevel | null;
  children: React.ReactNode;
}

export function JargonTip({
  term,
  experienceLevel,
  children,
}: JargonTipProps) {
  const level = getEffectiveLevel(experienceLevel);
  const entry = GLOSSARY[term];

  // Advanced users or missing glossary entry: render plain
  if (level === "advanced" || !entry) {
    return <>{children}</>;
  }

  const definition =
    level === "beginner" ? entry.beginner : entry.intermediate;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="border-b border-dotted border-muted-foreground/50 cursor-help">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{definition}</p>
      </TooltipContent>
    </Tooltip>
  );
}
