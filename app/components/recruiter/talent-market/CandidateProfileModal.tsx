import { X, Lock, Unlock, Linkedin, Mail, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface Candidate {
  id: number;
  name: string;
  role: string;
  category: string;
  score: number;
  skills: string[];
  lastActive: string;
  tasks: number;
  weeks: number;
  isHot?: boolean;
  // Unlocked data
  realName?: string;
  location?: string;
  email?: string;
  linkedIn?: string;
  taskAnalysis?: {
    title: string;
    description: string;
    grading: string;
    file: string;
  };
}

interface CandidateProfileModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  tasksUnlocked: boolean;
  profileUnlocked: boolean;
  onUnlockTasks: () => void;
  onUnlockProfile: () => void;
}

export function CandidateProfileModal({
  candidate,
  isOpen,
  onClose,
  tasksUnlocked,
  profileUnlocked,
  onUnlockTasks,
  onUnlockProfile,
}: CandidateProfileModalProps) {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Candidate Profile
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Candidate Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {candidate.id}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {profileUnlocked && candidate.realName
                    ? candidate.realName
                    : `Candidate ${candidate.id}`}
                </h3>
                <p className="text-sm text-muted-foreground">{candidate.role}</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-bold text-purple-500 bg-purple-500/20 border border-none rounded">
              INTERN
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground uppercase">Score</p>
              <p className="text-xl font-bold text-green-500">{candidate.score}%</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground uppercase">Task</p>
              <p className="text-xl font-bold text-foreground">{candidate.tasks}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
              <p className="text-xs text-muted-foreground uppercase">Week</p>
              <p className="text-xl font-bold text-foreground">{candidate.weeks}</p>
            </div>
          </div>

          {/* Recent Task Analysis */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">Recent Task Analysis</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {tasksUnlocked ? (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              {tasksUnlocked && candidate.taskAnalysis ? (
                <div className="space-y-3">
                  <h5 className="font-medium text-foreground">
                    {candidate.taskAnalysis.title}
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    "{candidate.taskAnalysis.description}"
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                      AI GRADING: {candidate.taskAnalysis.grading}
                    </span>
                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                      FILE: {candidate.taskAnalysis.file}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock to view detailed task submissions and files.
                  </p>
                  <Button
                    onClick={onUnlockTasks}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Unlock Recent Tasks ₦ 15,000
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Full Identity & Resume */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground">Full Identity & Resume</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {profileUnlocked ? (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>Unlocked</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              {profileUnlocked && candidate.realName ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-foreground">{candidate.realName}</h5>
                    <p className="text-sm text-muted-foreground">
                      Verified Graduate • {candidate.location}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 text-xs bg-[#0077B5] text-white rounded flex items-center gap-1">
                        <Linkedin className="w-3 h-3" />
                        LINKEDIN
                      </span>
                      <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        EMAIL
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download CV
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock real name, contact details, and PDF Resume.
                  </p>
                  <Button
                    onClick={onUnlockProfile}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Unlock Full Profile & CV ₦ 50,000
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}