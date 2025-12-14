import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { AuthSelect } from "../components/auth/AuthSelect";
import { Button } from "../components/ui/button";
import {useAuth} from "../contexts/AuthContexts";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

const roles = [
  { value: "student", label: "Student" },
  { value: "recruiter", label: "Recruiter" },
  { value: "admin", label: "Admin" },
  { value: "enterprise", label: "Enterprise" },
];

const ForgotPassword = () => {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    const result = await forgotPassword(email, role);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success("Reset link sent to your email!");
    } else {
      setError(result.error || "Failed to send reset link");
      toast.error(result.error || "Failed to send reset link");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthCard title="Check Your Email" onClose={() => router.push("/login")}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?{" "}
                <button onClick={() => setIsSuccess(false)} className="text-primary hover:underline">try again</button>
              </p>
              <Link href="/login" className="inline-block text-sm text-primary hover:underline">Back to Login</Link>
            </div>
          </AuthCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6">Forgot Password</h1>
        
        <AuthCard title="Forgot Password" onClose={() => router.push("/login")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Enter the email linked to your account and we'll send you a reset link.
            </p>
            
            <AuthInput label="Email" type="email" placeholder="john@example.com" value={email} onChange={setEmail} />
            <AuthSelect label="Roles" value={role} onChange={setRole} options={roles} placeholder="Select Role" />
            
            <Button type="submit" className="w-full mt-4" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
            
            <p className="text-center">
              <Link href="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default ForgotPassword;