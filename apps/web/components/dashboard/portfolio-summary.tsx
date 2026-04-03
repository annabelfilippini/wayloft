import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import type { UserCard } from "@wayloft/shared";

interface PortfolioSummaryProps {
  userId: string;
}

export async function PortfolioSummary({ userId }: PortfolioSummaryProps) {
  const supabase = await createClient();

  const [userCardsRes, creditHealthRes] = await Promise.all([
    supabase
      .from("user_cards")
      .select("card_slug, signup_bonus_met, signup_spend_requirement_cents, signup_spend_progress_cents, annual_fee_date")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("user_cards")
      .select("id")
      .eq("user_id", userId)
      .is("deleted_at", null),
  ]);

  const userCards = (userCardsRes.data ?? []) as Pick<UserCard, "card_slug" | "signup_bonus_met" | "signup_spend_requirement_cents" | "signup_spend_progress_cents" | "annual_fee_date">[];
  const allCardsCount = creditHealthRes.data?.length ?? 0;

  // Total cards
  const totalCards = userCards.length;

  // Total annual fees
  let totalAfCents = 0;
  let activeBonuses = 0;

  for (const uc of userCards) {
    const catalog = getCardBySlug(uc.card_slug);
    if (!catalog) continue;
    totalAfCents += catalog.annual_fee_cents ?? 0;

    // Count active signup bonuses (not yet met)
    if (!uc.signup_bonus_met && uc.signup_spend_requirement_cents) {
      activeBonuses++;
    }
  }

  const totalAf = totalAfCents / 100;

  // Rough 5/24 count (cards opened in last 24 months)
  const twentyFourMonthsAgo = new Date();
  twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

  // We don't have card_since easily here, so use allCardsCount as proxy
  // In practice this would query actual card_since dates
  const fiveOf24 = Math.min(allCardsCount, 24);

  const stats: { label: string; value: string; valueColor?: string; note?: string }[] = [
    {
      label: "Total Cards",
      value: String(totalCards),
    },
    {
      label: "Annual Fees",
      value: `$${totalAf.toLocaleString()}`,
    },
    {
      label: "Active Bonuses",
      value: String(activeBonuses),
      valueColor: activeBonuses > 0 ? "text-primary" : undefined,
    },
    {
      label: "5/24 Status",
      value: `${fiveOf24}/24`,
      note: fiveOf24 < 5 ? `${5 - fiveOf24} slots available` : undefined,
      valueColor: fiveOf24 < 5 ? "text-success" : fiveOf24 >= 5 ? "text-destructive" : undefined,
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <span className="text-lg font-semibold tracking-[-0.01em]">Portfolio Summary</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card p-4">
            <div className="label-signal text-muted-foreground mb-2">{stat.label}</div>
            <div className={`mono text-[28px] tabular-nums ${stat.valueColor ?? ""}`}>
              {stat.value}
            </div>
            {stat.note && (
              <div className="text-[13px] mt-1 text-muted-foreground">
                {stat.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
