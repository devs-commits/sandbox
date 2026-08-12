"use client";

import { Award, Calendar, CheckCircle, CircleAlert, ClipboardList, Clock3, FileText, Mail, Send, UserRound } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import type { TaskActivityItem } from './types';

const trackLabels: Record<string, string> = {
  'cyber-security': 'Cybersecurity',
  'data-analytics': 'Data Analytics',
  'digital-marketing': 'Digital Marketing',
};

const eventLabels: Record<string, string> = {
  task_generated: 'Task generated',
  task_generated_manually: 'Task generated manually',
  task_submitted: 'Task submitted',
  task_submission_failed: 'Submission failed',
  task_graded: 'Task graded',
};

const formatTrack = (track?: string | null) => track ? trackLabels[track] || track : 'Not specified';
const initials = (name?: string | null) => (name || 'Student').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
const formatTimestamp = (value: string) => new Intl.DateTimeFormat('en-NG', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));

function MetricCard({ icon: Icon, label, value, theme }: { icon: typeof Award; label: string; value: string | number; theme: string }) {
  return <div className={`rounded-lg border bg-gradient-to-br p-4 shadow-sm ${theme}`}><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10"><Icon className="h-5 w-5" /></div><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-foreground">{value}</p></div>;
}

function InfoItem({ icon: Icon, label, value, theme }: { icon: typeof Award; label: string; value: string; theme: string }) {
  return <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/35 p-3 transition hover:border-white/20 hover:bg-background/50"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme}`}><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p></div></div>;
}

export function TaskActivityDetails({ activity, onOpenChange }: { activity: TaskActivityItem | null; onOpenChange: (open: boolean) => void }) {
  if (!activity) return null;

  const studentName = activity.student?.full_name || 'Unknown student';
  const successful = activity.status === 'success';
  const failed = activity.status === 'failed';
  const statusTheme = successful ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : failed ? 'border-rose-500/30 bg-rose-500/10 text-rose-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200';

  return (
    <Dialog open={Boolean(activity)} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-0 top-0 h-dvh w-full max-w-2xl translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-border bg-card p-0 sm:w-[min(46rem,calc(100vw-1rem))]">
        <DialogHeader className="relative border-b border-border bg-[linear-gradient(135deg,rgba(16,32,51,0.98),rgba(12,24,40,0.98))] p-5 pr-12 sm:p-6 sm:pr-14">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-lg font-bold text-white shadow-lg shadow-cyan-950/30">
                {activity.student?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activity.student.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : initials(studentName)}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Activity investigation</p>
              <DialogTitle className="mt-1 text-2xl font-semibold text-foreground">{studentName}</DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span>{activity.student?.email || 'Student activity record'}</span>
                  <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">{formatTrack(activity.student?.track)}</Badge>
                  <Badge variant="outline" className={statusTheme}>{successful ? <CheckCircle className="mr-1 h-3.5 w-3.5" /> : <CircleAlert className="mr-1 h-3.5 w-3.5" />}{activity.status || 'pending'}</Badge>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-4 sm:p-6">
          <section className="rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-background/50 to-violet-500/10 p-4 shadow-sm">
            <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-200"><ClipboardList className="h-5 w-5" /></div><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Activity</p><p className="mt-1 text-sm leading-6 text-foreground">{activity.message}</p></div></div>
          </section>

          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard icon={Calendar} label="Week" value={activity.week ?? activity.task?.task_number ?? '—'} theme="from-cyan-500/25 to-blue-500/10 border-cyan-400/30 text-cyan-200" />
            <MetricCard icon={Send} label="Attempt" value={activity.attempt_number ?? '—'} theme="from-violet-500/25 to-fuchsia-500/10 border-violet-400/30 text-violet-200" />
            <MetricCard icon={Award} label="Score" value={activity.score == null ? '—' : `${activity.score}%`} theme="from-amber-500/25 to-orange-500/10 border-amber-400/30 text-amber-200" />
            <MetricCard icon={successful ? CheckCircle : CircleAlert} label="Status" value={activity.status || 'pending'} theme={successful ? 'from-emerald-500/25 to-teal-500/10 border-emerald-400/30 text-emerald-200' : 'from-rose-500/25 to-pink-500/10 border-rose-400/30 text-rose-200'} />
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Activity record</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem icon={FileText} label="Event type" value={eventLabels[activity.event_type] || activity.event_type} theme="bg-cyan-500/15 text-cyan-300" />
              <InfoItem icon={Clock3} label="Exact timestamp" value={formatTimestamp(activity.created_at)} theme="bg-violet-500/15 text-violet-300" />
              <InfoItem icon={UserRound} label="Student" value={studentName} theme="bg-emerald-500/15 text-emerald-300" />
              <InfoItem icon={Mail} label="Student email" value={activity.student?.email || 'Not available'} theme="bg-amber-500/15 text-amber-300" />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-foreground">Task context</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem icon={FileText} label="Task" value={activity.task?.title || 'Task details unavailable'} theme="bg-violet-500/15 text-violet-300" />
              <InfoItem icon={Calendar} label="Task week" value={`Week ${activity.task?.task_number ?? activity.week ?? '—'}`} theme="bg-cyan-500/15 text-cyan-300" />
              <InfoItem icon={Award} label="Task track" value={formatTrack(activity.task?.task_track || activity.student?.track)} theme="bg-amber-500/15 text-amber-300" />
              <InfoItem icon={ClipboardList} label="Task status" value={activity.task?.status || 'Not available'} theme="bg-emerald-500/15 text-emerald-300" />
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
