"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StudentHeader } from "@/app/components/students/StudentHeader";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useAuth } from "@/app/contexts/AuthContexts";
import { toast } from "sonner";
import { 
  Users, Crown, Copy, LogOut, UserMinus, 
  ShieldCheck, Loader2, PlusCircle, AlertTriangle, HelpCircle, CheckCircle2,
  Search, Award, TrendingUp
} from "lucide-react";

export default function SquadDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [squadData, setSquadData] = useState<any>(null);
  const [discoverData, setDiscoverData] = useState<any[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  
  // Creation & Joining State
  const [actionMode, setActionMode] = useState<"create" | "join">("create");
  const [newSquadName, setNewSquadName] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

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
      if (data.success) {
        setDiscoverData(data.learners || []);
      }
    } catch (err) {
      console.error("Failed to load discover data.");
    } finally {
      setLoadingDiscover(false);
    }
  }, [user?.id]);

  useEffect(() => { 
    fetchSquad(); 
    fetchDiscover();
  }, [fetchSquad, fetchDiscover]);

  const currentUserEntry = useMemo(() => {
    if (!squadData?.squad?.roster || !user?.id) return null;
    return squadData.squad.roster.find((m: any) => m.userId === user.id);
  }, [squadData, user?.id]);

  // ==========================================
  // ACTION: CREATE SQUAD
  // ==========================================
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
      } else {
        toast.error(data.error || "Failed to create squad.");
      }
    } catch { toast.error("Network error."); } finally { setProcessing(false); }
  };

  // ==========================================
  // ACTION: JOIN SQUAD
  // ==========================================
  const handleJoinSquad = async () => {
    if (!joinInput.trim()) return toast.error("Please enter a Squad Link or Code.");
    setProcessing(true);
    try {
      let slug = joinInput.trim();
      if (slug.includes("/squad/")) {
        slug = slug.split("/squad/")[1].split("?")[0];
      }

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
      } else {
        toast.error(data.error || "Failed to join squad. It might be full or invalid.");
      }
    } catch { toast.error("Network error."); } finally { setProcessing(false); }
  };

  // ==========================================
  // ACTION: REMOVE MEMBER / LEAVE
  // ==========================================
  const handleRemoveMember = async (targetUserId: string, isSelf = false) => {
    if (!confirm(`Are you sure you want to ${isSelf ? "leave this squad" : "remove this member"}?`)) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/squad?userId=${targetUserId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(isSelf ? "You left the squad." : "Member removed.");
        fetchSquad();
      } else { toast.error(data.error || "Action failed."); }
    } catch { toast.error("Network error."); } finally { setProcessing(false); }
  };

  const isSquadFull = squadData?.squad?.roster?.length >= 4;

  const copyInviteLink = () => {
    if (isSquadFull) {
      toast.error("Your Squad is full! Head over to the Earn page to use your General Referral code.");
      return;
    }
    if (!squadData?.squad?.slug || !currentUserEntry?.referralCode) return;
    const link = `${window.location.origin}/squad/${squadData.squad.slug}?ref=${currentUserEntry.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Squad Invite link copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" /></div>;
  }

  // --- RENDER BLOCK: NO SQUAD ---
  const renderNoSquad = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12 animate-in fade-in zoom-in duration-500 pt-8">
      <div className="space-y-6">
        <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          WDC Labs Squads
        </span>
        <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-foreground">
          Don't learn alone. <br/>
          <span className="text-primary">Build your team.</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Create a squad and invite your friends. Every time someone uses your unique link to join, they enter your squad and you instantly earn a <strong className="text-foreground">10% commission</strong> directly to your bank account.
        </p>
        <ul className="space-y-4 pt-4">
          <li className="flex items-center gap-3 font-medium text-foreground"><CheckCircle2 className="text-green-500" size={22}/> Earn ₦2,000 for every active member</li>
          <li className="flex items-center gap-3 font-medium text-foreground"><CheckCircle2 className="text-green-500" size={22}/> Hold each other accountable weekly</li>
          <li className="flex items-center gap-3 font-medium text-foreground"><CheckCircle2 className="text-green-500" size={22}/> Share your gamification badges and rank</li>
        </ul>
      </div>

      <div className="border border-border/50 rounded-3xl bg-card p-8 lg:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <Users size={32} />
        </div>

        <div className="flex bg-muted/50 p-1 rounded-xl mb-8">
          <button 
            onClick={() => setActionMode("create")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${actionMode === "create" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Create Squad
          </button>
          <button 
            onClick={() => setActionMode("join")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${actionMode === "join" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Join Existing
          </button>
        </div>

        {actionMode === "create" ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-2xl font-bold mb-2">Form Your Squad</h3>
            <p className="text-muted-foreground text-sm mb-6">Enter a name below. You will automatically become the Squad Lead.</p>
            <Input 
              placeholder="Squad Name (e.g. Growth Builders)" 
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              className="h-14 text-lg font-medium bg-background border-border/50"
            />
            <Button 
              onClick={handleCreateSquad} 
              disabled={processing || !newSquadName}
              className="w-full h-14 text-base font-bold shadow-md hover:scale-[1.02] transition-transform"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="mr-2" size={20} />}
              Create My Squad
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <h3 className="text-2xl font-bold mb-2">Join a Squad</h3>
            <p className="text-muted-foreground text-sm mb-6">Paste the Squad Invite Link or the exact Squad Slug from your friend.</p>
            <Input 
              placeholder="e.g. labs.wdc.ng/squad/growth-builders" 
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              className="h-14 text-lg font-medium bg-background border-border/50"
            />
            <Button 
              onClick={handleJoinSquad} 
              disabled={processing || !joinInput}
              className="w-full h-14 text-base font-bold shadow-md hover:scale-[1.02] transition-transform"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="mr-2" size={20} />}
              Join Squad
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // --- RENDER BLOCK: ACTIVE SQUAD ---
  const renderActiveSquad = () => {
    const { squad } = squadData;
    const roster = squad.roster || [];
    const activeMembers = roster.filter((m: any) => m.status === 'active').length;
    const isSquadActive = activeMembers >= 3;
    const isLead = currentUserEntry?.isLead;
    const sortedRoster = [...roster].sort((a, b) => (a.isLead === b.isLead ? 0 : a.isLead ? -1 : 1));

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
              <span className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                {activeMembers} / 4 Active Members
              </span>
              <span className="text-sm font-semibold text-cyan-600 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
                <TrendingUp size={14} /> {squad.collectiveProgress}% Collective Progress
              </span>
            </div>
          </div>

          <div className={`w-full md:w-auto bg-background/80 backdrop-blur border border-primary/20 rounded-xl p-5 shadow-sm relative z-10 transition-opacity ${isSquadFull ? 'opacity-50' : ''}`}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSquadFull ? 'bg-red-500' : 'bg-primary animate-pulse'}`}></span>
              {isSquadFull ? "Squad Maxed Out" : "Squad Invite Link"}
            </p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-muted/50 px-4 py-2.5 rounded-lg border border-border/50 w-full md:w-72 truncate text-foreground font-medium select-all">
                {isSquadFull ? "Capacity Reached" : `labs.wdc.ng/squad/${squad.slug}?ref=${currentUserEntry?.referralCode}`}
              </code>
              <Button onClick={copyInviteLink} variant={copied ? "default" : "secondary"} className="px-3" disabled={isSquadFull}>
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </Button>
            </div>
            {isSquadFull && <p className="text-[10px] text-red-500 font-bold mt-2">Use your General link on the Earn page instead.</p>}
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border/40 bg-muted/20 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2"><Users className="text-primary" size={20} /> Squad Roster</h3>
            <button onClick={() => handleRemoveMember(user!.id, true)} disabled={processing} className="text-xs font-bold text-destructive/80 hover:text-destructive flex items-center gap-1.5 hover:bg-destructive/10 px-3 py-1.5 rounded-md transition-colors">
              <LogOut size={14} /> Leave Squad
            </button>
          </div>
          <div className="divide-y divide-border/40">
            {sortedRoster.map((member: any) => (
              <div key={member.userId} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-muted/10 ${member.userId === user?.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 text-white flex items-center justify-center font-bold text-xl relative shadow-md">
                    {member.name.charAt(0)}
                    {member.isLead && <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 rounded-full p-1 shadow-md border-2 border-card"><Crown size={14} fill="currentColor" /></div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                      {member.name} 
                      {member.userId === user?.id && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-black">You</span>}
                    </h4>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <span className={member.status === 'active' ? 'text-green-500' : 'text-amber-500'}>●</span>
                      {member.identity} • {member.track.replace(/-/g, ' ')}
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar & Badges */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                  <div className="flex-1 md:w-32 mr-4">
                     <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary font-medium">{member.individualProgress}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${member.individualProgress}%` }}></div>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {member.badges?.length > 0 ? (
                      member.badges.map((badge: any, i: number) => (
                        <div key={i} className="group relative cursor-help">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center text-sm shadow-sm hover:scale-110 transition-transform">🏆</div>
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-max max-w-[200px] bg-foreground text-background text-xs font-bold px-3 py-2 rounded-lg shadow-xl z-20">
                            {badge.badge_name || "Specialist Badge"}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                          </div>
                        </div>
                      ))
                    ) : <span className="text-xs text-muted-foreground italic bg-muted px-3 py-1 rounded-full">No badges yet</span>}
                  </div>
                  {isLead && !member.isLead && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.userId, false)} disabled={processing} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 ml-2" title="Remove Member">
                      <UserMinus size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER BLOCK: DISCOVER LEARNERS ---
  const renderDiscoverLearners = () => {
    if (loadingDiscover) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground h-6 w-6" /></div>;
    if (discoverData.length === 0) return null;

    return (
      <div className="bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden mt-12 mb-8 animate-in fade-in duration-500">
        <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
             <h3 className="font-bold text-xl flex items-center gap-2"><Search className="text-cyan-500" size={22} /> Discover Learners</h3>
             <p className="text-sm text-muted-foreground mt-1">Active peers in your track looking to collaborate.</p>
          </div>
          {squadData?.inSquad && !isSquadFull && (
             <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20">
               You have open slots! Send them your link.
             </span>
          )}
        </div>
        
        <div className="divide-y divide-border/40">
          {discoverData.map((peer, idx) => (
            <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/80 to-blue-500/40 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {peer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-md">{peer.name}</h4>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {peer.identity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto mt-2 md:mt-0">
                  <div className="w-full md:w-32">
                     <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-foreground font-medium">{peer.progress}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${peer.progress}%` }}></div>
                     </div>
                  </div>

                  <div className="flex items-center gap-1.5 min-w-[80px]">
                    <Award size={16} className="text-indigo-400" />
                    <span className="text-sm font-bold text-foreground">{peer.badgeCount}</span>
                  </div>

                  <div className="min-w-[100px] text-right">
                     {peer.inSquad ? (
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border/50">In a Squad</span>
                     ) : (
                        <span className="text-xs font-bold text-green-600 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">Available</span>
                     )}
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <StudentHeader 
        title={squadData?.inSquad ? "Squad Dashboard" : "Squad"} 
        subtitle={squadData?.inSquad ? "Your accountability circle." : "Join forces. Stay accountable."} 
      />
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        
        {/* Dynamic Main View */}
        {!squadData?.inSquad || !squadData.squad ? renderNoSquad() : renderActiveSquad()}

        {/* Discover / Leaderboard View */}
        {renderDiscoverLearners()}

        {/* SQUAD FAQs - ALWAYS VISIBLE */}
        <div className="bg-card border border-border/60 rounded-[2.5rem] p-8 lg:p-10 shadow-sm mt-8">
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