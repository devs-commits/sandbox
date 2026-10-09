"use client";

import { useEffect, useState } from "react";
import { Clock, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import { SubscribeModal } from "@/app/components/students/SubscribeModal"; 
import { toast } from "sonner"; 

export function SubscriptionLineCounter({ user }: { user: any }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [percentageSpent, setPercentageSpent] = useState(0);
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
        console.error("Failed to fetch trial data:", err);
      }
    };

    fetchSubscriptionData();
  }, [user]);

  // Hide if more than a standard trial length (e.g., 7-14 days)
  if (daysLeft === null || daysLeft > 14) return null;

  let theme = {
    text: "text-primary",
    bg: "bg-primary",
    iconAnim: "",
    showLink: true,
    isEnding: false
  };

  if (daysLeft <= 2) {
    theme = { 
      text: "text-amber-500", 
      bg: "bg-amber-500", 
      iconAnim: "animate-pulse", 
      showLink: true,
      isEnding: true
    };
  }

  const handleManageBilling = () => {
    toast.info("Customer Portal link will be mapped to Paystack shortly.");
  };

  return (
    <>
      <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-6 bg-card border border-border/40 px-4 py-2.5 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
        <div className={`flex items-center gap-1.5 whitespace-nowrap ${theme.text}`}>
          <Clock className={`w-3.5 h-3.5 ${theme.iconAnim}`} />
          <span className="font-bold">
            Free Trial: {daysLeft} Day{daysLeft === 1 ? "" : "s"} Left
          </span>
        </div>
        
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${theme.bg}`}
            style={{ width: `${percentageSpent}%` }}
          />
        </div>

        {theme.showLink && theme.isEnding ? (
          <button 
            onClick={() => setShowModal(true)}
            className={`${theme.text} hover:underline font-bold whitespace-nowrap flex items-center gap-1 bg-transparent border-none cursor-pointer`}
          >
            Upgrade to Full Access <Rocket className="w-3 h-3 ml-0.5" />
          </button>
        ) : theme.showLink && !theme.isEnding ? (
          <button 
            onClick={handleManageBilling}
            className={`text-muted-foreground hover:text-foreground font-bold whitespace-nowrap flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors`}
          >
            Manage Account
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