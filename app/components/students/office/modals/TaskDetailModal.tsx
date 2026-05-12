import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, FileText, AlertTriangle, Download, Youtube, ExternalLink, BookOpen } from 'lucide-react';
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

// FIX: Added '?' to allow undefined URLs from TypeScript
const getYouTubeEmbedUrl = (url?: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  if (!task) return null;

  // Separate resources into Videos and Articles for better UI
  const videoResources = task.resources?.filter(r => getYouTubeEmbedUrl(r.url)) || [];
  const articleResources = task.resources?.filter(r => !getYouTubeEmbedUrl(r.url)) || [];

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
            className="w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border/50 shrink-0 bg-card">
              <div className="flex-1 pr-4">
                <span className="text-xs font-medium bg-primary/20 text-primary px-3 py-1 rounded-full">
                  {formatTrackName(task.type)}
                </span>
                <h2 className="text-xl font-bold text-foreground mt-3">{task.title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 bg-secondary/50 hover:bg-secondary">
                <X size={18} />
              </Button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Deadline</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{task.deadline}</p>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText size={14} />
                    <span className="text-xs font-medium uppercase tracking-wider">Assets</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{task.attachments?.length || 0} attached files</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider border-b border-border/50 pb-2">Task Brief</h3>
                <div className="text-sm text-foreground leading-relaxed [&>*]:text-muted-foreground [&_strong]:text-foreground [&_code]:bg-primary/10 [&_code]:text-primary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_a]:text-primary [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_li]:text-muted-foreground space-y-4">
                  <ReactMarkdown>{task.description}</ReactMarkdown>
                </div>
              </div>

              {/* --- EDUCATIONAL RESOURCES SECTION --- */}
              {(videoResources.length > 0 || articleResources.length > 0) && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border/50 pb-2 flex items-center gap-2">
                    <BookOpen size={16} className="text-primary"/> Assigned Learning Materials
                  </h3>

                  {/* Embedded Videos */}
                  {videoResources.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Youtube size={14} className="text-red-500"/> Video Tutorials
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {videoResources.map((vid, index) => {
                          const embedUrl = getYouTubeEmbedUrl(vid.url);
                          return embedUrl ? (
                            <div key={vid.id || index} className="rounded-xl overflow-hidden border border-border/50 bg-secondary/10 flex flex-col group">
                              <iframe
                                className="w-full aspect-video border-b border-border/50"
                                src={embedUrl}
                                title={vid.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                              <div className="p-3 flex-1 flex flex-col">
                                <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">{vid.title}</p>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* External Articles/Links */}
                  {articleResources.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <ExternalLink size={14} className="text-blue-500"/> Reading Materials
                      </h4>
                      <div className="grid gap-2">
                        {articleResources.map((article, index) => (
                          <a
                            key={article.id || index}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/30 hover:border-primary/30 transition-all group"
                          >
                            <div className="mt-0.5 bg-background p-1.5 rounded-md shadow-sm group-hover:text-primary">
                              <FileText size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{article.title || article.url}</p>
                              {article.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{article.description}</p>}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Client Constraints */}
              {task.clientConstraints && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-bold">Client Constraints</span>
                  </div>
                  <p className="text-sm text-foreground">{task.clientConstraints}</p>
                </div>
              )}

              {/* Legacy Attachments List (e.g. CSVs, datasets) */}
              {task.attachments && task.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider border-b border-border/50 pb-2">Provided Assets</h3>
                  <div className="space-y-2">
                    {task.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-secondary/30 rounded-xl p-3 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Download className="text-primary" size={18} />
                          </div>
                          {/* FIX: Cast to any to bypass strict TypeScript checking for .name */}
                          <span className="text-sm font-medium text-foreground">
                            {typeof file === 'string' ? file : (file as any).name || 'Document'}
                          </span>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 text-xs">
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
                  <h3 className="text-sm font-bold text-destructive mb-2">Revision Notes</h3>
                  <p className="text-sm text-foreground">{task.feedback}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-card shrink-0 flex justify-end">
              <Button onClick={onClose} variant="default" className="px-8">
                Understood
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}