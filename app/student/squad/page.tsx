"use client";
import { useState, useEffect } from "react";
import { StudentHeader } from "../../components/students/StudentHeader"
import { UserPlus, Copy, Check, Flame, Users, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/app/contexts/AuthContexts";

interface SquadMember {
  userId: string;
  name: string;
  role: "leader" | "member";
  avatarUrl?: string;
  joinedAt: string;
}

interface Squad {
  id: number;
  name: string;
  invite_code: string;
  members: SquadMember[];
}

export default function Squad() {
  const { user } = useAuth();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form States
  const [newSquadName, setNewSquadName] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSquad();
    }
  }, [user]);

  const fetchSquad = async () => {
    try {
      const res = await fetch(`/api/squad?userId=${user?.id}`, { cache: 'no-store' });
      const data = await res.json();
      console.log("Fetched Squad:", data);
      if (data.squad) {
        setSquad(data.squad);
      } else {
        setSquad(null);
      }
    } catch (error) {
      console.error("Error fetching squad:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSquad = async () => {
    if (!newSquadName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/squad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, name: newSquadName }),
      });
      const data = await res.json();
      if (data.error) {
        if (data.code === 'ALREADY_IN_SQUAD') {
          toast.info("You are already in a squad! Redirecting...");
          fetchSquad();
          return;
        }
        throw new Error(data.error);
      }
      
      toast.success("Squad created successfully!");
      fetchSquad(); // Refresh to show squad view
    } catch (error: any) {
      toast.error(error.message || "Failed to create squad");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSquad = async () => {
    if (!inviteCodeInput.trim()) return;
    setIsJoining(true);
    try {
      const res = await fetch('/api/squad/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, inviteCode: inviteCodeInput }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(`Joined ${data.squadName} successfully!`);
      fetchSquad(); // Refresh to show squad view
    } catch (error: any) {
      toast.error(error.message || "Failed to join squad");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyLink = async () => {
    if (!squad) return;
    try {
      await navigator.clipboard.writeText(squad.invite_code);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // VIEW 1: NO SQUAD
  if (!squad) {
    return (
      <>
        <StudentHeader title="Squad" subtitle="Join forces. Stay accountable." />
        <main className="flex-1 p-4 lg:p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground">Find Your Squad</h2>
              <p className="text-muted-foreground text-lg">
                Learning is harder alone. Join a squad of up to 4 students to unlock bonuses, track streaks, and keep each other accountable.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Create Squad Card */}
              <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4 hover:border-primary/50 transition-colors">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Create a Squad</h3>
                  <p className="text-sm text-muted-foreground">Start a new circle. You'll be the Squad Leader.</p>
                </div>
                <div className="space-y-3">
                  <Input 
                    placeholder="Squad Name (e.g. The A-Team)" 
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    className="bg-background"
                  />
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleCreateSquad}
                    disabled={isCreating || !newSquadName}
                  >
                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Squad"}
                  </Button>
                </div>
              </div>

              {/* Join Squad Card */}
              <div className="bg-card border border-border rounded-xl p-6 text-left space-y-4 hover:border-primary/50 transition-colors">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Join a Squad</h3>
                  <p className="text-sm text-muted-foreground">Have an invite code? Enter it here.</p>
                </div>
                <div className="space-y-3">
                  <Input 
                    placeholder="Enter 6-digit Code" 
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="bg-background uppercase tracking-widest"
                  />
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleJoinSquad}
                    disabled={isJoining || inviteCodeInput.length < 6}
                  >
                    {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Squad"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // VIEW 2: SQUAD DASHBOARD
  const filledSlots = squad.members.length;
  const emptySlots = 4 - filledSlots;

  return (
    <>
      <StudentHeader
        title={squad.name}
        subtitle="Your accountability circle."
      />
      <main className="flex-1 p-4 lg:p-6">
        <div className="space-y-6">
          {/* Invite Banner */}
          <div className="bg-[linear-gradient(135deg,hsla(262,55%,22%,1)_0%,hsla(252,45%,18%,1)_45%,hsla(242,39%,14%,1)_100%)] rounded-xl p-6 border border-primary/30 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-[hsla(273,96%,64%,1)] text-foreground border-purple-500/30 text-xs">
                <Flame size={14} className="mr-1" />
                  SQUAD STREAK: 0 DAYS
                </Badge>
                {filledSlots === 4 && (
                  <Badge className="bg-[hsla(145,100%,39%,1)] text-foreground border-green-500/30 text-xs">
                    FULL SQUAD BONUS ACTIVE
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {filledSlots < 4 ? `Invite ${emptySlots} more friends.` : "Squad Goals Active!"}
              </h2>
              <p className="text-muted-foreground">
                {filledSlots < 4 
                  ? "Fill your squad to unlock the 45% discount and squad bonuses." 
                  : "Keep your streak alive to maintain your rewards."}
              </p>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full bg-purple-500/10 skew-x-12 transform translate-x-10"></div>
          </div>

          {/* Squad Members - Card Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Render Real Members */}
            {squad.members.map((member) => (
              <div 
                key={member.userId} 
                className="rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] bg-card border border-primary/30"
              >
                <div className={`w-14 h-14 rounded-full ${member.role === 'leader' ? 'bg-primary' : 'bg-purple-500'} flex items-center justify-center mb-3`}>
                  <span className="text-lg font-bold text-white">
                    {member.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <p className="font-medium text-foreground text-center line-clamp-1">{member.name}</p>
                <p className={`text-sm ${member.role === 'leader' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {member.role === 'leader' ? 'Squad Leader' : 'Member'}
                </p>
              </div>
            ))}

            {/* Render Empty Slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-muted-foreground/30 bg-transparent"
              >
                <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center mb-3">
                  <UserPlus className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground text-center">Empty Slot</p>
                <p className="text-sm text-muted-foreground">Invite Friend</p>
              </div>
            ))}
          </div>

          {/* Invite Link */}
          <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  SQUAD INVITE CODE
                </p>
                <p className="text-foreground font-mono text-2xl font-bold tracking-widest">{squad.invite_code}</p>
              </div>
              <Button 
                variant="outline" 
                className="border-border text-foreground hover:bg-secondary"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
