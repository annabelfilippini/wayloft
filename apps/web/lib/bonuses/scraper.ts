import * as cheerio from "cheerio";
import type { SupabaseClient } from "@supabase/supabase-js";
import transferPartnersData from "../../../../data/transfer-partners.json";

// ── Types ──

export interface ScrapedBonus {
  bank: string;
  partner: string;
  partner_code: string;
  bonus_percentage: number;
  end_date: string | null;
  source_url: string;
  retrieved_date: string; // ISO 8601 date when fetched
  confidence: number; // 0–1 based on parse strategy
}

interface ScraperSource {
  name: string;
  urls: string[];
  parse: (html: string, url: string, retrievedDate: string) => ScrapedBonus[];
}

interface NormalizedBonus {
  bank: string;
  currency: string;
  partner: string;
  partner_code: string;
  partner_type: "airline" | "hotel";
  bonus_percentage: number;
  start_date: string;
  end_date: string | null;
  source_url: string;
  retrieved_date: string;
  confidence: number;
}

export interface DiffResult {
  newBonuses: NormalizedBonus[];
  expiredBonuses: Array<{ id: string; bank: string; partner_code: string }>;
  unchanged: NormalizedBonus[];
}

export interface SourceResult {
  status: "ok" | "parse_failure" | "fetch_failure";
  bonusesFound: number;
  warning?: string;
}

export interface ApplyResult {
  inserted: number;
  expired: number;
  errors: string[];
}

// ── Constants ──

// Frequent Miler consolidated current bonuses page
const FM_URL = "https://frequentmiler.com/current-point-transfer-bonuses/";

// Doctor of Credit per-bank "complete list" pages with Current Promotions sections
const DOC_CHASE_URL =
  "https://www.doctorofcredit.com/a-complete-list-of-previous-current-chase-ultimate-rewards-points-transfer-bonuses/";
const DOC_AMEX_URL =
  "https://www.doctorofcredit.com/complete-list-of-american-express-membership-rewards-transfer-bonuses/";
const DOC_CITI_URL =
  "https://www.doctorofcredit.com/a-complete-list-of-previous-current-citi-thankyou-point-transfer-bonuses/";
// Capital One and Bilt don't have consolidated pages — use tag pages
const DOC_C1_TAG_URL =
  "https://www.doctorofcredit.com/tag/capital-one-transfer-bonuses/";
const DOC_BILT_TAG_URL =
  "https://www.doctorofcredit.com/tag/bilt-transfer-bonuses/";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5MB

const USER_AGENT =
  "Wayloft/1.0 (transfer-bonus-tracker; contact@wayloft.com)";

const KNOWN_BANKS = ["chase", "amex", "citi", "capital_one", "bilt"] as const;
type KnownBank = (typeof KNOWN_BANKS)[number];

// ── Lookup maps built from transfer-partners.json ──

interface PartnerInfo {
  code: string;
  name: string;
  type: "airline" | "hotel";
  bank: string;
  currency: string;
}

const partnerLookup: Map<string, PartnerInfo> = new Map();
const partnerCodeSet: Set<string> = new Set();
const bankCurrencyMap: Map<string, string> = new Map();

// Build lookup maps at module load time
for (const [currencyCode, currencyData] of Object.entries(
  transferPartnersData.currencies
)) {
  const issuer = currencyData.issuer;
  bankCurrencyMap.set(issuer, currencyCode);

  for (const airline of currencyData.transfer_partners.airlines) {
    partnerCodeSet.add(airline.code);
    const key = `${issuer}:${airline.code}`;
    partnerLookup.set(key, {
      code: airline.code,
      name: airline.partner,
      type: "airline",
      bank: issuer,
      currency: currencyCode,
    });
  }
  for (const hotel of currencyData.transfer_partners.hotels) {
    partnerCodeSet.add(hotel.code);
    const key = `${issuer}:${hotel.code}`;
    partnerLookup.set(key, {
      code: hotel.code,
      name: hotel.partner,
      type: "hotel",
      bank: issuer,
      currency: currencyCode,
    });
  }
}

// Fuzzy name → partner code map (lowercase name → code)
const nameToCodeMap: Map<string, string> = new Map();
for (const [, currencyData] of Object.entries(
  transferPartnersData.currencies
)) {
  for (const p of [
    ...currencyData.transfer_partners.airlines,
    ...currencyData.transfer_partners.hotels,
  ]) {
    // Full name match
    nameToCodeMap.set(p.partner.toLowerCase(), p.code);
    // Shortened versions for partial matching
    const shortName = p.partner.split(" ")[0].toLowerCase();
    if (!nameToCodeMap.has(shortName)) {
      nameToCodeMap.set(shortName, p.code);
    }
    // Also add without common suffixes
    for (const suffix of [
      " avios",
      " flying club",
      " mileage club",
      " mileageplus",
      " rapid rewards",
      " krisflyer",
      " skywards",
      " flying blue",
      " trueblue",
      " asia miles",
      " frequent flyer",
      " lifemiles",
      " aerclub",
      " guest",
      " hawaiianmiles",
      " one rewards",
      " bonvoy",
      " honors",
      " privileges",
      " rewards",
      " live limitless",
      " miles&smiles",
      " privilege club",
    ]) {
      const stripped = p.partner.toLowerCase().replace(suffix, "").trim();
      if (stripped && !nameToCodeMap.has(stripped)) {
        nameToCodeMap.set(stripped, p.code);
      }
    }
  }
}

// Additional common aliases not covered above
const partnerAliases: Map<string, string> = new Map([
  ["hyatt", "HYATT"],
  ["world of hyatt", "HYATT"],
  ["ihg", "IHG"],
  ["marriott", "MARRIOTT"],
  ["hilton", "HILTON"],
  ["wyndham", "WYNDHAM"],
  ["choice", "CHOICE"],
  ["accor", "ACCOR"],
  ["united", "UA"],
  ["southwest", "WN"],
  ["british airways", "BA"],
  ["avios", "BA"],
  ["aeroplan", "AC"],
  ["air canada", "AC"],
  ["singapore", "SQ"],
  ["emirates", "EK"],
  ["flying blue", "AF"],
  ["air france", "AF"],
  ["klm", "AF"],
  ["airfrance", "AF"],
  ["airfrance/klm", "AF"],
  ["iberia", "IB"],
  ["virgin atlantic", "VS"],
  ["virgin", "VS"],
  ["jetblue", "B6"],
  ["delta", "DL"],
  ["ana", "NH"],
  ["cathay", "CX"],
  ["cathay pacific", "CX"],
  ["qantas", "QF"],
  ["avianca", "AV"],
  ["lifemiles", "AV"],
  ["aer lingus", "EI"],
  ["etihad", "EY"],
  ["hawaiian", "HA"],
  ["turkish", "TK"],
  ["qatar", "QR"],
  ["japan airlines", "JL"],
  ["jal", "JL"],
]);

// Bank name aliases → internal bank code
const bankAliases: Map<string, KnownBank> = new Map([
  ["chase", "chase"],
  ["chase ultimate rewards", "chase"],
  ["ultimate rewards", "chase"],
  ["ur", "chase"],
  ["amex", "amex"],
  ["american express", "amex"],
  ["amex membership rewards", "amex"],
  ["membership rewards", "amex"],
  ["mr", "amex"],
  ["citi", "citi"],
  ["citi thankyou", "citi"],
  ["thankyou points", "citi"],
  ["thankyou", "citi"],
  ["typ", "citi"],
  ["capital one", "capital_one"],
  ["capital one miles", "capital_one"],
  ["capitalone", "capital_one"],
  ["c1", "capital_one"],
  ["bilt", "bilt"],
  ["bilt rewards", "bilt"],
]);

// ── Fetch helper ──

async function safeFetch(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    // Check content-length if available
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_BYTES) {
      throw new Error(
        `Response too large (${contentLength} bytes) from ${url}`
      );
    }

    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      throw new Error(
        `Response body too large (${text.length} chars) from ${url}`
      );
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Bank name resolution ──

function resolveBank(rawBank: string): KnownBank | null {
  const normalized = rawBank.trim().toLowerCase();
  // Direct match
  const direct = bankAliases.get(normalized);
  if (direct) return direct;
  // Substring match
  for (const [alias, bank] of bankAliases) {
    if (normalized.includes(alias)) return bank;
  }
  return null;
}

// ── Partner code resolution ──

function resolvePartnerCode(rawPartner: string): string | null {
  const trimmed = rawPartner.trim();
  const normalized = trimmed.toLowerCase();

  // Direct code match (e.g. "BA", "HYATT")
  const upper = trimmed.toUpperCase();
  if (partnerCodeSet.has(upper)) return upper;

  // Check partner aliases first (more specific)
  const fromAlias = partnerAliases.get(normalized);
  if (fromAlias) return fromAlias;

  // Full name match from transfer-partners.json
  const fromName = nameToCodeMap.get(normalized);
  if (fromName) return fromName;

  // Partial name match: try matching against known partner names & aliases
  for (const [alias, code] of partnerAliases) {
    if (normalized.includes(alias) || alias.includes(normalized)) {
      return code;
    }
  }
  for (const [name, code] of nameToCodeMap) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return code;
    }
  }

  return null;
}

// ── Parse bonus percentage ──

function parseBonusPercentage(raw: string): number | null {
  // Match patterns like "30%", "+30%", "30% bonus", "30% transfer bonus"
  const match = raw.match(/(\d+)\s*%/);
  if (match) return parseInt(match[1]);

  // Try plain number
  const num = parseInt(raw.trim());
  if (!isNaN(num) && num > 0) return num;

  return null;
}

// ── Parse end date ──

function parseEndDate(raw: string): string | null {
  if (!raw || raw.trim().toLowerCase() === "ongoing") return null;

  const cleaned = raw.trim();

  // "MM/DD/YYYY" or "M/D/YYYY" or "MM/DD/YY"
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // "Month DD, YYYY" or "Month DD YYYY" or "Mon DD, YYYY"
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09",
    oct: "10", nov: "11", dec: "12",
  };
  const namedMatch = cleaned.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (namedMatch) {
    const monthStr = namedMatch[1].toLowerCase();
    const mm = months[monthStr];
    if (mm) {
      return `${namedMatch[3]}-${mm}-${namedMatch[2].padStart(2, "0")}`;
    }
  }

  // "YYYY-MM-DD" (already ISO)
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  return null;
}

// ── Source Parsers ──

/**
 * Frequent Miler: frequentmiler.com/current-point-transfer-bonuses/
 *
 * Consolidated page with all current bonuses. Structure varies but typically:
 * - Tables with columns: Program/Bank, Partner, Bonus %, End Date
 * - Or structured sections with headings per bank
 * - Or list items with bonus details
 */
function parseFrequentMiler(html: string, url: string, retrievedDate: string): ScrapedBonus[] {
  const $ = cheerio.load(html);
  const bonuses: ScrapedBonus[] = [];

  // Strategy 1: Tables — FM often uses tables for transfer bonuses
  $("table").each((_, table) => {
    const headers: string[] = [];
    $(table)
      .find("th, thead td")
      .each((__, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });

    // Need columns that look like: program/bank, partner, bonus
    const hasBankCol = headers.some(
      (h) =>
        h.includes("program") ||
        h.includes("bank") ||
        h.includes("currency") ||
        h.includes("issuer") ||
        h.includes("from")
    );
    const hasPartnerCol = headers.some(
      (h) =>
        h.includes("partner") ||
        h.includes("airline") ||
        h.includes("hotel") ||
        h.includes("to")
    );
    const hasBonusCol = headers.some(
      (h) =>
        h.includes("bonus") ||
        h.includes("%") ||
        h.includes("percent") ||
        h.includes("rate")
    );

    if (!hasBankCol && !hasPartnerCol) return;

    const bankIdx = headers.findIndex(
      (h) =>
        h.includes("program") ||
        h.includes("bank") ||
        h.includes("currency") ||
        h.includes("issuer") ||
        h.includes("from")
    );
    const partnerIdx = headers.findIndex(
      (h) =>
        h.includes("partner") ||
        h.includes("airline") ||
        h.includes("hotel") ||
        h.includes("to")
    );
    const bonusIdx = hasBonusCol
      ? headers.findIndex(
          (h) =>
            h.includes("bonus") ||
            h.includes("%") ||
            h.includes("percent") ||
            h.includes("rate")
        )
      : -1;
    const dateIdx = headers.findIndex(
      (h) =>
        h.includes("end") ||
        h.includes("expir") ||
        h.includes("date") ||
        h.includes("through") ||
        h.includes("until")
    );

    $(table)
      .find("tbody tr, tr")
      .each((__, row) => {
        const cells = $(row).find("td");
        if (cells.length < 2) return;

        const bankText = bankIdx >= 0 ? $(cells[bankIdx]).text() : "";
        const partnerText =
          partnerIdx >= 0 ? $(cells[partnerIdx]).text() : "";
        const bonusText =
          bonusIdx >= 0
            ? $(cells[bonusIdx]).text()
            : cells
                .toArray()
                .map((c) => $(c).text())
                .find((t) => t.includes("%")) ?? "";
        const dateText = dateIdx >= 0 ? $(cells[dateIdx]).text() : "";

        const bank = resolveBank(bankText);
        const partnerCode = resolvePartnerCode(partnerText);
        const pct = parseBonusPercentage(bonusText);

        if (bank && partnerCode && pct) {
          bonuses.push({
            bank,
            partner: partnerText.trim(),
            partner_code: partnerCode,
            bonus_percentage: pct,
            end_date: parseEndDate(dateText),
            source_url: url,
            retrieved_date: retrievedDate,
            confidence: 0.90,
          });
        }
      });
  });

  if (bonuses.length > 0) return bonuses;

  // Strategy 2: Sections by bank with list items or paragraphs
  // FM sometimes groups by bank under headings
  const bankRegex =
    /\b(chase|amex|american express|citi|capital one|bilt)\b/i;

  $("h2, h3, h4").each((_, heading) => {
    const hText = $(heading).text();
    const bankMatch = hText.match(bankRegex);
    if (!bankMatch) return;

    const bank = resolveBank(bankMatch[0]);
    if (!bank) return;

    // Scan siblings after this heading
    let sibling = $(heading).next();
    let scanned = 0;
    while (sibling.length && scanned < 20) {
      const tag = sibling.prop("tagName")?.toLowerCase();
      if (tag && ["h2", "h3", "h4"].includes(tag)) break;

      // Check list items and paragraphs within this sibling
      const elements =
        tag === "ul" || tag === "ol"
          ? sibling.find("li")
          : sibling.is("p, li, div")
            ? sibling
            : sibling.find("p, li");

      elements.each((__, el) => {
        const text = $(el).text();
        const pct = parseBonusPercentage(text);
        if (!pct) return;

        // Find partner in text
        let foundCode: string | null = null;
        for (const [alias, code] of partnerAliases) {
          if (text.toLowerCase().includes(alias)) {
            foundCode = code;
            break;
          }
        }
        if (!foundCode) {
          for (const [name, code] of nameToCodeMap) {
            if (text.toLowerCase().includes(name)) {
              foundCode = code;
              break;
            }
          }
        }

        const dateMatch = text.match(
          /(?:through|until|ends?|expires?|valid until)\s*:?\s*(.+?)(?:\.|,|$)/i
        );

        if (foundCode) {
          bonuses.push({
            bank,
            partner: text.trim().slice(0, 80),
            partner_code: foundCode,
            bonus_percentage: pct,
            end_date: dateMatch ? parseEndDate(dateMatch[1]) : null,
            source_url: url,
            retrieved_date: retrievedDate,
            confidence: 0.70,
          });
        }
      });

      sibling = sibling.next();
      scanned++;
    }
  });

  if (bonuses.length > 0) return bonuses;

  // Strategy 3: Scan all list items and paragraphs with percentage + bank pattern
  // Pattern: "Bank: XX% Transfer Bonus To Partner (ratio). Valid until Date"
  // or "Bank → Partner: XX% bonus through Date"
  const contentEl = $(
    ".entry-content, .post-content, article, .content, main"
  ).first();
  const searchEl = contentEl.length ? contentEl : $("body");

  searchEl.find("li, p").each((_, el) => {
    const text = $(el).text();
    const pctMatch = text.match(/(\d+)\s*%/);
    if (!pctMatch) return;

    const bankMatch = text.match(bankRegex);
    if (!bankMatch) return;

    const bank = resolveBank(bankMatch[0]);
    if (!bank) return;

    const pct = parseInt(pctMatch[1]);

    // Extract partner — look for known partner names in the text
    let foundCode: string | null = null;
    let foundPartner = "";
    for (const [alias, code] of partnerAliases) {
      if (text.toLowerCase().includes(alias)) {
        foundCode = code;
        foundPartner = alias;
        break;
      }
    }
    if (!foundCode) {
      for (const [name, code] of nameToCodeMap) {
        if (text.toLowerCase().includes(name)) {
          foundCode = code;
          foundPartner = name;
          break;
        }
      }
    }

    const dateMatch = text.match(
      /(?:through|until|ends?|expires?|valid until)\s*:?\s*(.+?)(?:\.|,|\)|$)/i
    );

    if (bank && foundCode && pct) {
      bonuses.push({
        bank,
        partner: foundPartner,
        partner_code: foundCode,
        bonus_percentage: pct,
        end_date: dateMatch ? parseEndDate(dateMatch[1]) : null,
        source_url: url,
        retrieved_date: retrievedDate,
        confidence: 0.50,
      });
    }
  });

  return bonuses;
}

/**
 * Doctor of Credit per-bank "Complete List" pages.
 *
 * Structure (confirmed from live site):
 * - "Current Promotions" heading or section near the top
 * - Bulleted list (ul/li) under "Current Promotions"
 * - Each item: "[Partner]: [X]% Transfer Bonus To [Partner] ([ratio]). Valid until [date]"
 * - Or linked text: "Chase Ultimate Rewards: 80% Transfer Bonus To IHG (1:1.8)"
 * - Historical bonuses below under partner-specific headings
 *
 * The bank is known from the URL, so we don't need to parse it from each entry.
 */
function parseDoctorOfCreditPerBank(
  html: string,
  url: string,
  retrievedDate: string
): ScrapedBonus[] {
  const $ = cheerio.load(html);
  const bonuses: ScrapedBonus[] = [];

  // Determine which bank this page is for based on the URL
  let bank: KnownBank | null = null;
  if (url.includes("chase")) bank = "chase";
  else if (
    url.includes("american-express") ||
    url.includes("membership-rewards")
  )
    bank = "amex";
  else if (url.includes("citi") || url.includes("thankyou"))
    bank = "citi";
  else if (url.includes("capital-one")) bank = "capital_one";
  else if (url.includes("bilt")) bank = "bilt";

  // Strategy 1: Find "Current Promotions" section
  // Look for headings containing "current" and parse list items after them
  let foundCurrentSection = false;

  $("h2, h3, h4, strong, b, p").each((_, el) => {
    const text = $(el).text().toLowerCase();
    if (
      text.includes("current promotion") ||
      text.includes("current bonus") ||
      text.includes("current transfer")
    ) {
      foundCurrentSection = true;

      // Parse list items after this element
      let sibling = $(el).is("p, strong, b")
        ? $(el).parent().next()
        : $(el).next();
      let scanned = 0;

      while (sibling.length && scanned < 15) {
        const tag = sibling.prop("tagName")?.toLowerCase();
        // Stop at next heading (historical section)
        if (tag && ["h2", "h3", "h4"].includes(tag)) break;

        const listItems =
          tag === "ul" || tag === "ol" ? sibling.find("li") : sibling;

        listItems.each((__, li) => {
          const itemText = $(li).text();
          parseDocEntryText(itemText, bank, url, bonuses, retrievedDate, 0.85);
        });

        sibling = sibling.next();
        scanned++;
      }
    }
  });

  if (bonuses.length > 0) return bonuses;

  // Strategy 2: If no "Current Promotions" heading found,
  // scan all list items in the content area for active-looking entries
  const contentEl = $(
    ".entry-content, .post-content, article, .content"
  ).first();
  if (!contentEl.length) return bonuses;

  // Look for entries that DON'T have "[Expired]" and DO have a percentage
  contentEl.find("li").each((_, li) => {
    const text = $(li).text();
    if (text.toLowerCase().includes("[expired]")) return;
    if (text.toLowerCase().includes("expired")) return;
    if (!text.match(/\d+\s*%/)) return;

    parseDocEntryText(text, bank, url, bonuses, retrievedDate, 0.70);
  });

  // Strategy 3: Paragraphs in content
  if (bonuses.length === 0) {
    contentEl.find("p").each((_, p) => {
      const text = $(p).text();
      if (text.toLowerCase().includes("[expired]")) return;
      if (!text.match(/\d+\s*%/)) return;

      parseDocEntryText(text, bank, url, bonuses, retrievedDate, 0.60);
    });
  }

  return bonuses;
}

/**
 * Parse a single DoC entry text line.
 *
 * Common formats:
 * - "Chase Ultimate Rewards: 80% Transfer Bonus To IHG (1:1.8). Valid until 1/15/24"
 * - "40% To Virgin Atlantic. Valid until 12/31/24"
 * - "25% To JetBlue (250:250). Valid until 12/31/24"
 * - "30% Transfer Bonus To Wyndham (1:1.3)"
 */
function parseDocEntryText(
  text: string,
  knownBank: KnownBank | null,
  sourceUrl: string,
  bonuses: ScrapedBonus[],
  retrievedDate: string,
  confidence: number
): void {
  const pct = parseBonusPercentage(text);
  if (!pct) return;

  // Determine bank — either from the known URL context or parse from text
  let bank = knownBank;
  if (!bank) {
    const bankMatch = text.match(
      /\b(chase|amex|american express|citi|capital one|bilt)\b/i
    );
    if (bankMatch) bank = resolveBank(bankMatch[0]);
  }
  if (!bank) return;

  // Extract partner name — look for "To [Partner]" pattern first (DoC standard)
  let partnerCode: string | null = null;

  // Pattern: "XX% Transfer Bonus To [Partner]" or "XX% To [Partner]"
  const toMatch = text.match(/\d+\s*%\s*(?:transfer\s+bonus\s+)?to\s+(.+?)(?:\s*\(|\.|\s*,\s*valid|\s*$)/i);
  if (toMatch) {
    partnerCode = resolvePartnerCode(toMatch[1].trim());
  }

  // Fallback: scan text for any known partner name
  if (!partnerCode) {
    for (const [alias, code] of partnerAliases) {
      if (text.toLowerCase().includes(alias)) {
        partnerCode = code;
        break;
      }
    }
  }
  if (!partnerCode) {
    for (const [name, code] of nameToCodeMap) {
      if (text.toLowerCase().includes(name)) {
        partnerCode = code;
        break;
      }
    }
  }

  if (!partnerCode) return;

  // Extract end date
  const dateMatch = text.match(
    /(?:valid\s+until|through|until|ends?\s*:?|expires?\s*:?)\s*(.+?)(?:\.|,|\)|$)/i
  );
  const endDate = dateMatch ? parseEndDate(dateMatch[1]) : null;

  bonuses.push({
    bank,
    partner: text.trim().slice(0, 80),
    partner_code: partnerCode,
    bonus_percentage: pct,
    end_date: endDate,
    source_url: sourceUrl,
    retrieved_date: retrievedDate,
    confidence,
  });
}

/**
 * Doctor of Credit tag page parser (for Capital One and Bilt).
 *
 * Tag pages show a list of blog posts with titles and excerpts.
 * Structure: <article class="vce-post"> with title, date, excerpt.
 *
 * Post titles follow patterns like:
 * - "Chase Ultimate Rewards: 30% Transfer Bonus To Wyndham (1:1.3)"
 * - "Capital One Transfer Bonus: 30% To Preferred Hotels & Resorts"
 * - "Bilt Rent Day (March 2026): Up To 125% Bonus To Japan Airlines (JAL)"
 *
 * We parse the title + excerpt for bonus details, only if NOT marked [Expired].
 */
function parseDoctorOfCreditTagPage(
  html: string,
  url: string,
  retrievedDate: string
): ScrapedBonus[] {
  const $ = cheerio.load(html);
  const bonuses: ScrapedBonus[] = [];

  // Determine bank from URL
  let knownBank: KnownBank | null = null;
  if (url.includes("capital-one")) knownBank = "capital_one";
  else if (url.includes("bilt")) knownBank = "bilt";

  // Parse each article/post entry
  $("article, .vce-post, .post").each((_, article) => {
    const titleEl = $(article).find("h2 a, h3 a, .entry-title a").first();
    const title = titleEl.text().trim();

    // Skip expired posts
    if (title.toLowerCase().startsWith("[expired]")) return;
    if (title.toLowerCase().includes("expired")) return;

    // Try to extract bonus from title
    const pct = parseBonusPercentage(title);
    if (!pct) return;

    let bank: KnownBank | null = knownBank;
    if (!bank) {
      const bankMatch = title.match(
        /\b(chase|amex|american express|citi|capital one|bilt)\b/i
      );
      if (bankMatch) bank = resolveBank(bankMatch[0]);
    }
    if (!bank) return;

    // Extract partner from title
    let partnerCode: string | null = null;

    // "XX% Transfer Bonus To [Partner]" or "XX% To [Partner]" or "XX% Bonus To [Partner]"
    const toMatch = title.match(
      /\d+\s*%\s*(?:transfer\s+)?(?:bonus\s+)?to\s+(.+?)(?:\s*\(|$)/i
    );
    if (toMatch) {
      partnerCode = resolvePartnerCode(toMatch[1].trim());
    }

    // Fallback: scan title for known partners
    if (!partnerCode) {
      for (const [alias, code] of partnerAliases) {
        if (title.toLowerCase().includes(alias)) {
          partnerCode = code;
          break;
        }
      }
    }

    if (!partnerCode) return;

    // Try to extract date from excerpt
    const excerpt =
      $(article).find(".entry-excerpt, .entry-summary, p").first().text() ?? "";
    const dateMatch = (title + " " + excerpt).match(
      /(?:valid\s+until|through|until|ends?\s*:?|expires?\s*:?)\s*(.+?)(?:\.|,|\)|$)/i
    );

    bonuses.push({
      bank,
      partner: title.slice(0, 80),
      partner_code: partnerCode,
      bonus_percentage: pct,
      end_date: dateMatch ? parseEndDate(dateMatch[1]) : null,
      source_url: url,
      retrieved_date: retrievedDate,
      confidence: 0.65,
    });
  });

  return bonuses;
}

// ── Sources ──

const sources: ScraperSource[] = [
  {
    name: "frequent_miler",
    urls: [FM_URL],
    parse: parseFrequentMiler,
  },
  {
    name: "doc_per_bank",
    urls: [DOC_CHASE_URL, DOC_AMEX_URL, DOC_CITI_URL],
    parse: parseDoctorOfCreditPerBank,
  },
  {
    name: "doc_tag_pages",
    urls: [DOC_C1_TAG_URL, DOC_BILT_TAG_URL],
    parse: parseDoctorOfCreditTagPage,
  },
];

// ── Normalization & Validation ──

function normalize(
  scraped: ScrapedBonus[],
  today: string
): NormalizedBonus[] {
  const results: NormalizedBonus[] = [];
  const seen = new Set<string>();

  for (const bonus of scraped) {
    const bank = resolveBank(bonus.bank) ?? (bonus.bank as KnownBank);

    // Validate bank
    if (!KNOWN_BANKS.includes(bank as KnownBank)) {
      console.warn(
        `[scraper] REJECT: unknown bank "${bonus.bank}" for partner ${bonus.partner_code}`
      );
      continue;
    }

    // Validate partner_code exists in transfer-partners.json
    if (!partnerCodeSet.has(bonus.partner_code)) {
      console.warn(
        `[scraper] REJECT: unknown partner_code "${bonus.partner_code}" (partner: "${bonus.partner}")`
      );
      continue;
    }

    // Validate bonus percentage range
    if (bonus.bonus_percentage < 1 || bonus.bonus_percentage > 200) {
      console.warn(
        `[scraper] REJECT: bonus_percentage ${bonus.bonus_percentage} out of range for ${bank}→${bonus.partner_code}`
      );
      continue;
    }

    // Validate this bank actually has this partner
    const lookupKey = `${bank}:${bonus.partner_code}`;
    const partnerInfo = partnerLookup.get(lookupKey);
    if (!partnerInfo) {
      console.warn(
        `[scraper] REJECT: ${bank} does not transfer to ${bonus.partner_code}`
      );
      continue;
    }

    // Dedup by (bank, partner_code) — keep the first occurrence
    const dedupKey = `${bank}:${bonus.partner_code}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    results.push({
      bank,
      currency: partnerInfo.currency,
      partner: partnerInfo.name,
      partner_code: bonus.partner_code,
      partner_type: partnerInfo.type,
      bonus_percentage: bonus.bonus_percentage,
      start_date: today,
      end_date: bonus.end_date,
      source_url: bonus.source_url,
      retrieved_date: bonus.retrieved_date,
      confidence: bonus.confidence,
    });
  }

  return results;
}

// ── Diff ──

export function diffBonuses(
  scraped: NormalizedBonus[],
  existing: Array<{
    id: string;
    bank: string;
    partner_code: string;
    bonus_percentage: number;
  }>
): DiffResult {
  const scrapedMap = new Map(
    scraped.map((b) => [`${b.bank}:${b.partner_code}`, b])
  );
  const existingMap = new Map(
    existing.map((b) => [`${b.bank}:${b.partner_code}`, b])
  );

  const newBonuses: NormalizedBonus[] = [];
  const unchanged: NormalizedBonus[] = [];
  const expiredBonuses: DiffResult["expiredBonuses"] = [];

  // Find new and unchanged
  for (const [key, bonus] of scrapedMap) {
    if (existingMap.has(key)) {
      unchanged.push(bonus);
    } else {
      newBonuses.push(bonus);
    }
  }

  // Find expired (in DB but not in scraped)
  for (const [key, existing_] of existingMap) {
    if (!scrapedMap.has(key)) {
      expiredBonuses.push({
        id: existing_.id,
        bank: existing_.bank,
        partner_code: existing_.partner_code,
      });
    }
  }

  return { newBonuses, expiredBonuses, unchanged };
}

// ── Apply Changes ──

export async function applyChanges(
  supabase: SupabaseClient,
  changes: DiffResult,
  today: string
): Promise<ApplyResult> {
  const errors: string[] = [];
  let inserted = 0;
  let expired = 0;

  // Insert new bonuses with ON CONFLICT DO UPDATE
  for (const bonus of changes.newBonuses) {
    const { error } = await supabase.from("transfer_bonuses").upsert(
      {
        bank: bonus.bank,
        currency: bonus.currency,
        partner: bonus.partner,
        partner_code: bonus.partner_code,
        partner_type: bonus.partner_type,
        bonus_percentage: bonus.bonus_percentage,
        start_date: bonus.start_date,
        end_date: bonus.end_date,
        source_url: bonus.source_url,
        is_active: true,
        scraped_at: new Date().toISOString(),
        retrieved_at: bonus.retrieved_date,
        confidence: bonus.confidence,
      },
      {
        onConflict: "bank,partner_code,start_date",
      }
    );
    if (error) {
      errors.push(
        `INSERT ${bonus.bank}→${bonus.partner_code}: ${error.message}`
      );
    } else {
      inserted++;
    }
  }

  // Expire bonuses: set is_active=false and copy to history
  for (const bonus of changes.expiredBonuses) {
    // Fetch full bonus data before deactivating
    const { data: fullBonus } = await supabase
      .from("transfer_bonuses")
      .select("bank, currency, partner, partner_code, bonus_percentage, start_date, end_date, retrieved_at, confidence")
      .eq("id", bonus.id)
      .single();

    if (fullBonus) {
      // Copy to history
      const { error: histError } = await supabase
        .from("transfer_bonus_history")
        .insert({
          bank: fullBonus.bank,
          currency: fullBonus.currency,
          partner: fullBonus.partner,
          partner_code: fullBonus.partner_code,
          bonus_percentage: fullBonus.bonus_percentage,
          start_date: fullBonus.start_date ?? today,
          end_date: fullBonus.end_date ?? today,
          retrieved_at: fullBonus.retrieved_at,
          confidence: fullBonus.confidence,
        });
      if (histError) {
        errors.push(
          `HISTORY ${bonus.bank}→${bonus.partner_code}: ${histError.message}`
        );
      }

      // Deactivate
      const { error: deactError } = await supabase
        .from("transfer_bonuses")
        .update({ is_active: false })
        .eq("id", bonus.id);
      if (deactError) {
        errors.push(
          `DEACTIVATE ${bonus.bank}→${bonus.partner_code}: ${deactError.message}`
        );
      } else {
        expired++;
      }
    }
  }

  return { inserted, expired, errors };
}

// ── Main scrape pipeline ──

export async function scrapeAllSources(): Promise<{
  sourceResults: Record<string, SourceResult>;
  allBonuses: ScrapedBonus[];
}> {
  const sourceResults: Record<string, SourceResult> = {};
  const allBonuses: ScrapedBonus[] = [];

  for (const source of sources) {
    let totalParsed = 0;
    const warnings: string[] = [];

    for (const url of source.urls) {
      try {
        console.log(`[scraper] Fetching ${source.name}: ${url}`);
        const html = await safeFetch(url);
        console.log(
          `[scraper] ${source.name} (${url}): received ${html.length} chars`
        );

        const retrievedDate = new Date().toISOString();
        const parsed = source.parse(html, url, retrievedDate);
        console.log(
          `[scraper] ${source.name} (${url}): parsed ${parsed.length} bonuses`
        );

        if (parsed.length === 0) {
          warnings.push(
            `${url}: 0 bonuses parsed — HTML structure may have changed`
          );
        }

        totalParsed += parsed.length;
        allBonuses.push(...parsed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[scraper] FETCH FAILURE for ${source.name} (${url}): ${msg}`
        );
        warnings.push(`${url}: fetch failed — ${msg}`);
      }
    }

    if (totalParsed > 0) {
      sourceResults[source.name] = {
        status: "ok",
        bonusesFound: totalParsed,
        ...(warnings.length > 0 && {
          warning: warnings.join("; "),
        }),
      };
    } else if (warnings.some((w) => w.includes("fetch failed"))) {
      sourceResults[source.name] = {
        status: "fetch_failure",
        bonusesFound: 0,
        warning: warnings.join("; "),
      };
    } else {
      sourceResults[source.name] = {
        status: "parse_failure",
        bonusesFound: 0,
        warning: warnings.join("; "),
      };
    }
  }

  return { sourceResults, allBonuses };
}

export { normalize, KNOWN_BANKS, partnerCodeSet };
