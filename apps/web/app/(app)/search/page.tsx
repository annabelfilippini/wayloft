import { Construction } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Flight Search</h1>
      <div className="mt-8 flex flex-col items-center justify-center rounded-lg border py-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Coming Soon</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Search flights and see how many points each booking costs across your
          card portfolio. Powered by Duffel API with real-time pricing.
        </p>
      </div>
    </div>
  );
}
