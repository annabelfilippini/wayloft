"use client";

import { ExternalLink } from "lucide-react";
import { trackAffiliateClick } from "@/app/actions/affiliate";
import { buildAffiliateUrl, type SourcePage } from "@/lib/affiliate";

interface AffiliateLinkProps {
  applicationUrl: string;
  cardSlug: string;
  sourcePage: SourcePage;
  rank?: number;
  /** Button label — defaults to "Apply Now" */
  label?: string;
  /** Visual variant */
  variant?: "button" | "link";
  className?: string;
}

export function AffiliateLink({
  applicationUrl,
  cardSlug,
  sourcePage,
  rank,
  label = "Apply Now",
  variant = "button",
  className,
}: AffiliateLinkProps) {
  const href = buildAffiliateUrl({
    applicationUrl,
    cardSlug,
    sourcePage,
    rank,
  });

  const handleClick = () => {
    // Fire-and-forget — don't block the redirect
    trackAffiliateClick({
      cardSlug,
      sourcePage,
    }).catch(() => {
      // Tracking failure should never block the user
    });
  };

  if (variant === "link") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={handleClick}
        className={
          className ??
          "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        }
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={handleClick}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      }
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
