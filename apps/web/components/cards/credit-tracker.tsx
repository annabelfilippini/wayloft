"use client";

import { useState, useActionState } from "react";
import type { UserCreditUsage } from "@wayloft/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { markCreditUsed, enrollCredit } from "@/app/actions/cards";

interface CreditTrackerProps {
  credits: UserCreditUsage[];
}

const PERIOD_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  card_year: "Card Year",
};

const PERIOD_ORDER: Record<string, number> = {
  monthly: 0,
  quarterly: 1,
  semi_annual: 2,
  annual: 3,
  card_year: 4,
};

function groupByPeriod(credits: UserCreditUsage[]) {
  const groups: Record<string, UserCreditUsage[]> = {};
  for (const c of credits) {
    if (!groups[c.period]) groups[c.period] = [];
    groups[c.period].push(c);
  }
  return Object.entries(groups).sort(
    ([a], [b]) => (PERIOD_ORDER[a] ?? 9) - (PERIOD_ORDER[b] ?? 9)
  );
}

export function CreditTracker({ credits }: CreditTrackerProps) {
  if (credits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-sm text-muted-foreground">No statement credits for this card.</p>
      </div>
    );
  }

  const groups = groupByPeriod(credits);

  return (
    <div className="space-y-6">
      {groups.map(([period, periodCredits]) => (
        <div key={period}>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {PERIOD_LABELS[period] ?? period}
          </h4>
          <div className="space-y-3">
            {periodCredits.map((credit) => (
              <CreditRow key={credit.id} credit={credit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CreditRow({ credit }: { credit: UserCreditUsage }) {
  const [showPartial, setShowPartial] = useState(false);

  const amountDollars = credit.credit_amount_cents / 100;
  const usedDollars = credit.amount_used_cents / 100;
  const remainingDollars = amountDollars - usedDollars;
  const progressPct = amountDollars > 0 ? (usedDollars / amountDollars) * 100 : 0;

  const daysLeft = Math.ceil(
    (new Date(credit.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const periodLabel = PERIOD_LABELS[credit.period]?.toLowerCase() ?? credit.period;
  const amountLabel = credit.period === "monthly"
    ? `$${amountDollars}/mo`
    : credit.period === "quarterly"
      ? `$${amountDollars}/qtr`
      : `$${amountDollars}/yr`;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {amountLabel} {credit.credit_name}
          </p>
        </div>
        <StatusBadge credit={credit} daysLeft={daysLeft} />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <Progress value={progressPct} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>${usedDollars.toFixed(0)} used</span>
          <span>${remainingDollars.toFixed(0)} remaining</span>
        </div>
      </div>

      {/* Enrollment warning */}
      {credit.enrollment_required && !credit.enrolled && (
        <EnrollButton creditId={credit.id} />
      )}

      {/* Mark as used actions */}
      {credit.status !== "used" && credit.status !== "expired" && (
        <div className="flex items-center gap-2">
          <MarkUsedButton creditId={credit.id} />
          {!showPartial ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setShowPartial(true)}
            >
              Partial
            </Button>
          ) : (
            <PartialForm creditId={credit.id} onDone={() => setShowPartial(false)} />
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ credit, daysLeft }: { credit: UserCreditUsage; daysLeft: number }) {
  if (credit.status === "used") {
    return <Badge className="bg-green-100 text-green-800 border-0 dark:bg-green-900/30 dark:text-green-300">Used</Badge>;
  }
  if (credit.status === "expired") {
    return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
  }
  if (credit.status === "partial") {
    const remaining = (credit.credit_amount_cents - credit.amount_used_cents) / 100;
    if (daysLeft <= 14) {
      return <Badge variant="destructive">${remaining} left · {daysLeft}d</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-800 border-0 dark:bg-amber-900/30 dark:text-amber-300">${remaining} left</Badge>;
  }
  // available
  if (daysLeft <= 14) {
    return <Badge variant="destructive">Expiring in {daysLeft}d</Badge>;
  }
  if (daysLeft <= 30) {
    return <Badge className="bg-amber-100 text-amber-800 border-0 dark:bg-amber-900/30 dark:text-amber-300">{daysLeft}d left</Badge>;
  }
  return <Badge variant="outline">{daysLeft}d left</Badge>;
}

type ActionState = { success?: boolean; error?: { message: string; isRetryable: boolean; category: string } | null };

function MarkUsedButton({ creditId }: { creditId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => markCreditUsed(formData),
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="credit_id" value={creditId} />
      <Button type="submit" size="sm" variant="outline" className="text-xs" disabled={isPending}>
        {isPending ? "Saving..." : "Mark used"}
      </Button>
      {state.error && <p className="text-xs text-destructive mt-1">{state.error.message}</p>}
    </form>
  );
}

function PartialForm({ creditId, onDone }: { creditId: string; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await markCreditUsed(formData);
      if (result.success) onDone();
      return result;
    },
    {}
  );

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="credit_id" value={creditId} />
      <span className="text-xs text-muted-foreground">$</span>
      <Input
        name="amount"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0"
        className="h-7 w-20 text-xs"
      />
      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs" disabled={isPending}>
        {isPending ? "..." : "Add"}
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onDone}>
        Cancel
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error.message}</p>}
    </form>
  );
}

function EnrollButton({ creditId }: { creditId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => enrollCredit(formData),
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="credit_id" value={creditId} />
      <Button
        type="submit"
        size="sm"
        className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 border-0 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
        disabled={isPending}
      >
        {isPending ? "Enrolling..." : "Enroll to activate"}
      </Button>
      {state.error && <p className="text-xs text-destructive mt-1">{state.error.message}</p>}
    </form>
  );
}
