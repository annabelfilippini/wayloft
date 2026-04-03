import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import type { UserCard, TransferBonus, CatalogCard } from "@wayloft/shared";

interface DashboardTipsProps {
  userId: string;
}

interface Tip {
  text: string;
  href?: string;
}

function generateTips(
  userCards: UserCard[],
  catalogCards: (CatalogCard | undefined)[],
  activeBonuses: TransferBonus[],
  userCurrencies: Set<string>
): Tip[] {
  const tips: Tip[] = [];

  // Map user cards to their catalog entries
  const portfolio = userCards
    .map((uc) => ({ uc, cat: getCardBySlug(uc.card_slug) }))
    .filter((x): x is { uc: UserCard; cat: CatalogCard } => x.cat !== undefined);

  // 1. Portal booking tip — find best portal card
  const portalCards = portfolio
    .filter((x) => x.cat.portal_cpp > 1)
    .sort((a, b) => b.cat.portal_cpp - a.cat.portal_cpp);

  if (portalCards.length > 0) {
    const best = portalCards[0];
    const cppLabel = best.cat.portal_cpp === 1.5
      ? "50% more value"
      : best.cat.portal_cpp === 1.25
        ? "25% more value"
        : `${best.cat.portal_cpp}x value`;
    tips.push({
      text: `Book travel through your ${best.cat.name} portal for ${cppLabel} on your points.`,
    });
  }

  // 2. Transfer bonus tip — if there's an active bonus for user's currencies
  const relevantBonuses = activeBonuses.filter((b) => userCurrencies.has(b.currency));
  if (relevantBonuses.length > 0) {
    const best = relevantBonuses.reduce((a, b) =>
      b.bonus_percentage > a.bonus_percentage ? b : a
    );
    tips.push({
      text: `Transfer bonus active: +${best.bonus_percentage}% when you move points to ${best.partner}. Don't transfer without a specific trip in mind.`,
      href: "/travel",
    });
  }

  // 3. Credits reminder — find cards with monthly/quarterly credits
  const creditsCards = portfolio.filter(
    (x) => x.cat.credits && x.cat.credits.length > 0
  );
  for (const { cat } of creditsCards) {
    const monthlyCredits = cat.credits?.filter((c) => c.period === "monthly");
    if (monthlyCredits && monthlyCredits.length > 0) {
      const creditNames = monthlyCredits.map((c) => c.merchants[0] || c.name).slice(0, 2).join(" and ");
      tips.push({
        text: `Your ${cat.name} has monthly credits for ${creditNames} — use them before they reset.`,
      });
      break; // One credits tip is enough
    }
  }

  // 4. Dining tip — if user has a strong dining card
  const diningCard = portfolio
    .filter((x) => (x.cat.earning_rates["dining"] ?? 0) >= 3)
    .sort((a, b) => (b.cat.earning_rates["dining"] ?? 0) - (a.cat.earning_rates["dining"] ?? 0))[0];

  if (diningCard && !tips.some((t) => t.text.includes("dining"))) {
    const rate = diningCard.cat.earning_rates["dining"];
    tips.push({
      text: `Going out to eat? Your ${diningCard.cat.name} earns ${rate}x on dining — always use it over your other cards at restaurants.`,
    });
  }

  // 5. Grocery tip — if user has a strong grocery card
  const groceryCard = portfolio
    .filter((x) => (x.cat.earning_rates["groceries"] ?? 0) >= 3)
    .sort((a, b) => (b.cat.earning_rates["groceries"] ?? 0) - (a.cat.earning_rates["groceries"] ?? 0))[0];

  if (groceryCard && tips.length < 4) {
    const rate = groceryCard.cat.earning_rates["groceries"];
    const cap = groceryCard.cat.earning_caps.find((c) => c.category === "groceries");
    const capNote = cap
      ? ` (up to $${(cap.limit_cents / 100).toLocaleString()}/${cap.period === "year" ? "yr" : cap.period})`
      : "";
    tips.push({
      text: `Your ${groceryCard.cat.name} earns ${rate}x on groceries${capNote}. Buy gift cards at the grocery store to maximize this.`,
    });
  }

  // 6. FTF tip — if user has a no-FTF card, mention it for travel
  const noFtfCards = portfolio.filter((x) => !x.cat.foreign_transaction_fee);
  const ftfCards = portfolio.filter((x) => x.cat.foreign_transaction_fee);
  if (noFtfCards.length > 0 && ftfCards.length > 0 && tips.length < 4) {
    tips.push({
      text: `Traveling abroad? Use your ${noFtfCards[0].cat.name} — it has no foreign transaction fee. Your ${ftfCards[0].cat.name} charges 3%.`,
    });
  }

  return tips.slice(0, 3);
}

export async function DashboardTips({ userId }: DashboardTipsProps) {
  const supabase = await createClient();

  const [userCardsRes, bonusesRes] = await Promise.all([
    supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("transfer_bonuses")
      .select("*")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString().split("T")[0]),
  ]);

  const userCards = (userCardsRes.data ?? []) as UserCard[];
  const activeBonuses = (bonusesRes.data ?? []) as TransferBonus[];

  if (userCards.length === 0) return null;

  const catalogCards = userCards.map((uc) => getCardBySlug(uc.card_slug));
  const userCurrencies = new Set(userCards.map((c) => c.currency));

  const tips = generateTips(userCards, catalogCards, activeBonuses, userCurrencies);

  if (tips.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Tips</h3>
        </div>

        <div className="mt-3 space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="text-xs leading-relaxed text-muted-foreground">
              {tip.href ? (
                <Link href={tip.href} className="hover:text-foreground">
                  {tip.text}
                </Link>
              ) : (
                tip.text
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
