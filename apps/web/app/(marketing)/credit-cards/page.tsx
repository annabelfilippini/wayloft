import type { Metadata } from "next";
import { getAllCards } from "@/lib/cards/catalog";
import { CardCatalogGrid } from "@/components/marketing/card-catalog-grid";

export const metadata: Metadata = {
  title: "Credit Card Reviews & Comparisons | Wayloft",
  description:
    "Browse 50+ credit card reviews with earning rates, transfer partners, perks, and annual fee breakdowns. Find the best rewards credit card for your spending.",
  openGraph: {
    title: "Credit Card Reviews & Comparisons | Wayloft",
    description:
      "Browse 50+ credit card reviews with earning rates, transfer partners, perks, and annual fee breakdowns.",
    url: "https://wayloft.app/credit-cards",
  },
};

export default function CreditCardsIndexPage() {
  const cards = getAllCards();

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12 md:px-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl">
          Credit Card Reviews
        </h1>
        <p className="mt-2 text-muted-foreground">
          Explore {cards.length} rewards credit cards with detailed earning
          rates, transfer partners, and benefits breakdowns.
        </p>
      </div>

      <CardCatalogGrid cards={cards} />
    </div>
  );
}
