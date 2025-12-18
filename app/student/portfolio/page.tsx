"use client"

import { useState } from "react"
import { StudentHeader } from "@/app/components/students/StudentHeader"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
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
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock Data
const verifiedSkills = [
  { name: "Crisis Comms", verified: true },
  { name: "SEO Audit", verified: true },
  { name: "Copy Writing", verified: true },
  { name: "Data Analysis", verified: true },
]

const completedSimulations = [
  { title: "Crisis Management Lvl 1", score: 92, id: 1 },
  { title: "SEO Audit: Jumia", score: 92, id: 2 },
]

export default function PortfolioPage() {
  const [isResumeOpen, setIsResumeOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StudentHeader title="Portfolio" />
      <div className="p-4 lg:p-6 space-y-8 max-w-7xl mx-auto">

        {/* Top Actions */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            onClick={() => setIsResumeOpen(true)}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white border-none shadow-none font-medium"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate Resume
          </Button>
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
        </div>

        {/* Completed Simulations */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">Completed Simulations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedSimulations.map((sim) => (
              <div
                key={sim.id}
                className="bg-card border border-border rounded-xl p-6 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-semibold text-foreground text-lg">{sim.title}</h4>
                  <p className="text-muted-foreground text-sm mt-1">Score: {sim.score}/100</p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-700 bg-transparent text-foreground hover:bg-slate-800 hover:text-white"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Resume Builder Modal */}
        <Dialog open={isResumeOpen} onOpenChange={setIsResumeOpen}>
          <DialogContent className="bg-[#1e293b] border-slate-700 text-white sm:max-w-2xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
            <DialogHeader className="p-6 border-b border-slate-700 flex flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-xl font-semibold">AI Resume Builder</DialogTitle>
              <button 
                onClick={() => setIsResumeOpen(false)}
                className="rounded-full hover:opacity-80 transition-opacity"
              >
                <X className="w-6 h-6 text-red-500" />
              </button>
            </DialogHeader>
            
            <div className="flex-1 p-6 overflow-y-auto bg-[#1e293b]">
              <p className="text-slate-300">
                I&apos;m having a bit of trouble connecting to the AI brain right now. Try again in a moment.
              </p>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-4 justify-end bg-[#0f172a]">
               <Button variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 border-none min-w-[100px]">
                 Copy Text
               </Button>
               <Button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white border-none min-w-[140px]">
                 <Download className="mr-2 h-4 w-4" />
                 Download PDF
               </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Link Modal */}
        <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
          <DialogContent className="bg-[#0f172a] border-slate-800 text-white sm:max-w-md p-0 overflow-hidden [&>button]:hidden">
             <div className="p-6 pb-0">
               <DialogHeader>
                 <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-400 text-left">Share Link To:</DialogTitle>
               </DialogHeader>
             </div>
             <div className="grid grid-cols-4 gap-y-8 gap-x-4 p-6">
                <ShareOption icon={LinkIcon} label="Copy link" color="bg-blue-500" />
                <ShareOption icon={Instagram} label="Instagram" color="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500" />
                <ShareOption icon={MessageCircle} label="Whatsapp" color="bg-green-500" />
                <ShareOption icon={CircleDashed} label="Status" color="bg-green-500" />
                
                <ShareOption icon={Facebook} label="Facebook" color="bg-blue-600" />
                <ShareOption icon={Ghost} label="Snapchat" color="bg-yellow-400" iconColor="text-black" />
                <ShareOption icon={Send} label="Telegram" color="bg-sky-500" />
                <ShareOption icon={Music2} label="Tiktok" color="bg-black border border-slate-700" />

                <ShareOption icon={Linkedin} label="Linkedin" color="bg-blue-700" />
                <ShareOption icon={Mail} label="Email" color="bg-blue-500" />
                <ShareOption icon={AtSign} label="Thread" color="bg-black border border-slate-700" />
                <ShareOption icon={Twitter} label="X" color="bg-black border border-slate-700" />
             </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

function ShareOption({ icon: Icon, label, color, iconColor = "text-white" }: { icon: any, label: string, color: string, iconColor?: string }) {
  return (
    <button className="flex flex-col items-center gap-3 group w-full">
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", color)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </button>
  )
}