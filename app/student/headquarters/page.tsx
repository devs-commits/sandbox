"use client";
import { useState, useEffect, useRef } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";
import { SubscriptionLineCounter } from "../../components/dashboard/SubscriptionLineCounter";
import { Button } from "../../components/ui/button";
import { FileText, Clock, Eye, User, Download, Flame, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WhatsAppSupport } from "@/app/components/students/whatAppSupport";
import { buildLetterFileName, downloadLetterFromElement, type LetterType } from "../../../lib/generateReferenceLetter";
import { ReferenceLetterTemplate, type LetterData } from "../../components/letters/ReferenceLetterTemplate";
import { HeadquartersProvider } from "../../contexts/HeadquartersContext";
import { HeadquartersTour } from "../../components/students/headquarters/HeadquartersTour";

const buildCandidateId = (fullName: string) => {
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();

  return `WDC-${new Date().getFullYear()}-${initials || "WDC"}${Math.floor(1000 + Math.random() * 9000)}`;
};

function HeadquartersContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [downloadingWork, setDownloadingWork] = useState(false);
  const [downloadingVisa, setDownloadingVisa] = useState(false);
  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const [downloadRequest, setDownloadRequest] = useState<{ fileName: string } | null>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const tasksRemaining12 = Math.max(12 - tasksCompleted, 0);
  const tasksRemaining24 = Math.max(24 - tasksCompleted, 0);

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("tasks_completed")
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (userData?.tasks_completed !== undefined) {
        setTasksCompleted(userData.tasks_completed);
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

  // Handle download after letterData is set and component is rendered
  useEffect(() => {
    if (!downloadRequest || !letterData) return;

    let cancelled = false;

    const performDownload = async () => {
      try {
        await new Promise((resolve) => requestAnimationFrame(resolve));

        if (!letterRef.current) {
          throw new Error("Letter template did not render before download");
        }

        await downloadLetterFromElement(letterRef.current, downloadRequest.fileName);
        toast.success("Letter downloaded successfully!");
      } catch (error) {
        console.error("Error downloading letter:", error);
        toast.error("Failed to generate letter");
      } finally {
        if (!cancelled) {
          setDownloadingWork(false);
          setDownloadingVisa(false);
          setDownloadRequest(null);
        }
      }
    };

    performDownload();

    return () => {
      cancelled = true;
    };
  }, [downloadRequest, letterData]);

  useEffect(() => {
    fetchUserData();
    updateStreak();
  }, [user]);

  const handleDownloadLetter = async (type: "work" | "visa") => {
    const letterType: LetterType = type === "work" ? "12week" : "24week";
    const requiredTasks = type === "work" ? 12 : 24;
    if (tasksCompleted < requiredTasks) {
      toast.error("Requirements not met", { description: `You need ${requiredTasks} tasks to unlock the ${type === "work" ? "Work" : "Visa"} letter.` });
      return;
    }
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    try {
      if (type === "work") {
        setDownloadingWork(true);
      } else {
        setDownloadingVisa(true);
      }
      const { data: userData } = await supabase.from("users").select("full_name, track").eq("auth_id", user.id).single();
      if (!userData?.full_name) {
        toast.error("User data not found");
        if (type === "work") {
          setDownloadingWork(false);
        } else {
          setDownloadingVisa(false);
        }
        return;
      }
      const newLetterData: LetterData = {
        fullName: userData.full_name,
        track: userData.track || "digital-marketing",
        type: letterType,
        candidateId: buildCandidateId(userData.full_name),
        jobTitle: undefined,
        projects: undefined,
      };
      const fileName = buildLetterFileName(newLetterData.fullName, newLetterData.track || "digital-marketing", letterType);
      setLetterData(newLetterData);
      setDownloadRequest({ fileName });
    } catch (error) {
      console.error("Error generating letter:", error);
      toast.error("Failed to generate letter");
      if (type === "work") {
        setDownloadingWork(false);
      } else {
        setDownloadingVisa(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader title="Headquarters" />
      <div className="p-4 lg:p-6 space-y-6">
        <SubscriptionLineCounter user={user} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-tour="hq-stats">
          <div className="bg-muted-foreground/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <FileText size={18} />
            <div>
              <span className="text-sm">Task completed: </span>
              <span className="text-sm font-semibold">{tasksCompleted}</span>
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
        <div className="bg-card border border-border rounded-xl p-5" data-tour="hq-letters">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <FileText className="text-purple-400" size={20} />
              <div>
                <h2 className="text-lg font-semibold">Work and Visa Reference Letters</h2>
                <p className="text-sm text-muted-foreground">Complete tasks to unlock verified immigration references.</p>
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
              <div className="bg-purple-600 h-2 rounded-full transition-all duration-700 ease-out relative" style={{ width: `${Math.min((tasksCompleted / 24) * 100, 100)}%` }} />
              <div className={`absolute top-1/2 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                tasksCompleted >= 12
                  ? "bg-green-500 border-white scale-110 shadow-lg"
                  : tasksCompleted >= 8
                  ? "bg-purple-500 border-white animate-pulse shadow-md"
                  : "bg-purple-400 border-purple-600"
              }`} style={{ left: "50%", transform: "translate(-50%, -50%)" }} title={
                tasksCompleted >= 12
                  ? "🎉 Work Letter Unlocked!"
                  : `${12 - tasksCompleted} more task(s) to unlock`
              } />
            </div>
            <div className="relative mt-3 text-[10px] sm:text-xs text-muted-foreground">
              <p className="absolute left-0 max-w-[30%] truncate">{tasksCompleted}/24 Tasks</p>
              <p className="absolute left-1/2 -translate-x-1/2 text-center max-w-[30%] truncate">🎯 12 Tasks</p>
              <p className="absolute right-0 max-w-[30%] text-right truncate">24 Tasks</p>
            </div>
            <div className="mt-6 text-xs text-center text-purple-400">
              {tasksCompleted < 12
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
                  <p className={`text-xs flex items-center gap-1 ${tasksRemaining12 > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {tasksRemaining12 > 0
                      ? `Available in ${tasksRemaining12} task${tasksRemaining12 > 1 ? "s" : ""}`
                      : <><CheckCircle size={14}/> Ready for Download</>
                    }
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleDownloadLetter("work")}
                disabled={tasksRemaining12 > 0 || downloadingWork}
                className={tasksRemaining12 > 0 ? "opacity-50 cursor-not-allowed" : ""}
              >
                {downloadingWork ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                Download
              </Button>
            </div>
            <div className="bg-muted/50 border border-border rounded-xl p-4 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <FileText size={20} />
                <div>
                  <p className="text-sm font-semibold">VISA LETTER OF REFERENCE</p>
                  <p className={`text-xs flex items-center gap-1 ${tasksRemaining24 > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {tasksRemaining24 > 0
                      ? `Available in ${tasksRemaining24} task${tasksRemaining24 > 1 ? "s" : ""}`
                      : <><CheckCircle size={14}/> Ready for Download</>
                    }
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleDownloadLetter("visa")}
                disabled={tasksRemaining24 > 0 || downloadingVisa}
                className={tasksRemaining24 > 0 ? "opacity-50 cursor-not-allowed" : ""}
              >
                {downloadingVisa ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
      <HeadquartersTour />
      <WhatsAppSupport />
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {letterData && <ReferenceLetterTemplate ref={letterRef} data={letterData} />}
      </div>
    </div>
  );
}

export default function page() {
  return (
    <HeadquartersProvider>
      <HeadquartersContent />
    </HeadquartersProvider>
  );
}
