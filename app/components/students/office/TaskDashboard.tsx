"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Upload, CheckCircle, AlertCircle, Loader2, Sparkles, Coffee } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { Task } from './types';
import { SubmissionModal } from './modals/SubmissionModal';
import { TaskDetailModal } from './modals/TaskDetailModal';
import ReactMarkdown from 'react-markdown';

// Format track names: "data-analytics" -> "Data Analytics"
const formatTrackName = (track: string): string => {
  if (!track) return 'General';
  return track
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
export function TaskDashboard() {
  const { tasks, currentTask, setCurrentTask, generateTask, isGeneratingTask } = useOffice();
  const [submissionTask, setSubmissionTask] = useState<Task | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={14} />;
      case 'rejected':
        return <AlertCircle className="text-destructive" size={14} />;
      case 'under-review':
      case 'submitted':
        return <Loader2 className="text-amber-500 animate-spin" size={14} />;
      case 'in-progress':
        return <Clock className="text-primary" size={14} />;
      default:
        return <Clock className="text-muted-foreground" size={14} />;
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'Not Started';
      case 'in-progress': return 'In Progress';
      case 'submitted': return 'Submitted';
      case 'under-review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Needs Revision';
      default: return status;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'under-review':
      case 'submitted': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'in-progress': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const handleTaskClick = (task: Task) => {
    setCurrentTask(currentTask?.id === task.id ? null : task);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-secondary/10">
      {/* Header - removed Generate Task button */}
      <div className="p-6 border-b border-border/50">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Desk</h2>
          <p className="text-sm text-muted-foreground">If it's empty, you're not getting paid</p>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
              <Coffee className="text-muted-foreground" size={36} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Click the button below to get your first assignment from Emem. Time to earn your keep.
            </p>
            <Button onClick={generateTask} disabled={isGeneratingTask} className="gap-2">
              {isGeneratingTask ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Your First Task
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-card/80 backdrop-blur-sm border rounded-2xl p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg ${currentTask?.id === task.id ? 'border-primary ring-2 ring-primary/20' : 'border-border/50'
                  }`}
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                    {formatTrackName(task.type)}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {getStatusLabel(task.status)}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{task.title}</h3>
                <div className="text-sm text-muted-foreground line-clamp-2 mb-4 [&>*]:text-muted-foreground [&_strong]:text-foreground [&_code]:text-primary [&_a]:text-primary">
                  <ReactMarkdown>{task.description}</ReactMarkdown>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> Due: {task.deadline}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} /> {task.attachments.length} files
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Panel - Bottom Sheet */}
      {currentTask && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setCurrentTask(null)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-2xl bg-card border-t border-x border-border rounded-t-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-5 pb-2">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {formatTrackName(currentTask.type)}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {currentTask.deadline}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{currentTask.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {currentTask.description?.replace(/[#*`_~\[\]]/g, '').substring(0, 150)}...
              </p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3">
              {currentTask.status !== 'approved' && currentTask.status !== 'submitted' && currentTask.status !== 'under-review' && (
                <Button onClick={() => setSubmissionTask(currentTask)} className="flex-1 gap-2">
                  <Upload size={16} /> Submit Work
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setDetailTask(currentTask)}
              >
                <FileText size={16} /> View Full Details
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {submissionTask && (
        <SubmissionModal
          isOpen={!!submissionTask}
          onClose={() => setSubmissionTask(null)}
          taskId={submissionTask.id}
          taskTitle={submissionTask.title}
        />
      )}

      <TaskDetailModal
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        task={detailTask}
      />
    </div>
  );
}