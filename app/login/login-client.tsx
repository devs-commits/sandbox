"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContexts";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const roles = [
  { value: "student", label: "Student" },
  { value: "recruiter", label: "Recruiter" },
  { value: "admin", label: "Admin" },
  { value: "enterprise", label: "Enterprise" },
];

const Login = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");

  const searchParam = useSearchParams();
  const from = searchParam.get("from");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

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
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard title="Login to WDC Labs" onClose={() => router.push("/")} className="bg-background">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            
            <AuthInput label="Email" type="email" placeholder="john@example.com" value={email} onChange={setEmail} />
            
            <div className="space-y-1">
              <AuthInput label="Password" type="password" placeholder="Enter password" value={password} onChange={setPassword} />
              <div className="text-right">
                <Link href="/forgot-password" className="text-xs text-primary hover:underline uppercase tracking-wider">
                  Forgot Password?
                </Link>
              </div>
            </div>
            
            <AuthSelect label="Roles" value={role} onChange={setRole} options={roles} placeholder="Select Role" />
            
            <Button type="submit" className="w-full mt-4" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;