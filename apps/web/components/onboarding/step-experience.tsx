"use client";

import type { ExperienceLevel } from "@wayloft/shared";
import { Button } from "@/components/ui/button";
import { Sprout, Compass, Trophy } from "lucide-react";

interface StepExperienceProps {
  onNext: (level: ExperienceLevel) => void;
  onSkip: () => void;
}

const levels = [
  {
    value: "beginner" as ExperienceLevel,
    label: "Just getting started",
    description: "I have 1-2 cards and want to learn the basics",
    icon: Sprout,
  },
  {
    value: "intermediate" as ExperienceLevel,
    label: "I know the basics",
    description: "I understand points and transfers but want to optimize",
    icon: Compass,
  },
  {
    value: "advanced" as ExperienceLevel,
    label: "Points pro",
    description: "I actively manage 5+ cards and chase signup bonuses",
    icon: Trophy,
  },
];

export function StepExperience({ onNext, onSkip }: StepExperienceProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">
          How familiar are you with credit card rewards?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This helps us tailor the experience to your level.
        </p>
      </div>

      <div className="grid gap-3">
        {levels.map((level) => {
          const Icon = level.icon;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onNext(level.value)}
              className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 hover:border-primary"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{level.label}</p>
                <p className="text-xs text-muted-foreground">
                  {level.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
