"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSpendProgress } from "@/app/actions/cards";

interface SpendUpdateFormProps {
  cardId: string;
  currentCents: number;
}

type ActionState = { error?: string; success?: boolean };

export function SpendUpdateForm({ cardId, currentCents }: SpendUpdateFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      return updateSpendProgress(formData);
    },
    { error: undefined, success: undefined }
  );

  const currentDollars = (currentCents / 100).toFixed(0);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="card_id" value={cardId} />
      <div className="relative flex-1">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          name="amount"
          type="number"
          min="0"
          step="1"
          defaultValue={currentDollars}
          placeholder="0"
          className="pl-6 text-sm"
        />
      </div>
      <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
        {isPending ? "..." : "Update"}
      </Button>
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </form>
  );
}
