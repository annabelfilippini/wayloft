"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogCard, ExperienceLevel } from "@wayloft/shared";
import { StepExperience } from "./step-experience";
import { StepCards } from "./step-cards";
import { StepGoals } from "./step-goals";
import { completeOnboarding } from "@/app/actions/onboarding";
import { getDefaultAppRoute } from "@/lib/routes";

interface OnboardingWizardProps {
  catalog: CatalogCard[];
}

export function OnboardingWizard({ catalog }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSkip() {
    router.push(getDefaultAppRoute());
  }

  function handleSubmit(goal: string, airport: string) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      for (const slug of selectedCards) {
        formData.append("card_slugs", slug);
      }
      if (goal) formData.set("travel_goal", goal);
      if (airport) formData.set("home_airport", airport);
      if (experienceLevel) formData.set("experience_level", experienceLevel);

      const result = await completeOnboarding(formData);
      // completeOnboarding redirects on success — if we reach here, it failed
      if (!result.success && result.error) {
        setError(result.error.message);
      }
    });
  }

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div
          className={`h-1.5 flex-1 rounded-full ${
            step >= 0 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full ${
            step >= 1 ? "bg-primary" : "bg-muted"
          }`}
        />
        <div
          className={`h-1.5 flex-1 rounded-full ${
            step >= 2 ? "bg-primary" : "bg-muted"
          }`}
        />
      </div>

      {step === 0 && (
        <StepExperience
          onNext={(level) => {
            setExperienceLevel(level);
            setStep(1);
          }}
          onSkip={handleSkip}
        />
      )}

      {step === 1 && (
        <StepCards
          catalog={catalog}
          selected={selectedCards}
          onSelect={setSelectedCards}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
          onSkip={handleSkip}
        />
      )}

      {step === 2 && (
        <StepGoals
          onSubmit={handleSubmit}
          onBack={() => setStep(1)}
          onSkip={handleSkip}
          isPending={isPending}
        />
      )}
    </div>
  );
}
