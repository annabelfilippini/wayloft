"use client";

import { useActionState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeCard } from "@/app/actions/cards";

interface CardActionsMenuProps {
  cardId: string;
  cardName: string;
}

type ActionState = { error?: string; success?: boolean };

export function CardActionsMenu({ cardId, cardName }: CardActionsMenuProps) {
  const [, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      return removeCard(formData);
    },
    { error: undefined, success: undefined }
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-black/20 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Actions for {cardName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <form action={formAction}>
            <input type="hidden" name="card_id" value={cardId} />
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center gap-2 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {isPending ? "Removing..." : "Remove card"}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
