import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { computeFiveTwentyFour } from "@/lib/cards/five-twenty-four";
import { isBeginnerOrBelow, isAdvanced } from "@/lib/experience";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type {
  UserCard,
  UserExternalCard,
  ExperienceLevel,
} from "@wayloft/shared";

interface FiveTwentyFourCounterProps {
  userId: string;
  experienceLevel: ExperienceLevel | null;
}

function statusBadge(count: number) {
  if (count <= 2)
    return { label: "Eligible", variant: "outline" as const };
  if (count <= 4)
    return { label: "Approaching", variant: "secondary" as const };
  return { label: "Over 5/24", variant: "destructive" as const };
}

function progressColor(count: number): string {
  if (count <= 2) return "bg-green-500";
  if (count <= 4) return "bg-amber-500";
  return "bg-red-500";
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
}

export async function FiveTwentyFourCounter({
  userId,
  experienceLevel,
}: FiveTwentyFourCounterProps) {
  const supabase = await createClient();

  const [cardsRes, externalRes] = await Promise.all([
    supabase.from("user_cards").select("*").eq("user_id", userId).is("deleted_at", null),
    supabase.from("user_external_cards").select("*").eq("user_id", userId),
  ]);

  const userCards = (cardsRes.data ?? []) as UserCard[];
  const externalCards = (externalRes.data ?? []) as UserExternalCard[];
  const catalog = getAllCards();

  // No cards at all → empty state
  if (userCards.length === 0 && externalCards.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-bold">Chase 5/24 Status</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your cards to track Chase 5/24 eligibility.{" "}
            <Link
              href="/cards"
              className="text-foreground underline hover:no-underline"
            >
              Go to My Cards
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const status = computeFiveTwentyFour(userCards, externalCards, catalog);
  const badge = statusBadge(status.count);
  const beginner = isBeginnerOrBelow(experienceLevel);
  const advanced = isAdvanced(experienceLevel);

  // ── Beginner view ──
  if (beginner) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-bold">Chase Eligibility</h2>
          <div className="mt-3">
            {status.isEligible ? (
              <p className="text-sm font-medium text-green-600">
                You can apply for{" "}
                <span className="text-lg font-bold">
                  {status.slotsRemaining} more
                </span>{" "}
                Chase card{status.slotsRemaining !== 1 ? "s" : ""}
              </p>
            ) : (
              <p className="text-sm font-medium text-red-600">
                Chase will likely decline your application right now
              </p>
            )}
            {/* Simple dot indicator */}
            <div className="mt-3 flex gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full ${
                    i < status.count
                      ? status.count >= 5
                        ? "bg-red-500"
                        : status.count >= 3
                          ? "bg-amber-500"
                          : "bg-green-500"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            {!status.isEligible && status.nextEligibleDate && (
              <p className="mt-2 text-xs text-muted-foreground">
                You&apos;ll be eligible again in{" "}
                {daysUntil(status.nextEligibleDate)} days
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Intermediate + Advanced view ──
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Chase 5/24</h2>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {status.count}/{status.maxAllowed} cards in 24 months
            </span>
            {status.isEligible && (
              <span className="text-xs text-muted-foreground">
                {status.slotsRemaining} slot{status.slotsRemaining !== 1 ? "s" : ""}{" "}
                remaining
              </span>
            )}
          </div>
          <div className="relative mt-2">
            <Progress
              value={Math.min(100, (status.count / status.maxAllowed) * 100)}
              className="h-2.5"
            />
            {/* Color overlay on the indicator */}
            <div
              className={`absolute left-0 top-0 h-2.5 rounded-full ${progressColor(status.count)} transition-all`}
              style={{
                width: `${Math.min(100, (status.count / status.maxAllowed) * 100)}%`,
              }}
            />
          </div>
        </div>

        {!status.isEligible && status.nextEligibleDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Next eligible:{" "}
            {new Date(status.nextEligibleDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            ({daysUntil(status.nextEligibleDate)} days)
          </p>
        )}

        {/* Advanced: expandable card list */}
        {advanced && status.countedCards.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              {status.countedCards.length} card{status.countedCards.length !== 1 ? "s" : ""}{" "}
              counting toward 5/24
            </summary>
            <div className="mt-2 space-y-1.5">
              {status.countedCards.map((card, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
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
            <p className="mt-2 text-xs text-muted-foreground">
              Business cards from most issuers don&apos;t count. Capital One and
              Discover business cards are exceptions.
            </p>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
