"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CreditCard, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddCardDialog } from "./add-card-dialog";
import type { CatalogCard } from "@wayloft/shared";

interface AddCardDropdownProps {
  catalog: CatalogCard[];
}

export function AddCardDropdown({ catalog }: AddCardDropdownProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Add a card I have
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/recommend">
              <Compass className="mr-2 h-4 w-4" />
              Find a new card to get
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddCardDialog
        catalog={catalog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
