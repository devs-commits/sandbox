"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentHeader } from "../../components/students/StudentHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ShieldCheck, Landmark, Lock, Loader2, CheckCircle2, Fingerprint, Calendar, Phone, MapPin, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";

export default function ProfileSetup() {
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 🔥 SMART FLAG: Determines if they are generating a wallet, or just editing a profile
  const [hasWallet, setHasWallet] = useState(false); 

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Load existing data if available
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", user.id)
          .single();
          
        if (userData) {
          // Pull name from DB. If empty, fallback to the name they typed during Auth Signup!
          setFullName(userData.full_name || (user as any)?.user_metadata?.full_name || (user as any)?.user_metadata?.name || "");
          
          if (userData.bvn) setBvn(userData.bvn);
          if (userData.nin) setNin(userData.nin);
          if (userData.phone) setPhone(userData.phone);
          if (userData.address) setAddress(userData.address);
          if (userData.occupation) setOccupation(userData.occupation);
          
          // SCHEMA FIX: Pulling from 'date_of_birth'
          if (userData.date_of_birth) {
            setDob(userData.date_of_birth.split('T')[0]);
          }

          // If their profile is complete, switch to "Edit Mode"
          if (userData.is_complete) {
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
    // DATABASE SANITIZATION: Postgres hates empty strings ("") for Timestamps.
    // We explicitly convert any empty string to a pure 'null' before saving.
    const safeDob = dob ? dob : null;
    const safeAddress = address ? address : null;
    const safeOccupation = occupation ? occupation : null;
    const safePhone = phone ? phone : null;

    // ==========================================
    // 1. EDIT MODE: Save flexible fields
    // ==========================================
    if (hasWallet) {
      if (pin && pin !== confirmPin) return toast.error("PINs do not match.");
      if (pin && pin.length !== 4 && pin.length > 0) return toast.error("PIN must be 4 digits.");

      setIsGenerating(true);
      try {
        const { error: editError } = await supabase.from("users").update({ 
          phone: safePhone, 
          address: safeAddress, 
          occupation: safeOccupation 
        }).eq("auth_id", user?.id);

        if (editError) throw editError;

        if (pin) {
          const { error: pinError } = await supabase.from("wallets").update({ transaction_pin: pin }).eq("user_id", user?.id);
          if (pinError) throw pinError;
        }

        toast.success("Profile updated successfully!");
        setPin(""); setConfirmPin(""); // Clear pin fields after save
      } catch (error) {
        console.error("Edit Profile Error:", (error as any).message);
        toast.error("Failed to update profile.");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // ==========================================
    // 2. SETUP MODE: Generating Wallet First Time
    // ==========================================
    if (!fullName || !phone || !dob || !bvn || !nin || !pin || !confirmPin) {
      return toast.error("Please fill in all KYC and security details.");
    }

    if (bvn.length !== 11) return toast.error("BVN must be exactly 11 digits.");
    if (nin.length !== 11) return toast.error("NIN must be exactly 11 digits.");
    if (pin.length !== 4) return toast.error("Transaction PIN must be exactly 4 digits.");
    if (pin !== confirmPin) return toast.error("PINs do not match.");

    setIsGenerating(true);

    try {
      // 🔥 THE RLS FIX: Pure UPDATE command (instead of upsert)
      const { error: userError } = await supabase.from("users").update({ 
          full_name: fullName, 
          phone: safePhone, 
          bvn: bvn, 
          nin: nin, 
          date_of_birth: safeDob, 
          address: safeAddress, 
          occupation: safeOccupation 
      }).eq("auth_id", user?.id);

      if (userError) {
        console.error("Supabase Error:", userError);
        throw new Error("DB Error: " + userError.message);
      }

      // Call Backend to generate Virtual Account
      const res = await fetch("/api/wallet/initialize", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to provision settlement account.");

      // Secure PIN & Unlock Dashboard
      await supabase.from("wallets").update({ transaction_pin: pin }).eq("user_id", user?.id);
      await supabase.from("users").update({ is_complete: true }).eq("auth_id", user?.id);

      toast.success("Virtual Account Generated Successfully!", { icon: <ShieldCheck className="text-emerald-500" /> });
      router.push("/student/earn"); 

    } catch (error) {
      toast.error((error as any).message || "An error occurred while generating your wallet.");
    } finally {
      setIsGenerating(false);
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
                  {hasWallet ? "Update your contact info or reset your PIN." : "Provide your KYC details to provision your settlement account."}
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
                  <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">
                    Full Legal Name {hasWallet && <span className="text-red-400 ml-2">(Locked)</span>}
                  </label>
                  <Input 
                    type="text" placeholder="e.g. Ademola John Alabi" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={hasWallet}
                    className="bg-white/5 border-white/10 h-14 rounded-xl font-medium text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
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
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">
                      Date of Birth {hasWallet && <span className="text-red-400 ml-2">(Locked)</span>}
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

             {/* SECTION 2: Identity Verification (Locked if Wallet exists) */}
             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <Fingerprint size={16} /> Identity Verification
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">
                      BVN {hasWallet && <span className="text-red-400 ml-2">(Locked)</span>}
                    </label>
                    <Input 
                      type="text" maxLength={11} placeholder="11 Digits" value={bvn}
                      onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
                      disabled={hasWallet}
                      className="bg-white/5 border-white/10 h-14 rounded-xl font-mono text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">
                      NIN {hasWallet && <span className="text-red-400 ml-2">(Locked)</span>}
                    </label>
                    <Input 
                      type="text" maxLength={11} placeholder="11 Digits" value={nin}
                      onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                      disabled={hasWallet}
                      className="bg-white/5 border-white/10 h-14 rounded-xl font-mono text-white px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
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

             {/* SECTION 4: Security */}
             <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <Lock size={16} /> Wallet Security {hasWallet && <span className="text-white/40 ml-2 font-medium normal-case">(Leave blank to keep current PIN)</span>}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Set 4-Digit PIN</label>
                    <Input 
                      type="password" maxLength={4} placeholder="••••" value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="bg-white/5 border-white/10 h-14 rounded-xl font-mono text-2xl tracking-[0.5em] text-white px-4 focus:border-emerald-500/50 text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-2">Confirm PIN</label>
                    <Input 
                      type="password" maxLength={4} placeholder="••••" value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="bg-white/5 border-white/10 h-14 rounded-xl font-mono text-2xl tracking-[0.5em] text-white px-4 focus:border-emerald-500/50 text-center"
                    />
                  </div>
                </div>
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
    </div>
  );
}