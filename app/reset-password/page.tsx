"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/auth/AuthCard";
import { AuthInput } from "../components/auth/AuthInput";
import { Button } from "../components/ui/button";

const ResetPassword = () => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    // Handle reset password logic
    console.log({ newPassword });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6">New password</h1>
        
        <AuthCard title="Create a New Password" onClose={() => router.push("/login")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the email linked to your account and we'll send you a reset link.
            </p>
            
            <AuthInput
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={setNewPassword}
            />
            
            <AuthInput
              label="Confirm Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
            
            <Button type="submit" className="w-full mt-4" size="lg">
              Update Password
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default ResetPassword;