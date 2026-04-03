import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCards, getCardBySlug } from "@/lib/cards/catalog";
import { getTransferPartners } from "@/lib/cards/transfer-partners";
import { getRelatedCards } from "@/lib/cards/related-cards";
import { buildCardJsonLd } from "@/lib/cards/json-ld";
import { CardReview } from "@/components/marketing/card-review";

export function generateStaticParams() {
  return getAllCards().map((card) => ({ slug: card.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) return {};

  const af =
    card.annual_fee_cents === 0
      ? "No annual fee"
      : `$${(card.annual_fee_cents / 100).toFixed(0)}/yr`;

  return {
    title: `${card.name} Review — Earning Rates, Perks & Benefits | Wayloft`,
    description: `${card.name} review: ${af}${card.signup_bonus ? `, ${card.signup_bonus.points.toLocaleString()}-point signup bonus` : ""}, ${card.best_for.join(", ")}. Full earning rates, transfer partners, and benefits breakdown.`,
    openGraph: {
      title: `${card.name} Review | Wayloft`,
      description: `${af}${card.signup_bonus ? ` · ${card.signup_bonus.points.toLocaleString()}-point signup bonus` : ""} · ${card.best_for.join(", ")}`,
      url: `https://wayloft.app/credit-cards/${card.slug}`,
    },
  };
}

export default async function CardReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) notFound();

  const allCards = getAllCards();
  const transferPartners = getTransferPartners(card.currency);
  const relatedCards = getRelatedCards(card, allCards);
  const jsonLd = buildCardJsonLd(card);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CardReview
        card={card}
        transferPartners={transferPartners}
        relatedCards={relatedCards}
      />
    </>
  );
}
