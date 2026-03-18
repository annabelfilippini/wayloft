import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CardAction, ExperienceLevel } from "@wayloft/shared";
import { isBeginnerOrBelow } from "@/lib/experience";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CreditCard, Gift, Clock } from "lucide-react";
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
}

const urgencyOrder: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  ok: 3,
};


export async function ActionsWidget({ userId, experienceLevel }: ActionsWidgetProps) {
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

  // Expiring points
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

  // Expiring credits
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

  // Unused perks
  const unusedPerks = (unusedPerksRes.data ?? []) as UnusedPerk[];
  for (const up of unusedPerks) {
    const valueDollars = Math.round(up.estimated_annual_value_cents / 100);
    actions.push({
      key: `perk-${up.id}`,
      type: "perk_setup",
      title: up.card_name,
      subtitle: `${up.perk_name} — set up to save ~$${valueDollars}/yr`,
      urgency: "info",
      daysRemaining: null,
      href: `/cards/${up.user_card_id}`,
    });
  }

  // Upcoming payments
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

  // Missing autopay
  const missingAutopay = (missingAutopayRes.data ?? []) as MissingAutopay[];
  for (const ma of missingAutopay) {
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

  // Group actions by category
  const deadlines = actions
    .filter((a) => ["signup_spend", "annual_fee", "points_expiring", "credit_expiring"].includes(a.type))
    .sort((a, b) => {
      const urgDiff = (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
      if (urgDiff !== 0) return urgDiff;
      return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
    });

  const perkActions = actions.filter((a) => a.type === "perk_setup");

  const paymentActions = actions
    .filter((a) => a.type === "payment_due")
    .sort((a, b) => {
      const urgDiff = (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
      if (urgDiff !== 0) return urgDiff;
      return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
    });

  if (actions.length === 0) return null;

  const isBeginner = isBeginnerOrBelow(experienceLevel);

  return (
    <div className="space-y-4">
      {deadlines.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold">Deadlines &amp; Reminders</h3>
              <span className="text-xs text-muted-foreground">({deadlines.length})</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isBeginner
                ? "Things you need to do soon to avoid losing value or paying extra"
                : "Act before you lose value — spending deadlines, expiring points, upcoming fees"}
            </p>

            <div className="mt-3 space-y-1.5">
              {deadlines.map((action) => (
                <ActionRow key={action.key} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {perkActions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-bold">Perks to Activate</h3>
              <span className="text-xs text-muted-foreground">({perkActions.length})</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isBeginner
                ? "Free benefits included with your cards — set them up to start saving"
                : "Benefits you're paying for but haven't set up yet"}
            </p>

            <div className="mt-3 space-y-1.5">
              {perkActions.map((action) => (
                <ActionRow key={action.key} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {paymentActions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-bold">Payments</h3>
              <span className="text-xs text-muted-foreground">({paymentActions.length})</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Upcoming due dates and autopay status
            </p>

            <div className="mt-3 space-y-1.5">
              {paymentActions.map((action) => (
                <ActionRow key={action.key} action={action} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActionRow({ action }: { action: UnifiedAction }) {
  return (
    <Link
      href={action.href}
      className="flex items-start justify-between gap-2 rounded-md p-2 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{action.title}</p>
        <p className="text-[11px] leading-tight text-muted-foreground">
          {action.subtitle}
        </p>
      </div>
      {action.daysRemaining != null && (
        <div className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{action.daysRemaining}d</span>
        </div>
      )}
      {action.urgency === "critical" && (
        <Badge variant="destructive" className="shrink-0 text-[10px]">
          Urgent
        </Badge>
      )}
    </Link>
  );
}
