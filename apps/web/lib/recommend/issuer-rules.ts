/**
 * Pre-processed lookup Sets from data/issuer-rules.json.
 * Only includes rules that the recommendation engine can evaluate
 * with current quiz data (currentCardSlugs + cardsOpened24mo).
 */

import issuerRulesData from "../../../../data/issuer-rules.json";

// --- Helpers ---

type IssuerData = (typeof issuerRulesData)["issuers"][keyof (typeof issuerRulesData)["issuers"]];
type Rule = { id: string; affected_cards: string[]; parameters?: Record<string, unknown> };

function findRule(issuer: IssuerData, category: "application_rules" | "bonus_rules" | "product_rules", id: string): Rule | undefined {
  return (issuer[category] as Rule[]).find((r) => r.id === id);
}

function toSet(cards: string[] | undefined): Set<string> {
  return new Set(cards ?? []);
}

// --- Chase One Sapphire (hard filter) ---

const oneSapphire = findRule(issuerRulesData.issuers.chase, "product_rules", "chase-one-sapphire");
export const SAPPHIRE_SLUGS = toSet(oneSapphire?.affected_cards);

// --- Chase 5/24 ---

const chase524 = findRule(issuerRulesData.issuers.chase, "application_rules", "chase-5-24");
export const CHASE_524_MAX = (chase524?.parameters?.max_count as number) ?? 5;
export const CHASE_524_AFFECTED = toSet(chase524?.affected_cards);

// --- Barclays 6/24 ---

const barclays624 = findRule(issuerRulesData.issuers.barclays, "application_rules", "barclays-6-24");
export const BARCLAYS_624_MAX = (barclays624?.parameters?.max_count as number) ?? 6;
export const BARCLAYS_624_AFFECTED = toSet(barclays624?.affected_cards);

// --- Citi 8/48 ---

const citi848 = findRule(issuerRulesData.issuers.citi, "application_rules", "citi-8-48");
export const CITI_848_MAX = (citi848?.parameters?.max_count as number) ?? 8;
export const CITI_848_AFFECTED = toSet(citi848?.affected_cards);

// --- Amex once-per-lifetime ---

const amexLifetime = findRule(issuerRulesData.issuers.amex, "bonus_rules", "amex-lifetime-language");
export const AMEX_LIFETIME_AFFECTED = toSet(amexLifetime?.affected_cards);

// --- Marriott cross-issuer ---

const marriottCross = issuerRulesData.cross_issuer_rules.find((r) => r.id === "marriott-cross-issuer");
export const MARRIOTT_CROSS_SLUGS = toSet(marriottCross?.affected_cards);

// --- Capital One triple pull ---

const c1Triple = findRule(issuerRulesData.issuers.capital_one, "product_rules", "c1-triple-pull");
export const C1_TRIPLE_PULL_AFFECTED = toSet(c1Triple?.affected_cards);
