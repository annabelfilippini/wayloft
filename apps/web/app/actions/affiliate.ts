"use server";

import { createClient } from "@/lib/supabase/server";
import type { SourcePage } from "@/lib/affiliate";

export async function trackAffiliateClick({
  cardSlug,
  sourcePage,
  affiliateNetwork,
  utmSource,
  utmMedium,
  utmCampaign,
}: {
  cardSlug: string;
  sourcePage: SourcePage;
  affiliateNetwork?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}) {
  const supabase = await createClient();

  // Get user if logged in (nullable — anonymous clicks are fine)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("affiliate_clicks").insert({
    user_id: user?.id ?? null,
    card_slug: cardSlug,
    source_page: sourcePage,
    affiliate_network: affiliateNetwork ?? null,
    utm_source: utmSource ?? "wayloft",
    utm_medium: utmMedium ?? "referral",
    utm_campaign: utmCampaign ?? sourcePage,
  });
}
