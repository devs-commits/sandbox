import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

const editableFields: Record<string, string> = {
  fullName: 'full_name',
  phone: 'phone',
  country: 'country',
  address: 'address',
  dateOfBirth: 'date_of_birth',
  occupation: 'occupation',
  nationality: 'nationality',
  course: 'track',
  skills: 'skills',
  averageScore: 'average_score',
  tasksCompleted: 'tasks_completed',
  progressPercentage: 'progress_percentage',
  walletBalance: 'wallet_balance',
  currentStreak: 'current_streak',
  cvUrl: 'cv_url',
  referralCode: 'referral_code',
  bankName: 'bank_name',
  accountNumber: 'account_number',
  accountName: 'account_name',
  idVerified: 'id_verified',
  bvn: 'bvn',
  nin: 'nin',
  subscriptionStatus: 'subscription_status',
  subscriptionPlan: 'subscription_plan',
  subscriptionExpiresAt: 'subscription_expires_at',
  startDate: 'start_date',
};

const numericFields = new Set([
  'averageScore',
  'tasksCompleted',
  'progressPercentage',
  'walletBalance',
  'currentStreak',
]);

const nullableFields = new Set([
  'phone',
  'country',
  'address',
  'dateOfBirth',
  'occupation',
  'nationality',
  'cvUrl',
  'referralCode',
  'bankName',
  'accountNumber',
  'accountName',
  'bvn',
  'nin',
  'subscriptionExpiresAt',
  'startDate',
]);

const studentSelect = `
  id,
  auth_id,
  full_name,
  email,
  phone,
  country,
  address,
  date_of_birth,
  occupation,
  nationality,
  track,
  skills,
  average_score,
  created_at,
  wallet_balance,
  current_streak,
  last_activity_date,
  cv_url,
  referral_code,
  bank_name,
  account_number,
  account_name,
  id_verified,
  bvn,
  nin,
  tasks_completed,
  progress_percentage,
  subscription_status,
  start_date,
  subscription_plan,
  subscription_expires_at,
  has_completed_onboarding,
  has_completed_tour,
  has_completed_headquarters_tour
`;

type PortfolioRow = {
  id?: string | number;
  skill_tag?: string | null;
  task_track?: string | null;
  bullet_point?: string | null;
  description?: string | null;
  verified_by?: string | null;
  created_at?: string | null;
  url?: string | null;
  link?: string | null;
};

type BadgeRow = {
  id?: string | number;
  badge_name?: string | null;
  name?: string | null;
  earned_in_week?: number | null;
  unlocked_at?: string | null;
};

async function verifyAdmin(request: NextRequest) {
  const supabaseServer = createSupabaseClientFromRequest(request);
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminUser, error: adminError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (adminError || adminUser?.role !== 'admin') {
    return { ok: false as const, response: NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 }) };
  }

  return { ok: true as const };
}

const formatDate = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

async function fetchStudentProfile(authId: string) {
  const { data: student, error: studentError } = await supabaseAdmin
    .from('users')
    .select(studentSelect)
    .eq('auth_id', authId)
    .single();

  if (studentError || !student) {
    return { error: studentError || new Error('Student not found') };
  }

  const [{ count: taskCount }, { data: portfolioItems }, { data: badges }] = await Promise.all([
    supabaseAdmin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user', authId),
    supabaseAdmin
      .from('portfolio_items')
      .select('*')
      .eq('user_id', authId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('user_badges')
      .select('*')
      .eq('user_id', authId)
      .order('unlocked_at', { ascending: false }),
  ]);

  const tasksCompleted = Number(student.tasks_completed ?? taskCount ?? 0);
  const skills = Array.isArray(student.skills)
    ? student.skills
    : typeof student.skills === 'string'
      ? student.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean)
      : [];

  return {
    data: {
      authId: student.auth_id,
      internalId: student.id,
      fullName: student.full_name,
      email: student.email,
      phone: student.phone,
      country: student.country,
      address: student.address,
      dateOfBirth: student.date_of_birth,
      occupation: student.occupation,
      nationality: student.nationality,
      course: student.track,
      joinDate: formatDate(student.created_at),
      createdAt: student.created_at,
      lastActive: student.last_activity_date ? new Date(student.last_activity_date).toLocaleString() : null,
      averageScore: Math.round(Number(student.average_score || 0)),
      tasksCompleted,
      progressPercentage: Number(student.progress_percentage || 0),
      walletBalance: Number(student.wallet_balance || 0),
      currentStreak: Number(student.current_streak || 0),
      skills,
      cvUrl: student.cv_url,
      referralCode: student.referral_code,
      bankName: student.bank_name,
      accountNumber: student.account_number,
      accountName: student.account_name,
      idVerified: Boolean(student.id_verified),
      bvn: student.bvn,
      nin: student.nin,
      subscriptionStatus: student.subscription_status,
      subscriptionPlan: student.subscription_plan,
      subscriptionExpiresAt: student.subscription_expires_at,
      startDate: student.start_date,
      hasCompletedOnboarding: Boolean(student.has_completed_onboarding),
      hasCompletedTour: Boolean(student.has_completed_tour),
      hasCompletedHeadquartersTour: Boolean(student.has_completed_headquarters_tour),
      workLetterEligible: tasksCompleted >= 12,
      publicPortfolioUrl: `/cv/${student.auth_id}`,
      portfolioItems: ((portfolioItems || []) as PortfolioRow[]).map((item) => ({
        id: item.id,
        skillTag: item.skill_tag || item.task_track || 'General',
        bulletPoint: item.bullet_point || item.description || '',
        verifiedBy: item.verified_by || 'Sola',
        createdAt: item.created_at || null,
        url: item.url || item.link || null,
      })),
      badges: ((badges || []) as BadgeRow[]).map((badge) => ({
        id: badge.id,
        name: badge.badge_name || badge.name || 'Badge',
        earnedInWeek: badge.earned_in_week || null,
        unlockedAt: badge.unlocked_at || null,
      })),
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const profile = await fetchStudentProfile(id);

    if (profile.error) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile.data });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};

    Object.entries(editableFields).forEach(([clientKey, dbKey]) => {
      if (!(clientKey in body)) return;

      const value = body[clientKey];
      if (clientKey === 'skills') {
        updateData[dbKey] = Array.isArray(value)
          ? value.map((skill) => String(skill).trim()).filter(Boolean)
          : String(value || '')
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean);
        return;
      }

      if (clientKey === 'idVerified') {
        updateData[dbKey] = Boolean(value);
        return;
      }

      if (numericFields.has(clientKey)) {
        updateData[dbKey] = Number(value || 0);
        return;
      }

      updateData[dbKey] = nullableFields.has(clientKey) && value === '' ? null : value;
    });

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('auth_id', id);

      if (updateError) throw updateError;
    }

    const profile = await fetchStudentProfile(id);

    if (profile.error) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: profile.data });
  } catch (error: unknown) {
    console.error('Error updating student profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
