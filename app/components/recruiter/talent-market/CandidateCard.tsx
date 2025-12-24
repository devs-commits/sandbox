import { ArrowRight, Flame } from "lucide-react";

interface Candidate {
  id: number;
  name: string;
  role: string;
  category: string;
  score: number;
  skills: string[];
  lastActive: string;
  isHot?: boolean;
}

interface CandidateCardProps {
  candidate: Candidate;
  onViewProfile: () => void;
}

export function CandidateCard({ candidate, onViewProfile }: CandidateCardProps) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">
              {candidate.id}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Candidate {candidate.id}</h3>
            <p className="text-sm text-muted-foreground">{candidate.role}</p>
          </div>
        </div>
        {candidate.isHot && (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-destructive text-xs font-medium rounded">
            <Flame className="w-3 h-3" />
            HOT
          </span>
        )}
      </div>

      {/* Category & Score */}
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Category</p>
          <p className="text-sm font-medium text-foreground">{candidate.category}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">Avg Score</p>
          <p className="text-sm font-bold text-green-500">{candidate.score}%</p>
        </div>
      </div>

      {/* Skills */}
      <div className="flex gap-2 mb-4">
        {candidate.skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Last Active: {candidate.lastActive}
        </span>
        <button
          onClick={onViewProfile}
          className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          View Profile
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}