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
  MapPin, Briefcase, Calendar, Info, Edit3 // 🔥 Added Edit3 & Loader2
} from "lucide-react";

import { WithdrawModal } from "../../components/students/earn/WithdrawalModal";
import { WithdrawSuccessModal } from "../../components/students/earn/WithdrawSuccessModal";
import { SocialIcon } from "../../components/students/earn/SocialIcon";
import { SetPinModal } from "../../components/auth/SetPinModal";
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
  const encodedLink = encodeURIComponent(`${referralLink}`);
  const rawShareText = `I found something interesting 👀\nWDC Labs lets you actually practice real work instead of just learning theory.\nYou pick a career path, do real tasks, and build a portfolio that shows your skills.\nNo more “I need experience to get experience.” \nJoin me here and start building real experience today 👇\n`;
  const shareText = encodeURIComponent(rawShareText);
  
  return [
    { name: "Copy link", icon: "link", color: "bg-cyan-500/20 text-cyan-500", url: null },
    { name: "Instagram", icon: "instagram", color: "bg-pink-500/10 text-pink-500", url: `https://www.instagram.com/` },
    { name: "Whatsapp", icon: "whatsapp", color: "bg-green-500/20 text-green-500", url: `https://wa.me/?text=${shareText}${encodedLink}` },
    { name: "Status", icon: "status", color: "bg-emerald-500/10 text-emerald-500", url: `https://wa.me/?text=${shareText}${encodedLink}` },
    { name: "Facebook", icon: "facebook", color: "bg-blue-600/10 text-blue-600", url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` },
    { name: "Snapchat", icon: "snapchat", color: "bg-yellow-500/10 text-yellow-500", url: `https://www.snapchat.com/` },
    { name: "Telegram", icon: "telegram", color: "bg-blue-400/10 text-blue-400", url: `https://t.me/share/url?url=${encodedLink}&text=${shareText}` },
    { name: "Tiktok", icon: "tiktok", color: "bg-white/10 text-white", url: `https://www.tiktok.com/` },
    { name: "Linkedin", icon: "linkedin", color: "bg-blue-700/10 text-blue-700", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}` },
    { name: "Email", icon: "email", color: "bg-purple-500/10 text-purple-500", url: `mailto:?subject=Join me on WDC Labs&body=${shareText}${encodedLink}` },
    { name: "Thread", icon: "thread", color: "bg-slate-400/10 text-slate-400", url: `https://www.threads.net/` },
    { name: "X", icon: "x", color: "bg-white/10 text-white", url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}` },
  ];
};

export default function EarnMoney() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<any>("none");
  const [isVerified, setIsVerified] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // 🔥 CUSTOM REFERRAL STATE
  const [isEditingRef, setIsEditingRef] = useState(false);
  const [newRefCode, setNewRefCode] = useState("");
  const [isSavingRef, setIsSavingRef] = useState(false);

  const [profile, setProfile] = useState({ fullName: "", address: "", dob: "", occupation: "", nationality: "", bvn: "", nin: "" });
  
  const [earnData, setEarnData] = useState({ 
    earningsBalance: 0, 
    walletTotal: 0, 
    activeReferrals: 0, 
    pendingReferrals: 0,
    referralCode: "", // 🔥 Added base code state
    referralLink: "Loading...", 
    userPin: "", 
    hasPin: false 
  });

  const [wBank, setWBank] = useState("");
  const [wAcc, setWAcc] = useState("");
  const [wAmt, setWAmt] = useState("");

  useEffect(() => { if (user) fetchEarnData(); }, [user]);

  const fetchEarnData = async () => {
    try {
      const { data: userData } = await supabase.from('users').select("*").eq('auth_id', user?.id).single();
      const { data: walletData } = await supabase.from('wallets').select("*").eq('user_id', user?.id).maybeSingle();
      
      const { count: activeCount } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', userData?.id).eq('status', 'active');
      const { count: pendingCount } = await supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('referrer_id', userData?.id).eq('status', 'pending');

      if (userData) {
        // 🔥 DEFAULT LOGIC: Use DB code, fallback to first name, fallback to slice of UUID
        const baseCode = userData.referral_code || userData.full_name?.split(" ")[0]?.toLowerCase() || userData.id.substring(0, 6);

        setEarnData({
          earningsBalance: userData.earnings || 0,
          walletTotal: walletData?.balance || 0,
          activeReferrals: activeCount || 0,
          pendingReferrals: pendingCount || 0,
          referralCode: baseCode,
          referralLink: userData.id ? `${window.location.origin}/signup?ref=${baseCode}` : "Setup profile",
          userPin: walletData?.transaction_pin || "", 
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

  // 🔥 CUSTOM VANITY URL SAVING LOGIC
  const handleSaveReferralCode = async () => {
    if (!newRefCode.trim()) return toast.error("Referral code cannot be empty");
    
    // Clean string: lowercase, remove spaces and special characters
    const formattedCode = newRefCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    if (formattedCode === earnData.referralCode) {
      setIsEditingRef(false);
      return;
    }

    setIsSavingRef(true);
    try {
      // 1. Check uniqueness (Does anyone else have this code?)
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referral_code', formattedCode)
        .neq('auth_id', user?.id);
        
      if (count && count > 0) {
        toast.error("This referral link is already taken by another user.");
        setIsSavingRef(false);
        return;
      }

      // 2. Update the User Profile
      const { error } = await supabase
        .from('users')
        .update({ referral_code: formattedCode })
        .eq('auth_id', user?.id);
        
      if (error) throw error;

      toast.success("Custom referral link updated successfully!");
      setIsEditingRef(false);
      fetchEarnData(); // Refresh UI to apply new link to social buttons
    } catch (err) {
      console.error(err);
      toast.error("Failed to update referral link.");
    } finally {
      setIsSavingRef(false);
    }
  };

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

          <div className="bg-[#0f172a] rounded-[2rem] p-8 border border-white/5 flex flex-col justify-between shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                 <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Active Referrals</p>
                 <h2 className="text-5xl font-bold text-white tracking-tighter">{earnData.activeReferrals}</h2>
                 <p className="text-xs text-emerald-400/80 font-medium italic">Paid Conversions</p>
              </div>
              <div className="w-14 h-14 bg-white/5 rounded-[1rem] flex items-center justify-center">
                 <Image src="/proicons_gift.png" alt="Gift" width={28} height={28} className="opacity-40" />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                 <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Pending (Trial)</p>
                 <span className="text-xl font-bold text-white/50">{earnData.pendingReferrals}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* SECURITY HUB (Remains Unchanged) */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl space-y-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-4"><ShieldCheckIcon className="text-emerald-500" /> Security Hub</h3>
              
              <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-white">Withdrawal PIN</p>
                  
                  {!earnData.hasPin ? (
                     <Button variant="ghost" onClick={() => setIsPinModalOpen(true)} className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-500/10 hover:bg-indigo-500/20 h-8 px-4 rounded-lg">
                       Setup PIN
                     </Button>
                  ) : (
                     <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Active
                     </div>
                  )}
                </div>

                {!earnData.hasPin ? (
                     <p className="text-xs text-white/20 leading-relaxed italic">A 4-digit security PIN is required for all cash outs. Please set it up.</p>
                ) : (
                   <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                     <Lock size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                     <p className="text-xs text-white/40 leading-relaxed">
                       Your security PIN is active and protecting your funds. You can safely update your PIN in your <button onClick={() => router.push('/student/profile')} className="text-indigo-400 font-semibold hover:underline">Profile Settings</button>.
                     </p>
                   </div>
                )}
              </div>

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

          {/* SOCIAL NETWORK & REFERRAL LINK UI */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl h-full flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><LinkIcon className="text-indigo-400" size={24} /></div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Referral Network</h3>
              </div>
              
              {/* 🔥 NEW CUSTOMIZER BOX */}
              <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl mb-10 group hover:border-indigo-400/50 transition-all flex items-center justify-between min-h-[72px]">
                  {isEditingRef ? (
                    <div className="flex items-center gap-2 flex-1 w-full">
                       <span className="text-indigo-400/50 text-xs hidden sm:inline">.../signup?ref=</span>
                       <Input 
                         value={newRefCode} 
                         onChange={(e) => setNewRefCode(e.target.value)} 
                         className="flex-1 bg-white/5 border-white/10 text-white h-9 rounded-xl text-xs font-mono focus-visible:ring-1 focus-visible:ring-indigo-500"
                         placeholder="custom-link"
                         autoFocus
                       />
                       <Button onClick={handleSaveReferralCode} disabled={isSavingRef} className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-4 font-bold tracking-widest rounded-xl transition-all">
                          {isSavingRef ? <Loader2 className="animate-spin" size={14} /> : "SAVE"}
                       </Button>
                       <Button onClick={() => setIsEditingRef(false)} variant="ghost" className="h-9 text-white/40 hover:text-white px-3 rounded-xl">Cancel</Button>
                    </div>
                  ) : (
                    <>
                       <p className="font-mono text-indigo-400 text-xs truncate mr-4 select-all flex-1">{earnData.referralLink}</p>
                       <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => { setNewRefCode(earnData.referralCode); setIsEditingRef(true); }} className="p-2.5 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Customize Link">
                             <Edit3 size={16} />
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(earnData.referralLink); toast.success("Unique Link Copied!"); }} className="p-2.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all" title="Copy Link">
                             <Copy size={16} />
                          </button>
                       </div>
                    </>
                  )}
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

      {/* MODALS */}
      <SetPinModal 
        open={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        userId={user?.id}
        onSuccess={(newPin: string) => {
          setEarnData(prev => ({ ...prev, userPin: newPin, hasPin: true }));
          setIsPinModalOpen(false);
          fetchEarnData(); 
        }}
      />
      <WithdrawModal open={activeModal === "withdraw"} onClose={() => setActiveModal("none")} totalEarnings={earnData.walletTotal} userName={profile.fullName} userPin={earnData.userPin} userId={user?.id} bankName={wBank} setBankName={setWBank} accountNumber={wAcc} setAccountNumber={setWAcc} amount={wAmt} setAmount={setWAmt} onWithdraw={() => { fetchEarnData(); setActiveModal("success"); }} />
      <WithdrawSuccessModal open={activeModal === "success"} onClose={() => setActiveModal("none")} amount={wAmt} />
    </>
  );
}