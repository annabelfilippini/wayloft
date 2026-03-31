import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getAllCards, getCardBySlug } from "@/lib/cards/catalog";
import { getAllCppValuations, estimateValue } from "@/lib/cards/valuations";
import { generateWalletGuide } from "@/lib/optimizer/engine";
import { getEffectiveLevel } from "@/lib/experience";
import type { ExperienceLevel } from "@wayloft/shared";

/**
 * Builds a system prompt with full portfolio context for the AI chat assistant.
 * Runs parallel Supabase queries, then formats everything into a structured prompt.
 */
export async function buildChatContext(userId: string): Promise<string> {
  const supabase = await createClient();

  const [
    cardsRes,
    balancesRes,
    creditsRes,
    perksRes,
    bonusesRes,
    profileRes,
  ] = await Promise.all([
    supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase.from("loyalty_balances").select("*").eq("user_id", userId).is("deleted_at", null),
    supabase
      .from("expiring_credits")
      .select("*")
      .eq("user_id", userId),
    supabase
      .from("unused_perks")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["not_started", "in_progress"]),
    supabase
      .from("active_transfer_bonuses_ending_soon")
      .select("*"),
    supabase
      .from("profiles")
      .select("experience_level")
      .eq("id", userId)
      .single(),
  ]);

  const userCards = cardsRes.data ?? [];
  const balances = balancesRes.data ?? [];
  const credits = creditsRes.data ?? [];
  const unusedPerks = perksRes.data ?? [];
  const activeBonuses = bonusesRes.data ?? [];
  const experienceLevel = (profileRes.data?.experience_level as ExperienceLevel) ?? null;
  const level = getEffectiveLevel(experienceLevel);

  const catalog = getAllCards();
  const cppMap = getAllCppValuations();

  // Build wallet guide for best-card-per-category
  const slugs = userCards.map((c: { card_slug: string }) => c.card_slug);
  const walletGuide = generateWalletGuide(slugs, catalog);

  // Format cards section
  const cardsBlock = userCards
    .map((uc: Record<string, unknown>) => {
      const cat = getCardBySlug(uc.card_slug as string);
      if (!cat) return null;

      const af = cat.annual_fee_cents / 100;
      const earnRates = Object.entries(cat.earning_rates)
        .map(([k, v]) => `${k}: ${v}x`)
        .join(", ");
      const perks = cat.key_perks.join("; ");
      const ftf = cat.foreign_transaction_fee ? "Yes" : "No";

      const bonusMet = uc.signup_bonus_met as boolean;
      const bonusPoints = uc.signup_bonus_points as number | null;
      const spendProgress = uc.signup_spend_progress_cents as number;
      const spendReq = uc.signup_spend_requirement_cents as number | null;
      const spendDeadline = uc.signup_spend_deadline as string | null;

      let signupStatus = "Complete";
      if (!bonusMet && bonusPoints && spendReq) {
        const remaining = Math.max(0, (spendReq - spendProgress) / 100);
        signupStatus = `In progress — $${remaining.toLocaleString()} left to spend`;
        if (spendDeadline) signupStatus += ` by ${spendDeadline}`;
      }

      const lines = [
        `- ${cat.name} (${cat.issuer}, ${cat.currency})`,
        `  AF: $${af}/yr | FTF: ${ftf}`,
        `  Earning: ${earnRates}`,
        `  Perks: ${perks}`,
        `  Signup bonus: ${signupStatus}`,
      ];

      if (cat.credits && cat.credits.length > 0) {
        const creditNames = cat.credits.map((c) => c.name).join(", ");
        lines.push(`  Credits: ${creditNames}`);
      }

      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  // Format best card per category
  const optimizerBlock = walletGuide.categories
    .filter((cat) => cat.rankings.length > 0)
    .map((cat) => {
      const best = cat.rankings[0];
      return `- ${cat.displayName}: ${best.cardName} (${best.multiplier}x ${best.currency}, ~${best.effectiveCents.toFixed(1)}¢/dollar)`;
    })
    .join("\n");

  // Format balances
  const balancesBlock = balances
    .map((b: Record<string, unknown>) => {
      const code = b.currency as string;
      const balance = b.balance as number;
      const entry = cppMap[code];
      const value = entry ? estimateValue(balance, code) : null;
      const valueStr = value != null ? ` (~$${value.toFixed(0)})` : "";
      return `- ${b.program_name}: ${balance.toLocaleString()} ${code}${valueStr}`;
    })
    .join("\n");

  // Format active transfer bonuses
  const bonusesBlock = activeBonuses
    .map((b: Record<string, unknown>) => {
      return `- ${b.bank} → ${b.partner_name}: +${b.bonus_percentage}% (ends ${b.end_date})`;
    })
    .join("\n");

  // Format unused credits
  const creditsBlock = credits
    .map((c: Record<string, unknown>) => {
      const remaining = ((c.remaining_cents as number) / 100).toFixed(0);
      const days = c.days_until_expiration as number;
      return `- ${c.card_name}: $${remaining} ${c.credit_name} (expires in ${days} days)`;
    })
    .join("\n");

  // Format unused perks
  const perksBlock = unusedPerks
    .map((p: Record<string, unknown>) => {
      const value = Math.round(
        (p.estimated_annual_value_cents as number) / 100
      );
      return `- ${p.card_name}: ${p.perk_name} (~$${value}/yr value)`;
    })
    .join("\n");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are Wayloft, a travel rewards assistant. Help users maximize credit card rewards, use their perks, and make smart spending decisions.

RULES:
- Only answer about credit cards, points/miles, travel rewards, perks, and spending optimization.
- Use the user's actual portfolio data below — never invent card features or earning rates.
- Be concise and actionable. Lead with the answer, then explain briefly.
- Cite specific earning rates and values when recommending cards.
- For transfer bonuses, always mention the end date.
- If the user asks about something outside your scope, politely redirect.
- Adjust language to user's experience level: ${level}${level === "beginner" ? " (use simple terms, avoid jargon like CPP/MR/UR — say 'cents per point' and full program names)" : ""}

TODAY: ${today}

USER'S CARDS:
${cardsBlock || "(No cards in portfolio)"}

BEST CARD BY CATEGORY:
${optimizerBlock || "(No cards to optimize)"}

POINT BALANCES:
${balancesBlock || "(No balances tracked)"}

ACTIVE TRANSFER BONUSES:
${bonusesBlock || "(None currently active)"}

UNUSED CREDITS:
${creditsBlock || "(All credits used or none tracked)"}

UNUSED PERKS:
${perksBlock || "(All perks activated or none tracked)"}`;
}
