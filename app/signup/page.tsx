"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Copy, Clock, AlertCircle, CreditCard, Banknote, X, CheckCircle2 } from "lucide-react";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { RoleToggle } from "../components/auth/RoleToggle";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContexts";
import { toast } from "sonner";
import * as countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { TermsAgreement } from "../components/auth/TermsAgreement";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

countries.registerLocale(enLocale);
declare const PaystackPop: any;

interface SignupData {
  fullName: string;
  email: string;
  phone: string; 
  password: string;
  role: "student" | "recruiter"; 
  country: string;
  track?: string;
  experienceLevel?: string;
  referralLink?: string;
  squadSlug?: string;
  subscriptionPlan: string;
}

const tracks = [
  { value: "digital-marketing", label: "Digital Marketing" },
  { value: "data-analytics", label: "Data Analytics" },
  { value: "cyber-security", label: "Cyber Security" },
];

type PaymentDetails = {
  accountNumber: string;
  accountName: string;
  localExpiry: number;
  transactionId: string;
};

// Safely extract the cached cookies
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const SignUpContent = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [subscriptionPlan, setSubscriptionPlan] = useState<"monthly" | "quarterly">("monthly");
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "paystack">("transfer");
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string>(""); 
  const [defaultCountryCode, setDefaultCountryCode] = useState<any>("NG"); 
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [track, setTrack] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  
  // Referral & Squad States
  const [referralLink, setReferralLink] = useState("");
  const [squadSlug, setSquadSlug] = useState("");
  const [hasValidReferral, setHasValidReferral] = useState(false);
  
  // 🔥 NEW: Referral Verification States
  const [isVerifyingReferral, setIsVerifyingReferral] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [verifiedReferralName, setVerifiedReferralName] = useState("");

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [initializingPaystack, setInitializingPaystack] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [wdcPrivacy, setWdcPrivacy] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [trialDays, setTrialDays] = useState<number>(0); 
  const [couponError, setCouponError] = useState("");
  const [isProcessingTrial, setIsProcessingTrial] = useState(false);

  useEffect(() => {
    const fetchCountryCode = async () => {
      try {
        const res = await fetch("https://ipapi.co/country/");
        if (res.ok) {
          const code = await res.text();
          setDefaultCountryCode(code.trim());
        }
      } catch (err) {
        console.error("Could not fetch geolocation for flag.", err);
      }
    };
    fetchCountryCode();
  }, []);

  const countryOptions = useMemo(() => {
    const countryNames = countries.getNames("en", { select: "official" });
    return Object.entries(countryNames)
      .map(([code, name]) => ({ value: code.toLowerCase(), label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const numericAmount = subscriptionPlan === "quarterly" ? 40500 : 15000;
  const subscriptionPrice = `₦ ${numericAmount.toLocaleString()}`;

  const experienceLeveloptions = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const displayRecommender = useMemo(() => {
    if (verifiedReferralName) return verifiedReferralName;
    if (!referralLink) return "";
    const baseName = referralLink.split('-')[0]; 
    return baseName.charAt(0).toUpperCase() + baseName.slice(1).toLowerCase(); 
  }, [referralLink, verifiedReferralName]);

  useEffect(() => {
    const promoFromUrl = searchParams.get("promo") || searchParams.get("coupon");
    if (promoFromUrl) {
      const normalizedCode = promoFromUrl.trim().toUpperCase();
      setCouponCode(normalizedCode);
      if (normalizedCode === "WDCLABS14") {
        setIsCouponApplied(true);
        setTrialDays(14);
        setCouponError("");
        toast.success("🎉 Promo Link Active! Your 14-day free trial is unlocked.");
      } else if (normalizedCode === "FIRSTTASK") {
        setIsCouponApplied(true);
        setTrialDays(7);
        setCouponError("");
        toast.success("🎉 Promo Link Active! Your 7-day free trial is unlocked.");
      }
    }

    const refFromUrl = searchParams.get("ref");
    const refFromCookie = getCookie("wdc_referral_id");
    const activeReferral = refFromUrl || refFromCookie;
    
    const squadFromUrl = searchParams.get("squad");
    const squadFromCookie = getCookie("wdc_squad_id");
    
    if (typeof document !== 'undefined') {
      if (refFromUrl) document.cookie = `wdc_referral_id=${refFromUrl}; path=/; max-age=86400`;
      if (squadFromUrl) document.cookie = `wdc_squad_id=${squadFromUrl}; path=/; max-age=86400`;
    }

    const activeSquad = squadFromUrl || squadFromCookie;

    if (activeReferral) {
      setReferralLink(activeReferral);
      setHasValidReferral(true);
    }

    if (activeSquad) {
      setSquadSlug(activeSquad);
    }
  }, [searchParams]);

  useEffect(() => {
    const localExpiry = paymentDetails?.localExpiry;
    if (!localExpiry) return;
    
    const updateTimer = () => {
      const diff = localExpiry - Date.now();
      if (diff <= 0) {
        setSecondsLeft(0);
        return;
      }
      setSecondsLeft(Math.floor(diff / 1000));
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [paymentDetails?.localExpiry]);

  const formattedTime = secondsLeft === null ? "--:--" : 
    `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, "0")}`;

  const timerExpired = secondsLeft === 0;

  const validateForm = () => {
    if (!fullName || !email || !phone || !password || !country || (role === "student" && (!track || !experienceLevel))) {
      toast.error("Please fill in all details first, including your phone number.");
      return false;
    }
    if (!wdcPrivacy) {
      toast.error("Please agree to the terms and privacy policy");
      return false;
    }
    return true;
  };

  const handleRegistration = async () => {
    const trialPlanString = trialDays === 7 ? "trial_7" : "trial";
    
    const signupPayload: SignupData = {
      fullName, 
      email, 
      phone, 
      password, 
      role, 
      country,
      track: role === "student" ? track : undefined,
      experienceLevel: role === "student" ? experienceLevel : undefined,
      referralLink: role === "student" && referralLink && hasValidReferral ? referralLink : undefined,
      squadSlug: role === "student" && squadSlug ? squadSlug : undefined, 
      subscriptionPlan: isCouponApplied ? trialPlanString : subscriptionPlan, 
    };

    const result = await signup(signupPayload);

    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, userId: (result as any).user?.id || (result as any).data?.user?.id };
  };

  const handleApplyCoupon = () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (normalizedCode === "WDCLABS14") {
      setIsCouponApplied(true);
      setTrialDays(14);
      setCouponError("");
      toast.success("🎉 WDCLABS14 Applied! 14-day free trial unlocked.");
    } else if (normalizedCode === "FIRSTTASK") {
      setIsCouponApplied(true);
      setTrialDays(7);
      setCouponError("");
      toast.success("🎉 FIRSTTASK Applied! 7-day free trial unlocked.");
    } else {
      setIsCouponApplied(false);
      setCouponError("Invalid coupon code. Please try again.");
    }
  };

  // 🔥 NEW: Function to verify the referral code with your backend
  const handleVerifyReferral = async () => {
    if (!referralLink.trim()) {
      setReferralError("Please enter a referral code.");
      return;
    }
    
    setIsVerifyingReferral(true);
    setReferralError("");

    try {
      // Connect this to your actual backend endpoint to check the code
      const res = await fetch(`/api/auth/verify-referral?code=${referralLink}`);
      const data = await res.json();

      if (data.success) {
        setHasValidReferral(true);
        if (data.inviterName) setVerifiedReferralName(data.inviterName);
        toast.success("🎉 Referral code verified!");
      } else {
        setHasValidReferral(false);
        setReferralError(data.error || "Invalid referral code. Please check and try again.");
      }
    } catch (err) {
      // If endpoint doesn't exist yet, we can fallback to accepting it optimistically,
      // or strictly show an error. Here we show an error.
      setReferralError("Failed to verify code. Please try again later.");
    } finally {
      setIsVerifyingReferral(false);
    }
  };

  const clearReferralCookies = () => {
    if (typeof document !== 'undefined') {
      document.cookie = "wdc_referral_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "wdc_squad_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  };

  const handleTrialBypass = async () => {
    if (!validateForm()) return;
    setIsProcessingTrial(true);
    setError("");

    try {
      toast.info(`Activating your ${trialDays}-Day Free Trial...`, { id: "trial" });
      const reg = await handleRegistration();
      if (!reg.success) throw new Error(reg.error || "Signup failed");

      clearReferralCookies(); 

      toast.success("Trial Activated! Check your email to verify.", { id: "trial" });
      router.push("/auth/verify-email");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong activating your trial.", { id: "trial" });
    } finally {
      setIsProcessingTrial(false);
    }
  };

  const createPaymentAccount = async () => {
    if (!validateForm()) return;
    setCreatingAccount(true);
    setError("");

    try {
      const response = await fetch("/api/payment/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, track: role === "student" ? track : "recruiter", role, subscriptionPlan }),
      });
      
      const data = await response.json();
      if (!data?.success) throw new Error(data?.message || data?.error || "Provider error");
      
      setPaymentDetails({
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        transactionId: data.transactionId,
        localExpiry: Date.now() + 15 * 60 * 1000,
      });
      toast.success("Payment details generated");
    } catch (err: any) {
      setError(err.message || "Failed to generate payment details");
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
        toast.success("Payment verified successfully. You can now register.");
      } else {
        toast.error("Payment not yet confirmed. Please wait a minute and try again.");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleSubmit = async () => {
    if (!paymentDetails?.transactionId) return;
    setCreatingAccount(true);

    try {
      toast.info("Registering your account...", { id: "reg" });
      const reg = await handleRegistration();
      if (!reg.success) throw new Error(reg.error || "Signup failed");

      const res = await fetch("/api/auth/finalize-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: paymentDetails.transactionId, userId: reg.userId }),
      });

      const data = await res.json();
      if (data.success) {
        clearReferralCookies(); 
        toast.success("Registration complete. Check your email.", { id: "reg" });
        router.push("/auth/verify-email");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while finalizing.");
    } finally {
      setCreatingAccount(false);
    }
  };

  const handlePaystackCheckout = async () => {
    if (!validateForm()) return;
    setInitializingPaystack(true);
    setError("");

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email, fullName, phone, track: role === "student" ? track : "recruiter", role,
          amount: numericAmount, subscriptionPlan,
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
          amount: numericAmount * 100,
          reference: data.data.reference,
          onSuccess: async (transaction: any) => {
            toast.success("Payment received. Setting up your profile...");
            const reg = await handleRegistration();
            if (!reg.success) {
                toast.error("Profile creation failed, but payment received. Contact support.");
                return;
            }

            await fetch("/api/paystack/verify", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ reference: transaction.reference, userId: reg.userId })
            });

            clearReferralCookies();

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
    if (paymentMethod === "paystack") return handlePaystackCheckout();
    if (!paymentDetails?.accountNumber || timerExpired) return createPaymentAccount();
    if (paymentConfirmed) return handleSubmit();
    toast.error("Please verify your payment first");
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(paymentDetails?.accountNumber || "");
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="min-h-screen flex bg-background w-full">
      
      {/* 🔥 1/3 LEFT PANEL */}
      <div className="hidden lg:flex flex-col w-1/3 bg-primary/5 border-r border-border p-12 justify-between relative overflow-hidden h-screen sticky top-0">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
           <div className="absolute -top-[20%] -left-[20%] w-[70%] h-[50%] rounded-full bg-primary/20 blur-3xl"></div>
           <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-3xl"></div>
        </div>

        <div className="relative z-10 space-y-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black tracking-tight text-primary">WDC Labs</span>
          </Link>
          
          <div className="pt-12">
            <h1 className="text-4xl font-black mb-6 leading-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent pb-1">
              Build Real Experience.<br/> Get Hired Faster.
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Join the elite ecosystem where theory meets practice. Execute real-world tasks, build an undeniable portfolio, and connect with top recruiters.
            </p>
            
            <ul className="space-y-5">
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> Industry-simulated daily tasks</li>
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> AI-powered feedback & grading</li>
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> Automated CV & Portfolio generation</li>
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> Squad accountability & networking</li>
            </ul>
          </div>
        </div>
        
        <div className="relative z-10 text-sm font-medium text-muted-foreground">
          © {new Date().getFullYear()} WDC Labs. All rights reserved.
        </div>
      </div>

      {/* 🔥 2/3 RIGHT PANEL */}
      <div className="w-full lg:w-2/3 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 relative min-h-screen">
        
        <button onClick={() => router.back()} className="absolute top-6 right-6 p-2 bg-secondary text-muted-foreground rounded-full hover:bg-secondary/80 hover:text-foreground transition-colors z-20">
          <X className="w-5 h-5" />
        </button>

        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 lg:pb-0">
          
          <div className="lg:hidden text-center space-y-2 mb-8">
            <h1 className="text-3xl font-black text-foreground">Join WDC Labs</h1>
            <p className="text-muted-foreground">Kickstart your tech career today.</p>
          </div>

          <div className="space-y-6">
            {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg font-medium">{error}</div>}
            
            <div className="flex justify-center lg:justify-start">
               <RoleToggle value={role} onChange={(r) => { setRole(r); setPaymentDetails(null); }} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <AuthInput label="Full Name" placeholder="e.g. John Doe" value={fullName} onChange={setFullName} />
              <AuthInput label="Email Address" type="email" placeholder="e.g. john@example.com" value={email} onChange={setEmail} />
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-muted-foreground">Phone Number</label>
                <div className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-primary">
                  <PhoneInput
                    international
                    defaultCountry={defaultCountryCode}
                    value={phone}
                    onChange={(val) => setPhone(val || "")}
                    className="w-full bg-transparent outline-none border-none phone-input-global"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <AuthInput label="Password" type="password" placeholder="Create a strong password" value={password} onChange={setPassword} />
              <AuthSelect label="Country of Residence" value={country} onChange={setCountry} options={countryOptions} placeholder="Select Country" />
              
              {role === "student" && (
                <>
                  <AuthSelect label="Learning Track" value={track} onChange={(t) => { setTrack(t); setPaymentDetails(null); }} options={tracks} />
                  <AuthSelect label="Experience Level" value={experienceLevel} onChange={setExperienceLevel} options={experienceLeveloptions} />
                </>
              )}
            </div>

            {/* 🔥 UPDATED: Referrals & Squads Section */}
            {role === "student" && (
              <div className="space-y-3">
                {!hasValidReferral ? (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Referral Code (Optional)</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        placeholder="Did someone invite you? Enter code" 
                        value={referralLink}
                        onChange={(e) => {
                          setReferralLink(e.target.value);
                          setReferralError("");
                        }}
                        className="flex h-11 w-full rounded-md border border-input bg-secondary px-4 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <Button 
                        type="button" 
                        onClick={handleVerifyReferral} 
                        variant="secondary" 
                        className="h-11 px-6 font-bold"
                        disabled={isVerifyingReferral || !referralLink.trim()}
                      >
                        {isVerifyingReferral ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                      </Button>
                    </div>
                    {referralError && <p className="text-red-500 text-xs font-medium">{referralError}</p>}
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1">
                      <span><span className="text-lg mr-2">🎉</span> You were invited by <strong className="font-bold tracking-wider">{displayRecommender}</strong></span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setHasValidReferral(false);
                          setReferralLink("");
                          setVerifiedReferralName("");
                        }} 
                        className="text-indigo-500 hover:text-indigo-700 transition-colors"
                      >
                        <X size={18} />
                      </button>
                  </div>
                )}

                {squadSlug && (
                  <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-lg text-sm font-bold animate-in fade-in">
                    🛡️ Squad Invite detected! You will be added automatically after payment.
                  </div>
                )}
              </div>
            )}

            {/* Coupon Section */}
            {!squadSlug && (
              <div className="space-y-2 pt-6 border-t border-border/40">
                {!isCouponApplied ? (
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Have a Promo Code?</label>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        placeholder="Enter discount code" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-input bg-secondary px-4 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <Button type="button" onClick={handleApplyCoupon} variant="secondary" className="h-11 px-6 font-bold">
                        Apply
                      </Button>
                    </div>
                    {couponError && <p className="text-red-500 text-xs font-medium">{couponError}</p>}
                  </div>
                ) : (
                  <div className="p-4 bg-green-500/10 text-green-600 rounded-lg border border-green-500/30 text-sm font-bold flex justify-between items-center">
                    <span>🎉 {couponCode.toUpperCase()} Applied! (Trial)</span>
                    <button type="button" onClick={() => setIsCouponApplied(false)} className="text-green-600 hover:text-green-700 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Blocks */}
            {!isCouponApplied && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-3 pt-4">
                  <label className="text-sm font-semibold text-muted-foreground">Subscription Plan</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => { setSubscriptionPlan("monthly"); setPaymentDetails(null); }} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${subscriptionPlan === "monthly" ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                      <span className="text-sm font-bold">Monthly</span>
                      <span className="text-xs font-medium mt-1">₦ 15,000 / mo</span>
                    </button>
                    <button type="button" onClick={() => { setSubscriptionPlan("quarterly"); setPaymentDetails(null); }} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all relative overflow-hidden ${subscriptionPlan === "quarterly" ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                      <div className="absolute top-0 right-0 bg-primary text-[10px] text-white px-2 py-0.5 font-bold rounded-bl-lg">SAVE</div>
                      <span className="text-sm font-bold">Quarterly</span>
                      <span className="text-xs font-medium mt-1">₦ 40,500 / 3 mos</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col p-5 mt-5 bg-secondary/50 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-sm text-muted-foreground font-medium">Total Fee</span>
                    <div className="text-right">
                      {subscriptionPlan === "quarterly" && (
                        <div className="text-xs text-muted-foreground line-through mb-0.5">Regular Price: ₦ 45,000</div>
                      )}
                      <span className="text-2xl font-black text-primary">
                        {subscriptionPrice}
                      </span>
                    </div>
                  </div>
                  {subscriptionPlan === "quarterly" && (
                    <div className="flex justify-end mt-2">
                      <span className="bg-green-500/10 text-green-600 text-xs px-2.5 py-1 rounded-full font-bold">
                        Total Savings: ₦ 4,500
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-6">
                  <label className="text-sm font-semibold text-muted-foreground">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setPaymentMethod("transfer")} className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-bold transition-all ${paymentMethod === "transfer" ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                      <Banknote size={18} /> Bank Transfer
                    </button>
                    <button type="button" onClick={() => { setPaymentMethod("paystack"); setPaymentDetails(null); }} className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 text-sm font-bold transition-all ${paymentMethod === "paystack" ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                      <CreditCard size={18} /> Paystack
                    </button>
                  </div>
                </div>
                
                {paymentMethod === "transfer" && paymentDetails && (
                  <div className="border-2 border-primary/20 rounded-2xl p-6 bg-primary/5 space-y-5 mt-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Transfer Details</span>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border shadow-sm ${timerExpired ? 'border-destructive/50 text-destructive' : 'border-primary/30 text-primary'}`}>
                        <Clock size={14} className={timerExpired ? "" : "animate-pulse"} />
                        <span className="text-sm font-mono font-bold">{formattedTime}</span>
                      </div>
                    </div>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between opacity-80"><span>Bank</span><span className="font-semibold text-right">Parallex Bank</span></div>
                      <div className="flex justify-between items-center bg-background p-4 rounded-xl border shadow-sm">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Account</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xl tracking-tight">{paymentDetails.accountNumber}</span>
                          <button type="button" onClick={copyAccount} className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"><Copy size={16} /></button>
                        </div>
                      </div>
                      <div className="flex justify-between items-start pt-1">
                        <span className="opacity-80">Name</span>
                        <span className="font-bold text-right max-w-[180px] leading-tight">{paymentDetails.accountName}</span>
                      </div>
                    </div>
                    <Button type="button" onClick={verifyPayment} disabled={checkingPayment || timerExpired || paymentConfirmed} className="w-full font-bold shadow-md h-12 text-base mt-2">
                      {checkingPayment ? <Loader2 className="w-5 h-5 animate-spin" /> : paymentConfirmed ? "Payment Verified" : "I have transferred"}
                    </Button>
                    {timerExpired && <div className="flex items-center justify-center gap-2 text-destructive text-xs font-bold animate-pulse uppercase mt-3"><AlertCircle size={16} /> Account Expired</div>}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <TermsAgreement wdcPrivacy={wdcPrivacy} onWdcPrivacyChange={setWdcPrivacy} />
            </div>

            {isCouponApplied ? (
              <Button 
                type="button" 
                className="w-full h-14 text-base font-bold transition-all shadow-lg bg-green-600 hover:bg-green-700 text-white mt-4" 
                disabled={isProcessingTrial} 
                onClick={handleTrialBypass}
              >
                {isProcessingTrial ? <Loader2 className="w-6 h-6 animate-spin" /> : `Start ${trialDays}-Day Free Trial`}
              </Button>
            ) : (
              <Button 
                type="button" 
                className="w-full h-14 text-base font-bold transition-all shadow-lg mt-4" 
                disabled={creatingAccount || initializingPaystack || (paymentMethod === "transfer" && paymentDetails !== null && !paymentConfirmed && timerExpired)} 
                onClick={handleMainAction}
              >
                {creatingAccount || initializingPaystack ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                paymentMethod === "paystack" ? "Proceed to Checkout" : 
                paymentDetails === null || timerExpired ? "Generate Payment Details" : 
                paymentConfirmed ? "Complete Registration" : "Awaiting Payment..."}
              </Button>
            )}

            <p className="text-center text-sm text-muted-foreground pt-6">
              Already have an account? <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">Log in here</Link>
            </p>
          </div>
        </div>
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