"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, TransferBonus, TransferBonusHistory } from "@wayloft/shared";

const BONUS_COLUMNS =
  "id, bank, currency, partner, partner_code, partner_type, bonus_percentage, start_date, end_date, source_url, is_active, scraped_at, retrieved_at, confidence, created_at";

const HISTORY_COLUMNS =
  "id, bank, currency, partner, partner_code, bonus_percentage, start_date, end_date, duration_days, retrieved_at, confidence, created_at";

export async function getActiveBonuses(): Promise<ActionResult<TransferBonus[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transfer_bonuses")
    .select(BONUS_COLUMNS)
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString().split("T")[0])
    .order("end_date", { ascending: true });

  if (error) {
    return {
      success: false,
      error: {
        category: "transient",
        message: "Unable to load transfer bonuses. Please try again.",
        description: error.message,
        isRetryable: true,
      },
    };
  }

  return { success: true, data: (data ?? []) as TransferBonus[] };
}

export async function getActiveBonusesForUser(): Promise<ActionResult<TransferBonus[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        category: "permission",
        message: "Sign in to view your personalized bonuses.",
        isRetryable: false,
      },
    };
  }

  const { data: userCards, error: cardsError } = await supabase
    .from("user_cards")
    .select("currency")
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null);

  if (cardsError) {
    return {
      success: false,
      error: {
        category: "transient",
        message: "Unable to load your card portfolio. Please try again.",
        description: cardsError.message,
        isRetryable: true,
      },
    };
  }

  if (!userCards || userCards.length === 0) {
    return { success: true, data: [] };
  }

  const currencies = [...new Set(userCards.map((c) => c.currency as string))];

  const { data, error } = await supabase
    .from("transfer_bonuses")
    .select(BONUS_COLUMNS)
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString().split("T")[0])
    .in("currency", currencies)
    .order("end_date", { ascending: true });

  if (error) {
    return {
      success: false,
      error: {
        category: "transient",
        message: "Unable to load transfer bonuses. Please try again.",
        description: error.message,
        isRetryable: true,
      },
    };
  }

  return { success: true, data: (data ?? []) as TransferBonus[] };
}

export async function getBonusHistory(
  bank?: string,
  partnerCode?: string
): Promise<ActionResult<TransferBonusHistory[]>> {
  const supabase = await createClient();

  let query = supabase
    .from("transfer_bonus_history")
    .select(HISTORY_COLUMNS)
    .order("end_date", { ascending: false })
    .limit(50);

  if (bank) {
    query = query.eq("bank", bank);
  }

  if (partnerCode) {
    query = query.eq("partner_code", partnerCode);
  }

  const { data, error } = await query;

  if (error) {
    return {
      success: false,
      error: {
        category: "transient",
        message: "Unable to load bonus history. Please try again.",
        description: error.message,
        isRetryable: true,
      },
    };
  }

  return { success: true, data: (data ?? []) as TransferBonusHistory[] };
}
