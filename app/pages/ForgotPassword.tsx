import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { Button } from "../components/ui/button";

const roles = [
  { value: "student", label: "Student" },
  { value: "recruiter", label: "Recruiter" },
  { value: "admin", label: "Admin" },
];

const ForgotPassword = () => {
  const route = useRouter()
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle forgot password logic
    console.log({ email, role });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6">Forgot Password</h1>
        
        <AuthCard title="Forgot Password" onClose={() => route.push("/login")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the email linked to your account and we'll send you a reset link.
            </p>
            
            <AuthInput
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={setEmail}
            />
            
            <AuthSelect
              label="Roles"
              value={role}
              onChange={setRole}
              options={roles}
              placeholder="Select Role"
            />
            
            <Button type="submit" className="w-full mt-4" size="lg">
              Send Reset Link
            </Button>
            
            <p className="text-center">
              <Link 
                href="/login" 
                className="text-sm text-primary hover:underline"
              >
                Back to Login
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default ForgotPassword;
