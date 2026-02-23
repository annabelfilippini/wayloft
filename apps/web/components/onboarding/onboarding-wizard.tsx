"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CatalogCard } from "@wayloft/shared";
import { StepCards } from "./step-cards";
import { StepGoals } from "./step-goals";
import { completeOnboarding } from "@/app/actions/onboarding";

interface OnboardingWizardProps {
  catalog: CatalogCard[];
}

export function OnboardingWizard({ catalog }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleSkip() {
    router.push("/dashboard");
  }

  function handleSubmit(goal: string, airport: string) {
    startTransition(async () => {
      const formData = new FormData();
      for (const slug of selectedCards) {
        formData.append("card_slugs", slug);
      }
      if (goal) formData.set("travel_goal", goal);
      if (airport) formData.set("home_airport", airport);

      const result = await completeOnboarding(formData);
      if (result.success) {
        router.push("/dashboard");
      }
    });
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
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

      {step === 1 && (
        <StepCards
          catalog={catalog}
          selected={selectedCards}
          onSelect={setSelectedCards}
          onNext={() => setStep(2)}
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
