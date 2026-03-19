"use client";

import { Mail } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">

        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold">
          Check your email
        </h1>

        <p className="text-muted-foreground text-sm">
          We sent a confirmation link to your email address.
          Please click the link in that email to activate your WDC Labs account.
        </p>

        <p className="text-sm text-muted-foreground">
          Didn’t receive the email? Check your spam folder.
        </p>

        <button
          onClick={() => window.location.href = "/login"}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
        >
          Go to Login
        </button>

      </div>
    </div>
  );
}