"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, ShieldCheck, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

export function SubscribeModal({ open, onClose, userId, userEmail }: SubscribeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly">("monthly");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!userId || !userEmail) {
      toast.error("Your account details are unavailable. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const res = await fetch("/api/subscription/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          userId,
          email: userEmail,
          // Sending plan uniformly to ensure the backend builds the metadata correctly
          plan: selectedPlan,
          subscriptionPlan: selectedPlan, 
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Could not initialize subscription checkout.");
      }

      const checkoutUrl = data.authorization_url || data.data?.authorization_url || data.url;
      if (!checkoutUrl) {
        throw new Error("Payment gateway did not return a checkout URL.");
      }

      // Redirect to Paystack checkout
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Subscription initialization error:", error);
      toast.error(error?.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        // Prevent closing the modal while redirecting
        if (!isOpen && !isLoading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg bg-[#0f172a] border-white/10 text-white rounded-3xl p-8">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="text-emerald-400" size={24} />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Activate WDC Labs Subscription</DialogTitle>
          <DialogDescription className="text-white/50 text-xs mt-1">
            Attach your payment card to unlock full access to courses, learning tools, and payouts.
          </DialogDescription>
        </DialogHeader>

        <div className={`space-y-4 pt-4 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
          {/* MONTHLY OPTION */}
          <div
            onClick={() => setSelectedPlan("monthly")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedPlan === "monthly"
                ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
                : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Monthly Access</span>
                <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-semibold">Standard</span>
              </div>
              <p className="text-xs text-white/40">Billed monthly • Cancel anytime</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-400">₦15,000</p>
              <p className="text-[10px] text-white/30 font-mono">/ month</p>
            </div>
          </div>

          {/* QUARTERLY OPTION */}
          <div
            onClick={() => setSelectedPlan("quarterly")}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${
              selectedPlan === "quarterly"
                ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
                : "bg-white/5 border-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-xl tracking-wider uppercase">
              Save ₦4,500
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Quarterly Access</span>
              </div>
              <p className="text-xs text-white/40">Billed every 3 months (₦13,500/mo equivalent)</p>
            </div>
            <div className="text-right pt-2">
              <p className="text-xl font-black text-emerald-400">₦40,500</p>
              <p className="text-[10px] text-white/30 font-mono">/ 3 months</p>
            </div>
          </div>

          {/* PAYSTACK SECURITY NOTICE */}
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs pt-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Payments secured end-to-end by Paystack</span>
          </div>

          {/* PROCEED BUTTON */}
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl transition-all mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting to Paystack...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" /> Add Card & Subscribe Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}