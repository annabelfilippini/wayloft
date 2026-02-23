"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addLoyaltyBalance(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
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
    return { error: "Missing required fields" };
  }

  const validTypes = ["credit_card", "airline", "hotel"];
  if (!validTypes.includes(programType)) {
    return { error: "Invalid program type" };
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
      return { error: "Balance for this program already exists" };
    }
    return { error: error.message };
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
    return { error: "Not authenticated" };
  }

  const balanceId = formData.get("balance_id") as string;
  const balance = parseInt(formData.get("balance") as string);
  const expiresAt = formData.get("expires_at") as string | null;
  const lastActivityDate = formData.get("last_activity_date") as string | null;

  if (!balanceId || isNaN(balance)) {
    return { error: "Invalid input" };
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
    return { error: error.message };
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
    return { error: "Not authenticated" };
  }

  const balanceId = formData.get("balance_id") as string;
  if (!balanceId) {
    return { error: "No balance specified" };
  }

  const { error } = await supabase
    .from("loyalty_balances")
    .delete()
    .eq("id", balanceId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
