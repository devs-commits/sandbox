import { StudentHeader } from "../../components/students/StudentHeader";    
import { Button } from "../../components/ui/button";
import { FileText, Clock, Eye, User, ArrowRight, Download, Flame } from "lucide-react";

const tasks = [
  {
    id: 1,
    category: "PERFORMANCE MARKETING",
    categoryColor: "bg-purple-600",
    level: "EXPERT",
    levelColor: "bg-purple-600",
    title: "Scenario: ROAS Crash Analysis",
    description: "Our Facebook Ad ROAS dropped from 4.0 to 1.2yesterday. I've attached the campaign export CSV. Identify the bleeding ad set and write a 1-...",
    assets: "2 Data Files",
  },
  {
    id: 2,
    category: "CRO & UX",
    categoryColor: "bg-gray-600",
    level: "EXPERT",
    levelColor: "bg-purple-600",
    title: "Fix the Funnel: Cart Abandonment",
    description: "60% of traffic drops off at the 'Shipping' page. Audit the UX screenshot provided. Propose 3 specific CRO changes to recover revenue.",
    assets: "1 Data Files",
  },
  {
    id: 3,
    category: "PR & COMMS",
    categoryColor: "bg-gray-600",
    level: "Hard",
    levelColor: "bg-red-500",
    title: "Crisis Comms: Server Outage",
    description: "App is down. Twitter is toxic. Draft a push notification that apologizes without admitting liability, and a thread for the CEO.",
    assets: "No Assets",
  },
];

export default function page() {
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
              <span className="text-sm font-semibold text-muted-foreground">14/24</span>
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
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileText className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary">Work and Visa Reference Letters</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Maintain your 12-weeks active streak to unlock verified immigration references. Missing a payment resets streak.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
              <Flame size={14} />
              14 DAY STREAK
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }} />
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
                  <p className="text-sm font-semibold text-foreground">WORK LETTER OF REFERENCE</p>
                  <p className="text-xs text-orange-500">Available after 12 weeks</p>
                </div>
              </div>
              <Button size="sm" disabled className="bg-primary/50 text-primary-foreground/50 cursor-not-allowed blur-[1px]">
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
                  <p className="text-sm font-semibold text-foreground">VISA LETTER OF REFERENCE</p>
                  <p className="text-xs text-orange-500">Available after 12 weeks</p>
                </div>
              </div>
              <Button size="sm" disabled className="bg-primary/50 text-primary-foreground/50 cursor-not-allowed blur-[1px]">
                <Download size={14} className="mr-1" />
                Download Letter
              </Button>
            </div>
          </div>
        </div>

        {/* My Tasks */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">My Tasks (3)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`${task.categoryColor} text-white text-xs px-2 py-0.5 rounded`}>
                    {task.category}
                  </span>
                  <span className={`${task.levelColor} text-white text-xs px-2 py-0.5 rounded ml-auto`}>
                    {task.level}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-2">{task.title}</h3>
                <p className="text-xs text-muted-foreground flex-1 mb-4">{task.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText size={14} />
                    <span className="text-xs">{task.assets}</span>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};