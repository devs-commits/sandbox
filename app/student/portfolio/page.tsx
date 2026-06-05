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
  Wand2, Lock, Share2, CheckCircle2, Copy, Link as LinkIcon,
  Instagram, Facebook, Linkedin, Mail, Twitter, MessageCircle, Send,
  Loader2, Target, TrendingUp, Trophy, Star, Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: number;
  title: string;
  brief_content: string;
  difficulty: string;
  task_track: string;
  completed: boolean;
  status?: string;
}

export default function PortfolioPage() {
  const { user } = useAuth()
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [feed, setFeed] = useState<{ [key: number]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [resumeContent, setResumeContent] = useState("")
  const [isGeneratingResume, setIsGeneratingResume] = useState(false)

  // Metrics State
  const [metrics, setMetrics] = useState({
  currentTask: "Awaiting Assignment...",
  currentLevel: (user as any)?.user_level || "Junior Intern",
  tasksCompleted: 0,
  masteryScore: 0,
  averageScore: 0,
  ratings: { excellent: 0, good: 0, pass: 0 }
})

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user', user?.id)
        .order('id', { ascending: true })

      if (taskError) throw taskError

      const allTasks = taskData || []
      const completed = allTasks.filter(t => t.completed || t.status === 'approved' || t.status === 'passed')
      const active = allTasks.find(t => !t.completed && t.status !== 'approved' && t.status !== 'passed')

      setTasks(completed)

      const { data: userData } = await supabase
        .from('users')
        .select('average_score, user_level')
        .eq('auth_id', user?.id)
        .single()

      const excellentCount = Math.floor(completed.length * 0.4)
      const goodCount = Math.floor(completed.length * 0.5)
      const passCount = completed.length - excellentCount - goodCount

      setMetrics({
        currentTask: active ? active.title : "All caught up!",
        currentLevel: userData?.user_level || (user as any)?.user_level || "Junior Intern",
        tasksCompleted: completed.length,
        averageScore: userData?.average_score || 0,
        masteryScore: Math.min(100, (completed.length * 5) + (userData?.average_score || 0) * 0.5),
        ratings: { excellent: excellentCount, good: goodCount, pass: passCount }
      })

      const feedbacks: { [key: number]: string } = {}
      for (const task of completed) {
        const { data: subData } = await supabase
          .from('submissions')
          .select('ai_feedback')
          .eq('task_id', task.id)
          .single();
        if (subData?.ai_feedback) {
          feedbacks[task.id] = subData.ai_feedback;
        }
      }
      setFeed(feedbacks)

    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateResume = async () => {
    if (tasks.length < 1) return
    if (resumeContent) return 

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
      setResumeContent(data.resume || data.error)
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

  const verifiedSkills = Array.from(new Set(tasks.map(t => t.task_track))).map(track => ({
    name: track?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || "General",
    verified: true
  }))

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudentHeader title="Portfolio & Performance" />
      <div className="p-4 lg:p-6 space-y-8 max-w-7xl mx-auto">

        {/* Action Bar */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            onClick={handleGenerateResume}
            disabled={tasks.length < 1}
            className={cn("border-none shadow-none font-medium", tasks.length < 1 ? "bg-slate-800 text-slate-400" : "bg-purple-600 hover:bg-purple-700 text-white")}
          >
            {tasks.length < 1 ? <Lock className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Auto-Generate Resume
          </Button>
          <Button onClick={() => setIsShareOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white border-none shadow-none font-medium">
            <Share2 className="mr-2 h-4 w-4" /> Share Public Link
          </Button>
        </div>

        {/* DASHBOARD METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-bold">Learning Progress</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Current Level</span>
                <p className="text-xl font-bold text-foreground mt-1">{metrics.currentLevel}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Tasks Completed</span>
                <p className="text-xl font-bold text-foreground mt-1">{metrics.tasksCompleted}</p>
              </div>
              <div className="col-span-2 bg-muted/50 p-4 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Active Task</span>
                <p className="text-sm font-semibold text-cyan-400 mt-1 truncate">{metrics.currentTask}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-cyan-500" />
              <h3 className="text-lg font-bold">Performance Metrics</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 bg-muted/50 p-4 rounded-lg border border-border/50 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Average</span>
                <p className="text-3xl font-black text-cyan-400 mt-1">{metrics.averageScore.toFixed(1)}</p>
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-2">
                <div className="bg-muted/50 p-3 rounded-lg border border-border/50 text-center flex flex-col items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-500 mb-1" />
                  <span className="text-[10px] text-muted-foreground uppercase">Excellent</span>
                  <span className="font-bold">{metrics.ratings.excellent}</span>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border border-border/50 text-center flex flex-col items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-500 mb-1" />
                  <span className="text-[10px] text-muted-foreground uppercase">Good</span>
                  <span className="font-bold">{metrics.ratings.good}</span>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg border border-border/50 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mb-1" />
                  <span className="text-[10px] text-muted-foreground uppercase">Pass</span>
                  <span className="font-bold">{metrics.ratings.pass}</span>
                </div>
              </div>
              <div className="col-span-3 bg-gradient-to-r from-purple-900/40 to-cyan-900/40 p-4 rounded-lg border border-purple-500/30 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-bold text-white">Mastery Score</span>
                </div>
                <span className="text-xl font-black text-yellow-400">{metrics.masteryScore.toFixed(0)} / 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Verified Skills</h3>
          {isLoading ? (
             <div className="flex gap-2"><div className="h-8 w-24 bg-slate-800 rounded animate-pulse" /></div>
          ) : verifiedSkills.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {verifiedSkills.map((skill) => (
                <Badge key={skill.name} variant="secondary" className="bg-[#1e293b] text-[#06b6d4] hover:bg-[#1e293b] px-3 py-1.5 text-sm font-medium border border-slate-700/50 rounded-md">
                  <CheckCircle2 className="mr-2 h-4 w-4 text-[#06b6d4]" />
                  {skill.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Complete tasks to verify skills.</p>
          )}
        </div>

        {/* Resume Output Inline */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Generated Resume</h3>
          {isGeneratingResume ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#a855f7]" />
              <p className="text-slate-400">Coach Kemi is writing your resume...</p>
            </div>
          ) : resumeContent ? (
            <div className="prose prose-invert max-w-none bg-[#1e293b] p-6 rounded-xl border border-slate-700">
              <ReactMarkdown>{resumeContent}</ReactMarkdown>
              <div className="flex gap-4 mt-6">
                <Button variant="secondary" onClick={handleCopyResume} className="bg-slate-700 text-white hover:bg-slate-600 border-none min-w-[100px]">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Text
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Click 'Auto-Generate Resume' to create your ATS-ready CV.</p>
          )}
        </div>

        {/* Share Link Modal Restored */}
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
              <ShareOption icon={Send} label="Telegram" color="bg-sky-500" onClick={() => openShare('telegram')} />
              <ShareOption icon={Facebook} label="Facebook" color="bg-blue-600" onClick={() => openShare('facebook')} />
              <ShareOption icon={Instagram} label="Instagram" color="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500" onClick={handleCopyLink} />
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

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