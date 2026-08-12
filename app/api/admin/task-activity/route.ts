import { NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const PAGE_SIZE = 30;
const eventTypes = new Set(['task_generated', 'task_generated_manually', 'task_submitted', 'task_submission_failed', 'task_graded']);
const platformTracks = ['cyber-security', 'data-analytics', 'digital-marketing'] as const;
type DateRange = 'today' | 'yesterday' | '7d' | '30d' | 'all';

function getDateRange(range: DateRange) {
  if (range === 'all') return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value || '';
  const today = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00+01:00`);
  const end = new Date(today);
  if (range === 'today') end.setDate(end.getDate() + 1);
  const start = new Date(end);
  if (range === 'today') start.setDate(start.getDate() - 1);
  if (range === 'yesterday') {
    end.setDate(end.getDate() - 1);
    start.setDate(start.getDate() - 2);
  }
  if (range === '7d') start.setDate(start.getDate() - 7);
  if (range === '30d') start.setDate(start.getDate() - 30);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function verifyAdmin(request: Request) {
  const supabaseServer = createSupabaseClientFromRequest(request);
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
  if (authError || !user) return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: adminUser, error: adminError } = await supabaseAdmin.from('users').select('role').eq('auth_id', user.id).maybeSingle();
  if (adminError || adminUser?.role !== 'admin') {
    return { ok: false as const, response: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType') || 'all';
    const track = searchParams.get('track') || 'all';
    const search = (searchParams.get('search') || '').trim();
    const requestedRange = searchParams.get('dateRange') || '30d';
    const dateRange: DateRange = ['today', 'yesterday', '7d', '30d', 'all'].includes(requestedRange) ? requestedRange as DateRange : '30d';
    const page = Math.max(Number(searchParams.get('page') || '0'), 0);
    const dates = getDateRange(dateRange);

    if (track !== 'all' && !platformTracks.includes(track as typeof platformTracks[number])) {
      return NextResponse.json({ error: 'Invalid track filter.' }, { status: 400 });
    }

    let activitiesQuery = supabaseAdmin
      .from('task_activity')
      .select('id, user_id, task_id, event_type, week, attempt_number, status, score, message, created_at, student:users!task_activity_user_id_fkey!inner(id, full_name, email, track, avatar_url), task:tasks!task_activity_task_id_fkey(id, title, task_number, task_track, status, created_at)', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (dates) activitiesQuery = activitiesQuery.gte('created_at', dates.start).lt('created_at', dates.end);
    if (eventTypes.has(eventType)) activitiesQuery = activitiesQuery.eq('event_type', eventType);
    if (track !== 'all') activitiesQuery = activitiesQuery.eq('student.track', track);
    if (search) activitiesQuery = activitiesQuery.ilike('student.full_name', `%${search}%`);

    const { data: activities, count, error: activitiesError } = await activitiesQuery.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (activitiesError) throw activitiesError;

    const selectedEventType = eventTypes.has(eventType) ? eventType : null;
    const countEvents = async (type?: string) => {
      if (selectedEventType && type && type !== selectedEventType) return 0;

      let query = supabaseAdmin
        .from('task_activity')
        .select('id, student:users!task_activity_user_id_fkey!inner(id, full_name, track)', { count: 'exact', head: true });
      if (dates) query = query.gte('created_at', dates.start).lt('created_at', dates.end);
      if (type || selectedEventType) query = query.eq('event_type', type || selectedEventType);
      if (track !== 'all') query = query.eq('student.track', track);
      if (search) query = query.ilike('student.full_name', `%${search}%`);
      const { count: eventCount, error } = await query;
      if (error) throw error;
      return eventCount || 0;
    };

    let manualWatchQuery = supabaseAdmin
      .from('task_activity')
      .select('user_id, student:users!task_activity_user_id_fkey!inner(id, full_name, track, avatar_url)')
      .eq('event_type', 'task_generated_manually');
    if (dates) manualWatchQuery = manualWatchQuery.gte('created_at', dates.start).lt('created_at', dates.end);
    if (track !== 'all') manualWatchQuery = manualWatchQuery.eq('student.track', track);
    if (search) manualWatchQuery = manualWatchQuery.ilike('student.full_name', `%${search}%`);

    const [totalActivities, manualGenerations, successfulSubmissions, submissionFailures, manualWatchResult] = await Promise.all([
      countEvents(), countEvents('task_generated_manually'), countEvents('task_submitted'), countEvents('task_submission_failed'),
      manualWatchQuery.limit(!selectedEventType || selectedEventType === 'task_generated_manually' ? 1000 : 0),
    ]);
    if (manualWatchResult.error) throw manualWatchResult.error;

    type WatchStudent = { id: number; full_name: string | null; track: string | null; avatar_url: string | null };
    type WatchActivity = { user_id: number; student: WatchStudent | WatchStudent[] | null };
    const groupedWatch = new Map<number, { student: WatchStudent | null; count: number }>();
    for (const activity of (manualWatchResult.data || []) as WatchActivity[]) {
      const current = groupedWatch.get(activity.user_id);
      const student = Array.isArray(activity.student) ? activity.student[0] || null : activity.student;
      groupedWatch.set(activity.user_id, { student, count: (current?.count || 0) + 1 });
    }

    const manualGenerationWatch = [...groupedWatch.entries()]
      .map(([userId, value]) => ({ userId, fullName: value.student?.full_name || 'Unknown student', track: value.student?.track || null, avatarUrl: value.student?.avatar_url || null, count: value.count }))
      .filter((student) => student.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    return NextResponse.json({
      activities: activities || [], total: count || 0, page, pageSize: PAGE_SIZE, tracks: platformTracks,
      summary: { totalActivities, manualGenerations, successfulSubmissions, submissionFailures }, manualGenerationWatch,
    });
  } catch (error) {
    console.error('Unable to load task activity:', error);
    return NextResponse.json({ error: 'Unable to load task activity.' }, { status: 500 });
  }
}
