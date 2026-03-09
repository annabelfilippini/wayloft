import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-3 md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[19px] tracking-[0.04em]"
        >
          Wayloft
        </Link>
        <div className="flex items-center gap-6 text-[13px] text-muted-foreground md:gap-8">
          <Link
            href="/credit-cards"
            className="transition-colors hover:text-foreground"
          >
            Cards
          </Link>
          <Link
            href="/credit-cards/best-for/travel"
            className="hidden transition-colors hover:text-foreground md:block"
          >
            Best Cards
          </Link>
          <Link
            href="/recommend"
            className="hidden transition-colors hover:text-foreground sm:block"
          >
            Find Your Card
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full border px-4 py-1.5 text-foreground transition-colors hover:bg-muted"
          >
            Join
          </Link>
        </div>
      </nav>
    </header>
  );
}
