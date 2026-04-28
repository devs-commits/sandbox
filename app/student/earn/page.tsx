"use client";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Copy, Link as LinkIcon, ShieldCheckIcon, CheckCircle2, Eye, EyeOff, 
  Loader2, Lock, Coins, Wallet, RotateCw, ChevronRight, UserCircle, 
  MapPin, Briefcase, Calendar, Info
} from "lucide-react";

import { WithdrawModal } from "../../components/students/earn/WithdrawalModal";
import { WithdrawSuccessModal } from "../../components/students/earn/WithdrawSuccessModal";
import { SocialIcon } from "../../components/students/earn/SocialIcon";
import { PinInput } from "../../components/auth/PinInput";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";
import { toast } from "sonner";

const formatCountry = (code: string) => {
  if (!code) return "Nigeria";
  if (code.length > 2) return code; 
  try {
    const uc = code.toUpperCase();
    const flag = Array.from(uc).map(char => String.fromCodePoint(char.charCodeAt(0) + 127397)).join('');
    return `${flag} ${new Intl.DisplayNames(['en'], { type: 'region' }).of(uc)}`;
  } catch (e) { return code.toUpperCase(); }
};

const getSocialLinks = (referralLink: string) => {
  const encodedLink = encodeURIComponent(`https://${referralLink}`);
  const shareText = encodeURIComponent("Join me on Warlord Digital Club and start earning! 💰");
  return [
    { name: "Copy link", icon: "link", color: "bg-cyan-500/20 text-cyan-500", url: null },
    { name: "Instagram", icon: "instagram", color: "bg-pink-500/10 text-pink-500", url: `https://www.instagram.com/` },
    { name: "Whatsapp", icon: "whatsapp", color: "bg-green-500/20 text-green-500", url: `https://wa.me/?text=${shareText}%20${encodedLink}` },
    { name: "Status", icon: "status", color: "bg-emerald-500/10 text-emerald-500", url: `https://wa.me/?text=${shareText}%20${encodedLink}` },
    { name: "Facebook", icon: "facebook", color: "bg-blue-600/10 text-blue-600", url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` },
    { name: "Snapchat", icon: "snapchat", color: "bg-yellow-500/10 text-yellow-500", url: `https://www.snapchat.com/` },
    { name: "Telegram", icon: "telegram", color: "bg-blue-400/10 text-blue-400", url: `https://t.me/share/url?url=${encodedLink}&text=${shareText}` },
    { name: "Tiktok", icon: "tiktok", color: "bg-white/10 text-white", url: `https://www.tiktok.com/` },
    { name: "Linkedin", icon: "linkedin", color: "bg-blue-700/10 text-blue-700", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}` },
    { name: "Email", icon: "email", color: "bg-purple-500/10 text-purple-500", url: `mailto:?subject=${shareText}&body=${shareText}%20${encodedLink}` },
    { name: "Thread", icon: "thread", color: "bg-slate-400/10 text-slate-400", url: `https://www.threads.net/` },
    { name: "X", icon: "x", color: "bg-white/10 text-white", url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}` },
  ];
};

export default function EarnMoney() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<any>("none");
  const [isVerified, setIsVerified] = useState(false);

  // Profile Data
  const [profile, setProfile] = useState({ fullName: "", address: "", dob: "", occupation: "", nationality: "", bvn: "", nin: "" });
  const [earnData, setEarnData] = useState({ earningsBalance: 0, walletTotal: 0, activeReferrals: 0, referralLink: "Loading...", userPin: "", hasPin: false });

  // PIN Management
  const [pinFlow, setPinFlow] = useState<"idle" | "setup">("idle");
  const [pinStep, setPinStep] = useState(1);
  const [tempPin, setTempPin] = useState("");

  // Withdrawal form state for Modal
  const [wBank, setWBank] = useState("");
  const [wAcc, setWAcc] = useState("");
  const [wAmt, setWAmt] = useState("");

  useEffect(() => { if (user) fetchEarnData(); }, [user]);

  const fetchEarnData = async () => {
    try {
      const { data: userData } = await supabase.from('users').select("*").eq('auth_id', user?.id).single();
      const { data: walletData } = await supabase.from('wallets').select("*").eq('user_id', user?.id).maybeSingle();
      const { count } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', userData?.id || 0);

      if (userData) {
        setEarnData({
          earningsBalance: userData.earnings || 0,
          walletTotal: walletData?.balance || 0,
          activeReferrals: count || 0,
          referralLink: userData.referral_code ? `${window.location.origin}/signup?code=${userData.referral_code}` : "Setup profile",
          userPin: walletData?.transaction_pin || "",
          // Ensure it evaluates strictly. If empty string or null, this is false.
          hasPin: !!walletData?.transaction_pin 
        });
        setIsVerified(userData.id_verified === true);
        setProfile({
          fullName: userData.full_name || "",
          address: userData.address || "",
          dob: userData.date_of_birth || "Not Set",
          occupation: userData.occupation || "Not Set",
          nationality: formatCountry(userData.nationality || userData.country || ""),
          bvn: userData.bvn || "",
          nin: userData.nin || ""
        });
      }
    } catch (err) { console.error(err); }
  };

  const handlePinAction = async (pin: string) => {
    if (pinFlow === "setup") {
      if (pinStep === 1) { 
        setTempPin(pin); 
        setPinStep(2); 
        toast.info("Re-enter PIN to verify"); 
      } else { 
        if (pin === tempPin) {
          savePinToDB(pin); 
        } else { 
          toast.error("Mismatch. Try again."); 
          setPinStep(1); 
          setTempPin(""); 
        } 
      }
    }
  };

  const savePinToDB = async (finalPin: string) => {
    // 🔥 Added Error Catcher here in case DB policies are blocking the PIN save
    const { error } = await supabase.from('wallets').update({ transaction_pin: finalPin }).eq('user_id', user?.id);
    
    if (error) {
      toast.error("Failed to save PIN: " + error.message);
      return;
    }
    
    toast.success("Security PIN updated!");
    setPinFlow("idle"); 
    fetchEarnData(); // Refreshes the state so the checkmark appears immediately
  };

  // 🔥 KYC Enforcement Check
  const handleCashOutClick = () => {
    const isProfileComplete = profile.dob !== "Not Set" && profile.bvn !== "";
    
    if (!isProfileComplete) {
      toast.error("Action Required: Please complete your KYC details (DOB, BVN) in your profile before withdrawing.");
      return;
    }
    setActiveModal("withdraw");
  };

  return (
    <>
      <StudentHeader title="Financial Hub" subtitle="Manage your network and security." />
      <main className="flex-1 p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] rounded-[2rem] p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Referral Earnings</p>
               <h2 className="text-5xl font-bold text-white tracking-tighter">₦{earnData.earningsBalance.toLocaleString()}</h2>
               <Button onClick={handleCashOutClick} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] h-12 rounded-2xl tracking-widest shadow-xl">
                 CASH OUT EARNINGS <ChevronRight size={14} />
               </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#064e3b] to-[#0f172a] rounded-[2rem] p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Total Wallet Balance</p>
               <h2 className="text-5xl font-bold text-white tracking-tighter">₦{earnData.walletTotal.toLocaleString()}</h2>
               <Button variant="outline" onClick={() => router.push("/student/wallet")} className="w-full border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-black text-[10px] h-12 rounded-2xl tracking-widest hover:bg-emerald-500/10">
                  GO TO WALLET <ChevronRight size={14} />
               </Button>
            </div>
          </div>

          <div className="bg-[#0f172a] rounded-[2rem] p-8 border border-white/5 flex items-center justify-between shadow-2xl">
            <div className="space-y-1">
               <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Active Referrals</p>
               <h2 className="text-5xl font-bold text-white tracking-tighter">{earnData.activeReferrals}</h2>
               <p className="text-xs text-white/20 font-medium italic">Interns</p>
            </div>
            <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center">
               <Image src="/proicons_gift.png" alt="Gift" width={44} height={44} className="opacity-40" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* SECURITY HUB */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl space-y-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-4"><ShieldCheckIcon className="text-emerald-500" /> Security Hub</h3>
              
              {/* CLEANED UP PIN SECTION */}
              <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-white">Withdrawal PIN</p>
                  
                  {!earnData.hasPin ? (
                     // Only show Setup button if they truly have no PIN saved
                     <Button variant="ghost" onClick={() => { setPinFlow("setup"); setPinStep(1); }} className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-500/10 hover:bg-indigo-500/20 h-8 px-4 rounded-lg">
                       Setup PIN
                     </Button>
                  ) : (
                     // If PIN exists, show the green active badge instead of a lock!
                     <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Active
                     </div>
                  )}
                </div>

                {!earnData.hasPin ? (
                   pinFlow === "setup" ? (
                     <div className="space-y-6 py-4 animate-in fade-in zoom-in-95">
                       <p className="text-[10px] text-white/40 uppercase font-black text-center tracking-[0.2em]">
                         {pinStep === 1 ? "Set 4-Digit PIN" : "Verify PIN"}
                       </p>
                       <PinInput key={pinStep} onComplete={handlePinAction} />
                       <Button variant="ghost" onClick={() => setPinFlow("idle")} className="w-full text-[9px] text-white/20 font-bold uppercase tracking-widest h-6">Cancel</Button>
                     </div>
                   ) : (
                     <p className="text-xs text-white/20 leading-relaxed italic">A 4-digit security PIN is required for all cash outs. Please set it up.</p>
                   )
                ) : (
                   // The "Contact Support/Update" message you requested for users who already have a PIN
                   <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                     <Lock size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                     <p className="text-xs text-white/40 leading-relaxed">
                       Your security PIN is active and protecting your funds. You can safely update your PIN in your <button onClick={() => router.push('/student/profile')} className="text-indigo-400 font-semibold hover:underline">Profile Settings</button> or by contacting support.
                     </p>
                   </div>
                )}
              </div>

              {/* KYC DATA DISPLAY */}
              <div className="space-y-8 pt-4 border-t border-white/5 relative">
                
                <div className="flex justify-between items-center mt-2 mb-6">
                  <p className="text-sm font-bold text-white">KYC Details</p>
                  <Button variant="ghost" onClick={() => router.push("/student/profile")} className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 tracking-widest h-8 px-4 rounded-lg transition-all">
                    Edit Profile
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5"><UserCircle size={10} /> Name</label><p className="text-sm text-white/70 font-semibold">{profile.fullName}</p></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5"><MapPin size={10} /> Nationality</label><p className="text-sm text-white/70 font-semibold">{profile.nationality}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5"><Calendar size={10} /> DOB</label><p className={`text-sm font-semibold ${profile.dob === 'Not Set' ? 'text-red-400' : 'text-white/70'}`}>{profile.dob}</p></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5"><Briefcase size={10} /> Occupation</label><p className="text-sm text-white/70 font-semibold truncate">{profile.occupation}</p></div>
                </div>
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-1.5"><MapPin size={10} /> Home Address</label>
                    <Input value={profile.address} readOnly className="bg-white/5 border-white/5 h-12 rounded-xl text-white text-sm opacity-50 cursor-not-allowed" />
                </div>
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="space-y-1"><label className="text-[9px] font-black text-white/20 uppercase tracking-widest">BVN (Encrypted)</label><p className={`font-mono text-sm ${!profile.bvn ? 'text-red-400' : 'text-white/40'}`}>{profile.bvn ? "********" + profile.bvn.slice(-4) : "Not Set"}</p></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-white/20 uppercase tracking-widest">NIN (Encrypted)</label><p className="font-mono text-sm text-white/40">{profile.nin ? "********" + profile.nin.slice(-4) : "Not Set"}</p></div>
                </div>

              </div>
          </div>

          {/* SOCIAL NETWORK */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl h-full flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><LinkIcon className="text-indigo-400" size={24} /></div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Referral Network</h3>
              </div>
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl mb-10 group hover:border-indigo-400/50 transition-all flex items-center justify-between">
                  <p className="font-mono text-indigo-400 text-xs truncate mr-4 select-all">{earnData.referralLink}</p>
                  <button onClick={() => { navigator.clipboard.writeText(earnData.referralLink); toast.success("Link Copied"); }} className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl transition-all"><Copy size={18} /></button>
              </div>
              <div className="space-y-6 flex-1">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Share Link To:</p>
                 <div className="grid grid-cols-4 gap-4">
                    {getSocialLinks(earnData.referralLink).map((link, i) => (
                      <button key={i} onClick={() => link.url ? window.open(link.url, '_blank') : null} className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${link.color} group-hover:scale-110 transition-transform shadow-inner`}><SocialIcon name={link.icon} /></div>
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter text-center group-hover:text-white transition-colors">{link.name}</span>
                      </button>
                    ))}
                 </div>
              </div>
          </div>
        </div>
      </main>

      <WithdrawModal open={activeModal === "withdraw"} onClose={() => setActiveModal("none")} totalEarnings={earnData.walletTotal} userName={profile.fullName} userPin={earnData.userPin} userId={user?.id} bankName={wBank} setBankName={setWBank} accountNumber={wAcc} setAccountNumber={setWAcc} amount={wAmt} setAmount={setWAmt} onWithdraw={() => { fetchEarnData(); setActiveModal("success"); }} />
      <WithdrawSuccessModal open={activeModal === "success"} onClose={() => setActiveModal("none")} amount={wAmt} />
    </>
  );
}