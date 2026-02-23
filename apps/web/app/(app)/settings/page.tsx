import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { NotificationForm } from "@/components/settings/notification-form";
import { DataPrivacySection } from "@/components/settings/data-privacy-section";

interface Profile {
  full_name: string | null;
  home_airport: string | null;
  preferred_cabin: string;
  preferred_airlines: string[] | null;
}

interface NotificationPrefs {
  email_bonus_alerts: boolean;
  email_price_alerts: boolean;
  email_weekly_digest: boolean;
}

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [profileRes, notifRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  const profile: Profile = {
    full_name: profileRes.data?.full_name ?? null,
    home_airport: profileRes.data?.home_airport ?? null,
    preferred_cabin: profileRes.data?.preferred_cabin ?? "economy",
    preferred_airlines: profileRes.data?.preferred_airlines ?? null,
  };

  const notifications: NotificationPrefs = {
    email_bonus_alerts: notifRes.data?.email_bonus_alerts ?? true,
    email_price_alerts: notifRes.data?.email_price_alerts ?? true,
    email_weekly_digest: notifRes.data?.email_weekly_digest ?? true,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <ProfileForm profile={profile} email={user.email ?? ""} />

      {/* Notifications */}
      <NotificationForm notifications={notifications} />

      {/* Subscription */}
      <div className="mt-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Subscription
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re on the{" "}
          <span className="font-medium text-foreground">Free</span> plan.
          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            Pro coming soon
          </span>
        </p>
      </div>

      {/* Data & Privacy */}
      <DataPrivacySection />

      {/* Sign out */}
      <div className="mt-6">
        <form action={signOut}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
