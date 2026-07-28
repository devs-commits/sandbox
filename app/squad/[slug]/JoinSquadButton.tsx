"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/app/contexts/AuthContexts";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

interface JoinSquadButtonProps {
  slug: string;
  referralCode?: string;
  isFull: boolean;
}

export default function JoinSquadButton({ slug, referralCode, isFull }: JoinSquadButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (isFull) {
      toast.error("This squad has reached its 4-member limit.");
      return;
    }

    // SCENARIO 1: User is not logged in. Redirect to sign up with tracking parameters & squad cookie.
    if (!user) {
      toast.success("Let's get your account set up first!");
      // Set cookies so registration and AuthContext can automatically pick it up
      if (typeof document !== 'undefined') {
        if (referralCode) document.cookie = `wdc_referral_id=${referralCode}; path=/; max-age=86400`;
        document.cookie = `wdc_squad_id=${slug}; path=/; max-age=86400`;
      }
      
      // 🔥 EXACT FIX: Pointing this to your actual /signup route
      router.push(`/signup?squad=${slug}&ref=${referralCode || ""}`);
      return;
    }

    // SCENARIO 2: User is already logged in. Join the squad immediately.
    setLoading(true);
    try {
      const res = await fetch("/api/squad/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, slug }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Welcome to the squad!");
        // Ensures they go straight to their dashboard after joining
        router.push("/student/squad");
      } else {
        toast.error(data.error || "Failed to join squad.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleJoin} 
      disabled={loading || isFull}
      className="w-full sm:w-auto h-14 px-8 text-base font-bold shadow-lg hover:scale-[1.02] transition-transform bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-none"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      ) : (
        <>
          {isFull ? "Squad is Full" : user ? "Join Squad Now" : "Accept Invite & Sign Up"}
          {!isFull && <ArrowRight className="ml-2 w-5 h-5" />}
        </>
      )}
    </Button>
  );
}