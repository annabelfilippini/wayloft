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
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const earningRates = Object.entries(catalogCard.earning_rates).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/cards"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to cards
      </Link>

      {/* Header: Card art + key info */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <CardArtPlaceholder
          issuer={userCard.issuer}
          network={catalogCard.network}
          cardName={userCard.card_name}
          className="w-full"
        />

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{userCard.card_name}</h1>
            <p className="text-sm text-muted-foreground">
              {userCard.issuer.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{formatCurrencyName(userCard.currency, experienceLevel)}</Badge>
            <Badge variant="outline">{catalogCard.network.toUpperCase()}</Badge>
            <Badge variant="outline">
              {annualFeeDollars > 0 ? `$${annualFeeDollars}/yr` : "No AF"}
            </Badge>
            {catalogCard.credit_score_min && (
              <Badge variant="outline">
                {catalogCard.credit_score_min} credit
              </Badge>
            )}
            {!catalogCard.foreign_transaction_fee && (
              <Badge variant="outline">No FTF</Badge>
            )}
            {catalogCard.foreign_transaction_fee && (
              <Badge variant="destructive">Has FTF</Badge>
            )}
          </div>

          {/* best_for tags */}
          {catalogCard.best_for.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {catalogCard.best_for.map((tag) => (
                <Badge key={tag} className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Signup Bonus Section */}
          {hasActiveBonus && (
            <Card>
              <CardContent className="space-y-3 pt-4">
                <p className="text-sm font-medium">Signup Bonus Progress</p>
                <BonusProgress
                  progressCents={userCard.signup_spend_progress_cents}
                  requirementCents={userCard.signup_spend_requirement_cents!}
                  deadline={userCard.signup_spend_deadline}
                  bonusPoints={userCard.signup_bonus_points}
                />
                <SpendUpdateForm
                  cardId={userCard.id}
                  currentCents={userCard.signup_spend_progress_cents}
                />
              </CardContent>
            </Card>
          )}

          {userCard.signup_bonus_earned && (
            <Badge variant="secondary">Bonus earned</Badge>
          )}

          {userCard.signup_bonus_met && !userCard.signup_bonus_earned && (
            <Badge variant="secondary">Bonus met - awaiting posting</Badge>
          )}

          {/* Annual Fee Status */}
          {annualFeeDollars > 0 && afDaysRemaining !== null && (
            <AnnualFeeSection
              userCard={userCard}
              annualFeeDollars={annualFeeDollars}
              daysRemaining={afDaysRemaining}
              perks={catalogCard.key_perks}
              creditUsage={creditUsage}
              catalogCard={catalogCard}
              perkSetup={perkSetup}
              lifecycleEvents={lifecycleEvents}
            />
          )}

          {/* Payment Due Date Tracker */}
          <PaymentTracker
            paymentInfo={paymentInfo}
            catalogPaymentInfo={catalogCard.payment_info ?? null}
            userCardId={userCard.id}
            cardSlug={userCard.card_slug}
          />
        </div>
      </div>

      <Separator />

      {/* Tabbed sections */}
      <Tabs defaultValue="earning">
        <TabsList>
          <TabsTrigger value="earning">Earning</TabsTrigger>
          <TabsTrigger value="perks">Perks & Benefits</TabsTrigger>
          {creditUsage.length > 0 && (
            <TabsTrigger value="credits">Credits</TabsTrigger>
          )}
          <TabsTrigger value="transfer">Transfer Partners</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Earning Tab */}
        <TabsContent value="earning">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-sm font-semibold">Earning Rates</h3>
              <div className="space-y-2">
                {earningRates.map(([category, rate]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <span className="capitalize text-muted-foreground">
                      {category.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium">{rate}x</span>
                  </div>
                ))}
              </div>

              {!isBeginner && catalogCard.earning_caps.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <h3 className="mb-2 text-sm font-semibold">Earning Caps</h3>
                  <div className="space-y-1.5">
                    {catalogCard.earning_caps.map((cap) => (
                      <p
                        key={cap.category}
                        className="text-xs text-muted-foreground"
                      >
                        {cap.category}: up to $
                        {(cap.limit_cents / 100).toLocaleString()}/{cap.period}
                      </p>
                    ))}
                  </div>
                </>
              )}

              {catalogCard.portal_cpp > 0 && (() => {
                const issuerName = userCard.issuer === "chase" ? "Chase" : userCard.issuer === "amex" ? "Amex" : userCard.issuer === "citi" ? "Citi" : userCard.issuer === "capital_one" ? "Capital One" : userCard.issuer === "us_bank" ? "U.S. Bank" : userCard.issuer === "bilt" ? "Bilt" : userCard.issuer.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                return (
                  <>
                    <Separator className="my-4" />
                    {isBeginner ? (
                      <p className="text-sm text-muted-foreground">
                        Each point is worth {catalogCard.portal_cpp}&cent; when you book travel through {issuerName}
                      </p>
                    ) : (
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Travel portal value
                          </span>
                          <p className="text-xs text-muted-foreground/70">
                            Worth {catalogCard.portal_cpp}&cent; per point when booking through{" "}
                            {issuerName}&apos;s travel portal
                          </p>
                        </div>
                        <span className="font-medium shrink-0">
                          {catalogCard.portal_cpp}&cent;/pt
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perks Tab */}
        <TabsContent value="perks">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-sm font-semibold">Perks & Benefits</h3>
              <PerkChecklist perks={perkSetup} keyPerks={catalogCard.key_perks} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        {creditUsage.length > 0 && (
          <TabsContent value="credits">
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-4 text-sm font-semibold">Statement Credits</h3>
                <CreditTracker credits={creditUsage} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Transfer Partners Tab */}
        <TabsContent value="transfer">
          <Card>
            <CardContent className="pt-6">
              {transferPartners ? (
                <div className="space-y-6">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      {transferPartners.name}
                    </p>
                  </div>

                  {/* Airlines */}
                  {transferPartners.transfer_partners.airlines.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Plane className="h-4 w-4" />
                        Airlines
                      </h3>
                      <AllianceLegend airlines={transferPartners.transfer_partners.airlines} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        {transferPartners.transfer_partners.airlines.map(
                          (airline) => (
                            <div
                              key={airline.code}
                              className="flex items-center justify-between rounded-md border p-3 text-sm"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium">
                                  {airline.partner}
                                </p>
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
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hotels */}
                  {transferPartners.transfer_partners.hotels.length > 0 && (
                    <div>
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Building2 className="h-4 w-4" />
                        Hotels
                      </h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {transferPartners.transfer_partners.hotels.map(
                          (hotel) => (
                            <div
                              key={hotel.code}
                              className="flex items-center justify-between rounded-md border p-3 text-sm"
                            >
                              <div>
                                <p className="font-medium">{hotel.partner}</p>
                                {hotel.note && (
                                  <p className="text-xs text-muted-foreground">
                                    {hotel.note}
                                  </p>
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
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No transfer partners available for {userCard.currency} points.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <LifecycleTimeline
                userCardId={userCard.id}
                events={lifecycleEvents}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

      {/* Log Event Form */}
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
            <p className="text-xs text-destructive">{state.error}</p>
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

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
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
                      {event.retention_offer_type}: {event.retention_offer_value}
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
                    <p className="text-xs text-muted-foreground">{event.notes}</p>
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

// --- Annual Fee Offset Calculator ---

function AnnualFeeOffset({
  annualFeeDollars,
  credits,
}: {
  annualFeeDollars: number;
  credits: UserCreditUsage[];
}) {
  // Group credits by name, sum used amounts
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
          {effectiveCost <= 0 ? `-$${Math.abs(effectiveCost).toFixed(0)} ✓` : `$${effectiveCost.toFixed(0)}`}
        </span>
      </div>
      {effectiveCost <= 0 && (
        <p className="text-xs text-green-600">You&apos;re ahead on this card</p>
      )}
    </div>
  );
}

// --- Alliance Legend ---

const ALLIANCE_DESCRIPTIONS: Record<string, string> = {
  "Star Alliance": "26 airlines including United, Lufthansa, ANA, Air Canada, and Singapore",
  "oneworld": "13 airlines including American, British Airways, Cathay Pacific, and Qantas",
  "SkyTeam": "19 airlines including Delta, Air France/KLM, and Korean Air",
};

function AllianceLegend({ airlines }: { airlines: TransferPartnerEntry[] }) {
  const alliances = [...new Set(airlines.map((a) => a.alliance).filter(Boolean))] as string[];
  const relevant = alliances.filter((a) => a in ALLIANCE_DESCRIPTIONS);

  if (relevant.length === 0) return null;

  return (
    <div className="mb-3 space-y-1.5">
      {relevant.map((alliance) => (
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
  );
}

// --- Annual Fee Section with retention offer logging ---

type AFActionState = { error?: string; success?: boolean };

function AnnualFeeSection({
  userCard,
  annualFeeDollars,
  daysRemaining,
  perks,
  creditUsage,
  catalogCard,
  perkSetup,
  lifecycleEvents,
}: {
  userCard: UserCard;
  annualFeeDollars: number;
  daysRemaining: number;
  perks: string[];
  creditUsage: UserCreditUsage[];
  catalogCard: CatalogCard;
  perkSetup: UserPerkSetup[];
  lifecycleEvents: CardLifecycleEvent[];
}) {
  const [showRetentionForm, setShowRetentionForm] = useState(false);
  const [showDecisionHelper, setShowDecisionHelper] = useState(false);

  const hasDecisionData = !!(catalogCard.downgrade_options?.length || catalogCard.retention_data);
  const showDecisionCTA = hasDecisionData && daysRemaining <= 60;

  const [state, formAction, isPending] = useActionState<AFActionState, FormData>(
    async (_prev, formData) => {
      const result = await logAnnualFeeEvent(formData);
      if (result.success) setShowRetentionForm(false);
      return result;
    },
    {}
  );

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Annual Fee</p>
            <p className="text-xs text-muted-foreground">
              ${annualFeeDollars} &middot; Next:{" "}
              {new Date(userCard.annual_fee_date!).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          {daysRemaining <= 14 ? (
            <Badge variant="destructive">{formatDaysRemaining(daysRemaining)}</Badge>
          ) : daysRemaining <= 30 ? (
            <Badge variant="secondary">{formatDaysRemaining(daysRemaining)}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {formatDaysRemaining(daysRemaining)}
            </span>
          )}
        </div>

        {/* AF Offset Calculator */}
        {creditUsage.length > 0 && <AnnualFeeOffset annualFeeDollars={annualFeeDollars} credits={creditUsage} />}

        {/* AF Decision Helper */}
        {showDecisionCTA && !showDecisionHelper && (
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

        {/* Retention offer CTA */}
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
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retention_offer">Received offer</SelectItem>
                  <SelectItem value="retention_declined">No offer / declined</SelectItem>
                  <SelectItem value="annual_fee_posted">AF posted</SelectItem>
                  <SelectItem value="annual_fee_waived">AF waived</SelectItem>
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
            </div>
            {state.error && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
            {state.success && (
              <p className="text-xs text-green-600">Logged successfully</p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowRetentionForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
