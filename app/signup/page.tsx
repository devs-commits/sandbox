"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { RoleToggle } from "../components/auth/RoleToggle";
import { PaymentMethodSelector } from "../components/auth/PaymentMethodSelector";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContexts";
import { toast } from "sonner";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

const tracks = [
  { value: "digital-marketing", label: "Digital Marketing", price: "₦ 17,500" },
  { value: "data-analytics", label: "Data Analytics", price: "₦ 35,500" },
  { value: "cyber-security", label: "Cyber Security", price: "₦ 25,000" },
];

const RECRUITER_PRICE = "₦ 35,500";

const SignUp = () => {
  const router = useRouter();
  const { signup, isLoading } = useAuth();
  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [track, setTrack] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("visa");
  const [error, setError] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [referralLink, setReferralLink] = useState("");

  const countryOptions = useMemo(() => {
    const countryNames = countries.getNames("en", { select: "official" });
    return Object.entries(countryNames)
      .map(([code, name]) => ({ value: code.toLowerCase(), label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const selectedTrack = tracks.find(t => t.value === track);
  const subscriptionPrice = role === "recruiter" ? RECRUITER_PRICE : (selectedTrack?.price || "₦ 17,500");

  const experienceLeveloptions = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password || !country) {
      setError("Please fill in all required fields");
      return;
    }

    if (role === "student" && !track) {
      setError("Please select a track");
      return;
    }
    if (role === "student" && !experienceLevel){
      setError("Please select your level of experience");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    // Payment integration: Call Paystack/Stripe API here before signup

    const result = await signup({
      fullName,
      email,
      password,
      role,
      country,
      track: role === "student" ? track : undefined,
      experienceLevel: role === "student" ? experienceLevel : undefined,
      referralLink: role === "student" ? referralLink : undefined,
    });

    if (result.success) {
      toast.success("Account created successfully!");
      router.push(role === "recruiter" ? "/recruiter/talent-market" : "/student/onboarding");
    } else {
      setError(result.error || "Signup failed");
      toast.error(result.error || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <AuthCard title="Join WDC Labs" onClose={() => router.push("/")} className="bg-background">
          <form onSubmit={handleSubmit} className="space-y-4 ">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <RoleToggle value={role} onChange={setRole} />
            
            <AuthInput label="Full Name" placeholder="John Doe" value={fullName} onChange={setFullName} />
            <AuthInput label="Email" type="email" placeholder="john@example.com" value={email} onChange={setEmail} />
            <AuthInput label="Password" type="password" placeholder="Create password (min 8 characters)" value={password} onChange={setPassword} />
            <AuthSelect label="Country" value={country} onChange={setCountry} options={countryOptions} placeholder="Select Country" />
            
            {role === "student" && (
              <AuthSelect label="Select Track" value={track} onChange={setTrack} options={tracks} placeholder="Select Track" />
            )}
            {role === "student" && (
              <AuthSelect 
                label="Experience Level"
                value={experienceLevel}
                onChange={setExperienceLevel}
                options={experienceLeveloptions}
                placeholder="Select Experience Level"
              />
            )}
            <AuthInput 
              label="Referral Code (Optional)" 
              placeholder="Enter referral code" 
              value={referralLink} 
              onChange={setReferralLink} 
            />
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Monthly Subscription</span>
              <span className="text-lg font-bold text-foreground">{subscriptionPrice}</span>
            </div>
            
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
            
            <Button type="submit" className="w-full mt-4" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay Securely
                </>
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Login</Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default SignUp;