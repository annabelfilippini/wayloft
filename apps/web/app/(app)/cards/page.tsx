import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import type { UserCard } from "@wayloft/shared";
import { CardGrid } from "@/components/cards/card-grid";
import { EmptyState } from "@/components/cards/empty-state";
import { AddCardDialog } from "@/components/cards/add-card-dialog";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Cards</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} card{cards.length !== 1 ? "s" : ""} in your portfolio
          </p>
        </div>
        <AddCardDialog catalog={catalog} />
      </div>

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
