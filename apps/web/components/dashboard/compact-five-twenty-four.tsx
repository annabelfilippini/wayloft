import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { computeFiveTwentyFour } from "@/lib/cards/five-twenty-four";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { UserCard, UserExternalCard } from "@wayloft/shared";

interface CompactFiveTwentyFourProps {
  userId: string;
}

function statusBadge(count: number) {
  if (count <= 2) return { label: "Eligible", variant: "outline" as const };
  if (count <= 4) return { label: "Approaching", variant: "secondary" as const };
  return { label: "Over 5/24", variant: "destructive" as const };
}

function progressColor(count: number): string {
  if (count <= 2) return "bg-green-500";
  if (count <= 4) return "bg-amber-500";
  return "bg-red-500";
}

export async function CompactFiveTwentyFour({ userId }: CompactFiveTwentyFourProps) {
  const supabase = await createClient();

  const [cardsRes, externalRes] = await Promise.all([
    supabase.from("user_cards").select("*").eq("user_id", userId),
    supabase.from("user_external_cards").select("*").eq("user_id", userId),
  ]);

  const userCards = (cardsRes.data ?? []) as UserCard[];
  const externalCards = (externalRes.data ?? []) as UserExternalCard[];

  if (userCards.length === 0 && externalCards.length === 0) return null;

  const catalog = getAllCards();
  const status = computeFiveTwentyFour(userCards, externalCards, catalog);

  if (status.count === 0) return null;

  const badge = statusBadge(status.count);
  const pct = Math.min(100, (status.count / status.maxAllowed) * 100);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-sm font-medium">Chase 5/24:</span>
        <span className="text-sm font-bold">
          {status.count}/{status.maxAllowed}
        </span>
        <div className="relative flex-1">
          <Progress value={pct} className="h-2" />
          <div
            className={`absolute left-0 top-0 h-2 rounded-full ${progressColor(status.count)} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {status.slotsRemaining} slot{status.slotsRemaining !== 1 ? "s" : ""} remaining
        </span>
        <Badge variant={badge.variant} className="shrink-0">
          {badge.label}
        </Badge>
      </div>

      {status.countedCards.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            {status.countedCards.length} card{status.countedCards.length !== 1 ? "s" : ""} counting toward 5/24
          </summary>
          <div className="mt-2 space-y-1">
            {status.countedCards.map((card, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="truncate font-medium">{card.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  ages out{" "}
                  {new Date(card.agesOutDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
