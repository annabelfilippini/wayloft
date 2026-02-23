import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExpirationAlertsProps {
  userId: string;
}

interface ExpiringPoint {
  balance_id: string;
  program_name: string;
  program_code: string;
  balance: number;
  currency: string;
  expires_at: string | null;
  expiration_policy: string;
  last_activity_date: string | null;
  days_until_expiration: number | null;
  urgency: "critical" | "warning" | "ok";
}

const urgencyVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  ok: "outline",
};

export async function ExpirationAlerts({ userId }: ExpirationAlertsProps) {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("expiring_points")
    .select("*")
    .eq("user_id", userId);

  const alerts = (rows ?? []) as ExpiringPoint[];

  // Sort: critical first, then by days remaining
  alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, ok: 2 };
    const urgDiff = (order[a.urgency] ?? 3) - (order[b.urgency] ?? 3);
    if (urgDiff !== 0) return urgDiff;
    return (a.days_until_expiration ?? 999) - (b.days_until_expiration ?? 999);
  });

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-sm font-semibold">Points Expiration</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No expiring points tracked yet.{" "}
            <Link
              href="/settings"
              className="text-foreground underline hover:no-underline"
            >
              Add your loyalty balances
            </Link>{" "}
            to get expiration alerts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-3 text-sm font-semibold">Points Expiration</h2>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.balance_id}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {alert.program_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alert.balance.toLocaleString()} {alert.currency}
                  {alert.days_until_expiration != null &&
                    ` — expires in ${alert.days_until_expiration} days`}
                </p>
              </div>
              <Badge variant={urgencyVariant[alert.urgency] ?? "outline"}>
                {alert.urgency === "critical"
                  ? "Expiring"
                  : alert.urgency === "warning"
                    ? "Soon"
                    : "OK"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
