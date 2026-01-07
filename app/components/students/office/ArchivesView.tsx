"use client"
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, ExternalLink, FolderOpen, Sparkles, X, FileText } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { ArchiveItem } from './types';
import { useOffice } from '../../../contexts/OfficeContext';

export function ArchivesView() {
  const { currentTask, tasks, userName } = useOffice();
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<ArchiveItem | null>(null);

  // Combine Task Resources + General Archives
  const taskResources = currentTask?.resources || [];

  // Prioritize task resources
  const allResources = [...taskResources];

  const filteredArchives = allResources.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filteredArchives.map(a => a.category))];

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
                {currentTask ? `Resources for: ${currentTask.title}` : 'General Library'}
              </p>
            </div>
          </div>
          {currentTask && taskResources.length > 0 && (
            <div className="bg-primary/10 px-3 py-1 rounded-full text-xs font-medium text-primary flex items-center gap-1">
              <Sparkles size={12} />
              AI Updates Active
            </div>
          )}
        </div>



        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search resources..."
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
          <div className="space-y-6">
            {categories.map(category => {
              const categoryItems = filteredArchives.filter(a => a.category === category);
              if (categoryItems.length === 0) return null;

              const isTaskGuide = category === 'Task Guide';

              return (
                <div key={category} className="mb-8">
                  <h3 className={`text-sm font-semibold mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2 ${isTaskGuide ? 'text-primary' : 'text-muted-foreground'}`}>
                    {category}
                    {isTaskGuide && <Sparkles size={14} />}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {categoryItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedResource(item)}
                        className={`group flex flex-col items-center p-4 rounded-xl cursor-pointer transition-all duration-200 
                            ${isTaskGuide ? 'hover:bg-primary/10' : 'hover:bg-secondary/80'}
                            hover:scale-105 active:scale-95`}
                      >
                        <div className={`w-24 h-24 mb-3 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:-translate-y-1
                            ${isTaskGuide ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary' : 'bg-gradient-to-br from-card to-secondary border border-border/50 text-blue-400'}`}>
                          {item.link ? <ExternalLink size={40} strokeWidth={1.5} /> : <FileText size={40} strokeWidth={1.5} />}
                        </div>

                        <p className="text-sm text-center font-medium leading-tight text-foreground/90 group-hover:text-foreground line-clamp-2 w-full break-words px-1">
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
              className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90%] flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedResource.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedResource.category}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedResource(null)}>
                  <X size={20} />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {selectedResource.content || selectedResource.description}
                {selectedResource.link && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <a
                      href={selectedResource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
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