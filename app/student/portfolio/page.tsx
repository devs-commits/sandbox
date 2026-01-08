"use client"

import { useState, useEffect } from "react"
import { StudentHeader } from "@/app/components/students/StudentHeader"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { useAuth } from "@/app/contexts/AuthContexts"
import { supabase } from "@/lib/supabase"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog"
import {
  Wand2,
  Lock,
  Share2,
  CheckCircle2,
  Copy,
  Download,
  Link as LinkIcon,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  Twitter,
  MessageCircle,
  Send,
  AtSign,
  Ghost,
  Music2,
  CircleDashed,
  X,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: number;
  title: string;
  brief_content: string;
  difficulty: string;
  task_track: string;
  completed: boolean;
}

export default function PortfolioPage() {
  const { user } = useAuth()
  // Removed isResumeOpen state
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [feed, setFeed] = useState<{ [key: number]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [resumeContent, setResumeContent] = useState("")
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)

  useEffect(() => {
    if (user) {
      fetchCompletedTasks()
        .then(() => fetchFeedbackForTasks())
        .catch((error) => console.error("Error initializing portfolio:", error))
    }
  }, [user])

  const fetchCompletedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user', user?.id)
        .eq('completed', true)

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFeedbackForTasks = async () => {
    const feedbacks: { [key: number]: string } = {}
    for (const task of tasks) {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('ai_feedback')
          .eq('task_id', task.id)
          .single();

        if (error) throw error;
        setFeed(prev => ({ ...prev, [task.id]: data?.ai_feedback || "" }));
        feedbacks[task.id] = data?.ai_feedback || "";
      } catch (error) {
        console.error(`Error fetching feedback for task ${task.id}:`, error);
      }
    }
    return feedbacks;
  };

  const handleGenerateResume = async () => {
    if (tasks.length < 1) return // Don't allow if no tasks completed
    if (resumeContent) return // Don't regenerate if already exists

    setIsGeneratingResume(true)
    try {
      const response = await fetch('/api/users/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          user_name: user?.fullName,
          track: user?.track,
          start_date: user?.created_at,
          end_date: null,
          tasks: tasks,
          feedback: feed
        }),
      })
      const data = await response.json()
      setResumeContent(data.resume)
      toast.success("Resume generated!")
    } catch (error) {
      console.error("Error generating resume:", error)
      setResumeContent("Failed to generate resume. Please try again.")
      toast.error("Failed to generate resume. Please try again.")
    } finally {
      setIsGeneratingResume(false)
    }
  }

  const handleCopyResume = () => {
    navigator.clipboard.writeText(resumeContent)
    toast.success("Resume copied to clipboard")
  }

  const handleCopyLink = () => {
    // Construct public CV URL
    const url = `${window.location.origin}/cv/${user?.id}`
    navigator.clipboard.writeText(url)
    toast.success("Public CV link copied to clipboard")
    setIsShareOpen(false)
  }

  const getShareUrl = (platform: string) => {
    if (!user?.id) return "";
    const url = encodeURIComponent(`${window.location.origin}/cv/${user.id}`);
    const text = encodeURIComponent(`Check out my virtual office portfolio at WDC Labs!`);

    switch (platform) {
      case 'whatsapp': return `https://wa.me/?text=${text}%20${url}`;
      case 'twitter': return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'email': return `mailto:?subject=My WDC Portfolio&body=${text}%20${url}`;
      case 'telegram': return `https://t.me/share/url?url=${url}&text=${text}`;
      default: return "";
    }
  }

  const openShare = (platform: string) => {
    const url = getShareUrl(platform);
    if (url) window.open(url, '_blank', 'width=600,height=400');
  }

  // Derive skills from completed tasks
  const verifiedSkills = Array.from(new Set(tasks.map(t => t.task_track))).map(track => ({
    name: track.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    verified: true
  }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudentHeader title="Portfolio" />
      <div className="p-4 lg:p-6 space-y-8 max-w-7xl mx-auto">

        {/* Top Actions */}
        <div className="flex flex-wrap gap-3 justify-end">
          <div className="relative group">
            <Button
              onClick={handleGenerateResume}
              disabled={tasks.length < 1}
              className={cn(
                "border-none shadow-none font-medium",
                tasks.length < 1
                  ? "bg-[#1e293b] text-slate-400 hover:bg-[#1e293b]/80 cursor-not-allowed"
                  : "bg-[#a855f7] hover:bg-[#9333ea] text-white"
              )}
            >
              {tasks.length < 1 ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Resume
            </Button>
            {tasks.length < 1 && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Complete a task to unlock
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"></div>
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            className="bg-[#1e293b] text-slate-400 hover:bg-[#1e293b]/80 border-none cursor-not-allowed shadow-none font-medium"
          >
            <Lock className="mr-2 h-4 w-4" />
            Verification Locked
          </Button>
          <Button
            onClick={() => setIsShareOpen(true)}
            className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none shadow-none font-medium"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Public Link
          </Button>
        </div>

        {/* Verified Skills */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Verified Skills</h3>
          {isLoading ? (
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
              <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
            </div>
          ) : verifiedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {verifiedSkills.map((skill) => (
                <Badge
                  key={skill.name}
                  variant="secondary"
                  className="bg-[#1e293b] text-[#06b6d4] hover:bg-[#1e293b] px-3 py-1.5 text-sm font-medium border border-slate-700/50 rounded-md"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-[#06b6d4]" />
                  {skill.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Complete tasks to verify skills.</p>
          )}
        </div>

        {/* Completed Simulations */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">Completed Simulations</h3>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
              <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
            </div>
          ) : tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-lg truncate pr-2">{task.title}</h4>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{task.brief_content}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                        {task.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-900 bg-green-900/20 text-green-400">
                        Completed
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-slate-700 bg-transparent text-foreground hover:bg-slate-800 hover:text-white w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={() => setIsShareOpen(true)}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <p className="text-muted-foreground">No completed simulations yet.</p>
            </div>
          )}
        </div>

        {/* Resume Output Inline */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Generated Resume</h3>
          {isGeneratingResume ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#a855f7]" />
              <p className="text-slate-400">Analyzing your completed tasks...</p>
            </div>
          ) : resumeContent ? (
            <div className="prose prose-invert max-w-none bg-[#1e293b] p-6 rounded-xl border border-slate-700">
              <ReactMarkdown>{resumeContent}</ReactMarkdown>
              <div className="flex gap-4 mt-4">
                <Button variant="secondary" onClick={handleCopyResume} className="bg-slate-700 text-white hover:bg-slate-600 border-none min-w-[100px]">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Text
                </Button>
                {/* Download PDF button can be implemented here if needed */}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Click 'Generate Resume' to create your CV.</p>
          )}
        </div>

        {/* Share Link Modal */}
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent className="bg-[#0f172a] border-slate-800 text-white sm:max-w-md p-0 overflow-hidden [&>button]:hidden">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 text-left">Share Public CV</DialogTitle>
              </DialogHeader>
            </div>
            <div className="grid grid-cols-4 gap-y-8 gap-x-4 p-6">
              <ShareOption icon={LinkIcon} label="Copy link" color="bg-blue-500" onClick={handleCopyLink} />

              <ShareOption icon={MessageCircle} label="Whatsapp" color="bg-green-500" onClick={() => openShare('whatsapp')} />
              <ShareOption icon={Linkedin} label="Linkedin" color="bg-blue-700" onClick={() => openShare('linkedin')} />
              <ShareOption icon={Twitter} label="X" color="bg-black border border-slate-700" onClick={() => openShare('twitter')} />

              <ShareOption icon={Mail} label="Email" color="bg-blue-500" onClick={() => openShare('email')} />
              <ShareOption icon={TelegramIcon} label="Telegram" color="bg-sky-500" onClick={() => openShare('telegram')} />
              <ShareOption icon={Facebook} label="Facebook" color="bg-blue-600" onClick={() => openShare('facebook')} />

              {/* Placeholders / Less common */}
              <ShareOption icon={Instagram} label="Instagram" color="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500" onClick={handleCopyLink} />
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

// Helper for Telegram Icon (using Send icon as fallback/alias in imports, but defining clearly here if needed or reused)
const TelegramIcon = Send;

function ShareOption({ icon: Icon, label, color, iconColor = "text-white", onClick }: { icon: any, label: string, color: string, iconColor?: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group w-full outline-none">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", color)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </button>
  )
}