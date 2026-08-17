"use client";

import { useState, useEffect } from 'react';
import { OfficeProvider, useOffice } from '@/app/contexts/OfficeContext';
import { LobbyScreen } from '@/app/components/students/office/LobbyScreen';
import { OfficeDashboard } from '@/app/components/students/office/OfficeDashboard';
import { CVUploadUI } from '@/app/components/students/office/CVUploadUI';
import { useAuth } from '@/app/contexts/AuthContexts';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Loader2 } from 'lucide-react'; // 🔥 Added Loader2
import { toast } from 'sonner'; // 🔥 Added toast

function OfficeContent() {
  const { phase, isLoadingOnboarding, subscription } = useOffice();
  const { user } = useAuth();
  
  const [hasCv, setHasCv] = useState(true); 
  const [showCvWidget, setShowCvWidget] = useState(false);

  // 🔥 NEW: State for Inline Payment
  const [renewalPlan, setRenewalPlan] = useState<"monthly" | "quarterly">("monthly");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 🔥 NEW: Load Paystack script dynamically
  useEffect(() => {
    const loadPaystack = () => {
      if (document.getElementById('paystack-script')) return;
      const script = document.createElement('script');
      script.id = 'paystack-script';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    };
    loadPaystack();
  }, []);

  useEffect(() => {
    const checkCvStatus = async () => {
      if (!user?.id) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        const { data: progressData } = await supabase
          .from('user_progression')
          .select('current_week')
          .eq('user_id', user.id) 
          .maybeSingle();

        const hasBio = userData?.bio && userData.bio.trim() !== "" && userData.bio !== "null";
        
        const hasCvUrl = 
          (userData?.cv_url && userData.cv_url.trim() !== "" && userData.cv_url !== "null") ||
          (userData?.resume_url && userData.resume_url.trim() !== "" && userData.resume_url !== "null");

        const isAdvancedUser = progressData && progressData.current_week > 1;

        if (hasBio || hasCvUrl || isAdvancedUser) {
          setHasCv(true);
          setShowCvWidget(false);
        } else {
          setHasCv(false);
          if (!sessionStorage.getItem(`dismissed_cv_${user.id}`)) {
            setShowCvWidget(true);
          }
        }
      } catch (err) {
        console.error("Error checking career profile status:", err);
      }
    };
    
    if (phase === 'working') {
      checkCvStatus();
    }
  }, [user, phase]);

  // 🔥 NEW: Your exact Live Paystack Plan Codes
  const PAYSTACK_PLAN_CODES = {
    monthly: "PLN_46z8gz0p4foduy8",
    quarterly: "PLN_ddzhasixy441mju"
  };

  // 🔥 NEW: Inline Paystack Handler
  const handleInstantRenewal = () => {
    if (!(window as any).PaystackPop) {
      toast.error("Payment gateway is loading. Please try again in a second.");
      return;
    }

    setIsProcessingPayment(true);
    
    const amount = renewalPlan === "quarterly" ? 40500 : 15000;
    const planCode = PAYSTACK_PLAN_CODES[renewalPlan];

    const paystack = new (window as any).PaystackPop();
    paystack.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user?.email,
      amount: amount * 100, // Paystack expects Kobo
      channels: ['card'],   // Enforce card payments for auto-renewal
      plan: planCode,       // Connects the payment to your recurring plan
      onSuccess: async (transaction: any) => {
        toast.success("Subscription Renewed! Unlocking office...");
        setIsProcessingPayment(false);
        // Forcefully reload the window so the Context fetches the new active subscription dates
        window.location.reload(); 
      },
      onClose: () => {
        setIsProcessingPayment(false);
        toast.error("Payment cancelled. Office remains locked.");
      }
    });
    paystack.openIframe();
  };

  if (isLoadingOnboarding) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Checking Access...</p>
        </div>
      </div>
    );
  }

  const today = new Date();
  const hasNoExpiryDate = !subscription?.expiresAt;
  const expiryDate = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  const isPastExpiry = !expiryDate || isNaN(expiryDate.getTime()) || expiryDate <= today;
  const isInactive = subscription?.status !== 'active';

  if (!subscription || isInactive || hasNoExpiryDate || isPastExpiry) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0f172a]/95 backdrop-blur-md p-6 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Office Access Restricted</h2>
        <p className="text-white/60 max-w-md mb-6 text-sm leading-relaxed">
          Your internship subscription has expired or cannot be verified. 
          Please select a plan and <strong className="text-white">add a valid debit/credit card</strong> to renew and regain access.
        </p>

        {/* 🔥 NEW: Plan Selection Toggle for the Lockout Screen */}
        <div className="w-full max-w-xs space-y-3 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setRenewalPlan("monthly")}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                renewalPlan === "monthly" 
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                  : "border-white/10 text-white/50 hover:bg-white/5"
              }`}
            >
              <span className="text-sm font-bold">Monthly</span>
              <span className="text-xs mt-1">₦15,000</span>
            </button>

            <button 
              onClick={() => setRenewalPlan("quarterly")}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all relative ${
                renewalPlan === "quarterly" 
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" 
                  : "border-white/10 text-white/50 hover:bg-white/5"
              }`}
            >
              <div className="absolute -top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                SAVE ₦4,500
              </div>
              <span className="text-sm font-bold">Quarterly</span>
              <span className="text-xs mt-1">₦40,500</span>
            </button>
          </div>
        </div>

        <button 
          onClick={handleInstantRenewal} 
          disabled={isProcessingPayment}
          className="px-8 py-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-emerald-900/20 uppercase tracking-widest text-xs w-full max-w-xs"
        >
          {isProcessingPayment ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            `Pay ₦${renewalPlan === 'quarterly' ? '40,500' : '15,000'} & Unlock`
          )}
        </button>
      </div>
    );
  }

  if (phase === 'lobby') {
    return <LobbyScreen />;
  }

  return (
    <>
      <OfficeDashboard />

      {/* 🔥 NEW SLEEK, MOBILE-OPTIMIZED MODAL */}
      <AnimatePresence>
        {!hasCv && showCvWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f172a] border border-emerald-500/20 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative flex flex-col"
            >
              {/* Subtle Glowing Background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
              
              {/* Compact Horizontal Header */}
              <div className="p-5 md:p-6 border-b border-white/5 bg-white/[0.02] flex gap-4 items-start relative z-10">
                <div className="w-12 h-12 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-emerald-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">AI Career Personalisation</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed pr-2">
                    Upload your CV or a short bio. The AI uses this to tailor your daily tasks and feedback exactly to your skill level.
                  </p>
                </div>
              </div>

              {/* Body (Upload UI) */}
              <div className="p-5 md:p-6 relative z-10 max-h-[60vh] overflow-y-auto custom-scrollbar [&_textarea]:min-h-[100px]">
                <CVUploadUI 
                  userId={user?.id || ''} 
                  onSuccess={() => {
                    setHasCv(true);
                    setShowCvWidget(false);
                  }} 
                />
              </div>

              {/* Minimalist Footer */}
              <div className="p-3 border-t border-white/5 bg-black/20 flex justify-center relative z-10">
                <button 
                  onClick={() => {
                    setShowCvWidget(false);
                    sessionStorage.setItem(`dismissed_cv_${user?.id}`, 'true');
                  }}
                  className="text-xs font-medium text-white/40 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
                >
                  Skip for now, remind me next time
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function OfficePage() {
  return (
    <OfficeProvider>
      <OfficeContent />
    </OfficeProvider>
  );
}