"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment with Paystack...");
  const processedRef = useRef(false);

  useEffect(() => {
    const verifyPayment = async () => {
      // Get reference from URL (Paystack sends 'reference' or 'trxref')
      const reference = searchParams.get("reference") || searchParams.get("trxref");
      
      if (!reference) {
        setStatus("error");
        setMessage("No payment reference found in the URL.");
        return;
      }

      // Prevent double-firing in React Strict Mode
      if (processedRef.current) return;
      processedRef.current = true;

      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            setStatus("error");
            setMessage("You must be logged in to verify this payment.");
            return;
        }

        // Call our backend API
        const response = await fetch("/api/wallet/fund", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reference }), // We only send reference now
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Payment verified successfully! Your wallet has been funded.");
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.push("/recruiter/wallet");
          }, 2000);
        } else {
          setStatus("error");
          // Handle specific error cases
          if (data.error === "Transaction already processed") {
             setStatus("success"); // Treat as success for the user
             setMessage("This transaction was already processed and added to your wallet.");
             setTimeout(() => {
                router.push("/recruiter/wallet");
              }, 3000);
          } else {
             setMessage(data.error || "Failed to verify payment.");
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred while verifying payment.");
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <CardTitle>Payment Verification</CardTitle>
          <CardDescription>Please wait while we confirm your transaction</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6 py-6">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground text-center animate-pulse">{message}</p>
            </div>
          )}
          
          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center">
                <p className="font-medium text-lg text-foreground">{message}</p>
                <p className="text-sm text-muted-foreground mt-2">Redirecting you back to wallet...</p>
              </div>
              <Button onClick={() => router.push("/recruiter/wallet")} className="w-full">
                Go to Wallet Now
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="text-center">
                <p className="font-medium text-lg text-destructive">Verification Failed</p>
                <p className="text-muted-foreground mt-1">{message}</p>
              </div>
              <Button variant="outline" onClick={() => router.push("/recruiter/wallet")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
