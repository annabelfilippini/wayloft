"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSpendProgress } from "@/app/actions/cards";

interface SpendUpdateFormProps {
  cardId: string;
  currentCents: number;
}

type ActionState = { success?: boolean; error?: { message: string; isRetryable: boolean; category: string } | null };

const QUICK_INCREMENTS = [500, 1000, 2000];

export function SpendUpdateForm({ cardId, currentCents }: SpendUpdateFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      return updateSpendProgress(formData);
    },
    { error: undefined, success: undefined }
  );

  const currentDollars = Math.round(currentCents / 100);

  function handleQuickAdd(amount: number) {
    const form = new FormData();
    form.set("card_id", cardId);
    form.set("increment", String(amount));
    formAction(form);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Quick add</span>
        {QUICK_INCREMENTS.map((amt) => (
          <Button
            key={amt}
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs font-mono tabular-nums"
            disabled={isPending}
            onClick={() => handleQuickAdd(amt)}
          >
            +${amt.toLocaleString()}
          </Button>
        ))}
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="card_id" value={cardId} />
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
            $
          </span>
          <Input
            ref={inputRef}
            name="amount"
            type="number"
            min="0"
            step="1"
            defaultValue={currentDollars}
            placeholder="0"
            className="pl-6 text-sm font-mono tabular-nums"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
          {isPending ? "..." : "Update"}
        </Button>
      </form>
      {state.error && (
        <p className="text-xs text-destructive">{state.error.message}</p>
      )}
    </div>
  );
}
