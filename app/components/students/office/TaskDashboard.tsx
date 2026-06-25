"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, FileText, Upload, CheckCircle, AlertCircle, Loader2, Coffee, 
  Target, ChevronDown, RefreshCw, AlertTriangle, ChevronRight, AlertOctagon 
} from 'lucide-react';
import { Open_Sans } from 'next/font/google';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { useAuth } from '../../../contexts/AuthContexts';
import { Task } from './types';
import { SubmissionModal } from './modals/SubmissionModal';
import { TaskDetailModal } from './modals/TaskDetailModal';
import ReactMarkdown from 'react-markdown';
import { supabase } from "../../../../lib/supabase";
import { toast } from 'sonner';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

const formatTag = (tag: string | undefined): string => {
  if (!tag) return 'GENERAL';
  return tag.replace(/_/g, ' ').replace(/-/g, ' ').toUpperCase();
};

// 🔥 THE FIX: Dynamic Escalating Urgency Calculator
const getUrgencyDisplay = (task: any) => {
  const isCompleted = task.status === 'approved' || task.status === 'passed' || task.status === 'submitted';
  if (isCompleted) return <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle size={12}/> Completed</span>;
  
  if (!task.created_at) return <span className="text-slate-400">Due: Friday</span>;

  const createdDate = new Date(task.created_at);
  const deadline = new Date(createdDate);
  const dayOfWeek = createdDate.getDay();
  // Finds the next Friday (or gives 7 days if generated ON a Friday)
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  deadline.setDate(createdDate.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));
  deadline.setHours(23, 59, 59, 999);

  const now = new Date();
  const diffTime = now.getTime() - deadline.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    if (diffDays > 14) {
      const weeks = Math.floor(diffDays / 7);
      return <span className="text-red-400 font-bold bg-red-900/30 border border-red-500/50 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1"><AlertOctagon size={12}/> Overdue by {weeks} {weeks === 1 ? 'week' : 'weeks'}</span>;
    }
    if (diffDays > 7) {
      return <span className="text-red-400 font-bold bg-red-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle size={12}/> Overdue by 1 week</span>;
    }
    return <span className="text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle size={12}/> Overdue by {diffDays} {diffDays === 1 ? 'day' : 'days'}</span>;
  } else {
    const daysLeft = Math.abs(diffDays);
    if (daysLeft === 0) return <span className="text-yellow-400 font-bold bg-yellow-500/20 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={12}/> Due Today!</span>;
    if (daysLeft <= 2) return <span className="text-yellow-400/80 font-medium bg-yellow-500/10 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={12}/> Due in {daysLeft} days</span>;
    return <span className="text-cyan-400/80 font-medium bg-cyan-500/10 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={12}/> Due this Friday</span>;
  }
};

interface TaskResultProps {
  score: number;
  rating: string;
  feedback: string;
  recommendations: string[];
}

function TaskResultScreen({ score, rating, feedback, recommendations }: TaskResultProps) {
  const isPass = score >= 50;
  return (
    <div className="bg-[#1A1F2E] border border-slate-700/80 rounded-2xl p-5 sm:p-6 w-full shadow-2xl">
      <div className="flex justify-between items-start border-b border-slate-700/50 pb-5 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Task Assessment</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full ${isPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {isPass ? 'PASSED' : 'FAILED'}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">Rating: <span className="text-white">{rating}</span></span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-4xl sm:text-5xl font-black text-cyan-400">{score}</span>
          <span className="text-base sm:text-lg font-bold text-slate-500">/100</span>
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
            <h3 className="font-bold text-white text-base sm:text-lg">AI Technical Feedback</h3>
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0F172A]/50 p-4 sm:p-5 rounded-xl border border-slate-800/80 prose prose-invert max-w-none">
            <ReactMarkdown>{feedback}</ReactMarkdown>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <h3 className="font-bold text-white text-base sm:text-lg">Areas for Improvement</h3>
          </div>
          <ul className="space-y-3 bg-[#0F172A]/50 p-4 sm:p-5 rounded-xl border border-slate-800/80">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                <span className="pt-0.5">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function TaskDashboard() {
  const { user } = useAuth();
  const { 
    tasks = [], currentTask, setCurrentTask, generateTask, isGeneratingTask, 
    isLoadingTasks, weekStatus, generationStatusText, 
    performanceMetrics, chatMessages = [] 
  } = useOffice();

  const [submissionTask, setSubmissionTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [previewFeedback, setPreviewFeedback] = useState<string | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const getStatusIcon = (status: Task['status'] | string) => {
    switch (status) {
      case 'approved':
      case 'passed': return <CheckCircle className="text-green-500" size={14} />;
      case 'rejected':
      case 'needs_revision': return <AlertCircle className="text-destructive" size={14} />;
      case 'under-review':
      case 'under_review':
      case 'submitted': return <Loader2 className="text-amber-500 animate-spin" size={14} />;
      case 'in-progress':
      case 'in_progress': return <Clock className="text-primary" size={14} />;
      default: return <Clock className="text-muted-foreground" size={14} />;
    }
  };

  const getStatusLabel = (status: Task['status'] | string) => {
    switch (status) {
      case 'pending': return 'Not Started';
      case 'in-progress':
      case 'in_progress': return 'In Progress';
      case 'submitted': return 'Submitted';
      case 'under-review':
      case 'under_review': return 'Under Review';
      case 'approved':
      case 'passed': return 'Approved';
      case 'rejected':
      case 'needs_revision': return 'Needs Revision';
      default: return (status as string).replace('_', ' ');
    }
  };

  const getStatusColor = (status: Task['status'] | string) => {
    switch (status) {
      case 'approved':
      case 'passed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
      case 'needs_revision': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'under-review':
      case 'under_review':
      case 'submitted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'in-progress':
      case 'in_progress': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const handleTaskClick = async (task: Task) => {
    setCurrentTask(task);
    if (previewTask?.id === task.id) {
      setPreviewTask(null);
      return;
    }
    setPreviewTask(task);

    const isCompleted = task.status === 'approved' || (task.status as string) === 'passed';
    if (isCompleted) {
      setIsLoadingFeedback(true);
      try {
        const { data } = await supabase
          .from('submissions')
          .select('ai_feedback')
          .eq('task_id', task.id)
          .single();
        setPreviewFeedback(data?.ai_feedback || "Excellent work. Sola has verified this submission.");
      } catch (err) {
        setPreviewFeedback("Excellent work. Sola has verified this submission.");
      } finally {
        setIsLoadingFeedback(false);
      }
    }
  };

  const handleRegenerate = async (task: Task) => {
    setIsRegenerating(true);
    toast.info("Analyzing requirements for a new brief...");
    try {
      const res = await fetch('/api/tasks/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id.toString(), // Ensured to be string payload
          user_name: user?.fullName || "Intern",
          track: task.type || (task as any).task_track,
          task_number: tasks.length
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Emem has issued a new brief!");
        setPreviewTask(null); 
        generateTask(); 
      } else {
        toast.error(data.error || "Task has already been regenerated once.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const sortedRegularTasks = [...tasks]
    .filter(t => t.difficulty !== 'Bounty')
    .sort((a, b) => {
      const weekA = (a as any).week || 0;
      const weekB = (b as any).week || 0;
      return weekB - weekA; 
    });

  const sortedBounties = [...tasks].filter(t => t.difficulty === 'Bounty');

  if (weekStatus === 'passed_waiting') {
    const score = performanceMetrics?.technicalAccuracy || 92;
    const rating = score >= 90 ? "Excellent" : score >= 75 ? "Good" : score >= 50 ? "Pass" : "Fail";
    
    const solaMessages = chatMessages.filter(m => m.agentName === 'Sola' || (m.agentName as string) === 'System');
    const actualFeedback = solaMessages[solaMessages.length - 1]?.message || "Task completed successfully. The metrics have been recorded in your performance report.";

    const recommendations = [
      "Review the automated portfolio update generated by Kemi.",
      "Check your new mastery score in the Gamification tab.",
      "Read through the optional reference materials to prepare for next week's simulation."
    ];

    return (
      <div className={`h-full flex flex-col bg-[#0A0D14] overflow-y-auto ${openSans.className} p-4 sm:p-6 relative`}>
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
           <Button variant="outline" size="sm" onClick={generateTask} disabled={isGeneratingTask}
              className="bg-[#0F172A] border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs shadow-lg">
              <RefreshCw size={14} className={`mr-2 ${isGeneratingTask ? 'animate-spin' : ''}`} />
              {isGeneratingTask ? (generationStatusText || 'Fetching...') : 'Force Sync Next Task'}
           </Button>
        </div>
        <div className="max-w-3xl mx-auto w-full mt-10 sm:mt-16 space-y-8 pb-20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-500/10">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2">Week Cleared!</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Sola has finalized your assessment. Review your official report card below before the next task unlocks.
            </p>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <TaskResultScreen score={score} rating={rating} feedback={actualFeedback} recommendations={recommendations} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center">
            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-slate-700 p-6 rounded-2xl w-full max-w-sm text-center shadow-xl">
              <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Next Task Unlocks</p>
              <p className="text-2xl font-black text-white">Monday @ 8:00 AM</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-gradient-to-b from-transparent to-secondary/10 overflow-y-auto ${openSans.className}`}>
      
      <div className="p-6 pb-0 flex flex-col gap-4">
        <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-foreground">Your Desk</h2>
             <Button variant="outline" size="sm" onClick={generateTask} disabled={isGeneratingTask}
                className="bg-card border-border text-muted-foreground hover:text-foreground text-xs shadow-sm transition-all">
                <RefreshCw size={14} className={`mr-2 ${isGeneratingTask ? 'animate-spin text-primary' : ''}`} />
                {isGeneratingTask ? (generationStatusText || 'Preparing Task...') : 'Fetch Missing Task'}
             </Button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-8">
        {isLoadingTasks ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Loader2 className="text-primary animate-spin mb-4" size={36} />
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
              {isGeneratingTask ? <Loader2 className="text-primary animate-spin" size={36} /> : <Coffee className="text-muted-foreground" size={36} />}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isGeneratingTask ? 'Preparing your task...' : 'Your desk is empty'}
            </h3>
          </motion.div>
        ) : (
          <>
            {sortedRegularTasks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Assigned Tasks</h3>
                <div className="grid gap-4">
                  {sortedRegularTasks.map((task, index) => {
                    const isCompleted = task.status === 'approved' || (task.status as string) === 'passed';
                    
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`backdrop-blur-sm border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg ${
                          isCompleted ? 'bg-green-500/5 border-green-500/30' : currentTask?.id === task.id ? 'bg-card/80 border-primary ring-2 ring-primary/20' : 'bg-card/80 border-border/50 hover:border-primary/50'
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full tracking-wider">
                            {formatTag(task.type || (task as any).task_track)}
                          </span>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 border ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-2">
                          {(task as any).week ? `Week ${(task as any).week}: ` : ''}{task.title}
                        </h3>
                        
                        <div className="text-sm text-muted-foreground line-clamp-2 mb-4 [&>*]:text-muted-foreground [&_strong]:text-foreground [&_code]:text-primary [&_a]:text-primary">
                          <ReactMarkdown>{task.description || ''}</ReactMarkdown>
                        </div>

                        {task.resources && task.resources.length > 0 && (
                          <div onClick={(e) => e.stopPropagation()} className="mb-4">
                            <details className="group border border-border/60 rounded-xl overflow-hidden bg-secondary/10">
                              <summary className="cursor-pointer text-xs font-semibold p-3 flex justify-between items-center text-foreground hover:bg-secondary/20 transition-colors">
                                <span className="flex items-center gap-2"><FileText size={14} className="text-primary"/> Reference Materials ({task.resources.length})</span>
                                <ChevronDown size={14} className="group-open:rotate-180 transition-transform text-muted-foreground" />
                              </summary>
                              <div className="p-3 border-t border-border/50 space-y-2 bg-card/40">
                                {task.resources.map((res) => (
                                  <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="block p-2 text-xs hover:bg-muted/50 rounded-lg border border-transparent hover:border-border transition-all">
                                    <span className="font-semibold text-primary block truncate">{res.title}</span>
                                    {res.description && <p className="text-muted-foreground mt-0.5 truncate">{res.description}</p>}
                                  </a>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-3 border-t border-border/30">
                          {/* 🔥 INJECTED DYNAMIC URGENCY SYSTEM HERE */}
                          <div className="flex items-center gap-1.5">
                            {getUrgencyDisplay(task)}
                          </div>
                          
                          {task.attachments && task.attachments.length > 0 && (
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <FileText size={12} /> {task.attachments.length} files
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {sortedBounties.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2 mt-8">
                  <Target size={16} /> Accepted Bounties
                </h3>
                <div className="grid gap-4">
                  {sortedBounties.map((task, index) => (
                    <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                      className={`bg-yellow-500/5 backdrop-blur-sm border rounded-2xl p-5 cursor-pointer transition-all hover:border-yellow-500/50 hover:shadow-lg ${currentTask?.id === task.id ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-yellow-500/20'}`}
                      onClick={() => handleTaskClick(task)}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-xs font-medium bg-yellow-500/20 text-yellow-600 px-3 py-1 rounded-full">BOUNTY</span>
                        <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)} {getStatusLabel(task.status)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{task.title}</h3>
                      <div className="text-sm text-muted-foreground line-clamp-2 mb-4"><ReactMarkdown>{task.description || ''}</ReactMarkdown></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {previewTask && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setPreviewTask(null)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="w-full max-w-2xl bg-card border-t border-x border-border rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2 shrink-0"><div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" /></div>
            <div className="overflow-y-auto custom-scrollbar flex-1 pb-6">
              {(previewTask.status as string) === 'approved' || (previewTask.status as string) === 'passed' ? (
                <div className="px-4 sm:px-6">
                  {isLoadingFeedback ? (
                    <div className="flex flex-col items-center justify-center py-16"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" /><p className="text-slate-400 font-medium animate-pulse">Retrieving Assessment Report...</p></div>
                  ) : (
                    <div className="pt-2">
                      <TaskResultScreen score={performanceMetrics?.technicalAccuracy || 88} rating={(performanceMetrics?.technicalAccuracy || 88) >= 80 ? "Excellent" : "Good"} feedback={previewFeedback || "Task completed successfully."} recommendations={["Apply this feedback to future simulations.", "Review reference materials to deepen your mastery."]} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-5">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full tracking-wider">{formatTag(previewTask.type || (previewTask as any).task_track)}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {/* 🔥 INJECTED DYNAMIC URGENCY SYSTEM IN PREVIEW TOO */}
                      {getUrgencyDisplay(previewTask)}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{(previewTask as any).week ? `Week ${(previewTask as any).week}: ` : ''}{previewTask.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{(previewTask.description || '').replace(/[#*\`_~\[\]]/g, '').substring(0, 150)}...</p>
                </div>
              )}
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-border/50 shrink-0 flex gap-3 bg-card flex-wrap">
              {(previewTask.status as string) !== 'approved' && (previewTask.status as string) !== 'passed' && (previewTask.status as string) !== 'submitted' && (previewTask.status as string) !== 'under-review' && (previewTask.status as string) !== 'under_review' && (
                <>
                  <Button onClick={() => setSubmissionTask(previewTask)} className="flex-1 gap-2 min-w-[140px]"><Upload size={16} /> Submit Work</Button>
                  <Button variant="destructive" onClick={() => handleRegenerate(previewTask)} disabled={(previewTask as any).is_regenerated || isRegenerating} className="flex-1 gap-2 min-w-[140px] bg-red-900/50 hover:bg-red-900 text-red-200 border-none">
                    {isRegenerating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                    {(previewTask as any).is_regenerated ? "Already Regenerated" : "Request New Brief"}
                  </Button>
                </>
              )}
              <Button variant="outline" className="flex-1 gap-2 min-w-[140px]" onClick={() => setDetailTask(previewTask)}><FileText size={16} /> View Full Details</Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {submissionTask && <SubmissionModal isOpen={!!submissionTask} onClose={() => setSubmissionTask(null)} taskId={submissionTask.id} taskTitle={submissionTask.title} />}
      <TaskDetailModal isOpen={!!detailTask} onClose={() => setDetailTask(null)} task={detailTask} />
    </div >
  );
}