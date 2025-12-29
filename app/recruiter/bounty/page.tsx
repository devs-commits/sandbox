"use client"
import { useState } from "react";
import { RecruiterHeader } from "@/app/components/recruiter/RecruiterHeader";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Clock, X } from "lucide-react";

interface Bounty {
  id: string;
  type: string;
  duration: string;
  title: string;
  description: string;
  instructions: string[];
  deliverables: string[];
  reward: number;
  slotsLeft: number;
}

const bounties: Bounty[] = [
  {
    id: "1",
    type: "QA TESTING",
    duration: "30 mins",
    title: "App Testing: Kuda Beta",
    description: "Test the new Kuda Beta mobile app and evaluate performance, UI flow, and basic functionality. You will be required to identify bugs, usability issues, and UX inconsistencies.",
    instructions: [
      "Install the Kuda Beta app using the test link provided.",
      "Complete a full onboarding flow (Sign up → Login → Dashboard).",
      "Test core features: Transfers, Savings, Navigation.",
      "Record issues:",
      "Prepare your submission as a single PDF or ZIP file."
    ],
    deliverables: [
      "At least 3 identified bugs",
      "Screenshots/video proof",
      "Your device type (Android/iOS)",
      "Summary of overall experience"
    ],
    reward: 5000,
    slotsLeft: 45,
  },
  {
    id: "2",
    type: "AI TRAINING",
    duration: "1 hr",
    title: "Voice Recording: Yoruba",
    description: "Record voice samples in Yoruba language for AI training dataset. You will be required to follow specific scripts and recording guidelines.",
    instructions: [
      "Download the recording app from the provided link.",
      "Read and record the provided scripts clearly.",
      "Ensure minimal background noise.",
      "Submit all recordings in the required format."
    ],
    deliverables: [
      "Minimum 50 voice recordings",
      "Clear audio without background noise",
      "Recordings in WAV format"
    ],
    reward: 6500,
    slotsLeft: 120,
  },
  {
    id: "3",
    type: "RESEARCH",
    duration: "2hrs",
    title: "Lead Gen: Fintech CEOs",
    description: "Research and compile a list of Fintech CEOs and their contact information for business development purposes.",
    instructions: [
      "Research Fintech companies in Nigeria.",
      "Identify and verify CEO contact information.",
      "Compile data in the provided spreadsheet format.",
      "Verify all information for accuracy."
    ],
    deliverables: [
      "Minimum 20 verified CEO contacts",
      "Company name, CEO name, email, LinkedIn",
      "Submitted in Excel format"
    ],
    reward: 15000,
    slotsLeft: 10,
  },
];

interface BountyDetailPanelProps {
  bounty: Bounty;
  onClose: () => void;
}

function BountyDetailPanel({ bounty, onClose }: BountyDetailPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Panel - 50% of total viewport width from right */}
      <div className="absolute right-0 top-0 h-full w-1/2 bg-card border-l border-border overflow-y-auto">
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
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
                {bounty.instructions.map((instruction, index) => (
                  <li key={index}>
                    {instruction}
                    {index === 3 && (
                      <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                        <li>Screenshots or screen recording</li>
                        <li>Clear explanation of the issue</li>
                        <li>Steps to reproduce</li>
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="font-semibold text-foreground mb-2">What to Submit (Deliverables)</h2>
              <p className="text-muted-foreground text-sm mb-2">Your submission must include:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                {bounty.deliverables.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p className="text-muted-foreground text-sm mt-2">Upload formats: PDF, DOCX, ZIP</p>
            </div>

            <div className="bg-[hsla(47,62%,50%,0.2)] border border-yellow-500/30 rounded-lg p-4">
              <p className="text-[hsla(47,62%,50%,1)] text-sm">
                Note: You have click on start task to claim your slot and once you click Start Task, the 24-hour countdown begins. You must upload your submission within this period. Failure to do so will result in disqualification from the bounty, and your slot will be released back to other users (if the bounty is still available). This bounty currently has {bounty.slotsLeft} slots left, and slots reduce in real time.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground text-sm mb-4">
                CLAIM: <span className="text-foreground font-medium">{bounty.slotsLeft} left</span>
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-foreground py-6">
                Start Task
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
  return (
    <div 
      onClick={onClick}
      className="bg-card rounded-xl p-5 border border-border transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <Badge className="bg-[hsla(47,62%,50%,0.3)] text-[hsla(47,62%,50%,1)] hover:bg-yellow-500/20">{bounty.type}</Badge>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Clock className="w-4 h-4" />
          {bounty.duration}
        </div>
      </div>

      <h3 className="font-semibold text-foreground mb-4">{bounty.title}</h3>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase">REWARD</p>
          <p className="text-lg font-bold text-[hsla(151,74%,46%,1)]">₦{bounty.reward.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">CLAIM</p>
          <p className="text-foreground font-medium">{bounty.slotsLeft} left</p>
        </div>
      </div>
    </div>
  );
}

export default function BountyHunter() {
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const totalBounties = 124;

  return (
    <>
      <RecruiterHeader
        title="Bounty Hunter Network"
        subtitle="Complete micro-tasks. Earn Cash instantly."
      />
      <main className="flex-1 p-4 lg:p-6">
        <div className="flex justify-end mb-6">
          <Badge variant="outline" className="text-sm px-4 py-2 bg-card border-primary/30">
            <span className="text-[hsla(275,96%,52%,1)] font-bold">{totalBounties}</span>
            <span className="ml-2 text-muted-foreground">Bounties Available</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bounties.map((bounty) => (
            <BountyCard
              key={bounty.id}
              bounty={bounty}
              onClick={() => setSelectedBounty(bounty)}
            />
          ))}
        </div>

        {/* Detail Panel */}
        {selectedBounty && (
          <BountyDetailPanel 
            bounty={selectedBounty} 
            onClose={() => setSelectedBounty(null)} 
          />
        )}
      </main>
    </>
  );
}