import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  Eye,
  Users,
  ChevronDown,
  Download,
  Loader2
} from 'lucide-react';

// Notice we only need useAuth now! Completely bypassing the buggy OfficeContext
import { useAuth } from '../../../contexts/AuthContexts';
import { supabase } from '../../../lib/supabase';

import CareerJourneyModal from '../gamification/CareerJourneyModal';
import { BADGE_CONFIG, rarityStyles } from '../../../config/badges';
import { cn } from '../../../lib/utils';

const TRACK_PROGRESSION = {
  "digital-marketing": [
    { week: 1, title: "Marketing Intern" },
    { week: 5, title: "Campaign Operator" },
    { week: 9, title: "Digital Marketing Associate" },
    { week: 13, title: "Performance Marketer" },
    { week: 17, title: "Growth Strategist" },
    { week: 21, title: "Marketing Director" },
  ],

  "data-analytics": [
    { week: 1, title: "Data Intern" },
    { week: 5, title: "Junior Data Analyst" },
    { week: 9, title: "Data Analyst" },
    { week: 13, title: "Business Intelligence Analyst" },
    { week: 17, title: "Analytics Strategist" },
    { week: 21, title: "Director of Analytics" },
  ],

  "cyber-security": [
    { week: 1, title: "Security Intern" },
    { week: 5, title: "Security Associate" },
    { week: 9, title: "Security Analyst" },
    { week: 13, title: "Threat Defender" },
    { week: 17, title: "Incident Commander" },
    { week: 21, title: "Chief Security Strategist" },
  ],
};

export function GamificationTracker() {
  const { user } = useAuth();
  
  // Decoupled NATIVE STATE
  const [dbTrack, setDbTrack] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [tasksCompleted, setTasksCompleted] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(1);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);
  
  const [isLoadingTrack, setIsLoadingTrack] = useState(true);
  const [showCareerModal, setShowCareerModal] = useState(false);

  // =========================================
  // NATIVE DB CONNECTION (BYPASSES CONTEXT)
  // =========================================
  useEffect(() => {
    if (!user?.id) return;

    const fetchGamificationData = async () => {
      try {
        console.log("Tracker: Initiating DB Connection for ID:", user.id);
        
        // 1. Fetch User Record (Now grabs tasks_completed and streak natively)
        const { data: userRecord, error: userError } = await supabase
          .from("users")
          .select("track, tasks_completed, current_streak")
          .eq("auth_id", user.id)
          .single();

        if (userError) console.error("Tracker: Supabase User Error:", userError.message);

        // 2. Fetch Badges directly
        const { data: badgeData } = await supabase
          .from("user_badges")
          .select("badge_name")
          .eq("user_id", user.id);

        if (userRecord) {
          setDbTrack(userRecord.track);
          
          // SET WEEK VIA DB TASKS_COMPLETED (No more row counting)
          const tasksDone = userRecord.tasks_completed || 0;
          setTasksCompleted(tasksDone);
          
          const week = Math.min(Math.max(tasksDone, 1), 24);
          setCurrentWeek(week);
          
          setCurrentStreak(userRecord.current_streak || week);
        }

        if (badgeData) {
          setUnlockedBadges(badgeData.map(b => ({ badge_name: b.badge_name })));
        }

      } catch (err) {
        console.error("Tracker: Critical failure connecting to DB:", err);
      } finally {
        setIsLoadingTrack(false);
      }
    };

    fetchGamificationData();
  }, [user?.id]);

  const trackKey =
  (dbTrack?.trim().toLowerCase() ||
    "data-analytics") as keyof typeof TRACK_PROGRESSION;

const roadmap =
  TRACK_PROGRESSION[trackKey] ||
  TRACK_PROGRESSION["data-analytics"];

console.log("TRACK FROM DB:", dbTrack);
console.log("TRACK KEY:", trackKey);

  const trackKey = getSafeTrackKey(dbTrack);
  const roadmap = TRACK_PROGRESSION[trackKey as keyof typeof TRACK_PROGRESSION] || TRACK_PROGRESSION.data_analytics;
  
  // DYNAMICALLY CALCULATE IDENTITY BASED ON TRACK & WEEK
  const currentIdentity = [...roadmap].reverse().find(stage => currentWeek >= stage.week)?.title || "Intern";

  const totalWeeks = 24;
  const progressPercent = Math.min((currentWeek / totalWeeks) * 100, 100);
  const isStandardUnlocked = currentWeek >= 12;
  const isVisaUnlocked = currentWeek >= 24;

  if (isLoadingTrack) {
    return (
      <div className="w-full flex items-center justify-center p-12 border border-slate-800 rounded-2xl bg-[#121622]/50">
        <Loader2 className="animate-spin text-violet-500 mb-4" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 mb-8">
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="bg-[#1A1F2E] border border-slate-800 rounded-xl px-5 py-3 flex items-center gap-3 shrink-0">
          <FileText className="text-slate-400" size={18} />
          <span className="text-sm font-medium text-slate-300">
            Task completed:
            <strong className="text-white ml-1">
              {tasksCompleted}
            </strong>
          </span>
        </div>

        <div className="bg-[#112A26] border border-[#1A403A] rounded-xl px-5 py-3 flex items-center gap-3 shrink-0">
          <Clock className="text-emerald-400" size={18} />
          <span className="text-sm font-medium text-emerald-100">
            Streak:
            <strong className="text-emerald-400 ml-1">Week {currentStreak}</strong>
          </span>
        </div>

        <div className="bg-[#2A1B30] border border-[#3D2545] rounded-xl px-5 py-3 flex items-center gap-3 shrink-0">
          <Eye className="text-purple-400" size={18} />
          <span className="text-sm font-medium text-purple-100">3 Recruiters viewing</span>
        </div>

        <div className="bg-[#1F1B38] border border-[#2D2654] rounded-xl px-5 py-3 flex items-center gap-3 shrink-0">
          <Users className="text-indigo-400" size={18} />
          <span className="text-sm font-medium text-indigo-100">
            Profile Stats:
            <strong className="text-white ml-1">32 Views</strong>
          </span>
        </div>
      </div>

      {unlockedBadges.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {unlockedBadges.map((badge: any, i: number) => {
            const badgeName = badge.badge_name || badge.name;
            const config = BADGE_CONFIG[badgeName];

            if (!config) return null;
            const Icon = config.icon;

            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03 }}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  rarityStyles[config.rarity]
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{badgeName}</p>
                    <p className="text-xs text-slate-400 capitalize mt-1">
                      {config.rarity}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="bg-[#121622] border border-slate-800/80 rounded-2xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="text-purple-400" size={20} />
              Work and Visa Reference Letters
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Maintain your 12-weeks active streak to unlock verified immigration references.
            </p>
          </div>

          <button
            onClick={() => setShowCareerModal(true)}
            className="flex items-center gap-2 bg-[#1A1F2E] border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Current Rank
              </p>
              <p className="text-sm font-bold text-white">{currentIdentity}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="relative h-2 w-full bg-slate-800 rounded-full mb-2">
          <div
            className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-[#121622]",
              currentWeek >= 12 ? "bg-purple-400" : "bg-slate-600"
            )}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-400 font-medium mb-8">
          <span>1/24 Weeks</span>
          <span className="flex items-center gap-1">
            <span className="text-red-400">🎯</span> 12 Weeks
          </span>
          <span>24 Weeks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1A1F2E] border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="text-slate-400" size={24} />
              <div>
                <h3 className="font-bold text-white text-sm">WORK LETTER OF REFERENCE</h3>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    isStandardUnlocked ? "text-emerald-400" : "text-amber-500"
                  )}
                >
                  {isStandardUnlocked ? "Available for download" : `Available in ${12 - currentWeek} weeks`}
                </p>
              </div>
            </div>
            <button
              disabled={!isStandardUnlocked}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                isStandardUnlocked ? "bg-teal-600 hover:bg-teal-500 text-white" : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              <Download size={16} /> Download
            </button>
          </div>

          <div className="bg-[#1A1F2E] border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="text-slate-400" size={24} />
              <div>
                <h3 className="font-bold text-white text-sm">VISA LETTER OF REFERENCE</h3>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    isVisaUnlocked ? "text-emerald-400" : "text-amber-500"
                  )}
                >
                  {isVisaUnlocked ? "Available for download" : `Available in ${24 - currentWeek} weeks`}
                </p>
              </div>
            </div>
            <button
              disabled={!isVisaUnlocked}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                isVisaUnlocked ? "bg-teal-600 hover:bg-teal-500 text-white" : "bg-slate-800 text-slate-500 cursor-not-allowed"
              )}
            >
              <Download size={16} /> Download
            </button>
          </div>
        </div>
      </div>

      <CareerJourneyModal
  open={showCareerModal}
  onClose={() => setShowCareerModal(false)}
  roadmap={roadmap}
  currentWeek={currentWeek}
  currentIdentity={currentIdentity}
  unlockedBadges={unlockedBadges}
  activeTrackKey={trackKey.replace(/-/g, "_")}
/>
    </div>
  );
}