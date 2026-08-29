"use client";

import React, { useEffect, useState, useMemo, Fragment } from "react";
import { 
  Search, 
  CreditCard, 
  RefreshCcw, 
  Filter, 
  Activity, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowUpDown, 
  ShieldAlert, 
  Smartphone, 
  Monitor, 
  RotateCcw,
  UserCheck,
  UserX,
  CalendarDays,
  Layers,
  TrendingDown,
  XCircle,
  ChevronRight,
  ChevronDown,
  CornerDownRight
} from "lucide-react";
import { supabase } from '@/lib/supabase';

type TxStatus = "all" | "success" | "abandoned" | "failed";
type AmountFilter = "all" | "monthly" | "quarterly";
type SortKey = "email" | "accountStatus" | "date" | "plan" | "amount" | "status" | null;
type DrawerTab = "analytics" | "customer" | "timeline";

export function AdminPaymentsDashboard() {
  const [data, setData] = useState<any[]>([]);
  
  // 🔥 Now stores the full database subscription info, not just a true/false check
  const [registeredUsers, setRegisteredUsers] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter & UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TxStatus>("all");
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("all");
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("analytics");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Sorting States
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "date",
    direction: "desc"
  });

  const parseAmount = (val: any) => {
    if (!val) return 0;
    const clean = val.toString().replace(/,/g, '').replace(/[^\d.-]/g, '');
    return Number(clean) || 0;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // 1. Fetch live transactions from Paystack
      const payRes = await fetch(`/api/admin/payments?status=${statusFilter}`, {
        headers
      });
      
      if (payRes.ok) {
        const payJson = await payRes.json();
        if (payJson.success) {
          setData(payJson.data);
        }
      }

      // 2. Fetch users and map their exact Database Subscription Status
      const userRes = await fetch(`/api/admin/users?type=student`, {
        headers
      });
      
      if (userRes.ok) {
        const userJson = await userRes.json();
        if (userJson.success && Array.isArray(userJson.data)) {
          const uMap = new Map();
          userJson.data.forEach((u: any) => {
            if (u.email) {
              uMap.set(u.email.toLowerCase().trim(), {
                isRegistered: true,
                subStatus: u.subscription_status || "inactive",
              });
            }
          });
          setRegisteredUsers(uMap);
        }
      }
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  // Gold Data Filter (Monthly: ~15,000 / ~15,329.95, Quarterly: ~40,500 / ~41,218.28)
  const goldData = useMemo(() => {
    return data.filter((tx) => {
      const amt = parseAmount(tx.amount);
      const isMonthly = (amt >= 14800 && amt <= 15600) || (amt >= 1480000 && amt <= 1560000);
      const isQuarterly = (amt >= 40000 && amt <= 42500) || (amt >= 4000000 && amt <= 4250000);
      return isMonthly || isQuarterly;
    });
  }, [data]);

  // --- NEW CALCULATIONS FOR DAMI'S SCORECARDS ---
  const totalAmountSuccessful = useMemo(() => {
    return goldData
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + parseAmount(tx.amount), 0);
  }, [goldData]);

  const totalAmountAbandoned = useMemo(() => {
    return goldData
      .filter(tx => tx.status === 'abandoned')
      .reduce((sum, tx) => sum + parseAmount(tx.amount), 0);
  }, [goldData]);

  const totalAmountFailed = useMemo(() => {
    return goldData
      .filter(tx => tx.status === 'failed')
      .reduce((sum, tx) => sum + parseAmount(tx.amount), 0);
  }, [goldData]);
  // ----------------------------------------------

  // Apply UI Filters & Group by Email
  const groupedData = useMemo(() => {
    let result = [...goldData];

    // 1. Standard Filtering
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      result = result.filter(
        (tx) =>
          tx.customer?.email?.toLowerCase().includes(lowerQuery) ||
          tx.customer?.name?.toLowerCase().includes(lowerQuery) ||
          tx.reference?.toLowerCase().includes(lowerQuery)
      );
    }

    if (amountFilter === "monthly") {
      result = result.filter(tx => {
        const amt = parseAmount(tx.amount);
        return (amt >= 14800 && amt <= 15600) || (amt >= 1480000 && amt <= 1560000);
      });
    } else if (amountFilter === "quarterly") {
      result = result.filter(tx => {
        const amt = parseAmount(tx.amount);
        return (amt >= 40000 && amt <= 42500) || (amt >= 4000000 && amt <= 4250000);
      });
    }

    // 2. Group by email
    const groupsMap = new Map<string, any[]>();
    result.forEach(tx => {
      const email = tx.customer?.email?.toLowerCase().trim() || "unknown";
      if (!groupsMap.has(email)) groupsMap.set(email, []);
      groupsMap.get(email)!.push(tx);
    });

    // 3. Resolve the Parent row representing the group
    const groupsArray = Array.from(groupsMap.entries()).map(([email, txs]) => {
      // Sort internal txs newest to oldest
      txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // If there is a successful tx in this bundle, it becomes the face of the group. 
      // Otherwise, just show the most recent attempt.
      const successTx = txs.find(t => t.status === "success");
      const primaryTx = successTx || txs[0];
      const latestTx = txs[0]; // Used strictly for chronological sorting

      return { email, txs, primaryTx, latestTx };
    });

    // 4. Sort the parent groups
    if (sortConfig.key) {
      groupsArray.sort((aGroup, bGroup) => {
        const a = aGroup.primaryTx;
        const b = bGroup.primaryTx;
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "email":
            aValue = a.customer?.email || "";
            bValue = b.customer?.email || "";
            break;
          case "accountStatus":
            aValue = registeredUsers.get(a.customer?.email?.toLowerCase())?.subStatus || "";
            bValue = registeredUsers.get(b.customer?.email?.toLowerCase())?.subStatus || "";
            break;
          case "date":
            // Always sort chronologically by the absolute newest action in the group
            aValue = new Date(aGroup.latestTx.createdAt).getTime();
            bValue = new Date(bGroup.latestTx.createdAt).getTime();
            break;
          case "plan":
            aValue = a.plan?.name || a.reference || "";
            bValue = b.plan?.name || b.reference || "";
            break;
          case "amount":
            aValue = parseAmount(a.amount);
            bValue = parseAmount(b.amount);
            break;
          case "status":
            aValue = a.status || "";
            bValue = b.status || "";
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return groupsArray;
  }, [goldData, searchQuery, amountFilter, sortConfig, registeredUsers]);

  // Calculate the raw number of transactions matching current filters across all groups
  const totalFilteredTxs = useMemo(() => {
    return groupedData.reduce((acc, group) => acc + group.txs.length, 0);
  }, [groupedData]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const toggleGroup = (email: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(email)) newSet.delete(email);
      else newSet.add(email);
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <span className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">Successful</span>;
      case "abandoned":
        return <span className="border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">Abandoned</span>;
      case "failed":
        return <span className="border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">Failed</span>;
      default:
        return <span className="border border-slate-500/30 bg-slate-500/10 text-slate-400 text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-slate-200 min-h-screen bg-[#0f1523]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-wider mb-2 uppercase">
            <CreditCard size={14} />
            <span>Financial Operations</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Payments & Subscriptions</h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitor checkout sessions alongside actual database subscription access.
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a2333] border border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin text-cyan-400" : "text-cyan-400"} />
          Refresh records
        </button>
      </div>

      {/* Stats Cards - Married Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#131b2b] border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sessions</h3>
            <div className="p-2 bg-slate-800/50 rounded-lg text-cyan-400"><Activity size={18} /></div>
          </div>
          <p className="text-3xl font-bold text-white">{goldData.length}</p>
          <p className="text-xs text-slate-500 mt-2">All Paystack checkouts</p>
        </div>

        <div className="bg-[#131b2b] border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Office Subs</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><UserCheck size={18} /></div>
          </div>
          <p className="text-3xl font-bold text-white">
            {Array.from(registeredUsers.values()).filter(u => u.subStatus === 'active').length}
          </p>
          <p className="text-xs text-slate-500 mt-2">Currently active in database</p>
        </div>

        <div className="bg-[#131b2b] border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Monthly</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><CalendarDays size={18} /></div>
          </div>
          <p className="text-3xl font-bold text-white">
            {goldData.filter(d => d.status === 'success' && parseAmount(d.amount) < 20000).length}
          </p>
          <p className="text-xs text-slate-500 mt-2">Successful ~₦15k payments</p>
        </div>

        <div className="bg-[#131b2b] border border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid Quarterly</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Layers size={18} /></div>
          </div>
          <p className="text-3xl font-bold text-white">
             {goldData.filter(d => d.status === 'success' && parseAmount(d.amount) > 20000).length}
          </p>
          <p className="text-xs text-slate-500 mt-2">Successful ~₦40k payments</p>
        </div>
      </div>

      {/* Financial Summary Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#131b2b] border border-emerald-900/50 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Successful</h3>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><CheckCircle size={18} /></div>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalAmountSuccessful)}</p>
          <p className="text-xs text-slate-500 mt-2">Actual revenue captured</p>
        </div>

        <div className="bg-[#131b2b] border border-amber-900/50 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Total Abandoned</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><TrendingDown size={18} /></div>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalAmountAbandoned)}</p>
          <p className="text-xs text-slate-500 mt-2">Value of dropped checkouts</p>
        </div>

        <div className="bg-[#131b2b] border border-rose-900/50 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Total Failed</h3>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400"><XCircle size={18} /></div>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalAmountFailed)}</p>
          <p className="text-xs text-slate-500 mt-2">Value of failed attempts</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-[#131b2b] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
          <Filter size={16} className="text-cyan-400" />
          Filter records
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search email, name, or reference..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0f18] border border-slate-700 text-sm text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Paystack Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TxStatus)}
              className="w-full bg-[#0a0f18] border border-slate-700 text-sm text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All statuses</option>
              <option value="success">Successful</option>
              <option value="abandoned">Abandoned</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Plan / Tier</label>
            <select 
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value as AmountFilter)}
              className="w-full bg-[#0a0f18] border border-slate-700 text-sm text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Plans</option>
              <option value="monthly">Monthly (~₦15k)</option>
              <option value="quarterly">Quarterly (~₦41k)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button 
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); setAmountFilter("all"); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <X size={16} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#131b2b] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-white">Payment Records</h3>
            <p className="text-xs text-slate-400 mt-1">Showing {totalFilteredTxs} total attempts across {groupedData.length} customers</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0a0f18] text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800 select-none">
              <tr>
                <th onClick={() => handleSort("email")} className="px-5 py-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">Customer <ArrowUpDown size={12}/></div>
                </th>
                <th onClick={() => handleSort("accountStatus")} className="px-5 py-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">Sub Status<ArrowUpDown size={12}/></div>
                </th>
                <th onClick={() => handleSort("date")} className="px-5 py-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">Date <ArrowUpDown size={12}/></div>
                </th>
                <th onClick={() => handleSort("plan")} className="px-5 py-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">Plan / Ref <ArrowUpDown size={12}/></div>
                </th>
                <th onClick={() => handleSort("amount")} className="px-5 py-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">Amount <ArrowUpDown size={12}/></div>
                </th>
                <th onClick={() => handleSort("status")} className="px-5 py-4 cursor-pointer hover:text-white transition-colors">
                  <div className="flex items-center gap-2">Paystack Status <ArrowUpDown size={12}/></div>
                </th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Loading records...</td></tr>
              ) : groupedData.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">No matching records found.</td></tr>
              ) : groupedData.map((group) => {
                const { email, txs, primaryTx } = group;
                const isExpanded = expandedGroups.has(email);
                const hasMultiple = txs.length > 1;
                const uInfo = registeredUsers.get(email);
                
                // Exclude the primary transaction from the dropdown so we don't show it twice
                const nestedTxs = txs.filter(t => t.reference !== primaryTx.reference);

                return (
                  <Fragment key={email}>
                    {/* Parent Row */}
                    <tr className={`hover:bg-slate-800/30 transition-colors ${isExpanded ? "bg-slate-800/10" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-5">
                            {hasMultiple ? (
                              <button 
                                onClick={() => toggleGroup(email)} 
                                className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                              >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            ) : (
                              <span className="w-5 h-5"></span> /* Empty placeholder for alignment */
                            )}
                          </div>
                          
                          <div className="h-8 w-8 rounded bg-cyan-900/30 text-cyan-400 flex items-center justify-center font-bold text-xs uppercase border border-cyan-800/50">
                            {email[0] || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-white">{primaryTx.customer?.name !== '-' ? primaryTx.customer?.name : primaryTx.customer?.email}</div>
                            {primaryTx.customer?.name !== '-' && (
                              <div className="text-xs text-slate-400">{email}</div>
                            )}
                            {hasMultiple && !isExpanded && (
                              <div className="text-[10px] text-cyan-500/70 font-semibold mt-0.5">+{txs.length - 1} OTHER ATTEMPTS</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {!uInfo ? (
                          <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5"><UserX size={13}/> Unregistered</span>
                        ) : uInfo.subStatus === 'active' ? (
                          <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5"><UserCheck size={13}/> Active</span>
                        ) : uInfo.subStatus === 'trial' ? (
                          <span className="text-blue-400 text-xs font-medium flex items-center gap-1.5"><Clock size={13}/> Trial</span>
                        ) : (
                          <span className="text-amber-400 text-xs font-medium flex items-center gap-1.5 capitalize"><ShieldAlert size={13}/> {uInfo.subStatus}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {formatDate(primaryTx.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        {primaryTx.plan?.name ? (
                          <span className="text-cyan-400 text-xs font-semibold uppercase">{primaryTx.plan.name}</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">{primaryTx.reference}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                        {primaryTx.currency} {parseAmount(primaryTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(primaryTx.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedTx(primaryTx)}
                          className="px-4 py-1.5 border border-slate-600 rounded-full text-xs font-medium text-white hover:bg-slate-700 hover:border-slate-500 transition-colors"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>

                    {/* Sub-rows for retries */}
                    {isExpanded && hasMultiple && nestedTxs.map((subTx) => (
                      <tr key={subTx.reference} className="bg-[#0a0f18]/60 hover:bg-slate-800/40 transition-colors border-t border-slate-800/30">
                        <td className="px-5 py-3 pl-[60px]">
                          <div className="flex items-center gap-2">
                            <CornerDownRight size={14} className="text-slate-600" />
                            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Retry Log</span>
                          </div>
                        </td>
                        <td className="px-5 py-3"><span className="text-slate-600 text-xs">—</span></td>
                        <td className="px-5 py-3 text-slate-400 text-xs">{formatDate(subTx.createdAt)}</td>
                        <td className="px-5 py-3">
                          {subTx.plan?.name ? (
                            <span className="text-cyan-600 text-xs font-semibold uppercase">{subTx.plan.name}</span>
                          ) : (
                            <span className="text-slate-500 text-xs font-mono">{subTx.reference}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-400 text-xs">
                          {subTx.currency} {parseAmount(subTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 opacity-80">{getStatusBadge(subTx.status)}</td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setSelectedTx(subTx)}
                            className="px-3 py-1 border border-slate-700 rounded-full text-[10px] font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            View Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dark Theme Details Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 flex justify-end z-50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0f1523] h-full overflow-y-auto shadow-2xl border-l border-slate-800 flex flex-col">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>Transactions</span>
                  <span>›</span>
                  <span className="text-cyan-400">{selectedTx.reference}</span>
                </div>
                <button 
                  onClick={() => setSelectedTx(null)} 
                  className="text-slate-400 hover:text-white bg-[#131b2b] p-2 rounded-lg border border-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex justify-between items-start mt-4">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Amount</p>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    {selectedTx.currency} {parseAmount(selectedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
                <div>
                  {getStatusBadge(selectedTx.status)}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 flex gap-6 border-b border-slate-800 bg-[#0a0f18]">
              <button 
                onClick={() => setActiveTab("analytics")} 
                className={`py-3 text-xs font-bold transition-colors border-b-2 uppercase tracking-wider ${activeTab === 'analytics' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Analytics
              </button>
              <button 
                onClick={() => setActiveTab("customer")} 
                className={`py-3 text-xs font-bold transition-colors border-b-2 uppercase tracking-wider ${activeTab === 'customer' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Customer & Gateway
              </button>
              <button 
                onClick={() => setActiveTab("timeline")} 
                className={`py-3 text-xs font-bold transition-colors border-b-2 uppercase tracking-wider ${activeTab === 'timeline' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                Timeline Log
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {activeTab === "analytics" && (
                <div className="space-y-4">
                  <div className="bg-[#131b2b] border border-slate-800 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">IP Address</p>
                    <p className="text-sm font-mono text-cyan-400">{selectedTx.insights?.ip || "N/A"}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#131b2b] border border-slate-800 p-4 rounded-xl text-center">
                      <div className="flex justify-center mb-2 text-cyan-400">
                        {selectedTx.insights?.isMobile ? <Smartphone size={18} /> : <Monitor size={18} />}
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Device</p>
                      <p className="text-sm font-bold text-white mt-1">{selectedTx.insights?.isMobile ? "Mobile" : "Desktop"}</p>
                    </div>

                    <div className="bg-[#131b2b] border border-slate-800 p-4 rounded-xl text-center">
                      <div className="flex justify-center mb-2 text-cyan-400">
                        <Clock size={18} />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Time Spent</p>
                      <p className="text-sm font-bold text-white mt-1">{selectedTx.insights?.timeSpentInSeconds}s</p>
                    </div>

                    <div className="bg-[#131b2b] border border-slate-800 p-4 rounded-xl text-center">
                      <div className="flex justify-center mb-2 text-cyan-400">
                        <RotateCcw size={18} />
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Errors</p>
                      <p className={`text-sm font-bold mt-1 ${selectedTx.insights?.errorCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {selectedTx.insights?.errorCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "customer" && (
                <div className="space-y-4 text-sm">
                  <div className="bg-[#131b2b] border border-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Customer Name:</span>
                      <span className="font-medium text-white">{selectedTx.customer?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-medium text-white">{selectedTx.customer?.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Database Status:</span>
                      <span className={`font-medium capitalize ${registeredUsers.has(selectedTx.customer?.email?.toLowerCase().trim()) ? "text-emerald-400" : "text-slate-400"}`}>
                        {registeredUsers.get(selectedTx.customer?.email?.toLowerCase().trim())?.subStatus || "Unregistered"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Customer Code:</span>
                      <span className="font-mono text-cyan-400">{selectedTx.customer?.customerCode || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Channel:</span>
                      <span className="font-medium text-white capitalize">{selectedTx.channel || "Card"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-medium text-white">{formatDate(selectedTx.createdAt)}</span>
                    </div>
                  </div>

                  <div className="bg-[#131b2b] border border-slate-800 p-4 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Gateway Response</p>
                    <p className="text-sm font-medium text-white">{selectedTx.gatewayResponse || "No gateway message available."}</p>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div>
                  {selectedTx.insights?.fullHistory?.length > 0 ? (
                    <div className="space-y-4 border-l-2 border-slate-800 ml-2 pl-4 py-1">
                      {selectedTx.insights.fullHistory.map((step: any, idx: number) => (
                        <div key={idx} className="relative text-sm">
                          <span className={`absolute -left-[23px] top-1 h-3 w-3 rounded-full ring-4 ring-[#0f1523] ${step.isError ? "bg-rose-500" : "bg-cyan-500"}`}></span>
                          <span className="font-medium text-slate-200 block">{step.message}</span>
                          <span className="text-xs text-slate-500">{step.time} from session start</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No live checkout history logged for this session.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}