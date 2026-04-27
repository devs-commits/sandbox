"use client";

import { useState, useEffect } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";
import { SubscriptionLineCounter } from "../../components/dashboard/SubscriptionLineCounter"; // <-- Imported new component
import { Button } from "../../components/ui/button";
import {
  FileText,
  Clock,
  Eye,
  User,
  ArrowRight,
  Download,
  Flame,
  Loader2,
  Sparkles,
  CheckCircle
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WhatsAppSupport } from "@/app/components/students/whatAppSupport";

interface Task {
  id: number;
  title: string;
  brief_content: string;
  difficulty: string;
  task_track: string;
  completed: boolean;
}

export default function page() {

  const { user } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const weeksCompleted = Math.floor(streak / 7);

  const weeksRemaining12 = Math.max(12 - weeksCompleted, 0);
  const weeksRemaining24 = Math.max(24 - weeksCompleted, 0);


  const fetchTasks = async () => {

    if (!user) return;

    try {

      setIsLoading(true);

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user", user.id)
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data || []);
      }

    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }

  };


  const updateStreak = async () => {

    if (!user) return;

    try {

      const response = await fetch("/api/users/streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.streak !== undefined) {
        setStreak(data.streak);
      }

    } catch (error) {
      console.error("Error updating streak:", error);
    }

  };


  useEffect(() => {
    fetchTasks();
    updateStreak();
  }, [user]);


  const getDifficultyColor = (difficulty: string) => {

    if (!difficulty) return "bg-purple-500/20 text-purple-500";

    switch (difficulty.toLowerCase()) {

      case "beginner":
        return "bg-green-500/20 text-green-500";

      case "intermediate":
        return "bg-yellow-500/20 text-yellow-500";

      case "advanced":
        return "bg-red-500/20 text-red-500";

      default:
        return "bg-purple-500/20 text-purple-500";

    }

  };


  const handleTaskClick = (taskId: number) => {
    router.push(`/student/office?taskId=${taskId}`);
  };


  const handleDownloadLetter = async (type: string) => {

    const weeksCompleted = Math.floor(streak / 7);

    if (weeksCompleted < 12) {
      toast.error("Requirements not met", {
        description: "You need 12 weeks to unlock this letter."
      });
      return;
    }

    if (type === "24week" && weeksCompleted < 24) {
      toast.error("Requirements not met", {
        description: "You need 24 weeks to unlock this letter."
      });
      return;
    }

    try {

      setDownloading(true);

      const response = await fetch(
        `/api/letters/generate?userId=${user?.id}&type=${type}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate letter");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "letter.pdf";
      a.click();

    } catch (error) {

      toast.error("Failed to generate letter");

    } finally {

      setDownloading(false);

    }

  };


  return (

    <div className="min-h-screen bg-background">

      <StudentHeader title="Headquarters" />

      <div className="p-4 lg:p-6 space-y-6">

        {/* NEW: The subtle line counter goes here */}
        <SubscriptionLineCounter user={user} />

        {/* Stats Row */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <div className="bg-muted-foreground/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <FileText size={18} />
            <div>
              <span className="text-sm">Tasks Done: </span>
              <span className="text-sm font-semibold">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </span>
            </div>
          </div>

          <div className="bg-green-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <Clock size={18} />
            <div>
              <span className="text-sm">Streak: </span>
              <span className="text-sm font-semibold">Day {streak}</span>
            </div>
          </div>

          <div className="bg-red-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
            <Eye size={18} />
            <span className="text-sm font-semibold">3 Recruiters viewing</span>
          </div>

          <div className="bg-purple-500/20 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <User size={18} />
            <div>
              <span className="text-sm">Profile Stats: </span>
              <span className="text-sm font-semibold">32 Views</span>
            </div>
          </div>

        </div>



        {/* Reference Letters */}

        <div className="bg-card border border-border rounded-xl p-5">

          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-4">

            <div className="flex items-start gap-3">

              <FileText className="text-purple-400" size={20} />

              <div>
                <h2 className="text-lg font-semibold">
                  Work and Visa Reference Letters
                </h2>

                <p className="text-sm text-muted-foreground">
                  Maintain your 12-weeks active streak to unlock verified immigration references.
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-medium">
              <Flame size={14} />
              DAY {streak} STREAK
            </div>

          </div>



          {/* Progress */}

          <div className="mb-4">

            <div className="w-full bg-muted rounded-full h-2">

              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${Math.min((streak / 84) * 100, 100)}%` }}
              />

            </div>

            <div className="flex justify-between mt-1 text-xs text-muted-foreground">

              <p>{weeksCompleted} / 12 Weeks Completed</p>
              <p>12 Weeks Internship</p>

            </div>

          </div>



          {/* Letter Cards */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* WORK LETTER */}

            <div className="bg-muted/50 border border-border rounded-xl p-4 flex justify-between items-center">

              <div className="flex gap-3 items-center">

                <FileText size={20} />

                <div>

                  <p className="text-sm font-semibold">
                    WORK LETTER OF REFERENCE
                  </p>

                  <p className={`text-xs flex items-center gap-1 ${
                    weeksRemaining12 > 0 ? "text-orange-400" : "text-green-400"
                  }`}>

                    {weeksRemaining12 > 0
                      ? `Available in ${weeksRemaining12} week${weeksRemaining12 > 1 ? "s" : ""}`
                      : <>
                          <CheckCircle size={14}/>
                          Ready for Download
                        </>
                    }

                  </p>

                </div>

              </div>

              <Button
                size="sm"
                disabled={downloading || weeksRemaining12 > 0}
                onClick={() => handleDownloadLetter("12week")}
              >

                {downloading
                  ? <Loader2 size={14} className="animate-spin"/>
                  : <Download size={14}/>
                }

                Download

              </Button>

            </div>



            {/* VISA LETTER */}

            <div className="bg-muted/50 border border-border rounded-xl p-4 flex justify-between items-center">

              <div className="flex gap-3 items-center">

                <FileText size={20} />

                <div>

                  <p className="text-sm font-semibold">
                    VISA LETTER OF REFERENCE
                  </p>

                  <p className={`text-xs flex items-center gap-1 ${
                    weeksRemaining24 > 0 ? "text-orange-400" : "text-green-400"
                  }`}>

                    {weeksRemaining24 > 0
                      ? `Available in ${weeksRemaining24} week${weeksRemaining24 > 1 ? "s" : ""}`
                      : <>
                          <CheckCircle size={14}/>
                          Ready for Download
                        </>
                    }

                  </p>

                </div>

              </div>

              <Button
                size="sm"
                disabled={downloading || weeksRemaining24 > 0}
                onClick={() => handleDownloadLetter("24week")}
              >

                {downloading
                  ? <Loader2 size={14} className="animate-spin"/>
                  : <Download size={14}/>
                }

                Download

              </Button>

            </div>

          </div>

        </div>


        {/* Tasks Section remains unchanged */}

        {/* Your existing tasks + bounty code stays exactly the same */}

      </div>

      <WhatsAppSupport />

    </div>

  );

}