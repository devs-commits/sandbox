"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Loader2, CheckCircle2, XCircle, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { SearchableBankSelect } from "@/app/components/ui/SearchableBankSelect";
import { PinInput } from "../../auth/PinInput";
import { SetPinModal } from "../../auth/SetPinModal"; 
import { toast } from "sonner";

export function WithdrawModal({ 
  open, 
  onClose, 
  totalEarnings, 
  userName, 
  bankName, 
  setBankName, 
  accountNumber, 
  setAccountNumber, 
  amount, 
  setAmount, 
  onWithdraw, 
  userId,
  userPin 
}: any) {
  
  const [step, setStep] = useState(1); 
  const [banks, setBanks] = useState<any[]>([]);
  const [resolvedName, setResolvedName] = useState("");
  const [nameEnquiryRef, setNameEnquiryRef] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nameMatchError, setNameMatchError] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");

  // PIN GATEKEEPER STATE
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [currentPin, setCurrentPin] = useState(userPin);

  // Keep local pin state in sync
  useEffect(() => {
    setCurrentPin(userPin);
  }, [userPin]);

  useEffect(() => {
    if (open && !currentPin) {
      setShowPinSetup(true);
    } else {
      setShowPinSetup(false);
    }
  }, [open, currentPin]);

  const selectedBankObject = useMemo(() => 
    banks.find(b => b.institutionCode === bankName || b.code === bankName), 
    [banks, bankName]
  );

  useEffect(() => {
    if (open) {
      const fetchBanks = async () => {
        try {
          const res = await fetch("/api/wallet/banks");
          const data = await res.json();
          if (data.success) {
             // Supports both old structure and new Paystack structure
             setBanks(data.banks || data.data || []);
          }
        } catch (err) {
          toast.error("Could not load bank list");
        }
      };
      fetchBanks();
    }
  }, [open]);

  useEffect(() => {
    const resolveName = async () => {
      setResolvedName("");
      setNameEnquiryRef(""); 
      setNameMatchError(false);

      if (accountNumber.length === 10 && bankName) {
        setIsResolving(true);

        // 🔥 LOCAL TEST BYPASS: Intercept the fake account so it doesn't crash Paystack
        if (accountNumber === "0123456789") {
           setTimeout(() => {
             setResolvedName(userName); // Automatically matches your name!
             setNameEnquiryRef(`PS-TEST-${Date.now()}`);
             setNameMatchError(false);
             setIsResolving(false);
           }, 800); // Fake loading delay for realism
           return; // Stop here, do not call the API
        }

        try {
          const res = await fetch("/api/wallet/name-enquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bankCode: bankName, accountNumber }), 
          });
          const data = await res.json();

          if (res.ok && data.success) {
            const fetchedAccountName = (data.accountName || data.data?.accountName || data.data?.account_name || "").toUpperCase();
            setResolvedName(fetchedAccountName);
            
            const safeRef = data.nameEnquiryRef || data.sessionId || data.data?.sessionId || data.data?.nameEnquiryRef || `PS-${Date.now()}`;
            setNameEnquiryRef(safeRef); 

            // Name Match Logic
            const userParts = userName.toUpperCase().split(" ").filter((p: string) => p.length > 2);
            const isMatch = userParts.some((part: string) => fetchedAccountName.includes(part));
            if (!isMatch) setNameMatchError(true);
          }
        } catch (error) {
          console.error("Verification error");
        } finally {
          setIsResolving(false);
        }
      }
    };
    resolveName();
  }, [accountNumber, bankName, userName]);

  // 🔥 DYNAMIC FEE CALCULATOR (Mirrors Backend exactly)
  const numericAmount = parseFloat(amount || "0");
  
  const providerFee = useMemo(() => {
    if (numericAmount === 0) return 0;
    if (numericAmount <= 5000) return 10;
    if (numericAmount > 5000 && numericAmount < 10000) return 25;
    if (numericAmount >= 10000 && numericAmount <= 50000) return 75;
    return 100;
  }, [numericAmount]);

  const totalDeduction = numericAmount + providerFee;
  const isInsufficient = totalDeduction > totalEarnings;

  const handleFinalWithdraw = async () => {
    if (enteredPin.length < 4) return toast.error("Please enter your 4-digit PIN");
    if (enteredPin !== currentPin) return toast.error("Incorrect Transaction PIN");

    setIsProcessing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: numericAmount,
          accountNumber,
          bankCode: bankName, 
          accountName: resolvedName,
          pin: enteredPin,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Transfer Initiated Successfully!");
        onWithdraw(); 
        setStep(1);
        setEnteredPin("");
      } else {
        toast.error(data.error || "Transfer failed. Please check your balance.");
      }
    } catch (err) {
      toast.error("Network error during transfer.");
    } finally {
      setIsProcessing(false);
      setEnteredPin(""); 
    }
  };

  const canProceedToPin = resolvedName && !isResolving && numericAmount >= 1000 && !isInsufficient && !nameMatchError;

  if (showPinSetup) {
    return (
      <SetPinModal 
        open={open} 
        userId={userId} 
        onClose={onClose} 
        onSuccess={(newPin: string) => {
          setCurrentPin(newPin); 
          setShowPinSetup(false); 
        }} 
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) { setStep(1); onClose(); } }}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white rounded-[2rem] shadow-2xl overflow-visible">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            {step === 1 ? "Withdraw Funds" : "Authorize Transfer"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-5 py-2">
            <div className="rounded-2xl p-4 border flex flex-col items-center bg-white/[0.02] border-white/5">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Available Balance</p>
              <h2 className="text-3xl font-bold">₦{totalEarnings?.toLocaleString() || 0}</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1.5">Destination Bank</label>
                <SearchableBankSelect 
                  banks={banks} 
                  selectedBank={selectedBankObject?.institutionName || selectedBankObject?.name || ""} 
                  onSelect={(name) => {
                    const code = banks.find(b => b.institutionName === name || b.name === name)?.institutionCode || banks.find(b => b.institutionName === name || b.name === name)?.code;
                    setBankName(code || "");
                  }} 
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1.5">Account Number</label>
                <Input 
                  type="text" 
                  maxLength={10}
                  placeholder="10 Digits"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="bg-white/5 border-white/10 h-12 rounded-xl font-mono tracking-widest focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1.5">Verified Beneficiary</label>
                <div className="relative">
                  <Input 
                    type="text" 
                    readOnly
                    placeholder="Auto-verifying name..."
                    value={resolvedName}
                    className={`bg-white/5 h-12 rounded-xl font-semibold pr-10 border-white/10 ${nameMatchError ? 'text-red-400' : resolvedName ? 'text-emerald-400' : 'text-white/20 italic'}`} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isResolving && <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />}
                      {!isResolving && resolvedName && !nameMatchError && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {!isResolving && (nameMatchError) && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </div>
                {nameMatchError && <p className="text-[10px] text-red-400 mt-1.5 font-bold italic text-center">Identity mismatch. You can only withdraw to your own bank account.</p>}
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1.5">Withdrawal Amount (Min ₦1,000)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">₦</span>
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    className={`bg-white/5 h-12 pl-10 rounded-xl font-bold text-lg border-white/10 focus:ring-emerald-500 ${isInsufficient ? 'border-red-500/50 text-red-400' : ''}`}
                  />
                </div>
              </div>

              {/* 🔥 NEW FEE BREAKDOWN UI */}
              {numericAmount > 0 && (
                <div className={`p-3 rounded-xl border ${isInsufficient ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/10'} space-y-1.5`}>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>You Receive:</span>
                    <span className="font-bold text-white">₦{numericAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Transfer Fee:</span>
                    <span className="font-bold text-red-400">- ₦{providerFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-1 border-t border-white/5">
                    <span className="text-white/80">Total Deduction:</span>
                    <span className={isInsufficient ? "text-red-400" : "text-emerald-400"}>
                      ₦{totalDeduction.toLocaleString()}
                    </span>
                  </div>
                  {isInsufficient && (
                    <p className="text-[9px] text-red-400 flex items-center justify-center gap-1 mt-1 font-bold">
                      <AlertCircle size={10} /> Amount + Fee exceeds balance.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Button 
              disabled={!canProceedToPin}
              onClick={() => setStep(2)}
              className={`w-full h-14 font-black rounded-2xl transition-all shadow-xl mt-2 ${canProceedToPin ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            >
              PROCEED TO AUTHORIZATION
            </Button>
          </div>
        ) : (
          <div className="space-y-8 py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <Lock className="text-emerald-500" size={28} />
            </div>
            
            <div className="space-y-2 px-4">
               <h3 className="font-bold text-xl tracking-tight">Enter Transaction PIN</h3>
               <p className="text-xs text-white/40">Confirm total deduction of <span className="text-red-400 font-bold">₦{totalDeduction.toLocaleString()}</span> for transfer to {selectedBankObject?.institutionName || selectedBankObject?.name}</p>
            </div>
            
            <div className="flex justify-center">
               <PinInput onComplete={(pin) => setEnteredPin(pin)} />
            </div>

            <div className="space-y-4 px-4">
              <Button 
                onClick={handleFinalWithdraw}
                disabled={enteredPin.length < 4 || isProcessing}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-2xl"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : "CONFIRM WITHDRAWAL"}
              </Button>
              
              <button 
                onClick={() => { setStep(1); setEnteredPin(""); }} 
                className="flex items-center justify-center gap-2 w-full text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                <ArrowLeft size={12} /> Change details
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}