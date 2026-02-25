"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitQuiz(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const cardSlugs = formData.getAll("current_card_slugs") as string[];

  const row: Record<string, unknown> = {
    user_id: user.id,
    monthly_dining_spend: Number(formData.get("monthly_dining_spend")) || 0,
    monthly_travel_spend: Number(formData.get("monthly_travel_spend")) || 0,
    monthly_grocery_spend: Number(formData.get("monthly_grocery_spend")) || 0,
    monthly_gas_spend: Number(formData.get("monthly_gas_spend")) || 0,
    monthly_streaming_spend: Number(formData.get("monthly_streaming_spend")) || 0,
    monthly_other_spend: Number(formData.get("monthly_other_spend")) || 0,
    credit_score_range: formData.get("credit_score_range") || null,
    cards_opened_24mo: Number(formData.get("cards_opened_24mo")) || 0,
    current_card_slugs: cardSlugs.length > 0 ? cardSlugs : null,
    annual_fee_comfort: formData.get("annual_fee_comfort") || null,
    travel_goal: formData.get("travel_goal") || null,
  };

  const { error } = await supabase
    .from("card_quiz_responses")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
