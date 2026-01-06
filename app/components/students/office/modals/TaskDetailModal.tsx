import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, AlertTriangle, Download } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Task } from '../types';
import ReactMarkdown from 'react-markdown';

// Format track names: "data-analytics" -> "Data Analytics"
const formatTrackName = (track: string): string => {
  if (!track) return 'General';
  return track
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border/50">
              <div className="flex-1">
                <span className="text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {formatTrackName(task.type)}
                </span>
                <h2 className="text-xl font-bold text-foreground mt-3">{task.title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                <X size={18} />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Task Brief</h3>
                <div className="text-sm text-muted-foreground leading-relaxed [&>*]:text-muted-foreground [&_strong]:text-foreground [&_code]:text-primary [&_a]:text-primary [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_li]:text-muted-foreground">
                  <ReactMarkdown>{task.description}</ReactMarkdown>
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock size={14} />
                    <span className="text-xs font-medium">Deadline</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{task.deadline}</p>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText size={14} />
                    <span className="text-xs font-medium">Attachments</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{task.attachments.length} file(s)</p>
                </div>
              </div>

              {/* Client Constraints */}
              {task.clientConstraints && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-semibold">Client Constraints</span>
                  </div>
                  <p className="text-sm text-foreground">{task.clientConstraints}</p>
                </div>
              )}

              {/* Attachments List */}
              {task.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Files</h3>
                  <div className="space-y-2">
                    {task.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-secondary/30 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <FileText className="text-primary" size={18} />
                          </div>
                          <span className="text-sm text-foreground">{file}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Download size={14} />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback (if any) */}
              {task.feedback && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-destructive mb-2">Revision Notes</h3>
                  <p className="text-sm text-foreground">{task.feedback}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border/50 bg-secondary/20">
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}