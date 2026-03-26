import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import { getTransferPartners } from "@/lib/cards/transfer-partners";
import { CardDetail } from "@/components/cards/card-detail";
import type { UserCard, CardLifecycleEvent, UserCreditUsage, UserPerkSetup, UserPaymentInfo, ExperienceLevel } from "@wayloft/shared";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("user_cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!row) notFound();

  const userCard = row as UserCard;
  const catalogCard = getCardBySlug(userCard.card_slug);

  if (!catalogCard) notFound();

  const transferPartners = getTransferPartners(userCard.currency);

  const { data: profileData } = await supabase
    .from("profiles")
    .select("experience_level")
    .eq("id", user.id)
    .single();
  const experienceLevel = (profileData?.experience_level as ExperienceLevel) ?? null;

  const [{ data: eventRows }, { data: creditRows }, { data: perkRows }, { data: paymentRow }] = await Promise.all([
    supabase
      .from("card_lifecycle_events")
      .select("*")
      .eq("user_card_id", id)
      .eq("user_id", user.id)
      .order("event_date", { ascending: false }),
    supabase
      .from("user_credit_usage")
      .select("*")
      .eq("user_card_id", id)
      .eq("user_id", user.id)
      .order("period_end", { ascending: true }),
    supabase
      .from("user_perk_setup")
      .select("*")
      .eq("user_card_id", id)
      .eq("user_id", user.id)
      .order("category", { ascending: true }),
    supabase
      .from("user_payment_info")
      .select("*")
      .eq("user_card_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const lifecycleEvents = (eventRows ?? []) as CardLifecycleEvent[];
  const creditUsage = (creditRows ?? []) as UserCreditUsage[];
  let perkSetup = (perkRows ?? []) as UserPerkSetup[];
  const paymentInfo = (paymentRow as UserPaymentInfo) ?? null;

  // Lazy backfill: if catalog has perks but DB has no rows, insert them
  if (perkSetup.length === 0 && catalogCard.perks && catalogCard.perks.length > 0) {
    const backfillRows = catalogCard.perks.map((perk) => ({
      user_id: user.id,
      user_card_id: id,
      card_slug: userCard.card_slug,
      perk_id: perk.id,
      perk_name: perk.name,
      category: perk.category,
      perk_type: perk.type,
      status: perk.type === "always_on" ? "completed" : "not_started",
      completed_at: perk.type === "always_on" ? new Date().toISOString() : null,
      estimated_annual_value_cents: perk.estimated_annual_value_cents,
    }));
    await supabase.from("user_perk_setup").insert(backfillRows);

    // Re-fetch after backfill
    const { data: refetchedPerks } = await supabase
      .from("user_perk_setup")
      .select("*")
      .eq("user_card_id", id)
      .eq("user_id", user.id)
      .order("category", { ascending: true });
    perkSetup = (refetchedPerks ?? []) as UserPerkSetup[];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <CardDetail
        userCard={userCard}
        catalogCard={catalogCard}
        transferPartners={transferPartners}
        lifecycleEvents={lifecycleEvents}
        creditUsage={creditUsage}
        perkSetup={perkSetup}
        paymentInfo={paymentInfo}
        experienceLevel={experienceLevel}
      />
    </div>
  );
}
