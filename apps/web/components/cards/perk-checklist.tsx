"use client";

import { useState, useActionState } from "react";
import type { UserPerkSetup, PerkSetupStatus } from "@wayloft/shared";
import {
  Plane,
  Shield,
  Sparkles,
  DollarSign,
  Utensils,
  Crown,
  ChevronDown,
  ChevronRight,
  X,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { markPerkSetup, dismissPerk } from "@/app/actions/cards";

interface PerkChecklistProps {
  perks: UserPerkSetup[];
  keyPerks: string[];
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: typeof Plane }
> = {
  travel: { label: "Travel", icon: Plane },
  insurance: { label: "Insurance", icon: Shield },
  lifestyle: { label: "Lifestyle", icon: Sparkles },
  financial: { label: "Financial", icon: DollarSign },
  dining: { label: "Dining", icon: Utensils },
  status: { label: "Status & Loyalty", icon: Crown },
};

const CATEGORY_ORDER: Record<string, number> = {
  travel: 0,
  status: 1,
  insurance: 2,
  dining: 3,
  lifestyle: 4,
  financial: 5,
};

function groupByCategory(perks: UserPerkSetup[]) {
  const groups: Record<string, UserPerkSetup[]> = {};
  for (const p of perks) {
    if (!groups[p.category]) groups[p.category] = [];
    groups[p.category].push(p);
  }
  return Object.entries(groups).sort(
    ([a], [b]) => (CATEGORY_ORDER[a] ?? 9) - (CATEGORY_ORDER[b] ?? 9)
  );
}

export function PerkChecklist({ perks, keyPerks }: PerkChecklistProps) {
  // If no structured perks, fall back to string list
  if (perks.length === 0) {
    return <FallbackPerkList keyPerks={keyPerks} />;
  }

  const activePerks = perks.filter((p) => p.status !== "not_applicable");
  const completedCount = activePerks.filter((p) => p.status === "completed").length;
  const totalValue = activePerks.reduce((sum, p) => sum + p.estimated_annual_value_cents, 0);
  const activatedValue = activePerks
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.estimated_annual_value_cents, 0);

  const groups = groupByCategory(activePerks);
  const progressPct = activePerks.length > 0 ? (completedCount / activePerks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Value Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {completedCount} of {activePerks.length} perks activated
          </span>
          <span className="font-medium">
            ~${(activatedValue / 100).toLocaleString()}/yr value
            {totalValue > activatedValue && (
              <span className="text-muted-foreground font-normal">
                {" "}of ${(totalValue / 100).toLocaleString()}
              </span>
            )}
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Category Groups */}
      {groups.map(([category, categoryPerks]) => (
        <PerkCategoryGroup
          key={category}
          category={category}
          perks={categoryPerks}
        />
      ))}
    </div>
  );
}

function PerkCategoryGroup({
  category,
  perks,
}: {
  category: string;
  perks: UserPerkSetup[];
}) {
  const config = CATEGORY_CONFIG[category] ?? {
    label: category,
    icon: CreditCard,
  };
  const Icon = config.icon;

  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </h4>
      <div className="space-y-2">
        {perks.map((perk) => (
          <PerkRow key={perk.id} perk={perk} />
        ))}
      </div>
    </div>
  );
}

function PerkRow({ perk }: { perk: UserPerkSetup }) {
  const [expanded, setExpanded] = useState(false);
  const valueDollars = perk.estimated_annual_value_cents / 100;

  const nextStatus: PerkSetupStatus =
    perk.status === "not_started"
      ? "in_progress"
      : perk.status === "in_progress"
        ? "completed"
        : perk.status;

  const isActionable = perk.status !== "completed";

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start gap-3">
        {/* Checkbox / status toggle */}
        {isActionable ? (
          <ToggleButton perkId={perk.id} nextStatus={nextStatus} currentStatus={perk.status} />
        ) : (
          <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
            <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Name + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${perk.status === "completed" ? "text-muted-foreground" : ""}`}>
              {perk.perk_name}
            </p>
            <PerkStatusBadge status={perk.status} perkType={perk.perk_type} />
          </div>
          {valueDollars > 0 && (
            <span className="text-xs text-muted-foreground">
              ~${valueDollars.toLocaleString()}/yr
            </span>
          )}
        </div>

        {/* Expand + dismiss controls */}
        <div className="flex items-center gap-1 shrink-0">
          {isActionable && (
            <DismissButton perkId={perk.id} />
          )}
          {perk.perk_type !== "always_on" && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable setup instructions */}
      {expanded && (
        <div className="ml-8 space-y-1.5 text-xs text-muted-foreground">
          <p>{perk.notes || getSetupInstructions(perk) || "No setup instructions available."}</p>
        </div>
      )}
    </div>
  );
}

function getSetupInstructions(perk: UserPerkSetup): string | null {
  // We don't store setup_instructions in the DB row, but the component
  // could receive them via catalog data. For now, return null.
  return null;
}

function PerkStatusBadge({
  status,
  perkType,
}: {
  status: PerkSetupStatus;
  perkType: string;
}) {
  if (status === "completed") {
    return (
      <Badge className="bg-green-100 text-green-800 border-0 dark:bg-green-900/30 dark:text-green-300 text-[10px] px-1.5 py-0">
        Active
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-0 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-1.5 py-0">
        In progress
      </Badge>
    );
  }
  if (perkType === "enrollment_required") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-0 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] px-1.5 py-0">
        Setup needed
      </Badge>
    );
  }
  if (perkType === "one_time_setup") {
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        Setup needed
      </Badge>
    );
  }
  // always_on that's not completed — shouldn't happen but handle it
  return null;
}

type ActionState = { error?: string; success?: boolean };

function ToggleButton({
  perkId,
  nextStatus,
  currentStatus,
}: {
  perkId: string;
  nextStatus: PerkSetupStatus;
  currentStatus: PerkSetupStatus;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => markPerkSetup(formData),
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="perk_id" value={perkId} />
      <input type="hidden" name="status" value={nextStatus} />
      <button
        type="submit"
        disabled={isPending}
        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
          currentStatus === "in_progress"
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-muted-foreground/30 hover:border-muted-foreground/60"
        }`}
      >
        {currentStatus === "in_progress" && (
          <div className="h-2 w-2 rounded-sm bg-blue-500" />
        )}
      </button>
      {state.error && (
        <p className="text-[10px] text-destructive mt-0.5">{state.error}</p>
      )}
    </form>
  );
}

function DismissButton({ perkId }: { perkId: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => dismissPerk(formData),
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="perk_id" value={perkId} />
      <button
        type="submit"
        disabled={isPending}
        className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        title="Not applicable"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {state.error && (
        <p className="text-[10px] text-destructive">{state.error}</p>
      )}
    </form>
  );
}

function FallbackPerkList({ keyPerks }: { keyPerks: string[] }) {
  if (keyPerks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No key perks listed for this card.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {keyPerks.map((perk) => (
        <li key={perk} className="flex items-start gap-3 text-sm">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{perk}</span>
        </li>
      ))}
    </ul>
  );
}
