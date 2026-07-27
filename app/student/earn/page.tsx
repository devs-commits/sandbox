"use client";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useRouter } from "next/navigation";
import {
  Copy, Link as LinkIcon, ShieldCheckIcon, ChevronRight, Edit3, Loader2, Users
} from "lucide-react";

import { WithdrawModal } from "../../components/students/earn/WithdrawalModal";
import { WithdrawSuccessModal } from "../../components/students/earn/WithdrawSuccessModal";
import { SocialIcon } from "../../components/students/earn/SocialIcon";
import { SetPinModal } from "../../components/auth/SetPinModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";
import { toast } from "sonner";

// General Referral Link Copy
const getSocialLinks = (referralLink: string) => {
  const encodedLink = encodeURIComponent(`${referralLink}`);
  const rawShareText = `I found something interesting 👀\nWDC Labs lets you actually practice real work instead of just learning theory.\nJoin me here and start building real experience today 👇\n`;
  const shareText = encodeURIComponent(rawShareText);
  
  return [
    { name: "Copy link", icon: "link", color: "bg-cyan-500/20 text-cyan-500", url: null },
    { name: "Instagram", icon: "instagram", color: "bg-pink-500/10 text-pink-500", url: `https://www.instagram.com/` },
    { name: "Whatsapp", icon: "whatsapp", color: "bg-green-500/20 text-green-500", url: `https://wa.me/?text=${shareText}${encodedLink}` },
    { name: "X", icon: "x", color: "bg-white/10 text-white", url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}` },
    { name: "Linkedin", icon: "linkedin", color: "bg-blue-700/10 text-blue-700", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}` },
  ];
};

export default function EarnMoney() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<any>("none");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [isEditingRef, setIsEditingRef] = useState(false);
  const [newRefCode, setNewRefCode] = useState("");
  const [isSavingRef, setIsSavingRef] = useState(false);

  const [profile, setProfile] = useState({ fullName: "", dob: "" });
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  
  const [earnData, setEarnData] = useState({ 
    dbId: 0, 
    earningsBalance: 0, 
    activeReferrals: 0, 
    pendingReferrals: 0,
    referralCode: "", 
    referralLink: "Loading...", 
    hasCustomizedRef: false, 
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
      
      const { data: refs } = await supabase.from('referrals').select('*').eq('referrer_id', userData?.id).order('created_at', { ascending: false });
      
      let activeCount = 0;
      let pendingCount = 0;
      let combinedList: any[] = [];

      if (refs && refs.length > 0) {
        refs.forEach(r => r.status === 'completed' ? activeCount++ : pendingCount++);
        
        const refereeIds = refs.map(r => r.referee_id);
        const { data: refUsers } = await supabase.from('users').select('auth_id, full_name').in('auth_id', refereeIds);
        
        combinedList = refs.map(r => {
           const match = refUsers?.find(u => u.auth_id === r.referee_id);
           return {
               id: r.id,
               name: match?.full_name || 'Anonymous User',
               status: r.status,
               date: new Date(r.created_at).toLocaleDateString()
           };
        });
      }
      
      setReferredUsers(combinedList);

      if (userData) {
        const baseCode = userData.referral_code || userData.full_name?.split(" ")[0]?.toLowerCase() || userData.id.toString();
        const universalLink = `${window.location.origin}/signup?ref=${baseCode}`;

        setEarnData({
          dbId: userData.id,
          earningsBalance: userData.wallet_balance || 0,
          activeReferrals: activeCount,
          pendingReferrals: pendingCount,
          referralCode: baseCode,
          referralLink: universalLink,
          hasCustomizedRef: userData.has_customized_referral || false,
          userPin: walletData?.transaction_pin || "", 
          hasPin: !!walletData?.transaction_pin
        });
        
        setProfile({ fullName: userData.full_name || "", dob: userData.date_of_birth || "Not Set" });
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveReferralCode = async () => {
    if (!newRefCode.trim()) return toast.error("Referral code cannot be empty");
    const formattedCode = newRefCode.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (formattedCode === earnData.referralCode) { setIsEditingRef(false); return; }

    setIsSavingRef(true);
    try {
      const response = await fetch('/api/referrals/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: earnData.dbId, newReferralCode: formattedCode })
      });
      const result = await response.json();
      if (!response.ok) { toast.error(result.error || "Failed to update link"); return; }
      toast.success(result.message || "Custom referral link firmly locked in!");
      setIsEditingRef(false);
      fetchEarnData(); 
    } catch (err) { toast.error("An unexpected error occurred."); } finally { setIsSavingRef(false); }
  };

  const handleCashOutClick = () => {
    if (profile.dob === "Not Set") {
      toast.error("Action Required: Please set your DOB in your profile before withdrawing.");
      return;
    }
    setActiveModal("withdraw");
  };

  return (
    <>
      <StudentHeader title="General Earnings" subtitle="Your master affiliate dashboard." />
      <main className="flex-1 p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* 🔥 FIX: Changed to lg:grid-cols-2 so it fills the screen perfectly */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] rounded-[2rem] p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
               <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">Withdrawable Cash</p>
               <h2 className="text-5xl font-bold text-white tracking-tighter">₦{earnData.earningsBalance.toLocaleString()}</h2>
               <Button onClick={handleCashOutClick} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] h-12 rounded-2xl tracking-widest shadow-xl">
                 WITHDRAW TO BANK <ChevronRight size={14} />
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
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-[1rem] flex items-center justify-center">
                 <ShieldCheckIcon className="text-emerald-500" size={24} />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                 <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Pending (Unpaid)</p>
                 <span className="text-xl font-bold text-white/50">{earnData.pendingReferrals}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LINK UI */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20"><LinkIcon className="text-indigo-400" size={24} /></div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">General Referral Link</h3>
                    <p className="text-xs text-white/40 mt-1">Use this if your squad is full.</p>
                  </div>
              </div>
              
              <div className="flex flex-col mb-10">
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl flex items-center justify-between min-h-[72px]">
                    {isEditingRef ? (
                      <div className="flex items-center gap-2 flex-1 w-full">
                         <span className="text-indigo-400/50 text-xs hidden sm:inline">.../ref=</span>
                         <Input value={newRefCode} onChange={(e) => setNewRefCode(e.target.value)} className="flex-1 bg-white/5 border-white/10 text-white h-9 rounded-xl text-xs font-mono focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="custom-link" autoFocus />
                         <Button onClick={handleSaveReferralCode} disabled={isSavingRef} className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-4 font-bold tracking-widest rounded-xl transition-all">
                            {isSavingRef ? <Loader2 className="animate-spin" size={14} /> : "SAVE"}
                         </Button>
                      </div>
                    ) : (
                      <>
                         <p className="font-mono text-indigo-400 text-xs truncate mr-4 select-all flex-1">{earnData.referralLink}</p>
                         <div className="flex items-center gap-2 shrink-0">
                            {!earnData.hasCustomizedRef && (
                              <button onClick={() => { setNewRefCode(earnData.referralCode); setIsEditingRef(true); }} className="p-2.5 bg-white/5 text-white/50 hover:text-white rounded-xl transition-all">
                                 <Edit3 size={16} />
                              </button>
                            )}
                            <button onClick={() => { navigator.clipboard.writeText(earnData.referralLink); toast.success("Unique Link Copied!"); }} className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl transition-all">
                               <Copy size={16} />
                            </button>
                         </div>
                      </>
                    )}
                </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Share To:</p>
                 <div className="flex flex-wrap gap-3">
                    {getSocialLinks(earnData.referralLink).map((link, i) => (
                      <button key={i} onClick={() => link.url ? window.open(link.url, '_blank') : navigator.clipboard.writeText(earnData.referralLink)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-transform hover:scale-105 ${link.color}`}>
                        <SocialIcon name={link.icon} /> {link.name}
                      </button>
                    ))}
                 </div>
              </div>
          </div>

          {/* THE REFERRED USERS LIST */}
          <div className="bg-[#0f172a] rounded-[2.5rem] p-8 lg:p-10 border border-white/5 shadow-2xl flex flex-col min-h-[400px]">
              <h3 className="text-xl font-bold text-white tracking-tight mb-6">Your Network</h3>
              
              {referredUsers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
                  <Users size={40} className="text-white/20" />
                  <p className="text-sm text-white/50 font-medium">You haven't referred anyone yet.<br/>Share your link to start earning.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[350px] custom-scrollbar">
                  {referredUsers.map((ref) => (
                    <div key={ref.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                      <div>
                        <p className="text-sm font-bold text-white/90">{ref.name}</p>
                        <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">{ref.date}</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        ref.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {ref.status === 'completed' ? 'Active (Paid)' : 'Pending'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </main>

      <SetPinModal open={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} userId={user?.id} onSuccess={(newPin: string) => { setEarnData(prev => ({ ...prev, userPin: newPin, hasPin: true })); setIsPinModalOpen(false); fetchEarnData(); }} />
      <WithdrawModal open={activeModal === "withdraw"} onClose={() => setActiveModal("none")} totalEarnings={earnData.earningsBalance} userName={profile.fullName} userPin={earnData.userPin} userId={user?.id} bankName={wBank} setBankName={setWBank} accountNumber={wAcc} setAccountNumber={setWAcc} amount={wAmt} setAmount={setWAmt} onWithdraw={() => { fetchEarnData(); setActiveModal("success"); }} />
      <WithdrawSuccessModal open={activeModal === "success"} onClose={() => setActiveModal("none")} amount={wAmt} />
    </>
  );
}