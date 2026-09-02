"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, ShieldAlert, CheckCircle, Search, User, History, 
  AlertTriangle, Database, Clock, Calendar, AlignLeft, RefreshCw, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase'; 

interface AdminTaskGeneratorProps {
  adminId: string;
}

export function AdminTaskGenerator({ adminId }: AdminTaskGeneratorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("Force Assign Task");
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [overrideReason, setOverrideReason] = useState("");
  
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const [logsPerPage, setLogsPerPage] = useState<number | 'all'>(10);
  const [currentLogPage, setCurrentLogPage] = useState<number>(1);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/tasks/logs');
      const data = await res.json();
      if (res.ok && data.logs) setDbLogs(data.logs);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return dbLogs.filter(log => {
      const search = logSearchQuery.toLowerCase().trim();
      if (!search) return true;
      const name = log.users?.full_name?.toLowerCase() || '';
      const email = log.users?.email?.toLowerCase() || '';
      const details = log.details?.toLowerCase() || '';
      return name.includes(search) || email.includes(search) || details.includes(search) || log.assigned_week?.toString().includes(search);
    });
  }, [dbLogs, logSearchQuery]);

  useEffect(() => {
    setCurrentLogPage(1);
  }, [logSearchQuery, logsPerPage]);

  const totalLogPages = logsPerPage === 'all' ? 1 : Math.ceil(filteredLogs.length / Number(logsPerPage));
  const paginatedLogs = useMemo(() => {
    if (logsPerPage === 'all') return filteredLogs;
    const pageSize = Number(logsPerPage);
    const start = (currentLogPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentLogPage, logsPerPage]);

  const groupedTasksByWeek = useMemo(() => {
    if (!userTasks || userTasks.length === 0) return [];

    const groups: Record<number, any[]> = {};
    
    userTasks.forEach(task => {
      const weekNum = Number(task.task_number || task.week || 1);
      if (!groups[weekNum]) groups[weekNum] = [];
      groups[weekNum].push(task);
    });

    const sortedWeeks = Object.keys(groups).map(Number).sort((a, b) => b - a);

    return sortedWeeks.map(weekNum => {
      const tasksInWeek = groups[weekNum];
      const sortedInWeek = [...tasksInWeek].sort((a, b) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      const primaryTask = sortedInWeek[0];
      const archivedHistory = sortedInWeek.slice(1);

      return {
        weekNum,
        primaryTask,
        archivedHistory,
        totalAttempts: sortedInWeek.length
      };
    });
  }, [userTasks]);

  const toggleWeekExpand = (weekNum: number) => {
    setExpandedWeeks(prev => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  const getFormattedStatusLabel = (status: string, isCompletedBool?: boolean) => {
    if (isCompletedBool) return 'COMPLETED';
    if (!status) return 'N/A';
    if (status === 'approved' || status === 'passed') return 'COMPLETED';
    if (status === 'archived_by_admin') return 'OVERRIDDEN';
    return status.replace(/_/g, ' ');
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    return accessToken 
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` } 
      : { 'Content-Type': 'application/json' };
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return toast.error("Enter a name or email to search.");
    setIsSearching(true);
    setSearchResults([]);
    setVerifiedUser(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`, { headers });
      const data = await res.json();
      if (res.ok && data.users && data.users.length > 0) {
        setSearchResults(data.users);
      } else {
        toast.error("No interns found matching that query.");
      }
    } catch (err) {
      toast.error("Network error during search.");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchUserTaskHistory = async (userId: string) => {
    setIsLoadingTasks(true);
    try {
      const res = await fetch(`/api/admin/tasks/history?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (res.ok && data.tasks) {
        setUserTasks(data.tasks);
      } else {
        setUserTasks([]);
      }
    } catch (err) {
      console.error("Failed to fetch task history", err);
      setUserTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const selectUser = (user: any) => {
    setVerifiedUser(user);
    const nextWeek = (Number(user.current_week) || 0) + 1;
    setSelectedWeek(Math.min(Math.max(nextWeek, 1), 24));
    setSearchResults([]);
    setSearchQuery("");
    fetchUserTaskHistory(user.auth_id);
  };

  const executeGeneration = async (weekToAssign: number, reasonToUse: string) => {
    if (!verifiedUser) return;
    setIsGenerating(true);
    
    const statusCycle = [
      "Archiving active tasks...", 
      "Contacting AI Engine...", 
      "AI is building the brief...", 
      "Formatting placeholders...", 
      "Finalizing database records..."
    ];
    let cycleIndex = 0;
    const loadingInterval = setInterval(() => { 
      setGenerationStatus(statusCycle[cycleIndex % statusCycle.length]); 
      cycleIndex++; 
    }, 8000);

    try {
      const headers = await getAuthHeaders();
      // 🔥 CRITICAL FIX: Updated endpoint to match the override route we established
      const res = await fetch('/api/admin/tasks/override', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetUserId: verifiedUser.auth_id, 
          adminId: adminId, 
          targetWeek: weekToAssign, 
          track: verifiedUser.track, 
          fullName: verifiedUser.full_name, 
          reason: reasonToUse
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Week ${weekToAssign} task generated successfully!`);
        setOverrideReason(""); 
        fetchUserTaskHistory(verifiedUser.auth_id);
        fetchLogs(); 
      } else {
        toast.error(data.error || "Failed to generate task.");
      }
    } catch (err) {
      toast.error("Network error. Check audit logs.");
    } finally {
      clearInterval(loadingInterval);
      setIsGenerating(false);
      setGenerationStatus("Force Assign Task");
    }
  };

  const handleForceGenerate = async () => {
    if (!verifiedUser) return;
    if (!overrideReason.trim()) return toast.error("Please provide a reason for this manual override.");
    
    const warningMessage = `CRITICAL ACTION:\n\nYou are about to forcefully overwrite Week ${selectedWeek} for ${verifiedUser.full_name}.\n\nThis will clear any current progress they have for Week ${selectedWeek}.\n\nYour IP Address, Location, and Device details will be permanently recorded in the security audit logs.\n\nAre you absolutely sure you want to proceed?`;
    if (!confirm(warningMessage)) return;
    
    await executeGeneration(selectedWeek, overrideReason);
  };

  const handleQuickRegenerate = async (weekNum: number) => {
    if (!verifiedUser) return;

    setSelectedWeek(weekNum);
    const reasonToUse = overrideReason.trim() || `Quick regenerate override for Week ${weekNum} task.`;
    setOverrideReason(reasonToUse);

    const warningMessage = `CONFIRM REGENERATION:\n\nAre you sure you want to regenerate Week ${weekNum} for ${verifiedUser.full_name}?\n\nThis will archive their current Week ${weekNum} task and issue a fresh brief.\n\nSECURITY AUDIT NOTICE: Your IP Address, physical location, and device details will be permanently recorded in the audit logs.\n\nDo you wish to proceed?`;
    
    if (!confirm(warningMessage)) return;

    await executeGeneration(weekNum, reasonToUse);
  };

  const calculateDaysTaken = (createdAt: string, updatedAt: string) => {
    const start = new Date(createdAt).getTime();
    const end = new Date(updatedAt).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return days === 0 ? "< 1 day" : `${days} day${days > 1 ? 's' : ''}`;
  };

  const parseLogDetails = (detailsString: string) => {
    if (!detailsString) return { reason: 'N/A', locationName: 'Unknown Location', browser: 'N/A' };
    const parts = detailsString.split(' | ');
    
    let reason = parts[0] || 'N/A';
    if (reason.startsWith('Admin Override: ')) reason = reason.substring(16);
    if (reason.startsWith('Backend rejected: ')) reason = reason.substring(18);
    
    const locPart = parts.find(p => p.startsWith('Location: '))?.substring(10) || 
                    parts.find(p => p.startsWith('IP: '))?.substring(4);

    let locationName = locPart?.trim() || 'Unknown Location';

    if (['::1', '127.0.0.1', 'localhost'].includes(locationName) || locationName.startsWith('192.168.') || locationName.startsWith('10.')) {
      locationName = 'Local Development (Lagos, NG)';
    }

    const browser = parts.find(p => p.startsWith('Browser: '))?.substring(9)?.trim() || 'N/A';
    
    return { reason, locationName, browser };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Intern Task Audit</h1>
          <p className="text-sm text-slate-400">Search interns to audit task history or force manual generation overrides.</p>
        </div>
      </div>

      {!verifiedUser && (
        <div className="bg-[#0a0f18] p-6 rounded-2xl border border-slate-800/80 shadow-xl max-w-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search intern by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                className="w-full bg-[#131b2c] border border-slate-700 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-slate-500 transition-colors shadow-inner"
              />
            </div>
            <button 
              onClick={handleSearchUsers}
              disabled={isSearching}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 border border-slate-700 rounded-xl overflow-hidden bg-[#131b2c] divide-y divide-slate-700/50">
              {searchResults.map((user) => (
                <button
                  key={user.auth_id}
                  onClick={() => selectUser(user)}
                  className="w-full text-left p-4 hover:bg-slate-800/80 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user.full_name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                      Week {user.current_week || 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {verifiedUser && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-[#0a0f18] to-[#131b2c] border border-slate-700/50 p-6 rounded-2xl shadow-xl gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                <span className="text-indigo-400 font-bold text-xl">{verifiedUser.full_name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-lg font-bold text-white tracking-tight">{verifiedUser.full_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-slate-400">{verifiedUser.email}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {verifiedUser.track.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setVerifiedUser(null); setUserTasks([]); setOverrideReason(""); }}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded-xl border border-slate-700 shadow-sm"
            >
              Audit Another Intern
            </button>
          </div>

          {/* GROUPED TASK HISTORY AUDIT TABLE */}
          <div className="bg-[#0a0f18] rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0d1420]">
              <div className="flex items-center gap-2">
                <History className="text-slate-400 w-5 h-5" />
                <h3 className="text-white font-semibold text-base">Task History Audit</h3>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {groupedTasksByWeek.length} Week{groupedTasksByWeek.length === 1 ? '' : 's'} Tracked
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-[#131b2c]/50 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-800/80">
                  <tr>
                    <th className="px-6 py-4">Week</th>
                    <th className="px-6 py-4">Task Title</th>
                    <th className="px-6 py-4">Date Assigned</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Time Taken</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {isLoadingTasks ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-500 mx-auto mb-2" />
                        <span className="text-slate-500">Retrieving intern tasks...</span>
                      </td>
                    </tr>
                  ) : groupedTasksByWeek.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        This intern has no tasks on their desk.
                      </td>
                    </tr>
                  ) : (
                    groupedTasksByWeek.map(({ weekNum, primaryTask, archivedHistory, totalAttempts }) => {
                      // Check for the completed boolean in addition to string statuses
                      const isCompleted = primaryTask.completed === true || primaryTask.status === 'approved' || primaryTask.status === 'passed';
                      const isArchived = primaryTask.status === 'archived_by_admin';
                      const isExpanded = !!expandedWeeks[weekNum];
                      
                      let statusBadge = "bg-slate-800 text-slate-300 border-slate-700";
                      if (isCompleted) statusBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border";
                      else if (primaryTask.status === 'pending') statusBadge = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 border";
                      else if (primaryTask.status === 'submitted') statusBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20 border";
                      else if (isArchived) statusBadge = "bg-slate-800/80 text-slate-400 border-slate-700/80 border";

                      return (
                        <tr key={`group-${weekNum}`} className="contents">
                          {/* PRIMARY TASK ROW */}
                          <tr className="hover:bg-slate-800/30 transition-colors bg-[#0a0f18]">
                            <td className="px-6 py-4 whitespace-nowrap font-bold text-white flex items-center gap-2">
                              <span>Week {weekNum}</span>
                              {archivedHistory.length > 0 && (
                                <button
                                  onClick={() => toggleWeekExpand(weekNum)}
                                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1 transition-colors"
                                  title="Toggle historical revisions"
                                >
                                  {totalAttempts} revisions {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-300 max-w-xs truncate" title={primaryTask.title}>
                              {primaryTask.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(primaryTask.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {/* Pass both status and completed boolean */}
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${statusBadge}`}>
                                {getFormattedStatusLabel(primaryTask.status, primaryTask.completed)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                              {isCompleted && primaryTask.updated_at 
                                ? calculateDaysTaken(primaryTask.created_at, primaryTask.updated_at)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleQuickRegenerate(weekNum)}
                                disabled={isGenerating}
                                className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-semibold ml-auto disabled:opacity-50"
                                title={`Regenerate Week ${weekNum}`}
                              >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                              </button>
                            </td>
                          </tr>

                          {/* EXPANDABLE ARCHIVED REVISIONS SUB-ROWS */}
                          {isExpanded && archivedHistory.map((archivedTask) => {
                            // Check archived records for the completed boolean as well
                            const isArchivedDone = archivedTask.completed === true || archivedTask.status === 'approved' || archivedTask.status === 'passed';
                            return (
                              <tr key={archivedTask.id} className="bg-slate-900/60 border-l-4 border-slate-700 hover:bg-slate-900/80 transition-colors text-xs">
                                <td className="px-6 py-3 text-slate-500 pl-10 font-mono">
                                  ↳ Revision
                                </td>
                                <td className="px-6 py-3 text-slate-400 max-w-xs truncate italic" title={archivedTask.title}>
                                  {archivedTask.title}
                                </td>
                                <td className="px-6 py-3 text-slate-500">
                                  {new Date(archivedTask.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                  {/* Pass both status and completed boolean */}
                                  <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap bg-slate-800/80 text-slate-400 border border-slate-700/80">
                                    {getFormattedStatusLabel(archivedTask.status, archivedTask.completed)}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-slate-500">
                                  {isArchivedDone && archivedTask.updated_at ? calculateDaysTaken(archivedTask.created_at, archivedTask.updated_at) : "-"}
                                </td>
                                <td className="px-6 py-3 text-right">
                                  <span className="text-[10px] text-slate-500 font-mono">Archived</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MANUAL OVERRIDE FORM */}
          <div id="manual-override-form" className="bg-[#0F172A] p-6 rounded-2xl border border-red-500/20 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <ShieldAlert className="text-red-400 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">Manual Task Override</h3>
                <p className="text-xs text-slate-400 mt-0.5">Use this strictly if the automated queue fails or an intern is stuck.</p>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="text-orange-400 w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-orange-400 font-bold text-sm">Critical Warning</h4>
                  <p className="text-orange-300/80 text-xs mt-1 leading-relaxed">
                    Generating a new task for a specific week will <strong>permanently archive and replace</strong> any existing task they currently have for that exact week. Your IP address, physical location, and browser information will be permanently recorded in the audit logs. Please ensure you are certain before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Target Week</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <select 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="w-full bg-[#0a0f18] border border-slate-700 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-slate-500 appearance-none cursor-pointer shadow-inner"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(week => (
                      <option key={week} value={week}>Generate Week {week}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Override Reason (Required for Audit)</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
                  <textarea 
                    placeholder="e.g., Intern was stuck due to a bug, manually advancing them..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full bg-[#0a0f18] border border-slate-700 text-slate-200 text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-slate-500 min-h-[48px] resize-none shadow-inner"
                    rows={1}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 mt-2 border-t border-slate-800/80">
              <button 
                onClick={handleForceGenerate}
                disabled={isGenerating || !overrideReason.trim()}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {generationStatus}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY AUDIT LOGS TABLE WITH PAGINATION & PER-PAGE SELECTOR */}
      <div className="bg-[#0a0f18] rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1420]">
          <div className="flex items-center gap-2">
            <Database className="text-slate-400 w-5 h-5" />
            <h3 className="text-white font-semibold text-base">Security Audit Logs</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Show:</span>
              <select
                value={logsPerPage}
                onChange={(e) => setLogsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-[#131b2c] border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-slate-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text"
                placeholder="Search logs..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full bg-[#131b2c] border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-1.5 outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-[#131b2c]/50 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Target Intern</th>
                <th className="px-6 py-4">Target Week</th>
                <th className="px-6 py-4">Override Reason</th>
                <th className="px-6 py-4">System Details</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500 mx-auto mb-2" />
                    <span className="text-slate-500">Loading audit logs...</span>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No generation logs found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const logDate = new Date(log.created_at);
                  const isSuccess = log.status === 'SUCCESS';
                  
                  const { reason, locationName, browser } = parseLogDetails(log.details);
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">{logDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{log.users?.full_name || log.target_user_id.substring(0,8) + '...'}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{log.users?.email || 'No email found'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-indigo-400 font-medium">
                        Week {log.assigned_week}
                      </td>
                      <td className="px-6 py-4 text-slate-300 min-w-[200px] max-w-[300px]">
                        <p className="line-clamp-2 text-xs leading-relaxed" title={reason}>{reason}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[10px] min-w-[170px]">
                        <div className="flex flex-col gap-1">
                          <span title={locationName} className="truncate max-w-[200px] bg-slate-800/80 text-emerald-400 font-semibold px-2 py-1 rounded border border-slate-700/80 flex items-center gap-1">
                            📍 {locationName}
                          </span>
                          <span title={browser} className="truncate max-w-[200px] bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded border border-slate-700/50">
                            <strong>Browser:</strong> {browser}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`border px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isSuccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoadingLogs && filteredLogs.length > 0 && logsPerPage !== 'all' && (
          <div className="p-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-[#0d1420]">
            <div>
              Showing {Math.min((currentLogPage - 1) * Number(logsPerPage) + 1, filteredLogs.length)} to {Math.min(currentLogPage * Number(logsPerPage), filteredLogs.length)} of {filteredLogs.length} entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentLogPage(p => Math.max(p - 1, 1))}
                disabled={currentLogPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-slate-800/50 rounded border border-slate-700 font-mono text-slate-300">
                Page {currentLogPage} of {totalLogPages}
              </span>

              <button
                onClick={() => setCurrentLogPage(p => Math.min(p + 1, totalLogPages))}
                disabled={currentLogPage >= totalLogPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
