"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useAuth } from "@/app/contexts/AuthContexts";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  Users, Crown, Copy, LogOut, UserMinus, 
  ShieldCheck, Loader2, PlusCircle, AlertTriangle, HelpCircle, CheckCircle2,
  Search, Award, TrendingUp, Send, Mail, Phone, MapPin, Zap, Trash2, Shield, XCircle
} from "lucide-react";

const formatCountry = (countryCode?: string) => {
  if (!countryCode) return "";
  const code = countryCode.trim().toUpperCase();
  let fullName = code;
  
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    fullName = displayNames.of(code) || code;
  } catch (e) {}

  if (code.length === 2) {
    const flag = String.fromCodePoint(...code.split('').map(char => 127397 + char.charCodeAt(0)));
    return `${fullName} ${flag}`;
  }
  return fullName;
};

export default function SquadDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [squadData, setSquadData] = useState<any>(null);
  
  // 🔥 Pending Invites State
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  const [discoverData, setDiscoverData] = useState<any[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [discoverSearch, setDiscoverSearch] = useState("");
  
  const [discoverSquadsData, setDiscoverSquadsData] = useState<any[]>([]);
  const [loadingSquads, setLoadingSquads] = useState(true);
  const [squadSearch, setSquadSearch] = useState("");

  const [actionMode, setActionMode] = useState<"create" | "join">("create");
  const [newSquadName, setNewSquadName] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [invitedPeers, setInvitedPeers] = useState<string[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  // Fetch unexpired invites
  const fetchPendingInvites = useCallback(async () => {
    if (!user?.id) return;
    try {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('notifications')
        .select('*, squads(name)')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .gte('created_at', threeHoursAgo);
        
      if (data) setPendingInvites(data);
    } catch (error) {
      console.error("Failed to load invites");
    }
  }, [user?.id]);

  const fetchSquad = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/squad?userId=${user.id}`);
      const data = await res.json();
      setSquadData(data);
    } catch (err) {
      toast.error("Failed to load squad data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchDiscover = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/squad/discover?userId=${user.id}`);
      const data = await res.json();
      if (data.success) setDiscoverData(data.learners || []);
    } catch (err) {
      console.error("Failed to load discover data.");
    } finally {
      setLoadingDiscover(false);
    }
  }, [user?.id]);

  const fetchDiscoverSquads = useCallback(async () => {
    try {
      const res = await fetch(`/api/squad/discover-squads`);
      const data = await res.json();
      if (data.success) setDiscoverSquadsData(data.squads || []);
    } catch (err) {
      console.error("Failed to load discover squads.");
    } finally {
      setLoadingSquads(false);
    }
  }, []);

  useEffect(() => { 
    fetchSquad(); 
    fetchDiscover();
    fetchDiscoverSquads();
    fetchPendingInvites();
  }, [fetchSquad, fetchDiscover, fetchDiscoverSquads, fetchPendingInvites]);

  const currentUserEntry = useMemo(() => {
    if (!squadData?.squad?.roster || !user?.id) return null;
    return squadData.squad.roster.find((m: any) => m.userId === user.id);
  }, [squadData, user?.id]);

  // Handle Accept/Decline directly from the dashboard
  const handleInviteResponse = async (notificationId: string, squadId: string, action: 'accepted' | 'declined') => {
    setProcessingInviteId(notificationId);
    try {
      const res = await fetch("/api/squad/invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, action, squadId, userId: user?.id })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Invite ${action}!`);
        setPendingInvites(prev => prev.filter(n => n.id !== notificationId));
        if (action === 'accepted') window.location.reload(); 
      } else {
        toast.error(data.error || "Failed to process invite.");
        setPendingInvites(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setProcessingInviteId(null);
    }
  };

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) return toast.error("Please enter a Squad name.");
    setProcessing(true);
    try {
      const res = await fetch("/api/squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, name: newSquadName }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Squad created successfully!");
        setNewSquadName("");
        fetchSquad(); 
      } else toast.error(data.error || "Failed to create squad.");
    } catch { toast.error("Network error."); } finally { setProcessing(false); }
  };

  const joinSquadBySlug = async (slugToJoin: string) => {
    setProcessing(true);
    try {
      // 🔥 THE FIX: Force the input to lowercase right here
      let slug = slugToJoin.trim().toLowerCase(); 
      
      if (slug.includes("/squad/")) slug = slug.split("/squad/")[1].split("?")[0];

      const res = await fetch("/api/squad/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, slug }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Joined squad successfully!");
        setJoinInput("");
        fetchSquad(); 
      } else toast.error(data.error || "Failed to join squad.");
    } catch { 
      toast.error("Network error."); 
    } finally { 
      setProcessing(false); 
    }
  };

  const handleJoinSquad = () => {
    if (!joinInput.trim()) return toast.error("Please enter a Squad Link or Code.");
    joinSquadBySlug(joinInput);
  };

  const handleRemoveMember = async (targetUserId: string, isSelf = false) => {
    const isOnlyMember = squadData?.squad?.roster?.length === 1;
    let confirmText = "Are you sure you want to remove this member?";
    if (isSelf) confirmText = isOnlyMember ? "Are you sure you want to delete this squad? This action cannot be undone." : "Are you sure you want to leave this squad?";
    if (!confirm(confirmText)) return;
    
    setProcessing(true);
    try {
      const res = await fetch(`/api/squad?userId=${targetUserId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (isSelf) toast.success(isOnlyMember ? "Squad deleted." : "You left the squad.");
        else toast.success("Member removed.");
        fetchSquad();
      } else toast.error(data.error || "Action failed.");
    } catch { toast.error("Network error."); } finally { setProcessing(false); }
  };

  const handleSendInvite = async (peerId: string) => {
    if (!squadData?.squad?.id || !user?.id) return;
    if (peerId.startsWith("dummy-")) {
      toast.error("This learner has not fully set up their account yet.");
      return;
    }
    setInvitingId(peerId);
    try {
      const res = await fetch("/api/squad/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: user.id, receiverId: peerId, squadId: squadData.squad.id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invite sent successfully!");
        setInvitedPeers(prev => [...prev, peerId]);
      } else toast.error(data.error || "Failed to send invite.");
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setInvitingId(null);
    }
  };

  const isSquadFull = squadData?.squad?.roster?.length >= 4;

  const copyInviteLink = () => {
    if (isSquadFull) return toast.error("Your Squad is full!");
    if (!squadData?.squad?.slug || !currentUserEntry?.referralCode) return;
    const link = `${window.location.origin}/squad/${squadData.squad.slug}?ref=${currentUserEntry.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Squad Invite link copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" /></div>;

  const renderNoSquad = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12 animate-in fade-in zoom-in duration-500 pt-8">
      <div className="space-y-6">
        <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">WDC Labs Squads</span>
        <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-foreground">
          Don't learn alone. <br/><span className="text-primary">Build your team.</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Create a squad and invite your friends. Every time someone uses your unique link to join, they enter your squad and you instantly earn a <strong className="text-foreground">10% commission</strong> directly to your bank account.
        </p>
      </div>

      <div className="border border-border/50 rounded-3xl bg-card p-8 lg:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="flex bg-muted/50 p-1 rounded-xl mb-8">
          <button onClick={() => setActionMode("create")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${actionMode === "create" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Create Squad</button>
          <button onClick={() => setActionMode("join")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${actionMode === "join" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Join Existing</button>
        </div>

        {actionMode === "create" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-2xl font-bold mb-2">Form Your Squad</h3>
            <Input placeholder="Squad Name (e.g. Growth Builders)" value={newSquadName} onChange={(e) => setNewSquadName(e.target.value)} className="h-14 text-lg font-medium bg-background border-border/50"/>
            <Button onClick={handleCreateSquad} disabled={processing || !newSquadName} className="w-full h-14 text-base font-bold shadow-md hover:scale-[1.02] transition-transform">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="mr-2" size={20} />} Create My Squad
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <h3 className="text-2xl font-bold mb-2">Join a Squad</h3>
            <Input placeholder="e.g. labs.wdc.ng/squad/growth-builders" value={joinInput} onChange={(e) => setJoinInput(e.target.value)} className="h-14 text-lg font-medium bg-background border-border/50"/>
            <Button onClick={handleJoinSquad} disabled={processing || !joinInput} className="w-full h-14 text-base font-bold shadow-md hover:scale-[1.02] transition-transform">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="mr-2" size={20} />} Join Squad
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveSquad = () => {
    const { squad } = squadData;
    const roster = squad.roster || [];
    const activeMembers = roster.filter((m: any) => m.status === 'active').length;
    const isSquadActive = activeMembers >= 3;
    const isLead = currentUserEntry?.isLead;
    const sortedRoster = [...roster].sort((a, b) => (a.isLead === b.isLead ? 0 : a.isLead ? -1 : 1));
    const isOnlyMember = roster.length === 1;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mb-12">
        <div className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 skew-x-12 transform translate-x-10 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">{squad.name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-sm ${isSquadActive ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                {isSquadActive ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                {isSquadActive ? 'Active Squad' : 'At Risk'}
              </span>
              <span className="text-sm font-semibold text-cyan-600 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
                <TrendingUp size={14} /> {squad.collectiveProgress}% Progress
              </span>
            </div>
          </div>
          <div className={`w-full md:w-auto bg-background/80 backdrop-blur border border-primary/20 rounded-xl p-5 shadow-sm relative z-10 transition-opacity ${isSquadFull ? 'opacity-50' : ''}`}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Squad Invite Link</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-muted/50 px-4 py-2.5 rounded-lg border border-border/50 w-full md:w-72 truncate select-all">{isSquadFull ? "Capacity Reached" : `${window.location.origin}/squad/${squad.slug}`}</code>
              <Button onClick={copyInviteLink} variant={copied ? "default" : "secondary"} className="px-3" disabled={isSquadFull}>{copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}</Button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/40 bg-muted/20 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2"><Users className="text-primary" size={20} /> Squad Roster</h3>
            <button onClick={() => handleRemoveMember(user!.id, true)} disabled={processing} className="text-xs font-bold text-destructive/80 hover:text-destructive flex items-center gap-1.5 hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors">
              {isOnlyMember ? <Trash2 size={14} /> : <LogOut size={14} />} {isOnlyMember ? "Delete Squad" : "Leave Squad"}
            </button>
          </div>
          <div className="divide-y divide-border/40">
            {sortedRoster.map((member: any) => (
              <div key={member.userId} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-muted/10 ${member.userId === user?.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 text-white flex items-center justify-center font-bold text-xl relative shadow-md shrink-0">
                    {member.name.charAt(0)}
                    {member.isLead && <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full p-1 shadow-md border-2 border-card"><Crown size={14} fill="currentColor" /></div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg flex items-center gap-2">{member.name} {member.userId === user?.id && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-black">You</span>}</h4>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <span className={member.status === 'active' ? 'text-green-500' : 'text-amber-500'}>●</span>
                      {member.identity} • <span className="capitalize">{member.track.replace(/-/g, ' ')}</span>
                    </p>
                    
                    {/* 🔥 THE FIX: Render Squad Member Badges! */}
                    {member.badges && member.badges.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {member.badges.map((b: any, idx: number) => (
                          <div key={idx} className="group relative flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/10 border border-yellow-500/30 cursor-help">
                            <Award size={12} className="text-yellow-500" />
                            {/* CSS Tooltip */}
                            <span className="absolute bottom-8 left-1/2 -translate-x-1/2 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                              {b.badge_name || b}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                  <div className="flex-1 md:w-32 mr-4">
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Progress</span><span className="text-primary font-medium">{member.individualProgress}%</span></div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${member.individualProgress}%` }}></div></div>
                  </div>
                  {isLead && !member.isLead && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.userId, false)} disabled={processing} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 ml-2" title="Remove Member"><UserMinus size={16} /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDiscoverSquads = () => {
    const filteredSquads = discoverSquadsData.filter(squad => 
      squad.name.toLowerCase().includes(squadSearch.toLowerCase())
    );

    return (
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
        <div className="p-6 border-b border-border/40 flex flex-col gap-4">
          <div>
             <h3 className="font-bold text-xl flex items-center gap-2"><Zap className="text-violet-500" size={22} /> Discover Squads</h3>
             <p className="text-sm text-muted-foreground mt-1">Find an active squad with open slots.</p>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search squads..." 
              value={squadSearch}
              onChange={(e) => setSquadSearch(e.target.value)}
              className="pl-9 h-10 bg-background border-border/50"
            />
          </div>
        </div>
        
        <div className="divide-y divide-border/40 overflow-y-auto flex-1 max-h-[400px]">
          {loadingSquads ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground h-6 w-6" /></div>
          ) : discoverSquadsData.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">No open squads available right now.</div>
          ) : filteredSquads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">No squads found matching your search.</div>
          ) : (
            filteredSquads.map((squad, idx) => (
              <div key={idx} className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/80 to-fuchsia-500/40 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-md uppercase">{squad.name}</h4>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        {squad.memberCount} / 4 Members • {squad.activeCount} Active
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => joinSquadBySlug(squad.slug)} disabled={processing} className="h-9 px-6 text-xs font-bold shadow-md transition-colors w-full xl:w-auto">
                    Join Squad
                  </Button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderDiscoverLearners = () => {
    const filteredDiscover = discoverData.filter(peer => 
      peer.name.toLowerCase().includes(discoverSearch.toLowerCase()) || 
      peer.track.toLowerCase().includes(discoverSearch.toLowerCase())
    );

    return (
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
        <div className="p-6 border-b border-border/40 flex flex-col gap-4">
          <div className="flex justify-between items-start">
             <div>
               <h3 className="font-bold text-xl flex items-center gap-2"><Search className="text-cyan-500" size={22} /> Discover Learners</h3>
               <p className="text-sm text-muted-foreground mt-1">Search peers to build your team.</p>
             </div>
             {squadData?.inSquad && !isSquadFull && (
               <span className="hidden xl:block text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">Open slots!</span>
            )}
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search by name or track..." 
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              className="pl-9 h-10 bg-background border-border/50"
            />
          </div>
        </div>
        
        <div className="divide-y divide-border/40 overflow-y-auto flex-1 max-h-[400px]">
          {loadingDiscover ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground h-6 w-6" /></div>
          ) : discoverData.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground font-medium">No other active learners available right now.</div>
          ) : filteredDiscover.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground font-medium">No learners found matching your search.</div>
          ) : (
            filteredDiscover.map((peer, idx) => (
              <div key={idx} className="p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/80 to-blue-500/40 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">{peer.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-foreground text-md">{peer.name}</h4>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        {peer.identity} • <span className="capitalize">{peer.track.replace(/-/g, ' ')}</span>
                      </p>

                      {/* 🔥 THE FIX: Render Peer Badges in Discover! */}
                      {peer.badges && peer.badges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {peer.badges.map((b: any, badgeIdx: number) => (
                            <div key={badgeIdx} className="group relative flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/30 cursor-help">
                              <Award size={10} className="text-yellow-500" />
                              {/* CSS Tooltip */}
                              <span className="absolute bottom-7 left-1/2 -translate-x-1/2 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                {b.badge_name || b}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full xl:w-auto mt-2 xl:mt-0 justify-between">
                    <div className="flex-1 xl:w-24">
                       <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Progress</span><span className="text-foreground font-medium">{peer.progress}%</span></div>
                       <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${peer.progress}%` }}></div></div>
                    </div>

                    <div className="min-w-[100px] text-right">
                      {peer.inSquad ? (
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border/50">In a Squad</span>
                      ) : invitedPeers.includes(peer.id) ? (
                        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Invite Sent</span>
                      ) : squadData?.inSquad && !isSquadFull ? (
                        <Button size="sm" onClick={() => handleSendInvite(peer.id)} disabled={invitingId === peer.id} className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-white transition-colors gap-1.5 w-full xl:w-auto">
                          {invitingId === peer.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send size={14} />} Invite
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Available</span>
                      )}
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <StudentHeader title={squadData?.inSquad ? "Squad Dashboard" : "Squad"} subtitle={squadData?.inSquad ? "Your accountability circle." : "Join forces. Stay accountable."} />
      
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        
        {/* 🔥 NEW: Pending Invites Banner */}
        {pendingInvites.length > 0 && (
          <div className="space-y-4 mb-8">
            {pendingInvites.map(invite => (
              <div key={invite.id} className="bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/30 rounded-2xl p-5 lg:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_0_20px_rgba(var(--primary),0.1)] animate-in slide-in-from-top-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Shield size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">You have a Squad Invite!</h3>
                      <p className="text-muted-foreground text-sm">You've been invited to join <strong className="text-foreground">{invite.squads?.name}</strong>. Don't learn alone!</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                      onClick={() => handleInviteResponse(invite.id, invite.squad_id, 'declined')} 
                      disabled={processingInviteId === invite.id} 
                      variant="outline" 
                      className="flex-1 md:flex-none border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <XCircle size={16} className="mr-2"/> Decline
                    </Button>
                    <Button 
                      onClick={() => handleInviteResponse(invite.id, invite.squad_id, 'accepted')} 
                      disabled={processingInviteId === invite.id} 
                      className="flex-1 md:flex-none bg-primary text-white hover:opacity-90 shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      {processingInviteId === invite.id ? <Loader2 size={16} className="animate-spin mr-2"/> : <CheckCircle2 size={16} className="mr-2"/>}
                      Accept & Join
                    </Button>
                 </div>
              </div>
            ))}
          </div>
        )}

        {!squadData?.inSquad || !squadData.squad ? (
          <>
            {renderNoSquad()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {renderDiscoverSquads()}
              {renderDiscoverLearners()}
            </div>
          </>
        ) : (
          <>
            {renderActiveSquad()}
            <div className="mb-12">
              {renderDiscoverLearners()}
            </div>
          </>
        )}

        <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 lg:p-10 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-3 mb-8"><HelpCircle className="text-primary" /> Squad FAQs</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <h4 className="text-sm font-bold">What is the Squad Maximum?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">A squad can hold a maximum of 4 people (1 Lead and 3 Members). Once your squad hits 4 people, the squad invite link will be disabled. To keep earning referrals after your squad is full, head over to the Earn page and use your General Referral link.</p>
               </div>
               <div className="space-y-2 pt-4 border-t border-border/40">
                  <h4 className="text-sm font-bold">Do trial users count?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">No. Trial users will appear in the squad but will not count towards your "Active" status or generate the ₦2,000 commission until they successfully pay for a subscription.</p>
               </div>
               <div className="space-y-2 pt-4 border-t border-border/40">
                  <h4 className="text-sm font-bold">What happens if I leave my Squad?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">If you leave, you lose your spot to make room for someone else. If you were the Squad Lead, the member who joined earliest automatically becomes the new Lead.</p>
               </div>
               <div className="space-y-2 pt-4 border-t border-border/40">
                  <h4 className="text-sm font-bold">Are there refunds?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">No. All WDC Labs payments and Squad referral bonuses are completely final and non-refundable.</p>
               </div>
            </div>
        </div>
      </main>
    </>
  );
}