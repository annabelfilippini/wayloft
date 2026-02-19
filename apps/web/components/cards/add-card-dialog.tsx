"use client";

import { useState, useActionState } from "react";
import type { CatalogCard } from "@wayloft/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addCard } from "@/app/actions/cards";
import { CardPickerSearch } from "./card-picker-search";

interface AddCardDialogProps {
  catalog: CatalogCard[];
}

type ActionState = { error?: string; success?: boolean };

export function AddCardDialog({ catalog }: AddCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogCard | null>(null);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await addCard(formData);
      if (result.success) {
        setOpen(false);
        setSelected(null);
      }
      return result;
    },
    { error: undefined, success: undefined }
  );

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelected(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selected ? selected.name : "Add a Credit Card"}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? "Confirm details and add to your portfolio."
              : "Search and select a card from the catalog."}
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <CardPickerSearch catalog={catalog} onSelect={setSelected} />
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="card_slug" value={selected.slug} />

            <div className="space-y-2">
              <label htmlFor="card_since" className="text-sm font-medium">
                When did you open this card?
              </label>
              <Input
                id="card_since"
                name="card_since"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate your signup bonus deadline and annual fee date.
              </p>
            </div>

            <div className="rounded-md border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signup bonus</span>
                <span className="font-medium">
                  {selected.signup_bonus.points.toLocaleString()} {selected.currency}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Spend requirement</span>
                <span className="font-medium">
                  ${(selected.signup_bonus.spend_requirement_cents / 100).toLocaleString()} in{" "}
                  {selected.signup_bonus.timeframe_months} months
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Annual fee</span>
                <span className="font-medium">
                  {selected.annual_fee_cents > 0
                    ? `$${selected.annual_fee_cents / 100}`
                    : "None"}
                </span>
              </div>
            </div>

            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSelected(null)}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "Adding..." : "Add Card"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
