"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContexts";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(newPassword, token || undefined);
    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      toast.success("Password updated successfully!");
    } else {
      setError(result.error || "Failed to reset password");
      toast.error(result.error || "Failed to reset password");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthCard title="Password Updated" onClose={() => router.push("/login")}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <p className="text-muted-foreground">
                Your password has been successfully updated.
              </p>
              <Button onClick={() => router.push("/login")} className="w-full">Go to Login</Button>
            </div>
          </AuthCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6">New password</h1>
        
        <AuthCard title="Create a New Password" onClose={() => router.push("/login")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Create a strong password with at least 8 characters.
            </p>
            
            <AuthInput label="New Password" type="password" placeholder="Enter new password" value={newPassword} onChange={setNewPassword} />
            <AuthInput label="Confirm Password" type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={setConfirmPassword} />
            
            <Button type="submit" className="w-full mt-4" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default ResetPassword;