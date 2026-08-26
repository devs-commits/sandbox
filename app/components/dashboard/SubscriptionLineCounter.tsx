"use client";

import { useEffect, useState } from "react";
import { Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import { SubscribeModal } from "@/app/components/students/SubscribeModal"; 
import { toast } from "sonner"; // <-- Add this import

export function SubscriptionLineCounter({ user }: { user: any }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [percentageSpent, setPercentageSpent] = useState(0);
  
  // State to control our subscription modal
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_status, start_date, subscription_expires_at')
          .eq('auth_id', user.id)
          .maybeSingle();

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
  // ==========================================
  if (daysLeft === null || daysLeft > 15) return null;

  // ==========================================
  // 2. DYNAMIC THEME LOGIC
  // ==========================================
  let theme = {
    text: "text-green-500",
    bg: "bg-green-500",
    iconAnim: "",
    showLink: false,
    isExpiring: false
  };

  if (daysLeft <= 3) {
    // RED: 0-3 Days
    theme = { 
      text: "text-destructive", 
      bg: "bg-destructive", 
      iconAnim: "animate-pulse", 
      showLink: true,
      isExpiring: true
    };
  } else if (daysLeft <= 7) {
    // AMBER: 4-7 Days
    theme = { 
      text: "text-amber-500", 
      bg: "bg-amber-500", 
      iconAnim: "", 
      showLink: true,
      isExpiring: true
    };
  } else {
    // GREEN: 8-15 Days - We enable the link to "Manage Billing"
    theme.showLink = true;
    theme.isExpiring = false; 
  }

  // NOTE: Replace this with the URL or endpoint that returns the generated Paystack Customer Portal URL.
  const handleManageBilling = () => {
    // e.g. const response = await fetch('/api/paystack/portal') -> return url 
    // window.open(portalUrl, '_blank');
    toast.info("Customer Portal link will be mapped to Paystack shortly.");
  };

  return (
    <>
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

        {/* Dynamic CTA */}
        {theme.showLink && theme.isExpiring ? (
          <button 
            onClick={() => setShowModal(true)}
            className={`${theme.text} hover:underline font-bold whitespace-nowrap flex items-center gap-1 bg-transparent border-none cursor-pointer`}
          >
            Add Card to Renew
          </button>
        ) : theme.showLink && !theme.isExpiring ? (
          <button 
            onClick={handleManageBilling}
            className={`text-muted-foreground hover:text-foreground font-bold whitespace-nowrap flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors`}
          >
            Manage Billing <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>
        ) : null}
      </div>

      <SubscribeModal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
        userId={user?.id || ""} 
        userEmail={user?.email || ""} 
      />
    </>
  );
}