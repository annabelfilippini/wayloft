"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import type { LifecycleEventType, CatalogCredit } from "@wayloft/shared";

function calculatePeriodDates(
  period: CatalogCredit["period"],
  referenceDate: Date
): { start: string; end: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (period) {
    case "monthly": {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0); // last day of month
      return { start: fmt(start), end: fmt(end) };
    }
    case "quarterly": {
      const qStart = Math.floor(month / 3) * 3;
      const start = new Date(year, qStart, 1);
      const end = new Date(year, qStart + 3, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case "semi_annual": {
      const hStart = month < 6 ? 0 : 6;
      const start = new Date(year, hStart, 1);
      const end = new Date(year, hStart + 6, 0);
      return { start: fmt(start), end: fmt(end) };
    }
    case "annual":
    case "card_year": {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return { start: fmt(start), end: fmt(end) };
    }
    default:
      return { start: fmt(referenceDate), end: fmt(referenceDate) };
  }
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

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

  const openedDate = cardSince || new Date().toISOString().split("T")[0];

  const { data: inserted, error } = await supabase
    .from("user_cards")
    .insert({
      user_id: user.id,
      card_slug: catalog.slug,
      card_name: catalog.name,
      issuer: catalog.issuer,
      currency: catalog.currency,
      annual_fee_cents: catalog.annual_fee_cents,
      signup_bonus_points: catalog.signup_bonus.points,
      signup_spend_requirement_cents: catalog.signup_bonus.spend_requirement_cents,
      signup_spend_timeframe_months: catalog.signup_bonus.timeframe_months,
      card_since: openedDate,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have this card" };
    }
    return { error: error.message };
  }

  // Auto-log "opened" lifecycle event
  if (inserted) {
    await supabase.from("card_lifecycle_events").insert({
      user_id: user.id,
      user_card_id: inserted.id,
      event_type: "opened",
      event_date: openedDate,
    });

    // Auto-generate credit usage rows if card has credits
    const credits = catalog.credits;
    if (credits && credits.length > 0) {
      const now = new Date();
      const creditRows = credits.map((credit) => {
        const { start, end } = calculatePeriodDates(credit.period, now);
        return {
          user_id: user.id,
          user_card_id: inserted.id,
          credit_type: credit.type,
          credit_name: credit.name,
          credit_amount_cents: credit.monthly_cap_cents ?? credit.amount_cents,
          period: credit.period,
          period_start: start,
          period_end: end,
          amount_used_cents: 0,
          status: "available",
          enrollment_required: credit.enrollment_required,
          enrolled: false,
        };
      });
      await supabase.from("user_credit_usage").insert(creditRows);
    }
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
  const incrementStr = formData.get("increment") as string | null;
  const amountStr = formData.get("amount") as string | null;

  if (!cardId) {
    return { error: "Invalid input" };
  }

  let cents: number;

  if (incrementStr) {
    const incrementDollars = parseFloat(incrementStr);
    if (isNaN(incrementDollars) || incrementDollars <= 0) {
      return { error: "Invalid increment" };
    }
    // Fetch current balance and add increment
    const { data: card } = await supabase
      .from("user_cards")
      .select("signup_spend_progress_cents")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .single();

    if (!card) {
      return { error: "Card not found" };
    }

    cents = (card.signup_spend_progress_cents ?? 0) + Math.round(incrementDollars * 100);
  } else {
    const amountDollars = parseFloat(amountStr ?? "");
    if (isNaN(amountDollars) || amountDollars < 0) {
      return { error: "Invalid input" };
    }
    cents = Math.round(amountDollars * 100);
  }

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

const VALID_LIFECYCLE_EVENTS: LifecycleEventType[] = [
  "opened",
  "product_change",
  "downgrade",
  "upgrade",
  "cancelled",
  "retention_offer",
  "retention_declined",
  "annual_fee_posted",
  "annual_fee_waived",
  "signup_bonus_met",
  "signup_bonus_earned",
];

export async function logLifecycleEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const userCardId = formData.get("user_card_id") as string;
  const eventType = formData.get("event_type") as string;
  const eventDate = formData.get("event_date") as string | null;
  const fromCardSlug = formData.get("from_card_slug") as string | null;
  const toCardSlug = formData.get("to_card_slug") as string | null;
  const retentionOfferType = formData.get("retention_offer_type") as string | null;
  const retentionOfferValue = formData.get("retention_offer_value") as string | null;
  const retentionSpendRequirement = formData.get("retention_spend_requirement") as string | null;
  const notes = formData.get("notes") as string | null;

  if (
    !userCardId ||
    !eventType ||
    !VALID_LIFECYCLE_EVENTS.includes(eventType as LifecycleEventType)
  ) {
    return { error: "Invalid input" };
  }

  const { error } = await supabase.from("card_lifecycle_events").insert({
    user_id: user.id,
    user_card_id: userCardId,
    event_type: eventType,
    event_date: eventDate || new Date().toISOString().split("T")[0],
    from_card_slug: fromCardSlug || null,
    to_card_slug: toCardSlug || null,
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

export async function markCreditUsed(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const creditId = formData.get("credit_id") as string;
  const amountStr = formData.get("amount") as string | null;

  if (!creditId) {
    return { error: "No credit specified" };
  }

  const { data: credit } = await supabase
    .from("user_credit_usage")
    .select("*")
    .eq("id", creditId)
    .eq("user_id", user.id)
    .single();

  if (!credit) {
    return { error: "Credit not found" };
  }

  let newUsed: number;
  if (amountStr) {
    const amountDollars = parseFloat(amountStr);
    if (isNaN(amountDollars) || amountDollars <= 0) {
      return { error: "Invalid amount" };
    }
    newUsed = credit.amount_used_cents + Math.round(amountDollars * 100);
  } else {
    newUsed = credit.credit_amount_cents;
  }

  newUsed = Math.min(newUsed, credit.credit_amount_cents);

  const newStatus =
    newUsed >= credit.credit_amount_cents
      ? "used"
      : newUsed > 0
        ? "partial"
        : "available";

  const { error } = await supabase
    .from("user_credit_usage")
    .update({ amount_used_cents: newUsed, status: newStatus })
    .eq("id", creditId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function enrollCredit(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const creditId = formData.get("credit_id") as string;

  if (!creditId) {
    return { error: "No credit specified" };
  }

  const { error } = await supabase
    .from("user_credit_usage")
    .update({ enrolled: true })
    .eq("id", creditId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}
