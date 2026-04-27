"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Wallet } from "lucide-react";
import Link from "next/link";

export function SubscriptionBanner({ user }: { user: any }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    // Only process if the user is active and has an expiry date
    if (user?.subscription_status === 'active' && user?.subscription_expires_at) {
      const expiryDate = new Date(user.subscription_expires_at);
      const today = new Date();
      
      // Calculate the difference in days
      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysLeft(diffDays);
    }
  }, [user]);

  // Hide the banner if there are more than 3 days left, or if the subscription is already expired
  if (daysLeft === null || daysLeft > 3 || daysLeft <= 0) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center justify-between mb-6 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide">Subscription Expiring Soon</p>
          <p className="text-xs font-medium mt-0.5">
            Your access pauses in {daysLeft} day{daysLeft === 1 ? '' : 's'}. Ensure your wallet has at least ₦15,000 for auto-renewal.
          </p>
        </div>
      </div>
      <Link 
        href="/student/wallet" 
        className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-xs font-bold hover:bg-destructive/90 transition-colors"
      >
        <Wallet className="w-3 h-3" />
        Fund Wallet
      </Link>
    </div>
  );
}