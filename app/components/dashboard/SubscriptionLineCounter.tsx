"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // Ensure this matches your setup

export function SubscriptionLineCounter({ user }: { user: any }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [percentageSpent, setPercentageSpent] = useState(0);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_status, start_date, subscription_expires_at')
          .eq('auth_id', user.id)
          .single();

        if (error) throw error;

        if (data?.subscription_status === 'active' && data?.subscription_expires_at && data?.start_date) {
          const expiryDate = new Date(data.subscription_expires_at).getTime();
          const startDate = new Date(data.start_date).getTime();
          const today = Date.now();

          const totalDuration = expiryDate - startDate;
          const timeRemaining = expiryDate - today;

          const days = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)));
          setDaysLeft(days);

          const pct = Math.max(0, Math.min(100, ((totalDuration - timeRemaining) / totalDuration) * 100));
          setPercentageSpent(pct);
        }
      } catch (err) {
        console.error("Failed to fetch subscription data:", err);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  // ==========================================
  // 1. VISIBILITY RULE
  // Hide if there are more than 15 days left or if data is missing
  // ==========================================
  if (daysLeft === null || daysLeft > 15) return null;

  // ==========================================
  // 2. DYNAMIC THEME LOGIC
  // ==========================================
  let theme = {
    text: "text-green-500",
    bg: "bg-green-500",
    iconAnim: "",
    showLink: false // We won't push them to fund until it's amber
  };

  if (daysLeft <= 3) {
    // RED: 0-3 Days
    theme = { 
      text: "text-destructive", 
      bg: "bg-destructive", 
      iconAnim: "animate-pulse", 
      showLink: true 
    };
  } else if (daysLeft <= 7) {
    // AMBER: 4-7 Days
    theme = { 
      text: "text-amber-500", 
      bg: "bg-amber-500", 
      iconAnim: "", 
      showLink: true 
    };
  }
  // GREEN: 8-15 Days (Fallback from our default theme object)

  return (
    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-6 bg-card border border-border/40 px-4 py-2.5 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className={`flex items-center gap-1.5 whitespace-nowrap ${theme.text}`}>
        <Clock className={`w-3.5 h-3.5 ${theme.iconAnim}`} />
        <span className="font-bold">
          Subscription: {daysLeft} Days Left
        </span>
      </div>
      
      {/* The Line Counter */}
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${theme.bg}`}
          style={{ width: `${percentageSpent}%` }}
        />
      </div>

      {/* Subtle CTA */}
      {theme.showLink && (
        <Link 
          href="/student/wallet" 
          className={`${theme.text} hover:underline font-bold whitespace-nowrap flex items-center gap-1`}
        >
          Fund Wallet to Renew
        </Link>
      )}
    </div>
  );
}