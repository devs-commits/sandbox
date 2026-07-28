import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Shield, Users, Target, Zap, CheckCircle2 } from "lucide-react";
import JoinSquadButton from "./JoinSquadButton";

// Next.js config for dynamic routes
export const revalidate = 60; // Revalidate page every 60 seconds

// 🔥 FIX 1: We tell TypeScript exactly what a "Member" object looks like
type SquadMember = {
  id: string;
  name: string;
  track: string;
  identity: string;
  isLead: boolean;
};

export default async function SquadLandingPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ref?: string };
}) {
  const { slug } = params;
  const referralCode = searchParams.ref;

  // 1. Fetch Squad Details
  const { data: squad } = await supabase
    .from("squads")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!squad) return notFound();

  // 2. Fetch Squad Members
  const { data: rosterRaw } = await supabase
    .from("squad_members")
    .select("user_id, status")
    .eq("squad_id", squad.id);

  const userIds = rosterRaw?.map((r) => r.user_id) || [];
  
  // 🔥 FIX 2: We apply the type to the empty array so TypeScript is happy
  let members: SquadMember[] = [];
  
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("auth_id, full_name, track, current_identity")
      .in("auth_id", userIds);

    members = rosterRaw!.map((m) => {
      const u = usersData?.find((user) => user.auth_id === m.user_id);
      return {
        id: m.user_id,
        name: u?.full_name || "Anonymous Learner",
        track: u?.track || "Unassigned",
        identity: u?.current_identity || "Member",
        isLead: m.user_id === squad.lead_user_id,
      };
    });
  }

  // Sort members so the Lead is first
  members.sort((a, b) => (a.isLead === b.isLead ? 0 : a.isLead ? -1 : 1));
  
  const isFull = members.length >= 4;
  const openSpots = 4 - members.length;

  return (
    <div className="min-h-screen bg-[#0a1120] text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl w-full z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700 pt-12 pb-24">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-4">
            <Shield size={16} /> WDC Labs Exclusive Invitation
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            You've been invited to join <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
              {squad.name}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4">
            Don't learn alone. Join this squad to share your progress, hold each other accountable, and accelerate your tech career together.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          
          {/* Left Column: The Roster */}
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-border/40 pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                <Users className="text-cyan-400" /> Current Roster
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isFull ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                {members.length} / 4 Filled
              </span>
            </div>

            <div className="space-y-4">
              {members.map((member, i) => (
                <div key={i} className="flex items-center gap-4 bg-background/50 p-3 rounded-2xl border border-border/30">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white flex items-center gap-2">
                      {member.name} 
                      {member.isLead && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-black uppercase">Lead</span>}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.track.replace(/-/g, ' ')} • {member.identity}
                    </p>
                  </div>
                </div>
              ))}

              {/* Empty Slots Filler */}
              {!isFull && Array.from({ length: openSpots }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-4 p-3 rounded-2xl border border-dashed border-border/40 opacity-50">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">?</div>
                  <div>
                    <p className="font-bold text-muted-foreground">Open Slot</p>
                    <p className="text-xs text-muted-foreground">Waiting for you...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Value Props & CTA */}
          <div className="flex flex-col justify-center space-y-8 p-4">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20"><Target size={20} /></div>
                <div>
                  <h4 className="text-white font-bold text-lg">Weekly Accountability</h4>
                  <p className="text-sm text-muted-foreground mt-1">Track each other's progress and ensure nobody falls behind on their curriculum tasks.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20"><Zap size={20} /></div>
                <div>
                  <h4 className="text-white font-bold text-lg">Collective Milestones</h4>
                  <p className="text-sm text-muted-foreground mt-1">Pool your progress together to unlock squad-exclusive perks and recognition.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card/80 to-background border border-border/50 rounded-2xl p-6 shadow-xl">
              <h4 className="text-white font-bold mb-4 text-center">Ready to jump in?</h4>
              <JoinSquadButton slug={slug} referralCode={referralCode} isFull={isFull} />
              
              {/* 🔥 FIX 3: Removed the undefined `user` variable check so the build doesn't crash here */}
              {!isFull && (
                <p className="text-xs text-center text-muted-foreground mt-4">
                  If you don't have an account yet, we'll help you create one first.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}