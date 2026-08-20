"use client";
import { useState, useEffect, useRef } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";
import { SubscriptionLineCounter } from "../../components/dashboard/SubscriptionLineCounter";
import { Button } from "../../components/ui/button";
import { 
  FileText, 
  Eye, 
  User, 
  Download, 
  Loader2, 
  CheckCircle, 
  Lock, 
  PlayCircle, 
  GraduationCap, 
  AlertCircle,
  CreditCard,
  Briefcase
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WhatsAppSupport } from "@/app/components/students/whatAppSupport";
import { buildLetterFileName, downloadLetterFromElement, type LetterType } from "../../../lib/generateReferenceLetter";
import { ReferenceLetterTemplate, type LetterData } from "../../components/letters/ReferenceLetterTemplate";
import { HeadquartersProvider } from "../../contexts/HeadquartersContext";
import { HeadquartersTour } from "../../components/students/headquarters/HeadquartersTour";

// ==========================================
// COURSE SYLLABI DEFINITIONS
// ==========================================
const TRACK_SYLLABUS: Record<string, string[]> = {
  "data-analytics": [
    "Excel Data Fundamentals", "Advanced Excel & Formulas", "Intro to SQL", "Advanced SQL Joins & Subqueries",
    "Data Visualization w/ PowerBI", "DAX Expressions", "Intro to Python for Data", "Data Manipulation with Pandas",
    "Visualization with Matplotlib", "Tableau Fundamentals", "Exploratory Data Analysis (EDA)", "Mid-Term Capstone",
    "Statistics for Data Analysis", "A/B Testing & Experimentation", "Intro to Machine Learning", "Linear Regression",
    "Classification Models", "Clustering & Segmentation", "Time Series Analysis", "Intro to NLP",
    "Big Data Fundamentals", "Cloud Analytics (AWS/GCP)", "Final Capstone Project", "Portfolio & Presentation"
  ],
  "digital-marketing": [
    "Digital Marketing Foundations", "Audience Research & Personas", "Social Media Strategy", "Content Creation & Curation",
    "SEO Fundamentals", "Advanced On-Page SEO", "Off-Page SEO & Link Building", "Google Ads (PPC) Intro",
    "Search Campaign Optimization", "Display & Video Advertising", "Facebook & Instagram Ads", "Mid-Term Capstone",
    "Meta Business Manager Deep-Dive", "Campaign Scaling Strategies", "Email Marketing Basics", "Marketing Automations",
    "Copywriting for Conversions", "Google Analytics (GA4) Intro", "GA4 Deep Dive & Reporting", "Conversion Rate Optimization (CRO)",
    "Influencer & Affiliate Marketing", "B2B Lead Generation", "Final Capstone Campaign", "Agency Operations & Portfolio"
  ],
  "cyber-security": [
    "Security Fundamentals", "Networking Basics", "OSI Model & Protocols", "Network Security Architecture",
    "Linux for Security", "Windows Security & Active Directory", "Cryptography Fundamentals", "Identity & Access Management",
    "Vulnerability Scanning", "Intro to Penetration Testing", "Web Application Security", "Mid-Term Capstone",
    "OWASP Top 10 Deep Dive", "Intro to Cloud Security", "AWS/Azure Security Posture", "Security Operations Center (SOC)",
    "SIEM Tools & Log Analysis", "Incident Response Procedures", "Intro to Malware Analysis", "Digital Forensics Basics",
    "Threat Intelligence", "Social Engineering Tactics", "Final Capstone Project", "Risk, Compliance & Portfolio"
  ]
};

const getSyllabus = (track: string) => {
  const t = track.toLowerCase();
  if (t.includes("data") || t.includes("analytics")) return TRACK_SYLLABUS["data-analytics"];
  if (t.includes("market") || t.includes("digital")) return TRACK_SYLLABUS["digital-marketing"];
  if (t.includes("cyber") || t.includes("security")) return TRACK_SYLLABUS["cyber-security"];
  return TRACK_SYLLABUS["data-analytics"]; // Fallback
};

const buildCandidateId = (fullName: string) => {
  const initials = fullName.split(" ").map((part) => part[0]).filter(Boolean).join("").toUpperCase();
  return `WDC-${new Date().getFullYear()}-${initials || "WDC"}${Math.floor(1000 + Math.random() * 9000)}`;
};

function HeadquartersContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Data States
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [userTrack, setUserTrack] = useState("");
  const [subStatus, setSubStatus] = useState("inactive");

  // Letter States
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
        .select("tasks_completed, track, subscription_status")
        .eq("auth_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (userData) {
        setTasksCompleted(userData.tasks_completed || 0);
        setUserTrack(userData.track || "data-analytics");
        setSubStatus(userData.subscription_status || "inactive");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle letter download side-effect
  useEffect(() => {
    if (!downloadRequest || !letterData) return;
    let cancelled = false;

    const performDownload = async () => {
      try {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (!letterRef.current) throw new Error("Letter template did not render");
        
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
    return () => { cancelled = true; };
  }, [downloadRequest, letterData]);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleDownloadLetter = async (type: "work" | "visa") => {
    const letterType: LetterType = type === "work" ? "12week" : "24week";
    const requiredTasks = type === "work" ? 12 : 24;
    
    if (tasksCompleted < requiredTasks) {
      toast.error("Requirements not met", { description: `You need ${requiredTasks} tasks to unlock this letter.` });
      return;
    }
    
    try {
      if (type === "work") setDownloadingWork(true);
      else setDownloadingVisa(true);
      
      const { data: userData } = await supabase.from("users").select("full_name, track").eq("auth_id", user?.id).single();
      if (!userData?.full_name) throw new Error("User not found");

      const newLetterData: LetterData = {
        fullName: userData.full_name,
        track: userData.track || "digital-marketing",
        type: letterType,
        candidateId: buildCandidateId(userData.full_name),
      };
      
      const fileName = buildLetterFileName(newLetterData.fullName, newLetterData.track || "digital-marketing", letterType);
      setLetterData(newLetterData);
      setDownloadRequest({ fileName });
    } catch (error) {
      console.error("Error generating letter:", error);
      toast.error("Failed to generate letter");
      setDownloadingWork(false);
      setDownloadingVisa(false);
    }
  };

  const syllabus = getSyllabus(userTrack);
  const currentWeek = tasksCompleted + 1;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <StudentHeader title="Headquarters" />
      
      <div className="p-4 lg:p-6 space-y-8">
        <SubscriptionLineCounter user={user} />

        {/* ========================================== */}
        {/* BANNER: UNPAID OR NOT STARTED              */}
        {/* ========================================== */}
        {subStatus !== "active" && tasksCompleted === 0 && (
          <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-transparent border border-red-500/20 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <AlertCircle size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle size={20} />
                <h3 className="font-bold text-lg">Action Required to Start Learning</h3>
              </div>
              <p className="text-muted-foreground max-w-2xl mb-6">
                Your personalized learning environment is currently locked. Complete your subscription to unlock your AI Assistant, daily tasks, and start earning experience points. Otherwise, feel free to manage your funds in the Global Wallet!
              </p>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => router.push("/student/office")} className="bg-primary text-white font-bold px-6">
                  <CreditCard className="w-4 h-4 mr-2" /> Pay & Unlock Office
                </Button>
                <Button onClick={() => router.push("/student/wallet")} variant="outline" className="border-border">
                  Go to Global Wallet
                </Button>
              </div>
            </div>
          </div>
        )}

        {subStatus === "active" && tasksCompleted === 0 && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Briefcase size={20} />
                <h3 className="font-bold text-lg">Welcome to the Team!</h3>
              </div>
              <p className="text-muted-foreground mb-4">Your workspace is ready. Your very first task has been generated and is waiting for you in your office.</p>
              <Button onClick={() => router.push("/student/office")} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                <PlayCircle className="w-4 h-4 mr-2" /> Start First Task
              </Button>
            </div>
          </div>
        )}

        {/* HQ STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" data-tour="hq-stats">
          <div className="bg-muted-foreground/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <FileText size={18} className="text-blue-400" />
            <div>
              <span className="text-sm">Tasks completed: </span>
              <span className="text-sm font-semibold">{tasksCompleted}</span>
            </div>
          </div>
          <div className="bg-red-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
            <Eye size={18} className="text-red-400" />
            <span className="text-sm font-semibold">3 Recruiters viewing</span>
          </div>
          <div className="bg-purple-500/20 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <User size={18} className="text-purple-400" />
            <div>
              <span className="text-sm">Profile Stats: </span>
              <span className="text-sm font-semibold">32 Views</span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* COURSE SYLLABUS / ROADMAP                  */}
        {/* ========================================== */}
        <div className="bg-card border border-border rounded-xl p-5 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="text-primary" /> Learning Roadmap
              </h2>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                Your 24-week path for {userTrack.replace("-", " ")}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-muted px-3 py-1.5 rounded-full">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Passed
               <span className="w-2 h-2 rounded-full bg-primary ml-2"></span> Current
               <span className="w-2 h-2 rounded-full bg-border ml-2"></span> Locked
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {syllabus.map((topic, index) => {
              const weekNum = index + 1;
              const isCompleted = weekNum < currentWeek;
              const isCurrent = weekNum === currentWeek;
              const isLocked = weekNum > currentWeek;

              return (
                <div 
                  key={weekNum}
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    isCompleted ? "bg-muted/30 border-border/50 opacity-60" :
                    isCurrent ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]" :
                    "bg-muted/10 border-border/30 opacity-40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] uppercase font-black tracking-wider ${
                      isCompleted ? "text-emerald-500" : isCurrent ? "text-primary" : "text-muted-foreground"
                    }`}>
                      Week {weekNum}
                    </span>
                    {isCompleted && <CheckCircle size={14} className="text-emerald-500" />}
                    {isCurrent && <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />}
                    {isLocked && <Lock size={12} className="text-muted-foreground" />}
                  </div>
                  
                  <p className={`text-sm font-semibold leading-snug ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {topic}
                  </p>

                  {isCurrent && subStatus === "active" && (
                    <button 
                      onClick={() => router.push("/student/office")}
                      className="mt-3 w-full py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <PlayCircle size={12} /> Start Task
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================== */}
        {/* REFERENCE LETTERS                          */}
        {/* ========================================== */}
        <div className="bg-card border border-border rounded-xl p-5 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <FileText className="text-purple-400" size={24} />
              <div>
                <h2 className="text-lg font-semibold">Work and Visa Reference Letters</h2>
                <p className="text-sm text-muted-foreground">Complete tasks to unlock verified immigration references.</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden border border-border">
              <div className="bg-purple-600 h-full rounded-full transition-all duration-700 relative" style={{ width: `${Math.min((tasksCompleted / 24) * 100, 100)}%` }} />
              
              {/* 12 Week Marker */}
              <div className={`absolute top-1/2 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                tasksCompleted >= 12 ? "bg-emerald-500 border-white shadow-lg" : "bg-muted-foreground border-border"
              }`} style={{ left: "50%", transform: "translate(-50%, -50%)" }} />
            </div>
            <div className="relative mt-3 text-xs font-medium text-muted-foreground flex justify-between">
              <span>{tasksCompleted} Tasks Done</span>
              <span className={`absolute left-1/2 -translate-x-1/2 ${tasksCompleted >= 12 ? "text-emerald-400" : ""}`}>12 Tasks (Work)</span>
              <span>24 Tasks (Visa)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4" data-tour="hq-letters">
            {/* WORK LETTER CARD */}
            <div className="bg-muted/30 border border-border rounded-xl p-5 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tasksCompleted >= 12 ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">WORK REFERENCE</p>
                  <p className={`text-xs mt-0.5 ${tasksRemaining12 > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                    {tasksRemaining12 > 0 ? `Unlocks in ${tasksRemaining12} task${tasksRemaining12 > 1 ? "s" : ""}` : "Ready to Download"}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleDownloadLetter("work")} disabled={tasksRemaining12 > 0 || downloadingWork} className={tasksRemaining12 > 0 ? "opacity-50" : "bg-purple-600 hover:bg-purple-500"}>
                {downloadingWork ? <Loader2 size={14} className="animate-spin mr-1"/> : <Download size={14} className="mr-1"/>}
                Get Letter
              </Button>
            </div>

            {/* VISA LETTER CARD */}
            <div className="bg-muted/30 border border-border rounded-xl p-5 flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tasksCompleted >= 24 ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">VISA REFERENCE</p>
                  <p className={`text-xs mt-0.5 ${tasksRemaining24 > 0 ? "text-orange-400" : "text-emerald-400"}`}>
                    {tasksRemaining24 > 0 ? `Unlocks in ${tasksRemaining24} task${tasksRemaining24 > 1 ? "s" : ""}` : "Ready to Download"}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleDownloadLetter("visa")} disabled={tasksRemaining24 > 0 || downloadingVisa} className={tasksRemaining24 > 0 ? "opacity-50" : "bg-purple-600 hover:bg-purple-500"}>
                {downloadingVisa ? <Loader2 size={14} className="animate-spin mr-1"/> : <Download size={14} className="mr-1"/>}
                Get Letter
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
