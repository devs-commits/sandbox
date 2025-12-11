"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { Button } from "../components/ui/button"
import Link from "next/link";

const roles = [
  { value: "student", label: "Student" },
  { value: "recruiter", label: "Recruiter" },
  { value: "admin", label: "Admin" },
];

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic - redirect based on role
    if (role === "student") {
      router.push("/student/headquarters");
    } else {
      // For now, redirect all roles to student dashboard
      router.push("/student/headquarters");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6">Login</h1>
        
        <AuthCard title="Login to WDC Labs" onClose={() => router.push("/")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={setEmail}
            />
            
            <div className="space-y-1">
              <AuthInput
                label="Password"
                type="password"
                placeholder="Create password"
                value={password}
                onChange={setPassword}
              />
              <div className="text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-primary hover:underline uppercase tracking-wider"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            
            <AuthSelect
              label="Roles"
              value={role}
              onChange={setRole}
              options={roles}
              placeholder="Select Role"
            />
            
            <Button type="submit" className="w-full mt-4" size="lg">
              Login
            </Button>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;