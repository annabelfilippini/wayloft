"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@wayloft/shared";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const fullName = formData.get("full_name") as string;
  const homeAirport = (formData.get("home_airport") as string)?.toUpperCase().trim() || null;
  const preferredCabin = formData.get("preferred_cabin") as string;
  const experienceLevel = formData.get("experience_level") as string | null;
  const preferredAirlines = (formData.get("preferred_airlines") as string)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  const validLevels = ["beginner", "intermediate", "advanced"];
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      home_airport: homeAirport,
      preferred_cabin: preferredCabin || "economy",
      preferred_airlines: preferredAirlines.length > 0 ? preferredAirlines : null,
      experience_level: experienceLevel && validLevels.includes(experienceLevel)
        ? experienceLevel
        : null,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to save profile. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateNotificationPreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const emailBonusAlerts = formData.get("email_bonus_alerts") === "on";
  const emailPriceAlerts = formData.get("email_price_alerts") === "on";
  const emailWeeklyDigest = formData.get("email_weekly_digest") === "on";

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      email_bonus_alerts: emailBonusAlerts,
      email_price_alerts: emailPriceAlerts,
      email_weekly_digest: emailWeeklyDigest,
    });

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to save preferences. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function exportUserData(): Promise<ActionResult<{ profile: unknown; cards: unknown[]; loyalty_balances: unknown[]; exported_at: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const USER_CARD_COLUMNS =
    "id, user_id, card_slug, card_name, issuer, currency, annual_fee_cents, status, card_since, is_primary, annual_fee_date, af_reminder_days_before, signup_bonus_points, signup_spend_requirement_cents, signup_spend_timeframe_months, signup_spend_deadline, signup_spend_progress_cents, signup_bonus_met, signup_bonus_earned, created_at, updated_at";
  const BALANCE_COLUMNS =
    "id, user_id, program_name, program_code, program_type, balance, currency, source, last_verified_at, expires_at, expiration_policy, expiration_notes, last_activity_date, inactivity_months, tier_status, created_at, updated_at";
  const PROFILE_COLUMNS =
    "id, email, full_name, avatar_url, home_airport, alternate_airports, preferred_cabin, preferred_airlines, max_connections, subscription_tier, onboarding_completed, experience_level, created_at, updated_at";

  const [cardsRes, balancesRes, profileRes] = await Promise.all([
    supabase.from("user_cards").select(USER_CARD_COLUMNS).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("loyalty_balances").select(BALANCE_COLUMNS).eq("user_id", user.id).is("deleted_at", null),
    supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).single(),
  ]);

  if (cardsRes.error) {
    return { success: false, error: { category: "transient", message: "Failed to export card data. Please try again.", description: cardsRes.error.message, isRetryable: true } };
  }
  if (balancesRes.error) {
    return { success: false, error: { category: "transient", message: "Failed to export balance data. Please try again.", description: balancesRes.error.message, isRetryable: true } };
  }
  if (profileRes.error) {
    return { success: false, error: { category: "transient", message: "Failed to export profile data. Please try again.", description: profileRes.error.message, isRetryable: true } };
  }

  return {
    success: true,
    data: {
      profile: profileRes.data,
      cards: cardsRes.data ?? [],
      loyalty_balances: balancesRes.data ?? [],
      exported_at: new Date().toISOString(),
    },
  };
}

export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  // Delete profile (cascades to user_cards, loyalty_balances, etc. via FK constraints)
  const { error } = await supabase.from("profiles").delete().eq("id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to delete account. Please try again.', description: error.message, isRetryable: true } };
  }

  // Sign out
  await supabase.auth.signOut();
  return { success: true };
}
