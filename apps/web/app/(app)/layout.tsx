import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { UserMenu } from "@/components/auth/user-menu";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cards", label: "My Cards" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-semibold">
              Wayloft
            </Link>
            <nav className="flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <UserMenu user={user} />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
