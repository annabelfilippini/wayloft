import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { ActionsWidget } from "@/components/dashboard/actions-widget";
import { PointsPortfolio } from "@/components/dashboard/points-portfolio";
import { ExpirationAlerts } from "@/components/dashboard/expiration-alerts";
import { SkipBanner } from "@/components/onboarding/skip-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserCard } from "@wayloft/shared";

async function PortfolioSummary({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: userCards } = await supabase
    .from("user_cards")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");

  const cards = (userCards ?? []) as UserCard[];
  const totalCards = cards.length;
  const totalAF = cards.reduce((sum, c) => sum + c.annual_fee_cents, 0) / 100;
  const activeBonuses = cards.filter(
    (c) =>
      c.signup_spend_requirement_cents != null &&
      c.signup_spend_requirement_cents > 0 &&
      !c.signup_bonus_met
  ).length;

  if (totalCards === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Cards</p>
          <p className="text-2xl font-bold">{totalCards}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total Annual Fees</p>
          <p className="text-2xl font-bold">
            ${totalAF.toLocaleString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Active Bonuses</p>
          <p className="text-2xl font-bold">{activeBonuses}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  const onboardingCompleted = profile?.onboarding_completed ?? false;

  // First visit after signup: redirect to onboarding once
  // After that, users see the skip banner but can use the app freely
  if (!onboardingCompleted) {
    // Check if user has any cards — if they do, they've been here before, just show banner
    const { count } = await supabase
      .from("user_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) === 0) {
      redirect("/onboarding");
    }
  }

  const showSkipBanner = !onboardingCompleted;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {showSkipBanner && <SkipBanner />}

      <h1 className="mt-4 text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Welcome back, {user.user_metadata?.full_name || user.email}
      </p>

      <div className="mt-6 space-y-6">
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <PortfolioSummary userId={user.id} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
          <PointsPortfolio userId={user.id} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
          <ActionsWidget userId={user.id} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
          <ExpirationAlerts userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
