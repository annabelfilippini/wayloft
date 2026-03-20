"use client";

import { useState, useActionState } from "react";
import type { UserCard, CatalogCard, CardLifecycleEvent, LifecycleEventType, UserCreditUsage, UserPerkSetup, UserPaymentInfo, ExperienceLevel } from "@wayloft/shared";
import { formatCurrencyName, isBeginnerOrBelow } from "@/lib/experience";
import {
  ArrowLeft,
  Plane,
  Building2,
  Clock,
  CreditCard,
  Phone,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Ban,
  DollarSign,
  Trophy,
  History,
  Plus,
  Info,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardArtPlaceholder } from "./card-art-placeholder";
import { BonusProgress } from "./bonus-progress";
import { SpendUpdateForm } from "./spend-update-form";
import { CreditTracker } from "./credit-tracker";
import { PerkChecklist } from "./perk-checklist";
import { AFDecisionHelper } from "./af-decision-helper";
import { PaymentTracker } from "./payment-tracker";
import { logAnnualFeeEvent, logLifecycleEvent } from "@/app/actions/cards";

interface TransferPartnerEntry {
  partner: string;
  code: string;
  ratio: string;
  transfer_time: string;
  alliance?: string | null;
  note?: string;
}

interface TransferPartnerData {
  name: string;
  issuer: string;
  transfer_partners: {
    airlines: TransferPartnerEntry[];
    hotels: TransferPartnerEntry[];
  };
}

interface CardDetailProps {
  userCard: UserCard;
  catalogCard: CatalogCard;
  transferPartners: TransferPartnerData | null;
  lifecycleEvents: CardLifecycleEvent[];
  creditUsage: UserCreditUsage[];
  perkSetup: UserPerkSetup[];
  paymentInfo: UserPaymentInfo | null;
  experienceLevel?: ExperienceLevel | null;
}

function formatDaysRemaining(days: number) {
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 14) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const remaining = days % 7;
  if (remaining === 0) return `${weeks} weeks`;
  return `${weeks}w ${remaining}d`;
}

function formatIssuerName(issuer: string): string {
  const map: Record<string, string> = {
    chase: "Chase", amex: "Amex", citi: "Citi", capital_one: "Capital One",
    us_bank: "U.S. Bank", bilt: "Bilt", wells_fargo: "Wells Fargo",
    barclays: "Barclays", bank_of_america: "Bank of America", discover: "Discover",
  };
  return map[issuer] ?? issuer.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CardDetail({
  userCard,
  catalogCard,
  transferPartners,
  lifecycleEvents,
  creditUsage,
  perkSetup,
  paymentInfo,
  experienceLevel,
}: CardDetailProps) {
  const isBeginner = isBeginnerOrBelow(experienceLevel);
  const annualFeeDollars = userCard.annual_fee_cents / 100;
  const hasActiveBonus =
    userCard.signup_spend_requirement_cents != null &&
    userCard.signup_spend_requirement_cents > 0 &&
    !userCard.signup_bonus_met;

  const afDaysRemaining = userCard.annual_fee_date
    ? Math.ceil(
        (new Date(userCard.annual_fee_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Earning rates sorted by multiplier, split into "bonus" (>1x) and base
  const earningRates = Object.entries(catalogCard.earning_rates).sort(
    ([, a], [, b]) => b - a
  );
  const bonusCategories = earningRates.filter(([, rate]) => rate > 1);
  const baseRate = earningRates.find(([cat]) => cat === "other")?.[1] ?? 1;

  // Perks needing action
  const unactivatedPerks = perkSetup.filter(
    (p) => p.status === "not_started" && p.perk_type !== "always_on"
  );
  const totalPerkValue = unactivatedPerks.reduce(
    (sum, p) => sum + (p.estimated_annual_value_cents ?? 0), 0
  );

  // Has transfer partners worth showing?
  const hasTransferPartners = transferPartners &&
    (transferPartners.transfer_partners.airlines.length > 0 ||
      transferPartners.transfer_partners.hotels.length > 0);

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/cards"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cards
      </Link>

      {/* ===== TIER 1: Card identity + earning rates + action items ===== */}

      {/* Compact header */}
      <div className="flex gap-5">
        <div className="w-40 shrink-0">
          <CardArtPlaceholder
            issuer={userCard.issuer}
            network={catalogCard.network}
            cardName={userCard.card_name}
          />
        </div>
        <div className="min-w-0 flex flex-col justify-center">
          <h1 className="text-xl font-bold leading-tight">{userCard.card_name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatIssuerName(userCard.issuer)}
            {annualFeeDollars > 0 ? ` · $${annualFeeDollars}/yr` : ""}
          </p>
        </div>
      </div>

      {/* Earning rates — visual tiles, always visible */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          What this card earns
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {bonusCategories.map(([category, rate]) => (
            <div
              key={category}
              className="rounded-lg border bg-card px-3 py-2.5 text-center"
            >
              <p className="text-2xl font-bold tabular-nums">{rate}x</p>
              <p className="text-xs text-muted-foreground capitalize">
                {category.replace(/_/g, " ")}
              </p>
            </div>
          ))}
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-2xl font-bold tabular-nums text-muted-foreground">{baseRate}x</p>
            <p className="text-xs text-muted-foreground">Everything else</p>
          </div>
        </div>
        {!isBeginner && catalogCard.earning_caps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {catalogCard.earning_caps.map((cap) => (
              <p key={cap.category} className="text-[11px] text-muted-foreground">
                {cap.category}: up to ${(cap.limit_cents / 100).toLocaleString()}/{cap.period}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Action items — only show sections that are relevant */}
      {(hasActiveBonus || (afDaysRemaining !== null && afDaysRemaining <= 60 && annualFeeDollars > 0) || paymentInfo) && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Action items
          </h2>

          {/* Spending requirement to earn welcome bonus */}
          {hasActiveBonus && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">
                    Spend ${((userCard.signup_spend_requirement_cents ?? 0) / 100).toLocaleString()} to earn {(userCard.signup_bonus_points ?? 0).toLocaleString()} bonus points
                  </p>
                  {userCard.signup_spend_deadline && (
                    <p className="text-xs text-muted-foreground">
                      Due by {new Date(userCard.signup_spend_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <BonusProgress
                progressCents={userCard.signup_spend_progress_cents}
                requirementCents={userCard.signup_spend_requirement_cents!}
                deadline={userCard.signup_spend_deadline}
                bonusPoints={null}
              />
              <SpendUpdateForm
                cardId={userCard.id}
                currentCents={userCard.signup_spend_progress_cents}
              />
            </div>
          )}

          {userCard.signup_bonus_earned && (
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Trophy className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Welcome bonus earned</p>
            </div>
          )}
          {userCard.signup_bonus_met && !userCard.signup_bonus_earned && (
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">Spend requirement met — bonus posting soon</p>
            </div>
          )}

          {/* Annual Fee — only when approaching (≤60 days) */}
          {annualFeeDollars > 0 && afDaysRemaining !== null && afDaysRemaining <= 60 && (
            <AnnualFeeSection
              userCard={userCard}
              annualFeeDollars={annualFeeDollars}
              daysRemaining={afDaysRemaining}
              creditUsage={creditUsage}
              catalogCard={catalogCard}
              perkSetup={perkSetup}
              lifecycleEvents={lifecycleEvents}
            />
          )}

          {/* Payment tracker */}
          <PaymentTracker
            paymentInfo={paymentInfo}
            catalogPaymentInfo={catalogCard.payment_info ?? null}
            userCardId={userCard.id}
            cardSlug={userCard.card_slug}
          />
        </div>
      )}

      {/* ===== TIER 2: Perks to activate + Transfer partners ===== */}

      {/* Perks nudge — only if there are unactivated perks */}
      {unactivatedPerks.length > 0 && (
        <CollapsibleSection
          title={`${unactivatedPerks.length} perk${unactivatedPerks.length !== 1 ? "s" : ""} to activate`}
          subtitle={totalPerkValue > 0 ? `~$${(totalPerkValue / 100).toLocaleString()}/yr in value` : undefined}
          icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
          defaultOpen
        >
          <PerkChecklist perks={perkSetup} keyPerks={catalogCard.key_perks} />
        </CollapsibleSection>
      )}

      {/* If all perks are activated, still let them access the full list */}
      {perkSetup.length > 0 && unactivatedPerks.length === 0 && (
        <CollapsibleSection
          title="Perks & Benefits"
          subtitle="All set up"
          icon={<Trophy className="h-4 w-4 text-green-500" />}
        >
          <PerkChecklist perks={perkSetup} keyPerks={catalogCard.key_perks} />
        </CollapsibleSection>
      )}

      {/* If no structured perks, show key_perks as a simple list */}
      {perkSetup.length === 0 && catalogCard.key_perks.length > 0 && (
        <CollapsibleSection title="Key Perks">
          <ul className="space-y-1.5">
            {catalogCard.key_perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {perk}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* Transfer Partners */}
      {hasTransferPartners && (
        <CollapsibleSection
          title="Transfer Partners"
          subtitle={`${transferPartners!.transfer_partners.airlines.length} airlines · ${transferPartners!.transfer_partners.hotels.length} hotels`}
          icon={<Plane className="h-4 w-4" />}
        >
          <TransferPartnersContent transferPartners={transferPartners!} />
        </CollapsibleSection>
      )}

      {/* ===== TIER 3: Reference sections (collapsed by default) ===== */}

      {/* Annual fee info — when NOT approaching (persistent reference) */}
      {annualFeeDollars > 0 && afDaysRemaining !== null && afDaysRemaining > 60 && (
        <CollapsibleSection
          title="Annual Fee"
          subtitle={`$${annualFeeDollars}/yr · Due ${new Date(userCard.annual_fee_date!).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
          icon={<DollarSign className="h-4 w-4" />}
        >
          <AnnualFeeSection
            userCard={userCard}
            annualFeeDollars={annualFeeDollars}
            daysRemaining={afDaysRemaining}
            creditUsage={creditUsage}
            catalogCard={catalogCard}
            perkSetup={perkSetup}
            lifecycleEvents={lifecycleEvents}
          />
        </CollapsibleSection>
      )}

      {/* Statement Credits */}
      {creditUsage.length > 0 && (
        <CollapsibleSection
          title="Statement Credits"
          icon={<DollarSign className="h-4 w-4" />}
        >
          <CreditTracker credits={creditUsage} />
        </CollapsibleSection>
      )}

      {/* Card History */}
      <CollapsibleSection
        title="Card History"
        subtitle={lifecycleEvents.length > 0 ? `${lifecycleEvents.length} event${lifecycleEvents.length !== 1 ? "s" : ""}` : undefined}
        icon={<History className="h-4 w-4" />}
      >
        <LifecycleTimeline
          userCardId={userCard.id}
          events={lifecycleEvents}
        />
      </CollapsibleSection>
    </div>
  );
}

// --- Collapsible Section ---

function CollapsibleSection({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="border-t px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

// --- Transfer Partners Content ---

const ALLIANCE_DESCRIPTIONS: Record<string, string> = {
  "Star Alliance": "26 airlines including United, Lufthansa, ANA, Air Canada, and Singapore",
  "oneworld": "13 airlines including American, British Airways, Cathay Pacific, and Qantas",
  "SkyTeam": "19 airlines including Delta, Air France/KLM, and Korean Air",
};

function TransferPartnersContent({ transferPartners }: { transferPartners: TransferPartnerData }) {
  const airlines = transferPartners.transfer_partners.airlines;
  const hotels = transferPartners.transfer_partners.hotels;
  const alliances = [...new Set(airlines.map((a) => a.alliance).filter(Boolean))] as string[];
  const relevantAlliances = alliances.filter((a) => a in ALLIANCE_DESCRIPTIONS);

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">{transferPartners.name}</p>

      {relevantAlliances.length > 0 && (
        <div className="space-y-1.5">
          {relevantAlliances.map((alliance) => (
            <div
              key={alliance}
              className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
            >
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <p>
                <span className="font-medium text-foreground">{alliance}:</span>{" "}
                {ALLIANCE_DESCRIPTIONS[alliance]}
              </p>
            </div>
          ))}
        </div>
      )}

      {airlines.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Plane className="h-3.5 w-3.5" />
            Airlines
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {airlines.map((airline) => (
              <div
                key={airline.code}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{airline.partner}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{airline.code}</span>
                    {airline.alliance && (
                      <>
                        <span>&middot;</span>
                        <span>{airline.alliance}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium">{airline.ratio}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {airline.transfer_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hotels.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            Hotels
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {hotels.map((hotel) => (
              <div
                key={hotel.code}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{hotel.partner}</p>
                  {hotel.note && (
                    <p className="text-xs text-muted-foreground">{hotel.note}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium">{hotel.ratio}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {hotel.transfer_time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Lifecycle Timeline ---

const EVENT_CONFIG: Record<
  LifecycleEventType,
  { label: string; icon: typeof CreditCard; color: string }
> = {
  opened: { label: "Card Opened", icon: CreditCard, color: "text-green-600" },
  product_change: { label: "Product Change", icon: ArrowUpDown, color: "text-blue-600" },
  downgrade: { label: "Downgraded", icon: ArrowDown, color: "text-orange-500" },
  upgrade: { label: "Upgraded", icon: ArrowUp, color: "text-purple-600" },
  cancelled: { label: "Cancelled", icon: Ban, color: "text-red-600" },
  retention_offer: { label: "Retention Offer", icon: Phone, color: "text-green-600" },
  retention_declined: { label: "Retention Declined", icon: Phone, color: "text-orange-500" },
  annual_fee_posted: { label: "AF Posted", icon: DollarSign, color: "text-red-500" },
  annual_fee_waived: { label: "AF Waived", icon: DollarSign, color: "text-green-600" },
  signup_bonus_met: { label: "Bonus Spend Met", icon: Trophy, color: "text-amber-500" },
  signup_bonus_earned: { label: "Bonus Earned", icon: Trophy, color: "text-green-600" },
};

const RETENTION_EVENT_TYPES: LifecycleEventType[] = [
  "retention_offer",
  "retention_declined",
];

const PRODUCT_CHANGE_TYPES: LifecycleEventType[] = [
  "product_change",
  "downgrade",
  "upgrade",
];

type TimelineActionState = { error?: string; success?: boolean };

function LifecycleTimeline({
  userCardId,
  events,
}: {
  userCardId: string;
  events: CardLifecycleEvent[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState<LifecycleEventType>("annual_fee_posted");
  const [state, formAction, isPending] = useActionState<TimelineActionState, FormData>(
    async (_prev, formData) => {
      const result = await logLifecycleEvent(formData);
      if (result.success) setShowForm(false);
      return result;
    },
    {}
  );

  const showRetentionFields = RETENTION_EVENT_TYPES.includes(eventType);
  const showProductFields = PRODUCT_CHANGE_TYPES.includes(eventType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Card Timeline</h3>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Event
          </Button>
        )}
      </div>

      {showForm && (
        <form action={formAction} className="space-y-3 rounded-md border p-3">
          <input type="hidden" name="user_card_id" value={userCardId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Event Type</label>
              <Select
                name="event_type"
                value={eventType}
                onValueChange={(v) => setEventType(v as LifecycleEventType)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="annual_fee_posted">AF Posted</SelectItem>
                  <SelectItem value="annual_fee_waived">AF Waived</SelectItem>
                  <SelectItem value="retention_offer">Retention Offer</SelectItem>
                  <SelectItem value="retention_declined">Retention Declined</SelectItem>
                  <SelectItem value="signup_bonus_met">Bonus Spend Met</SelectItem>
                  <SelectItem value="signup_bonus_earned">Bonus Earned</SelectItem>
                  <SelectItem value="product_change">Product Change</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                  <SelectItem value="downgrade">Downgrade</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date</label>
              <Input
                name="event_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {showRetentionFields && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="retention_offer_type" placeholder="Offer type (e.g. statement_credit)" className="h-8 text-sm" />
              <Input name="retention_offer_value" placeholder="Value (e.g. $150 credit)" className="h-8 text-sm" />
              <Input name="retention_spend_requirement" placeholder="Spend req (e.g. $2k in 3mo)" className="h-8 text-sm sm:col-span-2" />
            </div>
          )}

          {showProductFields && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="from_card_slug" placeholder="From card slug" className="h-8 text-sm" />
              <Input name="to_card_slug" placeholder="To card slug" className="h-8 text-sm" />
            </div>
          )}

          <Textarea name="notes" placeholder="Notes (optional)" className="min-h-[50px] text-sm" />

          {state.error && <p className="text-xs text-destructive">{state.error}</p>}
          {state.success && <p className="text-xs text-green-600">Event logged</p>}

          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <History className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No events yet</p>
          <p className="text-xs text-muted-foreground">
            Log retention calls, AF postings, and other milestones.
          </p>
        </div>
      ) : (
        <div className="relative ml-3 border-l border-border pl-6">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.event_type] ?? {
              label: event.event_type, icon: CreditCard, color: "text-muted-foreground",
            };
            const Icon = config.icon;
            return (
              <div key={event.id} className="relative pb-6 last:pb-0">
                <div className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border bg-background ${config.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {event.retention_offer_value && (
                    <p className="text-xs text-muted-foreground">
                      {event.retention_offer_type}: {event.retention_offer_value}
                      {event.retention_spend_requirement && ` (requires ${event.retention_spend_requirement})`}
                    </p>
                  )}
                  {event.from_card_slug && event.to_card_slug && (
                    <p className="text-xs text-muted-foreground">{event.from_card_slug} → {event.to_card_slug}</p>
                  )}
                  {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Annual Fee Section ---

type AFActionState = { error?: string; success?: boolean };

function AnnualFeeSection({
  userCard,
  annualFeeDollars,
  daysRemaining,
  creditUsage,
  catalogCard,
  perkSetup,
  lifecycleEvents,
}: {
  userCard: UserCard;
  annualFeeDollars: number;
  daysRemaining: number;
  creditUsage: UserCreditUsage[];
  catalogCard: CatalogCard;
  perkSetup: UserPerkSetup[];
  lifecycleEvents: CardLifecycleEvent[];
}) {
  const [showRetentionForm, setShowRetentionForm] = useState(false);
  const [showDecisionHelper, setShowDecisionHelper] = useState(false);

  const hasDecisionData = !!(catalogCard.downgrade_options?.length || catalogCard.retention_data);

  const [state, formAction, isPending] = useActionState<AFActionState, FormData>(
    async (_prev, formData) => {
      const result = await logAnnualFeeEvent(formData);
      if (result.success) setShowRetentionForm(false);
      return result;
    },
    {}
  );

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Annual Fee</p>
            <p className="text-xs text-muted-foreground">
              ${annualFeeDollars} &middot; Next:{" "}
              {new Date(userCard.annual_fee_date!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        {daysRemaining <= 14 ? (
          <Badge variant="destructive">{formatDaysRemaining(daysRemaining)}</Badge>
        ) : daysRemaining <= 30 ? (
          <Badge variant="secondary">{formatDaysRemaining(daysRemaining)}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{formatDaysRemaining(daysRemaining)}</span>
        )}
      </div>

      {/* AF Offset Calculator */}
      {creditUsage.length > 0 && <AnnualFeeOffset annualFeeDollars={annualFeeDollars} credits={creditUsage} />}

      {/* AF Decision Helper */}
      {hasDecisionData && !showDecisionHelper && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDecisionHelper(true)}>
          Review your options
        </Button>
      )}
      {showDecisionHelper && (
        <AFDecisionHelper
          catalogCard={catalogCard}
          creditUsage={creditUsage}
          perkSetup={perkSetup}
          lifecycleEvents={lifecycleEvents}
        />
      )}

      {/* Retention offer */}
      {!showRetentionForm ? (
        <button
          type="button"
          onClick={() => setShowRetentionForm(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Phone className="h-3 w-3" />
          Log retention offer
        </button>
      ) : (
        <form action={formAction} className="space-y-3 rounded-md border p-3">
          <input type="hidden" name="user_card_id" value={userCard.id} />
          <div className="space-y-2">
            <Select name="event_type" defaultValue="retention_offer">
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="retention_offer">Received offer</SelectItem>
                <SelectItem value="retention_declined">No offer / declined</SelectItem>
                <SelectItem value="annual_fee_posted">AF posted</SelectItem>
                <SelectItem value="annual_fee_waived">AF waived</SelectItem>
              </SelectContent>
            </Select>
            <Input name="retention_offer_type" placeholder="Offer type (e.g. statement_credit)" className="h-8 text-sm" />
            <Input name="retention_offer_value" placeholder="Offer value (e.g. $150 credit)" className="h-8 text-sm" />
            <Textarea name="notes" placeholder="Notes..." className="min-h-[60px] text-sm" />
          </div>
          {state.error && <p className="text-xs text-destructive">{state.error}</p>}
          {state.success && <p className="text-xs text-green-600">Logged successfully</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowRetentionForm(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}

// --- Annual Fee Offset Calculator ---

function AnnualFeeOffset({
  annualFeeDollars,
  credits,
}: {
  annualFeeDollars: number;
  credits: UserCreditUsage[];
}) {
  const creditSums: Record<string, number> = {};
  for (const c of credits) {
    creditSums[c.credit_name] = (creditSums[c.credit_name] ?? 0) + c.amount_used_cents;
  }

  const totalUsedCents = Object.values(creditSums).reduce((a, b) => a + b, 0);
  const totalUsedDollars = totalUsedCents / 100;
  const effectiveCost = annualFeeDollars - totalUsedDollars;

  if (totalUsedCents === 0) return null;

  return (
    <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Annual Fee</span>
        <span>${annualFeeDollars}</span>
      </div>
      {Object.entries(creditSums)
        .filter(([, cents]) => cents > 0)
        .map(([name, cents]) => (
          <div key={name} className="flex justify-between text-muted-foreground">
            <span className="pl-2">{name} used</span>
            <span>-${(cents / 100).toFixed(0)}</span>
          </div>
        ))}
      <div className="border-t pt-1.5 flex justify-between font-medium">
        <span>Effective cost</span>
        <span className={effectiveCost <= 0 ? "text-green-600" : "text-amber-600"}>
          {effectiveCost <= 0 ? `-$${Math.abs(effectiveCost).toFixed(0)}` : `$${effectiveCost.toFixed(0)}`}
        </span>
      </div>
      {effectiveCost <= 0 && (
        <p className="text-xs text-green-600">You&apos;re ahead on this card</p>
      )}
    </div>
  );
}
