import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-8 md:px-10">
        <Link
          href="/"
          className="mono text-[11px] font-bold tracking-[-0.04em] text-primary"
        >
          WAYLOFT
        </Link>
        <span className="mono text-[10px] tracking-[0.02em] text-muted-foreground">
          &copy; {new Date().getFullYear()} WAYLOFT
        </span>
      </div>
    </footer>
  );
}
