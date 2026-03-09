import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllBestForCategories,
  getBestForCategory,
  getBestCardsForCategory,
} from "@/lib/cards/best-for";
import { BestForArticle } from "@/components/marketing/best-for-article";

export function generateStaticParams() {
  return getAllBestForCategories().map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getBestForCategory(slug);
  if (!category) return {};

  return {
    title: `${category.title} (${new Date().getFullYear()}) | Wayloft`,
    description: category.description,
    openGraph: {
      title: `${category.title} | Wayloft`,
      description: category.description,
      url: `https://wayloft.com/credit-cards/best-for/${slug}`,
    },
  };
}

export default async function BestForPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getBestForCategory(slug);
  if (!category) notFound();

  const cards = getBestCardsForCategory(category);

  return <BestForArticle category={category} cards={cards} />;
}
