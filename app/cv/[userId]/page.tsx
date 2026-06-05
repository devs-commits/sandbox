import { supabaseAdmin } from "@/lib/supabase-admin"
import { notFound } from "next/navigation"
import { Badge } from "@/app/components/ui/badge"
import { ShieldCheck, Clock, FileText } from "lucide-react"
import ReactMarkdown from "react-markdown"

export const revalidate = 0
// 🔥 CRITICAL: Prevents Vercel from timing out the AI generation request
export const maxDuration = 60 

async function getCVData(userId: string) {
  if (!supabaseAdmin) return null

  // 1. Fetch User
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("auth_id", userId)
    .single()

  let finalUser = user

  if (userError || !user) {
    const { data: userById, error: userByIdError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (userByIdError || !userById) return null
    finalUser = userById
  }

  // 2. Fetch Completed Tasks
  const { data: tasks } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("user", userId)
    .eq("completed", true)

  const completedTasks = tasks || []

  // 3. Fetch Sola's Feedback for those tasks
  const feedbacks: Record<string, string> = {}
  for (const t of completedTasks) {
    const { data: sub } = await supabaseAdmin
      .from("submissions")
      .select("ai_feedback")
      .eq("task_id", t.id)
      .single()
    if (sub?.ai_feedback) feedbacks[t.id] = sub.ai_feedback
  }

  return {
    user: finalUser,
    tasks: completedTasks,
    feedbacks
  }
}

export default async function PublicCVPage(
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const data = await getCVData(userId)

  if (!data) return notFound()

  const { user, tasks, feedbacks } = data

  // ==========================================
  // SAFEGUARD: 0 TASKS COMPLETED STATE
  // ==========================================
  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10 sm:p-14 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <Clock className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">Portfolio in Progress</h1>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            <strong>{user.full_name || "This candidate"}</strong> has recently enrolled in the WDC Labs Virtual Office program and is actively working on their first set of industry simulations.
          </p>
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl text-blue-900 text-sm font-medium shadow-sm">
            Please check back later! Once they successfully pass their first technical review, Coach Kemi (AI) will automatically generate their verified, ATS-ready resume here.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NORMAL RESUME GENERATION (1+ TASKS)
  // ==========================================
  let resumeContent = ""
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    const res = await fetch(`${backendUrl}/generate-cv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.auth_id,
        user_name: user.full_name,
        track: user.track,
        tasks: tasks,
        feedback: Object.entries(feedbacks).map(([k, v]) => ({ task_id: Number(k), feedback: v }))
      }),
    })
    
    if (res.ok) {
      const apiData = await res.json()
      resumeContent = apiData.cv_content || apiData.resume
    }
  } catch (error) {
    console.error("Failed to fetch AI resume, falling back to basic layout.")
  }

  // Fallback Generation if Python server is sleeping
  if (!resumeContent) {
    const trackString = (user.track || 'General').toUpperCase()
    resumeContent = `
# ${user.full_name || "WDC Candidate"}
**${trackString} PROFESSIONAL**

---

### PROFESSIONAL SUMMARY
Dedicated and practical professional with hands-on simulated experience in ${trackString}. Successfully completed ${tasks.length} rigorous industry-standard technical tasks at WDC Labs, demonstrating a strong ability to solve real-world business problems and deliver actionable results.

### PROFESSIONAL EXPERIENCE
**WDC Labs** | *Virtual ${user.track || ''} Intern*
*Completed intensive, real-world task simulations graded by AI technical supervisors.*

${tasks.map((t: any) => `* **${t.title}**: ${t.brief_content.substring(0, 120)}...`).join('\n')}

### CORE COMPETENCIES
* Practical Problem Solving
* Technical Execution
* Project Delivery
* Cross-functional Communication
`
  }

  return (
    <div className="min-h-screen bg-[#0f172a] py-12 px-4 sm:px-6 font-sans">
      
      {/* Platform Header */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">
            WDC <span className="text-purple-500">Labs</span>
            </h1>
            <p className="text-slate-400 text-sm">Official Candidate Verification Record</p>
        </div>
        <div className="flex gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full uppercase tracking-widest text-xs font-bold">
            Verified Profile
            </Badge>
        </div>
      </div>

      {/* THE RESUME PAPER (This is what recruiters see/print) */}
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-sm overflow-hidden print:shadow-none print:m-0 print:p-0">
        
        {/* Verification Banner */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-8 py-3 flex items-center justify-center gap-3 print:hidden">
          <ShieldCheck className="text-emerald-600 w-5 h-5 shrink-0" />
          <p className="text-emerald-800 text-sm font-medium text-center">
            <strong>Authenticity Verified:</strong> Experience & skills generated directly from cryptographically logged task completions at WDC Labs.
          </p>
        </div>

        {/* Dynamic Markdown Resume Content */}
        <div className="p-10 sm:p-16">
          <div className="prose prose-slate max-w-none
            prose-headings:text-slate-900 
            prose-h1:text-4xl prose-h1:font-black prose-h1:mb-2 prose-h1:text-center
            prose-h2:text-2xl prose-h2:font-bold prose-h2:text-center prose-h2:text-slate-500 prose-h2:mb-8
            prose-h3:text-lg prose-h3:font-bold prose-h3:border-b-2 prose-h3:border-slate-800 prose-h3:pb-2 prose-h3:mt-8 prose-h3:uppercase
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-li:text-slate-700 prose-li:marker:text-slate-400
            prose-strong:text-slate-900
            prose-a:text-purple-600">
            <ReactMarkdown>{resumeContent}</ReactMarkdown>
          </div>
        </div>

      </div>

      <footer className="max-w-4xl mx-auto mt-12 text-center print:hidden">
        <p className="text-slate-500 text-sm">
          Want to hire this candidate? <a href="mailto:hello@wdc.ng" className="text-purple-400 hover:text-purple-300 underline">Contact WDC Labs</a>
        </p>
      </footer>
    </div>
  )
}