"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@wayloft/shared";

export interface QuizData {
  monthly_dining_spend: number;
  monthly_travel_spend: number;
  monthly_grocery_spend: number;
  monthly_gas_spend: number;
  monthly_streaming_spend: number;
  monthly_other_spend: number;
  credit_score_range: string;
  cards_opened_24mo: number;
  cards_opened_48mo: number;
  current_card_slugs: string[];
  annual_fee_comfort: string;
  travel_goal: string;
}

export async function submitQuiz(
  formData: FormData
): Promise<ActionResult<QuizData>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to save your quiz results.', isRetryable: false } };
  }

  const cardSlugs = formData.getAll("current_card_slugs") as string[];

  const quizData: QuizData = {
    monthly_dining_spend: Number(formData.get("monthly_dining_spend")) || 0,
    monthly_travel_spend: Number(formData.get("monthly_travel_spend")) || 0,
    monthly_grocery_spend: Number(formData.get("monthly_grocery_spend")) || 0,
    monthly_gas_spend: Number(formData.get("monthly_gas_spend")) || 0,
    monthly_streaming_spend:
      Number(formData.get("monthly_streaming_spend")) || 0,
    monthly_other_spend: Number(formData.get("monthly_other_spend")) || 0,
    credit_score_range: (formData.get("credit_score_range") as string) || "",
    cards_opened_24mo: Number(formData.get("cards_opened_24mo")) || 0,
    cards_opened_48mo: Number(formData.get("cards_opened_48mo")) || 0,
    current_card_slugs: cardSlugs,
    annual_fee_comfort: (formData.get("annual_fee_comfort") as string) || "",
    travel_goal: (formData.get("travel_goal") as string) || "",
  };

  const row: Record<string, unknown> = {
    user_id: user.id,
    ...quizData,
    current_card_slugs: cardSlugs.length > 0 ? cardSlugs : null,
  };

  const { error } = await supabase
    .from("card_quiz_responses")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to save quiz results. Please try again.', description: error.message, isRetryable: true } };
  }

  return { success: true, data: quizData };
}
