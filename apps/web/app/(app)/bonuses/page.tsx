import { Construction } from "lucide-react";

export default function BonusesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Transfer Bonuses</h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border py-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Coming Soon</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Track active transfer bonuses across Chase, Amex, Citi, Capital One,
          and Bilt. Get notified when new promotions go live.
        </p>
      </div>
    </div>
  );
}
