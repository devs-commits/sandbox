"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContexts";

interface TaskGeneratorProps {
  onTasksGenerated: () => void;
}

export const TaskGenerator = ({ onTasksGenerated }: TaskGeneratorProps) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTasks = async () => {
    if (!user) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          track: user.track,
          experienceLevel: user.experienceLevel
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Tasks generated successfully!");
        onTasksGenerated();
      } else {
        toast.error(data.error || "Failed to generate tasks");
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast.error("An error occurred while generating tasks");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded-xl bg-card/50">
      <div className="bg-primary/10 p-3 rounded-full mb-4">
        <Sparkles className="text-primary h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        It looks like you don't have any tasks assigned yet. Generate your personalized learning path to get started.
      </p>
      <Button 
        onClick={handleGenerateTasks} 
        disabled={isGenerating}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Tasks...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate My Tasks
          </>
        )}
      </Button>
    </div>
  );
};
