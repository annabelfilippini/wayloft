"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function OnboardingRedirectCheck() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're NOT already on the onboarding page
    if (pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [pathname, router]);

  return null;
}
