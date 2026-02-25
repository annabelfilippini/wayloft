import "server-only";
import type {
  UserCard,
  UserExternalCard,
  CatalogCard,
  FiveTwentyFourStatus,
} from "@wayloft/shared";

const MAX_ALLOWED = 5;
const WINDOW_MONTHS = 24;

/** Issuers whose business cards still count toward 5/24 */
const BUSINESS_COUNTS_ISSUERS = new Set(["capital_one", "discover"]);

function getWindowStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - WINDOW_MONTHS, now.getDate());
}

function agesOutDate(openedDate: string): string {
  const d = new Date(openedDate);
  d.setMonth(d.getMonth() + WINDOW_MONTHS);
  return d.toISOString().split("T")[0];
}

/**
 * Compute Chase 5/24 status from user cards + external cards.
 * Pure function — no DB calls, no side effects.
 */
export function computeFiveTwentyFour(
  userCards: UserCard[],
  externalCards: UserExternalCard[],
  catalog: CatalogCard[]
): FiveTwentyFourStatus {
  const windowStart = getWindowStart();
  const catalogMap = new Map(catalog.map((c) => [c.slug, c]));

  const counted: FiveTwentyFourStatus["countedCards"] = [];

  // 1. User cards (from catalog) opened in the window
  for (const uc of userCards) {
    if (!uc.card_since) continue;
    const opened = new Date(uc.card_since);
    if (opened < windowStart) continue;

    const cat = catalogMap.get(uc.card_slug);
    const isBusiness = cat?.is_business ?? false;
    const issuer = (cat?.issuer ?? uc.issuer ?? "").toLowerCase();

    // Business cards don't count, except Capital One & Discover
    if (isBusiness && !BUSINESS_COUNTS_ISSUERS.has(issuer)) continue;

    counted.push({
      name: uc.card_name,
      openedDate: uc.card_since,
      source: "portfolio",
      agesOutDate: agesOutDate(uc.card_since),
    });
  }

  // 2. External cards opened in the window
  for (const ec of externalCards) {
    if (!ec.opened_at) continue;
    const opened = new Date(ec.opened_at);
    if (opened < windowStart) continue;

    const issuer = (ec.issuer ?? "").toLowerCase();

    // Business cards don't count, except Capital One & Discover
    if (ec.is_business && !BUSINESS_COUNTS_ISSUERS.has(issuer)) continue;

    counted.push({
      name: ec.card_name,
      openedDate: ec.opened_at,
      source: "external",
      agesOutDate: agesOutDate(ec.opened_at),
    });
  }

  // Sort by opened date ascending (oldest first)
  counted.sort(
    (a, b) => new Date(a.openedDate).getTime() - new Date(b.openedDate).getTime()
  );

  const count = counted.length;
  const isEligible = count < MAX_ALLOWED;
  const slotsRemaining = Math.max(0, MAX_ALLOWED - count);

  // Next eligible date: when enough cards age out to drop below 5
  let nextEligibleDate: string | null = null;
  if (!isEligible) {
    // Need to drop to 4 → the (count - 4)th oldest card's ages-out date
    const dropNeeded = count - MAX_ALLOWED + 1;
    if (dropNeeded <= counted.length) {
      nextEligibleDate = counted[dropNeeded - 1].agesOutDate;
    }
  }

  return {
    count,
    maxAllowed: MAX_ALLOWED,
    isEligible,
    slotsRemaining,
    nextEligibleDate,
    countedCards: counted,
  };
}
