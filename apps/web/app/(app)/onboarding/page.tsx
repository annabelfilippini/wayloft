import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getDefaultAppRoute } from "@/lib/routes";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect(getDefaultAppRoute());
  }

  const catalog = getAllCards();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <OnboardingWizard catalog={catalog} />
    </div>
  );
}
