"use server";

import { createClient } from "@/lib/supabase/server";
import type { TransferBonus, TransferBonusHistory } from "@wayloft/shared";

export async function getActiveBonuses(): Promise<{
  data: TransferBonus[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transfer_bonuses")
    .select("*")
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString().split("T")[0])
    .order("end_date", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as TransferBonus[], error: null };
}

export async function getActiveBonusesForUser(): Promise<{
  data: TransferBonus[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: "Not authenticated" };
  }

  // Get the user's active cards to determine which currencies they hold
  const { data: userCards } = await supabase
    .from("user_cards")
    .select("currency")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!userCards || userCards.length === 0) {
    return { data: [], error: null };
  }

  // Derive unique currencies from user's cards
  const currencies = [...new Set(userCards.map((c) => c.currency as string))];

  // Fetch active bonuses matching user's currencies
  const { data, error } = await supabase
    .from("transfer_bonuses")
    .select("*")
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString().split("T")[0])
    .in("currency", currencies)
    .order("end_date", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as TransferBonus[], error: null };
}

export async function getBonusHistory(
  bank?: string,
  partnerCode?: string
): Promise<{
  data: TransferBonusHistory[];
  error: string | null;
}> {
  const supabase = await createClient();

  let query = supabase
    .from("transfer_bonus_history")
    .select("*")
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
    return { data: [], error: error.message };
  }

  return { data: (data ?? []) as TransferBonusHistory[], error: null };
}
