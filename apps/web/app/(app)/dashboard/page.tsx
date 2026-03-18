import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
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

      {/* === Section 1: Opportunities === */}
      <section className="mt-8">
        <SectionDivider label="Opportunities" />
        <div className="mt-4">
          <Suspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
            <BonusSpotlight userId={user.id} experienceLevel={experienceLevel} />
          </Suspense>
        </div>
      </section>

      {/* === Section 2: Your To-Do List === */}
      <section className="mt-10">
        <SectionDivider label="Your To-Do List" />
        <div className="mt-4">
          <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
            <ActionsWidget userId={user.id} experienceLevel={experienceLevel} />
          </Suspense>
        </div>
      </section>

      {/* === Section 3: Quick Reference === */}
      <section className="mt-10">
        <SectionDivider label="Quick Reference" />
        <div className="mt-4 space-y-6">
          <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
            <QuickOptimizer userId={user.id} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
            <NextCardWidget userId={user.id} experienceLevel={experienceLevel} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <Separator className="shrink" />
    </div>
  );
}
