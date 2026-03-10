import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  scrapeAllSources,
  normalize,
  diffBonuses,
  applyChanges,
} from "@/lib/bonuses/scraper";

export const maxDuration = 60;

const IDEMPOTENCY_HOURS = 4;

export async function GET(request: NextRequest) {
  // ── Auth check ──
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/scrape-bonuses] CRON_SECRET env var is not set");
    return NextResponse.json(
      { success: false, error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // ── Idempotency check ──
    const { data: recentBonus } = await supabase
      .from("transfer_bonuses")
      .select("scraped_at")
      .order("scraped_at", { ascending: false })
      .limit(1)
      .single();

    if (recentBonus?.scraped_at) {
      const lastScraped = new Date(recentBonus.scraped_at);
      const hoursSince =
        (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60);
      if (hoursSince < IDEMPOTENCY_HOURS) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: `Already scraped ${hoursSince.toFixed(1)} hours ago (threshold: ${IDEMPOTENCY_HOURS}h)`,
        });
      }
    }

    // ── Scrape ──
    console.log("[cron/scrape-bonuses] Starting scrape pipeline");
    const { sourceResults, allBonuses } = await scrapeAllSources();

    // ── Normalize & validate ──
    const normalized = normalize(allBonuses, today);
    console.log(
      `[cron/scrape-bonuses] ${allBonuses.length} raw → ${normalized.length} validated bonuses`
    );

    // ── Diff against DB ──
    const { data: existingBonuses } = await supabase
      .from("transfer_bonuses")
      .select("id, bank, partner_code, bonus_percentage")
      .eq("is_active", true);

    const changes = diffBonuses(normalized, existingBonuses ?? []);
    console.log(
      `[cron/scrape-bonuses] Diff: ${changes.newBonuses.length} new, ${changes.expiredBonuses.length} expired, ${changes.unchanged.length} unchanged`
    );

    // ── Apply changes ──
    const result = await applyChanges(supabase, changes, today);
    if (result.errors.length > 0) {
      console.warn(
        `[cron/scrape-bonuses] ${result.errors.length} errors during apply:`,
        result.errors
      );
    }

    // ── Expiration cleanup ──
    // Deactivate bonuses where is_active=true but end_date < today
    let expiredCleanup = 0;

    const { data: pastDueBonuses } = await supabase
      .from("transfer_bonuses")
      .select("id, bank, currency, partner, partner_code, bonus_percentage, start_date, end_date")
      .eq("is_active", true)
      .lt("end_date", today);

    if (pastDueBonuses && pastDueBonuses.length > 0) {
      for (const bonus of pastDueBonuses) {
        // Copy to history
        await supabase.from("transfer_bonus_history").insert({
          bank: bonus.bank,
          currency: bonus.currency,
          partner: bonus.partner,
          partner_code: bonus.partner_code,
          bonus_percentage: bonus.bonus_percentage,
          start_date: bonus.start_date ?? today,
          end_date: bonus.end_date ?? today,
        });

        // Deactivate
        const { error } = await supabase
          .from("transfer_bonuses")
          .update({ is_active: false })
          .eq("id", bonus.id);

        if (!error) expiredCleanup++;
      }
      console.log(
        `[cron/scrape-bonuses] Expiration cleanup: ${expiredCleanup} bonuses deactivated`
      );
    }

    // ── Response ──
    return NextResponse.json({
      success: true,
      sources: sourceResults,
      changes: {
        new: result.inserted,
        expired: result.expired,
        unchanged: changes.unchanged.length,
      },
      expiredCleanup,
      ...(result.errors.length > 0 && { errors: result.errors }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[cron/scrape-bonuses] Fatal error: ${msg}`);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
