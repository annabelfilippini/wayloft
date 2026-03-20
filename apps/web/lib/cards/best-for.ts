import "server-only";
import type { CatalogCard } from "@wayloft/shared";
import { getAllCards } from "./catalog";

export interface BestForCategory {
  slug: string;
  title: string;
  headline: string;
  description: string;
  /** Filter + sort logic to pick cards for this category */
  selectCards: (cards: CatalogCard[]) => CatalogCard[];
}

const CATEGORIES: BestForCategory[] = [
  {
    slug: "dining",
    title: "Best Credit Cards for Dining",
    headline: "Eat out more, pay less.",
    description:
      "The top credit cards for restaurants, takeout, and food delivery — ranked by earning rate, signup bonus, and annual fee tradeoff.",
    selectCards: (cards) =>
      cards
        .filter((c) => !c.is_business && (c.earning_rates.dining ?? 1) >= 3)
        .sort((a, b) => {
          const aRate = a.earning_rates.dining ?? 1;
          const bRate = b.earning_rates.dining ?? 1;
          if (bRate !== aRate) return bRate - aRate;
          return (b.signup_bonus?.points ?? 0) - (a.signup_bonus?.points ?? 0);
        })
        .slice(0, 6),
  },
  {
    slug: "travel",
    title: "Best Credit Cards for Travel",
    headline: "Travel smarter, not harder.",
    description:
      "Premium and mid-tier travel cards with the best earning rates on flights and hotels, transfer partners, and travel perks.",
    selectCards: (cards) =>
      cards
        .filter(
          (c) =>
            !c.is_business &&
            ((c.earning_rates.flights ?? 1) >= 2 ||
              (c.earning_rates.hotels ?? 1) >= 2 ||
              c.portal_cpp >= 1.25)
        )
        .sort((a, b) => {
          const aTravel = Math.max(
            a.earning_rates.flights ?? 1,
            a.earning_rates.hotels ?? 1
          );
          const bTravel = Math.max(
            b.earning_rates.flights ?? 1,
            b.earning_rates.hotels ?? 1
          );
          if (bTravel !== aTravel) return bTravel - aTravel;
          return (b.signup_bonus?.points ?? 0) - (a.signup_bonus?.points ?? 0);
        })
        .slice(0, 6),
  },
  {
    slug: "cash-back",
    title: "Best Cash Back Credit Cards",
    headline: "Simple rewards, real money.",
    description:
      "No points to decode, no portals to navigate. These cards put cash back in your pocket on everyday spending.",
    selectCards: (cards) =>
      cards
        .filter(
          (c) =>
            !c.is_business &&
            (c.currency === "UR" || c.currency === "TYP" || c.currency === "C1") &&
            c.portal_cpp === 0 &&
            ((c.earning_rates.other ?? 1) >= 1.5 ||
              c.best_for.some(
                (b) =>
                  b.includes("cash back") ||
                  b.includes("flat rate") ||
                  b.includes("simple")
              ))
        )
        .sort((a, b) => {
          const aBase = a.earning_rates.other ?? 1;
          const bBase = b.earning_rates.other ?? 1;
          if (bBase !== aBase) return bBase - aBase;
          return a.annual_fee_cents - b.annual_fee_cents;
        })
        .slice(0, 6),
  },
  {
    slug: "no-annual-fee",
    title: "Best No Annual Fee Credit Cards",
    headline: "Great rewards, zero fee.",
    description:
      "You don't need to pay $500/year to earn solid rewards. These no-fee cards punch above their weight.",
    selectCards: (cards) =>
      cards
        .filter((c) => !c.is_business && c.annual_fee_cents === 0)
        .sort((a, b) => {
          const aMax = Math.max(...Object.values(a.earning_rates));
          const bMax = Math.max(...Object.values(b.earning_rates));
          if (bMax !== aMax) return bMax - aMax;
          return (b.signup_bonus?.points ?? 0) - (a.signup_bonus?.points ?? 0);
        })
        .slice(0, 6),
  },
  {
    slug: "hotels",
    title: "Best Credit Cards for Hotels",
    headline: "Free nights, elite status, and more.",
    description:
      "Whether you're loyal to one chain or want flexibility, these hotel cards deliver the best value for frequent (and occasional) travelers.",
    selectCards: (cards) =>
      cards
        .filter(
          (c) =>
            !c.is_business &&
            ((c.earning_rates.hotels ?? 1) >= 3 ||
              c.best_for.some(
                (b) =>
                  b.includes("hotel") ||
                  b.includes("Hilton") ||
                  b.includes("Hyatt") ||
                  b.includes("Marriott") ||
                  b.includes("IHG") ||
                  b.includes("Wyndham")
              ))
        )
        .sort((a, b) => {
          const aHotel = a.earning_rates.hotels ?? 1;
          const bHotel = b.earning_rates.hotels ?? 1;
          if (bHotel !== aHotel) return bHotel - aHotel;
          return (b.signup_bonus?.points ?? 0) - (a.signup_bonus?.points ?? 0);
        })
        .slice(0, 6),
  },
  {
    slug: "groceries",
    title: "Best Credit Cards for Groceries",
    headline: "Maximize every trip to the store.",
    description:
      "The top credit cards for supermarkets and grocery stores — some earning up to 6x points per dollar. If groceries are a big part of your budget, the right card makes a real difference.",
    selectCards: (cards) =>
      cards
        .filter((c) => !c.is_business && (c.earning_rates.groceries ?? 1) >= 3)
        .sort((a, b) => {
          const aRate = a.earning_rates.groceries ?? 1;
          const bRate = b.earning_rates.groceries ?? 1;
          if (bRate !== aRate) return bRate - aRate;
          return (b.signup_bonus?.points ?? 0) - (a.signup_bonus?.points ?? 0);
        })
        .slice(0, 6),
  },
  {
    slug: "gas",
    title: "Best Credit Cards for Gas",
    headline: "Stop leaving money at the pump.",
    description:
      "Whether you commute daily or road trip often, these cards earn 2x–5x on gas stations — turning every fill-up into real rewards.",
    selectCards: (cards) =>
      cards
        .filter((c) => !c.is_business && (c.earning_rates.gas ?? 1) >= 3)
        .sort((a, b) => {
          const aRate = a.earning_rates.gas ?? 1;
          const bRate = b.earning_rates.gas ?? 1;
          if (bRate !== aRate) return bRate - aRate;
          // Tie-break: lower annual fee wins for a commodity category
          return a.annual_fee_cents - b.annual_fee_cents;
        })
        .slice(0, 6),
  },
  {
    slug: "streaming",
    title: "Best Credit Cards for Streaming",
    headline: "Get paid to watch.",
    description:
      "Netflix, Spotify, Hulu, Disney+ — you're paying for them anyway. These cards earn up to 6x on streaming subscriptions so your monthly bills work harder.",
    selectCards: (cards) =>
      cards
        .filter((c) => !c.is_business && (c.earning_rates.streaming ?? 1) >= 2)
        .sort((a, b) => {
          const aRate = a.earning_rates.streaming ?? 1;
          const bRate = b.earning_rates.streaming ?? 1;
          if (bRate !== aRate) return bRate - aRate;
          return a.annual_fee_cents - b.annual_fee_cents;
        })
        .slice(0, 6),
  },
  {
    slug: "points-transfer",
    title: "Best Credit Cards for Points & Miles",
    headline: "Flexible points, outsized value.",
    description:
      "Cards that earn transferable points (Chase UR, Amex MR, Citi TYP, Capital One) let you move rewards to airlines and hotels for 2–3x the value. These are the cards serious travel hackers build around.",
    selectCards: (cards) => {
      const transferCurrencies = ["UR", "MR", "TYP", "C1", "Bilt"];
      return cards
        .filter(
          (c) =>
            !c.is_business &&
            transferCurrencies.includes(c.currency) &&
            c.portal_cpp >= 1
        )
        .sort((a, b) => {
          // Higher portal cpp first
          if (b.portal_cpp !== a.portal_cpp) return b.portal_cpp - a.portal_cpp;
          // Then by signup bonus value
          return (b.signup_bonus?.points ?? 0) - (a.signup_bonus?.points ?? 0);
        })
        .slice(0, 8);
    },
  },
];

export function getAllBestForCategories(): BestForCategory[] {
  return CATEGORIES;
}

export function getBestForCategory(slug: string): BestForCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getBestCardsForCategory(
  category: BestForCategory
): CatalogCard[] {
  return category.selectCards(getAllCards());
}
