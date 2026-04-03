"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Compass,
  Plane,
  Settings,
  LogOut,
  Bell,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "@/app/actions/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cards", label: "Cards" },
  { href: "/recommend", label: "Find a Card" },
  { href: "/travel", label: "Travel" },
];

const mobileLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/recommend", label: "Find Card", icon: Compass },
  { href: "/travel", label: "Travel", icon: Plane },
];

export function AppTopNav({ user }: { user: SupabaseUser }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Desktop top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-background flex items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="mono text-[15px] font-bold tracking-[-0.04em] text-primary">
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
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="mono text-[10px] tracking-[0.02em] text-muted-foreground bg-card px-2.5 py-1 hover:text-foreground transition-colors"
            >
              {theme === "dark" ? "LIGHT" : "DARK"}
            </button>
          )}
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
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
                <Link href="/cards?view=optimizer" className="cursor-pointer">Optimizer</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/credit-cards" className="cursor-pointer">Reviews</Link>
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
