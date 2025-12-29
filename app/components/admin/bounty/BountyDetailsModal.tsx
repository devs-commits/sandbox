import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";
import { X } from "lucide-react";

interface Participant {
  name: string;
  role: string;
  score: number;
  status: "Approved" | "Rejected" | "Pending";
  reward: "Paid" | "Not Paid" | "Pending";
}

export interface BountyDetails {
  id: number;
  title: string;
  category: string;
  audience: string;
  reward: string;
  status: "Live" | "Closed" | "Unpublish";
  createdAt: string;
  participants: Participant[];
}

interface BountyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bounty: BountyDetails | null;
}

export function BountyDetailsModal({ open, onOpenChange, bounty }: BountyDetailsModalProps) {
  if (!bounty) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0A1628] border-border/30">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Bounty Detail
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Bounty Overview Section */}
          <div className="bg-[#0F2137] rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Bounty Overview</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Bounty Title:</span>
                <span className="text-foreground">{bounty.title}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Category:</span>
                <span className="text-foreground">{bounty.category}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Audience:</span>
                <span className="text-foreground">{bounty.audience}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Reward:</span>
                <span className="text-foreground">{bounty.reward}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-muted-foreground">Status:</span>
                <Badge 
                  className={`${
                    bounty.status === "Live" 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : bounty.status === "Closed"
                      ? "text-red-400 bg-red-500/20"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {bounty.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">{bounty.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="bg-[#0F2137] rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Participants ({bounty.participants.length})
            </h3>
            
            <div className="rounded-lg overflow-hidden border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/20 hover:bg-primary/20">
                    <TableHead className="text-foreground font-semibold">Name</TableHead>
                    <TableHead className="text-foreground font-semibold">Role</TableHead>
                    <TableHead className="text-foreground font-semibold">Score</TableHead>
                    <TableHead className="text-foreground font-semibold">Status</TableHead>
                    <TableHead className="text-foreground font-semibold">Reward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bounty.participants.map((participant, index) => (
                    <TableRow key={index} className="border-border/30">
                      <TableCell className="text-foreground">{participant.name}</TableCell>
                      <TableCell className="text-muted-foreground">{participant.role}</TableCell>
                      <TableCell className="text-muted-foreground">{participant.score}</TableCell>
                      <TableCell>
                        <span className={`${
                          participant.status === "Approved" 
                            ? "text-emerald-400" 
                            : participant.status === "Rejected"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}>
                          {participant.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`${
                          participant.reward === "Paid" 
                            ? "text-primary" 
                            : participant.reward === "Not Paid"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}>
                          {participant.reward}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}