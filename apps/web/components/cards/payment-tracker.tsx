"use client";

import { useState, useActionState } from "react";
import type { UserPaymentInfo, CatalogPaymentInfo, AutopayType } from "@wayloft/shared";
import { CalendarClock, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPaymentInfo, updatePaymentInfo, deletePaymentInfo } from "@/app/actions/cards";

interface PaymentTrackerProps {
  paymentInfo: UserPaymentInfo | null;
  catalogPaymentInfo: CatalogPaymentInfo | null;
  userCardId: string;
  cardSlug: string;
}

type ActionState = { success?: boolean; error?: { message: string; isRetryable: boolean; category: string } | null };

function getNextDueDate(dueDay: number): Date {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (now.getDate() < dueDay) {
    return thisMonth;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
}

function formatDueDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDaysUntilDue(dueDay: number): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextDue = getNextDueDate(dueDay);
  return Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const AUTOPAY_LABELS: Record<AutopayType, string> = {
  full_balance: "Full balance",
  minimum: "Minimum payment",
  fixed_amount: "Fixed amount",
  none: "None",
};

export function PaymentTracker({
  paymentInfo,
  catalogPaymentInfo,
  userCardId,
  cardSlug,
}: PaymentTrackerProps) {
  const [editing, setEditing] = useState(false);

  if (!paymentInfo) {
    return (
      <PaymentForm
        mode="add"
        userCardId={userCardId}
        cardSlug={cardSlug}
        catalogPaymentInfo={catalogPaymentInfo}
      />
    );
  }

  if (editing) {
    return (
      <PaymentForm
        mode="edit"
        paymentInfo={paymentInfo}
        userCardId={userCardId}
        cardSlug={cardSlug}
        catalogPaymentInfo={catalogPaymentInfo}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <PaymentDisplay
      paymentInfo={paymentInfo}
      catalogPaymentInfo={catalogPaymentInfo}
      onEdit={() => setEditing(true)}
    />
  );
}

// ── Display State ──

function PaymentDisplay({
  paymentInfo,
  catalogPaymentInfo,
  onEdit,
}: {
  paymentInfo: UserPaymentInfo;
  catalogPaymentInfo: CatalogPaymentInfo | null;
  onEdit: () => void;
}) {
  const [deleteState, deleteAction, isDeleting] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      return await deletePaymentInfo(formData);
    },
    {}
  );

  const daysUntil = getDaysUntilDue(paymentInfo.due_day);
  const nextDue = getNextDueDate(paymentInfo.due_day);

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Payment Due Date</p>
            <p className="text-xs text-muted-foreground">
              {ordinal(paymentInfo.due_day)} of each month &middot; Next: {formatDueDate(nextDue)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {daysUntil <= 3 && !paymentInfo.autopay_enabled ? (
              <Badge variant="destructive">{daysUntil}d</Badge>
            ) : daysUntil <= 7 && !paymentInfo.autopay_enabled ? (
              <Badge variant="secondary">{daysUntil}d</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">{daysUntil}d</span>
            )}
          </div>
        </div>

        {/* Autopay status */}
        <div className="flex items-center gap-2">
          {paymentInfo.autopay_enabled ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0">
              Autopay: {AUTOPAY_LABELS[paymentInfo.autopay_type]}
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0">
              No autopay
            </Badge>
          )}
        </div>

        {/* Autopay setup link */}
        {!paymentInfo.autopay_enabled && catalogPaymentInfo?.autopay_url && (
          <a
            href={catalogPaymentInfo.autopay_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Set up autopay
          </a>
        )}

        {/* Late fee warning */}
        {catalogPaymentInfo && catalogPaymentInfo.late_fee_cents > 0 && !paymentInfo.autopay_enabled && (
          <p className="text-xs text-muted-foreground">
            Late fee: ${(catalogPaymentInfo.late_fee_cents / 100).toFixed(0)}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          <form action={deleteAction}>
            <input type="hidden" name="payment_info_id" value={paymentInfo.id} />
            <button
              type="submit"
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              {isDeleting ? "Removing..." : "Remove"}
            </button>
          </form>
        </div>
        {deleteState.error && (
          <p className="text-xs text-destructive">{deleteState.error.message}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Form (Add / Edit) ──

function PaymentForm({
  mode,
  paymentInfo,
  userCardId,
  cardSlug,
  catalogPaymentInfo,
  onCancel,
}: {
  mode: "add" | "edit";
  paymentInfo?: UserPaymentInfo;
  userCardId: string;
  cardSlug: string;
  catalogPaymentInfo: CatalogPaymentInfo | null;
  onCancel?: () => void;
}) {
  const [autopayEnabled, setAutopayEnabled] = useState(paymentInfo?.autopay_enabled ?? false);

  const serverAction = mode === "add" ? addPaymentInfo : updatePaymentInfo;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await serverAction(formData);
      if (result.success && onCancel) onCancel();
      return result;
    },
    {}
  );

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">
            {mode === "add" ? "Track your payment due date" : "Edit payment info"}
          </p>
        </div>

        <form action={formAction} className="space-y-3">
          {mode === "add" && (
            <>
              <input type="hidden" name="user_card_id" value={userCardId} />
              <input type="hidden" name="card_slug" value={cardSlug} />
            </>
          )}
          {mode === "edit" && paymentInfo && (
            <input type="hidden" name="payment_info_id" value={paymentInfo.id} />
          )}
          <input type="hidden" name="autopay_enabled" value={autopayEnabled ? "true" : "false"} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Due day of month</label>
            <Input
              name="due_day"
              type="number"
              min={1}
              max={28}
              defaultValue={paymentInfo?.due_day ?? ""}
              placeholder="e.g. 15"
              className="h-8 text-sm"
              required={mode === "add"}
            />
            <p className="text-xs text-muted-foreground">1-28 only (avoids February edge cases)</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Autopay enabled</label>
            <Switch
              checked={autopayEnabled}
              onCheckedChange={setAutopayEnabled}
            />
          </div>

          {autopayEnabled && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Autopay type</label>
              <Select
                name="autopay_type"
                defaultValue={paymentInfo?.autopay_type ?? "full_balance"}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_balance">Full balance</SelectItem>
                  <SelectItem value="minimum">Minimum payment</SelectItem>
                  <SelectItem value="fixed_amount">Fixed amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!autopayEnabled && catalogPaymentInfo?.autopay_url && (
            <a
              href={catalogPaymentInfo.autopay_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Set up autopay with your issuer
            </a>
          )}

          {state.error && (
            <p className="text-xs text-destructive">{state.error.message}</p>
          )}

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : mode === "add" ? "Save" : "Update"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
