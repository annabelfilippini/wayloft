"use client";

import { useState } from "react";
import type { CatalogCard } from "@wayloft/shared";
import { StepSpending } from "./step-spending";
import { StepCredit } from "./step-credit";
import { StepCards } from "./step-cards";
import { StepPreferences } from "./step-preferences";
import { StepConfirm } from "./step-confirm";
import { submitQuiz } from "@/app/actions/recommend";

interface QuizWizardProps {
  catalog: CatalogCard[];
  existingResponse: QuizResponse | null;
  userCardSlugs: string[];
}

export interface QuizResponse {
  monthly_dining_spend: number | null;
  monthly_travel_spend: number | null;
  monthly_grocery_spend: number | null;
  monthly_gas_spend: number | null;
  monthly_streaming_spend: number | null;
  monthly_other_spend: number | null;
  credit_score_range: string | null;
  cards_opened_24mo: number | null;
  current_card_slugs: string[] | null;
  annual_fee_comfort: string | null;
  travel_goal: string | null;
}

const TOTAL_STEPS = 5;

export function QuizWizard({
  catalog,
  existingResponse,
  userCardSlugs,
}: QuizWizardProps) {
  const [isPending, setIsPending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(0);

  // Initialize from existing response or defaults
  const [spending, setSpending] = useState<Record<string, number>>({
    monthly_dining_spend: existingResponse?.monthly_dining_spend ?? 0,
    monthly_travel_spend: existingResponse?.monthly_travel_spend ?? 0,
    monthly_grocery_spend: existingResponse?.monthly_grocery_spend ?? 0,
    monthly_gas_spend: existingResponse?.monthly_gas_spend ?? 0,
    monthly_streaming_spend: existingResponse?.monthly_streaming_spend ?? 0,
    monthly_other_spend: existingResponse?.monthly_other_spend ?? 0,
  });

  const [creditScore, setCreditScore] = useState(
    existingResponse?.credit_score_range ?? ""
  );
  const [cardsOpened24mo, setCardsOpened24mo] = useState(
    existingResponse?.cards_opened_24mo ?? 0
  );

  // Pre-populate from existing quiz response OR user_cards portfolio
  const [selectedCards, setSelectedCards] = useState<string[]>(
    existingResponse?.current_card_slugs ?? userCardSlugs
  );

  const [annualFeeComfort, setAnnualFeeComfort] = useState(
    existingResponse?.annual_fee_comfort ?? ""
  );
  const [travelGoal, setTravelGoal] = useState(
    existingResponse?.travel_goal ?? ""
  );

  const cardNameMap = new Map(catalog.map((c) => [c.slug, c.name]));

  async function handleSubmit() {
    setIsPending(true);
    try {
      const formData = new FormData();

      // Spending
      for (const [key, value] of Object.entries(spending)) {
        formData.set(key, String(value));
      }

      // Credit
      formData.set("credit_score_range", creditScore);
      formData.set("cards_opened_24mo", String(cardsOpened24mo));

      // Cards
      for (const slug of selectedCards) {
        formData.append("current_card_slugs", slug);
      }

      // Preferences
      formData.set("annual_fee_comfort", annualFeeComfort);
      formData.set("travel_goal", travelGoal);

      const result = await submitQuiz(formData);
      if (result.success) {
        setIsSubmitted(true);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      {/* Progress bar */}
      {!isSubmitted && (
        <div className="mb-8 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                step >= i ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      {step === 0 && (
        <StepSpending
          spending={spending}
          onUpdate={setSpending}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <StepCredit
          creditScore={creditScore}
          cardsOpened24mo={cardsOpened24mo}
          onCreditScoreChange={setCreditScore}
          onCardsOpenedChange={setCardsOpened24mo}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <StepCards
          catalog={catalog}
          selected={selectedCards}
          onSelect={setSelectedCards}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <StepPreferences
          annualFeeComfort={annualFeeComfort}
          travelGoal={travelGoal}
          onAnnualFeeChange={setAnnualFeeComfort}
          onTravelGoalChange={setTravelGoal}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && (
        <StepConfirm
          spending={spending}
          creditScore={creditScore}
          cardsOpened24mo={cardsOpened24mo}
          currentCardSlugs={selectedCards}
          annualFeeComfort={annualFeeComfort}
          travelGoal={travelGoal}
          cardNames={cardNameMap}
          onSubmit={handleSubmit}
          onBack={() => setStep(3)}
          isPending={isPending}
          isSubmitted={isSubmitted}
        />
      )}
    </div>
  );
}
