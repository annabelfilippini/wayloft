import { requireUser } from "@/lib/auth/require-user";
import { getAllCards } from "@/lib/cards/catalog";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  await requireUser();
  const catalog = getAllCards();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <OnboardingWizard catalog={catalog} />
    </div>
  );
}
