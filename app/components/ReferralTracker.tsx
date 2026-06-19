"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Check if the URL has a ?ref= parameter
    const refCode = searchParams.get("ref");
    
    if (refCode) {
      // 2. Check if a referral cookie already exists
      const existingCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('wdc_referral_id='));

      // 3. Only set the cookie if it DOES NOT exist (First-click attribution)
      if (!existingCookie) {
        // max-age=2592000 equals exactly 30 days in seconds
        document.cookie = `wdc_referral_id=${refCode}; path=/; max-age=2592000; SameSite=Lax`;
        console.log("WDC Labs: Referral cached globally.");
      }
    }
  }, [searchParams]);

  // This component works entirely in the background, so it renders nothing
  return null; 
}