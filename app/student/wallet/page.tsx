"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link"; 
import { StudentHeader } from "../../components/students/StudentHeader";
import { Button } from "../../components/ui/button";
import { 
  Eye, EyeOff, ArrowDownLeft, ArrowUpRight, 
  Loader2, Copy, RotateCw, CheckCircle2,
  ArrowUpCircle, ArrowDownCircle, Clock, Landmark, ShieldCheck, XCircle, FileText, Info,
  Heart, AlertTriangle
} from "lucide-react";
import { toast } from "sonner"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/contexts/AuthContexts";

import { WithdrawModal } from "../../components/students/earn/WithdrawalModal";
import { WithdrawSuccessModal } from "../../components/students/earn/WithdrawSuccessModal";
import { ShareWalletModal } from "@/app/components/students/wallet/ShareWalletModal";

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
  const currentUserId = user?.id || user?.user_id;
  
  const [isLoadingWallet, setIsLoadingWallet] = useState(true); 
  const [walletData, setWalletData] = useState({
    bankName: "Wema Bank", accountNumber: "", accountName: "User", walletReady: false, userPin: ""
  });
  
  const [liveBalance, setLiveBalance] = useState<number>(0);
  const [userTrack, setUserTrack] = useState<string>("Tech"); 
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showSensitive, setShowSensitive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Pagination States
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Modals & Selected Transaction
  const [activeModal, setActiveModal] = useState<"none" | "withdraw" | "success" | "fund" | "detail" | "share">("none");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const [wBank, setWBank] = useState("");
  const [wAcc, setWAcc] = useState("");
  const [wAmt, setWAmt] = useState("");

  useEffect(() => {
    async function getTrack() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('users')
          .select('track')
          .eq('auth_id', user.id)
          .single();
          
        if (data?.track) {
          setUserTrack(data.track);
        } else if (user?.track) {
          setUserTrack(user.track);
        }
      } catch (err) {
        console.error("Error fetching track:", err);
      }
    }
    getTrack();
  }, [user?.id, user?.track]);

  const fetchTransactionHistory = useCallback(async (pageToLoad = 1) => {
    if (!currentUserId) return;
    
    if (pageToLoad === 1) setIsLoadingHistory(true);
    else setIsLoadingMore(true);

    try {
      const res = await fetch("/api/wallet/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, page: pageToLoad, limit: 15 }) 
      });
      const data = await res.json();

      if (data.success) {
        if (pageToLoad === 1) {
          setTransactions(data.transactions || []);
        } else {
          setTransactions(prev => [...prev, ...(data.transactions || [])]);
        }
        setHasMore(data.pagination?.hasNext || false);
        setCurrentPage(pageToLoad);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMore(false);
    }
  }, [currentUserId]);

  const fetchWalletData = useCallback(async () => {
    if (!currentUserId) return null;
    
    try {
      const { data: userData } = await supabase.from('users').select("wallet_balance").eq('auth_id', currentUserId).maybeSingle();

      const res = await fetch("/api/wallet/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId })
      });
      const data = await res.json();

      if (data.success && data.walletReady) {
        const wallet = data.walletData;
        setLiveBalance(wallet.balance || 0);
        setWalletData({
          bankName: getBankName(wallet.bank_name || "Wema Bank"),
          // 🔥 Ensure wiped account numbers are processed as empty strings
          accountNumber: wallet.account_number || "", 
          accountName: wallet.account_name || user?.fullName || "User",
          walletReady: true,
          userPin: wallet.transaction_pin || ""
        });
      } else {
        setWalletData(prev => ({ ...prev, walletReady: false }));
        if (userData) setLiveBalance(userData.wallet_balance || 0);
      }
    } catch (error) {
      console.error("Failed to fetch wallet details:", error);
      setWalletData(prev => ({ ...prev, walletReady: false }));
    } finally {
      setIsLoadingWallet(false);
    }
  }, [currentUserId, user?.fullName]);

  useEffect(() => {
    if (!currentUserId) return;
    
    fetchWalletData();
    fetchTransactionHistory(1);

    const channel = supabase.channel('wallet-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `auth_id=eq.${currentUserId}` }, 
      () => fetchWalletData()).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, fetchWalletData, fetchTransactionHistory]);

  const manualRefresh = async () => {
    setIsSyncing(true);
    try {
      await fetchWalletData();
      await fetchTransactionHistory(1);
      toast.success("Ledger Refreshed");
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleLoadMore = () => {
      if (hasMore && !isLoadingMore) fetchTransactionHistory(currentPage + 1);
  };

  const onWithdrawSuccess = () => {
    fetchWalletData();
    fetchTransactionHistory(1);
    setActiveModal("success");
  };

  const copyAccountNumber = (num: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    toast.success("Copied to clipboard", { icon: <Copy size={14} className="text-emerald-500"/> });
  };

  const openTxDetail = (tx: any) => {
    setSelectedTx(tx);
    setActiveModal("detail");
  };

  const isSelectedTxRejected = selectedTx?.status === 'FAILED' || selectedTx?.status === 'REJECTED';

  // 🔥 CORE LOGIC FOR UI STATE
  const isNewUser = !walletData.walletReady;
  const isMigratedUserMissingAccount = walletData.walletReady && !walletData.accountNumber;
  const isFullyReady = walletData.walletReady && !!walletData.accountNumber;

  return (
    <>
      <StudentHeader title="Global Ledger & Payroll" subtitle="Earnings and Transaction History" />
      
      <main className="flex-1 p-4 lg:p-8 space-y-10 max-w-6xl mx-auto">
        
        {isLoadingWallet ? (
          <div className="flex flex-col items-center justify-center py-40">
             <Loader2 className="w-10 h-10 animate-spin text-emerald-500/50 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Loading Secure Environment...</p>
          </div>
        ) : isMigratedUserMissingAccount ? (
          
          /* 🔥 MIGRATION SCREEN FOR EXISTING USERS */
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-emerald-500/30 rounded-[2rem] bg-emerald-950/20 shadow-2xl relative overflow-hidden text-center">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full"></div>
             
             <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 flex items-center justify-center rounded-full mb-6 relative z-10 border border-emerald-500/20">
               <AlertTriangle size={32} />
             </div>
             
             <h2 className="text-3xl font-black text-white mb-3 relative z-10 tracking-tight">System Infrastructure Upgrade</h2>
             <p className="text-white/60 mb-2 text-sm relative z-10 max-w-lg">
               We have upgraded our payment provider to <strong>Paystack</strong> to ensure faster and more secure payouts. 
             </p>
             <p className="text-emerald-400 mb-10 text-sm relative z-10 font-medium">
               Your previous balance and transaction history are completely safe. You just need to generate your new Paystack virtual account number to continue.
             </p>
             
             <Link href="/student/profile?tab=security" className="relative z-10">
              <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-wide rounded-2xl shadow-xl transition-transform hover:scale-105">
                GENERATE NEW ACCOUNT NUMBER
              </Button>
             </Link>
          </div>

        ) : isNewUser ? (
          
          /* SETUP WALLET GATE FOR BRAND NEW USERS */
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-white/10 rounded-[2rem] bg-[#1e293b]/20 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full"></div>
             <Landmark className="w-20 h-20 text-emerald-500/80 mb-6 relative z-10" />
             <h2 className="text-3xl font-black text-white mb-3 relative z-10 tracking-tight">Setup Your Settlement Account</h2>
             <p className="text-white/50 text-center mb-10 max-w-md text-sm leading-relaxed relative z-10">
               Before you can track your earnings, make deposits, or withdraw funds, you need to configure your banking profile and create your secure wallet.
             </p>
             <Link href="/student/profile?tab=security" className="relative z-10">
              <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-wide rounded-2xl shadow-xl transition-transform hover:scale-105">
                CONFIGURE WALLET
              </Button>
             </Link>
          </div>

        ) : (
          
          /* MAIN WALLET CARD (ONLY SHOWS IF FULLY READY) */
          <>
            <div className="bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-8 lg:p-12 bg-gradient-to-br from-[#1e293b]/50 to-transparent relative">
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                      <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                              Available Wallet Balance
                            </div>
                            {isSyncing && <Loader2 size={14} className="animate-spin text-emerald-500/50" />}
                          </div>
                          <p className="text-white/40 text-sm font-medium">Available to Withdraw</p>
                          <div className="flex items-center gap-6">
                              <h2 className="text-6xl font-bold text-white tracking-tighter">
                                  {showSensitive ? `₦${liveBalance.toLocaleString()}` : "₦****"}
                              </h2>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => setShowSensitive(!showSensitive)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/30 border border-white/5 transition-colors">
                                    {showSensitive ? <EyeOff size={20} /> : <Eye size={20} />}
                                  </button>
                                  <button onClick={manualRefresh} disabled={isSyncing} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/30 border border-white/5 transition-colors">
                                    <RotateCw size={20} className={isSyncing ? "animate-spin" : ""} />
                                  </button>
                              </div>
                          </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 w-full lg:w-auto">
                          <div className="flex gap-4">
                              <Button variant="outline" className="h-14 px-8 bg-white/5 border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 flex-1" onClick={() => setActiveModal("withdraw")}>
                                  <ArrowDownLeft size={20} className="mr-2 text-red-400" /> Withdraw
                              </Button>
                              <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex-1" onClick={() => setActiveModal("fund")}>
                                  Fund Account <ArrowUpRight size={20} className="ml-2" />
                              </Button>
                          </div>
                          
                          <button 
                            onClick={() => setActiveModal("share")}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-400 h-12 rounded-xl font-bold hover:bg-emerald-500/20 transition-all text-sm shadow-lg shadow-emerald-500/5"
                          >
                            <Heart size={16} fill="currentColor" className="text-emerald-500" /> Get Funded by Family & Friends
                          </button>
                      </div>
                  </div>
              </div>

              <div className="px-8 lg:px-12 py-10 bg-black/20 border-y border-white/5 grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-2">
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Receiving Institution</p>
                    <p className="text-white font-bold tracking-tight">{walletData.bankName}</p>
                  </div>
                  <div className="space-y-2 border-l border-white/5 pl-0 md:pl-10">
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Settlement Account</p>
                      <div className="flex items-center gap-3">
                          <p className="text-white font-mono text-xl font-bold tracking-widest">{walletData.accountNumber}</p>
                          <button onClick={() => copyAccountNumber(walletData.accountNumber)} className="text-emerald-500 hover:text-emerald-400">
                            <Copy size={16} />
                          </button>
                      </div>
                  </div>
                  <div className="space-y-2 border-l border-white/5 pl-0 md:pl-10">
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Account Designee</p>
                    <p className="text-white font-bold">{walletData.accountName}</p>
                  </div>
              </div>
            </div>

            {/* TRANSACTION HISTORY */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white tracking-tight">Ledger History</h3>
                  <span className="text-xs text-white/30">Click any transaction for full receipt</span>
                </div>

                <div className="bg-[#0f172a] rounded-3xl border border-white/5 overflow-hidden">
                    {isLoadingHistory ? (
                       <div className="p-20 flex flex-col items-center justify-center gap-4 text-white/20">
                         <Loader2 className="animate-spin" />
                         <p className="text-xs font-bold uppercase tracking-widest">Syncing Ledger...</p>
                       </div>
                    ) : transactions.length === 0 ? (
                       <div className="p-20 flex flex-col items-center justify-center gap-4 text-white/10 text-center">
                         <Clock size={40} className="mx-auto mb-2 opacity-20" />
                         <p className="text-sm font-medium">No transactions found yet.</p>
                       </div>
                    ) : (
                       <div className="divide-y divide-white/5">
                          {transactions.map((tx, idx) => {
                              const isLocalInflow = tx.transactionType ? tx.transactionType.toLowerCase() === 'credit' : tx.transaction_type === 'INFLOW';
                              const amount = Number(tx.amount || 0);
                              const fee = Number(tx.fee || 0);
                              const totalAmount = Number(tx.total_amount || tx.totalAmount || tx.amount || 0);
                              
                              const rawDate = tx.createdAt || tx.created_at;
                              const date = rawDate ? new Date(rawDate).toLocaleDateString() : 'Pending';
                              
                              const ref = tx.referenceTransactionId || tx.transactionId || tx.reference || 'N/A';
                              
                              const sourceName = tx.source || tx.description || tx.fundingMethod || tx.funding_method || 'Wallet Transaction';

                              const rawStatus = (tx.status || 'COMPLETED').toUpperCase();
                              let status = rawStatus === 'FAILED' ? 'REJECTED' : rawStatus;
                              
                              const isRefund = sourceName === 'Withdrawal Refund' || 
                                               tx.funding_method === 'SYSTEM_REFUND' || 
                                               tx.receiver_info?.account_name === 'Withdrawal Refund';

                              let displayTitle = sourceName;
                              
                              if (isRefund) {
                                  status = 'REFUNDED';
                                  displayTitle = 'Withdrawal Refund';
                              }

                              return (
                                  <div 
                                    key={tx._id || tx.id || idx} 
                                    onClick={() => openTxDetail(tx)}
                                    className="p-5 flex items-start justify-between hover:bg-white/[0.04] border-b border-white/5 last:border-0 transition-all cursor-pointer group"
                                  >
                                      <div className="flex items-start gap-4">
                                          <div className={`mt-1 w-10 h-10 rounded-full flex shrink-0 items-center justify-center transition-transform group-hover:scale-110 ${
                                            status === 'REJECTED' ? 'bg-zinc-500/10 text-zinc-500' :
                                            status === 'REFUNDED' ? 'bg-blue-500/10 text-blue-400' : 
                                            isLocalInflow ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'
                                          }`}>
                                              {isLocalInflow ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                          </div>
                                          <div>
                                              <p className={`text-sm font-bold group-hover:text-emerald-400 transition-colors ${status === 'REJECTED' ? 'text-white/40 line-through' : 'text-white'}`}>
                                                  {displayTitle}
                                              </p>
                                              <p className="text-[10px] text-white/40 font-medium uppercase mt-1">
                                                {date} • <span className={
                                                    status === 'REJECTED' ? 'text-red-400' : 
                                                    status === 'PENDING' ? 'text-amber-400' : 
                                                    status === 'REFUNDED' ? 'text-blue-400' : 
                                                    'text-emerald-400'
                                                }>{status}</span>
                                              </p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <p className={`text-lg font-bold ${status === 'REJECTED' ? 'text-white/20' : status === 'REFUNDED' ? 'text-blue-400' : isLocalInflow ? 'text-emerald-400' : 'text-white'}`}>
                                              {isLocalInflow ? '+' : '-'} ₦{amount.toLocaleString()}
                                          </p>
                                          {!isLocalInflow && fee > 0 && status !== 'REJECTED' && (
                                             <p className="text-[10px] text-white/40 font-medium mt-1">
                                                Fee: ₦{fee} <span className="mx-1">•</span> Total: ₦{totalAmount.toLocaleString()}
                                             </p>
                                          )}
                                          <p className="text-[9px] text-white/20 font-mono mt-1">Ref: {ref !== 'N/A' ? ref.slice(-10) : 'N/A'}</p>
                                      </div>
                                  </div>
                              );
                          })}
                          
                          {/* LOAD MORE BUTTON */}
                          {hasMore && (
                              <div className="p-6 flex justify-center bg-black/10">
                                  <Button 
                                      onClick={handleLoadMore} 
                                      disabled={isLoadingMore}
                                      variant="outline" 
                                      className="bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-full px-8"
                                  >
                                      {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                      {isLoadingMore ? "Loading Ledger..." : "View Older Transactions"}
                                  </Button>
                              </div>
                          )}
                       </div>
                    )}
                </div>
            </section>

            <div className="flex justify-center pt-10 pb-20">
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.02] border border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                    Wallet infrastructure secured by <span className="text-white/60">Paystack</span> <ShieldCheck size={12} className="text-emerald-500/70" />
                </div>
            </div>
          </>
        )}
      </main>

      {/* DETAILED RECEIPT MODAL */}
      <Dialog open={activeModal === "detail"} onOpenChange={(v) => !v && setActiveModal("none")}>
        <DialogContent className="sm:max-w-lg bg-[#0f172a] border-white/10 text-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Transaction Details</DialogTitle>
          <DialogDescription className="sr-only">Detailed view of your transaction receipt</DialogDescription>
          {selectedTx && (
            <>
              <DialogHeader className="text-center pb-4 border-b border-white/10">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <FileText className="text-emerald-500" size={24} />
                </div>
                <DialogTitle className="text-xl font-bold text-center">Transaction Receipt</DialogTitle>
                <DialogDescription className="text-xs text-white/40 text-center font-mono">
                  Ref: {selectedTx.reference || selectedTx.referenceTransactionId || 'N/A'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* 🔥 STRIKETHROUGH MATH AND REFUND BADGE */}
                <div className="text-center bg-black/30 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                  {isSelectedTxRejected && <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />}
                  
                  <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">
                    {selectedTx.transaction_type === 'INFLOW' || selectedTx.transactionType?.toLowerCase() === 'credit' ? 'Amount Received' : 'Amount Transferred'}
                  </p>
                  
                  <div className="flex items-center justify-center gap-3">
                    <p className={`text-4xl font-bold tracking-tight ${isSelectedTxRejected ? 'text-white/30 line-through' : 'text-white'}`}>
                      ₦{Number(selectedTx.amount || 0).toLocaleString()}
                    </p>
                  </div>

                  {Number(selectedTx.fee || 0) > 0 && (
                     <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-xs text-white/40">
                       <span className={isSelectedTxRejected ? 'line-through opacity-50' : ''}>Platform Fee: ₦{Number(selectedTx.fee).toLocaleString()}</span>
                       <span className={`font-bold ${isSelectedTxRejected ? 'text-white/30 line-through' : 'text-white/80'}`}>Total Charged: ₦{Number(selectedTx.total_amount || selectedTx.totalAmount || selectedTx.amount).toLocaleString()}</span>
                     </div>
                  )}
                </div>

                {/* METADATA GRID */}
                <div className="space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5 text-sm">
                  
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-white/40 text-xs">Status</span>
                    <span className={`font-bold text-xs px-2.5 py-1 rounded-md uppercase tracking-wider ${
                      isSelectedTxRejected ? 'bg-red-500/10 text-red-400' :
                      selectedTx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {isSelectedTxRejected ? 'REJECTED' : selectedTx.status || 'SUCCESS'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-white/40 text-xs">Date & Timestamp</span>
                    <span className="font-medium text-xs text-white">
                      {new Date(selectedTx.created_at || selectedTx.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-white/40 text-xs">Channel / Method</span>
                    <span className="font-medium text-xs text-white">
                      {selectedTx.funding_method || selectedTx.fundingMethod || 'Bank Transfer'}
                    </span>
                  </div>

                  {(selectedTx.balance_before !== undefined || selectedTx.balance_after !== undefined) && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-white/40 text-xs">Wallet Balance Impact</span>
                      
                      <div className="flex items-center gap-2">
                        {isSelectedTxRejected && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                            REFUNDED
                          </span>
                        )}
                        <span className={`font-mono text-xs ${isSelectedTxRejected ? 'text-white/30 line-through' : 'text-white/70'}`}>
                          ₦{Number(selectedTx.balance_before || 0).toLocaleString()} → <strong className={isSelectedTxRejected ? 'text-white/30' : 'text-emerald-400'}>₦{Number(selectedTx.balance_after || 0).toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedTx.provider_tx_id && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-white/40 text-xs">Provider Ref</span>
                      <span className="font-mono text-xs text-emerald-400">
                        {selectedTx.provider_tx_id}
                      </span>
                    </div>
                  )}

                  {selectedTx.rejection_reason && (
                    <div className="pt-2 text-left">
                      <span className="text-red-400 text-xs font-bold block mb-1">Rejection Reason</span>
                      <p className="text-xs text-white/70 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {selectedTx.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>

                {selectedTx.receiver_info && (
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Bank Details</p>
                    <p className="text-sm font-bold text-white">{selectedTx.receiver_info.account_name || 'N/A'}</p>
                    <p className="text-xs text-white/60 font-mono">
                      {selectedTx.receiver_info.bank_name || 'Bank'} • <span className="text-emerald-400">{selectedTx.receiver_info.account_number}</span>
                    </p>
                  </div>
                )}

                {selectedTx.description && (
                  <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Narration</p>
                    <p className="text-xs text-white/80">{selectedTx.description}</p>
                  </div>
                )}

                <Button 
                  onClick={() => copyAccountNumber(selectedTx.reference || selectedTx.id)} 
                  variant="outline"
                  className="w-full h-12 border-white/10 text-white/70 hover:bg-white/5 rounded-xl font-bold text-xs"
                >
                  <Copy size={14} className="mr-2" /> Copy Reference Code
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
                    <button onClick={() => copyAccountNumber(walletData.accountNumber)} className="text-white/40 hover:text-white bg-white/5 p-2 rounded-md transition-colors">
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
              onClick={() => { setActiveModal("none"); manualRefresh(); }} 
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl shadow-xl"
            >
              I HAVE MADE THE TRANSFER
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <WithdrawModal open={activeModal === "withdraw"} onClose={() => setActiveModal("none")} totalEarnings={liveBalance} userName={walletData.accountName} userPin={walletData.userPin} userId={currentUserId} bankName={wBank} setBankName={setWBank} accountNumber={wAcc} setAccountNumber={setWAcc} amount={wAmt} setAmount={setWAmt} onWithdraw={onWithdrawSuccess} />
      <WithdrawSuccessModal open={activeModal === "success"} onClose={() => setActiveModal("none")} amount={wAmt} />
      
      <ShareWalletModal 
        open={activeModal === "share"} 
        onClose={() => setActiveModal("none")}
        accountName={walletData.accountName}
        accountNumber={walletData.accountNumber}
        bankName={walletData.bankName}
        track={userTrack}
      />
    </>
  );
}