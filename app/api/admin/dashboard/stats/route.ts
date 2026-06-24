import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseClientWithToken } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const successStatuses = new Set(['success', 'successful', 'confirmed', 'paid']);

type StudentRow = {
  id: number;
  auth_id: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  track: string | null;
  created_at: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires_at?: string | null;
  has_completed_onboarding?: boolean | null;
  tasks_completed: number | null;
  progress_percentage: number | null;
  average_score: number | null;
};

type PaymentRow = {
  amount: number | string | null;
  created_at: string | null;
  confirmed_at?: string | null;
  payment_status: string | null;
  role: string | null;
  track: string | null;
  subscription_plan: string | null;
  full_name: string | null;
  email: string | null;
};

const getDays = (timeRange: string) => {
  if (timeRange === '30days') return 30;
  if (timeRange === '90days') return 90;
  if (timeRange === '12months') return 365;
  return 7;
};

const isValidDateInput = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

const getDateWindow = (searchParams: URLSearchParams) => {
  const startParam = searchParams.get('startDate');
  const endParam = searchParams.get('endDate');
  let startDate: Date;
  let endDate: Date;

  if (isValidDateInput(startParam) && isValidDateInput(endParam)) {
    startDate = new Date(`${startParam}T00:00:00.000Z`);
    endDate = new Date(`${endParam}T23:59:59.999Z`);

    if (startDate > endDate) {
      const previousStart = startDate;
      startDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
      endDate = new Date(Date.UTC(previousStart.getUTCFullYear(), previousStart.getUTCMonth(), previousStart.getUTCDate(), 23, 59, 59, 999));
    }
  } else {
    const days = getDays(searchParams.get('timeRange') || '30days');
    endDate = new Date();
    endDate.setUTCHours(23, 59, 59, 999);
    startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    startDate.setUTCHours(0, 0, 0, 0);
  }

  const startDay = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const endDay = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  const days = Math.max(1, Math.floor((endDay - startDay) / 86400000) + 1);

  return {
    startDate,
    endDate,
    days,
    startDateIso: startDate.toISOString(),
    endDateIso: endDate.toISOString(),
  };
};

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const isActiveStudent = (student: StudentRow) => {
  const status = normalize(student.subscription_status);
  if (status !== 'active') return false;

  if (!student.subscription_expires_at) {
    return Boolean(student.has_completed_onboarding);
  }

  return new Date(student.subscription_expires_at).getTime() >= Date.now();
};

const matchesStudentFilters = (
  student: StudentRow,
  filters: { track: string; plan: string; status: string },
) => {
  const track = normalize(student.track);
  const plan = normalize(student.subscription_plan);
  const status = normalize(student.subscription_status);

  const matchesTrack = filters.track === 'all' || track === normalize(filters.track);
  const matchesPlan = filters.plan === 'all' || plan === normalize(filters.plan);
  const matchesStatus =
    filters.status === 'all' ||
    (filters.status === 'active' && isActiveStudent(student)) ||
    (filters.status === 'inactive' && !isActiveStudent(student)) ||
    (filters.status === 'trial' && plan === 'trial') ||
    (filters.status === 'paid' && plan !== 'trial') ||
    status === normalize(filters.status);

  return matchesTrack && matchesPlan && matchesStatus;
};

const buildSeries = (
  window: ReturnType<typeof getDateWindow>,
  rows: Array<{ created_at?: string | null; amount?: number | string | null }>,
  valueKey?: 'amount',
) => {
  const series = new Array(window.days).fill(0);
  const startDay = Date.UTC(
    window.startDate.getUTCFullYear(),
    window.startDate.getUTCMonth(),
    window.startDate.getUTCDate(),
  );

  rows.forEach((row) => {
    if (!row.created_at) return;
    const date = new Date(row.created_at);
    const dateStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const diffDays = Math.floor((dateStart - startDay) / 86400000);
    if (diffDays < 0 || diffDays >= window.days) return;

    series[diffDays] += valueKey ? Number(row[valueKey] || 0) : 1;
  });

  if (window.days <= 14) return series;

  const chunkSize = Math.ceil(window.days / 14);
  const downsampled: number[] = [];
  for (let index = 0; index < series.length; index += chunkSize) {
    downsampled.push(series.slice(index, index + chunkSize).reduce((sum, value) => sum + value, 0));
  }
  return downsampled;
};

const toCurrencyNumber = (value: number | string | null | undefined) => Number(value || 0);

const formatActivityTime = (value?: string | null) => {
  if (!value) return 'Unknown time';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createSupabaseClientWithToken(token);
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let supabase = supabaseAdmin;

    if (!supabase) {
      supabase = authClient;
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database access not available.' }, { status: 500 });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dateWindow = getDateWindow(searchParams);
    const filters = {
      track: searchParams.get('track') || 'all',
      plan: searchParams.get('plan') || 'all',
      status: searchParams.get('status') || 'all',
    };

    const { data: students, error: studentError } = await supabase
      .from('users')
      .select(`
        id,
        auth_id,
        full_name,
        email,
        role,
        track,
        created_at,
        subscription_status,
        subscription_plan,
        subscription_expires_at,
        has_completed_onboarding,
        tasks_completed,
        progress_percentage,
        average_score
      `)
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (studentError) throw studentError;

    const allStudents = (students || []) as StudentRow[];
    const filteredStudents = allStudents.filter((student) => matchesStudentFilters(student, filters));
    const studentsInRange = filteredStudents.filter((student) => {
      if (!student.created_at) return false;
      const createdAt = new Date(student.created_at);
      return createdAt >= dateWindow.startDate && createdAt <= dateWindow.endDate;
    });

    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('amount, created_at, confirmed_at, payment_status, role, track, subscription_plan, full_name, email')
      .gte('created_at', dateWindow.startDateIso)
      .lte('created_at', dateWindow.endDateIso)
      .order('created_at', { ascending: false });

    if (paymentError) {
      console.warn('Admin stats payments query failed:', paymentError.message);
    }

    const filteredPayments = ((payments || []) as PaymentRow[]).filter((payment) => {
      const status = normalize(payment.payment_status);
      const track = normalize(payment.track);
      const plan = normalize(payment.subscription_plan);
      const role = normalize(payment.role);

      return (
        successStatuses.has(status) &&
        (!role || role === 'student') &&
        (filters.track === 'all' || track === normalize(filters.track)) &&
        (filters.plan === 'all' || plan === normalize(filters.plan))
      );
    });

    const totalRegisteredStudents = studentsInRange.length;
    const activeStudents = studentsInRange.filter(isActiveStudent).length;
    const totalFreeTrialStudents = studentsInRange.filter((student) => normalize(student.subscription_plan) === 'trial').length;
    const paidStudents = studentsInRange.filter((student) => normalize(student.subscription_plan) !== 'trial').length;
    const letterEligibleStudents = studentsInRange.filter((student) => Number(student.tasks_completed || 0) >= 12).length;
    const courseCompletionRate = totalRegisteredStudents
      ? Number(((letterEligibleStudents / totalRegisteredStudents) * 100).toFixed(1))
      : 0;

    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + toCurrencyNumber(payment.amount), 0);
    const avgScore = studentsInRange.length
      ? Math.round(studentsInRange.reduce((sum, student) => sum + Number(student.average_score || 0), 0) / studentsInRange.length)
      : 0;
    const totalTasksCompleted = studentsInRange.reduce((sum, student) => sum + Number(student.tasks_completed || 0), 0);
    const expiringSoon = filteredStudents.filter((student) => {
      if (!isActiveStudent(student) || !student.subscription_expires_at) return false;
      const diffDays = Math.ceil((new Date(student.subscription_expires_at).getTime() - Date.now()) / 86400000);
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    const recentSignups = studentsInRange.slice(0, 5).map((student) => ({
      type: 'signup',
      user: student.full_name || student.email || 'New student',
      action: `joined ${student.track || 'the student program'}`,
      time: formatActivityTime(student.created_at),
      timestamp: student.created_at ? new Date(student.created_at).getTime() : 0,
      tone: 'blue',
    }));

    const recentPayments = filteredPayments.slice(0, 5).map((payment) => ({
      type: 'payment',
      user: payment.full_name || payment.email || 'Student payment',
      action: `paid ${toCurrencyNumber(payment.amount).toLocaleString('en-NG')} NGN`,
      time: formatActivityTime(payment.confirmed_at || payment.created_at),
      timestamp: new Date(payment.confirmed_at || payment.created_at || 0).getTime(),
      tone: 'green',
    }));

    const recentMilestones = studentsInRange
      .filter((student) => Number(student.tasks_completed || 0) >= 12)
      .slice(0, 5)
      .map((student) => ({
        type: 'milestone',
        user: student.full_name || student.email || 'Student',
        action: 'became eligible for the work reference letter',
        time: formatActivityTime(student.created_at),
        timestamp: student.created_at ? new Date(student.created_at).getTime() : 0,
        tone: 'purple',
      }));

    const activityItems = [...recentPayments, ...recentSignups, ...recentMilestones]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);

    return NextResponse.json({
      filters,
      dateRange: {
        startDate: dateWindow.startDateIso.slice(0, 10),
        endDate: dateWindow.endDateIso.slice(0, 10),
      },
      totalRegisteredStudents,
      activeStudents,
      totalFreeTrialStudents,
      paidStudents,
      totalRevenue,
      courseCompletionRate,
      letterEligibleStudents,
      letterDownloadsTracked: false,
      avgScore,
      totalTasksCompleted,
      expiringSoon,
      chartData: {
        signups: buildSeries(dateWindow, studentsInRange),
        active: buildSeries(dateWindow, studentsInRange.filter(isActiveStudent)),
        freeTrial: buildSeries(dateWindow, studentsInRange.filter((student) => normalize(student.subscription_plan) === 'trial')),
        revenue: buildSeries(dateWindow, filteredPayments, 'amount'),
        completions: buildSeries(dateWindow, studentsInRange.filter((student) => Number(student.tasks_completed || 0) >= 12)),
      },
      activityItems,
    });
  } catch (error: unknown) {
    console.error('Admin Stats API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
