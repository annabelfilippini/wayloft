import type { MetadataRoute } from "next";
import { getAllCards } from "@/lib/cards/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const cards = getAllCards();

  const cardPages: MetadataRoute.Sitemap = cards.map((card) => ({
    url: `https://wayloft.com/credit-cards/${card.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: "https://wayloft.com",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://wayloft.com/credit-cards",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...cardPages,
  ];
}
