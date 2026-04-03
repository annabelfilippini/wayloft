import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { generateWalletGuide } from "@/lib/optimizer/engine";
import { CopyCheatSheet } from "@/components/optimizer/copy-cheat-sheet";
import type { UserCard } from "@wayloft/shared";

interface QuickOptimizerProps {
  userId: string;
}

/** Map spending categories to icon names (using Lucide-compatible names) */
const CATEGORY_ICONS: Record<string, string> = {
  Dining: "restaurant",
  Travel: "flight",
  Groceries: "local_grocery_store",
  Gas: "local_gas_station",
  Streaming: "subscriptions",
  Transit: "directions_bus",
  "Online Shopping": "shopping_cart",
  "Drug Stores": "local_pharmacy",
  "Home Improvement": "home",
  Entertainment: "theaters",
};

export async function QuickOptimizer({ userId }: QuickOptimizerProps) {
  const supabase = await createClient();

  const { data: userCards } = await supabase
    .from("user_cards")
    .select("card_slug")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null);

  const cards = (userCards ?? []) as Pick<UserCard, "card_slug">[];

  if (cards.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-semibold tracking-[-0.01em]">Spending Optimizer</span>
          <span className="mono text-[10px] text-muted-foreground">BEST CARD BY CATEGORY</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Add your cards to see which to use for every purchase.
        </p>
        <Link
          href="/cards"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          Add cards
        </Link>
      </div>
    );
  }

  const catalog = getAllCards();
  const slugs = cards.map((c) => c.card_slug);
  const guide = generateWalletGuide(slugs, catalog);

  // Only show categories where the best card beats 1x
  const rows = guide.categories
    .filter((cat) => cat.rankings.length > 0 && cat.rankings[0].multiplier > 1)
    .slice(0, 6)
    .map((cat) => {
      const best = cat.rankings[0];
      // Format earn rate
      const rateStr = best.currency === "cashback"
        ? `${best.multiplier}% CB`
        : `${best.multiplier}x ${best.currency?.toUpperCase() ?? ""}`;

      return {
        category: cat.displayName,
        cardName: best.cardName,
        rate: rateStr,
        icon: CATEGORY_ICONS[cat.displayName] ?? "more_horiz",
      };
    });

  // Add "Everything else" row with lowest-rate card
  const everythingElse = guide.categories.find((c) => c.displayName === "Everything Else" || c.displayName === "Other");
  if (everythingElse && everythingElse.rankings.length > 0) {
    const best = everythingElse.rankings[0];
    const rateStr = best.currency === "cashback"
      ? `${best.multiplier}% CB`
      : `${best.multiplier}x ${best.currency?.toUpperCase() ?? ""}`;
    rows.push({
      category: "Everything else",
      cardName: best.cardName,
      rate: rateStr,
      icon: "more_horiz",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-lg font-semibold tracking-[-0.01em]">Spending Optimizer</span>
        <div className="flex items-center gap-3">
          <span className="mono text-[10px] text-muted-foreground">BEST CARD BY CATEGORY</span>
          <CopyCheatSheet guide={guide} />
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <div key={row.category} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-muted-foreground text-xl">{row.icon}</span>
              <span className="text-[15px]">{row.category}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">{row.cardName}</span>
              <span className="mono text-[13px] text-primary"> · {row.rate}</span>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/cards?view=optimizer"
        className="mt-3 block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Full optimizer
      </Link>
    </div>
  );
}
