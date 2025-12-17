"use client";
import { useState } from "react";
import { StudentHeader } from "../../components/students/StudentHeader"
import { UserPlus, Copy, Check, Flame } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";

interface SquadMember {
  name: string;
  role: "Squad Leader" | "Friend";
  initials: string;
  color: string;
  isEmpty?: boolean;
}

// Mock data - replace with backend integration
const squadMembers: SquadMember[] = [
  { name: "You", role: "Squad Leader", initials: "JS", color: "bg-primary" },
  { name: "Grace Idowu", role: "Friend", initials: "GI", color: "bg-purple-500" },
  { name: "Empty Slot", role: "Friend", initials: "", color: "", isEmpty: true },
  { name: "Empty Slot", role: "Friend", initials: "", color: "", isEmpty: true },
];

const inviteLink = "wdc.ng/squad/join/8×92m";

export default function Squad() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${inviteLink}`);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <>
      <StudentHeader
        title="Squad"
        subtitle="Available simulations tailored to your skill track."
      />
      <main className="flex-1 p-4 lg:p-6">
        <div className="space-y-6">
          {/* Invite Banner */}
          <div className="grad-bg rounded-xl p-6 border border-primary/30 relative overflow-hidden">
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-[hsla(273,96%,64%,1)] text-foreground border-purple/30 text-xs">
                <Flame size={14} />
                  14 DAY STREAK
                </Badge>
                <Badge className="bg-[hsla(145,100%,39%,1)] text-foreground border-green/30 text-xs">
                  ACTIVE: 45% DISCOUNT
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Invite 3 Friends. Save 45%
              </h2>
              <p className="text-muted-foreground">
                Unlock the ₦10,000/mo pricing tier by forming a squad. You stay accountable, you save money.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full bg-purple-500/10 skew-x-12 transform translate-x-10"></div>
          </div>

          {/* Squad Members - Card Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {squadMembers.map((member, index) => (
              <div 
                key={index} 
                className={`rounded-xl p-6 flex flex-col items-center justify-center min-h-[160px] ${
                  member.isEmpty 
                    ? 'border-2 border-dashed border-muted-foreground/30 bg-transparent' 
                    : 'bg-card border border-primary/30'
                }`}
              >
                {member.isEmpty ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-muted-foreground/20 flex items-center justify-center mb-3">
                      <UserPlus className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-muted-foreground text-center">Empty Slot</p>
                    <p className="text-sm text-muted-foreground">Invite Friend</p>
                  </>
                ) : (
                  <>
                    <div className={`w-14 h-14 rounded-full ${member.color} flex items-center justify-center mb-3`}>
                      <span className="text-lg font-bold text-white">
                        {member.initials}
                      </span>
                    </div>
                    <p className="font-medium text-foreground text-center">{member.name}</p>
                    <p className={`text-sm ${member.role === 'Squad Leader' ? 'text-cyan' : 'text-purple'}`}>
                      {member.role}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Invite Link */}
          <div className="bg-card rounded-xl p-4 md:p-6 border border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  YOUR INVITE LINK
                </p>
                <p className="text-foreground font-medium">{inviteLink}</p>
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
                    Copy Link
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