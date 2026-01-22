"use client"
import { useState, useEffect } from "react";
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
}

function BountyDetailPanel({ bounty, onClose, onAccept, isAccepting }: BountyDetailPanelProps) {
  const slotsLeft = bounty.slots_total - bounty.slots_filled;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel - 50% of total viewport width from right */}
      <div className="absolute right-0 top-0 h-full w-full md:w-1/2 bg-card border-l border-border overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">{bounty.title}</h1>
              <Badge className="bg-[hsla(47,62%,50%,0.2)] text-[hsla(47,62%,50%,1)] hover:bg-yellow-500/30">{bounty.type}</Badge>
            </div>
            <button
              onClick={onClose}
              className="text-coral hover:text-coral/80 transition-colors"
            >
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
                    <li key={index}>
                      {instruction}
                    </li>
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
                Note: You have to click on start task to claim your slot and once you click Start Task, the countdown begins based on the duration. You must upload your submission within this period. Failure to do so will result in disqualification from the bounty, and your slot will be released back to other users (if the bounty is still available). This bounty currently has {slotsLeft} slots left, and slots reduce in real time.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground text-sm mb-4">
                CLAIM: <span className="text-foreground font-medium">{slotsLeft} left</span>
              </p>
              <Button
                onClick={() => onAccept(bounty)}
                disabled={isAccepting || slotsLeft <= 0}
                className="w-full bg-primary hover:bg-primary/90 text-black py-6 text-lg font-semibold"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    STARTING TASK...
                  </>
                ) : (
                  "START TASK"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BountyCard({
  bounty,
  onClick,
}: {
  bounty: Bounty;
  onClick: () => void;
}) {
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
          <p className="text-lg font-bold text-[hsla(151,74%,46%,1)]">₦{bounty.reward.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">CLAIM</p>
          <p className="text-foreground font-medium">{slotsLeft} left</p>
        </div>
      </div>
    </div>
  );
}

export default function BountyHunter() {
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const { data, error } = await supabase
          .from('bounties')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching bounties:", error);
          toast.error("Failed to load bounties");
        } else if (data) {
          // Parse jsonb fields
          const mappedBounties: Bounty[] = data.map((b: any) => ({
            ...b,
            instructions: typeof b.instructions === 'string' ? JSON.parse(b.instructions) : b.instructions,
            deliverables: typeof b.deliverables === 'string' ? JSON.parse(b.deliverables) : b.deliverables,
          }));
          setBounties(mappedBounties);
        }
      } catch (error) {
        console.error("Error fetching bounties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:bounties')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bounties' }, () => {
        fetchBounties();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, []);

  const handleStartTask = async (bounty: Bounty) => {
    if (!user) {
      toast.error("You must be logged in to accept bounties");
      return;
    }

    // Confirm acceptance
    if (!confirm(`Are you sure you want to accept "${bounty.title}"? It will be added to your desk.`)) return;

    setAcceptingId(bounty.id);

    try {
      // 1. Create bounty submission record (pending)
      const { data: submission, error: subError } = await supabase
        .from('bounty_submissions')
        .insert({
          bounty_id: bounty.id,
          student_id: user.user_id,
          status: 'pending' // pending approval
        })
        .select()
        .single();
      console.log(user)
      if (subError) throw subError;

      // 2. Create a task in 'tasks' table so it appears in "Your Desk"
      const newTaskData = {
        user: user.id,
        title: bounty.title,
        brief_content: bounty.description,
        task_track: bounty.type || 'General',
        completed: false,
        resources: [],
        // We can store deadline info if needed, or other metadata
      };

      const { error: taskError } = await supabase
        .from('tasks')
        .insert(newTaskData);

      if (taskError) throw taskError;

      // 3. Increment slots_filled in bounties table
      await supabase.rpc('increment_bounty_slots', { bounty_id: bounty.id });

      toast.success("Bounty accepted! Check your Office Desk.");
      setSelectedBounty(null);

      // Redirect to office desk
      router.push('/student/office');

    } catch (error) {
      console.error("Error accepting bounty:", error);
      toast.error("Failed to accept bounty. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <>
      <StudentHeader
        title="Bounty Hunter Network"
        subtitle="Complete micro-tasks. Earn Cash instantly."
      />
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
                onClick={() => setSelectedBounty(bounty)}
              />
            ))}
          </div>
        )}

        {/* Detail Panel */}
        {selectedBounty && (
          <BountyDetailPanel
            bounty={selectedBounty}
            onClose={() => setSelectedBounty(null)}
            onAccept={handleStartTask}
            isAccepting={acceptingId === selectedBounty.id}
          />
        )}
      </main>
    </>
  );
}