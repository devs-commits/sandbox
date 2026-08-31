"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OfficeProvider, useOffice } from '@/app/contexts/OfficeContext';
import { LobbyScreen } from '@/app/components/students/office/LobbyScreen';
import { OfficeDashboard } from '@/app/components/students/office/OfficeDashboard';
import { CVUploadModal } from '@/app/components/students/office/modals/CvUploadModal';
import { useAuth } from '@/app/contexts/AuthContexts';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function OfficeContent() {
  const { phase, isLoadingOnboarding, subscription, refreshSubscription } = useOffice();
  const { user } = useAuth();
  
  const searchParams = useSearchParams();
  const router = useRouter();             

  const [hasCv, setHasCv] = useState(true); 
  const [showCvWidget, setShowCvWidget] = useState(false);

  // State for Payments
  const [renewalPlan, setRenewalPlan] = useState<"monthly" | "quarterly">("monthly");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isVerifyingRedirect, setIsVerifyingRedirect] = useState(false); 

  // =========================================================================
  // 🔥 URL Redirect Interceptor (Handles SubscribeModal Redirect Flow)
  // =========================================================================
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    
    if (reference && user?.id && !isVerifyingRedirect) {
      verifyRedirectPayment(reference);
    }
  }, [searchParams, user?.id]);

  const verifyRedirectPayment = async (reference: string) => {
    setIsVerifyingRedirect(true);
    const toastId = toast.loading("Confirming your payment...", { duration: 10000 });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          reference,
          userId: user?.id,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || result?.message || 'Payment verification failed.');
      }

      await refreshSubscription();
      toast.success("Payment successful! Office unlocked.", { id: toastId });

    } catch (error: any) {
      console.error('Redirect verification failed:', error);
      toast.error(error.message || "Failed to confirm payment.", { id: toastId });
    } finally {
      setIsVerifyingRedirect(false);
      router.replace('/student/office', { scroll: false });
    }
  };
  // =========================================================================

  // Load Paystack InlineJS v2 dynamically.
  useEffect(() => {
    const scriptId = 'paystack-script';
    const scriptUrl = 'https://js.paystack.co/v2/inline.js';
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (existingScript && existingScript.src !== scriptUrl) {
      existingScript.remove();
    } else if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load the Paystack payment script.');
      toast.error('Could not load the payment gateway. Please refresh and try again.');
    };
    document.body.appendChild(script);
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
          // 🔥 STRICT ENFORCEMENT: No sessionStorage skip allowed. 
          // If they don't have a CV/Bio, they MUST see the modal.
          setHasCv(false);
          setShowCvWidget(true);
        }
      } catch (err) {
        console.error("Error checking career profile status:", err);
      }
    };
    
    if (phase === 'working') {
      checkCvStatus();
    }
  }, [user, phase]);

  const PAYSTACK_PLAN_CODES = {
    monthly: "PLN_46z8gz0p4foduy8",
    quarterly: "PLN_ddzhasixy441mju"
  };

  const handleInstantRenewal = () => {
    const PaystackPop = (window as any).PaystackPop;
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    const email = user?.email;

    if (!PaystackPop) {
      toast.error("Payment gateway is loading. Please try again in a second.");
      return;
    }

    if (!publicKey || !email || !user?.id) {
      toast.error('Payment is not configured properly or account details are missing.');
      return;
    }

    setIsProcessingPayment(true);

    const amount = renewalPlan === "quarterly" ? 40500 : 15000;
    const planCode = PAYSTACK_PLAN_CODES[renewalPlan];

    try {
      const paystack = new PaystackPop();

      paystack.newTransaction({
        key: publicKey,
        email,
        amount: amount * 100, 
        currency: 'NGN',
        channels: ['card'],
        plan: planCode,       
        metadata: {
          subscriptionPlan: renewalPlan,
        },
        onSuccess: async (transaction: any) => {
          try {
            if (!transaction?.reference) throw new Error('Paystack did not return a transaction reference.');
            
            toast.success("Payment completed! Confirming your subscription...");

            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;

            const response = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              },
              body: JSON.stringify({
                reference: transaction.reference,
                planType: renewalPlan,
                userId: user.id, 
              }),
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) throw new Error(result?.error || 'Payment verification failed.');

            await refreshSubscription();
            toast.success("Subscription renewed. Your office is now unlocked.");
          } catch (error) {
            console.error('Post-payment verification failed:', error);
            toast.error(error instanceof Error ? error.message : 'Payment verification failed.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        onCancel: () => {
          setIsProcessingPayment(false);
          toast.error("Payment cancelled. Office remains locked.");
        },
        onError: (error: Error) => {
          console.error('Paystack payment error:', error);
          setIsProcessingPayment(false);
          toast.error(error.message || 'Unable to start payment. Please try again.');
        }
      });
    } catch (error) {
      console.error('Unable to initialize Paystack:', error);
      setIsProcessingPayment(false);
      toast.error(error instanceof Error ? error.message : 'Unable to start payment.');
    }
  };

  if (isLoadingOnboarding || isVerifyingRedirect) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">
            {isVerifyingRedirect ? "Confirming payment with Paystack..." : "Checking Access..."}
          </p>
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

      {/* 🔥 The Strict Modal Enforcement */}
      <CVUploadModal 
        isOpen={!hasCv && showCvWidget} 
        userId={user?.id || ''} 
        onSuccess={() => {
          setHasCv(true);
          setShowCvWidget(false);
        }}
      />
    </>
  );
}

export default function OfficePage() {
  return (
    <OfficeProvider>
      <Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }>
        <OfficeContent />
      </Suspense>
    </OfficeProvider>
  );
}