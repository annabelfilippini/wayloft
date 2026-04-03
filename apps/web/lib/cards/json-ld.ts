import "server-only";
import type { CatalogCard } from "@wayloft/shared";

export function buildCardJsonLd(card: CatalogCard) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreditCard",
    name: card.name,
    brand: {
      "@type": "Organization",
      name: card.issuer.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    annualPercentageRate: undefined,
    feesAndCommissionsSpecification:
      card.annual_fee_cents > 0
        ? `$${(card.annual_fee_cents / 100).toFixed(0)} annual fee`
        : "No annual fee",
    url: `https://wayloft.app/credit-cards/${card.slug}`,
  };

  // Add Review only if editorial rating exists
  if (card.editorial?.rating) {
    jsonLd.review = {
      "@type": "Review",
      author: {
        "@type": "Organization",
        name: "Wayloft",
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: card.editorial.rating,
        bestRating: 5,
      },
      reviewBody: card.editorial.verdict,
      ...(card.editorial.updated_at && {
        datePublished: card.editorial.updated_at,
      }),
    };
  }

  return jsonLd;
}
