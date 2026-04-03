import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Info, Zap } from "lucide-react";
import { BANK_DISPLAY_NAMES } from "@/lib/bonuses/utils";
import { isBeginnerOrBelow } from "@/lib/experience";
import type { TransferBonus, ExperienceLevel } from "@wayloft/shared";

interface BonusSpotlightProps {
  userId: string;
  experienceLevel?: ExperienceLevel | null;
}

/** Shorten loyalty program names to just the brand */
const SHORT_PARTNER_NAMES: Record<string, string> = {
  "United MileagePlus": "United",
  "Southwest Rapid Rewards": "Southwest",
  "British Airways Avios": "British Airways",
  "Air Canada Aeroplan": "Air Canada",
  "Singapore KrisFlyer": "Singapore Airlines",
  "Emirates Skywards": "Emirates",
  "Air France/KLM Flying Blue": "Air France/KLM",
  "Iberia Avios": "Iberia",
  "Virgin Atlantic Flying Club": "Virgin Atlantic",
  "JetBlue TrueBlue": "JetBlue",
  "Delta SkyMiles": "Delta",
  "ANA Mileage Club": "ANA",
  "Cathay Pacific Asia Miles": "Cathay Pacific",
  "Qantas Frequent Flyer": "Qantas",
  "Avianca LifeMiles": "Avianca",
  "Aer Lingus AerClub": "Aer Lingus",
  "Etihad Guest": "Etihad",
  "Hawaiian Airlines HawaiianMiles": "Hawaiian Airlines",
  "Turkish Miles&Smiles": "Turkish Airlines",
  "Alaska Airlines Mileage Plan": "Alaska Airlines",
  "American Airlines AAdvantage": "American Airlines",
  "Qatar Airways Privilege Club": "Qatar Airways",
  "Finnair Plus": "Finnair",
  "TAP Miles&Go": "TAP Portugal",
  "World of Hyatt": "Hyatt",
  "IHG One Rewards": "IHG",
  "Marriott Bonvoy": "Marriott",
  "Hilton Honors": "Hilton",
  "Choice Privileges": "Choice Hotels",
  "Wyndham Rewards": "Wyndham",
  "Accor Live Limitless": "Accor",
};

function shortPartnerName(fullName: string): string {
  return SHORT_PARTNER_NAMES[fullName] ?? fullName;
}

function urgencyBadge(daysRemaining: number) {
  if (daysRemaining <= 2) {
    return { label: `${daysRemaining} DAYS`, variant: "destructive" as const };
  }
  if (daysRemaining <= 7) {
    return { label: `${daysRemaining} DAYS`, variant: "default" as const };
  }
  return { label: `${daysRemaining} DAYS`, variant: "secondary" as const };
}

export async function BonusSpotlight({ userId, experienceLevel }: BonusSpotlightProps) {
  const isBeginner = isBeginnerOrBelow(experienceLevel);
  const supabase = await createClient();

  const [bonusesRes, userCardsRes] = await Promise.all([
    supabase
      .from("transfer_bonuses")
      .select("*")
      .eq("is_active", true)
      .gte("end_date", new Date().toISOString().split("T")[0])
      .order("end_date", { ascending: true }),
    supabase
      .from("user_cards")
      .select("currency")
      .eq("user_id", userId)
      .eq("status", "active")
      .is("deleted_at", null),
  ]);

  const allBonuses = (bonusesRes.data ?? []) as TransferBonus[];
  const userCurrencies = new Set(
    (userCardsRes.data ?? []).map((c: { currency: string }) => c.currency)
  );

  // Prioritize user's currencies, then show all
  const myBonuses = allBonuses.filter((b) => userCurrencies.has(b.currency));
  const otherBonuses = allBonuses.filter((b) => !userCurrencies.has(b.currency));
  const sorted = [...myBonuses, ...otherBonuses];
  const display = sorted.slice(0, 5);
  const endingCount = display.filter((b) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(b.end_date + "T00:00:00");
    return Math.ceil((end.getTime() - now.getTime()) / 86_400_000) <= 7;
  }).length;

  // Empty state
  if (display.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className="text-lg font-semibold tracking-[-0.01em]">Transfer Bonuses</span>
        </div>
        <div className="border border-dashed p-6 text-center">
          <Zap className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">
            No active transfer bonuses right now
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-lg font-semibold tracking-[-0.01em]">Transfer Bonuses</span>
        {endingCount > 0 && (
          <Badge variant="destructive">{endingCount} ENDING</Badge>
        )}
      </div>

      {isBeginner && (
        <div className="mb-4 flex items-start gap-2 bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Your credit card points can be transferred to airline and hotel loyalty programs.
            During a bonus, you get extra miles — like a sale on your rewards.
          </span>
        </div>
      )}

      <div>
        {display.map((bonus, i) => {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const end = new Date(bonus.end_date + "T00:00:00");
          const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
          const badge = urgencyBadge(daysRemaining);
          const bankName = BANK_DISPLAY_NAMES[bonus.bank] ?? bonus.bank;
          const partner = shortPartnerName(bonus.partner);
          const isFading = daysRemaining > 14;

          return (
            <Link
              key={bonus.id}
              href="/travel"
              className={`block py-4 ${i < display.length - 1 ? "" : ""} transition-opacity hover:opacity-80${isFading ? " opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="mono text-[28px] font-normal">+{bonus.bonus_percentage}%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-[0.04em] mt-1">
                    {bankName} &rarr; {partner}
                  </div>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              {bonus.source_url && (
                <div className="text-sm text-muted-foreground leading-[1.4]">
                  {bankName} {bonus.currency.toUpperCase()} to {partner}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
