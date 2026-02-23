"use client";

import { useState, useActionState } from "react";
import type { UserCard, CatalogCard } from "@wayloft/shared";
import { ArrowLeft, Plane, Building2, Clock, CreditCard, Phone } from "lucide-react";
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
import { logAnnualFeeEvent } from "@/app/actions/cards";

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
}: CardDetailProps) {
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
            <Badge variant="secondary">{userCard.currency}</Badge>
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
                <Badge key={tag} variant="secondary" className="text-xs">
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
            />
          )}
        </div>
      </div>

      <Separator />

      {/* Tabbed sections */}
      <Tabs defaultValue="earning">
        <TabsList>
          <TabsTrigger value="earning">Earning</TabsTrigger>
          <TabsTrigger value="perks">Perks & Benefits</TabsTrigger>
          <TabsTrigger value="transfer">Transfer Partners</TabsTrigger>
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

              {catalogCard.earning_caps.length > 0 && (
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

              {catalogCard.portal_cpp > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Portal redemption value
                    </span>
                    <span className="font-medium">
                      {catalogCard.portal_cpp}&cent; per point
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perks Tab */}
        <TabsContent value="perks">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-sm font-semibold">Key Perks</h3>
              {catalogCard.key_perks.length > 0 ? (
                <ul className="space-y-3">
                  {catalogCard.key_perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-3 text-sm"
                    >
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No key perks listed for this card.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
      </Tabs>
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
}: {
  userCard: UserCard;
  annualFeeDollars: number;
  daysRemaining: number;
  perks: string[];
}) {
  const [showRetentionForm, setShowRetentionForm] = useState(false);
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

        {/* Your options */}
        {daysRemaining <= 60 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Your options
            </p>
            <div className="space-y-1.5 text-sm">
              {perks.length > 0 && (
                <p>
                  <span className="font-medium">Keep:</span>{" "}
                  <span className="text-muted-foreground">
                    {perks.slice(0, 3).join(", ")}
                    {perks.length > 3 ? ` +${perks.length - 3} more` : ""}
                  </span>
                </p>
              )}
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Call:</span>{" "}
                Ask for a retention offer before the AF posts
              </p>
            </div>
          </div>
        )}

        {/* Retention offer CTA */}
        {!showRetentionForm ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRetentionForm(true)}
            className="gap-2"
          >
            <Phone className="h-3.5 w-3.5" />
            Log retention offer
          </Button>
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
