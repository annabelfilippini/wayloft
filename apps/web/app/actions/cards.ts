"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import type { LifecycleEventType, CatalogCredit, PerkSetupStatus, AutopayType, ActionResult } from "@wayloft/shared";

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
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const cardSlug = formData.get("card_slug") as string;
  const cardSince = formData.get("card_since") as string | null;

  if (!cardSlug) {
    return { success: false, error: { category: 'validation', message: 'No card selected.', isRetryable: false } };
  }

  const catalog = getCardBySlug(cardSlug);
  if (!catalog) {
    return { success: false, error: { category: 'validation', message: 'Card not found in catalog.', isRetryable: false } };
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
      return { success: false, error: { category: 'validation', message: 'You already have this card.', isRetryable: false } };
    }
    return { success: false, error: { category: 'transient', message: 'Failed to add card. Please try again.', description: error.message, isRetryable: true } };
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

    // Auto-generate perk setup rows if card has structured perks
    const perks = catalog.perks;
    if (perks && perks.length > 0) {
      const perkRows = perks.map((perk) => ({
        user_id: user.id,
        user_card_id: inserted.id,
        card_slug: catalog.slug,
        perk_id: perk.id,
        perk_name: perk.name,
        category: perk.category,
        perk_type: perk.type,
        status: perk.type === "always_on" ? "completed" : "not_started",
        completed_at: perk.type === "always_on" ? new Date().toISOString() : null,
        estimated_annual_value_cents: perk.estimated_annual_value_cents,
      }));
      await supabase.from("user_perk_setup").insert(perkRows);
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
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const cardId = formData.get("card_id") as string;
  const incrementStr = formData.get("increment") as string | null;
  const amountStr = formData.get("amount") as string | null;

  if (!cardId) {
    return { success: false, error: { category: 'validation', message: 'No card specified.', isRetryable: false } };
  }

  let cents: number;

  if (incrementStr) {
    const incrementDollars = parseFloat(incrementStr);
    if (isNaN(incrementDollars) || incrementDollars <= 0) {
      return { success: false, error: { category: 'validation', message: 'Enter a valid amount greater than $0.', isRetryable: false, field: 'increment' } };
    }
    // Fetch current balance and add increment
    const { data: card } = await supabase
      .from("user_cards")
      .select("signup_spend_progress_cents")
      .eq("id", cardId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!card) {
      return { success: false, error: { category: 'validation', message: 'Card not found.', isRetryable: false } };
    }

    cents = (card.signup_spend_progress_cents ?? 0) + Math.round(incrementDollars * 100);
  } else {
    const amountDollars = parseFloat(amountStr ?? "");
    if (isNaN(amountDollars) || amountDollars < 0) {
      return { success: false, error: { category: 'validation', message: 'Enter a valid dollar amount.', isRetryable: false, field: 'amount' } };
    }
    cents = Math.round(amountDollars * 100);
  }

  const { error } = await supabase
    .from("user_cards")
    .update({ signup_spend_progress_cents: cents })
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to update spend. Please try again.', description: error.message, isRetryable: true } };
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
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const cardId = formData.get("card_id") as string;
  if (!cardId) {
    return { success: false, error: { category: 'validation', message: 'No card specified.', isRetryable: false } };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_cards")
    .update({ deleted_at: now })
    .eq("id", cardId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to remove card. Please try again.', description: error.message, isRetryable: true } };
  }

  // Soft-delete related payment info for this card
  await supabase
    .from("user_payment_info")
    .update({ deleted_at: now })
    .eq("user_card_id", cardId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

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
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
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
    return { success: false, error: { category: 'validation', message: 'Invalid lifecycle event.', isRetryable: false } };
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
    return { success: false, error: { category: 'transient', message: 'Failed to log event. Please try again.', description: error.message, isRetryable: true } };
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
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
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
    return { success: false, error: { category: 'validation', message: 'Invalid annual fee event.', isRetryable: false } };
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
    return { success: false, error: { category: 'transient', message: 'Failed to log annual fee event. Please try again.', description: error.message, isRetryable: true } };
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
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const creditId = formData.get("credit_id") as string;
  const amountStr = formData.get("amount") as string | null;

  if (!creditId) {
    return { success: false, error: { category: 'validation', message: 'No credit specified.', isRetryable: false } };
  }

  const { data: credit } = await supabase
    .from("user_credit_usage")
    .select("id, user_id, user_card_id, credit_type, credit_name, credit_amount_cents, period, period_start, period_end, amount_used_cents, status, enrollment_required, enrolled, created_at, updated_at")
    .eq("id", creditId)
    .eq("user_id", user.id)
    .single();

  if (!credit) {
    return { success: false, error: { category: 'validation', message: 'Credit not found.', isRetryable: false } };
  }

  let newUsed: number;
  if (amountStr) {
    const amountDollars = parseFloat(amountStr);
    if (isNaN(amountDollars) || amountDollars <= 0) {
      return { success: false, error: { category: 'validation', message: 'Enter a valid amount greater than $0.', isRetryable: false, field: 'amount' } };
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
    return { success: false, error: { category: 'transient', message: 'Failed to update credit. Please try again.', description: error.message, isRetryable: true } };
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
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const creditId = formData.get("credit_id") as string;

  if (!creditId) {
    return { success: false, error: { category: 'validation', message: 'No credit specified.', isRetryable: false } };
  }

  const { error } = await supabase
    .from("user_credit_usage")
    .update({ enrolled: true })
    .eq("id", creditId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to enroll credit. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markPerkSetup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const perkId = formData.get("perk_id") as string;
  const newStatus = formData.get("status") as PerkSetupStatus;

  if (!perkId || !newStatus) {
    return { success: false, error: { category: 'validation', message: 'Perk ID and status are required.', isRetryable: false } };
  }

  const validStatuses: PerkSetupStatus[] = [
    "not_started",
    "in_progress",
    "completed",
    "not_applicable",
  ];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: { category: 'validation', message: 'Invalid perk status.', isRetryable: false, field: 'status' } };
  }

  const updates: Record<string, unknown> = { status: newStatus };
  if (newStatus === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const notes = formData.get("notes") as string | null;
  if (notes) {
    updates.notes = notes;
  }

  const { error } = await supabase
    .from("user_perk_setup")
    .update(updates)
    .eq("id", perkId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to update perk. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function dismissPerk(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const perkId = formData.get("perk_id") as string;

  if (!perkId) {
    return { success: false, error: { category: 'validation', message: 'No perk specified.', isRetryable: false } };
  }

  const { error } = await supabase
    .from("user_perk_setup")
    .update({ status: "not_applicable" })
    .eq("id", perkId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to dismiss perk. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

const VALID_AUTOPAY_TYPES: AutopayType[] = [
  "full_balance",
  "minimum",
  "fixed_amount",
  "none",
];

export async function addPaymentInfo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const userCardId = formData.get("user_card_id") as string;
  const cardSlug = formData.get("card_slug") as string;
  const dueDayStr = formData.get("due_day") as string;
  const autopayEnabled = formData.get("autopay_enabled") === "true";
  const autopayType = (formData.get("autopay_type") as AutopayType) || "none";
  const notes = formData.get("notes") as string | null;

  if (!userCardId || !cardSlug || !dueDayStr) {
    return { success: false, error: { category: 'validation', message: 'Card and due day are required.', isRetryable: false } };
  }

  const dueDay = parseInt(dueDayStr, 10);
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 28) {
    return { success: false, error: { category: 'validation', message: 'Due day must be between 1 and 28.', isRetryable: false, field: 'due_day' } };
  }

  if (!VALID_AUTOPAY_TYPES.includes(autopayType)) {
    return { success: false, error: { category: 'validation', message: 'Invalid autopay type.', isRetryable: false, field: 'autopay_type' } };
  }

  const { error } = await supabase.from("user_payment_info").insert({
    user_id: user.id,
    user_card_id: userCardId,
    card_slug: cardSlug,
    due_day: dueDay,
    autopay_enabled: autopayEnabled,
    autopay_type: autopayEnabled ? autopayType : "none",
    notes: notes || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: { category: 'validation', message: 'Payment info already exists for this card.', isRetryable: false } };
    }
    return { success: false, error: { category: 'transient', message: 'Failed to save payment info. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePaymentInfo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const paymentInfoId = formData.get("payment_info_id") as string;

  if (!paymentInfoId) {
    return { success: false, error: { category: 'validation', message: 'No payment info specified.', isRetryable: false } };
  }

  const updates: Record<string, unknown> = {};

  const dueDayStr = formData.get("due_day") as string | null;
  if (dueDayStr) {
    const dueDay = parseInt(dueDayStr, 10);
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 28) {
      return { success: false, error: { category: 'validation', message: 'Due day must be between 1 and 28.', isRetryable: false, field: 'due_day' } };
    }
    updates.due_day = dueDay;
  }

  const autopayEnabledStr = formData.get("autopay_enabled") as string | null;
  if (autopayEnabledStr !== null) {
    updates.autopay_enabled = autopayEnabledStr === "true";
  }

  const autopayType = formData.get("autopay_type") as string | null;
  if (autopayType) {
    if (!VALID_AUTOPAY_TYPES.includes(autopayType as AutopayType)) {
      return { success: false, error: { category: 'validation', message: 'Invalid autopay type.', isRetryable: false, field: 'autopay_type' } };
    }
    updates.autopay_type = autopayType;
  }

  const notes = formData.get("notes") as string | null;
  if (notes !== null) {
    updates.notes = notes || null;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: { category: 'validation', message: 'No changes provided.', isRetryable: false } };
  }

  const { error } = await supabase
    .from("user_payment_info")
    .update(updates)
    .eq("id", paymentInfoId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to update payment info. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePaymentInfo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const paymentInfoId = formData.get("payment_info_id") as string;

  if (!paymentInfoId) {
    return { success: false, error: { category: 'validation', message: 'No payment info specified.', isRetryable: false } };
  }

  const { error } = await supabase
    .from("user_payment_info")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", paymentInfoId)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to delete payment info. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/cards");
  revalidatePath("/dashboard");
  return { success: true };
}
