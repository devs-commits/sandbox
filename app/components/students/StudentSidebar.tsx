"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import {
  LayoutGrid, Briefcase, FolderOpen, Wallet, DollarSign,
  Menu, X, Lock, Trophy, Target, Shield, BarChart3, Megaphone, Award,
} from "lucide-react";

import { useState, useEffect, useRef, useMemo } from "react";
import wdcNewLogo from "../../../public/wdc_labs_logo.png";
import LogoutButton from "../shared/LogoutButton";
import { cn } from "../../../lib/utils";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../contexts/AuthContexts";
import CareerJourneyModal from "../gamification/CareerJourneyModal";

const navItems = [
  { label: "Headquarters", icon: LayoutGrid, path: "/student/headquarters" },
  { label: "My Office", icon: Briefcase, path: "/student/office", id: "office" },
  { label: "My Portfolio", icon: FolderOpen, path: "/student/portfolio" },
  { label: "Global Wallet", icon: Wallet, path: "/student/wallet" },
];

const tourTargetByPath: Record<string, string> = {
  "/student/office": "sidebar-office",
  "/student/portfolio": "sidebar-portfolio",
  "/student/wallet": "sidebar-wallet",
};

const GAMIFICATION_TRACKS = {
  "data-analytics": {
    icon: BarChart3,
    progression: [
      { minWeek: 1, maxWeek: 4, title: "Data Intern" },
      { minWeek: 5, maxWeek: 8, title: "Junior Data Analyst" },
      { minWeek: 9, maxWeek: 12, title: "Data Analyst" },
      { minWeek: 13, maxWeek: 16, title: "Business Intelligence Analyst" },
      { minWeek: 17, maxWeek: 20, title: "Analytics Strategist" },
      { minWeek: 21, maxWeek: 24, title: "Director of Analytics" },
    ]
  },
  "digital-marketing": {
    icon: Megaphone,
    progression: [
      { minWeek: 1, maxWeek: 4, title: "Marketing Intern" },
      { minWeek: 5, maxWeek: 8, title: "Campaign Operator" },
      { minWeek: 9, maxWeek: 12, title: "Digital Marketing Associate" },
      { minWeek: 13, maxWeek: 16, title: "Performance Marketer" },
      { minWeek: 17, maxWeek: 20, title: "Growth Strategist" },
      { minWeek: 21, maxWeek: 24, title: "Marketing Director" },
    ]
  },
  "cyber-security": {
    icon: Shield,
    progression: [
      { minWeek: 1, maxWeek: 4, title: "Security Intern" },
      { minWeek: 5, maxWeek: 8, title: "Security Associate" },
      { minWeek: 9, maxWeek: 12, title: "Security Analyst" },
      { minWeek: 13, maxWeek: 16, title: "Threat Defender" },
      { minWeek: 17, maxWeek: 20, title: "Incident Commander" },
      { minWeek: 21, maxWeek: 24, title: "Chief Security Strategist" },
    ]
  },
};

export const StudentSidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [isOfficeLocked, setIsOfficeLocked] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<"data-analytics" | "digital-marketing" | "cyber-security">("data-analytics");
  const lastFetchedId = useRef<string | null>(null);

  useEffect(() => {
    const handleSidebarOpen = () => setMobileOpen(true);
    const handleSidebarClose = () => setMobileOpen(false);
    window.addEventListener("student-sidebar:open", handleSidebarOpen);
    window.addEventListener("student-sidebar:close", handleSidebarClose);
    return () => {
      window.removeEventListener("student-sidebar:open", handleSidebarOpen);
      window.removeEventListener("student-sidebar:close", handleSidebarClose);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const currentId = user.id;
    if (currentId === lastFetchedId.current) return;

    let isMounted = true;
    lastFetchedId.current = currentId;

    const fetchSidebarData = async () => {
      try {
        console.log("Sidebar: Initiating DB Connection for ID:", currentId);
        
        // Fetch Badges
        const { data: badgeRes } = await supabase
          .from("user_badges")
          .select("badge_name")
          .eq("user_id", currentId);

        if (!isMounted) return;
        if (badgeRes) setEarnedBadges(badgeRes.map(b => b.badge_name));

        // Fetch User Record natively (including tasks_completed directly!)
        const { data: userRes, error: usersError } = await supabase
          .from("users")
          .select("track, subscription_status, subscription_expires_at, tasks_completed, progress_percentage, current_streak")
          .eq("auth_id", currentId)
          .maybeSingle();
        
        if (usersError) {
          console.error("Sidebar: Supabase User Query Error:", usersError.message);
          return;
        }

        console.log("Sidebar: Successfully connected to DB row:", userRes);

        if (userRes) {
          setIsOfficeLocked(false);

          // NATIVE DB ASSIGNMENT
          setCompletedTasksCount(userRes.tasks_completed || 0);

          const rawTrack = (userRes.track || "").trim().toLowerCase();
          console.log("RAW TRACK:", rawTrack);

          if (rawTrack.includes("data") || rawTrack.includes("analytics")) {
            setCurrentTrack("data-analytics");
          } else if (rawTrack.includes("marketing") || rawTrack.includes("digital")) {
            setCurrentTrack("digital-marketing");
          } else if (rawTrack.includes("cyber") || rawTrack.includes("security")) {
            setCurrentTrack("cyber-security");
          } else {
            setCurrentTrack("data-analytics");
          }

          console.log("================================");
console.log("DB TRACK:", userRes.track);
console.log("CURRENT TRACK STATE:", currentTrack);
console.log("================================");
        }
      } catch (err) {
        console.error("Sidebar: Critical failure connecting to DB:", err);
      }
    };

    fetchSidebarData();

    // Listen to users table to dynamically update the tasks_completed and streak in real time
    const userChannel = supabase.channel(`sidebar-user-${currentId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `auth_id=eq.${currentId}` }, fetchSidebarData).subscribe();
    const badgeChannel = supabase.channel(`sidebar-badges-${currentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_badges", filter: `user_id=eq.${currentId}` }, fetchSidebarData).subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(userChannel);
      supabase.removeChannel(badgeChannel);
    };
  }, [user?.id]);

  const currentWeek = Math.min(Math.max(completedTasksCount, 1), 24);
  const currentTrackData = GAMIFICATION_TRACKS[currentTrack] || GAMIFICATION_TRACKS["data-analytics"];
  const progressPercentage = Math.min((currentWeek / 24) * 100, 100);

  const currentIdentity = useMemo(() => {
    return currentTrackData.progression.find(stage => currentWeek >= stage.minWeek && currentWeek <= stage.maxWeek);
  }, [currentTrackData, currentWeek]);

  const CurrentTrackIcon = currentTrackData.icon || Trophy;
  const mappedTrackKeyForModal = currentTrack.replace("-", "_");

  const renderNavContent = () => (
    <>
      <div className="flex items-center gap-2 mb-4 mt-5 ml-5 max-w-3xl">
        <Link href="https://labs.wdc.ng/signup" target="_blank">
          <Image src={wdcNewLogo} alt="WildFusion Digital Centre" width={120} height={40} className="h-8 md:h-10 object-contain contrast-50 brightness-200" priority />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const isItemLocked = item.id === "office" && isOfficeLocked;

          if (isItemLocked) {
            return (
              <div
                key={item.path}
                data-tour={tourTargetByPath[item.path]}
                className="group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-muted-foreground/40 cursor-not-allowed"
              >
                <div className="flex items-center gap-3"><item.icon size={18} className="opacity-40" /><span className="text-sm font-medium">{item.label}</span></div>
                <Lock size={14} className="text-red-500/40" />
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              data-tour={tourTargetByPath[item.path]}
              onClick={() => setMobileOpen(false)}
              className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors", isActive ? "bg-primary/20 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent")}
            >
              <div className="flex items-center gap-3"><item.icon size={18} /><span className="text-sm font-medium">{item.label}</span></div>
              {item.id === "office" && completedTasksCount > 0 && (
                <span className="bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{completedTasksCount}</span>
              )}
            </Link>
          );
        })}
        <Link
          href="/student/earn"
          data-tour="sidebar-earn"
          onClick={() => setMobileOpen(false)}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mt-2", pathname === "/student/earn" ? "bg-green-500/20 text-green-400" : "text-green-400 bg-green-500/20 hover:bg-green-500/10")}
        >
          <DollarSign size={18} /><span className="text-sm font-medium">Earn Money</span>
        </Link>
      </nav>

      <div className="px-3 pb-3">
        <button onClick={() => setShowCareerModal(true)} className="w-full rounded-3xl border border-slate-700/50 bg-gradient-to-br from-[#111827] to-[#0F172A] p-5 text-left hover:border-violet-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-semibold mb-3">Current Rank</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <CurrentTrackIcon size={20} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{currentIdentity?.title}</p>
                  <p className="text-xs text-slate-400 mt-1">Week {currentWeek} of 24</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <Award size={12} className="text-yellow-400" />
                <span className="text-[10px] font-bold text-yellow-300">{earnedBadges.length}</span>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-between mb-2">
              <span className="text-[11px] text-slate-400">Career Progression</span>
              <span className="text-[11px] font-semibold text-white">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-800">
              <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">Open Career Journey</p>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"><Target size={14} className="text-cyan-400" /></div>
          </div>
        </button>
      </div>
      <div className="px-3 pb-4">
        <LogoutButton variant="sidebar" onClick={() => setMobileOpen(false)} />
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground"><Menu size={24} /></button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("lg:hidden fixed top-0 left-0 h-full w-72 bg-background z-50 flex flex-col transform transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-sidebar-foreground"><X size={24} /></button>
        {renderNavContent()}
      </aside>
      <aside className="hidden lg:flex bg-[hsla(222,47%,11%,1)] min-h-screen w-72 flex-col border-r border-sidebar-border sticky top-0 self-start">
        {renderNavContent()}
      </aside>

      <CareerJourneyModal
        open={showCareerModal}
        onClose={() => setShowCareerModal(false)}
        roadmap={currentTrackData.progression.map((stage) => ({ week: stage.minWeek, title: stage.title }))}
        currentWeek={currentWeek}
        currentIdentity={currentIdentity?.title || "Intern"}
        unlockedBadges={earnedBadges.map((badge) => ({ badge_name: badge }))}
        activeTrackKey={mappedTrackKeyForModal}
      />
    </>
  );
};
