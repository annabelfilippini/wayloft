import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import { CardArtPlaceholder } from "@/components/cards/card-art-placeholder";
import type { UserCard, CatalogCard } from "@wayloft/shared";

interface CardStripProps {
  userId: string;
}

interface PaymentInfo {
  user_card_id: string;
  next_due_date: string;
  days_until_due: number;
  autopay_enabled: boolean;
}

interface UnusedPerkCount {
  user_card_id: string;
  count: number;
}

export async function CardStrip({ userId }: CardStripProps) {
  const supabase = await createClient();

  const [userCardsRes, paymentsRes, perksRes] = await Promise.all([
    supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("card_since", { ascending: true }),
    supabase
      .from("upcoming_payments")
      .select("user_card_id, next_due_date, days_until_due, autopay_enabled")
      .eq("user_id", userId),
    supabase
      .from("unused_perks")
      .select("user_card_id")
      .eq("user_id", userId)
      .eq("status", "not_started"),
  ]);

  const userCards = (userCardsRes.data ?? []) as UserCard[];
  if (userCards.length === 0) return null;

  const payments = (paymentsRes.data ?? []) as PaymentInfo[];
  const unusedPerks = (perksRes.data ?? []) as { user_card_id: string }[];

  // Count unused perks per card
  const perkCounts = new Map<string, number>();
  for (const p of unusedPerks) {
    perkCounts.set(p.user_card_id, (perkCounts.get(p.user_card_id) ?? 0) + 1);
  }

  // Index payments by card
  const paymentMap = new Map<string, PaymentInfo>();
  for (const p of payments) {
    paymentMap.set(p.user_card_id, p);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {userCards.map((uc) => {
        const catalog = getCardBySlug(uc.card_slug);
        if (!catalog) return null;

        const payment = paymentMap.get(uc.id);
        const unusedPerkCount = perkCounts.get(uc.id) ?? 0;
        const hasActiveBonus = !uc.signup_bonus_met && uc.signup_spend_deadline;

        // Bonus progress
        let bonusPercent: number | null = null;
        if (hasActiveBonus && uc.signup_spend_requirement_cents) {
          bonusPercent = Math.min(
            100,
            Math.round((uc.signup_spend_progress_cents / uc.signup_spend_requirement_cents) * 100)
          );
        }

        return (
          <Link
            key={uc.id}
            href={`/cards/${uc.id}`}
            className="group flex-none"
          >
            <div className="w-44 space-y-2">
              <CardArtPlaceholder
                issuer={uc.issuer}
                network={catalog.network}
                cardName={catalog.name}
                className="transition-transform group-hover:scale-[1.02]"
              />
              <div className="space-y-0.5 px-0.5">
                {bonusPercent != null && (
                  <CardStat
                    label="Bonus progress"
                    value={`${bonusPercent}%`}
                    accent="text-orange-500 dark:text-orange-400"
                  />
                )}
                {payment && (
                  <CardStat
                    label="Payment"
                    value={
                      payment.autopay_enabled
                        ? "Autopay on"
                        : `Due in ${payment.days_until_due}d`
                    }
                    accent={
                      !payment.autopay_enabled && payment.days_until_due <= 7
                        ? "text-red-500 dark:text-red-400"
                        : undefined
                    }
                  />
                )}
                {unusedPerkCount > 0 && (
                  <CardStat
                    label="Perks"
                    value={`${unusedPerkCount} to activate`}
                    accent="text-green-600 dark:text-green-400"
                  />
                )}
                {!bonusPercent && !payment && unusedPerkCount === 0 && (
                  <CardStat
                    label="AF"
                    value={
                      catalog.annual_fee_cents === 0
                        ? "None"
                        : `$${catalog.annual_fee_cents / 100}/yr`
                    }
                  />
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function CardStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ?? "font-medium"}>{value}</span>
    </div>
  );
}
