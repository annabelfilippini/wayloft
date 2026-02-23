"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";

export async function addCard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const cardSlug = formData.get("card_slug") as string;
  const cardSince = formData.get("card_since") as string | null;

  if (!cardSlug) {
    return { error: "No card selected" };
  }

  const catalog = getCardBySlug(cardSlug);
  if (!catalog) {
    return { error: "Card not found in catalog" };
  }

  const { error } = await supabase.from("user_cards").insert({
    user_id: user.id,
    card_slug: catalog.slug,
    card_name: catalog.name,
    issuer: catalog.issuer,
    currency: catalog.currency,
    annual_fee_cents: catalog.annual_fee_cents,
    signup_bonus_points: catalog.signup_bonus.points,
    signup_spend_requirement_cents: catalog.signup_bonus.spend_requirement_cents,
    signup_spend_timeframe_months: catalog.signup_bonus.timeframe_months,
    card_since: cardSince || new Date().toISOString().split("T")[0],
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have this card" };
    }
    return { error: error.message };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSpendProgress(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const cardId = formData.get("card_id") as string;
  const amountDollars = parseFloat(formData.get("amount") as string);

  if (!cardId || isNaN(amountDollars) || amountDollars < 0) {
    return { error: "Invalid input" };
  }

  const cents = Math.round(amountDollars * 100);

  const { error } = await supabase
    .from("user_cards")
    .update({ signup_spend_progress_cents: cents })
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeCard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const cardId = formData.get("card_id") as string;
  if (!cardId) {
    return { error: "No card specified" };
  }

  const { error } = await supabase
    .from("user_cards")
    .delete()
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function logAnnualFeeEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const userCardId = formData.get("user_card_id") as string;
  const eventType = formData.get("event_type") as string;
  const retentionOfferType = formData.get("retention_offer_type") as string | null;
  const retentionOfferValue = formData.get("retention_offer_value") as string | null;
  const retentionSpendRequirement = formData.get("retention_spend_requirement") as string | null;
  const notes = formData.get("notes") as string | null;

  const validEvents = [
    "annual_fee_posted",
    "annual_fee_waived",
    "retention_offer",
    "retention_declined",
  ];

  if (!userCardId || !eventType || !validEvents.includes(eventType)) {
    return { error: "Invalid input" };
  }

  const { error } = await supabase.from("card_lifecycle_events").insert({
    user_id: user.id,
    user_card_id: userCardId,
    event_type: eventType,
    retention_offer_type: retentionOfferType || null,
    retention_offer_value: retentionOfferValue || null,
    retention_spend_requirement: retentionSpendRequirement || null,
    notes: notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}
