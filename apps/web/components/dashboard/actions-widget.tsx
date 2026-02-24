import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CardAction } from "@wayloft/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActionsWidgetProps {
  userId: string;
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

interface UnifiedAction {
  key: string;
  type: "signup_spend" | "annual_fee" | "points_expiring" | "credit_expiring";
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
};

export async function ActionsWidget({ userId }: ActionsWidgetProps) {
  const supabase = await createClient();

  // Fetch card actions, expiring points, and expiring credits in parallel
  const [cardActionsRes, expiringRes, expiringCreditsRes] = await Promise.all([
    supabase.from("upcoming_card_actions").select("*").eq("user_id", userId),
    supabase.from("expiring_points").select("*").eq("user_id", userId),
    supabase
      .from("expiring_credits")
      .select("*")
      .eq("user_id", userId)
      .lte("days_until_expiration", 30),
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
      actions.push({
        key: `${row.user_card_id}-af`,
        type: "annual_fee",
        title: row.card_name,
        subtitle:
          af.annual_fee_cents != null
            ? `$${af.annual_fee_cents / 100} annual fee coming up`
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

  // Sort by urgency then days remaining
  actions.sort((a, b) => {
    const urgDiff =
      (urgencyOrder[a.urgency] ?? 9) - (urgencyOrder[b.urgency] ?? 9);
    if (urgDiff !== 0) return urgDiff;
    return (a.daysRemaining ?? 999) - (b.daysRemaining ?? 999);
  });

  if (actions.length === 0) return null;

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
        <div className="mt-3 space-y-3">
          {actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="flex items-start justify-between gap-3 rounded-md p-1 -mx-1 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">
                  {action.subtitle}
                </p>
              </div>
              <Badge
                variant={urgencyColors[action.urgency] ?? "outline"}
              >
                {typeLabels[action.type] ?? action.type}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
