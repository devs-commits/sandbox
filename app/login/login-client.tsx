"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContexts";
import { toast } from "sonner";
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";

const roles = [
  { value: "student", label: "Student" },
  { value: "recruiter", label: "Recruiter" },
  { value: "admin", label: "Admin" },
  { value: "enterprise", label: "Enterprise" },
];

const LoginContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { login } = useAuth(); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchParam = useSearchParams();
  const from = searchParam.get("from");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    const result = await login(email, password, role);

    if (result.success) {
      toast.success("Login successful!");
      
      if (from) {
        router.push(from);
      } else {
        const roleRedirects: Record<string, string> = {
          student: "/student/headquarters",
          recruiter: "/recruiter/talent-market",
          admin: "/admin/dashboard",
          enterprise: "enterprise/white-label",
        };
        router.push(roleRedirects[role] || "/student/headquarters");
      }
    } else {
      setError(result.error || "Login failed");
      toast.error(result.error || "Login failed");
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="min-h-screen flex bg-background w-full">
      
      {/* 🔥 1/3 LEFT PANEL: Sticky positioning & Gradient Text */}
      <div className="hidden lg:flex flex-col w-1/3 bg-primary/5 border-r border-border p-12 justify-between relative overflow-hidden h-screen sticky top-0">
        {/* Background decorative blob */}
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
              Welcome Back.<br/>Let's Get to Work.
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Pick up exactly where you left off. Your virtual desk, pending tasks, and squad are waiting for you.
            </p>
            
            <ul className="space-y-5">
              <li className="flex items-center gap-3 text-foreground font-medium">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                Resume your simulated tasks
              </li>
              <li className="flex items-center gap-3 text-foreground font-medium">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                Review AI-powered feedback
              </li>
              <li className="flex items-center gap-3 text-foreground font-medium">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                Check your portfolio growth
              </li>
              <li className="flex items-center gap-3 text-foreground font-medium">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                Connect with your Squad
              </li>
            </ul>
          </div>
        </div>
        
        <div className="relative z-10 text-sm font-medium text-muted-foreground">
          © {new Date().getFullYear()} WDC Labs. All rights reserved.
        </div>
      </div>

      {/* 🔥 2/3 RIGHT PANEL: The Form */}
      <div className="w-full lg:w-2/3 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 relative min-h-screen">
        
        {/* Close Button */}
        <button 
          onClick={() => router.push("/")} 
          className="absolute top-6 right-6 p-2 bg-secondary text-muted-foreground rounded-full hover:bg-secondary/80 hover:text-foreground transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="text-center lg:text-left space-y-2 mb-8">
            <h1 className="text-3xl font-black text-foreground">Sign In</h1>
            <p className="text-muted-foreground">Access your WDC Labs virtual office.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg font-medium flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="space-y-5">
              <AuthInput 
                label="Email Address" 
                type="email" 
                placeholder="e.g. john@example.com" 
                value={email} 
                onChange={setEmail} 
              />
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-muted-foreground">Password</label>
                  <Link href="/forgot-password" className="text-xs text-primary font-bold hover:underline underline-offset-4 transition-all">
                    Forgot Password?
                  </Link>
                </div>
                <AuthInput 
  label="" 
  type="password" 
  placeholder="Enter your password" 
  value={password} 
  onChange={setPassword} 
/>
              </div>
              
              <AuthSelect 
                label="Account Type" 
                value={role} 
                onChange={setRole} 
                options={roles} 
                placeholder="Select Role" 
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-14 text-base font-bold transition-all shadow-lg mt-6" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Log into Virtual Office"
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground pt-6">
              Don't have an account yet?{" "}
              <Link href="/signup" className="text-primary font-bold hover:underline underline-offset-4 transition-all">
                Sign up here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

// Wrapped in Suspense because of useSearchParams
const Login = () => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" /></div>}>
    <LoginContent />
  </Suspense>
);

export default Login;