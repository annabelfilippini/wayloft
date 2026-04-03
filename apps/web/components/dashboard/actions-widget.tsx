import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CardAction, ExperienceLevel } from "@wayloft/shared";
import { getCardBySlug } from "@/lib/cards/catalog";

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

interface UnifiedAction {
  key: string;
  type: "signup_spend" | "annual_fee" | "points_expiring" | "credit_expiring" | "perk_setup" | "payment_due";
  title: string;
  subtitle: string;
  urgency: "critical" | "warning" | "info" | "ok";
  daysRemaining: number | null;
  href: string;
  progress?: number;
}

const urgencyOrder: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  ok: 3,
};

function urgencyBarColor(urgency: string): string {
  switch (urgency) {
    case "critical": return "bg-destructive";
    case "warning": return "bg-primary";
    default: return "bg-muted-foreground";
  }
}

export async function ActionsWidget({ userId }: ActionsWidgetProps) {
  const supabase = await createClient();

  const [cardActionsRes, expiringRes, expiringCreditsRes, unusedPerksRes, upcomingPaymentsRes, missingAutopayRes] = await Promise.all([
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
  ]);

  const actions: UnifiedAction[] = [];

  // Card actions
  const rows = cardActionsRes.data ?? [];
  for (const row of rows) {
    if (row.signup_action) {
      const sa = row.signup_action as CardAction;
      const progress = sa.spend_remaining_cents != null && sa.spend_total_cents
        ? Math.min(100, Math.round(((sa.spend_total_cents - sa.spend_remaining_cents) / sa.spend_total_cents) * 100))
        : undefined;
      actions.push({
        key: `${row.user_card_id}-signup`,
        type: "signup_spend",
        title: `Spend $${sa.spend_remaining_cents != null ? (sa.spend_remaining_cents / 100).toLocaleString() : "?"} more for signup bonus`,
        subtitle: `${row.card_name} · ${sa.days_remaining ?? "?"} DAYS`,
        urgency: sa.urgency ?? "info",
        daysRemaining: sa.days_remaining ?? null,
        href: `/cards/${row.user_card_id}`,
        progress,
      });
    }
    if (row.af_action) {
      const af = row.af_action as CardAction;
      const afDollars = af.annual_fee_cents != null ? af.annual_fee_cents / 100 : null;
      actions.push({
        key: `${row.user_card_id}-af`,
        type: "annual_fee",
        title: "Annual fee decision",
        subtitle: `${row.card_name}${afDollars ? ` · $${afDollars}` : ""} · ${af.days_remaining ?? "?"} DAYS`,
        urgency: af.urgency ?? "info",
        daysRemaining: af.days_remaining ?? null,
        href: `/cards/${row.user_card_id}`,
      });
    }
  }

  // Expiring credits
  const expiringCredits = (expiringCreditsRes.data ?? []) as ExpiringCredit[];
  for (const ec of expiringCredits) {
    actions.push({
      key: `credit-${ec.id}`,
      type: "credit_expiring",
      title: `Use $${(ec.remaining_cents / 100).toFixed(0)} ${ec.credit_name.toLowerCase()}`,
      subtitle: `${ec.card_name} · ${ec.days_until_expiration} DAYS LEFT`,
      urgency: ec.urgency,
      daysRemaining: ec.days_until_expiration,
      href: `/cards/${ec.user_card_id}`,
    });
  }

  // Expiring points
  const expiring = (expiringRes.data ?? []) as ExpiringPoint[];
  for (const ep of expiring) {
    actions.push({
      key: `exp-${ep.balance_id}`,
      type: "points_expiring",
      title: `${ep.balance.toLocaleString()} ${ep.currency} expiring`,
      subtitle: `${ep.program_name}${ep.days_until_expiration != null ? ` · ${ep.days_until_expiration} DAYS` : ""}`,
      urgency: ep.urgency === "ok" ? "info" : ep.urgency,
      daysRemaining: ep.days_until_expiration,
      href: "/settings",
    });
  }

  // Unused perks
  const unusedPerks = (unusedPerksRes.data ?? []) as UnusedPerk[];
  for (const up of unusedPerks) {
    const valueDollars = Math.round(up.estimated_annual_value_cents / 100);
    actions.push({
      key: `perk-${up.id}`,
      type: "perk_setup",
      title: `Set up ${up.perk_name}`,
      subtitle: `${up.card_name} · ~$${valueDollars}/YR VALUE`,
      urgency: "info",
      daysRemaining: null,
      href: `/cards/${up.user_card_id}`,
    });
  }

  // Upcoming payments
  const upcomingPayments = (upcomingPaymentsRes.data ?? []) as UpcomingPayment[];
  for (const up of upcomingPayments) {
    actions.push({
      key: `payment-${up.id}`,
      type: "payment_due",
      title: `${up.card_name} payment due Apr ${new Date(up.next_due_date).getDate()}`,
      subtitle: up.card_name.toUpperCase(),
      urgency: up.urgency,
      daysRemaining: up.days_until_due,
      href: `/cards/${up.user_card_id}`,
    });
  }

  // Missing autopay
  const missingAutopay = (missingAutopayRes.data ?? []) as MissingAutopay[];
  for (const ma of missingAutopay) {
    if (upcomingPayments.some((up) => up.user_card_id === ma.user_card_id)) continue;
    actions.push({
      key: `autopay-${ma.user_card_id}`,
      type: "payment_due",
      title: ma.reason === "no_payment_info"
        ? "Add payment due date"
        : "Set up autopay",
      subtitle: ma.card_name.toUpperCase(),
      urgency: "info",
      daysRemaining: null,
      href: `/cards/${ma.user_card_id}`,
    });
  }

  // Sort all by urgency then days remaining
  actions.sort((a, b) => {
    const urgDiff = (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
    if (urgDiff !== 0) return urgDiff;
    return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
  });

  if (actions.length === 0) return null;

  return (
    <div className="rounded-md p-7" style={{ background: "var(--tasks-bg)" }}>
      <div className="flex items-center justify-between mb-5">
        <span className="text-lg font-semibold tracking-[-0.01em]">Tasks</span>
        <span className="mono text-xs text-muted-foreground">{actions.length} ACTIVE</span>
      </div>
      <div>
        {actions.map((action) => (
          <Link
            key={action.key}
            href={action.href}
            className="group flex items-center gap-3.5 py-3 cursor-pointer transition-opacity hover:opacity-80"
          >
            <div className={`w-[3px] h-10 shrink-0 rounded-sm ${urgencyBarColor(action.urgency)}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px]">{action.title}</div>
              <div className="mono text-xs text-muted-foreground tracking-[0.03em] uppercase mt-0.5 flex items-center gap-2">
                <span>{action.subtitle}</span>
                {action.progress != null && (
                  <span className="mono text-[10px] text-primary">{action.progress}%</span>
                )}
              </div>
              {action.progress != null && (
                <div className="h-[3px] bg-border mt-1.5 overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${action.progress}%` }} />
                </div>
              )}
            </div>
            <span className="text-muted-foreground text-xl opacity-30 group-hover:opacity-100 transition-opacity">&rsaquo;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
