import { CreditCard } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <CreditCard className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-lg font-semibold">No cards yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first credit card to start tracking rewards and bonuses.
      </p>
    </div>
  );
}
