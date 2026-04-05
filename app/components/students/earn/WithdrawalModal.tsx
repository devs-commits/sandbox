"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Loader2, CheckCircle2, XCircle, Lock, ArrowLeft, Landmark } from "lucide-react";
import { PinInput } from "../../auth/PinInput";
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
  userPin,
  userId 
}: any) {
  
  const [step, setStep] = useState(1); 
  const [banks, setBanks] = useState<any[]>([]);
  const [resolvedName, setResolvedName] = useState("");
  const [nameEnquiryRef, setNameEnquiryRef] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nameMatchError, setNameMatchError] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");

  useEffect(() => {
    if (open) {
      const fetchBanks = async () => {
        try {
          const res = await fetch("/api/wallet/banks");
          const data = await res.json();
          if (data.success) setBanks(data.banks);
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
        try {
          const res = await fetch("/api/wallet/name-enquiry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bankCode: bankName, accountNumber }), 
          });
          const data = await res.json();

          if (res.ok && data.success) {
            const fetchedBankName = (data.accountName || data.data?.accountName || "").toUpperCase();
            setResolvedName(fetchedBankName);
            
            const safeRef = data.nameEnquiryRef || data.sessionId || data.data?.sessionId || data.data?.nameEnquiryRef || `SS-${Date.now()}`;
            setNameEnquiryRef(safeRef); 

            const userParts = userName.toUpperCase().split(" ").filter((p: string) => p.length > 2);
            const isMatch = userParts.every((part: string) => fetchedBankName.includes(part));
            if (!isMatch) setNameMatchError(true);
          } else {
            toast.error(data.error || "Verification failed");
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

  const handleFinalWithdraw = async () => {
    if (enteredPin !== userPin) {
      toast.error("Invalid Transaction PIN");
      setEnteredPin(""); 
      return;
    }

    setIsProcessing(true);
    try {
      // 🔥 Extract actual bank name for the email
      const selectedBank = banks.find(b => b.institutionCode === bankName);
      const actualBankName = selectedBank ? selectedBank.institutionName : bankName;

      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          bankCode: bankName, 
          bankName: actualBankName, // 🔥 Sending real name for the email
          accountNumber,
          amount: parseFloat(amount),
          accountName: resolvedName,
          nameEnquiryRef: nameEnquiryRef
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onWithdraw(); 
        setStep(1);
        setEnteredPin("");
      } else {
        toast.error(data.error || "Transfer failed. Please try again.");
      }
    } catch (err) {
      toast.error("Network error during transfer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const numericAmount = parseFloat(amount || "0");
  const isInsufficient = numericAmount > totalEarnings;
  const canProceedToPin = resolvedName && nameEnquiryRef && !isResolving && numericAmount > 0 && !isInsufficient && !nameMatchError;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    if ((val.match(/\./g) || []).length > 1) return;
    setAmount(val);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) setStep(1); onClose(); }}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white rounded-[2rem] shadow-2xl">
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
                <div className="relative">
                  <select 
                    className="w-full bg-white/5 border border-white/10 h-12 rounded-xl px-3 text-sm focus:ring-1 focus:ring-emerald-500 outline-none appearance-none"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="">Select bank</option>
                    {banks.map((bank) => (
                      <option key={bank.institutionCode} value={bank.institutionCode} className="bg-[#1a1f2e]">
                        {bank.institutionName}
                      </option>
                    ))}
                  </select>
                  <Landmark size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1.5">Account Number</label>
                <Input 
                  type="text" 
                  maxLength={10}
                  placeholder="10 Digits"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="bg-white/5 border-white/10 h-12 rounded-xl font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1.5">Verified Beneficiary</label>
                <div className="relative">
                  <Input 
                    type="text" 
                    readOnly
                    placeholder="Name will appear automatically"
                    value={resolvedName}
                    className={`bg-white/5 h-12 rounded-xl font-semibold pr-10 border-white/10 ${nameMatchError ? 'text-red-400' : resolvedName ? 'text-emerald-400' : 'text-white/20 italic'}`} 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isResolving && <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />}
                      {!isResolving && resolvedName && !nameMatchError && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {!isResolving && (nameMatchError) && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </div>
                {nameMatchError && <p className="text-[10px] text-red-400 mt-1.5 font-bold">Name mismatch: Please use your own account.</p>}
              </div>

              <div>
                <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-1.5">Amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">₦</span>
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                    className={`bg-white/5 h-12 pl-10 rounded-xl font-bold text-lg border-white/10 ${isInsufficient ? 'border-red-500/50 text-red-400' : ''}`}
                  />
                </div>
                {isInsufficient && <p className="text-[10px] text-red-400 mt-1.5 font-bold uppercase">Amount exceeds balance</p>}
              </div>
            </div>

            <Button 
              disabled={!canProceedToPin}
              onClick={() => setStep(2)}
              className={`w-full h-14 font-black rounded-2xl transition-all shadow-xl mt-2 ${canProceedToPin ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            >
              CONTINUE TO PIN
            </Button>
          </div>
        ) : (
          <div className="space-y-8 py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <Lock className="text-emerald-500" size={28} />
            </div>
            
                <div className="space-y-2 px-4">
        <h3 className="font-bold text-xl tracking-tight">Authenticate</h3>
        <p className="text-xs text-white/40">You are authorizing a withdrawal of <span className="text-white font-bold">₦{numericAmount.toLocaleString()}</span></p>
            </div>
            
            <PinInput onComplete={(pin) => setEnteredPin(pin)} />

            <div className="space-y-4 px-4">
              <Button 
                onClick={handleFinalWithdraw}
                disabled={enteredPin.length < 4 || isProcessing}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-2xl"
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : "CONFIRM WITHDRAWAL"}
              </Button>
              
              <button 
                onClick={() => setStep(1)} 
                className="flex items-center justify-center gap-2 w-full text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                <ArrowLeft size={12} /> Go Back
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}