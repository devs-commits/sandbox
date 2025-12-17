"use client";

import { useState, useEffect } from "react";
import { StudentHeader } from "../../components/students/StudentHeader";    
import { Button } from "../../components/ui/button";
import { FileText, Clock, Eye, User, ArrowRight, Download, Flame, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContexts";
import { supabase } from "../../../lib/supabase";
import { TaskGenerator } from "../../components/students/TaskGenerator";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  title: string;
  brief_content: string;
  difficulty: string;
  task_track: string;
  completed: boolean;
}

export default function page() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user', user.id)
        .order('id', { ascending: true });
        
      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-500';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-500';
      case 'advanced': return 'bg-red-500/20 text-red-500';
      default: return 'bg-purple-500/20 text-purple-500';
    }
  };

  const handleTaskClick = (taskId: number) => {
    router.push(`/student/office?taskId=${taskId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader title="Headquarters" />
      
      <div className="p-4 lg:p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-muted-foreground/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <FileText className="text-muted-foreground" size={18} />
            <div>
              <span className="text-sm text-muted-foreground">Tasks Done: </span>
              <span className="text-sm font-semibold text-muted-foreground">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </span>
            </div>
          </div>
          <div className="bg-green-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <Clock className="text-green-400/60" size={18} />
            <div>
              <span className="text-sm text-green-400/60">Streak: </span>
              <span className="text-sm font-semibold text-green-400/60">Active</span>
            </div>
          </div>
          <div className="bg-red-500/15 border border-border rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
            <Eye className="text-red-500" size={18} />
            <span className="text-sm font-semibold text-red-500">3 Recruiters viewing</span>
          </div>
          <div className="bg-purple-500/20 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
            <User className="text-purple-400" size={18} />
            <div>
              <span className="text-sm text-purple-500">Profile Stats: </span>
              <span className="text-sm font-semibold text-purple-500">32 Views</span>
            </div>
          </div>
        </div>

        {/* Work and Visa Reference Letters */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg">
                <FileText className="text-purple-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Work and Visa Reference Letters</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Maintain your 12-weeks active streak to unlock verified immigration references. Missing a payment resets streak.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              <Flame size={14} />
              14 DAY STREAK
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }} />
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">12 Weeks Internship</p>
          </div>

          {/* Letter cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-muted/50 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="text-muted-foreground" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70">WORK LETTER OF REFERENCE</p>
                  <p className="text-xs text-orange-400">Available after 12 weeks</p>
                </div>
              </div>
              <Button size="sm" disabled className="bg-foreground/50 text-primary-foreground/50 cursor-not-allowed blur-[1px]">
                <Download size={14} className="mr-1" />
                Download Letter
              </Button>
            </div>
            <div className="bg-muted/50 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText className="text-muted-foreground" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground/70">VISA LETTER OF REFERENCE</p>
                  <p className="text-xs text-orange-400">Available after 12 weeks</p>
                </div>
              </div>
              <Button size="sm" disabled className="bg-foreground/50 text-primary-foreground/50 cursor-not-allowed blur-[1px]">
                <Download size={14} className="mr-1" />
                Download Letter
              </Button>
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">My Tasks ({tasks.length})</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tasks.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-card border border-border rounded-xl p-4 flex flex-col h-full cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-gray-600/20 text-foreground-500 text-xs px-2 py-0.5 rounded uppercase">
                      {task.task_track}
                    </span>
                    <span className={`${getDifficultyColor(task.difficulty)} text-xs px-2 py-0.5 rounded ml-auto uppercase`}>
                      {task.difficulty}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">{task.title}</h3>
                  <p className="text-xs text-muted-foreground flex-1 mb-4 line-clamp-3">{task.brief_content}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText size={14} />
                      <span className="text-xs">View Details</span>
                    </div>
                    <ArrowRight size={18} className="text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <TaskGenerator onTasksGenerated={fetchTasks} />
          )}
        </div>
      </div>
    </div>
  );
};