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
}

interface ScraperSource {
  name: string;
  url: string;
  parse: (html: string) => ScrapedBonus[];
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

const FREQUENT_MILER_URL =
  "https://frequentmiler.com/transfer-bonus-tracker/";
const DOCTOR_OF_CREDIT_URL =
  "https://www.doctorofcredit.com/transfer-bonuses/";

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
    // Multiple entries per name (e.g. "British Airways Avios" maps to "BA")
    nameToCodeMap.set(p.partner.toLowerCase(), p.code);
    // Also index shortened versions
    const shortName = p.partner.split(" ")[0].toLowerCase();
    if (!nameToCodeMap.has(shortName)) {
      nameToCodeMap.set(shortName, p.code);
    }
  }
}

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
  ["typ", "citi"],
  ["capital one", "capital_one"],
  ["capital one miles", "capital_one"],
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
  return bankAliases.get(normalized) ?? null;
}

// ── Partner code resolution ──

function resolvePartnerCode(rawPartner: string): string | null {
  const normalized = rawPartner.trim().toLowerCase();

  // Direct code match (e.g. "BA", "HYATT")
  const upper = rawPartner.trim().toUpperCase();
  if (partnerCodeSet.has(upper)) return upper;

  // Full name match
  const fromName = nameToCodeMap.get(normalized);
  if (fromName) return fromName;

  // Partial name match: try matching against known partner names
  for (const [name, code] of nameToCodeMap) {
    if (normalized.includes(name) || name.includes(normalized)) {
      return code;
    }
  }

  return null;
}

// ── Parse bonus percentage ──

function parseBonusPercentage(raw: string): number | null {
  // Match patterns like "30%", "+30%", "30% bonus", "30"
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

  // Try various date formats
  const cleaned = raw.trim();

  // "MM/DD/YYYY" or "M/D/YYYY"
  const slashMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // "Month DD, YYYY" or "Month DD YYYY"
  const months: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04",
    jun: "06", jul: "07", aug: "08", sep: "09",
    oct: "10", nov: "11", dec: "12",
  };
  const namedMatch = cleaned.match(
    /(\w+)\s+(\d{1,2}),?\s*(\d{4})/i
  );
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
 * Frequent Miler parser.
 * Looks for HTML tables with transfer bonus data. The actual structure
 * will need adjustment once we see the live HTML, but this covers
 * common patterns: tables, structured divs, and list items.
 */
function parseFrequentMiler(html: string): ScrapedBonus[] {
  const $ = cheerio.load(html);
  const bonuses: ScrapedBonus[] = [];

  // Strategy 1: Look for tables with transfer bonus data
  $("table").each((_, table) => {
    const headers: string[] = [];
    $(table)
      .find("th, thead td")
      .each((__, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });

    // Need at least columns that look like: program/bank, partner, bonus%
    const hasBankCol = headers.some(
      (h) =>
        h.includes("program") ||
        h.includes("bank") ||
        h.includes("currency") ||
        h.includes("issuer")
    );
    const hasPartnerCol = headers.some(
      (h) => h.includes("partner") || h.includes("airline") || h.includes("hotel")
    );
    const hasBonusCol = headers.some(
      (h) => h.includes("bonus") || h.includes("%") || h.includes("percent")
    );

    if (!hasBankCol && !hasPartnerCol) return;

    // Find column indices
    const bankIdx = headers.findIndex(
      (h) =>
        h.includes("program") ||
        h.includes("bank") ||
        h.includes("currency") ||
        h.includes("issuer")
    );
    const partnerIdx = headers.findIndex(
      (h) => h.includes("partner") || h.includes("airline") || h.includes("hotel")
    );
    const bonusIdx = hasBonusCol
      ? headers.findIndex(
          (h) => h.includes("bonus") || h.includes("%") || h.includes("percent")
        )
      : -1;
    const dateIdx = headers.findIndex(
      (h) =>
        h.includes("end") || h.includes("expir") || h.includes("date") || h.includes("through")
    );

    $(table)
      .find("tbody tr, tr")
      .each((__, row) => {
        const cells = $(row).find("td");
        if (cells.length < 2) return;

        const bankText = bankIdx >= 0 ? $(cells[bankIdx]).text() : "";
        const partnerText = partnerIdx >= 0 ? $(cells[partnerIdx]).text() : "";
        const bonusText =
          bonusIdx >= 0
            ? $(cells[bonusIdx]).text()
            : // If no explicit bonus column, scan all cells for percentage
              cells
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
            source_url: FREQUENT_MILER_URL,
          });
        }
      });
  });

  // Strategy 2: Look for card-style layouts with bonus info
  if (bonuses.length === 0) {
    $(
      ".transfer-bonus, .bonus-card, [class*='bonus'], [class*='transfer']"
    ).each((_, el) => {
      const text = $(el).text();
      const bankMatch = text.match(
        /(?:chase|amex|american express|citi|capital one|bilt)/i
      );
      const pctMatch = text.match(/(\d+)\s*%/);

      if (bankMatch && pctMatch) {
        const bank = resolveBank(bankMatch[0]);
        const pct = parseInt(pctMatch[1]);

        // Try to find partner name in the same element
        const partnerEl = $(el).find(
          "a, .partner, [class*='partner'], strong, b"
        );
        const partnerText = partnerEl.length > 0 ? partnerEl.first().text() : "";
        const partnerCode = resolvePartnerCode(partnerText);

        // Look for date
        const dateMatch = text.match(
          /(?:through|until|ends?|expires?)\s*:?\s*(.+?)(?:\.|$)/i
        );
        const endDate = dateMatch ? parseEndDate(dateMatch[1]) : null;

        if (bank && partnerCode && pct) {
          bonuses.push({
            bank,
            partner: partnerText.trim(),
            partner_code: partnerCode,
            bonus_percentage: pct,
            end_date: endDate,
            source_url: FREQUENT_MILER_URL,
          });
        }
      }
    });
  }

  // Strategy 3: Scan list items
  if (bonuses.length === 0) {
    $("li, .entry-content p").each((_, el) => {
      const text = $(el).text();
      // Pattern: "Bank → Partner: XX% bonus through Date"
      const match = text.match(
        /(?:chase|amex|american express|citi|capital one|bilt)\s*(?:→|->|to|:)\s*(.+?)\s*(?::|–|-)\s*(\d+)\s*%/i
      );
      if (match) {
        const bankPart = text.match(
          /(?:chase|amex|american express|citi|capital one|bilt)/i
        );
        const bank = bankPart ? resolveBank(bankPart[0]) : null;
        const partnerCode = resolvePartnerCode(match[1]);
        const pct = parseInt(match[2]);
        const dateMatch = text.match(
          /(?:through|until|ends?|expires?)\s*:?\s*(.+?)(?:\.|$)/i
        );

        if (bank && partnerCode && pct) {
          bonuses.push({
            bank,
            partner: match[1].trim(),
            partner_code: partnerCode,
            bonus_percentage: pct,
            end_date: dateMatch ? parseEndDate(dateMatch[1]) : null,
            source_url: FREQUENT_MILER_URL,
          });
        }
      }
    });
  }

  return bonuses;
}

/**
 * Doctor of Credit parser.
 * DoC typically posts transfer bonuses in article format with structured lists.
 */
function parseDoctorOfCredit(html: string): ScrapedBonus[] {
  const $ = cheerio.load(html);
  const bonuses: ScrapedBonus[] = [];

  // Strategy 1: Look for tables (DoC sometimes uses them)
  $("table").each((_, table) => {
    const headers: string[] = [];
    $(table)
      .find("th, thead td")
      .each((__, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });

    const hasBankCol = headers.some(
      (h) => h.includes("program") || h.includes("bank") || h.includes("from")
    );
    const hasPartnerCol = headers.some(
      (h) => h.includes("partner") || h.includes("to") || h.includes("airline") || h.includes("hotel")
    );

    if (!hasBankCol && !hasPartnerCol) return;

    const bankIdx = headers.findIndex(
      (h) => h.includes("program") || h.includes("bank") || h.includes("from")
    );
    const partnerIdx = headers.findIndex(
      (h) =>
        h.includes("partner") || h.includes("to") || h.includes("airline") || h.includes("hotel")
    );
    const bonusIdx = headers.findIndex(
      (h) => h.includes("bonus") || h.includes("%")
    );
    const dateIdx = headers.findIndex(
      (h) => h.includes("end") || h.includes("expir") || h.includes("date")
    );

    $(table)
      .find("tbody tr, tr")
      .each((__, row) => {
        const cells = $(row).find("td");
        if (cells.length < 2) return;

        const bankText = bankIdx >= 0 ? $(cells[bankIdx]).text() : "";
        const partnerText = partnerIdx >= 0 ? $(cells[partnerIdx]).text() : "";
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
            source_url: DOCTOR_OF_CREDIT_URL,
          });
        }
      });
  });

  // Strategy 2: Post content with structured bonus mentions
  if (bonuses.length === 0) {
    const contentSelectors = [
      ".entry-content",
      ".post-content",
      "article",
      ".content",
    ];
    const contentEl = $(contentSelectors.join(", ")).first();

    if (contentEl.length) {
      // Look for list items or paragraphs with bonus info
      contentEl.find("li, p, strong").each((_, el) => {
        const text = $(el).text();
        const pctMatch = text.match(/(\d+)\s*%/);
        if (!pctMatch) return;

        const bankMatch = text.match(
          /(?:chase|amex|american express|citi|capital one|bilt)/i
        );
        if (!bankMatch) return;

        const bank = resolveBank(bankMatch[0]);
        const pct = parseInt(pctMatch[1]);

        // Try to find partner in the same text
        // Common pattern: "Chase → British Airways: 30% bonus through March 31"
        const afterBank = text.slice(
          text.indexOf(bankMatch[0]) + bankMatch[0].length
        );
        const words = afterBank.split(/[:\-–→>]+/);
        const potentialPartner = words[0]?.trim();
        const partnerCode = potentialPartner
          ? resolvePartnerCode(potentialPartner)
          : null;

        const dateMatch = text.match(
          /(?:through|until|ends?|expires?)\s*:?\s*(.+?)(?:\.|,|$)/i
        );

        if (bank && partnerCode && pct) {
          bonuses.push({
            bank,
            partner: potentialPartner ?? "",
            partner_code: partnerCode,
            bonus_percentage: pct,
            end_date: dateMatch ? parseEndDate(dateMatch[1]) : null,
            source_url: DOCTOR_OF_CREDIT_URL,
          });
        }
      });
    }
  }

  // Strategy 3: Headings + following content
  if (bonuses.length === 0) {
    $("h2, h3, h4").each((_, heading) => {
      const hText = $(heading).text();
      const bankMatch = hText.match(
        /(?:chase|amex|american express|citi|capital one|bilt)/i
      );
      if (!bankMatch) return;

      const bank = resolveBank(bankMatch[0]);
      if (!bank) return;

      // Scan sibling elements after the heading
      let sibling = $(heading).next();
      let scanned = 0;
      while (sibling.length && scanned < 10) {
        const tag = sibling.prop("tagName")?.toLowerCase();
        if (tag && ["h2", "h3", "h4"].includes(tag)) break;

        const text = sibling.text();
        const pctMatch = text.match(/(\d+)\s*%/);
        if (pctMatch) {
          const pct = parseInt(pctMatch[1]);
          // Find partner names in this block
          for (const [name, code] of nameToCodeMap) {
            if (text.toLowerCase().includes(name)) {
              const dateMatch = text.match(
                /(?:through|until|ends?|expires?)\s*:?\s*(.+?)(?:\.|,|$)/i
              );
              bonuses.push({
                bank,
                partner: name,
                partner_code: code,
                bonus_percentage: pct,
                end_date: dateMatch ? parseEndDate(dateMatch[1]) : null,
                source_url: DOCTOR_OF_CREDIT_URL,
              });
            }
          }
        }
        sibling = sibling.next();
        scanned++;
      }
    });
  }

  return bonuses;
}

// ── Sources ──

const sources: ScraperSource[] = [
  {
    name: "frequent_miler",
    url: FREQUENT_MILER_URL,
    parse: parseFrequentMiler,
  },
  {
    name: "doctor_of_credit",
    url: DOCTOR_OF_CREDIT_URL,
    parse: parseDoctorOfCredit,
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
        `[scraper] VALIDATION REJECT: unknown bank "${bonus.bank}" for partner ${bonus.partner_code}`
      );
      continue;
    }

    // Validate partner_code exists in transfer-partners.json
    if (!partnerCodeSet.has(bonus.partner_code)) {
      console.warn(
        `[scraper] VALIDATION REJECT: unknown partner_code "${bonus.partner_code}" (partner: "${bonus.partner}")`
      );
      continue;
    }

    // Validate bonus percentage range
    if (bonus.bonus_percentage < 1 || bonus.bonus_percentage > 200) {
      console.warn(
        `[scraper] VALIDATION REJECT: bonus_percentage ${bonus.bonus_percentage} out of range for ${bank}→${bonus.partner_code}`
      );
      continue;
    }

    // Validate this bank actually has this partner
    const lookupKey = `${bank}:${bonus.partner_code}`;
    const partnerInfo = partnerLookup.get(lookupKey);
    if (!partnerInfo) {
      console.warn(
        `[scraper] VALIDATION REJECT: ${bank} does not transfer to ${bonus.partner_code}`
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
      },
      {
        onConflict: "bank,partner_code,start_date",
      }
    );
    if (error) {
      errors.push(`INSERT ${bonus.bank}→${bonus.partner_code}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  // Expire bonuses: set is_active=false and copy to history
  for (const bonus of changes.expiredBonuses) {
    // Fetch full bonus data before deactivating
    const { data: fullBonus } = await supabase
      .from("transfer_bonuses")
      .select("*")
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
    try {
      console.log(`[scraper] Fetching ${source.name}: ${source.url}`);
      const html = await safeFetch(source.url);
      console.log(
        `[scraper] ${source.name}: received ${html.length} chars`
      );

      const parsed = source.parse(html);
      console.log(
        `[scraper] ${source.name}: parsed ${parsed.length} bonuses`
      );

      if (parsed.length === 0) {
        const warning = `PARSE FAILURE: ${source.name} returned 0 bonuses — HTML structure may have changed`;
        console.warn(`[scraper] ${warning}`);
        sourceResults[source.name] = {
          status: "parse_failure",
          bonusesFound: 0,
          warning,
        };
      } else {
        sourceResults[source.name] = {
          status: "ok",
          bonusesFound: parsed.length,
        };
        allBonuses.push(...parsed);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[scraper] FETCH FAILURE for ${source.name}: ${msg}`);
      sourceResults[source.name] = {
        status: "fetch_failure",
        bonusesFound: 0,
        warning: `Fetch failed: ${msg}`,
      };
    }
  }

  return { sourceResults, allBonuses };
}

export { normalize, KNOWN_BANKS, partnerCodeSet };
