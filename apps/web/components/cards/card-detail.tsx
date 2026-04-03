"use client";

import { useState, useRef, useActionState } from "react";
import type {
  UserCard,
  CatalogCard,
  CardLifecycleEvent,
  LifecycleEventType,
  UserCreditUsage,
  UserPerkSetup,
  UserPaymentInfo,
  ExperienceLevel,
} from "@wayloft/shared";
import { isBeginnerOrBelow } from "@/lib/experience";
import {
  ArrowLeft,
  Trophy,
  Star,
  Plane,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Bell,
  Utensils,
  ShoppingCart,
  Play,
  ShoppingBag,
  Fuel,
  Building2,
  CreditCard,
  Calendar,
  Phone,
  History,
  Plus,
  DollarSign,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Ban,
  Train,
  Car,
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
import { getIssuerGradient } from "@/lib/cards/issuer-colors";
import { SpendUpdateForm } from "./spend-update-form";
import { AFDecisionHelper } from "./af-decision-helper";
import { PaymentTracker } from "./payment-tracker";
import { CardBenefitsSection } from "./card-benefits-section";
import { TravelWithPointsSection } from "./travel-with-points-section";
import type { TransferPartnerData } from "./transfer-partners-content";
import { logAnnualFeeEvent, logLifecycleEvent } from "@/app/actions/cards";

// --- Interfaces ---

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

// --- Constants ---

const CATEGORY_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  dining: Utensils,
  travel: Plane,
  flights: Plane,
  hotels: Building2,
  groceries: ShoppingCart,
  online_groceries: ShoppingCart,
  gas: Fuel,
  streaming: Play,
  transit: Train,
  online_shopping: ShoppingBag,
  car_rentals: Car,
};

// Human-readable names for earning categories
const ISSUER_PORTAL_NAMES: Record<string, string> = {
  chase: "Chase Travel",
  amex: "Amex Travel",
  capital_one: "Capital One Travel",
  citi: "Citi Travel",
  bilt: "Bilt Travel",
  wells_fargo: "Wells Fargo Travel",
  barclays: "Barclays Travel",
  us_bank: "U.S. Bank Travel",
  bank_of_america: "BofA Travel",
};

function getCategoryDisplay(category: string, issuer: string): string {
  if (category === "brand_portal") return ISSUER_PORTAL_NAMES[issuer] ?? "Travel portal";
  if (category === "brand_property") return ISSUER_PORTAL_NAMES[issuer] ?? "Brand purchases";
  const NAMES: Record<string, string> = {
    online_groceries: "Online groceries",
    car_rentals: "Car rentals",
    online_shopping: "Online shopping",
  };
  return NAMES[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// --- Helpers ---

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
    chase: "Chase",
    amex: "Amex",
    citi: "Citi",
    capital_one: "Capital One",
    us_bank: "U.S. Bank",
    bilt: "Bilt",
    wells_fargo: "Wells Fargo",
    barclays: "Barclays",
    bank_of_america: "Bank of America",
    discover: "Discover",
  };
  return (
    map[issuer] ??
    issuer.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

type SettingsTab = "af" | "retention" | "timeline" | "payment" | null;

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

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
  const settingsRef = useRef<HTMLElement>(null);

  // --- Bonus state ---
  const hasActiveBonus =
    userCard.signup_spend_requirement_cents != null &&
    userCard.signup_spend_requirement_cents > 0 &&
    !userCard.signup_bonus_met;

  const progressCents = userCard.signup_spend_progress_cents ?? 0;
  const requirementCents = userCard.signup_spend_requirement_cents ?? 0;
  const progressDollars = progressCents / 100;
  const requirementDollars = requirementCents / 100;
  const progressPct =
    requirementCents > 0
      ? Math.min((progressCents / requirementCents) * 100, 100)
      : 0;

  const bonusDeadline = userCard.signup_spend_deadline
    ? new Date(userCard.signup_spend_deadline)
    : null;
  const bonusDaysRemaining = bonusDeadline
    ? Math.ceil(
        (bonusDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;
  const bonusWeeksRemaining =
    bonusDaysRemaining !== null ? Math.floor(bonusDaysRemaining / 7) : null;
  const remainingCents = requirementCents - progressCents;
  const dailySpendNeeded =
    bonusDaysRemaining && bonusDaysRemaining > 0 && remainingCents > 0
      ? Math.ceil(remainingCents / bonusDaysRemaining / 100)
      : null;

  // --- AF state ---
  const afDaysRemaining = userCard.annual_fee_date
    ? Math.ceil(
        (new Date(userCard.annual_fee_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // --- Earning rates ---
  const earningRates = Object.entries(catalogCard.earning_rates).sort(
    ([, a], [, b]) => b - a,
  );
  const bonusCategories = earningRates.filter(([, rate]) => rate > 1);
  const baseRate = earningRates.find(([cat]) => cat === "other")?.[1] ?? 1;

  // --- Transfer partners ---
  const hasTransferPartners =
    transferPartners &&
    (transferPartners.transfer_partners.airlines.length > 0 ||
      transferPartners.transfer_partners.hotels.length > 0);

  // --- Payment ---
  const now = new Date();
  let nextPaymentDate: Date | null = null;
  if (paymentInfo?.due_day) {
    nextPaymentDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      paymentInfo.due_day,
    );
    if (nextPaymentDate <= now) {
      nextPaymentDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        paymentInfo.due_day,
      );
    }
  }
  const paymentDaysUntil = nextPaymentDate
    ? Math.ceil(
        (nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  // --- UI state ---
  const [showSpendForm, setShowSpendForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(null);

  // Hero gradient from issuer colors
  const issuerGradientRaw = getIssuerGradient(userCard.issuer);
  const heroGradient = issuerGradientRaw.replace("linear-gradient(135deg, ", "").replace(")", "");

  const cardClass = "bg-card border overflow-hidden";

  return (
    <div>
      {/* ═══════ HERO — extends to top of screen ═══════ */}
      <section className="text-white overflow-hidden relative -mt-[52px]" style={{ background: `linear-gradient(135deg, ${heroGradient})` }}>
        {/* Dark overlay to ensure text readability on all issuer gradients */}
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative px-8 pt-[52px]">
          {/* Back link inside hero */}
          <div className="pt-6 pb-6">
            <Link
              href="/cards"
              className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              My Cards
            </Link>
          </div>
        </div>
        <div className="relative px-8 pb-16">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
            {/* Left: Card Identity */}
            <div className="flex-1">
              <span className="label-signal text-white/50 mb-4 block">
                {formatIssuerName(userCard.issuer)} {userCard.currency.toUpperCase()}
              </span>
              <h1 className="text-4xl md:text-5xl font-semibold leading-[0.95] tracking-tight mb-6">
                {userCard.card_name}
              </h1>
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-400/20 text-emerald-300 border-transparent">Active</Badge>
                <span className="text-white/40 text-xs">
                  {catalogCard.network} · Member since {userCard.card_since ? new Date(userCard.card_since).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
            </div>

            {/* Right: Card Art */}
            <div className="shrink-0">
              <div className="w-[318px]">
                <CardArtPlaceholder
                  issuer={userCard.issuer}
                  network={catalogCard.network}
                  cardName={userCard.card_name}
                  className=""
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="border-b bg-card">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="py-6 px-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground block mb-1">Annual Fee</span>
            <span className="text-2xl font-light">
              {annualFeeDollars > 0 ? `$${annualFeeDollars}` : "$0"}
              {annualFeeDollars > 0 && <span className="text-sm text-muted-foreground font-normal">/yr</span>}
            </span>
          </div>
          <div className="py-6 px-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground block mb-1">Next Fee Date</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-light">
                {userCard.annual_fee_date
                  ? new Date(userCard.annual_fee_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                  : "—"}
              </span>
              {afDaysRemaining != null && afDaysRemaining > 0 && (
                <span className="text-[10px] text-muted-foreground">{afDaysRemaining} days</span>
              )}
            </div>
          </div>
          <div className="py-6 px-6">
            <span className="text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground block mb-1">Member Since</span>
            <span className="text-2xl font-light">
              {userCard.card_since
                ? new Date(userCard.card_since).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════ SIGNUP BONUS ═══════ */}
      <section className="border bg-card p-8 mt-10">
        {hasActiveBonus && (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="label-signal text-muted-foreground block mb-2">Signup Bonus</span>
                <h2 className="text-2xl font-semibold tracking-[-0.01em]">
                  Earn{" "}
                  <span className="mono">{(userCard.signup_bonus_points ?? 0).toLocaleString()}</span>{" "}
                  points
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Spend <span className="mono">${requirementDollars.toLocaleString()}</span> by{" "}
                  {bonusDeadline?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "deadline"}
                </p>
              </div>
              <div className="text-right">
                <span className="mono text-3xl font-light">{Math.round(progressPct)}<span className="text-lg">%</span></span>
                <span className="label-signal text-muted-foreground block mt-1">Complete</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="mono text-sm">${progressDollars.toLocaleString()} spent</span>
                <span className="mono text-sm text-muted-foreground">${(requirementDollars - progressDollars).toLocaleString()} remaining</span>
              </div>
              <div className="h-[3px] overflow-hidden bg-border">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              {bonusDaysRemaining !== null && (
                <p className="mono text-xs text-muted-foreground">
                  {bonusWeeksRemaining !== null && bonusWeeksRemaining > 0
                    ? `${bonusWeeksRemaining} week${bonusWeeksRemaining !== 1 ? "s" : ""} left`
                    : bonusDaysRemaining > 0
                      ? `${bonusDaysRemaining} day${bonusDaysRemaining !== 1 ? "s" : ""} left`
                      : "Due today"}
                  {dailySpendNeeded !== null && ` · ~$${dailySpendNeeded}/day`}
                </p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              {!showSpendForm ? (
                <div>
                  <span className="text-sm font-medium">Log a Purchase</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Track your progress toward the spending requirement</p>
                  <Button variant="outline" className="mt-3" onClick={() => setShowSpendForm(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Log Purchase
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <SpendUpdateForm cardId={userCard.id} currentCents={progressCents} />
                  <Button variant="ghost" size="sm" onClick={() => setShowSpendForm(false)} className="text-xs">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Bonus met — celebration */}
        {userCard.signup_bonus_met && !userCard.signup_bonus_earned && (
          <>
            <div className="h-[3px] overflow-hidden bg-border mt-6">
              <div className="h-full w-full bg-success" />
            </div>
            <div className="flex items-start gap-3 mt-4">
              <span className="material-symbols-outlined text-success text-2xl">emoji_events</span>
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.01em]">
                  You did it!
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="mono">{(userCard.signup_bonus_points ?? 0).toLocaleString()}</span> points are on the way.
                  Typically posts within 1–2 statement cycles.
                </p>
              </div>
            </div>
            {hasTransferPartners && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  document.getElementById("travel-section")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Start planning where to use your points
              </Button>
            )}
          </>
        )}

        {/* Bonus earned — permanent */}
        {userCard.signup_bonus_earned && (
          <div className="flex items-start gap-3 mt-6">
            <span className="material-symbols-outlined text-success text-2xl">emoji_events</span>
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.01em]">
                <span className="mono">{(userCard.signup_bonus_points ?? 0).toLocaleString()}</span> bonus points earned
              </h2>
              {catalogCard.portal_cpp > 0 && (userCard.signup_bonus_points ?? 0) > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Worth ~<span className="mono">${Math.round((userCard.signup_bonus_points ?? 0) * catalogCard.portal_cpp / 100).toLocaleString()}</span> through the travel portal
                </p>
              )}
            </div>
          </div>
        )}

        {/* No bonus data */}
        {!hasActiveBonus && !userCard.signup_bonus_met && !userCard.signup_bonus_earned && (
          <div className="flex items-baseline justify-between">
            <div>
              <span className="label-signal text-muted-foreground block mb-2">Signup Bonus</span>
              <p className="text-sm text-muted-foreground">No active signup bonus</p>
            </div>
          </div>
        )}
      </section>

      {/* Payment section moved to Card Management below */}

      {/* ═══════ TWO-COLUMN: Earning Velocity (left) | Card Benefits (right) ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] mt-10">
        {/* LEFT: Earning Velocity */}
        <div className="pr-0 lg:pr-8 pb-10">
          <div className="flex items-center justify-between mb-5">
            <span className="text-lg font-semibold tracking-[-0.01em]">Earning Velocity</span>
            <span className="mono text-[10px] text-muted-foreground">EARN RATE BY CATEGORY</span>
          </div>

          {/* Portal rate featured row */}
          {catalogCard.portal_cpp > 0 && (
            <div className="flex items-center justify-between py-2.5 border-b border-border mb-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">travel_explore</span>
                <div>
                  <span className="text-[15px] font-medium">{ISSUER_PORTAL_NAMES[userCard.issuer] ?? "Travel Portal"}</span>
                  <span className="mono text-[13px] text-primary"> · {catalogCard.portal_cpp / 100}x</span>
                </div>
              </div>
            </div>
          )}

          {/* Category rows — matching dashboard optimizer format */}
          {(() => {
            const MATERIAL_ICONS: Record<string, string> = {
              dining: "restaurant",
              travel: "flight",
              flights: "flight",
              hotels: "hotel",
              groceries: "shopping_cart",
              online_groceries: "shopping_cart",
              gas: "local_gas_station",
              streaming: "subscriptions",
              transit: "directions_bus",
              online_shopping: "shopping_bag",
              car_rentals: "directions_car",
            };

            return (
              <div>
                {earningRates
                  .filter(([cat]) => cat !== "other" && cat !== "brand_portal" && cat !== "brand_property")
                  .map(([category, rate]) => {
                    const iconName = MATERIAL_ICONS[category] ?? "category";
                    const isBonusRate = rate > 1;
                    return (
                      <div key={category} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-muted-foreground text-xl">{iconName}</span>
                          <span className="text-[15px]">{getCategoryDisplay(category, userCard.issuer)}</span>
                        </div>
                        <span className={`mono text-[13px] ${isBonusRate ? "text-primary" : "text-muted-foreground"}`}>
                          {rate}x {userCard.currency.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                {/* Everything else */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-muted-foreground text-xl">more_horiz</span>
                    <span className="text-[15px]">Everything else</span>
                  </div>
                  <span className="mono text-[13px] text-muted-foreground">
                    {baseRate}x {userCard.currency.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })()}

          {!isBeginner && catalogCard.earning_caps.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-3">
              {catalogCard.earning_caps
                .map(
                  (cap) =>
                    `${cap.category}: up to $${(cap.limit_cents / 100).toLocaleString()}/${cap.period}`,
                )
                .join(" · ")}
            </p>
          )}
        </div>

        {/* RIGHT: Card Benefits */}
        <div className="pl-0 lg:pl-8 lg:border-l border-border">
          <CardBenefitsSection
            catalogCard={catalogCard}
            creditUsage={creditUsage}
            perkSetup={perkSetup}
          />
        </div>
      </div>

      {/* ═══════ TRAVEL WITH YOUR POINTS ═══════ */}
      {hasTransferPartners && (
        <div id="travel-section">
        <TravelWithPointsSection
          currency={userCard.currency}
          transferPartners={transferPartners!}
        />
        </div>
      )}

      {/* ═══════ CARD MANAGEMENT ═══════ */}
      <section className="pb-10" ref={settingsRef}>
        <span className="label-signal text-muted-foreground block mb-6">Card Management</span>

        <div className="space-y-px bg-border">
          {/* Payment Info (always visible) */}
          {paymentInfo && nextPaymentDate && (
            <div className="bg-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-muted-foreground text-xl">credit_card</span>
                <div>
                  <span className="text-sm font-medium">Payment Due</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {nextPaymentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {paymentInfo.autopay_enabled ? " · Autopay on" : ""}
                  </p>
                </div>
              </div>
              {paymentDaysUntil != null && paymentDaysUntil > 0 && (
                <span className="mono text-[10px] font-semibold text-primary">{paymentDaysUntil} days</span>
              )}
            </div>
          )}

          {/* Annual Fee */}
          <SettingsRow
              icon={Calendar}
              label={
                userCard.annual_fee_date
                  ? `Annual Fee ${new Date(userCard.annual_fee_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                  : "Annual Fee"
              }
              isOpen={settingsTab === "af"}
              onToggle={() =>
                setSettingsTab(settingsTab === "af" ? null : "af")
              }
            >
              <AnnualFeeSection
                userCard={userCard}
                annualFeeDollars={annualFeeDollars}
                daysRemaining={afDaysRemaining ?? 999}
                creditUsage={creditUsage}
                catalogCard={catalogCard}
                perkSetup={perkSetup}
                lifecycleEvents={lifecycleEvents}
              />
            </SettingsRow>

            {/* Retention Call Log */}
            <SettingsRow
              icon={Phone}
              label="Retention Call Log"
              isOpen={settingsTab === "retention"}
              onToggle={() =>
                setSettingsTab(
                  settingsTab === "retention" ? null : "retention",
                )
              }
            >
              <RetentionCallLog
                userCardId={userCard.id}
                retentionEvents={lifecycleEvents.filter(
                  (e) =>
                    e.event_type === "retention_offer" ||
                    e.event_type === "retention_declined",
                )}
              />
            </SettingsRow>

            {/* Card Timeline */}
            <SettingsRow
              icon={History}
              label="Card Timeline"
              isOpen={settingsTab === "timeline"}
              onToggle={() =>
                setSettingsTab(
                  settingsTab === "timeline" ? null : "timeline",
                )
              }
            >
              <LifecycleTimeline
                userCardId={userCard.id}
                events={lifecycleEvents}
              />
            </SettingsRow>

            {/* Payment Tracking */}
          <SettingsRow
              icon={CreditCard}
              label="Payment Tracking"
              isOpen={settingsTab === "payment"}
              onToggle={() =>
                setSettingsTab(
                  settingsTab === "payment" ? null : "payment",
                )
              }
            >
              <PaymentTracker
                paymentInfo={paymentInfo}
                catalogPaymentInfo={catalogCard.payment_info ?? null}
                userCardId={userCard.id}
                cardSlug={userCard.card_slug}
              />
            </SettingsRow>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Settings Row
// ═══════════════════════════════════════════════════

function SettingsRow({
  icon: Icon,
  label,
  subtitle,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  badge?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <span className="text-sm font-medium">{label}</span>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {badge}
          <span className="material-symbols-outlined text-muted-foreground/30 text-lg">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <div className="border-t pt-5">{children}</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Retention Call Log
// ═══════════════════════════════════════════════════

type RetentionActionState = { success?: boolean; error?: { message: string; isRetryable: boolean; category: string } | null };

function RetentionCallLog({
  userCardId,
  retentionEvents,
}: {
  userCardId: string;
  retentionEvents: CardLifecycleEvent[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, isPending] = useActionState<
    RetentionActionState,
    FormData
  >(
    async (_prev, formData) => {
      const result = await logAnnualFeeEvent(formData);
      if (result.success) setShowForm(false);
      return result;
    },
    {},
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Past Retention Calls</h3>
        {!showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Log Call
          </Button>
        )}
      </div>

      {showForm && (
        <form action={formAction} className="space-y-3 rounded-md border p-3">
          <input type="hidden" name="user_card_id" value={userCardId} />
          <Select name="event_type" defaultValue="retention_offer">
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retention_offer">Received offer</SelectItem>
              <SelectItem value="retention_declined">
                No offer / declined
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            name="retention_offer_type"
            placeholder="Offer type (e.g. statement_credit)"
            className="h-8 text-sm"
          />
          <Input
            name="retention_offer_value"
            placeholder="Offer value (e.g. $150 credit)"
            className="h-8 text-sm"
          />
          <Textarea
            name="notes"
            placeholder="Notes..."
            className="min-h-[60px] text-sm"
          />
          {state.error && (
            <p className="text-xs text-destructive">{state.error.message}</p>
          )}
          {state.success && (
            <p className="text-xs text-green-600">Logged</p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      )}

      {retentionEvents.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No retention calls logged yet
        </p>
      ) : (
        <div className="space-y-3">
          {retentionEvents.map((event) => (
            <div key={event.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {event.event_type === "retention_offer"
                    ? "Received offer"
                    : "No offer / declined"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.event_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {event.retention_offer_value && (
                <p className="mt-1 text-muted-foreground">
                  {event.retention_offer_type}: {event.retention_offer_value}
                  {event.retention_spend_requirement &&
                    ` (requires ${event.retention_spend_requirement})`}
                </p>
              )}
              {event.notes && (
                <p className="mt-1 text-muted-foreground">{event.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Annual Fee Section (settings panel)
// ═══════════════════════════════════════════════════

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
  const [showDecisionHelper, setShowDecisionHelper] = useState(false);
  const hasDecisionData = !!(
    catalogCard.downgrade_options?.length || catalogCard.retention_data
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          ${annualFeeDollars} · Next:{" "}
          {userCard.annual_fee_date
            ? new Date(userCard.annual_fee_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Not set"}
        </p>
        {daysRemaining <= 14 ? (
          <Badge variant="destructive">
            {formatDaysRemaining(daysRemaining)}
          </Badge>
        ) : daysRemaining <= 30 ? (
          <Badge variant="secondary">
            {formatDaysRemaining(daysRemaining)}
          </Badge>
        ) : daysRemaining < 999 ? (
          <span className="text-xs text-muted-foreground">
            {formatDaysRemaining(daysRemaining)}
          </span>
        ) : null}
      </div>

      {/* AF Offset Calculator */}
      {creditUsage.length > 0 && (
        <AnnualFeeOffset
          annualFeeDollars={annualFeeDollars}
          credits={creditUsage}
        />
      )}

      {/* AF Decision Helper */}
      {hasDecisionData && !showDecisionHelper && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowDecisionHelper(true)}
        >
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
    creditSums[c.credit_name] =
      (creditSums[c.credit_name] ?? 0) + c.amount_used_cents;
  }

  const totalUsedCents = Object.values(creditSums).reduce((a, b) => a + b, 0);
  const totalUsedDollars = totalUsedCents / 100;
  const effectiveCost = annualFeeDollars - totalUsedDollars;

  if (totalUsedCents === 0) return null;

  return (
    <div className="space-y-1.5 rounded-md bg-muted/50 p-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Annual Fee</span>
        <span>${annualFeeDollars}</span>
      </div>
      {Object.entries(creditSums)
        .filter(([, cents]) => cents > 0)
        .map(([name, cents]) => (
          <div
            key={name}
            className="flex justify-between text-muted-foreground"
          >
            <span className="pl-2">{name} used</span>
            <span>-${(cents / 100).toFixed(0)}</span>
          </div>
        ))}
      <div className="flex justify-between border-t pt-1.5 font-medium">
        <span>Effective cost</span>
        <span
          className={effectiveCost <= 0 ? "text-green-600" : "text-amber-600"}
        >
          {effectiveCost <= 0
            ? `-$${Math.abs(effectiveCost).toFixed(0)}`
            : `$${effectiveCost.toFixed(0)}`}
        </span>
      </div>
      {effectiveCost <= 0 && (
        <p className="text-xs text-green-600">
          You&apos;re ahead on this card
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Lifecycle Timeline
// ═══════════════════════════════════════════════════

const EVENT_CONFIG: Record<
  LifecycleEventType,
  { label: string; icon: typeof CreditCard; color: string }
> = {
  opened: { label: "Card Opened", icon: CreditCard, color: "text-green-600" },
  product_change: {
    label: "Product Change",
    icon: ArrowUpDown,
    color: "text-blue-600",
  },
  downgrade: {
    label: "Downgraded",
    icon: ArrowDown,
    color: "text-orange-500",
  },
  upgrade: { label: "Upgraded", icon: ArrowUp, color: "text-info" },
  cancelled: { label: "Cancelled", icon: Ban, color: "text-red-600" },
  retention_offer: {
    label: "Retention Offer",
    icon: Phone,
    color: "text-green-600",
  },
  retention_declined: {
    label: "Retention Declined",
    icon: Phone,
    color: "text-orange-500",
  },
  annual_fee_posted: {
    label: "AF Posted",
    icon: DollarSign,
    color: "text-red-500",
  },
  annual_fee_waived: {
    label: "AF Waived",
    icon: DollarSign,
    color: "text-green-600",
  },
  signup_bonus_met: {
    label: "Bonus Spend Met",
    icon: Trophy,
    color: "text-amber-500",
  },
  signup_bonus_earned: {
    label: "Bonus Earned",
    icon: Trophy,
    color: "text-green-600",
  },
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

type TimelineActionState = { success?: boolean; error?: { message: string; isRetryable: boolean; category: string } | null };

function LifecycleTimeline({
  userCardId,
  events,
}: {
  userCardId: string;
  events: CardLifecycleEvent[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] =
    useState<LifecycleEventType>("annual_fee_posted");
  const [state, formAction, isPending] = useActionState<
    TimelineActionState,
    FormData
  >(
    async (_prev, formData) => {
      const result = await logLifecycleEvent(formData);
      if (result.success) setShowForm(false);
      return result;
    },
    {},
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
                onValueChange={(v) =>
                  setEventType(v as LifecycleEventType)
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opened">Opened</SelectItem>
                  <SelectItem value="annual_fee_posted">AF Posted</SelectItem>
                  <SelectItem value="annual_fee_waived">AF Waived</SelectItem>
                  <SelectItem value="retention_offer">
                    Retention Offer
                  </SelectItem>
                  <SelectItem value="retention_declined">
                    Retention Declined
                  </SelectItem>
                  <SelectItem value="signup_bonus_met">
                    Bonus Spend Met
                  </SelectItem>
                  <SelectItem value="signup_bonus_earned">
                    Bonus Earned
                  </SelectItem>
                  <SelectItem value="product_change">
                    Product Change
                  </SelectItem>
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
              <Input
                name="retention_offer_type"
                placeholder="Offer type (e.g. statement_credit)"
                className="h-8 text-sm"
              />
              <Input
                name="retention_offer_value"
                placeholder="Value (e.g. $150 credit)"
                className="h-8 text-sm"
              />
              <Input
                name="retention_spend_requirement"
                placeholder="Spend req (e.g. $2k in 3mo)"
                className="h-8 text-sm sm:col-span-2"
              />
            </div>
          )}

          {showProductFields && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                name="from_card_slug"
                placeholder="From card slug"
                className="h-8 text-sm"
              />
              <Input
                name="to_card_slug"
                placeholder="To card slug"
                className="h-8 text-sm"
              />
            </div>
          )}

          <Textarea
            name="notes"
            placeholder="Notes (optional)"
            className="min-h-[50px] text-sm"
          />

          {state.error && (
            <p className="text-xs text-destructive">{state.error.message}</p>
          )}
          {state.success && (
            <p className="text-xs text-green-600">Event logged</p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
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
              label: event.event_type,
              icon: CreditCard,
              color: "text-muted-foreground",
            };
            const Icon = config.icon;
            return (
              <div key={event.id} className="relative pb-6 last:pb-0">
                <div
                  className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border bg-background ${config.color}`}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {event.retention_offer_value && (
                    <p className="text-xs text-muted-foreground">
                      {event.retention_offer_type}:{" "}
                      {event.retention_offer_value}
                      {event.retention_spend_requirement &&
                        ` (requires ${event.retention_spend_requirement})`}
                    </p>
                  )}
                  {event.from_card_slug && event.to_card_slug && (
                    <p className="text-xs text-muted-foreground">
                      {event.from_card_slug} → {event.to_card_slug}
                    </p>
                  )}
                  {event.notes && (
                    <p className="text-xs text-muted-foreground">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
