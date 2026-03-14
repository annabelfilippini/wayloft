import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CardAction, ExperienceLevel, TransferBonus } from "@wayloft/shared";
import { isBeginnerOrBelow } from "@/lib/experience";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCardBySlug } from "@/lib/cards/catalog";
import { BANK_DISPLAY_NAMES } from "@/lib/bonuses/utils";

interface ActionsWidgetProps {
  userId: string;
  experienceLevel?: ExperienceLevel | null;
}

interface ExpiringPoint {
  balance_id: string;
  program_name: string;
  program_code: string;
  balance: number;
  currency: string;
  days_until_expiration: number | null;
  urgency: "critical" | "warning" | "ok";
}

interface ExpiringCredit {
  id: string;
  user_id: string;
  user_card_id: string;
  card_name: string;
  card_slug: string;
  credit_name: string;
  remaining_cents: number;
  days_until_expiration: number;
  urgency: "critical" | "warning" | "info";
}

interface UnusedPerk {
  id: string;
  user_id: string;
  user_card_id: string;
  card_name: string;
  card_slug: string;
  perk_id: string;
  perk_name: string;
  perk_type: string;
  estimated_annual_value_cents: number;
  urgency: "warning" | "info";
}

interface UpcomingPayment {
  id: string;
  user_id: string;
  user_card_id: string;
  card_name: string;
  card_slug: string;
  issuer: string;
  due_day: number;
  autopay_enabled: boolean;
  autopay_type: string;
  next_due_date: string;
  days_until_due: number;
  urgency: "critical" | "warning" | "info";
}

interface MissingAutopay {
  user_card_id: string;
  user_id: string;
  card_name: string;
  card_slug: string;
  issuer: string;
  reason: "no_payment_info" | "no_autopay";
}

interface EndingSoonBonus {
  id: string;
  bank: string;
  currency: string;
  partner: string;
  partner_code: string;
  partner_type: string;
  bonus_percentage: number;
  end_date: string;
  days_remaining: number;
  urgency: "critical" | "warning" | "info";
}

interface UnifiedAction {
  key: string;
  type: "signup_spend" | "annual_fee" | "points_expiring" | "credit_expiring" | "perk_setup" | "payment_due" | "transfer_bonus";
  title: string;
  subtitle: string;
  urgency: "critical" | "warning" | "info" | "ok";
  daysRemaining: number | null;
  href: string;
}

const urgencyColors: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
  ok: "outline",
};

const urgencyOrder: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  ok: 3,
};

const typeLabels: Record<string, string> = {
  signup_spend: "Bonus",
  annual_fee: "AF",
  points_expiring: "Points",
  credit_expiring: "Credit",
  perk_setup: "Perk",
  payment_due: "Payment",
  transfer_bonus: "Transfer",
};

const beginnerTypeLabels: Record<string, string> = {
  ...typeLabels,
  annual_fee: "Fee",
};

export async function ActionsWidget({ userId, experienceLevel }: ActionsWidgetProps) {
  const supabase = await createClient();

  // Fetch card actions, expiring points, expiring credits, unused perks, payment data, user cards, and ending-soon bonuses in parallel
  const [cardActionsRes, expiringRes, expiringCreditsRes, unusedPerksRes, upcomingPaymentsRes, missingAutopayRes, userCardsRes, endingSoonBonusesRes] = await Promise.all([
    supabase.from("upcoming_card_actions").select("*").eq("user_id", userId),
    supabase.from("expiring_points").select("*").eq("user_id", userId),
    supabase
      .from("expiring_credits")
      .select("*")
      .eq("user_id", userId)
      .lte("days_until_expiration", 30),
    supabase
      .from("unused_perks")
      .select("*")
      .eq("user_id", userId)
      .in("perk_type", ["one_time_setup", "enrollment_required"])
      .eq("status", "not_started")
      .order("estimated_annual_value_cents", { ascending: false })
      .limit(3),
    supabase
      .from("upcoming_payments")
      .select("*")
      .eq("user_id", userId)
      .lte("days_until_due", 14)
      .eq("autopay_enabled", false),
    supabase
      .from("cards_missing_autopay")
      .select("*")
      .eq("user_id", userId)
      .limit(3),
    supabase
      .from("user_cards")
      .select("currency")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("active_transfer_bonuses_ending_soon")
      .select("*"),
  ]);

  const actions: UnifiedAction[] = [];

  // Process card actions
  const rows = cardActionsRes.data ?? [];
  for (const row of rows) {
    if (row.signup_action) {
      const sa = row.signup_action as CardAction;
      actions.push({
        key: `${row.user_card_id}-signup`,
        type: "signup_spend",
        title: row.card_name,
        subtitle:
          sa.spend_remaining_cents != null
            ? `$${(sa.spend_remaining_cents / 100).toLocaleString()} left to spend — ${sa.days_remaining} days`
            : "Signup spend deadline coming up",
        urgency: sa.urgency ?? "info",
        daysRemaining: sa.days_remaining ?? null,
        href: `/cards/${row.user_card_id}`,
      });
    }
    if (row.af_action) {
      const af = row.af_action as CardAction;
      const catalogCard = row.card_slug ? getCardBySlug(row.card_slug) : undefined;
      const hasDecisionData = !!(catalogCard?.downgrade_options?.length || catalogCard?.retention_data);
      const afDollars = af.annual_fee_cents != null ? af.annual_fee_cents / 100 : null;

      actions.push({
        key: `${row.user_card_id}-af`,
        type: "annual_fee",
        title: row.card_name,
        subtitle:
          afDollars != null && hasDecisionData
            ? `$${afDollars} AF coming up — review your keep/downgrade options`
            : afDollars != null
              ? `$${afDollars} annual fee coming up`
              : "Annual fee reminder",
        urgency: af.urgency ?? "info",
        daysRemaining: null,
        href: `/cards/${row.user_card_id}`,
      });
    }
  }

  // Process expiring points
  const expiring = (expiringRes.data ?? []) as ExpiringPoint[];
  for (const ep of expiring) {
    actions.push({
      key: `exp-${ep.balance_id}`,
      type: "points_expiring",
      title: ep.program_name,
      subtitle: `${ep.balance.toLocaleString()} ${ep.currency} expiring${
        ep.days_until_expiration != null ? ` in ${ep.days_until_expiration} days` : ""
      }`,
      urgency: ep.urgency === "ok" ? "info" : ep.urgency,
      daysRemaining: ep.days_until_expiration,
      href: "/settings",
    });
  }

  // Process expiring credits
  const expiringCredits = (expiringCreditsRes.data ?? []) as ExpiringCredit[];
  for (const ec of expiringCredits) {
    actions.push({
      key: `credit-${ec.id}`,
      type: "credit_expiring",
      title: ec.card_name,
      subtitle: `$${(ec.remaining_cents / 100).toFixed(0)} ${ec.credit_name} expires in ${ec.days_until_expiration} days`,
      urgency: ec.urgency,
      daysRemaining: ec.days_until_expiration,
      href: `/cards/${ec.user_card_id}`,
    });
  }

  // Process unused perks
  const unusedPerks = (unusedPerksRes.data ?? []) as UnusedPerk[];
  for (const up of unusedPerks) {
    const valueDollars = Math.round(up.estimated_annual_value_cents / 100);
    actions.push({
      key: `perk-${up.id}`,
      type: "perk_setup",
      title: up.card_name,
      subtitle: `${up.perk_name} — set up to save ~$${valueDollars}/yr`,
      urgency: up.urgency === "warning" ? "info" : "info",
      daysRemaining: null,
      href: `/cards/${up.user_card_id}`,
    });
  }

  // Process upcoming payments (no autopay, due within 14 days)
  const upcomingPayments = (upcomingPaymentsRes.data ?? []) as UpcomingPayment[];
  for (const up of upcomingPayments) {
    const catalogCard = up.card_slug ? getCardBySlug(up.card_slug) : undefined;
    const lateFee = catalogCard?.payment_info?.late_fee_cents;
    const lateFeeStr = lateFee ? ` — $${(lateFee / 100).toFixed(0)} late fee` : "";
    actions.push({
      key: `payment-${up.id}`,
      type: "payment_due",
      title: up.card_name,
      subtitle: `Payment due in ${up.days_until_due} days${lateFeeStr}`,
      urgency: up.urgency,
      daysRemaining: up.days_until_due,
      href: `/cards/${up.user_card_id}`,
    });
  }

  // Process cards missing autopay
  const missingAutopay = (missingAutopayRes.data ?? []) as MissingAutopay[];
  for (const ma of missingAutopay) {
    // Skip if we already have an upcoming payment action for this card
    if (upcomingPayments.some((up) => up.user_card_id === ma.user_card_id)) continue;
    actions.push({
      key: `autopay-${ma.user_card_id}`,
      type: "payment_due",
      title: ma.card_name,
      subtitle: ma.reason === "no_payment_info"
        ? "Add your payment due date to avoid late fees"
        : "Set up autopay to avoid late fees",
      urgency: "info",
      daysRemaining: null,
      href: `/cards/${ma.user_card_id}`,
    });
  }

  // Process transfer bonuses ending soon (filtered to user's currencies)
  const userCurrencies = new Set(
    (userCardsRes.data ?? []).map((c: { currency: string }) => c.currency)
  );
  const endingSoonBonuses = (endingSoonBonusesRes.data ?? []) as EndingSoonBonus[];
  for (const tb of endingSoonBonuses) {
    if (userCurrencies.size === 0 || userCurrencies.has(tb.currency)) {
      const bankName = BANK_DISPLAY_NAMES[tb.bank] ?? tb.bank;
      actions.push({
        key: `transfer-${tb.id}`,
        type: "transfer_bonus",
        title: `${bankName} → ${tb.partner}`,
        subtitle: `+${tb.bonus_percentage}% transfer bonus — ${tb.days_remaining} days left`,
        urgency: tb.urgency,
        daysRemaining: tb.days_remaining,
        href: "/bonuses",
      });
    }
  }

  // Sort by urgency then days remaining
  actions.sort((a, b) => {
    const urgDiff =
      (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
    if (urgDiff !== 0) return urgDiff;
    return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
  });

  if (actions.length === 0) return null;

  const labels = isBeginnerOrBelow(experienceLevel) ? beginnerTypeLabels : typeLabels;

  // Split into urgent (critical/warning AND <=7 days) vs recommended
  const urgentActions = actions.filter(
    (a) =>
      (a.urgency === "critical" || a.urgency === "warning") &&
      a.daysRemaining !== null &&
      a.daysRemaining <= 7
  );
  const recommendedActions = actions.filter(
    (a) => !urgentActions.includes(a)
  );

  const urgentDisplay = urgentActions.slice(0, 5);
  const recommendedDisplay = recommendedActions.slice(0, 5);

  function renderAction(action: UnifiedAction, accent?: boolean) {
    return (
      <Link
        key={action.key}
        href={action.href}
        className={`flex items-start justify-between gap-3 rounded-md p-2 -mx-1 hover:bg-muted/50 transition-colors ${
          accent ? "border-l-2 border-red-500 pl-3" : ""
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{action.title}</p>
          <p className="text-xs text-muted-foreground">{action.subtitle}</p>
        </div>
        <Badge variant={urgencyColors[action.urgency] ?? "outline"}>
          {labels[action.type] ?? action.type}
        </Badge>
      </Link>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Action Items</h2>
          <Link
            href="/cards"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all cards
          </Link>
        </div>

        {urgentDisplay.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Urgent
            </p>
            <div className="mt-2 space-y-2">
              {urgentDisplay.map((a) => renderAction(a, true))}
            </div>
            {urgentActions.length > 5 && (
              <Link
                href="/cards"
                className="mt-1 block text-xs text-muted-foreground hover:text-foreground"
              >
                View all {urgentActions.length} items
              </Link>
            )}
          </div>
        )}

        {recommendedDisplay.length > 0 && (
          <div className={urgentDisplay.length > 0 ? "mt-4" : "mt-3"}>
            {urgentDisplay.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recommended
              </p>
            )}
            <div className="mt-2 space-y-2">
              {recommendedDisplay.map((a) => renderAction(a))}
            </div>
            {recommendedActions.length > 5 && (
              <Link
                href="/cards"
                className="mt-1 block text-xs text-muted-foreground hover:text-foreground"
              >
                View all {recommendedActions.length} items
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
