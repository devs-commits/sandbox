"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Lock, X, Sparkles, Trophy, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_CONFIG, rarityStyles } from "@/config/badges";

const TRACK_BADGES = {
  cyber_security: [
    "Linux Operator", "Network Defender", "Threat Hunter", "Encryption Specialist", 
    "Incident Responder", "Vulnerability Analyst", "SOC Operator", "Compliance Guardian", 
    "Crisis Commander", "Cyber Defense Certified"
  ],
  data_analytics: [
    "Spreadsheet Survivor", "Formula Operator", "SQL Investigator", "Dashboard Specialist", 
    "Insight Hunter", "Data Storyteller", "Automation Specialist", "Predictive Analyst", 
    "Crisis Analyst", "Executive Analyst"
  ],
  digital_marketing: [
    "Audience Analyst", "Content Operator", "SEO Explorer", "Paid Media Operator", 
    "Funnel Builder", "Optimization Expert", "Analytics Specialist", "Growth Strategist", 
    "Crisis Manager", "Boardroom Certified"
  ]
};

interface Props {
  open: boolean;
  onClose: () => void;
  roadmap: any[];
  currentWeek: number;
  currentIdentity: string;
  unlockedBadges: any[];
  activeTrackKey: string;
}

export default function CareerJourneyModal({
  open,
  onClose,
  roadmap,
  currentWeek,
  currentIdentity,
  unlockedBadges,
  activeTrackKey,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const isStandardUnlocked = currentWeek >= 12;
  const isVisaUnlocked = currentWeek >= 24;

  const safeTrackKey = (activeTrackKey as keyof typeof TRACK_BADGES) || "cyber_security";
  const trackBadges = TRACK_BADGES[safeTrackKey] || TRACK_BADGES.cyber_security;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6"
          style={{ isolation: 'isolate' }}
        >
          <div onClick={onClose} className="absolute inset-0 bg-[#020617]/95 backdrop-blur-2xl transition-all" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-[1000000] w-full max-w-6xl max-h-[90vh] flex flex-col rounded-[2rem] border border-slate-700/60 bg-[#0B1120] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* HEADER */}
            <div className="shrink-0 z-20 border-b border-slate-800/80 bg-[#0B1120] px-6 py-5 sm:px-8 sm:py-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={14} className="text-violet-400" />
                  <p className="text-[10px] uppercase tracking-[0.25em] text-violet-400 font-bold">WDC Labs Progression</p>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Career Journey</h2>
                <p className="text-slate-400 mt-1 text-sm">Track your growth, promotions, badges, and milestone unlocks.</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-colors flex items-center justify-center group cursor-pointer">
                <X size={18} className="text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* LEFT SIDE */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                  <div className="p-6 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-cyan-900/10 shadow-[inset_0_0_20px_rgba(139,92,246,0.05)] relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-3 relative z-10">Current Position</p>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{currentIdentity}</h3>
                        <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/50 shadow-inner">
                          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                          <span className="text-xs text-slate-300 font-medium">Week {currentWeek} of 24</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-6">Career Progression</h3>
                    <div className="relative pl-3">
                      <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-slate-800 rounded-full" />
                      <div className="space-y-8 relative">
                        {roadmap.map((stage, i) => {
                          const isPassed = currentWeek >= stage.week;
                          const isCurrent = currentIdentity === stage.title;
                          return (
                            <div key={i} className="relative flex gap-5 group">
                              <div className="relative z-10 flex flex-col items-center justify-start mt-1">
                                <div className={cn("w-3 h-3 rounded-full border-2 transition-all duration-300", isCurrent ? "w-4 h-4 -ml-0.5 bg-violet-500 border-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.6)]" : isPassed ? "bg-violet-500 border-violet-500" : "bg-slate-900 border-slate-700")} />
                              </div>
                              <div className="flex-1 -mt-1">
                                <p className={cn("font-bold text-base transition-colors duration-300", isCurrent ? "text-violet-400 text-lg" : isPassed ? "text-white" : "text-slate-500")}>{stage.title}</p>
                                <p className={cn("text-xs mt-1 transition-colors", isCurrent ? "text-violet-300/70" : "text-slate-600")}>Unlocks Week {stage.week}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="lg:col-span-7 flex flex-col gap-10">
                  <div>
                    <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold flex items-center gap-2"><Trophy size={14} className="text-slate-400" /> Badge Collection</h3>
                      <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300 font-medium">{unlockedBadges.length} / 10 Unlocked</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {trackBadges.map((badgeName, i) => {
                        const isUnlocked = unlockedBadges.some((b: any) => (b.badge_name || b.name) === badgeName);
                        const config = BADGE_CONFIG?.[badgeName];
                        const Icon = config?.icon || Award; 
                        const rarity = config?.rarity || "Standard";
                        const description = config?.description || "Complete challenges to unlock";
                        const stateClass = isUnlocked ? (config?.rarity && rarityStyles ? rarityStyles[config.rarity] : "border-slate-700 bg-slate-800/50") : "border-slate-800 bg-slate-900/40 opacity-60 grayscale";

                        return (
                          <motion.div key={i} whileHover={{ scale: 1.02, y: -2 }} className={cn("rounded-2xl border p-4 flex flex-col gap-4 transition-all h-full relative overflow-hidden", stateClass)}>
                            {!isUnlocked && <div className="absolute top-4 right-4 text-slate-500"><Lock size={14} /></div>}
                            <div className="flex items-start gap-3">
                              <div className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border shadow-inner", isUnlocked ? "bg-black/20 border-white/5" : "bg-black/40 border-slate-700/50")}>
                                <Icon size={20} className={isUnlocked ? "text-white/90" : "text-slate-500"} />
                              </div>
                              <div className="flex-1 pr-4">
                                <p className={cn("font-bold text-sm leading-tight line-clamp-2", isUnlocked ? "text-white" : "text-slate-400")}>{badgeName}</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mt-1">{rarity}</p>
                              </div>
                            </div>
                            <div className="mt-auto pt-3 border-t border-slate-700/50">
                              <p className="text-xs text-slate-400/80 leading-relaxed">{isUnlocked ? "Unlocked! Great job." : description}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-5 border-b border-slate-800 pb-3 flex items-center gap-2"><FileText size={14} className="text-slate-400" /> Major Milestones</h3>
                    <div className="space-y-4">
                      {/* WEEK 12 */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-5 flex sm:flex-row flex-col sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 shrink-0 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <FileText size={24} className="text-violet-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm sm:text-base">Work Reference Letter</p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">{!isStandardUnlocked && <Lock size={10} />} {isStandardUnlocked ? "Unlocked at Week 12" : "Unlocks Week 12"}</p>
                          </div>
                        </div>
                        {isStandardUnlocked ? (
                          <button className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 transition-colors text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20 cursor-pointer"><Download size={16} /> Download</button>
                        ) : (
                          <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 cursor-not-allowed"><Lock size={14} className="text-slate-500" /><span className="text-xs font-semibold text-slate-500">Locked</span></div>
                        )}
                      </div>

                      {/* WEEK 24 */}
                      <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-5 flex sm:flex-row flex-col sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Award size={24} className="text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm sm:text-base">Visa Recommendation Letter</p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">{!isVisaUnlocked && <Lock size={10} />} {isVisaUnlocked ? "Unlocked at Week 24" : "Unlocks Week 24"}</p>
                          </div>
                        </div>
                        {isVisaUnlocked ? (
                          <button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 transition-colors text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer"><Download size={16} /> Download</button>
                        ) : (
                          <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 cursor-not-allowed"><Lock size={14} className="text-slate-500" /><span className="text-xs font-semibold text-slate-500">Locked</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}