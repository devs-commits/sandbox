"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import Link from "next/link";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { RoleToggle } from "../components/auth/RoleToggle";
import { PaymentMethodSelector } from "../components/auth/PaymentMethodSelector";
import { Button } from "../components/ui/button";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register English locale
countries.registerLocale(enLocale);

const tracks = [
  { value: "digital-marketing", label: "Digital Marketing", price: "₦ 17,500" },
  { value: "cyber-security", label: "Cyber Security", price: "₦ 35,500" },
  { value: "data-analytics", label: "Data Analytics", price: "₦ 35,500" },
  { value: "product-design", label: "Product Design", price: "₦ 25,000" },
];

const RECRUITER_PRICE = "₦ 35,500";

const Page = () => {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [track, setTrack] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("visa");

  // Get all countries sorted alphabetically
  const countryOptions = useMemo(() => {
    const countryNames = countries.getNames("en", { select: "official" });
    return Object.entries(countryNames)
      .map(([code, name]) => ({ value: code.toLowerCase(), label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const selectedTrack = tracks.find(t => t.value === track);
  const subscriptionPrice = selectedTrack?.price || "₦ 35,500";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic - redirect to student dashboard
    router.push("/student/headquarters");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard title="Join WDC Labs" onClose={() => router.push("/")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <RoleToggle value={role} onChange={setRole} />
            
            <AuthInput
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChange={setFullName}
            />
            
            <AuthInput
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={setEmail}
            />
            
            <AuthInput
              label="Password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={setPassword}
            />
            
            <AuthSelect
              label="Country"
              value={country}
              onChange={setCountry}
              options={countryOptions}
              placeholder="Select Country"
            />
            
            {role === "student" && (
              <AuthSelect
                label="Select Track"
                value={track}
                onChange={setTrack}
                options={tracks}
                placeholder="Select Track"
              />
            )}
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Monthly Subscription</span>
              <span className="text-lg font-bold text-foreground">{subscriptionPrice}</span>
            </div>
            
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
            
            <Button type="submit" className="w-full mt-4" size="lg">
              <Lock className="w-4 h-4 mr-2" />
              Pay Securely
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
        </AuthCard>
      </div>
    </div>
  );
};

export default Page;