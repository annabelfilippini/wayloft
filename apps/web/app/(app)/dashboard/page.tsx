import { Suspense } from "react";
import { requireUser } from "@/lib/auth/require-user";
import { ActionsWidget } from "@/components/dashboard/actions-widget";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="mt-4 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="font-medium">{user.email}</p>
        {user.user_metadata?.full_name && (
          <p className="text-sm text-muted-foreground">
            {user.user_metadata.full_name}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
          <ActionsWidget userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}
