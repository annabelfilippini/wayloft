import { requireUser } from "@/lib/auth/require-user";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const user = await requireUser();
  const displayName =
    user.user_metadata?.full_name || user.email || "User";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="mt-6 rounded-lg border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </h2>
        <div className="mt-3 space-y-1">
          <p className="font-medium">{displayName}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="mt-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Notifications
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Email and push notification preferences coming soon.
        </p>
      </div>

      {/* Subscription */}
      <div className="mt-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Subscription
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re on the <span className="font-medium text-foreground">Free</span> plan.
          Pro features coming soon.
        </p>
      </div>

      {/* Data & Privacy */}
      <div className="mt-4 rounded-lg border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Data &amp; Privacy
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Export your data or delete your account. Coming soon.
        </p>
      </div>

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
