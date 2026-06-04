import { Suspense } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getAllCards, getCardBySlug } from "@/lib/cards/catalog";
import { generateWalletGuide } from "@/lib/optimizer/engine";
import type { UserCard, ExperienceLevel } from "@wayloft/shared";
import { AddCardDropdown } from "@/components/cards/add-card-dropdown";
import { CompactFiveTwentyFour } from "@/components/dashboard/compact-five-twenty-four";
import { CardsTabView } from "@/components/cards/cards-tab-view";
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

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: userCards }, { data: profile }] = await Promise.all([
    supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("experience_level")
      .eq("id", user.id)
      .single(),
  ]);

  const cards = (userCards ?? []) as UserCard[];
  const catalog = getAllCards();
  const summary = cards.length > 0 ? computePortfolioSummary(cards) : null;
  const experienceLevel =
    (profile?.experience_level as ExperienceLevel) ?? null;

  // Generate optimizer data
  const slugs = cards.map((c) => c.card_slug);
  const guide = cards.length > 0 ? generateWalletGuide(slugs, catalog) : null;

  return (
    <div className="mx-auto max-w-[1200px] px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.01em]">My Cards</h1>
          <p className="text-sm text-muted-foreground">
            The cards and earning paths that can help fund your next trip.
            <span className="mono ml-1">{cards.length}</span> active card
            {cards.length !== 1 ? "s" : ""}
          </p>
          {summary && (
            <p className="text-xs text-muted-foreground">
              Total annual fees:{" "}
              <span className="mono">
                ${summary.totalAF.toLocaleString()}/yr
              </span>
              {summary.totalCredits > 0 && (
                <>
                  {" · "}Total credits:{" "}
                  <span className="mono">
                    ${summary.totalCredits.toLocaleString()}/yr
                  </span>
                  {" · "}Effective cost:{" "}
                  <span className="mono">
                    ${summary.effectiveCost.toLocaleString()}/yr
                  </span>
                </>
              )}
            </p>
          )}
        </div>
        <AddCardDropdown catalog={catalog} />
      </div>

      {cards.length > 0 && (
        <div className="mt-4">
          <Suspense fallback={<Skeleton className="h-12 w-full" />}>
            <CompactFiveTwentyFour userId={user.id} />
          </Suspense>
        </div>
      )}

      <div className="mt-6">
        <CardsTabView
          defaultTab={view === "optimizer" ? "optimizer" : "cards"}
          cards={cards}
          catalog={catalog}
          guide={guide}
          experienceLevel={experienceLevel}
        />
      </div>
    </div>
  );
}
