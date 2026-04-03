import Link from "next/link";

const navLinks = [
  { href: "/credit-cards/worth-it", label: "Worth It?" },
  { href: "/credit-cards", label: "Cards" },
  { href: "/credit-cards/best-for/travel", label: "Best Cards", hideOnMobile: true },
  { href: "/recommend", label: "Find Your Card", hideOnMobile: true },
  { href: "/about", label: "About", hideOnMobile: true },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 h-[52px] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-[1120px] h-full items-center justify-between px-6 md:px-10">
        {/* Left: Wordmark + Nav */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="mono text-[15px] font-bold tracking-[-0.04em] text-primary"
          >
            WAYLOFT
          </Link>
          <div className="flex items-center gap-6">
            {navLinks.map(({ href, label, hideOnMobile }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm text-muted-foreground transition-colors hover:text-foreground ${
                  hideOnMobile ? "hidden md:block" : ""
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Auth */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="border px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Join
          </Link>
        </div>
      </nav>
    </header>
  );
}
