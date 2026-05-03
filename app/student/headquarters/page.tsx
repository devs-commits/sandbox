"use client";
import { useState, useEffect, useRef } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";
import { SubscriptionLineCounter } from "../../components/dashboard/SubscriptionLineCounter";
import { Button } from "../../components/ui/button";
import { FileText, Clock, Eye, User, ArrowRight, Download, Flame, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WhatsAppSupport } from "@/app/components/students/whatAppSupport";
import { buildLetterFileName, downloadLetterFromElement, type LetterType } from "../../../lib/generateReferenceLetter";
import { ReferenceLetterTemplate, type LetterData } from "../../components/letters/ReferenceLetterTemplate";

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
  const [weeksCompleted, setWeeksCompleted] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const weeksRemaining12 = Math.max(12 - weeksCompleted, 0);
  const weeksRemaining24 = Math.max(24 - weeksCompleted, 0);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const [tasksResponse, userResponse] = await Promise.all([
        supabase.from("tasks").select("*").eq("user", user.id).order("id", { ascending: true }),
        supabase.from("users").select("created_at").eq("auth_id", user.id).single()
      ]);
      if (tasksResponse.error) console.error("Error fetching tasks:", tasksResponse.error);
      else setTasks(tasksResponse.data || []);
      if (userResponse.error) console.error("Error fetching user data:", userResponse.error);
      else if (userResponse.data?.created_at) {
        const weeksSinceJoining = Math.floor((new Date().getTime() - new Date(userResponse.data.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7));
        setWeeksCompleted(weeksSinceJoining);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
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
      if (response.ok) {
        const data = await response.json();
        if (data.streak !== undefined) {
          setStreak(data.streak);
        }
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
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

  const handleDownloadLetter = async (type: "work" | "visa") => {
    const letterType: LetterType = type === "work" ? "12week" : "24week";
    const requiredWeeks = type === "work" ? 12 : 24;
    if (weeksCompleted < requiredWeeks) {
      toast.error("Requirements not met", { description: `You need ${requiredWeeks} weeks to unlock the ${type === "work" ? "Work" : "Visa"} letter.` });
      return;
    }
    if (!user || !letterRef.current) {
      toast.error("Unable to generate letter");
      return;
    }
    try {
      setDownloading(true);
      const { data: userData } = await supabase.from("users").select("full_name, track").eq("auth_id", user.id).single();
      if (!userData?.full_name) {
        toast.error("User data not found");
        return;
      }
      const newLetterData: LetterData = {
        fullName: userData.full_name,
        track: userData.track || "digital-marketing",
        type: letterType,
        candidateId: undefined, // Will be auto-generated
        jobTitle: undefined, // Will be auto-generated
        projects: undefined, // Will use defaults
      };
      setLetterData(newLetterData);
      const fileName = buildLetterFileName(newLetterData.fullName, newLetterData.track || "digital-marketing", letterType);
      await new Promise(resolve => setTimeout(resolve, 100));
      await downloadLetterFromElement(letterRef.current, fileName);
      toast.success("Letter downloaded successfully!");
    } catch (error) {
      console.error("Error generating letter:", error);
      toast.error("Failed to generate letter");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader title="Headquarters" />
      <div className="p-4 lg:p-6 space-y-6">
        <SubscriptionLineCounter user={user} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-muted-foreground/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <FileText size={18} />
            <div>
              <span className="text-sm">Tasks Done: </span>
              <span className="text-sm font-semibold">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
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
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <FileText className="text-purple-400" size={20} />
              <div>
                <h2 className="text-lg font-semibold">Work and Visa Reference Letters</h2>
                <p className="text-sm text-muted-foreground">Maintain your 12-weeks active streak to unlock verified immigration references.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-medium">
              <Flame size={14} />
              DAY {streak} STREAK
            </div>
          </div>
          <div className="mb-6">
            <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
              <div className="bg-purple-600 h-2 rounded-full transition-all duration-700 ease-out relative" style={{ width: `${Math.min((weeksCompleted / 24) * 100, 100)}%` }} />
              <div className={`absolute top-1/2 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                weeksCompleted >= 12
                  ? "bg-green-500 border-white scale-110 shadow-lg"
                  : weeksCompleted >= 8
                  ? "bg-purple-500 border-white animate-pulse shadow-md"
                  : "bg-purple-400 border-purple-600"
              }`} style={{ left: "50%", transform: "translate(-50%, -50%)" }} title={
                weeksCompleted >= 12
                  ? "🎉 Work Letter Unlocked!"
                  : `${12 - weeksCompleted} more week(s) to unlock`
              } />
            </div>
            <div className="relative mt-3 text-[10px] sm:text-xs text-muted-foreground">
              <p className="absolute left-0 max-w-[30%] truncate">{weeksCompleted}/24 Weeks</p>
              <p className="absolute left-1/2 -translate-x-1/2 text-center max-w-[30%] truncate">🎯 12 Weeks</p>
              <p className="absolute right-0 max-w-[30%] text-right truncate">24 Weeks</p>
            </div>
            <div className="mt-6 text-xs text-center text-purple-400">
              {weeksCompleted < 12
                // ? `${12 - weeksCompleted} week${12 - weeksCompleted > 1 ? "s" : ""} to unlock your Work Letter`
                ? ""
                : "🎉 Work Letter unlocked. Download now!"}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-6">
            <div className="bg-muted/50 border border-border rounded-xl p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <FileText size={20} />
                <div>
                  <p className="text-sm font-semibold">WORK LETTER OF REFERENCE</p>
                  <p className={`text-xs flex items-center gap-1 ${weeksRemaining12 > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {weeksRemaining12 > 0
                      ? `Available in ${weeksRemaining12} week${weeksRemaining12 > 1 ? "s" : ""}`
                      : <><CheckCircle size={14}/> Ready for Download</>
                    }
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleDownloadLetter("work")}
                disabled={weeksRemaining12 > 0}
                className={weeksRemaining12 > 0 ? "opacity-50 cursor-not-allowed" : ""}
              >
                {downloading ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                Download
              </Button>
            </div>
            <div className="bg-muted/50 border border-border rounded-xl p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <FileText size={20} />
                <div>
                  <p className="text-sm font-semibold">VISA LETTER OF REFERENCE</p>
                  <p className={`text-xs flex items-center gap-1 ${weeksRemaining24 > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {weeksRemaining24 > 0
                      ? `Available in ${weeksRemaining24} week${weeksRemaining24 > 1 ? "s" : ""}`
                      : <><CheckCircle size={14}/> Ready for Download</>
                    }
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleDownloadLetter("visa")}
                disabled={weeksRemaining24 > 0}
                className={weeksRemaining24 > 0 ? "opacity-50 cursor-not-allowed" : ""}
              >
                {downloading ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppSupport />
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {letterData && <ReferenceLetterTemplate ref={letterRef} data={letterData} />}
      </div>
    </div>
  );
}