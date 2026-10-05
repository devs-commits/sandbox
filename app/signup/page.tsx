"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, X, CheckCircle2 } from "lucide-react";
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
  const [isVerifyingReferral, setIsVerifyingReferral] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [verifiedReferralName, setVerifiedReferralName] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [wdcPrivacy, setWdcPrivacy] = useState(false);

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
    const refFromUrl = searchParams.get("ref");
    const refFromCookie = getCookie("wdc_referral_id");
    const activeReferral = refFromUrl || refFromCookie;
    
    const squadFromUrl = searchParams.get("squad");
    const squadFromCookie = getCookie("wdc_squad_id");
    
    if (typeof document !== 'undefined') {
      if (refFromUrl) document.cookie = `wdc_referral_id=${refFromUrl}; path=/; max-age=86400`;
      if (squadFromUrl) document.cookie = `wdc_squad_id=${squadFromUrl}; path=/; max-age=86400`;
    }

    if (activeReferral) {
      setReferralLink(activeReferral);
      setHasValidReferral(true);
    }
    if (squadFromUrl || squadFromCookie) {
      setSquadSlug(squadFromUrl || squadFromCookie || "");
    }
  }, [searchParams]);

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

  const handleVerifyReferral = async () => {
    if (!referralLink.trim()) {
      setReferralError("Please enter a referral code.");
      return;
    }
    setIsVerifyingReferral(true);
    setReferralError("");

    try {
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

  const handleRegistration = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);
    setError("");

    try {
      toast.info("Setting up your Free Week...", { id: "reg" });
      
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
        subscriptionPlan: "trial_7", // Automatically grants free week
      };

      const result = await signup(signupPayload);

      if (!result.success) throw new Error(result.error || "Signup failed");

      clearReferralCookies(); 
      toast.success("Account created! Check your email to verify.", { id: "reg" });
      router.push("/auth/verify-email");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during registration.", { id: "reg" });
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background w-full">
      
      {/* 1/3 LEFT PANEL */}
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
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> Start immediately with a Free Week</li>
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> AI-powered feedback & grading</li>
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> Automated CV & Portfolio generation</li>
              <li className="flex items-center gap-3 text-foreground font-medium"><CheckCircle2 className="w-6 h-6 text-primary" /> No credit card required upfront</li>
            </ul>
          </div>
        </div>
        
        <div className="relative z-10 text-sm font-medium text-muted-foreground">
          © {new Date().getFullYear()} WDC Labs. All rights reserved.
        </div>
      </div>

      {/* 2/3 RIGHT PANEL */}
      <div className="w-full lg:w-2/3 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 relative min-h-screen">
        
        <button onClick={() => router.back()} className="absolute top-6 right-6 p-2 bg-secondary text-muted-foreground rounded-full hover:bg-secondary/80 hover:text-foreground transition-colors z-20">
          <X className="w-5 h-5" />
        </button>

        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 lg:pb-0">
          
          <div className="lg:hidden text-center space-y-2 mb-8">
            <h1 className="text-3xl font-black text-foreground">Join WDC Labs</h1>
            <p className="text-muted-foreground">Your first week is completely free.</p>
          </div>

          <div className="space-y-6">
            {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg font-medium">{error}</div>}
            
            <div className="flex justify-center lg:justify-start">
               <RoleToggle value={role} onChange={setRole} />
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
                  <AuthSelect label="Learning Track" value={track} onChange={setTrack} options={tracks} />
                  <AuthSelect label="Experience Level" value={experienceLevel} onChange={setExperienceLevel} options={experienceLeveloptions} />
                </>
              )}
            </div>

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
              </div>
            )}

            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-3 pt-4 border-t border-border/40">
                <label className="text-sm font-semibold text-muted-foreground">After Free Week, I prefer to be billed:</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setSubscriptionPlan("monthly")} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${subscriptionPlan === "monthly" ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                    <span className="text-sm font-bold">Monthly</span>
                    <span className="text-xs font-medium mt-1">₦ 15,000 / mo</span>
                  </button>
                  <button type="button" onClick={() => setSubscriptionPlan("quarterly")} className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all relative overflow-hidden ${subscriptionPlan === "quarterly" ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:bg-muted/50 text-muted-foreground"}`}>
                    <div className="absolute top-0 right-0 bg-primary text-[10px] text-white px-2 py-0.5 font-bold rounded-bl-lg">SAVE</div>
                    <span className="text-sm font-bold">Quarterly</span>
                    <span className="text-xs font-medium mt-1">₦ 40,500 / 3 mos</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col p-5 mt-5 bg-secondary/50 rounded-xl border border-border/50">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-sm text-muted-foreground font-medium">Due Today</span>
                  <span className="text-2xl font-black text-emerald-500">₦ 0.00</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <TermsAgreement wdcPrivacy={wdcPrivacy} onWdcPrivacyChange={setWdcPrivacy} />
            </div>

            <Button 
              type="button" 
              className="w-full h-14 text-base font-bold transition-all shadow-lg bg-primary hover:bg-primary/90 text-white mt-4" 
              disabled={isProcessing} 
              onClick={handleRegistration}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Start Your Free Week"}
            </Button>

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