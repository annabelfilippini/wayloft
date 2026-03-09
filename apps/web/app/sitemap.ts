import type { MetadataRoute } from "next";
import { getAllCards } from "@/lib/cards/catalog";
import { getAllBestForCategories } from "@/lib/cards/best-for";

export default function sitemap(): MetadataRoute.Sitemap {
  const cards = getAllCards();
  const bestForCategories = getAllBestForCategories();

  const cardPages: MetadataRoute.Sitemap = cards.map((card) => ({
    url: `https://wayloft.com/credit-cards/${card.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const bestForPages: MetadataRoute.Sitemap = bestForCategories.map((cat) => ({
    url: `https://wayloft.com/credit-cards/best-for/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
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
    ...bestForPages,
    ...cardPages,
  ];
}
