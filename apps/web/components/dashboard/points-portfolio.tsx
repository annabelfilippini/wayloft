import { createClient } from "@/lib/supabase/server";
import { getAllCppValuations } from "@/lib/cards/valuations";
import type { LoyaltyBalance, ExperienceLevel } from "@wayloft/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { AddBalanceDialog } from "./add-balance-dialog";
import { formatCurrencyName, isBeginnerOrBelow } from "@/lib/experience";
import { JargonTip } from "@/components/ui/jargon-tip";

interface PointsPortfolioProps {
  userId: string;
  experienceLevel?: ExperienceLevel | null;
}

export async function PointsPortfolio({ userId, experienceLevel }: PointsPortfolioProps) {
  const isBeginner = isBeginnerOrBelow(experienceLevel);
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("loyalty_balances")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("balance", { ascending: false });

  const balances = (rows ?? []) as LoyaltyBalance[];
  const valuations = getAllCppValuations();

  const enriched = balances.map((b) => {
    const valuation = valuations[b.program_code];
    const estimatedValue = valuation
      ? (b.balance * valuation.cpp) / 100
      : null;
    return { ...b, estimatedValue, cpp: valuation?.cpp ?? null };
  });

  const totalValue = enriched.reduce(
    (sum, b) => sum + (b.estimatedValue ?? 0),
    0
  );

  // Empty state
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium">No loyalty balances yet</p>
            <p className="text-xs text-muted-foreground">
              Track your points and miles to see their estimated value.
            </p>
          </div>
          <AddBalanceDialog />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">My Points &amp; Miles</h2>
            <p className="text-xs text-muted-foreground">
              {isBeginner
                ? "Your balances across all programs"
                : "Your balances across all programs and what they\u2019re worth"}
            </p>
            {!isBeginner && (
              <>
                <p className="text-2xl font-bold">
                  ${totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Estimated total value</p>
              </>
            )}
          </div>
          <AddBalanceDialog />
        </div>

        <div className="mt-4 space-y-2">
          {enriched.map((b) => {
            const isExpiring =
              b.expires_at &&
              new Date(b.expires_at).getTime() - Date.now() <
                90 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{b.program_name}</p>
                    {isExpiring && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Expiring
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.balance.toLocaleString()} {formatCurrencyName(b.currency, experienceLevel)}
                    {!isBeginner && b.cpp && (
                      <>
                        {" · "}
                        <JargonTip term="cpp" experienceLevel={experienceLevel}>
                          {b.cpp}¢/pt
                        </JargonTip>
                      </>
                    )}
                  </p>
                </div>
                {!isBeginner && (
                  <div className="shrink-0 text-right">
                    {b.estimatedValue !== null ? (
                      <p className="font-medium">
                        ${b.estimatedValue.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
