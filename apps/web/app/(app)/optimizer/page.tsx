import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { generateWalletGuide } from "@/lib/optimizer/engine";
import type { UserCard } from "@wayloft/shared";
import { WalletGuide } from "@/components/optimizer/wallet-guide";
import { EmptyOptimizer } from "@/components/optimizer/empty-optimizer";

export default async function OptimizerPage() {
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

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Spending Optimizer</h1>
          <p className="text-sm text-muted-foreground">
            Which card should I use?
          </p>
        </div>
        <div className="mt-6">
          <EmptyOptimizer />
        </div>
      </div>
    );
  }

  const slugs = cards.map((c) => c.card_slug);
  const guide = generateWalletGuide(slugs, catalog);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Spending Optimizer</h1>
        <p className="text-sm text-muted-foreground">
          {cards.length} card{cards.length !== 1 ? "s" : ""} &middot; Best card
          for every category
        </p>
      </div>
      <div className="mt-6">
        <WalletGuide guide={guide} catalog={catalog} />
      </div>
    </div>
  );
}
