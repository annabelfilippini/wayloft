/**
 * Affiliate link utilities.
 *
 * For now, all cards use direct issuer URLs with Wayloft UTM params.
 * When affiliate networks (CardRatings, CJ, FlexOffers) are onboarded,
 * add per-card overrides here.
 */

export type SourcePage =
  | "card-review"
  | "best-for"
  | "recommendation"
  | "comparison"
  | "dashboard";

interface AffiliateUrlParams {
  applicationUrl: string;
  cardSlug: string;
  sourcePage: SourcePage;
  /** Optional rank position (e.g. #1 in best-for list) */
  rank?: number;
}

export function buildAffiliateUrl({
  applicationUrl,
  cardSlug,
  sourcePage,
  rank,
}: AffiliateUrlParams): string {
  try {
    const url = new URL(applicationUrl);
    url.searchParams.set("utm_source", "wayloft");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set(
      "utm_campaign",
      sourcePage
    );
    url.searchParams.set("utm_content", cardSlug);
    if (rank != null) {
      url.searchParams.set("utm_term", `rank-${rank}`);
    }
    return url.toString();
  } catch {
    // If the URL is malformed, return as-is
    return applicationUrl;
  }
}
