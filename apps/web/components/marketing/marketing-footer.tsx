import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-8 font-sans md:px-10">
        <Link
          href="/"
          className="mono text-[11px] font-bold tracking-[-0.04em] text-primary"
        >
          WAYLOFT
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <span className="mono text-[10px] tracking-[0.02em] text-muted-foreground">
            &copy; {new Date().getFullYear()} WAYLOFT
          </span>
        </div>
      </div>
    </footer>
  );
}
