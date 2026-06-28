"use client"
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ExternalLink, FolderOpen, Sparkles, X, FileText, FileSpreadsheet, Globe, Layers, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { ArchiveItem } from './types';
import { useOffice } from '../../../contexts/OfficeContext';

const getFileIcon = (type: string) => {
  if (type === "pdf") return <FileText size={32} strokeWidth={1.5} />;
  if (type === "video") return <Globe size={32} strokeWidth={1.5} />;
  if (type === "web") return <Globe size={32} strokeWidth={1.5} />;
  if (type === "dataset") return <FileSpreadsheet size={32} strokeWidth={1.5} />;
  return <FileText size={32} strokeWidth={1.5} />;
};

const getFileType = (type: string) => {
  if (type === "pdf") return "PDF";
  if (type === "video") return "VIDEO";
  if (type === "web") return "WEB";
  if (type === "dataset") return "DATA";
  return "DOC";
};

const getEmbedUrl = (url: string | undefined, type: string | undefined) => {
  if (!url) return "";
  try {
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (type === 'pdf' || url.toLowerCase().endsWith('.pdf')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url; 
  } catch (e) {
    return url;
  }
};

export function ArchivesView() {
  const { tasks } = useOffice();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'resources' | 'submissions'>('resources'); // 🔥 ADDED TAB STATE
  const [selectedResource, setSelectedResource] = useState<ArchiveItem & { type: string, taskTitle?: string } | null>(null);

  // Group all resources from all tasks, sorted newest to oldest, with intelligent naming
  const allResources = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const extractedResources: any[] = [];
    
    // Sort ascending first to figure out the true chronological Task Number
    const chronologicalTasks = [...tasks].sort((a: any, b: any) => {
      const weekA = a.week || 0;
      const weekB = b.week || 0;
      return weekA - weekB;
    });

    // Reverse for the display so the newest Task is at the top of the Archives
    const displayTasks = [...chronologicalTasks].reverse();
    
    displayTasks.forEach((task: any) => {
      // Create the "Task 1: Topic" naming convention
      const taskNumber = task.week || (chronologicalTasks.indexOf(task) + 1);
      const formattedTaskTitle = `Task ${taskNumber}: ${task.title || 'Assignment'}`;
      
      const raw = task.resources || [];
      
      raw.forEach((item: any, index: number) => {
        let intelligentTitle = item.title;

        // Intelligent Naming Override if the title is generic or missing
        if (!intelligentTitle || intelligentTitle.toLowerCase().includes('learning resource') || intelligentTitle.toLowerCase().startsWith('resource')) {
          const isPdf = item.type === 'pdf' || item.url?.toLowerCase().endsWith('.pdf');
          const isVid = item.type === 'video' || item.url?.includes('youtube') || item.url?.includes('youtu.be');

          if (isPdf && item.url) {
            try {
              // Try to extract the actual file name from the URL
              const decodedUrl = decodeURIComponent(item.url.split('/').pop()?.split('?')[0] || '');
              intelligentTitle = decodedUrl.length > 5 ? decodedUrl.replace(/[-_]/g, ' ') : `${task.title} - PDF Guide`;
            } catch (e) {
              intelligentTitle = `${task.title} - Reference Guide ${index + 1}`;
            }
          } else if (isVid) {
            intelligentTitle = `${task.title} - Video Tutorial ${index + 1}`;
          } else {
            intelligentTitle = `${task.title} - Reference Link ${index + 1}`;
          }
        }

        extractedResources.push({
          id: item.id || `task-${task.id}-res-${index}`,
          title: intelligentTitle,
          category: item.category || "Learning Resources",
          taskTitle: formattedTaskTitle,
          description: item.description,
          content: item.content || item.description,
          url: item.url || item.link,
          type: item.type || (item.url?.includes("youtube") || item.url?.includes("youtu.be") ? "video" : (item.url?.endsWith(".pdf") ? "pdf" : "web")),
        });
      });
    });
    
    return extractedResources;
  }, [tasks]);

  const filteredArchives = allResources.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.taskTitle?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by Task Title (Insertion order is preserved from our sorted extraction)
  const taskGroups = [...new Set(filteredArchives.map(a => a.taskTitle))];
  const isSearching = search.trim().length > 0;
  
  console.log("ALL TASKS", tasks);

console.log(
  "TASK STATUSES",
  tasks.map(t => ({
    title: t.title,
    status: t.status,
    week: t.week
  }))
);
  // 🔥 FETCH PASSED TASKS
  const passedTasks = tasks.filter(t =>
  ['passed', 'approved', 'submitted'].includes(t.status)
);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-secondary/10 relative">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Layers className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">The Archives</h2>
              <p className="text-sm text-muted-foreground">
                Your Vault & Portfolio
              </p>
            </div>
          </div>
        </div>

        {/* 🔥 NEW TAB SWITCHER */}
        <div className="flex bg-secondary/30 p-1 rounded-xl w-fit mb-6 border border-border/50">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'resources' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            Learning Resources
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'submissions' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <CheckCircle2 size={16} /> Submitted Work
          </button>
        </div>

        {/* 🔥 SEARCH BAR (Only visible on Resources tab) */}
        {activeTab === 'resources' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search by file name, topic, or task number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        {/* ========================================= */}
        {/* TAB 1: LEARNING RESOURCES                 */}
        {/* ========================================= */}
        {activeTab === 'resources' && (
          <>
            {filteredArchives.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <FolderOpen className="text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">No resources match your search.</p>
              </div>
            ) : isSearching ? (
              /* SEARCH VIEW: Flat Grid so results aren't hidden inside Accordions */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary mb-4 border-b border-border/50 pb-2">
                  Search Results ({filteredArchives.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredArchives.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedResource(item)}
                      className="group flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200 border border-border/30 bg-card hover:shadow-md hover:border-primary/50 relative"
                    >
                      <div className="relative w-full aspect-square mb-3 bg-secondary/10 rounded-lg flex items-center justify-center group-hover:bg-secondary/30 transition-colors overflow-hidden">
                        <div className="text-primary group-hover:scale-110 transition-transform duration-200 z-10">
                          {getFileIcon(item.type)}
                        </div>
                        <div className="absolute bottom-2 right-2 text-[9px] font-bold bg-background/90 px-1.5 py-0.5 rounded text-foreground/70 uppercase z-20 shadow-sm border border-border/50">
                          {getFileType(item.type)}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-foreground/90 group-hover:text-foreground line-clamp-2 leading-relaxed mb-2">
                        {item.title}
                      </p>
                      
                      <div className="mt-auto pt-2 border-t border-border/40">
                        <p className="text-[10px] text-primary/80 font-medium truncate">
                          From: {item.taskTitle}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              /* NORMAL VIEW: Organized Accordions */
              <div className="space-y-4">
                {taskGroups.map((taskTitle, groupIndex) => {
                  const groupItems = filteredArchives.filter(a => a.taskTitle === taskTitle);
                  if (groupItems.length === 0) return null;

                  return (
                    <div key={taskTitle as string} className="bg-card/50 border border-border/50 rounded-xl overflow-hidden shadow-sm transition-all hover:border-primary/30">
                      <details className="group" open={groupIndex === 0}>
                        <summary className="cursor-pointer p-4 font-bold text-sm uppercase tracking-widest flex items-center justify-between text-primary hover:bg-secondary/20 transition-colors outline-none select-none">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} />
                            {taskTitle as string}
                            <span className="text-[10px] opacity-70 font-normal ml-2 border border-primary/30 px-2 py-0.5 rounded-full text-foreground">
                              {groupItems.length} items
                            </span>
                          </div>
                          <ChevronDown size={18} className="group-open:rotate-180 transition-transform text-muted-foreground" />
                        </summary>
                        
                        <div className="p-4 border-t border-border/50 bg-secondary/5">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {groupItems.map((item, index) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedResource(item)}
                                className="group/item flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:bg-card hover:shadow-md hover:border-border/50"
                              >
                                <div className="relative w-full aspect-square mb-3 bg-card rounded-lg flex items-center justify-center group-hover/item:bg-secondary/40 transition-colors border border-border/30 overflow-hidden shadow-sm">
                                  <div className="text-primary group-hover/item:scale-110 transition-transform duration-200 z-10">
                                    {getFileIcon(item.type)}
                                  </div>
                                  <div className="absolute bottom-2 right-2 text-[9px] font-bold bg-background/90 px-1.5 py-0.5 rounded text-foreground/70 uppercase z-20 shadow-sm border border-border/50">
                                    {getFileType(item.type)}
                                  </div>
                                </div>
                                <p className="text-xs font-medium text-foreground/80 group-hover/item:text-foreground line-clamp-2 leading-relaxed text-center w-full break-words">
                                  {item.title}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ========================================= */}
        {/* TAB 2: SUBMITTED WORK / PORTFOLIO         */}
        {/* ========================================= */}
        {activeTab === 'submissions' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {passedTasks.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-secondary/10 rounded-2xl border border-border/30 border-dashed">
                  <CheckCircle2 className="text-muted-foreground/30 mb-4" size={48} />
                  <p className="text-muted-foreground text-sm font-medium">No completed projects yet.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Finish your first task to start building your portfolio!</p>
                </div>
              ) : (
                passedTasks.map((task, idx) => (
                  <div key={task.id} className="bg-card/50 border border-border/50 p-6 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-lg transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          Week {task.week || idx + 1}
                        </span>
                        {task.score && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-md">
                            Score: {task.score}/100
                          </span>
                        )}
                      </div>
                      <h4 className="text-foreground font-bold text-sm leading-tight line-clamp-2">{task.title}</h4>
<p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
  {task.description.replace(/[#*`]/g, '').slice(0, 180)}
</p>                  </div>
                    
                    <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Passed
                      </span>
                      
                      {/* Link out to the submitted file if the backend saves it */}
                      {task.file_url ? (
                        <a 
                          href={task.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                          View Artifact <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/50 bg-secondary px-2 py-1 rounded-md">Vaulted</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* IN-APP PLAYER MODAL (For Learning Resources) */}
      <AnimatePresence>
        {selectedResource && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
            >
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    {getFileIcon(selectedResource.type)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-none mb-1 line-clamp-1">{selectedResource.title}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{getFileType(selectedResource.type)} • {selectedResource.taskTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedResource.url && (
                    <a
                      href={selectedResource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-border"
                    >
                      <ExternalLink size={14} />
                      Open Externally
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => setSelectedResource(null)} className="rounded-full hover:bg-secondary">
                    <X size={18} />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-secondary/10">
                {selectedResource.url && (
                  <div className="w-full bg-black/5 rounded-xl border border-border overflow-hidden mb-6 flex flex-col items-center justify-center min-h-[400px]">
                    {selectedResource.type === 'video' ? (
                      <iframe
                        src={getEmbedUrl(selectedResource.url, selectedResource.type)}
                        className="w-full aspect-video border-0 bg-black"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : (
                      <iframe
                        src={getEmbedUrl(selectedResource.url, selectedResource.type)}
                        className="w-full h-[600px] border-0 bg-white"
                      />
                    )}
                  </div>
                )}

                <div className="p-5 font-mono text-sm leading-7 text-foreground/80 whitespace-pre-wrap selection:bg-primary/20 bg-card rounded-lg border border-border shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <FileText size={14} /> Resource Details
                  </h4>
                  {selectedResource.content || selectedResource.description || "No additional description provided."}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}