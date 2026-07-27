"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Get referral code from query params (?ref=...)
    const refCode = searchParams.get("ref");
    
    // 2. Extract squad slug from URL path (e.g., /squad/growth-builders)
    let squadSlug = searchParams.get("squad"); // Fallback if passed as a query
    if (pathname?.startsWith("/squad/")) {
      const parts = pathname.split("/");
      if (parts.length > 2 && parts[2]) {
        squadSlug = parts[2];
      }
    }

    const maxAge = 2592000; // Exactly 30 days in seconds

    // 3. Lock in the Referral Code (First-click attribution)
    if (refCode) {
      const existingRefCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('wdc_referral_id='));

      if (!existingRefCookie) {
        document.cookie = `wdc_referral_id=${refCode}; path=/; max-age=${maxAge}; SameSite=Lax`;
        console.log("WDC Labs: Referral cached globally.");
      }
    }

    // 4. Lock in the Squad Slug
    if (squadSlug) {
      const existingSquadCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('wdc_squad_id='));

      if (!existingSquadCookie) {
        document.cookie = `wdc_squad_id=${squadSlug}; path=/; max-age=${maxAge}; SameSite=Lax`;
        console.log(`WDC Labs: Squad '${squadSlug}' cached globally.`);
      }
    }
  }, [searchParams, pathname]);

  // Works entirely in the background
  return null; 
}