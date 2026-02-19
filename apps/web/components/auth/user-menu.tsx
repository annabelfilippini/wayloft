import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export function UserMenu({ user }: { user: User }) {
  const displayName =
    user.user_metadata?.full_name || user.email || "User";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{displayName}</span>
      <form action={signOut}>
        <Button variant="outline" size="sm" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  );
}
