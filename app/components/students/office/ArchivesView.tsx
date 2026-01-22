"use client"
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ExternalLink, FolderOpen, Sparkles, X, FileText, FileCode, FileImage, FileSpreadsheet, Globe } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { ArchiveItem } from './types';
import { useOffice } from '../../../contexts/OfficeContext';

// Helper to determine icon based on title/category
const getFileIcon = (item: ArchiveItem) => {
  const lowerTitle = item.title.toLowerCase();

  if (item.link) return <Globe size={32} strokeWidth={1.5} />;
  if (lowerTitle.includes('sheet') || lowerTitle.includes('csv') || lowerTitle.includes('excel')) return <FileSpreadsheet size={32} strokeWidth={1.5} />;
  if (lowerTitle.includes('image') || lowerTitle.includes('png') || lowerTitle.includes('jpg')) return <FileImage size={32} strokeWidth={1.5} />;
  if (lowerTitle.includes('code') || lowerTitle.includes('snippet') || lowerTitle.includes('json')) return <FileCode size={32} strokeWidth={1.5} />;

  return <FileText size={32} strokeWidth={1.5} />;
};

// Helper for file type badge
const getFileType = (item: ArchiveItem) => {
  if (item.link) return 'WEB';
  if (item.title.toLowerCase().includes('pdf') || item.content?.includes('PDF')) return 'PDF';
  if (item.title.toLowerCase().includes('csv')) return 'CSV';
  return 'DOC';
};

export function ArchivesView() {
  const { currentTask } = useOffice();
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<ArchiveItem | null>(null);

  // Combine Task Resources + General Archives
  const allResources = useMemo(() => {
    const taskRes = currentTask?.resources || [];
    console.log('ArchivesView: Current Task:', currentTask?.title);
    console.log('ArchivesView: Task Resources:', taskRes);

    // De-duplicate items by ID/Title if necessary, but here just merging
    return [...taskRes];
  }, [currentTask]);

  const filteredArchives = allResources.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filteredArchives.map(a => a.category))];

  // Sort categories to put "Task Guide" first
  categories.sort((a, b) => {
    if (a === 'Task Guide') return -1;
    if (b === 'Task Guide') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-secondary/10 relative">
      {/* Header */}
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
          {currentTask?.resources && currentTask.resources.length > 0 && (
            <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-medium text-primary flex items-center gap-1 animate-pulse">
              <Sparkles size={12} />
              AI Resources Loaded
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

      {/* Content */}
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

              const isTaskGuide = category === 'Task Guide';

              return (
                <div key={category} className="mb-8">
                  <h3 className={`text-xs font-bold mb-4 uppercase tracking-widest flex items-center gap-2 ${isTaskGuide ? 'text-primary' : 'text-muted-foreground'}`}>
                    {category}
                    {isTaskGuide && <Sparkles size={12} />}
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
                        className={`group flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200 
                            border border-transparent hover:bg-secondary/40 hover:border-border/50`}
                      >
                        {/* Desktop File Icon Style */}
                        <div className="relative w-full aspect-square mb-3 bg-secondary/30 rounded-lg flex items-center justify-center group-hover:bg-secondary/60 transition-colors border border-border/30">
                          <div className={`${isTaskGuide ? 'text-primary' : 'text-blue-400/80'} group-hover:scale-110 transition-transform duration-200`}>
                            {getFileIcon(item)}
                          </div>

                          {/* File Type Badge */}
                          <div className="absolute bottom-2 right-2 text-[9px] font-bold bg-background/80 px-1.5 py-0.5 rounded text-foreground/70 uppercase">
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

      {/* Resource Viewer Modal */}
      <AnimatePresence>
        {selectedResource && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90%] flex flex-col shadow-2xl relative overflow-hidden"
            >
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    {getFileIcon(selectedResource)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-none mb-1">{selectedResource.title}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{getFileType(selectedResource)} • {selectedResource.category}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedResource(null)} className="rounded-full hover:bg-secondary">
                  <X size={18} />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto font-mono text-sm leading-7 text-foreground/80 whitespace-pre-wrap selection:bg-primary/20">
                {selectedResource.content || selectedResource.description}

                {selectedResource.link && (
                  <div className="mt-8 pt-6 border-t border-border flex justify-end">
                    <a
                      href={selectedResource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink size={16} />
                      Open External Resource
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}