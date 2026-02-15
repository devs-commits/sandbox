"use client"
import { useState, useEffect, useCallback } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Clock, X, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../contexts/AuthContexts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bounty } from "../../components/students/office/types";

interface BountyDetailPanelProps {
  bounty: Bounty;
  onClose: () => void;
  onAccept: (bounty: Bounty) => void;
  isAccepting: boolean;
  isClaimed: boolean;
}

function BountyDetailPanel({ bounty, onClose, onAccept, isAccepting, isClaimed }: BountyDetailPanelProps) {
  const slotsLeft = bounty.slots_total - bounty.slots_filled;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full md:w-1/2 bg-card border-l border-border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">{bounty.title}</h1>
              <Badge className="bg-[hsla(47,62%,50%,0.2)] text-[hsla(47,62%,50%,1)] hover:bg-yellow-500/30">{bounty.type}</Badge>
            </div>
            <button onClick={onClose} className="text-coral hover:text-coral/80 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="font-semibold text-foreground mb-2">Description</h2>
              <p className="text-muted-foreground text-sm">{bounty.description}</p>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">Instructions</h2>
              {bounty.instructions && bounty.instructions.length > 0 ? (
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                  {bounty.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No specific instructions provided.</p>
              )}
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">What to Submit (Deliverables)</h2>
              <p className="text-muted-foreground text-sm mb-2">Your submission must include:</p>
              {bounty.deliverables && bounty.deliverables.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                  {bounty.deliverables.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific deliverables listed.</p>
              )}
              <p className="text-muted-foreground text-sm mt-2">Upload formats: PDF, DOCX, ZIP</p>
            </div>

            <div className="bg-[hsla(47,62%,50%,0.2)] border border-yellow-500/30 rounded-lg p-4">
              <p className="text-[hsla(47,62%,50%,1)] text-sm">
                Note: Click Claim Task to reserve your slot. Once claimed, the countdown begins based on the duration. You must upload your submission within this period. Failure to do so may disqualify you from the bounty and release your slot back to other users (if the bounty is still available). This bounty currently has {slotsLeft} slots left, and slots update in real time.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground text-sm mb-4">
                CLAIM: <span className="text-foreground font-medium">{slotsLeft} left</span>
              </p>
              <Button
                onClick={() => onAccept(bounty)}
                disabled={isAccepting || slotsLeft <= 0 || isClaimed}
                className="w-full bg-primary hover:bg-primary/90 text-black py-6 text-lg font-semibold"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    CLAIMING TASK...
                  </>
                ) : isClaimed ? (
                  "ALREADY CLAIMED"
                ) : (
                  "CLAIM TASK"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BountyCard({ bounty, isClaimed, onClick }: { bounty: Bounty; isClaimed: boolean; onClick: () => void }) {
  const slotsLeft = bounty.slots_total - bounty.slots_filled;

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl p-5 border border-border transition-colors cursor-pointer hover:border-primary/50"
    >
      <div className="flex items-center justify-between mb-3">
        <Badge className="bg-[hsla(47,62%,50%,0.3)] text-[hsla(47,62%,50%,1)] hover:bg-yellow-500/20">{bounty.type}</Badge>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Clock className="w-4 h-4" />
          {bounty.duration}
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-4 line-clamp-1">{bounty.title}</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase">REWARD</p>
          <p className="text-lg font-bold text-[hsla(151,74%,46%,1)]">
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(bounty.reward)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">{isClaimed ? "STATUS" : "CLAIM"}</p>
          <p className="text-foreground font-medium">{isClaimed ? "Claimed" : `${slotsLeft} left`}</p>
        </div>
      </div>
    </div>
  );
}

export default function BountyHunter() {
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [claimedBountyIds, setClaimedBountyIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const resolveStudentId = useCallback(async () => {
    if (!user) return null;
    if (typeof user.user_id === "number") return user.user_id;

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error resolving student id:", error);
      return null;
    }

    return data?.id ?? null;
  }, [user]);

  useEffect(() => {
    const fetchBounties = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const studentId = await resolveStudentId();

        const { data: bountyData, error: bountyError } = await supabase
          .from("bounties")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (bountyError) {
          console.error("Error fetching bounties:", bountyError);
          toast.error("Failed to load bounties");
          return;
        }

        let submissionData: { bounty_id: number }[] = [];
        if (studentId) {
          const { data, error: submissionError } = await supabase
            .from("bounty_submissions")
            .select("bounty_id")
            .eq("student_id", studentId);

          if (submissionError) {
            console.error("Error fetching claimed bounties:", submissionError);
          } else {
            submissionData = data || [];
          }
        }

        const mappedBounties: Bounty[] = (bountyData || []).map((b) => ({
          ...b,
          instructions: Array.isArray(b.instructions)
            ? b.instructions
            : (typeof b.instructions === "string" ? JSON.parse(b.instructions) : []),
          deliverables: Array.isArray(b.deliverables)
            ? b.deliverables
            : (typeof b.deliverables === "string" ? JSON.parse(b.deliverables) : []),
        }));

        setBounties(mappedBounties);
        setClaimedBountyIds(new Set(submissionData.map((row) => row.bounty_id)));
      } catch (error) {
        console.error("Error fetching bounties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();

    const channel = supabase
      .channel("public:bounties")
      .on("postgres_changes", { event: "*", schema: "public", table: "bounties" }, fetchBounties)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, resolveStudentId]);

  const handleClaimTask = async (bounty: Bounty) => {
    if (!user) {
      toast.error("You must be logged in to claim bounties");
      return;
    }

    if (claimedBountyIds.has(bounty.id)) {
      toast.error("You already claimed this bounty.");
      return;
    }

    if (!confirm(`Are you sure you want to claim "${bounty.title}"? It will be added to your desk.`)) return;

    setAcceptingId(bounty.id);

    try {
      const studentId = await resolveStudentId();
      if (!studentId) {
        toast.error("Unable to resolve your account profile. Please refresh and try again.");
        return;
      }

      const slotsLeft = bounty.slots_total - bounty.slots_filled;
      if (slotsLeft <= 0) {
        toast.error("No claim slots left for this bounty.");
        return;
      }

      const { data: existingClaim, error: existingClaimError } = await supabase
        .from("bounty_submissions")
        .select("id")
        .eq("bounty_id", bounty.id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (existingClaimError) throw existingClaimError;
      if (existingClaim) {
        setClaimedBountyIds((prev) => new Set([...prev, bounty.id]));
        toast.error("You already claimed this bounty.");
        return;
      }

      const { error: subError } = await supabase
        .from("bounty_submissions")
        .insert({
          bounty_id: bounty.id,
          student_id: studentId,
          status: "pending",
        })
        .select("id")
        .single();

      if (subError) throw subError;

      const newTaskData = {
        user: user.id,
        title: bounty.title,
        brief_content: bounty.description,
        task_track: bounty.type || "General",
        difficulty: "Bounty",
        completed: false,
        resources: [],
      };

      const { error: taskError } = await supabase.from("tasks").insert(newTaskData);
      if (taskError) throw taskError;

      await supabase.rpc("increment_bounty_slots", { bounty_id: bounty.id });
      setClaimedBountyIds((prev) => new Set([...prev, bounty.id]));

      toast.success("Bounty claimed! Check your Office Desk.");
      setSelectedBounty(null);
      router.push("/student/office");
    } catch (error) {
      console.error("Error claiming bounty:", error);
      toast.error("Failed to claim bounty. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <>
      <StudentHeader title="Bounty Hunter Network" subtitle="Complete micro-tasks. Earn Cash instantly." />
      <main className="flex-1 p-4 lg:p-6 mb-20">
        <div className="flex justify-end mb-6">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-card border-primary/30">
            <span className="text-[hsla(275,96%,52%,1)] font-bold">{bounties.length}</span>
            <span className="ml-2 text-muted-foreground">Bounties Available</span>
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>No active bounties available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bounties.map((bounty) => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                isClaimed={claimedBountyIds.has(bounty.id)}
                onClick={() => setSelectedBounty(bounty)}
              />
            ))}
          </div>
        )}

        {selectedBounty && (
          <BountyDetailPanel
            bounty={selectedBounty}
            onClose={() => setSelectedBounty(null)}
            onAccept={handleClaimTask}
            isAccepting={acceptingId === selectedBounty.id}
            isClaimed={claimedBountyIds.has(selectedBounty.id)}
          />
        )}
      </main>
    </>
  );
}
