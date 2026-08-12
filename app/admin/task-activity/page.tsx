"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import { Activity, AlertTriangle, Award, CheckCircle2, ClipboardList, FileText, RefreshCw, Search, Send, Upload, Users } from 'lucide-react';
import { AdminHeader } from '@/app/components/admin/AdminHeader';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/contexts/AuthContexts';
import { TaskActivityDetails } from '@/app/components/admin/task-activity/TaskActivityDetails';
import type { ManualGenerationWatchStudent, TaskActivityEventType, TaskActivityItem, TaskActivityResponse } from '@/app/components/admin/task-activity/types';

type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'all';
const platformTracks = ['cyber-security', 'data-analytics', 'digital-marketing'];

const eventPresentation: Record<TaskActivityEventType, { label: string; icon: ElementType; tone: string }> = {
  task_generated: { label: 'Task generated', icon: FileText, tone: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200' },
  task_generated_manually: { label: 'Generated manually', icon: RefreshCw, tone: 'border-violet-400/25 bg-violet-400/10 text-violet-200' },
  task_submitted: { label: 'Task submitted', icon: Upload, tone: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' },
  task_submission_failed: { label: 'Submission failed', icon: AlertTriangle, tone: 'border-rose-400/25 bg-rose-400/10 text-rose-200' },
  task_graded: { label: 'Task graded', icon: Award, tone: 'border-amber-400/25 bg-amber-400/10 text-amber-200' },
};

const trackLabels: Record<string, string> = {
  'cyber-security': 'Cybersecurity',
  'data-analytics': 'Data Analytics',
  'digital-marketing': 'Digital Marketing',
};
const formatTrack = (track?: string | null) => track ? trackLabels[track] || track : 'Unassigned track';

const relativeTime = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const summaryThemes = {
  cyan: { shell: 'border-cyan-400/25 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_45%),linear-gradient(135deg,rgba(16,32,51,1),rgba(8,47,73,0.72))]', icon: 'border-cyan-300/25 bg-cyan-400/15 text-cyan-100', accent: 'from-cyan-400 to-blue-500' },
  violet: { shell: 'border-violet-400/25 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_45%),linear-gradient(135deg,rgba(16,32,51,1),rgba(76,29,149,0.65))]', icon: 'border-violet-300/25 bg-violet-400/15 text-violet-100', accent: 'from-violet-400 to-fuchsia-500' },
  emerald: { shell: 'border-emerald-400/25 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_45%),linear-gradient(135deg,rgba(16,32,51,1),rgba(6,78,59,0.68))]', icon: 'border-emerald-300/25 bg-emerald-400/15 text-emerald-100', accent: 'from-emerald-400 to-teal-500' },
  rose: { shell: 'border-rose-400/25 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.18),transparent_45%),linear-gradient(135deg,rgba(16,32,51,1),rgba(136,19,55,0.58))]', icon: 'border-rose-300/25 bg-rose-400/15 text-rose-100', accent: 'from-rose-300 to-pink-500' },
};

function SummaryCard({ title, value, icon: Icon, theme }: { title: string; value: number; icon: ElementType; theme: keyof typeof summaryThemes }) {
  const selectedTheme = summaryThemes[theme];
  return <Card className={`relative overflow-hidden border shadow-sm ${selectedTheme.shell}`}><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${selectedTheme.accent}`} /><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p><p className="mt-3 text-2xl font-bold text-foreground">{value.toLocaleString()}</p></div><div className={`rounded-lg border p-2.5 ${selectedTheme.icon}`}><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-xs text-muted-foreground">For the selected date range</p></CardContent></Card>;
}

function FeedItem({ activity, onClick }: { activity: TaskActivityItem; onClick: () => void }) {
  const presentation = eventPresentation[activity.event_type];
  const Icon = presentation.icon;
  const metadata = [
    activity.student?.track ? formatTrack(activity.student.track) : null,
    activity.attempt_number != null ? `Attempt ${activity.attempt_number}` : null,
    activity.score != null ? `${activity.score}%` : null,
  ].filter(Boolean);

  return <button type="button" onClick={onClick} className="group relative w-full border-b border-border/40 px-4 py-4 text-left transition duration-200 hover:bg-white/[0.045] focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
    <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-transparent transition group-hover:bg-cyan-300" /><div className="flex gap-3"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ${presentation.tone}`}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><p className="text-sm font-medium leading-6 text-foreground transition group-hover:text-cyan-50">{activity.message}</p><time className="shrink-0 text-xs text-muted-foreground">{relativeTime(activity.created_at)}</time></div><div className="mt-2 flex flex-wrap gap-2">{metadata.map((value) => <Badge key={value} variant="outline" className="border-border/50 bg-white/[0.03] text-muted-foreground">{value}</Badge>)}{activity.status === 'failed' && <Badge variant="outline" className="border-rose-400/25 bg-rose-400/10 text-rose-200">Failed</Badge>}</div></div></div>
  </button>;
}

export default function TaskActivityPage() {
  const { authenticatedFetch, isAuthenticated, isLoading: authLoading } = useAuth();
  const [eventType, setEventType] = useState('all');
  const [track, setTrack] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activities, setActivities] = useState<TaskActivityItem[]>([]);
  const [summary, setSummary] = useState<TaskActivityResponse['summary']>({ totalActivities: 0, manualGenerations: 0, successfulSubmissions: 0, submissionFailures: 0 });
  const [watch, setWatch] = useState<ManualGenerationWatchStudent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<TaskActivityItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadActivities = useCallback(async (nextPage = 0, append = false) => {
    if (authLoading || !isAuthenticated) return;
    if (append) setLoadingMore(true); else setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ eventType, track, dateRange, search: debouncedSearch, page: String(nextPage) });
      const response = await authenticatedFetch(`/api/admin/task-activity?${params.toString()}`);
      if (!response.ok) throw new Error('Unable to load task activity.');
      const data = await response.json() as TaskActivityResponse;
      setActivities((current) => append ? [...current, ...data.activities] : data.activities);
      setSummary(data.summary);
      setWatch(data.manualGenerationWatch);
      setTotal(data.total);
      setPage(nextPage);
    } catch (fetchError) {
      console.error('Unable to load task activity:', fetchError);
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [authLoading, authenticatedFetch, dateRange, debouncedSearch, eventType, isAuthenticated, track]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadActivities(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadActivities]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const channel = supabase.channel('admin-task-activity-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_activity' }, () => { void loadActivities(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [authLoading, isAuthenticated, loadActivities]);

  const hasMore = activities.length < total;
  const dateLabel = useMemo(() => ({ today: 'today', yesterday: 'yesterday', '7d': 'in the last 7 days', '30d': 'in the last 30 days', all: 'across all time' }[dateRange]), [dateRange]);

  return <>
    <AdminHeader title="Task Activity" subtitle="Monitor task generation, submissions and AI grading activity." />
    <main className="p-4 md:p-6">
      <section className="relative mb-6 overflow-hidden rounded-xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.15),transparent_36%),linear-gradient(135deg,rgba(16,32,51,0.98),rgba(9,20,35,0.94))] p-5 shadow-sm">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100"><Activity className="h-3.5 w-3.5" />Live operations monitor</div><h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Student task activity</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">Investigate task delivery, submissions, technical failures, and AI evaluation as they happen.</p></div><div className="rounded-lg border border-white/10 bg-black/10 px-4 py-3 backdrop-blur-sm"><p className="text-xs uppercase tracking-wider text-muted-foreground">Showing</p><p className="mt-1 text-sm font-medium text-cyan-100">{total.toLocaleString()} activity records</p></div></div>
      </section>

      <div className="mb-6 rounded-xl border border-border/30 bg-[linear-gradient(135deg,rgba(16,32,51,0.96),rgba(12,24,40,0.94))] p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200"><Search className="h-4 w-4" /></div><div><p className="text-sm font-semibold">Refine activity</p><p className="text-xs text-muted-foreground">Filters work together; newest matching activity appears first.</p></div></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div><p className="mb-1.5 text-xs text-muted-foreground">Activity type</p><Select value={eventType} onValueChange={setEventType}><SelectTrigger className="border-border/40 bg-[#102033]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Activities</SelectItem>{Object.entries(eventPresentation).map(([value, item]) => <SelectItem key={value} value={value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div><p className="mb-1.5 text-xs text-muted-foreground">Track</p><Select value={track} onValueChange={setTrack}><SelectTrigger className="border-border/40 bg-[#102033]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Tracks</SelectItem>{platformTracks.map((item) => <SelectItem key={item} value={item}>{formatTrack(item)}</SelectItem>)}</SelectContent></Select></div>
          <div><p className="mb-1.5 text-xs text-muted-foreground">Date</p><Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}><SelectTrigger className="border-border/40 bg-[#102033]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="yesterday">Yesterday</SelectItem><SelectItem value="7d">Last 7 days</SelectItem><SelectItem value="30d">Last 30 days</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent></Select></div>
          <div><p className="mb-1.5 text-xs text-muted-foreground">Search student</p><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name" className="border-border/40 bg-[#102033] pl-9" /></div></div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Activities" value={summary.totalActivities} icon={Activity} theme="cyan" />
        <SummaryCard title="Manual Generations" value={summary.manualGenerations} icon={RefreshCw} theme="violet" />
        <SummaryCard title="Successful Submissions" value={summary.successfulSubmissions} icon={CheckCircle2} theme="emerald" />
        <SummaryCard title="Submission Failures" value={summary.submissionFailures} icon={AlertTriangle} theme="rose" />
      </section>

      {watch.length > 0 && <section className="mt-5 rounded-xl border border-violet-400/20 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_42%),linear-gradient(135deg,rgba(76,29,149,0.2),rgba(12,24,40,0.94))] p-4 shadow-sm"><div className="flex items-center gap-2"><div className="rounded-md border border-violet-400/25 bg-violet-400/10 p-2"><Users className="h-4 w-4 text-violet-100" /></div><div><h2 className="text-sm font-semibold">Manual Generation Watch</h2><p className="text-xs text-muted-foreground">Students with multiple manual task generations {dateLabel}.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{watch.map((student) => <button type="button" key={student.userId} onClick={() => setSearch(student.fullName)} className="rounded-lg border border-violet-400/20 bg-violet-400/10 px-3 py-2 text-left text-xs shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-400/20"><span className="font-semibold text-violet-100">{student.fullName}</span><span className="ml-2 text-violet-200/80">{student.count} manual generations</span></button>)}</div></section>}

      <section className="mt-6 overflow-hidden rounded-xl border border-border/40 bg-[linear-gradient(135deg,rgba(16,32,51,0.98),rgba(10,22,37,0.96))] shadow-lg shadow-black/10"><div className="flex items-center justify-between border-b border-border/40 bg-white/[0.025] px-4 py-3.5"><div className="flex items-center gap-2"><div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-1.5"><ClipboardList className="h-4 w-4 text-cyan-100" /></div><div><h2 className="text-sm font-semibold">Activity Feed</h2><p className="text-xs text-muted-foreground">Select any item to inspect its full context.</p></div></div><p className="text-xs text-muted-foreground">{total.toLocaleString()} records</p></div>
        {loading ? <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-md bg-white/[0.05]" />)}</div>
          : error ? <div className="flex flex-col items-center gap-3 px-4 py-14 text-center"><AlertTriangle className="h-6 w-6 text-rose-300" /><p className="text-sm text-muted-foreground">Unable to load task activity.</p><Button size="sm" onClick={() => void loadActivities()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div>
          : activities.length === 0 ? <div className="px-4 py-14 text-center text-sm text-muted-foreground">No activity found for the selected filters.</div>
          : <>{activities.map((activity) => <FeedItem key={activity.id} activity={activity} onClick={() => setSelectedActivity(activity)} />)}{hasMore && <div className="p-4 text-center"><Button variant="outline" onClick={() => void loadActivities(page + 1, true)} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more'}<Send className="ml-2 h-3.5 w-3.5" /></Button></div>}</>}
      </section>
    </main>
    <TaskActivityDetails activity={selectedActivity} onOpenChange={(open) => { if (!open) setSelectedActivity(null); }} />
  </>;
}
