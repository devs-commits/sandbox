"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { StudentHeader } from "../../components/students/StudentHeader";
import { Button } from "../../components/ui/button";
import { 
  Eye, EyeOff, ArrowDownLeft, ArrowUpRight, 
  Loader2, Copy, RotateCw, ExternalLink,
  ArrowUpCircle, ArrowDownCircle, Clock, Landmark 
} from "lucide-react";
import { toast } from "sonner"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";

import { WithdrawModal } from "../../components/students/earn/WithdrawalModal";
import { WithdrawSuccessModal } from "../../components/students/earn/WithdrawSuccessModal";

const getBankName = (codeOrName: string) => {
  const bankMap: Record<string, string> = {
    "000013": "GTBank", "000015": "Zenith Bank", "000014": "Access Bank",
    "000016": "First Bank", "000030": "Parallex Bank", "000004": "UBA",
    "100004": "OPay", "090405": "Moniepoint", "100033": "PalmPay"
  };
  return bankMap[codeOrName] || codeOrName;
};

export default function GlobalWallet() {
  const { user } = useAuth();
  
  const [isLoadingWallet, setIsLoadingWallet] = useState(true); 
  
  const [walletData, setWalletData] = useState({
    balance: 0, bankName: "Parallex Bank", accountNumber: "****", accountName: "User", walletReady: false, userPin: ""
  });
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showSensitive, setShowSensitive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Modal States
  const [activeModal, setActiveModal] = useState<"none" | "withdraw" | "success" | "fund">("none");
  const [wBank, setWBank] = useState("");
  const [wAcc, setWAcc] = useState("");
  const [wAmt, setWAmt] = useState("");

  const fetchTransactionHistory = useCallback(async (accNum: string) => {
    if (!accNum || accNum === "****") return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/wallet/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, accountNumber: accNum }) 
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions || []);
        // 🔥 Update the balance with the Absolute Truth from Supply Smart
        setWalletData(prev => ({ 
           ...prev, 
           balance: data.balance,
           bankName: data.bankName || prev.bankName
        }));
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id]);

  const fetchWalletData = useCallback(async () => {
    const { data: wallet } = await supabase.from('wallets').select("*").eq('user_id', user?.id).maybeSingle();
    if (wallet) {
      const formattedData = {
        balance: wallet.balance || 0,
        bankName: getBankName(wallet.bank_name || "Parallex Bank"),
        accountNumber: wallet.account_number || "****",
        accountName: wallet.account_name || user?.fullName || "User",
        walletReady: !!(wallet.account_number && wallet.account_number !== "****"),
        userPin: wallet.transaction_pin || ""
      };
      setWalletData(formattedData);
      setIsLoadingWallet(false);
      return wallet;
    }
    setIsLoadingWallet(false);
    return null;
  }, [user?.id, user?.fullName]);

  useEffect(() => {
    if (!user?.id) return;
    const init = async () => {
        const wallet = await fetchWalletData();
        if (wallet?.account_number) fetchTransactionHistory(wallet.account_number);
    };
    init();

    // Supabase subscription just keeps local state fresh if something updates DB
    const channel = supabase.channel('wallet-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, 
      () => fetchWalletData()).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, fetchWalletData, fetchTransactionHistory]);

  // 🔥 Now directly calls the history route to sync with Supply Smart, bypassing the deleted sync route
  const manualRefresh = async () => {
    setIsSyncing(true);
    try {
      if (walletData.accountNumber !== "****") {
          await fetchTransactionHistory(walletData.accountNumber);
      }
      toast.success("Account Refreshed");
    } finally { 
      setIsSyncing(false); 
    }
  };

  const onWithdrawSuccess = () => {
    if (walletData.accountNumber !== "****") {
        fetchTransactionHistory(walletData.accountNumber);
    }
    setActiveModal("success");
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(walletData.accountNumber);
    toast.success("Copied to clipboard", { icon: <Copy size={14} className="text-emerald-500"/> });
  };

  return (
    <>
      <StudentHeader title="Global Payroll" subtitle="Settlement and Transaction History" />
      
      <main className="flex-1 p-4 lg:p-8 space-y-10 max-w-6xl mx-auto">
        
        {isLoadingWallet ? (
          <div className="flex flex-col items-center justify-center py-40">
             <Loader2 className="w-10 h-10 animate-spin text-emerald-500/50 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Loading Secure Environment...</p>
          </div>
        ) : walletData.walletReady ? (
          <>
            {/* MAIN WALLET CARD */}
            <div className="bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-8 lg:p-12 bg-gradient-to-br from-[#1e293b]/50 to-transparent relative">
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                      <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Portfolio</div>
                            {isSyncing && <Loader2 size={14} className="animate-spin text-emerald-500/50" />}
                          </div>
                          <p className="text-white/40 text-sm font-medium">Available Balance</p>
                          <div className="flex items-center gap-6">
                              <h2 className="text-6xl font-bold text-white tracking-tighter">
                                  {showSensitive ? `₦${walletData.balance.toLocaleString()}` : "₦****"}
                              </h2>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => setShowSensitive(!showSensitive)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/30 border border-white/5">{showSensitive ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                                  <button onClick={manualRefresh} disabled={isSyncing} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/30 border border-white/5"><RotateCw size={20} className={isSyncing ? "animate-spin" : ""} /></button>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-4 mb-2">
                          <Button variant="outline" className="h-14 px-8 bg-white/5 border-white/10 text-white font-bold rounded-2xl hover:bg-white/10" onClick={() => setActiveModal("withdraw")}>
                              <ArrowDownLeft size={20} className="mr-2 text-red-400" /> Withdraw
                          </Button>
                          <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl" onClick={() => setActiveModal("fund")}>
                              Fund Account <ArrowUpRight size={20} className="ml-2" />
                          </Button>
                      </div>
                  </div>
              </div>

              <div className="px-8 lg:px-12 py-10 bg-black/20 border-y border-white/5 grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-2"><p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Receiving Institution</p><p className="text-white font-bold tracking-tight">{walletData.bankName}</p></div>
                  <div className="space-y-2 border-l border-white/5 pl-0 md:pl-10">
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Settlement Account</p>
                      <div className="flex items-center gap-3">
                          <p className="text-white font-mono text-xl font-bold tracking-widest">{walletData.accountNumber}</p>
                          <button onClick={copyAccountNumber} className="text-emerald-500 hover:text-emerald-400"><Copy size={16} /></button>
                      </div>
                  </div>
                  <div className="space-y-2 border-l border-white/5 pl-0 md:pl-10"><p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Account Designee</p><p className="text-white font-bold">{walletData.accountName}</p></div>
              </div>
            </div>

            {/* TRANSACTION HISTORY */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold text-white tracking-tight">Transaction History</h3>
                <div className="bg-[#0f172a] rounded-3xl border border-white/5 overflow-hidden">
                    {isLoadingHistory ? (
                       <div className="p-20 flex flex-col items-center justify-center gap-4 text-white/20"><Loader2 className="animate-spin" /><p className="text-xs font-bold uppercase tracking-widest">Syncing Ledger...</p></div>
                    ) : transactions.length === 0 ? (
                       <div className="p-20 flex flex-col items-center justify-center gap-4 text-white/10 text-center"><Clock size={40} className="mx-auto mb-2 opacity-20" /><p className="text-sm font-medium">No transactions found yet.</p></div>
                    ) : (
                       <div className="divide-y divide-white/5">
                          {transactions.map((tx, idx) => {
                              // 🔥 Matches new backend schema
                              const isLocalInflow = tx.type === 'INFLOW';
                              const amount = Number(tx.amount || 0);
                              const date = tx.date ? new Date(tx.date).toLocaleDateString() : 'Pending';
                              const ref = tx.reference || tx.id || 'N/A';
                              const status = tx.status || 'COMPLETED';
                              const sourceName = tx.source || 'Supply Smart';

                              return (
                                  <div key={tx.id || idx} className="p-5 flex items-center justify-between hover:bg-white/[0.02] border-b border-white/5 last:border-0">
                                      <div className="flex items-center gap-4">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLocalInflow ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                              {isLocalInflow ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-white">
                                                  {sourceName}
                                              </p>
                                              <p className="text-[10px] text-white/30 font-medium uppercase">{date} • {status}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className={`text-lg font-bold ${isLocalInflow ? 'text-emerald-400' : 'text-white'}`}>
                                              {isLocalInflow ? '+' : '-'} ₦{amount.toLocaleString()}
                                          </p>
                                          <p className="text-[9px] text-white/20 font-mono">Ref: {ref.slice(-10)}</p>
                                      </div>
                                  </div>
                              );
                          })}
                       </div>
                    )}
                </div>
            </section>

            <div className="flex justify-center pt-10">
                <a href="https://www.supplysmart.co/" target="_blank" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-emerald-500 transition-all">
                    Wallet and Transfer Powered by <span className="text-white/60">Supply Smart</span> <ExternalLink size={10} />
                </a>
            </div>
          </>

        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-white/10 rounded-[2rem] bg-[#1e293b]/20 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full"></div>
             <Landmark className="w-20 h-20 text-emerald-500/80 mb-6 relative z-10" />
             <h2 className="text-3xl font-black text-white mb-3 relative z-10 tracking-tight">Setup Your Settlement Account</h2>
             <p className="text-white/50 text-center mb-10 max-w-md text-sm leading-relaxed relative z-10">
               Before you can track your earnings, make deposits, or withdraw funds, you need to configure your banking profile and create your secure wallet.
             </p>
             <Link href="/student/profile" className="relative z-10">
               <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-wide rounded-2xl shadow-xl transition-transform hover:scale-105">
                 CONFIGURE WALLET
               </Button>
             </Link>
          </div>
        )}

      </main>

      {/* 🔥 NEW SUPPLY SMART FUNDING MODAL */}
      <Dialog open={activeModal === "fund"} onOpenChange={(v) => !v && setActiveModal("none")}>
        <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase">Fund Your Wallet</DialogTitle>
            <DialogDescription className="text-white/40">
              Transfer funds directly to your dedicated account below. Your wallet will be credited instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
               <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Bank Name</p>
                  <p className="text-lg text-white font-medium">{walletData.bankName}</p>
               </div>
               <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Account Number</p>
                  <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                    <p className="text-2xl font-mono text-emerald-400 tracking-widest">{walletData.accountNumber}</p>
                    <button onClick={copyAccountNumber} className="text-white/40 hover:text-white bg-white/5 p-2 rounded-md transition-colors">
                      <Copy size={20} />
                    </button>
                  </div>
               </div>
               <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Account Name</p>
                  <p className="text-sm text-white font-medium">{walletData.accountName}</p>
               </div>
            </div>

            <Button 
              onClick={() => { 
                setActiveModal("none"); 
                manualRefresh(); 
              }} 
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl"
            >
              I HAVE MADE THE TRANSFER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WithdrawModal open={activeModal === "withdraw"} onClose={() => setActiveModal("none")} totalEarnings={walletData.balance} userName={walletData.accountName} userPin={walletData.userPin} userId={user?.id} bankName={wBank} setBankName={setWBank} accountNumber={wAcc} setAccountNumber={setWAcc} amount={wAmt} setAmount={setWAmt} onWithdraw={onWithdrawSuccess} />
      <WithdrawSuccessModal open={activeModal === "success"} onClose={() => setActiveModal("none")} amount={wAmt} />
    </>
  );
}