import Link from "next/link";
import { Wallet, Plus } from "lucide-react";

export function EmptyOptimizer() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Wallet className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">No cards in your portfolio</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Add your credit cards to see which one to use for every spending
        category.
      </p>
      <Link
        href="/cards"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        Add Cards
      </Link>
    </div>
  );
}
