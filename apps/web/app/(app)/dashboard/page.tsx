import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { CardStrip } from "@/components/dashboard/card-strip";
import { BonusSpotlight } from "@/components/dashboard/bonus-spotlight";
import { ActionsWidget } from "@/components/dashboard/actions-widget";
import { QuickOptimizer } from "@/components/dashboard/quick-optimizer";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { SkipBanner } from "@/components/onboarding/skip-banner";
import { ChatSection } from "@/components/dashboard/chat-section";
import { PortfolioHero } from "@/components/dashboard/portfolio-hero";
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
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if ((count ?? 0) === 0) {
      redirect("/onboarding");
    }
  }

  const showSkipBanner = !onboardingCompleted;
  const displayName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  return (
    <div>
      {showSkipBanner && (
        <div className="mx-auto max-w-[1200px] px-8 pt-4">
          <SkipBanner />
        </div>
      )}

      {/* Hero — greeting left, portfolio value right */}
      <Suspense fallback={<Skeleton className="h-56 mx-8 mt-16" />}>
        <PortfolioHero userId={user.id} displayName={displayName} />
      </Suspense>

      {/* Card Deck — horizontal scroll */}
      <div className="mx-auto max-w-[1200px]">
        <Suspense fallback={<Skeleton className="h-56 mx-8" />}>
          <CardStrip userId={user.id} />
        </Suspense>
      </div>

      {/* Two-column: Transfer Bonuses (40%) | Tasks (60%) */}
      <div className="mx-auto max-w-[1200px] mt-10 grid grid-cols-1 lg:grid-cols-[2fr_3fr]">
        <div className="px-8 py-10">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <BonusSpotlight userId={user.id} experienceLevel={experienceLevel} />
          </Suspense>
        </div>
        <div className="px-8 py-10">
          <Suspense fallback={<Skeleton className="h-64" />}>
            <ActionsWidget userId={user.id} experienceLevel={experienceLevel} />
          </Suspense>
        </div>
      </div>

      {/* Two-column: Portfolio Summary (40%) | Spending Optimizer (60%) */}
      <div className="mx-auto max-w-[1200px] mt-2 grid grid-cols-1 lg:grid-cols-[2fr_3fr]">
        <div className="px-8 py-10">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <PortfolioSummary userId={user.id} />
          </Suspense>
        </div>
        <div className="px-8 py-10">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <QuickOptimizer userId={user.id} />
          </Suspense>
        </div>
      </div>

      {/* Ask Wayloft — full width with raised surface */}
      <div className="bg-card mt-4">
        <div className="mx-auto max-w-[1200px] px-8 py-14">
          <ChatSection />
        </div>
      </div>

      {/* Footer */}
      <div className="mx-auto max-w-[1200px] px-8 py-8 flex justify-between items-center">
        <span className="mono text-[11px] font-bold tracking-[-0.04em] text-primary">WAYLOFT</span>
        <span className="mono text-[10px] text-muted-foreground tracking-[0.02em]">&copy; 2026 WAYLOFT</span>
      </div>
    </div>
  );
}
