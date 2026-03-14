import { Suspense } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getAllCards, getCardBySlug } from "@/lib/cards/catalog";
import type { UserCard } from "@wayloft/shared";
import { CardGrid } from "@/components/cards/card-grid";
import { EmptyState } from "@/components/cards/empty-state";
import { AddCardDropdown } from "@/components/cards/add-card-dropdown";
import { CompactFiveTwentyFour } from "@/components/dashboard/compact-five-twenty-four";
import { Skeleton } from "@/components/ui/skeleton";

function computePortfolioSummary(cards: UserCard[]) {
  let totalAF = 0;
  let totalCredits = 0;

  for (const uc of cards) {
    totalAF += uc.annual_fee_cents / 100;
    const cat = getCardBySlug(uc.card_slug);
    if (cat?.credits) {
      for (const credit of cat.credits) {
        const annual =
          credit.period === "monthly"
            ? credit.amount_cents * 12
            : credit.period === "quarterly"
              ? credit.amount_cents * 4
              : credit.period === "semi_annual"
                ? credit.amount_cents * 2
                : credit.amount_cents;
        totalCredits += annual / 100;
      }
    }
  }

  const effectiveCost = totalAF - totalCredits;
  return { totalAF, totalCredits, effectiveCost };
}

export default async function CardsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: userCards } = await supabase
    .from("user_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const cards = (userCards ?? []) as UserCard[];
  const catalog = getAllCards();
  const summary = cards.length > 0 ? computePortfolioSummary(cards) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Cards</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} card{cards.length !== 1 ? "s" : ""} in your portfolio
          </p>
          {summary && (
            <p className="text-xs text-muted-foreground">
              Total annual fees: ${summary.totalAF.toLocaleString()}/yr
              {summary.totalCredits > 0 && (
                <>
                  {" · "}Total credits: ${summary.totalCredits.toLocaleString()}/yr
                  {" · "}Effective cost: ${summary.effectiveCost.toLocaleString()}/yr
                </>
              )}
            </p>
          )}
        </div>
        <AddCardDropdown catalog={catalog} />
      </div>

      {cards.length > 0 && (
        <div className="mt-4">
          <Suspense fallback={<Skeleton className="h-12 w-full rounded-lg" />}>
            <CompactFiveTwentyFour userId={user.id} />
          </Suspense>
        </div>
      )}

      <div className="mt-6">
        {cards.length === 0 ? (
          <EmptyState />
        ) : (
          <CardGrid cards={cards} catalog={catalog} />
        )}
      </div>
    </div>
  );
}
