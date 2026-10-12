"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, CheckCircle, Loader2, Coffee, 
  ChevronDown, ChevronRight, Flag, Lock, Circle,
  Menu, ChevronLeft, HardDriveDownload, XCircle, AlertCircle,
  Bold, Italic, List, ListOrdered, Link2
} from 'lucide-react';
import { Open_Sans } from 'next/font/google';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { useOffice } from '../../../contexts/OfficeContext';
import { useAuth } from '../../../contexts/AuthContexts';
import { Task } from './types';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { ReportIssueModal } from './ReportIssueModal'; 
import { supabase } from "../../../../lib/supabase";

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

const formatTrackName = (track: string | undefined): string => {
  if (!track) return 'General';
  return track.replace(/[-_]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

const getYouTubeEmbedUrl = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const getCleanDescription = (task: Task) => {
  const formattedDate = new Date(task.created_at || Date.now()).toLocaleDateString('en-GB', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  
  const rawContent = (task as any).brief_content || task.description || '';

  return rawContent
    .split('[Current Date]').join(formattedDate)
    .split('[current date]').join(formattedDate)
    .split('[Insert Current Date]').join(formattedDate)
    .split('[Insert Date]').join(formattedDate)
    .split('[Date]').join(formattedDate)
    .split('[date]').join(formattedDate);
};

// --- 🔥 FIXED Color Logic for Grading ---
const getScoreColor = (score?: number, status?: string) => {
  if (status === 'needs_revision') return 'text-red-500';
  if (status === 'approved' || status === 'passed') return 'text-emerald-500'; // Force green for passed
  if (score !== undefined && score < 50) return 'text-red-500';
  if (score !== undefined && score >= 80) return 'text-emerald-500';
  if (score !== undefined && score >= 50) return 'text-amber-500';
  return 'text-emerald-500'; 
};

const getScoreBg = (score?: number, status?: string) => {
  if (status === 'needs_revision') return 'bg-red-500/10 border-red-500/20';
  if (status === 'approved' || status === 'passed') return 'bg-emerald-500/10 border-emerald-500/20'; // Force green for passed
  if (score !== undefined && score < 50) return 'bg-red-500/10 border-red-500/20';
  if (score !== undefined && score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score !== undefined && score >= 50) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-emerald-500/10 border-emerald-500/20';
};

export function TaskDashboard() {
  const { user } = useAuth();
  const { 
    tasks = [], currentTask, setCurrentTask, 
    isLoadingTasks, isGeneratingTask, generationStatusText,
    trackName, submitWork, subscription 
  } = useOffice();

  const isPaidActive = subscription?.status === 'active';

  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [reportIssueTask, setReportIssueTask] = useState<Task | null>(null); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const groupedTasks = tasks.reduce((acc, task) => {
    if (task.difficulty === 'Bounty') return acc;
    const weekNum = (task as any).week || (task as any).task_number || 1;
    if (!acc[weekNum]) acc[weekNum] = [];
    acc[weekNum].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  const sortedWeeks = Object.keys(groupedTasks).map(Number).sort((a, b) => a - b);

  useEffect(() => {
    if (tasks.length > 0 && !activeTask && sortedWeeks.length > 0) {
      const firstWeekTasks = groupedTasks[sortedWeeks[0]];
      setActiveWeek(sortedWeeks[0]);
      setActiveTask(firstWeekTasks[0]);
    }
  }, [tasks, activeTask, sortedWeeks, groupedTasks]);

  useEffect(() => {
    if (activeTask && tasks.length > 0) {
      const updatedMatch = tasks.find(t => t.id === activeTask.id);
      if (updatedMatch && (updatedMatch.status !== activeTask.status || (updatedMatch as any).score !== (activeTask as any).score)) {
        setActiveTask(updatedMatch);
      }
    }
  }, [tasks, activeTask]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSubmissionFile(e.target.files[0]);
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = submissionNotes.substring(start, end);
    const beforeText = submissionNotes.substring(0, start);
    const afterText = submissionNotes.substring(end);
    
    const newText = beforeText + prefix + selectedText + suffix + afterText;
    setSubmissionNotes(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const downloadMockFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const goToNextTask = () => {
    const currentWeekTasks = groupedTasks[activeWeek || 1];
    const currentIndex = currentWeekTasks.findIndex(t => t.id === activeTask?.id);
    if (currentIndex !== -1 && currentIndex + 1 < currentWeekTasks.length) {
      setActiveTask(currentWeekTasks[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTaskSubmit = async () => {
    if (!submissionFile && !submissionNotes.trim()) {
      toast.error("Please provide a file or type your submission before submitting.");
      return;
    }
    if (!activeTask) return;
    
    setIsSubmitting(true);
    
    try {
      await submitWork(activeTask.id, submissionFile as any, submissionNotes);      
      
      setSubmissionFile(null);
      setSubmissionNotes('');
      toast.success("Submission successfully graded!");

    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("Submission failed. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTasks || isGeneratingTask) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0A0D14] overflow-hidden relative animate-in fade-in duration-500">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
        <h3 className="text-xl font-bold text-foreground animate-pulse text-center px-4">
          {generationStatusText || "Loading learning pathway..."}
        </h3>
        <p className="text-sm text-muted-foreground mt-3 max-w-md text-center px-4">
          Please wait while your Lead Technical Supervisor prepares your workspace.
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0A0D14] overflow-hidden relative">
         <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 border border-border/50">
          <Coffee className="text-muted-foreground" size={36} />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Workspace Empty</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-8 text-center">
          Hang tight. Your supervisor is preparing your learning pathway. 
        </p>
      </div>
    );
  }

  const isRealityTask = activeTask?.title?.toLowerCase().includes('reality task') || activeTask?.difficulty === 'Advanced'; 
  const isCompleted = activeTask?.status === 'approved' || (activeTask?.status as string) === 'passed';
  const isFailed = activeTask?.status === 'needs_revision';
  const isSubmitted = isSubmitting || activeTask?.status === 'submitted' || activeTask?.status === 'under_review';

  const taskScore = (activeTask as any)?.score;
  const taskFeedback = (activeTask as any)?.feedback;

  let sharedDriveFiles: any[] = [];
  try {
    if (typeof activeTask?.attachments === 'string') {
      sharedDriveFiles = JSON.parse(activeTask.attachments);
    } else if (Array.isArray(activeTask?.attachments)) {
      sharedDriveFiles = activeTask.attachments;
    }
  } catch (e) {
    console.error("Failed to parse attachments", e);
  }

  return (
    <div className={`relative w-full h-full flex-1 overflow-hidden min-h-0 bg-[#0A0D14] ${openSans.className}`}>
      <div className="absolute inset-0 flex flex-row overflow-hidden">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className={`bg-[#0F131D] border-r border-border/40 flex flex-col h-full shrink-0 z-10 shadow-lg transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-[280px]' : 'w-[72px]'}`}>
          
          <div className={`p-4 border-b border-border/40 shrink-0 bg-[#0F131D] z-20 flex items-center h-[72px] ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <h2 className="text-base font-black text-foreground truncate">Learning Pathway</h2>
                <span className="text-[10px] font-bold text-primary block uppercase tracking-wider truncate">{formatTrackName(trackName)}</span>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className={`p-1.5 hover:bg-secondary/50 rounded-lg text-muted-foreground transition-colors shrink-0 ${!isSidebarOpen && 'border border-primary text-primary bg-primary/10'}`}
            >
              {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-2 overflow-y-auto custom-scrollbar">
            {sortedWeeks.map((weekNum) => {
              const weekTasks = groupedTasks[weekNum];
              const isWeekLocked = !isPaidActive && weekNum > 1; 
              const isWeekActive = activeWeek === weekNum;
              const isWeekCompleted = weekTasks.every(t => t.status === 'approved' || t.status === 'passed');

              return (
                <div key={weekNum} className="flex flex-col">
                  {/* WEEK HEADER */}
                  <div 
                    className={`flex flex-col justify-center cursor-pointer rounded-xl transition-all ${isSidebarOpen ? 'px-3 py-2.5 hover:bg-white/5' : 'py-3 items-center hover:bg-white/5'} ${isWeekActive && isSidebarOpen ? 'bg-white/5 shadow-sm' : ''} ${isWeekLocked ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (isWeekLocked) {
                        toast.error("Your free week is complete. Please subscribe in Headquarters to unlock Week 2 and beyond.");
                        return;
                      }
                      setActiveWeek(isWeekActive ? null : weekNum);
                      if (!isSidebarOpen) setIsSidebarOpen(true);
                    }}
                  >
                    {isSidebarOpen ? (
                      <>
                        <div className="flex items-center w-full justify-between mb-1.5">
                          <h3 className={`font-bold text-sm flex items-center gap-2 ${isWeekCompleted ? 'text-emerald-500' : 'text-foreground'}`}>
                            Week {weekNum}
                            {isWeekCompleted && <CheckCircle size={14} />}
                          </h3>
                          {isWeekLocked ? <Lock size={14} className="text-red-400/80" /> : <ChevronDown size={14} className={`text-muted-foreground/50 transition-transform ${isWeekActive ? 'rotate-180' : ''}`} />}
                        </div>

                        {/* Top horizontal progress ticks */}
                        <div className="flex items-center gap-1 w-full max-w-[120px]">
                          {weekTasks.slice(0, 5).map((task, i) => {
                            const isTaskDone = task.status === 'approved' || task.status === 'passed';
                            const isCurrent = activeTask?.id === task.id;
                            const isTaskFailed = task.status === 'needs_revision';
                            return <div key={i} className={`h-1 flex-1 rounded-full ${isTaskDone ? 'bg-emerald-500/80' : isTaskFailed ? 'bg-red-500/80' : isCurrent ? 'bg-primary' : 'bg-white/10'}`} />;
                          })}
                          {weekTasks.length >= 6 && (
                            <div className={`h-1 w-3 rounded-full ml-1 ${(weekTasks[weekTasks.length - 1].status === 'approved' || weekTasks[weekTasks.length - 1].status === 'passed') ? 'bg-amber-500/80' : (activeTask?.id === weekTasks[weekTasks.length - 1].id) ? 'bg-amber-500' : 'bg-white/10'}`} />
                          )}
                        </div>
                      </>
                    ) : (
                      // COLLAPSED VIEW: VERTICAL STACKED ICONS
                      <div className="flex flex-col items-center gap-2">
                        <span className={`text-[11px] font-black tracking-widest ${isWeekCompleted ? 'text-emerald-500' : 'text-foreground'}`}>W{weekNum}</span>
                        {isWeekActive && !isWeekLocked && (
                          <div className="flex flex-col gap-2 mt-1">
                            {weekTasks.slice(0, 6).map((task, i) => {
                              const isTaskDone = task.status === 'approved' || task.status === 'passed';
                              const isTaskFailed = task.status === 'needs_revision';
                              const isCurrent = activeTask?.id === task.id;
                              const isReality = task.title.toLowerCase().includes('reality task') || i >= 5;
                              const isTaskLocked = i > 0 && !(weekTasks[i - 1].status === 'approved' || weekTasks[i - 1].status === 'passed');
                              const miniScoreColor = getScoreColor((task as any).score, task.status);
                              
                              if (isTaskDone) return <CheckCircle key={i} size={14} className={`${miniScoreColor} shrink-0`} />;
                              if (isTaskFailed) return <XCircle key={i} size={14} className="text-red-500 shrink-0" />;
                              if (isTaskLocked) return <Lock key={i} size={12} className="text-muted-foreground/40 shrink-0" />;
                              return <Circle key={i} size={14} className={`shrink-0 ${isCurrent ? (isReality ? 'text-amber-500 fill-amber-500/20' : 'text-primary fill-primary/20') : 'text-muted-foreground/50'}`} />;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* EXPANDED VIEW: TIMELINE STEPPER UI */}
                  <AnimatePresence>
                    {isWeekActive && !isWeekLocked && isSidebarOpen && (
                      <motion.ul 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="relative mt-3 ml-5 space-y-1"
                      >
                        <div className="absolute left-[6px] top-3 bottom-5 w-px bg-white/10 z-0" />

                        {weekTasks.map((task, tIndex) => {
                          const isSelected = activeTask?.id === task.id;
                          const taskCompleted = task.status === 'approved' || (task.status as string) === 'passed';
                          const taskFailed = task.status === 'needs_revision';
                          const isTaskLocked = tIndex > 0 && !(weekTasks[tIndex - 1].status === 'approved' || weekTasks[tIndex - 1].status === 'passed');
                          const isReality = task.title.toLowerCase().includes('reality task') || tIndex >= 5;
                          const scoreColor = getScoreColor((task as any).score, task.status);

                          return (
                            <li key={task.id} className="relative z-10 w-full">
                              <button
                                onClick={() => !isTaskLocked && setActiveTask(task)}
                                disabled={isTaskLocked}
                                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-all
                                  ${isSelected ? (isReality ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary') : 'hover:bg-white/5 text-muted-foreground'}
                                  ${isTaskLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                              >
                                <div className="bg-[#0F131D] p-0.5 rounded-full z-10 shrink-0 -ml-[7px]">
                                  {taskCompleted ? (
                                    <CheckCircle size={14} className={`${scoreColor} shrink-0`} />
                                  ) : taskFailed ? (
                                    <XCircle size={14} className="text-red-500 shrink-0" />
                                  ) : isTaskLocked ? (
                                    <Lock size={12} className="text-muted-foreground shrink-0 m-[1px]" />
                                  ) : (
                                    <Circle size={14} className={`shrink-0 ${isSelected ? (isReality ? 'text-amber-500 fill-amber-500/20' : 'text-primary fill-primary/20') : 'text-muted-foreground/50'}`} />
                                  )}
                                </div>
                                
                                <span className="truncate flex-1">
                                  {isReality ? 'Reality Task' : `Day ${tIndex + 1}`}
                                </span>
                                
                                {/* 🔥 NEW: Show actual score in the sidebar tags! */}
                                {taskCompleted && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-background/50 uppercase tracking-widest ${(task as any).score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {(task as any).score !== undefined ? `${(task as any).score}%` : 'PASS'}
                                  </span>
                                )}
                                {taskFailed && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 uppercase tracking-widest">
                                    FAIL
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ================= RIGHT MAIN PANE ================= */}
        <main className="flex-1 h-full overflow-y-auto relative bg-[#0A0D14] custom-scrollbar">
          {activeTask && (
            <div className="max-w-4xl mx-auto py-8 px-6 md:px-10 pb-32">
              
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider ${isRealityTask ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                    {(activeTask as any).week ? `Week ${(activeTask as any).week}` : 'Task'} - {isRealityTask ? 'Reality Task' : 'Daily Module'}
                  </span>
                  
                  {/* 🔥 NEW: Show exact score next to the header badge */}
                  {isCompleted && (
                    <span className={`text-[10px] font-black ${getScoreBg(taskScore, activeTask.status)} ${getScoreColor(taskScore, activeTask.status)} px-3 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider`}>
                      <CheckCircle size={12} /> Passed {taskScore !== undefined ? `• ${taskScore}%` : ''}
                    </span>
                  )}
                  {isFailed && (
                    <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-3 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider">
                      <AlertCircle size={12} /> Revisions Needed
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4 leading-tight">{activeTask.title}</h1>
                
                <div className="flex gap-4 mb-6">
                  <button onClick={() => setReportIssueTask(activeTask)} className="text-xs font-semibold text-muted-foreground hover:text-red-400 flex items-center gap-1.5 transition-colors bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
                    <Flag size={12} /> Report Issue
                  </button>
                </div>
              </div>

              {/* 🔥 MOVED GRADING FEEDBACK PANEL TO THE TOP 🔥 */}
              {(isCompleted || isFailed) && taskFeedback && (
                <div className={`mb-10 p-6 rounded-2xl border shadow-lg ${getScoreBg(taskScore, activeTask.status)}`}>
                   <div className="flex items-start justify-between mb-4">
                     <h4 className={`font-black flex items-center gap-2 text-lg ${getScoreColor(taskScore, activeTask.status)}`}>
                       {isCompleted ? <CheckCircle size={22}/> : <AlertCircle size={22} />}
                       {isCompleted ? 'Task Approved' : 'Revisions Needed'}
                     </h4>
                     {taskScore !== undefined && (
                       <span className={`text-sm font-black px-3 py-1.5 rounded-md bg-background/60 shadow-sm ${getScoreColor(taskScore, activeTask.status)}`}>
                         Score: {taskScore}%
                       </span>
                     )}
                   </div>
                   <div className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap prose prose-invert max-w-none">
                     <ReactMarkdown>{taskFeedback}</ReactMarkdown>
                   </div>
                   
                   {activeTask.file_url && (
                      <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="text-muted-foreground" size={20} />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Your Submitted Artifact</p>
                            <a href={activeTask.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline">View File / Document</a>
                          </div>
                        </div>
                      </div>
                   )}
                   
                   {isCompleted && (
                     <Button onClick={goToNextTask} className="mt-6 w-full sm:w-auto font-bold gap-2 bg-background hover:bg-white/10 text-foreground border border-white/20">
                       Go to Next Task <ChevronRight size={16} />
                     </Button>
                   )}
                </div>
              )}

              {/* INSTRUCTION BRIEF */}
              <div className="prose prose-invert max-w-none text-slate-300 mb-10 bg-white/5 p-6 md:p-8 rounded-2xl border border-white/10 shadow-inner">
                <ReactMarkdown>{getCleanDescription(activeTask)}</ReactMarkdown>
              </div>

              {/* SHARED DRIVE */}
              {sharedDriveFiles.length > 0 && (
                <div className="mb-10 space-y-4">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-white/10 pb-2 flex items-center gap-2">
                    <HardDriveDownload size={18} className="text-blue-400"/> Shared Drive (Task Assets)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sharedDriveFiles.map((file: any, idx: number) => (
                      <div key={idx} className="bg-[#121826] border border-white/10 p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="text-blue-400 shrink-0" size={24}/>
                          <span className="text-sm font-bold text-foreground truncate">{file.filename || `Dataset_${idx+1}.csv`}</span>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="shrink-0 h-8 px-3 text-xs font-bold"
                          onClick={() => downloadMockFile(file.filename || `document_${idx+1}.txt`, file.content || "Empty content")}
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WEB LEARNING RESOURCES */}
              {activeTask.resources && activeTask.resources.length > 0 && (
                <div className="mb-10 space-y-5">
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-white/10 pb-2">Learning Materials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTask.resources.map((res, idx) => {
                      const embedUrl = getYouTubeEmbedUrl(res.url);
                      if (embedUrl) {
                        return (
                          <div key={idx} className="rounded-xl overflow-hidden border border-white/10 bg-white/5 flex flex-col group shadow-md">
                            <iframe className="w-full aspect-video border-b border-white/10" src={embedUrl} title={res.title} allowFullScreen />
                            <div className="p-3 flex-1">
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{res.title}</p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/40 transition-all group shadow-sm">
                          <div className="bg-background p-2 rounded-lg shadow-sm group-hover:text-primary shrink-0"><FileText size={18} /></div>
                          <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">{res.title}</p>
                            {res.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{res.description}</p>}
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* UPLOAD & TEXT EDITOR FORM (Only shows if they haven't passed) */}
              <div className="border-t border-white/10 pt-8 mt-8 space-y-6">
                {(!isCompleted && !isSubmitted) && (
                  <div className={`bg-[#0F131D] border p-6 md:p-8 rounded-2xl shadow-xl ${isRealityTask ? 'border-amber-500/30 shadow-amber-500/5' : 'border-primary/30 shadow-primary/5'}`}>
                    <h3 className="text-lg font-black mb-1 text-foreground flex items-center gap-2">
                      <Upload className={isRealityTask ? "text-amber-500" : "text-primary"} size={20}/> 
                      {isFailed ? 'Submit Revision' : (isRealityTask ? 'Submit Reality Task' : 'Submit Daily Deliverable')}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6 font-medium">
                      {isFailed ? "Provide your corrected work below for re-evaluation." : "Submit your completed work below to proceed."}
                    </p>
                    
                    <div className="space-y-8">
                      {/* OPTION 1 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-foreground">Option 1: Upload a File</p>
                          {submissionFile && (
                            <button onClick={() => setSubmissionFile(null)} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10">Clear File</button>
                          )}
                        </div>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${submissionFile ? 'border-primary bg-primary/5' : 'border-white/20 hover:border-primary/50 hover:bg-white/5'}`}
                        >
                          {submissionFile ? (
                            <div className="flex flex-col items-center gap-2">
                              <FileText className="text-primary" size={28} />
                              <span className="text-sm text-foreground font-bold">{submissionFile.name}</span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Click to change file</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto text-muted-foreground mb-3" size={24} />
                              <p className="text-sm font-bold text-foreground">Click to upload your file</p>
                              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, CSV, Excel or ZIP</p>
                            </>
                          )}
                          <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                        </div>
                      </div>

                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">OR</span>
                        <div className="flex-grow border-t border-white/10"></div>
                      </div>

                      {/* OPTION 2: RICH TEXT EDITOR */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                           <p className="text-sm font-bold text-foreground">Option 2: Direct Text Submission</p>
                           {submissionNotes && (
                             <button onClick={() => setSubmissionNotes('')} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10">Clear Text</button>
                           )}
                        </div>
                        <div className="border border-white/20 rounded-xl overflow-hidden bg-background focus-within:border-primary/50 transition-colors">
                          <div className="bg-[#1A2235] border-b border-white/10 p-2 flex items-center gap-1">
                            <button onClick={() => insertFormatting('**', '**')} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors" title="Bold"><Bold size={16}/></button>
                            <button onClick={() => insertFormatting('*', '*')} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors" title="Italic"><Italic size={16}/></button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <button onClick={() => insertFormatting('\n- ')} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors" title="Bullet List"><List size={16}/></button>
                            <button onClick={() => insertFormatting('\n1. ')} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors" title="Numbered List"><ListOrdered size={16}/></button>
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <button onClick={() => insertFormatting('[Link Text](https://', ')')} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded transition-colors" title="Insert Link"><Link2 size={16}/></button>
                          </div>
                          <Textarea
                            ref={textareaRef}
                            placeholder="Type or paste your complete task submission here..."
                            value={submissionNotes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubmissionNotes(e.target.value)}
                            className="min-h-[200px] border-none focus-visible:ring-0 rounded-none bg-transparent resize-y"
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={handleTaskSubmit} 
                        disabled={(!submissionFile && !submissionNotes.trim()) || isSubmitting} 
                        className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-3">
                            <Loader2 className="animate-spin" size={20} /> 
                            <span>Submitting for Grading...</span>
                          </div>
                        ) : (
                          <span>{isFailed ? 'Submit Revision to Sola' : 'Submit to Sola for Grading'}</span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* UNDER REVIEW STATE */}
                {isSubmitted && (
                   <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl flex items-center gap-4 shadow-lg">
                      <Loader2 className="animate-spin text-amber-500 w-6 h-6" />
                      <div>
                        <h4 className="font-bold text-amber-400 text-base">Under Review</h4>
                        <p className="text-xs text-amber-500/70 mt-1 font-medium">Sola is currently evaluating your submission.</p>
                      </div>
                   </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <ReportIssueModal 
        isOpen={!!reportIssueTask}
        onClose={() => setReportIssueTask(null)}
        userId={user?.id || ''} 
        taskId={reportIssueTask?.id?.toString() || 'N/A'} 
        trackName={reportIssueTask?.type || (reportIssueTask as any)?.task_track || 'Unknown'} 
      />
    </div>
  );
}