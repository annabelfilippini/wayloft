import { Suspense } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { BonusFilters } from "@/components/bonuses/bonus-filters";
import { BonusHistory } from "@/components/bonuses/bonus-history";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Zap, Clock } from "lucide-react";
import type { TransferBonus, TransferBonusHistory, LoyaltyBalance } from "@wayloft/shared";
import { getUserCurrencies, formatBonusDate, analyzePatterns } from "@/lib/bonuses/utils";

async function BonusesContent() {
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch user cards, balances, active bonuses, and history in parallel
  const [cardsRes, balancesRes, bonusesRes, historyRes] = await Promise.all([
    supabase
      .from("user_cards")
      .select("currency")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase
      .from("loyalty_balances")
      .select("program_code, balance, currency")
      .eq("user_id", user.id),
    supabase
      .from("transfer_bonuses")
      .select("*")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("end_date", { ascending: true }),
    supabase
      .from("transfer_bonus_history")
      .select("*")
      .order("end_date", { ascending: false })
      .limit(200),
  ]);

  const userCards = cardsRes.data ?? [];
  const balances = (balancesRes.data ?? []) as Pick<LoyaltyBalance, "program_code" | "balance" | "currency">[];
  const allBonuses = (bonusesRes.data ?? []) as TransferBonus[];
  const bonusHistory = (historyRes.data ?? []) as TransferBonusHistory[];
  const patterns = analyzePatterns(bonusHistory);

  // Filter bonuses to user's currencies
  const userCurrencies = getUserCurrencies(userCards as { currency: string }[]);
  const myBonuses = allBonuses.filter((b) => userCurrencies.includes(b.currency));

  // Last updated timestamp
  const latestScraped = allBonuses.reduce<string | null>((latest, b) => {
    if (!latest) return b.scraped_at;
    return b.scraped_at > latest ? b.scraped_at : latest;
  }, null);

  if (allBonuses.length === 0 && patterns.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border py-16 text-center">
        <Zap className="h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">No Active Bonuses</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          There are no active transfer bonuses right now. Check back soon — banks
          typically run promotions every few weeks.
        </p>
      </div>
    );
  }

  return (
    <>
      {latestScraped && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Last updated{" "}
            {new Date(latestScraped).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      <Tabs defaultValue={myBonuses.length > 0 ? "my" : "all"} className="mt-4">
        <TabsList>
          <TabsTrigger value="my" disabled={myBonuses.length === 0}>
            My Bonuses{myBonuses.length > 0 && ` (${myBonuses.length})`}
          </TabsTrigger>
          <TabsTrigger value="all">
            All Bonuses ({allBonuses.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History{patterns.length > 0 && ` (${patterns.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my">
          {myBonuses.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-lg border py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No active bonuses match your portfolio currencies. Check the &ldquo;All
                Bonuses&rdquo; tab to see what&rsquo;s available.
              </p>
            </div>
          ) : (
            <div className="mt-2">
              <BonusFilters bonuses={myBonuses} balances={balances} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <div className="mt-2">
            <BonusFilters bonuses={allBonuses} balances={balances} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="mt-2">
            <BonusHistory history={bonusHistory} patterns={patterns} />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function BonusesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Transfer Bonuses</h1>
      <p className="text-sm text-muted-foreground">
        Active transfer bonus promotions across Chase, Amex, Citi, Capital One, and Bilt.
      </p>

      <Suspense fallback={<Skeleton className="mt-8 h-64 w-full rounded-lg" />}>
        <BonusesContent />
      </Suspense>
    </div>
  );
}
