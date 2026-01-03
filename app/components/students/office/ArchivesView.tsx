import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, ExternalLink, FolderOpen } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { MOCK_ARCHIVES } from './types';

export function ArchivesView() {
  const [search, setSearch] = useState('');

  const filteredArchives = MOCK_ARCHIVES.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(MOCK_ARCHIVES.map(a => a.category))];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-transparent to-secondary/10">
      {/* Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">The Archives</h2>
            <p className="text-sm text-muted-foreground">Resources before you ask questions</p>
          </div>
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
              
              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    {category}
                  </h3>
                  <div className="grid gap-3">
                    {categoryItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <ExternalLink className="text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" size={16} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}