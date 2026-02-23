"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const fullName = formData.get("full_name") as string;
  const homeAirport = (formData.get("home_airport") as string)?.toUpperCase().trim() || null;
  const preferredCabin = formData.get("preferred_cabin") as string;
  const preferredAirlines = (formData.get("preferred_airlines") as string)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      home_airport: homeAirport,
      preferred_cabin: preferredCabin || "economy",
      preferred_airlines: preferredAirlines.length > 0 ? preferredAirlines : null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
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
    return { error: "Not authenticated" };
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
    return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const [cardsRes, balancesRes, profileRes] = await Promise.all([
    supabase.from("user_cards").select("*").eq("user_id", user.id),
    supabase.from("loyalty_balances").select("*").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);

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

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Delete profile (cascades to user_cards, loyalty_balances, etc. via FK constraints)
  const { error } = await supabase.from("profiles").delete().eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  // Sign out
  await supabase.auth.signOut();
  return { success: true };
}
