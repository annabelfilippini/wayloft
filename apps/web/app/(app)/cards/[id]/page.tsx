import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getCardBySlug } from "@/lib/cards/catalog";
import { getTransferPartners } from "@/lib/cards/transfer-partners";
import { CardDetail } from "@/components/cards/card-detail";
import type { UserCard } from "@wayloft/shared";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("user_cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!row) notFound();

  const userCard = row as UserCard;
  const catalogCard = getCardBySlug(userCard.card_slug);

  if (!catalogCard) notFound();

  const transferPartners = getTransferPartners(userCard.currency);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <CardDetail
        userCard={userCard}
        catalogCard={catalogCard}
        transferPartners={transferPartners}
      />
    </div>
  );
}
