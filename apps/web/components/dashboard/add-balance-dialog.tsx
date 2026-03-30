"use client";

import { useState, useActionState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addLoyaltyBalance } from "@/app/actions/loyalty";

interface Program {
  code: string;
  name: string;
  type: "credit_card" | "airline" | "hotel";
  currency: string;
}

const PROGRAMS: Program[] = [
  // Bank currencies
  { code: "UR", name: "Chase Ultimate Rewards", type: "credit_card", currency: "UR" },
  { code: "MR", name: "Amex Membership Rewards", type: "credit_card", currency: "MR" },
  { code: "TYP", name: "Citi ThankYou Points", type: "credit_card", currency: "TYP" },
  { code: "C1", name: "Capital One Miles", type: "credit_card", currency: "C1" },
  { code: "BILT", name: "Bilt Rewards", type: "credit_card", currency: "BILT" },
  { code: "WF", name: "Wells Fargo Rewards", type: "credit_card", currency: "WF" },
  { code: "ALTITUDE", name: "US Bank Altitude Rewards", type: "credit_card", currency: "ALTITUDE" },
  // Airlines
  { code: "UA", name: "United MileagePlus", type: "airline", currency: "UA" },
  { code: "AA", name: "American AAdvantage", type: "airline", currency: "AA" },
  { code: "DL", name: "Delta SkyMiles", type: "airline", currency: "DL" },
  { code: "WN", name: "Southwest Rapid Rewards", type: "airline", currency: "WN" },
  { code: "AS", name: "Alaska Mileage Plan", type: "airline", currency: "AS" },
  { code: "BA", name: "British Airways Avios", type: "airline", currency: "BA" },
  { code: "VS", name: "Virgin Atlantic Flying Club", type: "airline", currency: "VS" },
  { code: "AC", name: "Air Canada Aeroplan", type: "airline", currency: "AC" },
  { code: "NH", name: "ANA Mileage Club", type: "airline", currency: "NH" },
  { code: "SQ", name: "Singapore KrisFlyer", type: "airline", currency: "SQ" },
  { code: "TK", name: "Turkish Miles&Smiles", type: "airline", currency: "TK" },
  { code: "AV", name: "Avianca LifeMiles", type: "airline", currency: "AV" },
  { code: "AF", name: "Air France Flying Blue", type: "airline", currency: "AF" },
  // Hotels
  { code: "HYATT", name: "World of Hyatt", type: "hotel", currency: "HYATT" },
  { code: "HILTON", name: "Hilton Honors", type: "hotel", currency: "HILTON" },
  { code: "MARRIOTT", name: "Marriott Bonvoy", type: "hotel", currency: "MARRIOTT" },
  { code: "IHG", name: "IHG One Rewards", type: "hotel", currency: "IHG" },
];

type ActionState = { success?: boolean; error?: { message: string; isRetryable: boolean; category: string } | null };

export function AddBalanceDialog() {
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await addLoyaltyBalance(formData);
      if (result.success) {
        setOpen(false);
        setSelectedCode("");
      }
      return result;
    },
    {}
  );

  const selected = PROGRAMS.find((p) => p.code === selectedCode);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSelectedCode("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Balance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Loyalty Balance</DialogTitle>
          <DialogDescription>
            Track your points and miles across programs.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {selected && (
            <>
              <input type="hidden" name="program_name" value={selected.name} />
              <input type="hidden" name="program_code" value={selected.code} />
              <input type="hidden" name="program_type" value={selected.type} />
              <input type="hidden" name="currency" value={selected.currency} />
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Program</label>
            <Select value={selectedCode} onValueChange={setSelectedCode}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem disabled value="__cc_header">
                  — Credit Card Currencies —
                </SelectItem>
                {PROGRAMS.filter((p) => p.type === "credit_card").map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
                <SelectItem disabled value="__airline_header">
                  — Airlines —
                </SelectItem>
                {PROGRAMS.filter((p) => p.type === "airline").map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
                <SelectItem disabled value="__hotel_header">
                  — Hotels —
                </SelectItem>
                {PROGRAMS.filter((p) => p.type === "hotel").map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Balance</label>
            <Input
              name="balance"
              type="number"
              min={0}
              placeholder="e.g. 85000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Last Activity Date{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input name="last_activity_date" type="date" />
            <p className="text-xs text-muted-foreground">
              Used for expiration tracking on activity-based programs.
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error.message}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !selectedCode}
          >
            {isPending ? "Adding..." : "Add Balance"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
