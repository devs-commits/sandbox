"use client"
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ExternalLink, FolderOpen, Sparkles, X, FileText, FileSpreadsheet, Globe } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { ArchiveItem } from './types';
import { useOffice } from '../../../contexts/OfficeContext';

// Helper to determine icon based on title/category
const getFileIcon = (item: ArchiveItem) => {
  if (item.type === "pdf") return <FileText size={32} strokeWidth={1.5} />;
  if (item.type === "video") return <Globe size={32} strokeWidth={1.5} />;
  if (item.type === "web") return <Globe size={32} strokeWidth={1.5} />;
  if (item.type === "dataset") return <FileSpreadsheet size={32} strokeWidth={1.5} />;
  return <FileText size={32} strokeWidth={1.5} />;
};

// Helper for file type badge
const getFileType = (item: ArchiveItem) => {
  if (item.type === "pdf") return "PDF";
  if (item.type === "video") return "VIDEO";
  if (item.type === "web") return "WEB";
  if (item.type === "dataset") return "DATA";
  return "DOC";
};

// INTELLIGENT EMBED URL GENERATOR
const getEmbedUrl = (url: string | undefined, type: string | undefined) => {
  if (!url) return "";
  try {
    // 1. Handle YouTube Videos
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    
    // 2. Handle External PDFs (Bypasses Chrome Blocking)
    if (type === 'pdf' || url.toLowerCase().endsWith('.pdf')) {
      return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    }

    // 3. Standard Web Pages
    return url; 
  } catch (e) {
    return url;
  }
};

export function ArchivesView() {
  const { currentTask } = useOffice();
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<ArchiveItem | null>(null);

  const allResources = useMemo(() => {
    const raw = currentTask?.resources || [];
    
    return raw.map((item: any, index: number) => ({
      id: item.id || `task-res-${index}`,
      title: item.title,
      category: item.category || "Learning Resources",
      description: item.description,
      content: item.content || item.description,
      url: item.url || item.link,
      type: item.type || (item.url?.includes("youtube") || item.url?.includes("youtu.be") ? "video" : (item.url?.endsWith(".pdf") ? "pdf" : "web")),
    }));
  }, [currentTask]);

  const filteredArchives = allResources.filter(item =>
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filteredArchives.map(a => a.category))];

  categories.sort((a, b) => {
    if (a === 'Task Guide') return -1;
    if (b === 'Task Guide') return 1;
    return a?.localeCompare(b ?? "") ?? 0;
  });

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-secondary/10 relative">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BookOpen className="text-primary" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">The Archives</h2>
              <p className="text-sm text-muted-foreground">
                {currentTask ? `Active Task: ${currentTask.title}` : 'General Library'}
              </p>
            </div>
          </div>
          {allResources.length > 0 && (
            <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-medium text-primary flex items-center gap-1 animate-pulse">
              <Sparkles size={12} />
              Resources Loaded
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredArchives.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <FolderOpen className="text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">No resources found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryItems = filteredArchives.filter(a => a.category === category);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} className="mb-8">
                  <h3 className="text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2 text-primary">
                    {category}
                    <Sparkles size={12} />
                    <span className="text-[10px] opacity-50 font-normal ml-auto border border-border px-2 py-0.5 rounded-full">
                      {categoryItems.length} items
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {categoryItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedResource(item)}
                        className={`group flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:bg-secondary/40 hover:border-border/50`}
                      >
                        <div className="relative w-full aspect-square mb-3 bg-secondary/30 rounded-lg flex items-center justify-center group-hover:bg-secondary/60 transition-colors border border-border/30 overflow-hidden">
                          <div className="text-primary group-hover:scale-110 transition-transform duration-200 z-10">
                            {getFileIcon(item)}
                          </div>
                          <div className="absolute bottom-2 right-2 text-[9px] font-bold bg-background/80 px-1.5 py-0.5 rounded text-foreground/70 uppercase z-20">
                            {getFileType(item)}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-foreground/80 group-hover:text-foreground line-clamp-2 leading-relaxed text-center w-full break-words">
                          {item.title}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* IN-APP PLAYER MODAL */}
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
                    {getFileIcon(selectedResource)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-none mb-1 line-clamp-1">{selectedResource.title}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{getFileType(selectedResource)} • {selectedResource.category}</p>
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
                {/* Media Player Container */}
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
                      // Chrome-safe rendering for PDFs and Web Pages
                      <iframe
                        src={getEmbedUrl(selectedResource.url, selectedResource.type)}
                        className="w-full h-[600px] border-0 bg-white"
                        // Removed sandbox restrictions that block external viewers
                      />
                    )}
                  </div>
                )}

                {/* Content / Description Text */}
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