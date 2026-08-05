"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, Landmark, User, Building2, CheckCircle2, Search, FileText, Copy, ShieldAlert } from "lucide-react"; 
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export default function AdminWithdrawalsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState("");

  // Modals State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Audit Detail Modal & Anti-Fraud Ledger
  const [auditDetailOpen, setAuditDetailOpen] = useState(false);
  const [selectedAuditTx, setSelectedAuditTx] = useState<any | null>(null);
  const [userLedger, setUserLedger] = useState<any[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetch("/api/admin/withdrawals/pending"),
        fetch("/api/admin/withdrawals/history")
      ]);
      const pendingData = await pendingRes.json();
      const historyData = await historyRes.json();
      
      if (pendingData.success) setTransactions(pendingData.data || []);
      if (historyData.success) setHistory(historyData.data || []);
    } catch (error) {
      toast.error("Failed to load vault data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (transactionId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    if (action === 'APPROVE' && !window.confirm(`Are you sure you want to APPROVE this withdrawal?`)) return;

    setProcessingId(transactionId);
    try {
      // 🔒 Grab the user's secure session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error("Authentication missing. Please log in again.");
        setProcessingId(null);
        return;
      }

      const res = await fetch("/api/admin/withdrawals/process", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // 🔒 Inject the token into the Authorization header
          "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ transactionId, action, reason }),
      });
      
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(data.message);
        setRejectModalOpen(false);
        setRejectReason("");
        fetchData(); 
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      toast.error("Network error while processing");
    } finally {
      setProcessingId(null);
    }
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copied to clipboard");
  };

  // 🔥 UPDATED: Opens modal AND fetches the user's last 10 transactions
  const openAuditModal = async (tx: any) => {
    setSelectedAuditTx(tx);
    setAuditDetailOpen(true);
    setUserLedger([]);
    setIsLoadingLedger(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch(`/api/admin/users/ledger?userId=${tx.user_id}`, {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        if (data.success) setUserLedger(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch user ledger", error);
      toast.error("Could not load user's financial history");
    } finally {
      setIsLoadingLedger(false);
    }
  };

  // Filter Logic
  const filteredPending = transactions.filter(tx => {
    const term = searchTerm.toLowerCase();
    return (
      (tx.users?.full_name || "").toLowerCase().includes(term) ||
      (tx.receiver_info?.account_name || "").toLowerCase().includes(term) ||
      (tx.receiver_info?.bank_name || "").toLowerCase().includes(term) ||
      (tx.receiver_info?.account_number || "").toLowerCase().includes(term) ||
      (tx.reference || "").toLowerCase().includes(term)
    );
  });

  const filteredHistory = history.filter(tx => {
    const term = searchTerm.toLowerCase();
    return (
      (tx.users?.full_name || "").toLowerCase().includes(term) ||
      (tx.receiver_info?.account_name || "").toLowerCase().includes(term) ||
      (tx.receiver_info?.bank_name || "").toLowerCase().includes(term) ||
      (tx.receiver_info?.account_number || "").toLowerCase().includes(term) ||
      (tx.reference || "").toLowerCase().includes(term) ||
      (tx.provider_tx_id || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Landmark className="text-emerald-500" /> Vault Control
            </h1>
            <p className="text-white/40 mt-1">Review pending payouts and audit transaction history.</p>
          </div>
          
          <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
            >
              Pending ({transactions.length})
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
            >
              Audit History
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input 
            type="text"
            placeholder="Search by student name, bank, account number, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-white/30"
          />
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p className="font-bold tracking-widest uppercase text-xs">Syncing Ledger...</p>
          </div>
        ) : activeTab === 'pending' ? (
          
          /* PENDING TAB */
          filteredPending.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center">
              <AlertCircle className="w-16 h-16 text-white/10 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white/60">No Requests Found</h3>
              <p className="text-white/30">Try clearing your search or wait for new payouts.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPending.map((tx) => (
                <div key={tx.id} className="bg-[#1e293b]/50 border border-white/10 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                  
                  {/* User & Bank Info */}
                  <div className="space-y-5 flex-1 w-full">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-md uppercase tracking-widest">
                        Pending Approval
                      </span>
                      <span className="text-[10px] text-white/30 font-mono">Req: {new Date(tx.created_at).toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* User Info */}
                      <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2"><User size={14} className="text-emerald-500" /><p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Requested By</p></div>
                        <p className="font-bold text-white text-lg">{tx.users?.full_name || "WDC User"}</p>
                      </div>
                      {/* Bank Info */}
                      <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2"><Building2 size={14} className="text-blue-400" /><p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Destination Bank</p></div>
                        <p className="font-bold text-white text-lg truncate">{tx.receiver_info?.account_name || "Unknown"}</p>
                        <p className="text-xs text-white/50 font-mono mt-0.5">{tx.receiver_info?.bank_name} • <span className="text-emerald-400">{tx.receiver_info?.account_number}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10 text-right min-w-[220px] w-full lg:w-auto">
                    <p className="text-[10px] text-emerald-500/70 uppercase font-black tracking-widest mb-1">User Receives</p>
                    <p className="text-3xl font-bold text-emerald-400">₦{Number(tx.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-white/30 mt-3 border-t border-emerald-500/10 pt-2 flex justify-between gap-4"><span>Platform Fee:</span><span className="font-mono text-amber-400">₦{Number(tx.fee).toLocaleString()}</span></p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row lg:flex-col gap-3 min-w-[160px] w-full lg:w-auto">
                    {/* 🔥 NEW: Inspect Button to open the Audit Modal for pending tx */}
                    <Button onClick={() => openAuditModal(tx)} variant="outline" className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 font-bold rounded-xl h-10">
                       <ShieldAlert className="mr-2" size={16} /> Inspect User
                    </Button>
                    <div className="flex gap-2 w-full">
                      <Button onClick={() => handleAction(tx.id, 'APPROVE')} disabled={processingId !== null} className="flex-1 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl h-12">
                        {processingId === tx.id ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle className="mr-2" size={16} /> Approve</>}
                      </Button>
                      <Button onClick={() => { setRejectId(tx.id); setRejectModalOpen(true); }} disabled={processingId !== null} variant="outline" className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold rounded-xl h-12">
                        <XCircle className="mr-2" size={16} /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )

        ) : (
          
          /* HISTORY TAB */
          <div className="grid gap-4">
            {filteredHistory.length === 0 ? (
               <div className="text-center p-20 text-white/30">No history matches your search.</div>
            ) : (
              filteredHistory.map((tx) => (
                <div 
                  key={tx.id} 
                  onClick={() => openAuditModal(tx)}
                  className="bg-white/[0.02] border border-white/5 hover:border-white/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer transition-all hover:bg-white/[0.04] group"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {tx.status === 'SUCCESS' ? (
                         <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-md uppercase tracking-widest"><CheckCircle2 size={12}/> Approved</span>
                      ) : (
                         <span className="flex items-center gap-1 text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-md uppercase tracking-widest"><XCircle size={12}/> Rejected</span>
                      )}
                      <span className="text-[10px] text-white/30 font-mono">Click for audit receipt</span>
                    </div>
                    <p className="font-bold text-lg group-hover:text-emerald-400 transition-colors">{tx.users?.full_name || "WDC User"}</p>
                    <div className="text-xs text-white/40 space-y-1">
                      <p><span className="font-bold">Requested:</span> {new Date(tx.created_at).toLocaleString()}</p>
                      <p><span className="font-bold">Processed:</span> {tx.admin_action_at ? new Date(tx.admin_action_at).toLocaleString() : "Unknown"}</p>
                    </div>
                  </div>

                  <div className="flex-1 text-left md:text-center px-4">
                     {tx.status === 'FAILED' && tx.rejection_reason && (
                        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 inline-block text-left">
                           <p className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-1">Rejection Reason</p>
                           <p className="text-sm text-white/80 line-clamp-1">{tx.rejection_reason}</p>
                        </div>
                     )}
                     {tx.status === 'SUCCESS' && tx.provider_tx_id && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3 inline-block text-left">
                           <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Provider Ref</p>
                           <p className="text-sm text-white/80 font-mono">{tx.provider_tx_id}</p>
                        </div>
                     )}
                  </div>

                  <div className="text-right min-w-[120px]">
                    <p className="text-2xl font-bold font-mono">₦{Number(tx.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-white/30 font-mono mt-1">Ref: {tx.reference.slice(-8)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* REJECTION MODAL */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-400">
              <AlertCircle /> Reject Withdrawal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-white/60">Please provide a reason for rejecting this withdrawal. The funds will be refunded to the user's wallet automatically.</p>
            <textarea 
               value={rejectReason}
               onChange={(e) => setRejectReason(e.target.value)}
               placeholder="e.g., Invalid account name mismatch..."
               className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500/50 min-h-[100px]"
            />
            <div className="flex gap-3 pt-2">
               <Button onClick={() => setRejectModalOpen(false)} variant="outline" className="flex-1 border-white/10 text-white/60 hover:bg-white/5">Cancel</Button>
               <Button 
                  onClick={() => rejectId && handleAction(rejectId, 'REJECT', rejectReason)} 
                  disabled={processingId !== null || !rejectReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white"
               >
                 {processingId !== null ? <Loader2 className="animate-spin" /> : "Confirm Rejection"}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADMIN AUDIT DETAIL MODAL & ANTI-FRAUD LEDGER */}
      <Dialog open={auditDetailOpen} onOpenChange={setAuditDetailOpen}>
        <DialogContent className="sm:max-w-xl bg-[#0f172a] border-white/10 text-white rounded-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {selectedAuditTx && (
            <>
              <DialogHeader className="text-center pb-4 border-b border-white/10">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Landmark className="text-emerald-500" size={24} />
                </div>
                <DialogTitle className="text-2xl font-black text-center">Audit Inspector</DialogTitle>
                <DialogDescription className="text-xs text-white/40 text-center font-mono">
                  Tx Ref: {selectedAuditTx.reference}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                
                {/* STATUS BADGE & MAIN AMOUNT */}
                <div className="text-center bg-black/40 p-6 rounded-2xl border border-white/5">
                  <span className={`inline-block font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest mb-3 ${
                    selectedAuditTx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    selectedAuditTx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {selectedAuditTx.status === 'SUCCESS' ? 'APPROVED & DISBURSED' : selectedAuditTx.status === 'PENDING' ? 'PENDING APPROVAL' : 'REJECTED & REFUNDED'}
                  </span>
                  <p className="text-4xl font-bold text-white font-mono">₦{Number(selectedAuditTx.amount).toLocaleString()}</p>
                  <p className="text-xs text-white/40 mt-1">Disbursed to Beneficiary Bank</p>
                </div>

                {/* USER & BENEFICIARY BREAKDOWN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* User Details */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">WDC Student</p>
                    <p className="text-base font-bold text-white">{selectedAuditTx.users?.full_name || "Unknown User"}</p>
                    <p className="text-xs text-white/50 truncate">{selectedAuditTx.users?.email || "No email"}</p>
                    <p className="text-[10px] text-white/30 font-mono mt-2">Auth ID: {selectedAuditTx.user_id.slice(-8)}</p>
                  </div>

                  {/* Beneficiary Bank Details */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Destination Bank</p>
                    <p className="text-base font-bold text-white truncate">{selectedAuditTx.receiver_info?.account_name || "Unknown"}</p>
                    <p className="text-xs text-white/60 font-mono">{selectedAuditTx.receiver_info?.bank_name}</p>
                    <p className="text-xs text-emerald-400 font-mono font-bold">{selectedAuditTx.receiver_info?.account_number}</p>
                  </div>
                </div>

                {/* FINANCIAL AUDIT LEDGER */}
                <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Payout Base Amount:</span>
                    <span className="font-mono text-white">₦{Number(selectedAuditTx.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Platform Processing Fee:</span>
                    <span className="font-mono text-amber-400">₦{Number(selectedAuditTx.fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/40">Total Balance Deducted from User:</span>
                    <span className="font-mono text-white font-bold">₦{Number(selectedAuditTx.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-white/40">Requested Timestamp:</span>
                    <span className="text-white/80">{new Date(selectedAuditTx.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Admin Action Timestamp:</span>
                    <span className="text-white/80">{selectedAuditTx.admin_action_at ? new Date(selectedAuditTx.admin_action_at).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>

                {/* PROVIDER / REJECTION LOG */}
                {selectedAuditTx.status === 'SUCCESS' && selectedAuditTx.provider_tx_id && (
                  <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 space-y-1">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Paystack Reference Code</p>
                    <p className="text-sm font-mono text-emerald-300 font-bold">{selectedAuditTx.provider_tx_id}</p>
                  </div>
                )}

                {selectedAuditTx.status === 'FAILED' && selectedAuditTx.rejection_reason && (
                  <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 space-y-1">
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Rejection Reason Note</p>
                    <p className="text-sm text-white/90">{selectedAuditTx.rejection_reason}</p>
                  </div>
                )}

                {/* 🚨 ANTI-FRAUD RECENT ACTIVITY */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="text-blue-400" size={16} />
                    <h4 className="text-sm font-bold text-white/80 uppercase tracking-wider">Recent Account Activity</h4>
                  </div>
                  {isLoadingLedger ? (
                    <div className="flex items-center gap-2 text-white/40 text-xs"><Loader2 className="animate-spin" size={14} /> Fetching secure ledger...</div>
                  ) : userLedger.length === 0 ? (
                    <p className="text-xs text-white/40">No recent transactions found.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {userLedger.map((lTx, i) => (
                        <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                          <div>
                            <p className="text-xs font-bold text-white truncate max-w-[200px]">{lTx.source || lTx.description || lTx.transaction_type}</p>
                            <p className="text-[10px] text-white/40 mt-1">{new Date(lTx.created_at).toLocaleDateString()} • <span className={lTx.status === 'SUCCESS' ? 'text-emerald-400' : lTx.status === 'FAILED' ? 'text-red-400' : 'text-amber-400'}>{lTx.status}</span></p>
                          </div>
                          <p className={`text-xs font-bold font-mono ${lTx.transaction_type === 'INFLOW' ? 'text-emerald-400' : 'text-white'}`}>
                            {lTx.transaction_type === 'INFLOW' ? '+' : '-'}₦{Number(lTx.amount).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => copyText(selectedAuditTx.reference)} 
                  variant="outline" 
                  className="w-full h-12 border-white/10 text-white/70 hover:bg-white/5 rounded-xl font-bold text-xs"
                >
                  <Copy size={14} className="mr-2" /> Copy Full Ledger Reference
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}