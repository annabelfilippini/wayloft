"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import type { ActionResult } from "@wayloft/shared";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const cardSlugs = formData.getAll("card_slugs") as string[];
  const travelGoal = formData.get("travel_goal") as string | null;
  const homeAirport = (formData.get("home_airport") as string)?.toUpperCase().trim() || null;
  const experienceLevel = formData.get("experience_level") as string | null;

  // Insert selected cards
  if (cardSlugs.length > 0) {
    const cardInserts = cardSlugs
      .map((slug) => {
        const catalog = getCardBySlug(slug);
        if (!catalog) return null;
        return {
          user_id: user.id,
          card_slug: catalog.slug,
          card_name: catalog.name,
          issuer: catalog.issuer,
          currency: catalog.currency,
          annual_fee_cents: catalog.annual_fee_cents,
          signup_bonus_points: catalog.signup_bonus.points,
          signup_spend_requirement_cents: catalog.signup_bonus.spend_requirement_cents,
          signup_spend_timeframe_months: catalog.signup_bonus.timeframe_months,
        };
      })
      .filter(Boolean);

    if (cardInserts.length > 0) {
      // Insert cards — if user retried onboarding, some may already exist (23505 = unique_violation)
      const { error: cardsError } = await supabase
        .from("user_cards")
        .insert(cardInserts as Record<string, unknown>[]);
      if (cardsError && cardsError.code !== "23505") {
        return { success: false, error: { category: "transient", message: "Failed to save your cards. Please try again.", description: cardsError.message, isRetryable: true } };
      }
    }
  }

  // Update profile with goals and airport, flip onboarding_completed
  const validLevels = ["beginner", "intermediate", "advanced"];
  const updates: Record<string, unknown> = {
    onboarding_completed: true,
  };
  if (homeAirport) updates.home_airport = homeAirport;
  if (experienceLevel && validLevels.includes(experienceLevel)) {
    updates.experience_level = experienceLevel;
  }
  // Store travel goal in quiz responses table
  if (travelGoal) {
    const { error: goalError } = await supabase.from("card_quiz_responses").upsert(
      {
        user_id: user.id,
        travel_goal: travelGoal,
      },
      { onConflict: "user_id" }
    );
    if (goalError) {
      return { success: false, error: { category: "transient", message: "Failed to save your preferences. Please try again.", description: goalError.message, isRetryable: true } };
    }
  }

  const { error: profileError } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (profileError) {
    return { success: false, error: { category: "transient", message: "Failed to complete onboarding. Please try again.", description: profileError.message, isRetryable: true } };
  }

  revalidatePath("/dashboard");
  revalidatePath("/cards");
  redirect("/dashboard");
}

export async function skipOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  // Don't flip onboarding_completed — leave it false so banner shows
  return { success: true };
}
