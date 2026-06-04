"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Plane,
  Settings,
  LogOut,
  User,
  CircleDollarSign,
  Newspaper,
  CreditCard,
  Wallet,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDefaultAppRoute, getTripsRoute, TRAVEL_ENABLED } from "@/lib/routes";

const navLinks = [
  ...(TRAVEL_ENABLED ? [{ href: "/travel", label: "Plan Trip" }] : []),
  { href: "/dashboard", label: "My Points" },
  ...(TRAVEL_ENABLED
    ? [{ href: getTripsRoute(), label: "My Trips" }]
    : []),
];

const mobileLinks = [
  ...(TRAVEL_ENABLED ? [{ href: "/travel", label: "Plan", icon: Plane }] : []),
  { href: "/dashboard", label: "Points", icon: CircleDollarSign },
  ...(TRAVEL_ENABLED
    ? [{ href: getTripsRoute(), label: "Trips", icon: Compass }]
    : []),
];

export function AppTopNav({ user }: { user: SupabaseUser }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-[52px] items-center justify-between border-b border-border bg-background px-5 text-foreground sm:px-8">
        <div className="flex items-center gap-8">
          <Link
            href={getDefaultAppRoute()}
            className="mono text-[15px] font-bold tracking-[-0.04em] text-primary"
          >
            WAYLOFT
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 rounded-full bg-border flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/cards" className="cursor-pointer">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Cards
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/recommend" className="cursor-pointer">Earn for a Trip</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/cards?view=optimizer" className="cursor-pointer">
                  <Wallet className="h-4 w-4 mr-2" />
                  Spending Optimizer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/credit-cards" className="cursor-pointer">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Reviews
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border">
        <div className="flex items-center justify-around h-14">
          {mobileLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="mono text-[9px] tracking-[0.03em] uppercase">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
