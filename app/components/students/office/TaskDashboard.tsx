import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Upload, CheckCircle, AlertCircle, Loader2, Sparkles, Coffee } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { Task } from './types';
import { SubmissionModal } from './modals/SubmissionModal';
import { TaskDetailModal } from './modals/TaskDetailModal';

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
                className={`bg-card/80 backdrop-blur-sm border rounded-2xl p-5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg ${
                  currentTask?.id === task.id ? 'border-primary ring-2 ring-primary/20' : 'border-border/50'
                }`}
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                    {task.type}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1.5 border ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {getStatusLabel(task.status)}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{task.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{task.description}</p>
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

      {/* Task Detail Panel */}
      {currentTask && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-t border-border/50 p-5 bg-card/80 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-foreground">{currentTask.title}</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentTask(null)}
              className="text-xs"
            >
              Close
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{currentTask.description}</p>
          
          {currentTask.clientConstraints && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-amber-400 mb-1">Client Constraints</p>
              <p className="text-sm text-foreground">{currentTask.clientConstraints}</p>
            </div>
          )}

          <div className="flex gap-3">
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