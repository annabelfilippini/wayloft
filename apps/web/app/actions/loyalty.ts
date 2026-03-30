"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@wayloft/shared";

export async function addLoyaltyBalance(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const programName = formData.get("program_name") as string;
  const programCode = formData.get("program_code") as string;
  const programType = formData.get("program_type") as string;
  const balance = parseInt(formData.get("balance") as string);
  const currency = formData.get("currency") as string;
  const expirationPolicy = formData.get("expiration_policy") as string | null;
  const expiresAt = formData.get("expires_at") as string | null;
  const lastActivityDate = formData.get("last_activity_date") as string | null;
  const inactivityMonths = formData.get("inactivity_months") as string | null;

  if (!programName || !programCode || !programType || isNaN(balance) || !currency) {
    return { success: false, error: { category: 'validation', message: 'Program, balance, and currency are required.', isRetryable: false } };
  }

  const validTypes = ["credit_card", "airline", "hotel"];
  if (!validTypes.includes(programType)) {
    return { success: false, error: { category: 'validation', message: 'Invalid program type.', isRetryable: false, field: 'program_type' } };
  }

  const { error } = await supabase.from("loyalty_balances").insert({
    user_id: user.id,
    program_name: programName,
    program_code: programCode,
    program_type: programType,
    balance,
    currency,
    expiration_policy: expirationPolicy || null,
    expires_at: expiresAt || null,
    last_activity_date: lastActivityDate || null,
    inactivity_months: inactivityMonths ? parseInt(inactivityMonths) : null,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: { category: 'validation', message: 'A balance for this program already exists.', isRetryable: false } };
    }
    return { success: false, error: { category: 'transient', message: 'Failed to add balance. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLoyaltyBalance(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const balanceId = formData.get("balance_id") as string;
  const balance = parseInt(formData.get("balance") as string);
  const expiresAt = formData.get("expires_at") as string | null;
  const lastActivityDate = formData.get("last_activity_date") as string | null;

  if (!balanceId || isNaN(balance)) {
    return { success: false, error: { category: 'validation', message: 'Balance ID and a valid amount are required.', isRetryable: false } };
  }

  const updates: Record<string, unknown> = {
    balance,
    last_verified_at: new Date().toISOString(),
  };
  if (expiresAt !== null) updates.expires_at = expiresAt || null;
  if (lastActivityDate !== null) updates.last_activity_date = lastActivityDate || null;

  const { error } = await supabase
    .from("loyalty_balances")
    .update(updates)
    .eq("id", balanceId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to update balance. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeLoyaltyBalance(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: { category: 'permission', message: 'Sign in to continue.', isRetryable: false } };
  }

  const balanceId = formData.get("balance_id") as string;
  if (!balanceId) {
    return { success: false, error: { category: 'validation', message: 'No balance specified.', isRetryable: false } };
  }

  const { error } = await supabase
    .from("loyalty_balances")
    .delete()
    .eq("id", balanceId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: { category: 'transient', message: 'Failed to remove balance. Please try again.', description: error.message, isRetryable: true } };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
