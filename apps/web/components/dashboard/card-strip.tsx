import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import { CardDeck } from "@/components/dashboard/card-deck";
import type { UserCard } from "@wayloft/shared";
import type { CardData } from "@/components/dashboard/card-deck";

interface CardStripProps {
  userId: string;
}

interface PaymentInfo {
  user_card_id: string;
  next_due_date: string;
  days_until_due: number;
  autopay_enabled: boolean;
}

export async function CardStrip({ userId }: CardStripProps) {
  const supabase = await createClient();

  const [userCardsRes, paymentsRes, perksRes] = await Promise.all([
    supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("card_since", { ascending: true }),
    supabase
      .from("upcoming_payments")
      .select("user_card_id, next_due_date, days_until_due, autopay_enabled")
      .eq("user_id", userId),
    supabase
      .from("unused_perks")
      .select("user_card_id, perk_name, estimated_annual_value_cents")
      .eq("user_id", userId)
      .eq("status", "not_started"),
  ]);

  const userCards = (userCardsRes.data ?? []) as UserCard[];
  if (userCards.length === 0) return null;

  const payments = (paymentsRes.data ?? []) as PaymentInfo[];
  const unusedPerks = (perksRes.data ?? []) as {
    user_card_id: string;
    perk_name: string;
    estimated_annual_value_cents: number;
  }[];

  // Build serializable card data for client component
  const cards: CardData[] = [];

  for (const uc of userCards) {
    const catalog = getCardBySlug(uc.card_slug);
    if (!catalog) continue;

    const payment = payments.find((p) => p.user_card_id === uc.id);
    const cardPerks = unusedPerks
      .filter((p) => p.user_card_id === uc.id)
      .map((p) => ({
        name: p.perk_name,
        valueCents: p.estimated_annual_value_cents,
      }));

    let bonusPercent: number | null = null;
    if (!uc.signup_bonus_met && uc.signup_spend_deadline && uc.signup_spend_requirement_cents) {
      bonusPercent = Math.min(
        100,
        Math.round((uc.signup_spend_progress_cents / uc.signup_spend_requirement_cents) * 100)
      );
    }

    cards.push({
      id: uc.id,
      issuer: uc.issuer,
      network: catalog.network,
      name: catalog.name,
      annualFeeCents: catalog.annual_fee_cents,
      bonusPercent,
      payment: payment
        ? {
            daysUntilDue: payment.days_until_due,
            autopayEnabled: payment.autopay_enabled,
          }
        : null,
      perks: cardPerks,
    });
  }

  return <CardDeck cards={cards} />;
}
