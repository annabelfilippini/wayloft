import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { generateWalletGuide } from "@/lib/optimizer/engine";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { CopyCheatSheet } from "@/components/optimizer/copy-cheat-sheet";
import type { UserCard } from "@wayloft/shared";

interface QuickOptimizerProps {
  userId: string;
}

export async function QuickOptimizer({ userId }: QuickOptimizerProps) {
  const supabase = await createClient();

  const { data: userCards } = await supabase
    .from("user_cards")
    .select("card_slug")
    .eq("user_id", userId)
    .eq("status", "active");

  const cards = (userCards ?? []) as Pick<UserCard, "card_slug">[];

  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Which Card?</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Add your cards to see which to use for every purchase.
          </p>
          <Link
            href="/cards"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Add cards
          </Link>
        </CardContent>
      </Card>
    );
  }

  const catalog = getAllCards();
  const slugs = cards.map((c) => c.card_slug);
  const guide = generateWalletGuide(slugs, catalog);

  // Only show categories where the best card beats 1x
  const rows = guide.categories
    .filter((cat) => cat.rankings.length > 0 && cat.rankings[0].multiplier > 1)
    .slice(0, 8)
    .map((cat) => ({
      category: cat.displayName,
      cardName: cat.rankings[0].cardName,
    }));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Which Card?</h3>
          </div>
          <CopyCheatSheet guide={guide} />
        </div>

        <div className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <div key={row.category} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.category}</span>
              <span className="font-medium">{row.cardName}</span>
            </div>
          ))}
        </div>

        <Link
          href="/optimizer"
          className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Full optimizer
        </Link>
      </CardContent>
    </Card>
  );
}
