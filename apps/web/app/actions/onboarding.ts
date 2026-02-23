"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const cardSlugs = formData.getAll("card_slugs") as string[];
  const travelGoal = formData.get("travel_goal") as string | null;
  const homeAirport = (formData.get("home_airport") as string)?.toUpperCase().trim() || null;

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
      // Use upsert to skip duplicates
      await supabase
        .from("user_cards")
        .upsert(cardInserts as Record<string, unknown>[], {
          onConflict: "user_id,card_slug",
          ignoreDuplicates: true,
        });
    }
  }

  // Update profile with goals and airport, flip onboarding_completed
  const updates: Record<string, unknown> = {
    onboarding_completed: true,
  };
  if (homeAirport) updates.home_airport = homeAirport;
  // Store travel goal in user_metadata or as preferred_cabin proxy
  // For now, we'll store it in the quiz responses table
  if (travelGoal) {
    await supabase.from("card_quiz_responses").upsert(
      {
        user_id: user.id,
        travel_goal: travelGoal,
      },
      { onConflict: "user_id" }
    );
  }

  await supabase.from("profiles").update(updates).eq("id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/cards");
  return { success: true };
}

export async function skipOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Don't flip onboarding_completed — leave it false so banner shows
  return { success: true };
}
