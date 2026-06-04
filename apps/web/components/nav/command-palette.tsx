"use client";

import { useRouter } from "next/navigation";
import {
  CreditCard,
  Wallet,
  Compass,
  Plane,
  Newspaper,
  Settings,
  Plus,
  FlaskConical,
  PiggyBank,
  CircleDollarSign,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { getTripsRoute, TRAVEL_ENABLED } from "@/lib/routes";

interface CommandPaletteProps {
  cards: { slug: string; name: string; issuer: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  ...(TRAVEL_ENABLED ? [{ label: "Plan Trip", href: "/travel", icon: Plane }] : []),
  { label: "My Points", href: "/dashboard", icon: CircleDollarSign },
  ...(TRAVEL_ENABLED
    ? [{ label: "My Trips", href: getTripsRoute(), icon: Compass }]
    : []),
  { label: "Cards", href: "/cards", icon: CreditCard },
  { label: "Earn for a Trip", href: "/recommend", icon: Compass },
  { label: "Spending Optimizer", href: "/cards?view=optimizer", icon: Wallet },
  { label: "Reviews", href: "/credit-cards", icon: Newspaper },
  { label: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { label: "Add a card", href: "/cards", icon: Plus },
  { label: "Find points for a trip", href: "/recommend", icon: FlaskConical },
  { label: "Add balance", href: "/dashboard", icon: PiggyBank },
];

export function CommandPalette({ cards, open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  function navigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, cards, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Cards">
          {cards.map((card) => (
            <CommandItem
              key={card.slug}
              value={`${card.name} ${card.issuer}`}
              onSelect={() => navigate(`/credit-cards/${card.slug}`)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>{card.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {card.issuer.replace("_", " ")}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map((action) => (
            <CommandItem key={action.label} onSelect={() => navigate(action.href)}>
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
