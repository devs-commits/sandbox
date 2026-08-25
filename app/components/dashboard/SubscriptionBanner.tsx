"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { SubscribeModal } from "@/app/components/students/SubscribeModal";

export function SubscriptionBanner({ user }: { user: any }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.subscription_status === "active" && user?.subscription_expires_at) {
      const expiryDate = new Date(user.subscription_expires_at);
      const today = new Date();

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysLeft(diffDays);
    }
  }, [user]);

  // Hide the banner if there are more than 3 days left, or if already expired
  if (daysLeft === null || daysLeft > 3 || daysLeft <= 0) return null;

  return (
    <>
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center justify-between mb-6 shadow-sm animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">
              Subscription Expiring Soon
            </p>
            <p className="text-xs font-medium mt-0.5">
              Your access pauses in {daysLeft} day{daysLeft === 1 ? "" : "s"}. Renew your plan with a valid debit/credit card.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-xs font-bold hover:bg-destructive/90 transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Renew Plan
        </button>
      </div>

      <SubscribeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        userId={user?.id || user?.auth_id || ""}
        userEmail={user?.email || ""}
      />
    </>
  );
}