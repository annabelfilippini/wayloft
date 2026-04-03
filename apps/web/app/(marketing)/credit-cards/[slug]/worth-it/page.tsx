import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCards, getCardBySlug } from "@/lib/cards/catalog";
import { WorthItTool } from "@/components/marketing/worth-it-tool";

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
    title: `Is ${card.name.startsWith("The ") ? "" : "the "}${card.name} Worth It? — Free Card Analyzer | Wayloft`,
    description: `Find out if ${card.name.startsWith("The ") ? "" : "the "}${card.name} (${af}) is worth keeping. Toggle the benefits you actually use and get an instant verdict: keep, call for retention, or downgrade.`,
    openGraph: {
      title: `Is ${card.name.startsWith("The ") ? "" : "the "}${card.name} Worth It? | Wayloft`,
      description: `${af} — Toggle your benefits, see the math. Instant verdict.`,
      url: `https://wayloft.com/credit-cards/${card.slug}/worth-it`,
    },
  };
}

export default async function WorthItPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) notFound();

  // Cards with $0 AF and no credits/perks don't need this tool
  const hasData =
    (card.credits && card.credits.length > 0) ||
    (card.perks && card.perks.length > 0) ||
    card.annual_fee_cents > 0;

  return <WorthItTool card={card} hasData={hasData} />;
}
