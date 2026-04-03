import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { scoreCards } from "@/lib/recommend/engine";
import { isBeginnerOrBelow, isAdvanced } from "@/lib/experience";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { QuizInput } from "@/lib/recommend/types";
import type { ExperienceLevel } from "@wayloft/shared";

interface NextCardWidgetProps {
  userId: string;
  experienceLevel: ExperienceLevel | null;
}

function formatDollars(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export async function NextCardWidget({
  userId,
  experienceLevel,
}: NextCardWidgetProps) {
  const supabase = await createClient();

  const { data: quizRow } = await supabase
    .from("card_quiz_responses")
    .select("*")
    .eq("user_id", userId)
    .single();

  // No quiz data → CTA to take the quiz
  if (!quizRow) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-amber-100 dark:bg-amber-950/40">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.01em]">Find Your Next Card</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Take a 2-minute quiz to get personalized recommendations.
              </p>
              <Link
                href="/recommend"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Take the quiz
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Map DB row → QuizInput
  const quiz: QuizInput = {
    spending: {
      dining: quizRow.monthly_dining_spend ?? 0,
      travel: quizRow.monthly_travel_spend ?? 0,
      groceries: quizRow.monthly_grocery_spend ?? 0,
      gas: quizRow.monthly_gas_spend ?? 0,
      streaming: quizRow.monthly_streaming_spend ?? 0,
      other: quizRow.monthly_other_spend ?? 0,
    },
    creditScore: quizRow.credit_score_range ?? "good",
    cardsOpened24mo: quizRow.cards_opened_24mo ?? 0,
    cardsOpened48mo: quizRow.cards_opened_48mo ?? 0,
    currentCardSlugs: quizRow.current_card_slugs ?? [],
    annualFeeComfort: quizRow.annual_fee_comfort ?? "medium",
    travelGoal: quizRow.travel_goal ?? "maximize_travel",
  };

  const catalog = getAllCards();
  const results = scoreCards(quiz, catalog);
  const top2 = results.slice(0, 2);

  // No results (unlikely but handle gracefully)
  if (top2.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Cards to Consider</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No new card recommendations right now.{" "}
            <Link
              href="/recommend"
              className="text-foreground underline hover:no-underline"
            >
              Retake quiz
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const beginner = isBeginnerOrBelow(experienceLevel);
  const advanced = isAdvanced(experienceLevel);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-[-0.01em]">Cards to Consider</h2>
          <Link
            href="/recommend"
            className="text-xs font-medium text-primary hover:underline"
          >
            See all
          </Link>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Based on your spending profile and current portfolio
        </p>

        <div className="mt-4 space-y-3">
          {top2.map((result) => {
            const topEarning = result.topEarnings[0];

            return (
              <div
                key={result.card.slug}
                className="flex items-start gap-3 border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold leading-tight">
                      {result.card.name}
                    </span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {result.card.issuer.replace("_", " ")}
                    </Badge>
                  </div>

                  {beginner ? (
                    // Beginner: plain-language only
                    <p className="mt-1 text-xs text-muted-foreground">
                      {topEarning
                        ? `Great for ${topEarning.displayName.toLowerCase()} rewards`
                        : result.reasoning}
                    </p>
                  ) : (
                    // Intermediate + Advanced: value + top category
                    <>
                      <p className="mono mt-1 text-sm font-medium text-primary">
                        +{formatDollars(result.breakdown.firstYearValue)}{" "}
                        <span className="font-normal text-muted-foreground">
                          first-year value
                        </span>
                      </p>
                      {topEarning && (
                        <p className="mono text-xs text-muted-foreground">
                          {topEarning.multiplier}x on your $
                          {topEarning.monthlySpend.toLocaleString()}/mo{" "}
                          {topEarning.displayName.toLowerCase()}
                        </p>
                      )}
                    </>
                  )}

                  <Link
                    href="/recommend"
                    className="mt-1 inline-block text-xs text-primary hover:underline"
                  >
                    {advanced ? "View full breakdown" : "See why"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-center">
          <Link
            href="/recommend"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Retake quiz
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
