"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { X } from "lucide-react";

interface CreateBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bounty: BountyFormData, publish: boolean) => void;
}

export interface BountyFormData {
  title: string;
  audience: string;
  category: string;
  description: string;
  instructions: string;
  deliverables: string;
  submissionFormats: string[];
  estimatedTime: string;
  availableSlots: string;
  submissionWindow: boolean;
  reward: string;
}

const categories = [
  "Cybersecurity",
  "Digital Marketing",
  "Data Analytics",
];

const submissionFormatOptions = ["PDF", "DOCX", "ZIP", "Image", "Link"];

const timeOptions = ["30 mins", "1 hour", "2 hours", "4 hours", "1 day", "2 days", "1 week"];

export function CreateBountyModal({ open, onOpenChange, onSave }: CreateBountyModalProps) {
  const [formData, setFormData] = useState<BountyFormData>({
    title: "",
    audience: "Both",
    category: "",
    description: "",
    instructions: "",
    deliverables: "",
    submissionFormats: [],
    estimatedTime: "30 mins",
    availableSlots: "",
    submissionWindow: true,
    reward: "",
  });

  const handleFormatToggle = (format: string) => {
    setFormData((prev) => ({
      ...prev,
      submissionFormats: prev.submissionFormats.includes(format)
        ? prev.submissionFormats.filter((f) => f !== format)
        : [...prev.submissionFormats, format],
    }));
  };

  const handleSubmit = (publish: boolean) => {
    onSave(formData, publish);
    setFormData({
      title: "",
      audience: "Both",
      category: "",
      description: "",
      instructions: "",
      deliverables: "",
      submissionFormats: [],
      estimatedTime: "30 mins",
      availableSlots: "",
      submissionWindow: true,
      reward: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0A1628] border-border/30">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Create New Bounty
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Bounty Details Section */}
          <h3 className="text-sm font-medium text-foreground">Bounty Details</h3>
          <div className="bg-[hsla(216,36%,18%,1)] rounded-lg p-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Bounty Title</label>
              <Input
                placeholder="e.g Kuda App Testing"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-[#0A1628] border-border/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Target Audience</label>
                <Select value={formData.audience} onValueChange={(v) => setFormData({ ...formData, audience: v })}>
                  <SelectTrigger className="bg-[#0A1628] border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Both">Both</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Recruiters">Recruiters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-[#0A1628] border-border/30">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Description</label>
              <Textarea
                placeholder="Describe the task clearly..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#0A1628] border-border/30 min-h-[80px]"
              />
            </div>
          </div>

          {/* Instructions & Deliverables Section */}
          <h3 className="text-sm font-medium text-foreground">Instructions & Deliverables</h3>
          <div className="bg-[hsla(216,36%,18%,1)] rounded-lg p-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Task Instructions</label>
              <Textarea
                placeholder="Step-by-step instructions..."
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="bg-[#0A1628] border-border/30 min-h-[80px]"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Expected Deliverables</label>
              <Input
                placeholder="PDF report, screenshots, video, etc."
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                className="bg-[#0A1628] border-border/30"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Submission Format</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {submissionFormatOptions.map((format) => (
                  <label key={format} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.submissionFormats.includes(format)}
                      onCheckedChange={() => handleFormatToggle(format)}
                      className="border-border/50"
                    />
                    <span className="text-sm text-foreground">{format}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline, Rules & Reward Settings Section */}
          <h3 className="text-sm font-medium text-foreground">Timeline, Rules & Reward Settings</h3>
          <div className="bg-[hsla(216,36%,18%,1)] rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Estimated Time to Complete</label>
                <Select value={formData.estimatedTime} onValueChange={(v) => setFormData({ ...formData, estimatedTime: v })}>
                  <SelectTrigger className="bg-[#0A1628] border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Available Slots</label>
                <Input
                  placeholder="e.g 34"
                  value={formData.availableSlots}
                  onChange={(e) => setFormData({ ...formData, availableSlots: e.target.value })}
                  className="bg-[#0A1628] border-border/30"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Submission Window</label>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <Checkbox
                  checked={formData.submissionWindow}
                  onCheckedChange={(checked) => setFormData({ ...formData, submissionWindow: !!checked })}
                  className="border-border/50"
                />
                <span className="text-sm text-foreground">
                  Once a user clicks Start Task, they have admin selected estimated time to submit
                </span>
              </label>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Reward per Approved Submission (₦)</label>
              <Input
                placeholder="e.g Kuda App Testing"
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                className="bg-[#0A1628] border-border/30"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => handleSubmit(false)}
              className="px-6 border-border/50 hover:bg-muted bg-primary/10"
            >
              Save and Unpublish
            </Button>
            <Button
              onClick={() => handleSubmit(true)}
              className="px-6 bg-primary hover:bg-primary/90 text-foreground"
            >
              Save and Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}