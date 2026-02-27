import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-8 md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[15px] tracking-[0.04em] text-muted-foreground"
        >
          Wayloft
        </Link>
        <span className="text-[11px] tracking-[0.1em] text-muted-foreground/60">
          &copy; {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
