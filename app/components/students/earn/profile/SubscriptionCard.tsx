"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Calendar, CreditCard, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

export function SubscriptionCard() {
  const { user } = useAuth();
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSub() {
      if (!user?.id && !user?.user_id) return;
      
      const userId = user.id || user.user_id;

      const { data } = await supabase
        .from('users')
        // 🔥 Added subscription_plan to the fetch query
        .select('subscription_status, subscription_expires_at, last_payment_date, subscription_plan')
        .eq('auth_id', userId)
        .single();
        
      setSubData(data);
      setLoading(false);
    }
    fetchSub();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 bg-[#0f172a] rounded-2xl border border-white/5 flex flex-col items-center justify-center h-[180px]">
        <Loader2 className="animate-spin text-white/30 w-6 h-6 mb-2" />
        <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Loading Status...</p>
      </div>
    );
  }

  const isPro = subData?.subscription_status === 'active';
  const planType = subData?.subscription_plan || 'Monthly'; // Defaults to Monthly if null
  
  const expiresAt = subData?.subscription_expires_at 
    ? new Date(subData.subscription_expires_at).toLocaleDateString('en-NG', { dateStyle: 'medium' }) 
    : "Not Available";
    
  const lastPayment = subData?.last_payment_date 
    ? new Date(subData.last_payment_date).toLocaleDateString('en-NG', { dateStyle: 'medium' }) 
    : "Not Available";

  return (
    <div className="p-5 md:p-6 bg-[#0f172a] rounded-2xl border border-white/10 space-y-5 relative overflow-hidden shadow-lg w-full max-w-lg">
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[60px] pointer-events-none transition-all duration-1000 ${isPro ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
            Plan Overview {isPro && <ShieldCheck size={16} className="text-emerald-500" />}
          </h3>
          {/* 🔥 Displaying the Plan Type beautifully */}
          <div className="flex items-center gap-1.5 mt-1">
             <Sparkles size={12} className="text-amber-400" />
             <p className="text-[11px] text-amber-400 font-black uppercase tracking-widest">{planType} Plan</p>
          </div>
        </div>
        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${
          isPro ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {isPro ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 mb-1 text-white/40">
             <Calendar size={12} />
             <span className="text-[9px] uppercase font-bold tracking-widest">Expires On</span>
          </div>
          <p className="font-mono text-xs text-white font-bold">{expiresAt}</p>
        </div>
        <div className="bg-black/20 p-3.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 mb-1 text-white/40">
             <CreditCard size={12} />
             <span className="text-[9px] uppercase font-bold tracking-widest">Last Renewed</span>
          </div>
          <p className="font-mono text-xs text-white">{lastPayment}</p>
        </div>
      </div>

      {!isPro && (
        <Link href="/student/wallet" className="block relative z-10 pt-1">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg h-10 text-xs transition-transform hover:scale-[1.02]">
            Fund Wallet to Renew Access
          </Button>
        </Link>
      )}
    </div>
  );
}