"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentHeader } from "../../components/students/StudentHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ShieldCheck, Landmark, Lock, Loader2, CheckCircle2, Fingerprint, Calendar, Phone, MapPin, Briefcase, XCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";

export default function ProfileSetup() {
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State flags
  const [hasWallet, setHasWallet] = useState(false); 

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  
  // Setup PIN State (Only used during initial generation)
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Modal PIN State (Used for changing PIN later)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [modalPin, setModalPin] = useState("");
  const [modalConfirmPin, setModalConfirmPin] = useState("");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();
          
        const { data: walletData } = await supabase
          .from("wallets")
          .select("account_number")
          .eq("user_id", user.id)
          .maybeSingle();
          
        if (userData) {
          setFullName(userData.full_name || (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || "");
          if (userData.bvn) setBvn(userData.bvn);
          if (userData.nin) setNin(userData.nin);
          if (userData.phone) setPhone(userData.phone);
          if (userData.address) setAddress(userData.address);
          if (userData.occupation) setOccupation(userData.occupation);
          
          if (userData.date_of_birth) {
            setDob(userData.date_of_birth.split('T')[0]);
          }

          if (userData.is_complete || (walletData?.account_number && walletData.account_number !== "****")) {
            setHasWallet(true);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleAction = async () => {
    const safeDob = dob ? dob : null;
    const safeAddress = address ? address : null;
    const safeOccupation = occupation ? occupation : null;
    const safePhone = phone ? phone : null;

    // ==========================================
    // 1. EDIT MODE: Save flexible fields ONLY
    // ==========================================
    if (hasWallet) {
      setIsGenerating(true);
      try {
        const { error: editError } = await supabase.from("users").update({ 
          phone: safePhone, 
          address: safeAddress, 
          occupation: safeOccupation 
        }).eq("auth_id", user?.id);

        if (editError) throw editError;

        toast.success("Profile updated successfully!");
      } catch (error) {
        toast.error("Failed to update profile.");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // ==========================================
    // 2. SETUP MODE: Generating Wallet First Time
    // ==========================================
    if (!fullName) return toast.error("Full Name is required.");
    if (!phone) return toast.error("Phone Number is required.");
    if (!dob) return toast.error("Date of Birth is required.");
    
    if (!bvn) return toast.error("BVN is required.");
    if (bvn.length !== 11) return toast.error("BVN must be exactly 11 digits.");
    
    if (!nin) return toast.error("NIN is required.");
    if (nin.length !== 11) return toast.error("NIN must be exactly 11 digits.");
    
    if (!pin) return toast.error("Please set a 4-digit PIN.");
    if (!confirmPin) return toast.error("Please confirm your PIN.");
    if (pin.length !== 4) return toast.error("Transaction PIN must be exactly 4 digits.");
    if (pin !== confirmPin) return toast.error("PINs do not match.");

    setIsGenerating(true);

    try {
      const { error: userError } = await supabase.from("users").update({ 
          full_name: fullName, 
          phone: safePhone, 
          bvn: bvn, 
          nin: nin, 
          date_of_birth: safeDob, 
          address: safeAddress, 
          occupation: safeOccupation 
      }).eq("auth_id", user?.id);

      if (userError) throw new Error("DB Error: " + userError.message);

      const res = await fetch("/api/wallet/initialize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Provider issue. Please contact support.");

      await supabase.from("wallets").update({ transaction_pin: pin }).eq("user_id", user?.id);
      
      toast.success("Virtual Account Generated Successfully!", { icon: <ShieldCheck className="text-emerald-500" /> });
      router.push("/student/earn"); 

    } catch (error) {
      toast.error((error as any).message || "An error occurred while generating your wallet.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ==========================================
  // 3. ISOLATED PIN CHANGE LOGIC (Modal)
  // ==========================================
  const handleModalPinChange = async () => {
    if (modalPin.length !== 4) return toast.error("PIN must be exactly 4 digits.");
    if (modalPin !== modalConfirmPin) return toast.error("PINs do not match.");
    
    setIsUpdatingPin(true);
    try {
      const { error } = await supabase.from("wallets").update({ transaction_pin: modalPin }).eq("user_id", user?.id);
      if (error) throw error;
      
      toast.success("Transaction PIN updated securely!");
      setIsPinModalOpen(false);
      setModalPin("");
      setModalConfirmPin("");
    } catch (err) {
      toast.error("Failed to update PIN.");
    } finally {
      setIsUpdatingPin(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#020817]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-xs font-black tracking-widest text-white/40 uppercase">Loading Environment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col">
      <StudentHeader title="Security & Setup" subtitle={hasWallet ? "Manage Profile" : "KYC & Wallet Generation"} />
      
      <main className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
           
           <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

           <div className="flex items-center gap-4 mb-10 relative z-10">
             <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Landmark className="w-8 h-8 text-emerald-500" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {hasWallet ? "Account Settings" : "Generate Wallet"}
                </h2>
                <p className="text-white/40 text-sm">
                  {hasWallet ? "Update your contact info or security settings." : "Provide your KYC details to provision your settlement account."}
                </p>
             </div>
           </div>

           <div className="space-y-10 relative z-10">
             
             {/* SECTION 1: Personal Info */}
             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Personal Details
                </h3>
                
                <div>
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center mb-2">
                    Full Legal Name {hasWallet && <Lock size={12} className="text-red-400/80 ml-2" />}
                  </label>
                  <Input 
                    type="text" placeholder="e.g. Ademola John Alabi" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={hasWallet}
                    className="bg-white/5 border-white/10 h-14 rounded-xl font-medium text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!hasWallet && <p className="text-[10px] text-emerald-400/70 mt-2">Your name must match your government records (BVN/NIN).</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input 
                        type="text" placeholder="08012345678" value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center mb-2">
                      Date of Birth {hasWallet && <Lock size={12} className="text-red-400/80 ml-2" />}
                    </label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input 
                        type="date" value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        disabled={hasWallet}
                        className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50 block w-full [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
             </div>

             <div className="h-px w-full bg-white/5"></div>

             {/* SECTION 2: Identity Verification */}
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                     <Fingerprint size={16} /> Identity Verification
                   </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center mb-2">
                      BVN {hasWallet && <Lock size={12} className="text-red-400/80 ml-2" />}
                    </label>
                    <Input 
                      type="text" maxLength={11} placeholder="11 Digits" value={bvn}
                      onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                      disabled={hasWallet}
                      className="bg-white/5 border-white/10 h-14 rounded-xl font-mono text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest flex items-center mb-2">
                      NIN {hasWallet && <Lock size={12} className="text-red-400/80 ml-2" />}
                    </label>
                    <Input 
                      type="text" maxLength={11} placeholder="11 Digits" value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                      disabled={hasWallet}
                      className="bg-white/5 border-white/10 h-14 rounded-xl font-mono text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* 🔥 CONTACT SUPPORT BANNER */}
                {hasWallet && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3 items-start mt-4">
                    <Info size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-100/60 leading-relaxed">
                      Your identity is verified and your settlement wallet is active. To protect your account from fraud, core KYC details are locked. Need to make a correction? <a href="mailto:hello@wdc.ng" className="text-emerald-400 font-bold hover:underline">Contact Support</a>.
                    </p>
                  </div>
                )}
             </div>

             <div className="h-px w-full bg-white/5"></div>

             {/* SECTION 3: Additional Details */}
             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <MapPin size={16} /> Address & Occupation
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Residential Address</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input 
                        type="text" placeholder="123 Main St, Lagos" value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Occupation</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                      <Input 
                        type="text" placeholder="e.g. Software Engineer" value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="bg-white/5 border-white/10 h-14 rounded-xl pl-12 text-white focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>
             </div>

             <div className="h-px w-full bg-white/5"></div>

             {/* SECTION 4: Security (Conditional Rendering) */}
             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <Lock size={16} /> Wallet Security
                </h3>
                
                {hasWallet ? (
                  /* SECURE EDIT MODE: Clean toggle button instead of empty inputs */
                  <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <div>
                      <h4 className="text-sm font-bold text-white">Transaction PIN</h4>
                      <p className="text-xs text-white/40 mt-1">Secure your withdrawals and transfers.</p>
                    </div>
                    <Button 
                      onClick={() => setIsPinModalOpen(true)} 
                      variant="outline" 
                      className="bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    >
                      Change PIN
                    </Button>
                  </div>
                ) : (
                  /* SETUP MODE: Show PIN fields required for creation */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Set 4-Digit PIN</label>
                        {pin.length > 0 && pin.length < 4 && (
                          <span className="text-[9px] font-bold text-amber-400">Needs 4 digits</span>
                        )}
                        {pin.length === 4 && (
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10}/> Valid</span>
                        )}
                      </div>
                      <Input 
                        type="password" maxLength={4} placeholder="••••" value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className={`h-14 rounded-xl font-mono text-2xl tracking-[0.5em] text-white px-4 text-center transition-all duration-300
                          ${pin.length === 4 ? 'bg-emerald-500/5 border-emerald-500/50' : 'bg-white/5 border-white/10 focus:border-emerald-500/50'}
                        `}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] text-white/40 uppercase font-black tracking-widest">Confirm PIN</label>
                        {confirmPin.length > 0 && pin !== confirmPin && (
                          <span className="text-[9px] font-bold text-red-400 flex items-center gap-1 animate-in fade-in"><XCircle size={10}/> Mismatch</span>
                        )}
                        {confirmPin.length > 0 && pin === confirmPin && pin.length === 4 && (
                          <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={10}/> Matches</span>
                        )}
                      </div>
                      <Input 
                        type="password" maxLength={4} placeholder="••••" value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        className={`h-14 rounded-xl font-mono text-2xl tracking-[0.5em] text-white px-4 text-center transition-all duration-300
                          ${confirmPin.length > 0 && pin !== confirmPin ? 'bg-red-500/5 border-red-500/50 focus:border-red-500' : ''}
                          ${confirmPin.length > 0 && pin === confirmPin && pin.length === 4 ? 'bg-emerald-500/5 border-emerald-500/50 focus:border-emerald-500' : ''}
                          ${confirmPin.length === 0 || (pin === confirmPin && pin.length < 4) ? 'bg-white/5 border-white/10 focus:border-emerald-500/50' : ''}
                        `}
                      />
                    </div>
                  </div>
                )}
             </div>

             {/* SUBMIT BUTTON */}
             <div className="pt-6">
                <Button 
                  onClick={handleAction} disabled={isGenerating}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest uppercase rounded-2xl shadow-xl transition-all"
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : (hasWallet ? "Save Profile Changes" : "PROVISION SETTLEMENT ACCOUNT")}
                </Button>
             </div>

           </div>
        </div>
      </main>

      {/* ISOLATED PIN CHANGE MODAL */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-emerald-500">Change Security PIN</DialogTitle>
            <DialogDescription className="text-white/50">
              Set a new 4-digit PIN for your wallet transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">New PIN</label>
              <Input 
                type="password" maxLength={4} placeholder="••••" value={modalPin}
                onChange={(e) => setModalPin(e.target.value.replace(/\D/g, ''))}
                className="h-14 bg-white/5 border-white/10 rounded-xl font-mono text-2xl tracking-[0.5em] text-center focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Confirm New PIN</label>
              <Input 
                type="password" maxLength={4} placeholder="••••" value={modalConfirmPin}
                onChange={(e) => setModalConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="h-14 bg-white/5 border-white/10 rounded-xl font-mono text-2xl tracking-[0.5em] text-center focus:border-emerald-500/50"
              />
            </div>
            <Button 
              onClick={handleModalPinChange} 
              disabled={isUpdatingPin}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest uppercase rounded-xl"
            >
              {isUpdatingPin ? <Loader2 className="animate-spin" /> : "Update PIN"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}