"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Compass,
  CircleDollarSign,
  Newspaper,
  Plane,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "@/app/actions/auth";
import type { User } from "@supabase/supabase-js";
import { getDefaultAppRoute, getTripsRoute, TRAVEL_ENABLED } from "@/lib/routes";

const navLinks = [
  ...(TRAVEL_ENABLED ? [{ href: "/travel", label: "Travel", icon: Plane }] : []),
  ...(TRAVEL_ENABLED
    ? [{ href: getTripsRoute(), label: "Trips", icon: Compass }]
    : []),
  { href: "/dashboard", label: "Points", icon: CircleDollarSign },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/credit-cards", label: "Reviews", icon: Newspaper },
  { href: "/recommend", label: "Earn for a Trip", icon: Compass },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <Link href={getDefaultAppRoute()} className="text-2xl font-bold tracking-tight">
          Wayloft
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="truncate text-xs text-sidebar-foreground/60">
          {user.email}
        </p>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Sun className="h-3.5 w-3.5 hidden dark:block" />
          <Moon className="h-3.5 w-3.5 block dark:hidden" />
          <span className="dark:hidden">Dark mode</span>
          <span className="hidden dark:inline">Light mode</span>
        </button>
        <form action={signOut} className="mt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
