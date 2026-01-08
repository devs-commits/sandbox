
import { supabaseAdmin } from "@/lib/supabase-admin"
import { notFound } from "next/navigation"
import { Badge } from "@/app/components/ui/badge"
import { Briefcase, CheckCircle2, Award, Calendar, Ghost } from "lucide-react"

export const revalidate = 0 // Disable caching for realtime updates

async function getCVData(userId: string) {
    if (!supabaseAdmin) return null

    // Fetch User
    const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', userId) // Assuming auth_id links to auth.users.id or id is the main key
        .single()

    if (userError || !user) {
        // Try fetching by 'id' if 'auth_id' fails (depending on schema)
        const { data: userById, error: userByIdError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (userByIdError || !userById) return null
        return { user: userById, tasks: [] }
    }

    // Fetch Completed Tasks
    const { data: tasks, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user', userId) // Task table uses 'user' column for user_id
        .eq('completed', true)

    return {
        user,
        tasks: tasks || []
    }
}

export default async function PublicCVPage({ params }: { params: { userId: string } }) {
    const data = await getCVData(params.userId)

    if (!data) {
        return notFound()
    }

    const { user, tasks } = data
    const verifiedSkills = Array.from(new Set(tasks.map((t: any) => t.task_track))).map(track => ({
        name: (track as string).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        verified: true
    }))

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-b border-slate-800 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                                <Briefcase className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">{user.full_name || 'WDC Intern'}</h1>
                                <p className="text-slate-400 font-medium">WDC Virtual Office Intern • {user.track || 'General'}</p>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-[#06b6d4] text-[#06b6d4] px-4 py-1 rounded-full uppercase tracking-widest text-xs font-bold bg-[#06b6d4]/10">
                        Verified Profile
                    </Badge>
                </header>

                {/* Bio */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Ghost className="text-[#a855f7]" size={20} />
                        Professional Summary
                    </h2>
                    <p className="text-slate-400 leading-relaxed max-w-2xl">
                        {user.bio || "Currently completing the WDC Virtual Office Internship program, gaining practical experience in a simulated professional environment using AI-driven workflows."}
                    </p>
                </section>

                {/* Skills */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="text-[#22c55e]" size={20} />
                        Verified Skills
                    </h2>
                    {verifiedSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {verifiedSkills.map((skill) => (
                                <Badge
                                    key={skill.name}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-none px-3 py-1.5"
                                >
                                    {skill.name}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">No skills verified yet.</p>
                    )}
                </section>

                {/* Work History / Simulations */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                        <Award className="text-[#f59e0b]" size={20} />
                        Completed Simulations
                    </h2>

                    <div className="space-y-6">
                        {tasks.length > 0 ? tasks.map((task: any) => (
                            <div key={task.id} className="relative pl-8 border-l border-slate-800 pb-6 last:pb-0">
                                <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-600 ring-4 ring-[#0f172a]" />
                                <div className="space-y-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <h3 className="font-medium text-white text-lg">{task.title}</h3>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date().getFullYear()}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed">{task.brief_content}</p>
                                    {task.difficulty && (
                                        <Badge variant="secondary" className="mt-2 text-xs bg-slate-800 text-slate-300">
                                            {task.difficulty}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-slate-500 italic">No simulations completed yet.</div>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-12 border-t border-slate-800 text-center">
                    <p className="text-slate-600 text-sm">
                        Generated by WDC Labs Virtual Office • <a href="https://wdc.ng" className="text-slate-500 hover:text-white transition-colors underline decoration-slate-700">wdc.ng</a>
                    </p>
                </footer>

            </div>
        </div>
    )
}
