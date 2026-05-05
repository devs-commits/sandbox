"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { PinInput } from "./PinInput";
import { Loader2, ShieldCheck, LockIcon, Fingerprint, AlertCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";

// Steps: 0: Verify Old, 1: New, 2: Confirm, 3: OTP Identity Check
export function SetPinModal({ open, onClose, userId, userEmail, onSuccess }: any) {
  const [step, setStep] = useState(0); 
  const [newPin, setNewPin] = useState("");
  const [currentDbPin, setCurrentDbPin] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user already has a PIN when modal opens
  useEffect(() => {
    if (open && userId) {
      const checkExistingPin = async () => {
        setIsLoading(true);
        try {
          const { data } = await supabase
            .from("wallets")
            .select("transaction_pin")
            .eq("user_id", userId)
            .maybeSingle();
          
          const existingPin = data?.transaction_pin;
          setCurrentDbPin(existingPin || null);
          
          // Start at Step 0 (Verify) if they have a PIN, otherwise Step 1 (Set New)
          setStep(existingPin ? 0 : 1);
        } catch (error) {
          console.error("Error fetching PIN status:", error);
        } finally {
          setIsLoading(false);
        }
      };
      checkExistingPin();
    }
  }, [open, userId]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setNewPin("");
      setStep(0);
    }
  }, [open]);

  // --- HANDLERS ---

  const handleVerifyOldPin = (val: string) => {
    if (val === currentDbPin) {
      setStep(1);
    } else {
      toast.error("Incorrect current PIN.");
    }
  };

  const handleRequestOTP = async () => {
    setIsSaving(true);
    // Simulate sending OTP to userEmail
    setTimeout(() => {
      setIsSaving(false);
      setStep(3);
      toast.success(`Verification code sent to ${userEmail || 'your email'}`);
    }, 1200);
  };

  const handleVerifyOTP = (val: string) => {
    // Standard test code for now
    if (val === "1234") {
      toast.success("Identity verified!");
      setStep(1);
    } else {
      toast.error("Invalid code. Please try again.");
    }
  };

  const handleCompleteNewPin = (val: string) => {
    setNewPin(val);
    setStep(2);
  };

  const handleSavePin = async (val: string) => {
    if (val !== newPin) {
      toast.error("PINs do not match. Start over.");
      setStep(1);
      setNewPin("");
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("wallets")
        .update({ transaction_pin: val })
        .eq("user_id", userId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("RLS Block: Update failed.");

      toast.success("Transaction PIN updated!");
      onSuccess(val); 
      onClose();
    } catch (err: any) {
      console.error("🔥 PIN SAVE ERROR:", err);
      toast.error(`Error: ${err.message || "Failed to save PIN"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white rounded-[2rem] p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Securing Session...</p>
          </div>
        ) : (
          <>
            <DialogHeader className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                {step === 0 && <LockIcon className="text-amber-500" size={32} />}
                {step === 3 && <Fingerprint className="text-blue-500" size={32} />}
                {(step === 1 || step === 2) && <ShieldCheck className="text-emerald-500" size={32} />}
              </div>
              <DialogTitle className="text-2xl font-bold text-center">
                {step === 0 && "Verify Current PIN"}
                {step === 3 && "Email Verification"}
                {step === 1 && "Set New PIN"}
                {step === 2 && "Confirm New PIN"}
              </DialogTitle>
              <p className="text-white/40 text-sm text-center">
                {step === 0 && "Enter your current PIN to authorize this change."}
                {step === 3 && `Enter the 4-digit code sent to ${userEmail || 'your email'}.`}
                {step === 1 && "Create a new 4-digit PIN for your wallet."}
                {step === 2 && "Re-enter your new PIN to confirm."}
              </p>
            </DialogHeader>

            <div className="py-6 flex flex-col items-center">
              <PinInput 
                key={step} 
                onComplete={
                  step === 0 ? handleVerifyOldPin : 
                  step === 3 ? handleVerifyOTP : 
                  step === 1 ? handleCompleteNewPin : handleSavePin
                } 
              />

              {step === 0 && (
                <button 
                  onClick={handleRequestOTP}
                  className="mt-6 text-xs text-emerald-400 hover:text-emerald-300 font-bold hover:underline transition-all"
                >
                  Forgot PIN? Reset via Email
                </button>
              )}
            </div>

            {isSaving && (
              <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold animate-pulse">
                <Loader2 className="animate-spin" size={18} />
                Processing...
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}