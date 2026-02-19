import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CardAction } from "@wayloft/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActionsWidgetProps {
  userId: string;
}

const urgencyColors: Record<string, string> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

export async function ActionsWidget({ userId }: ActionsWidgetProps) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("upcoming_card_actions")
    .select("*")
    .eq("user_id", userId);

  if (!rows || rows.length === 0) return null;

  // Flatten the JSONB action columns into typed actions
  const actions: CardAction[] = [];
  for (const row of rows) {
    if (row.signup_action) {
      actions.push({
        user_id: row.user_id,
        user_card_id: row.user_card_id,
        card_name: row.card_name,
        card_slug: row.card_slug,
        issuer: row.issuer,
        ...row.signup_action,
      });
    }
    if (row.af_action) {
      actions.push({
        user_id: row.user_id,
        user_card_id: row.user_card_id,
        card_name: row.card_name,
        card_slug: row.card_slug,
        issuer: row.issuer,
        ...row.af_action,
      });
    }
  }

  // Sort by urgency: critical > warning > info
  const urgencyOrder = { critical: 0, warning: 1, info: 2 };
  actions.sort(
    (a, b) => (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3)
  );

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Action Items</h2>
          <Link
            href="/cards"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all cards
          </Link>
        </div>
        <div className="mt-3 space-y-3">
          {actions.map((action) => (
            <div
              key={`${action.user_card_id}-${action.type}`}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {action.card_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {action.type === "signup_spend" &&
                    action.spend_remaining_cents != null &&
                    `$${(action.spend_remaining_cents / 100).toLocaleString()} left to spend — ${action.days_remaining} days`}
                  {action.type === "annual_fee" &&
                    action.annual_fee_cents != null &&
                    `$${action.annual_fee_cents / 100} annual fee coming up`}
                </p>
              </div>
              <Badge variant={urgencyColors[action.urgency] as "destructive" | "secondary" | "outline"}>
                {action.type === "signup_spend" ? "Bonus" : "AF"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
