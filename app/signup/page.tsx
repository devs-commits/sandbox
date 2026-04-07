"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Copy, CheckCircle, Clock, AlertCircle, CreditCard, Banknote } from "lucide-react";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { RoleToggle } from "../components/auth/RoleToggle";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContexts";
import { toast } from "sonner";
import * as countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { TermsAgreement } from "../components/auth/TermsAgreement";

countries.registerLocale(enLocale);

// Required for Paystack inline popup
declare const PaystackPop: any;

const tracks = [
  { value: "digital-marketing", label: "Digital Marketing", price: "₦ 15,000" },
  { value: "data-analytics", label: "Data Analytics", price: "₦ 15,000" },
  { value: "cyber-security", label: "Cyber Security", price: "₦ 15,000" },
];

const RECRUITER_PRICE = "₦ 15,000";

type PaymentDetails = {
  accountNumber: string;
  accountName: string;
  localExpiry: number;
  transactionId: string;
};

const SignUpContent = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "paystack">("transfer");
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [track, setTrack] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [referralLink, setReferralLink] = useState(searchParams.get("code") || "");

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [initializingPaystack, setInitializingPaystack] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [wdcPrivacy, setWdcPrivacy] = useState(false);

  const countryOptions = useMemo(() => {
    const countryNames = countries.getNames("en", { select: "official" });
    return Object.entries(countryNames)
      .map(([code, name]) => ({ value: code.toLowerCase(), label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const selectedTrack = tracks.find((t) => t.value === track);
  const subscriptionPrice = role === "recruiter" ? RECRUITER_PRICE : selectedTrack?.price || "₦ 15,000";

  const experienceLeveloptions = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  useEffect(() => {
    if (!paymentDetails?.localExpiry) return;
    const updateTimer = () => {
      const diff = paymentDetails.localExpiry - Date.now();
      if (diff <= 0) {
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(Math.floor(diff / 1000));
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [paymentDetails]);

  const formattedTime = secondsLeft === null ? "--:--" : 
    `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, "0")}`;

  const timerExpired = secondsLeft === 0;

  const validateForm = () => {
    if (!fullName || !email || !password || !country || (role === "student" && (!track || !experienceLevel))) {
      toast.error("Please fill in all details first");
      return false;
    }
    if (!wdcPrivacy) {
      toast.error("Please agree to the terms and privacy policy");
      return false;
    }
    return true;
  };

  const handleRegistration = async () => {
    const result = await signup({
      fullName, email, password, role, country,
      track: role === "student" ? track : undefined,
      experienceLevel: role === "student" ? experienceLevel : undefined,
      referralLink: role === "student" ? referralLink : undefined,
    });

    if (!result.success) {
      const errorStr = (result.error || "").toLowerCase();
      // If Supabase says the email exists, we intercept it and proceed to payment anyway!
      if (errorStr.includes("already registered") || errorStr.includes("already exists") || errorStr.includes("duplicate")) {
         toast.info("Email recognized. Resuming your payment...", { id: "resume-toast" });
         return { success: true, isExisting: true, userId: null }; 
      }
      return { success: false, error: result.error };
    }
    return { success: true, isExisting: false, userId: (result as any).user?.id || (result as any).data?.user?.id };
  };

  const createPaymentAccount = async () => {
    if (!validateForm()) return;
    setCreatingAccount(true);

    const reg = await handleRegistration();
    if (!reg.success) {
      setError(reg.error || "Signup failed");
      setCreatingAccount(false);
      return;
    }

    try {
      const response = await fetch("/api/payment/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName, 
          email, 
          track: role === "student" ? track : "recruiter", 
          role,
          userId: reg.userId 
        }),
      });
      
      const data = await response.json();
      if (!data?.success) throw new Error(data?.message || data?.error || "Provider error");
      
      setPaymentDetails({
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        transactionId: data.transactionId,
        localExpiry: Date.now() + 15 * 60 * 1000,
      });
      toast.success("Payment details generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate payment details");
    } finally {
      setCreatingAccount(false);
    }
  };

  const verifyPayment = async () => {
    if (!paymentDetails?.transactionId) return;
    setCheckingPayment(true);
    try {
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: paymentDetails.transactionId }),
      });
      const data = await response.json();
      
      if (data.success) {
        setPaymentConfirmed(true);
        toast.success("Payment verified successfully!");
      } else {
        toast.error("Payment not yet confirmed. Please wait a minute and try again.");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setCheckingPayment(false);
    }
  };

  // 🔥 THE FIX: Removed the redundant 2nd handleRegistration call.
  // Their account was already created in Step 1. We just need to route them!
  const handleSubmit = async () => {
    toast.success("Payment confirmed! Check your email.");
    router.push("/auth/verify-email");
  };

  const handlePaystackCheckout = async () => {
    if (!validateForm()) return;

    setInitializingPaystack(true);
    setError("");

    const reg = await handleRegistration();
    if (!reg.success) {
      setError(reg.error || "Signup failed");
      setInitializingPaystack(false);
      return;
    }

    try {
      const numericAmount = parseInt(subscriptionPrice.replace(/[^0-9]/g, ""), 10);
      
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          track: role === "student" ? track : "recruiter",
          role,
          amount: numericAmount,
          userId: reg.userId, 
          callback_url: `${window.location.origin}/auth/verify-email` 
        }),
      });

      if (!res.ok) throw new Error("Failed to initialize payment API");

      const data = await res.json();

      if (data?.data?.reference) {
        const paystack = new PaystackPop();
        paystack.newTransaction({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: email,
          amount: numericAmount * 100, // Kobo
          reference: data.data.reference,
          onSuccess: (transaction: any) => {
            toast.success("Payment successful!");
            router.push("/auth/verify-email");
          },
          onCancel: () => {
            toast.error("Payment cancelled.");
            setInitializingPaystack(false);
          },
        });
      } else {
        throw new Error("Failed to get payment reference");
      }
    } catch (err) {
      toast.error("Payment setup failed. Please try again.");
      setInitializingPaystack(false);
    }
  };

  const handleMainAction = () => {
    if (paymentMethod === "paystack") {
      handlePaystackCheckout();
      return;
    }

    if (!paymentDetails?.accountNumber || timerExpired) {
      createPaymentAccount();
      return;
    }

    if (paymentConfirmed) {
      handleSubmit();
      return;
    }

    toast.error("Please verify your payment first");
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(paymentDetails?.accountNumber || "");
      toast.success("Copied!");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard title="Join WDC Labs" onClose={() => router.back()}>
          <div className="space-y-4">
            {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg font-medium">{error}</div>}
            <RoleToggle value={role} onChange={(r) => { setRole(r); setPaymentDetails(null); }} />
            <div className="space-y-3">
              <AuthInput label="Full Name" placeholder="John Doe" value={fullName} onChange={setFullName} />
              <AuthInput label="Email" type="email" placeholder="john@example.com" value={email} onChange={setEmail} />
              <AuthInput label="Password" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
              <AuthSelect label="Country" value={country} onChange={setCountry} options={countryOptions} placeholder="Select Country" />
              {role === "student" && (
                <>
                  <AuthSelect label="Track" value={track} onChange={(t) => { setTrack(t); setPaymentDetails(null); }} options={tracks} />
                  <AuthSelect label="Experience" value={experienceLevel} onChange={setExperienceLevel} options={experienceLeveloptions} />
                </>
              )}
            </div>
            <div className="flex justify-between items-center py-2 px-1 border-b border-border/40 font-semibold">
              <span className="text-sm text-muted-foreground font-medium">Subscription Fee</span>
              <span className="text-lg font-bold text-primary">{subscriptionPrice}</span>
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-muted-foreground">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setPaymentMethod("transfer")} className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${paymentMethod === "transfer" ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                  <Banknote size={16} /> Transfer
                </button>
                <button type="button" onClick={() => { setPaymentMethod("paystack"); setPaymentDetails(null); }} className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${paymentMethod === "paystack" ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                  <CreditCard size={16} /> Paystack
                </button>
              </div>
            </div>
            <TermsAgreement wdcPrivacy={wdcPrivacy} onWdcPrivacyChange={setWdcPrivacy} />
            {paymentMethod === "transfer" && paymentDetails && (
              <div className="border border-border/60 rounded-xl p-5 bg-muted/20 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Transfer Details</span>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border ${timerExpired ? 'border-destructive/50 text-destructive' : 'border-primary/30 text-primary'} shadow-sm`}>
                    <Clock size={12} className={timerExpired ? "" : "animate-pulse"} />
                    <span className="text-xs font-mono font-bold">{formattedTime}</span>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between opacity-80"><span>Bank</span><span className="font-semibold text-right">Parallex Bank</span></div>
                  <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/40">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Account</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base tracking-tighter">{paymentDetails.accountNumber}</span>
                      <button type="button" onClick={copyAccount} className="p-1 hover:bg-muted rounded transition-colors"><Copy size={14} /></button>
                    </div>
                  </div>
                  <div className="flex justify-between items-start pt-1">
                    <span className="opacity-80">Name</span>
                    <span className="font-semibold text-right max-w-[180px] leading-tight">{paymentDetails.accountName}</span>
                  </div>
                </div>
                <Button type="button" onClick={verifyPayment} disabled={checkingPayment || timerExpired || paymentConfirmed} className="w-full font-bold shadow-md h-10">
                  {checkingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : paymentConfirmed ? "Verified" : "Verify Payment"}
                </Button>
                {timerExpired && <div className="flex items-center justify-center gap-2 text-destructive text-[11px] font-bold animate-pulse uppercase"><AlertCircle size={14} /> Account Expired</div>}
              </div>
            )}
            
            {/* 🔥 THE FIX: Removed the global isLoading from the disabled array so it never state-locks the button */}
            <Button 
              type="button" 
              className="w-full h-12 text-base font-bold transition-all shadow-lg" 
              disabled={creatingAccount || initializingPaystack || (paymentMethod === "transfer" && paymentDetails !== null && !paymentConfirmed && timerExpired)} 
              onClick={handleMainAction}
            >
              {creatingAccount || initializingPaystack ? <Loader2 className="w-5 h-5 animate-spin" /> : 
               paymentMethod === "paystack" ? "Pay with Paystack" : 
               paymentDetails === null || timerExpired ? "Generate Payment Details" : 
               paymentConfirmed ? "Register Now" : "Awaiting Payment..."}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground pb-2">
              Have an account? <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">Login</Link>
            </p>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

const SignUp = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>}>
    <SignUpContent />
  </Suspense>
);

export default SignUp;