import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { TopStats } from "@/components/dashboard/top-stats";
import { ActionsWidget } from "@/components/dashboard/actions-widget";
import { CompactFiveTwentyFour } from "@/components/dashboard/compact-five-twenty-four";
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
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
          <TopStats userId={user.id} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
          <ActionsWidget userId={user.id} experienceLevel={experienceLevel} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-12 w-full rounded-lg" />}>
          <CompactFiveTwentyFour userId={user.id} />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
          <NextCardWidget userId={user.id} experienceLevel={experienceLevel} />
        </Suspense>
      </div>
    </div>
  );
}
