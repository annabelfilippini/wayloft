import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { getAllCards } from "@/lib/cards/catalog";
import { QuizWizard } from "@/components/recommend/quiz-wizard";
import type { QuizResponse } from "@/components/recommend/quiz-wizard";

export default async function RecommendPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const catalog = getAllCards();

  // Fetch existing quiz response for re-takes
  const { data: existingQuiz } = await supabase
    .from("card_quiz_responses")
    .select(
      "monthly_dining_spend, monthly_travel_spend, monthly_grocery_spend, monthly_gas_spend, monthly_streaming_spend, monthly_other_spend, credit_score_range, cards_opened_24mo, cards_opened_48mo, current_card_slugs, annual_fee_comfort, travel_goal"
    )
    .eq("user_id", user.id)
    .single();

  // Fetch user's existing card portfolio slugs
  const { data: userCards } = await supabase
    .from("user_cards")
    .select("card_slug")
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null);

  const userCardSlugs = (userCards ?? []).map(
    (c: { card_slug: string }) => c.card_slug
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <QuizWizard
        catalog={catalog}
        existingResponse={(existingQuiz as QuizResponse) ?? null}
        userCardSlugs={userCardSlugs}
      />
    </div>
  );
}
