import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { BonusSpotlight } from "@/components/dashboard/bonus-spotlight";
import { ActionsWidget } from "@/components/dashboard/actions-widget";
import { QuickOptimizer } from "@/components/dashboard/quick-optimizer";
import { NextCardWidget } from "@/components/dashboard/next-card-widget";
import { SkipBanner } from "@/components/onboarding/skip-banner";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExperienceLevel } from "@wayloft/shared";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, experience_level")
    .eq("id", user.id)
    .single();

  const onboardingCompleted = profile?.onboarding_completed ?? false;
  const experienceLevel = (profile?.experience_level as ExperienceLevel) ?? null;

  if (!onboardingCompleted) {
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
        {/* Hero: Transfer Bonus Spotlight — full width */}
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
          <BonusSpotlight userId={user.id} />
        </Suspense>

        {/* Two-column: Actions (left, wider) | Optimizer cheat sheet (right) */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
              <ActionsWidget userId={user.id} experienceLevel={experienceLevel} />
            </Suspense>
          </div>
          <div className="lg:col-span-2">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
              <QuickOptimizer userId={user.id} />
            </Suspense>
          </div>
        </div>

        {/* Bottom: Cards to Consider — full width */}
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
          <NextCardWidget userId={user.id} experienceLevel={experienceLevel} />
        </Suspense>
      </div>
    </div>
  );
}
