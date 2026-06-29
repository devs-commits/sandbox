"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { AdminHeader } from "../../components/admin/AdminHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAuth } from "../../contexts/AuthContexts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Activity,
  Banknote,
  CalendarDays,
  Download,
  Filter,
  Gift,
  GraduationCap,
  RefreshCw,
  Share2,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

interface ActivityItem {
  type: string;
  user: string;
  action: string;
  time: string;
  tone: "blue" | "green" | "purple" | "amber" | "rose" | string;
}

interface ReferralLeaderboardRow {
  rank: number;
  studentId: string;
  name: string;
  email: string;
  referralCode: string;
  plan: string;
  status: string;
  isPaidReferrer: boolean;
  totalReferrals: number;
  paidReferrals: number;
  successfulReferrals: number;
  pendingCommissionReferrals: number;
  conversionRate: number;
  commissionEarned: number;
  pendingCommission: number;
}

interface ReferralSummary {
  totalReferrals: number;
  paidReferrals: number;
  successfulReferrals: number;
  commissionEarned: number;
  pendingCommission: number;
}

interface DashboardStats {
  totalRegisteredStudents: number;
  activeStudents: number;
  totalFreeTrialStudents: number;
  paidStudents: number;
  totalRevenue: number;
  courseCompletionRate: number;
  letterEligibleStudents: number;
  letterDownloadsTracked: boolean;
  avgScore: number;
  totalTasksCompleted: number;
  expiringSoon: number;
  referralCommissionAmount: number;
  referralSummary: ReferralSummary;
  referralLeaderboard: ReferralLeaderboardRow[];
  chartData: {
    signups: number[];
    active: number[];
    freeTrial: number[];
    revenue: number[];
    completions: number[];
  };
  activityItems: ActivityItem[];
}

const emptyStats: DashboardStats = {
  totalRegisteredStudents: 0,
  activeStudents: 0,
  totalFreeTrialStudents: 0,
  paidStudents: 0,
  totalRevenue: 0,
  courseCompletionRate: 0,
  letterEligibleStudents: 0,
  letterDownloadsTracked: false,
  avgScore: 0,
  totalTasksCompleted: 0,
  expiringSoon: 0,
  referralCommissionAmount: 1500,
  referralSummary: {
    totalReferrals: 0,
    paidReferrals: 0,
    successfulReferrals: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  },
  referralLeaderboard: [],
  chartData: {
    signups: [],
    active: [],
    freeTrial: [],
    revenue: [],
    completions: [],
  },
  activityItems: [],
};

const toDateInput = (date: Date) => date.toISOString().split("T")[0];

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateLabel = (value: string) => {
  if (!value) return "Open";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "ST";

const trackLabel = (track: string) =>
  track === "all"
    ? "All courses"
    : track
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const toneClasses: Record<string, string> = {
  blue: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  purple: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const statThemes = {
  cyan: {
    shell: "border-cyan-400/25 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_34%),linear-gradient(135deg,rgba(16,32,51,1),rgba(8,47,73,0.72))]",
    icon: "bg-cyan-400/15 text-cyan-200 border-cyan-300/25",
    accent: "from-cyan-400 to-blue-500",
    spark: "bg-cyan-300",
  },
  emerald: {
    shell: "border-emerald-400/25 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_34%),linear-gradient(135deg,rgba(16,32,51,1),rgba(6,78,59,0.68))]",
    icon: "bg-emerald-400/15 text-emerald-200 border-emerald-300/25",
    accent: "from-emerald-400 to-teal-500",
    spark: "bg-emerald-300",
  },
  violet: {
    shell: "border-violet-400/25 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_34%),linear-gradient(135deg,rgba(16,32,51,1),rgba(76,29,149,0.64))]",
    icon: "bg-violet-400/15 text-violet-200 border-violet-300/25",
    accent: "from-violet-400 to-fuchsia-500",
    spark: "bg-violet-300",
  },
  amber: {
    shell: "border-amber-400/25 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_34%),linear-gradient(135deg,rgba(16,32,51,1),rgba(120,53,15,0.56))]",
    icon: "bg-amber-400/15 text-amber-200 border-amber-300/25",
    accent: "from-amber-300 to-orange-500",
    spark: "bg-amber-300",
  },
  rose: {
    shell: "border-rose-400/25 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.18),transparent_34%),linear-gradient(135deg,rgba(16,32,51,1),rgba(136,19,55,0.58))]",
    icon: "bg-rose-400/15 text-rose-200 border-rose-300/25",
    accent: "from-rose-300 to-pink-500",
    spark: "bg-rose-300",
  },
};

function Sparkline({ data, color = "bg-cyan-400" }: { data: number[]; color?: string }) {
  const hasData = data.length > 0 && data.some((value) => value > 0);
  const chartData = hasData ? data : [1, 2, 1, 3, 2, 4, 3];
  const maxValue = Math.max(...chartData, 1);

  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {chartData.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className={`w-2 rounded-sm ${color} ${hasData ? "" : "opacity-25"}`}
          style={{ height: `${Math.max(16, (value / maxValue) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  data,
  theme,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ElementType;
  data: number[];
  theme: keyof typeof statThemes;
}) {
  const selectedTheme = statThemes[theme];

  return (
    <Card className={`relative overflow-hidden rounded-lg border shadow-sm ${selectedTheme.shell}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${selectedTheme.accent}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg border ${selectedTheme.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <Sparkline data={data} color={selectedTheme.spark} />
        </div>
        <p className="mt-3 min-h-9 text-xs leading-5 text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const todayInput = toDateInput(new Date());
  const defaultStartInput = toDateInput(addDays(new Date(), -29));
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(defaultStartInput);
  const [endDate, setEndDate] = useState(todayInput);
  const [course, setCourse] = useState("all");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const { authenticatedFetch, isAuthenticated, isLoading: authLoading } = useAuth();

  const filterSummary = useMemo(
    () =>
      [
        trackLabel(course),
        plan === "all" ? "all plans" : `${plan} plan`,
        status === "all" ? "all enrollment states" : `${status} students`,
        `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`,
      ].join(" / "),
    [course, plan, startDate, endDate, status],
  );

  const setQuickRange = (days: number) => {
    const end = new Date();
    setEndDate(toDateInput(end));
    setStartDate(toDateInput(addDays(end, -(days - 1))));
  };

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      setErrorMessage("Sign in as an admin to view dashboard data.");
      return;
    }

    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams({
        startDate,
        endDate,
        track: course,
        plan,
        status,
      });

      const response = await authenticatedFetch(`/api/admin/dashboard/stats?${params.toString()}`);

      if (!response.ok) {
        const message = await response.text();
        setErrorMessage(
          response.status === 401
            ? "Your admin session is not ready or has expired. Please refresh after signing in again."
            : message,
        );
        return;
      }
      const data = await response.json();
      setStats({ ...emptyStats, ...data, chartData: { ...emptyStats.chartData, ...data.chartData } });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authLoading, authenticatedFetch, course, endDate, isAuthenticated, plan, startDate, status]);

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [authLoading, fetchData]);

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total registered students", stats.totalRegisteredStudents],
      ["Active students", stats.activeStudents],
      ["Free trial students", stats.totalFreeTrialStudents],
      ["Paid students", stats.paidStudents],
      ["Revenue", stats.totalRevenue],
      ["Course completion rate", `${stats.courseCompletionRate}%`],
      ["Letter eligible students", stats.letterEligibleStudents],
      ["Average score", stats.avgScore],
      ["Tasks completed", stats.totalTasksCompleted],
      ["Referral total", stats.referralSummary.totalReferrals],
      ["Paid referred students", stats.referralSummary.paidReferrals],
      ["Successful referrals", stats.referralSummary.successfulReferrals],
      ["Referral commission earned", stats.referralSummary.commissionEarned],
    ];

    const activityRows = stats.activityItems.map((item) => [
      item.type,
      item.user,
      item.action,
      item.time,
    ]);
    const referralRows = stats.referralLeaderboard.map((row) => [
      row.rank,
      row.name,
      row.email,
      row.referralCode,
      row.totalReferrals,
      row.paidReferrals,
      row.successfulReferrals,
      row.commissionEarned,
      row.pendingCommission,
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "SUMMARY\n";
    csvContent += rows.map((row) => row.map((field) => `"${field}"`).join(",")).join("\n");
    csvContent += "\n\nREFERRAL LEADERBOARD\n";
    csvContent += ["Rank", "Student", "Email", "Referral Code", "Total Referrals", "Paid Referred", "Successful Referrals", "Commission Earned", "Pending Commission"].map((field) => `"${field}"`).join(",") + "\n";
    csvContent += referralRows.map((row) => row.map((field) => `"${field}"`).join(",")).join("\n");
    csvContent += "\n\nLIVE ACTIVITY\n";
    csvContent += ["Type", "User", "Action", "Time"].map((field) => `"${field}"`).join(",") + "\n";
    csvContent += activityRows.map((row) => row.map((field) => `"${field}"`).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `admin_dashboard_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <AdminHeader
        title="Admin Dashboard"
        subtitle="Centralized visibility across learners, courses, revenue, referrals, and operations"
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-5 rounded-lg border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_32%),linear-gradient(135deg,rgba(16,32,51,0.98),rgba(9,20,35,0.94))] p-4 shadow-sm sm:p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Activity className="h-3.5 w-3.5" />
              Live operations command center
            </div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Management Overview</h2>
            <p className="mt-1 text-sm text-muted-foreground">{filterSummary}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-background/20 p-3 shadow-inner sm:grid-cols-2 xl:flex xl:items-end">
            <div className="sm:col-span-2 xl:col-span-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date range</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                  <Input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-10 border-border/30 bg-[#102033] pl-9 text-sm"
                  />
                </label>
                <label className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={todayInput}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="h-10 border-border/30 bg-[#102033] pl-9 text-sm"
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { label: "7D", days: 7 },
                  { label: "30D", days: 30 },
                  { label: "90D", days: 90 },
                  { label: "1Y", days: 365 },
                ].map((range) => (
                  <button
                    key={range.label}
                    type="button"
                    onClick={() => setQuickRange(range.days)}
                    className="rounded-md border border-border/30 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="bg-[#102033] border-border/30 min-w-0 xl:w-[170px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                <SelectItem value="data-analytics">Data Analytics</SelectItem>
                <SelectItem value="cyber-security">Cyber Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="bg-[#102033] border-border/30 min-w-0 xl:w-[135px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="trial">Free trial</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-[#102033] border-border/30 min-w-0 xl:w-[145px]">
                <SelectValue placeholder="Enrollment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="gap-2 border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15"
              onClick={() => fetchData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" className="gap-2 border-violet-400/30 bg-violet-400/10 text-violet-100 hover:bg-violet-400/15" onClick={handleExport}>
              <Share2 className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-border/30 bg-[#102033]/70 px-3 py-2 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Cards and activity are recalculated from the selected dashboard filters.
        </div> */}

        {errorMessage && (
          <div className="mb-4 rounded-lg border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-44 rounded-lg border border-border/30 bg-[#102033] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Registered Students"
              value={stats.totalRegisteredStudents.toLocaleString()}
              helper="Free trial and paid student accounts in the selected scope."
              icon={Users}
              data={stats.chartData.signups}
              theme="cyan"
            />
            <StatCard
              title="Active Students"
              value={stats.activeStudents.toLocaleString()}
              helper="Students with active, unexpired office access."
              icon={UserCheck}
              data={stats.chartData.active}
              theme="emerald"
            />
            <StatCard
              title="Free Trial Students"
              value={stats.totalFreeTrialStudents.toLocaleString()}
              helper={`${stats.paidStudents.toLocaleString()} students are currently on paid plans.`}
              icon={Gift}
              data={stats.chartData.freeTrial}
              theme="violet"
            />
            <StatCard
              title="Revenue Overview"
              value={formatCurrency(stats.totalRevenue)}
              helper="Confirmed subscription revenue for the selected period."
              icon={Banknote}
              data={stats.chartData.revenue}
              theme="amber"
            />
            <StatCard
              title="Completion Rate"
              value={`${stats.courseCompletionRate}%`}
              helper={`${stats.letterEligibleStudents.toLocaleString()} students have completed at least 12 tasks.`}
              icon={GraduationCap}
              data={stats.chartData.completions}
              theme="rose"
            />
          </div>
        )}

        {!loading && (
          <Card className="mt-6 rounded-lg border-amber-400/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.13),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.1),transparent_30%),linear-gradient(135deg,rgba(16,32,51,0.98),rgba(20,18,39,0.96))] shadow-sm">
            <CardContent className="p-5">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
                    <Trophy className="h-3.5 w-3.5" />
                    Referral performance
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Referral Leaderboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Successful commission requires both the referrer and referred student to be on paid plans.
                  </p>
                </div>
                {/* <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
                  {formatCurrency(stats.referralCommissionAmount)} per successful referral
                </div> */}
              </div>

              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-cyan-100">Total referrals</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {stats.referralSummary.totalReferrals.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-400/15 bg-emerald-400/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-100">Paid referred</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {stats.referralSummary.paidReferrals.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-violet-400/15 bg-violet-400/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-violet-100">Successful</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {stats.referralSummary.successfulReferrals.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-400/15 bg-amber-400/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-amber-100">Commission earned</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatCurrency(stats.referralSummary.commissionEarned)}
                  </p>
                </div>
                <div className="rounded-lg border border-rose-400/15 bg-rose-400/10 p-3">
                  <p className="text-xs uppercase tracking-wider text-rose-100">Pending commission</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatCurrency(stats.referralSummary.pendingCommission)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#102033]/70">
                <div className="min-w-[880px]">
                  <div className="grid grid-cols-[72px_1.6fr_0.8fr_0.8fr_0.8fr_1fr_1fr] gap-4 bg-gradient-to-r from-amber-500/20 via-violet-500/10 to-cyan-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Rank</span>
                    <span>Student</span>
                    <span>Total</span>
                    <span>Paid</span>
                    <span>Success</span>
                    <span>Commission</span>
                    <span>Eligibility</span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {stats.referralLeaderboard.map((row) => (
                      <div
                        key={`${row.studentId}-${row.rank}`}
                        className="grid grid-cols-[72px_1.6fr_0.8fr_0.8fr_0.8fr_1fr_1fr] items-center gap-4 px-4 py-3 text-sm transition hover:bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 font-semibold text-amber-100">
                            #{row.rank}
                          </span>
                        </div>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/30 to-cyan-500/30 text-xs font-semibold text-amber-50 ring-1 ring-white/10">
                            {getInitials(row.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{row.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.referralCode}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-foreground">{row.totalReferrals.toLocaleString()}</span>
                        <span className="text-emerald-100">{row.paidReferrals.toLocaleString()}</span>
                        <span className="text-violet-100">{row.successfulReferrals.toLocaleString()}</span>
                        <div>
                          <p className="font-semibold text-amber-100">{formatCurrency(row.commissionEarned)}</p>
                          {row.pendingCommission > 0 && (
                            <p className="text-xs text-rose-200">Pending {formatCurrency(row.pendingCommission)}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
                              row.isPaidReferrer
                                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                                : "border-rose-400/25 bg-rose-400/10 text-rose-100"
                            }`}
                          >
                            {row.isPaidReferrer ? "Paid referrer" : "Not commission-ready"}
                          </span>
                          <span className="text-xs text-muted-foreground">{row.conversionRate}% paid conversion</span>
                        </div>
                      </div>
                    ))}
                    {stats.referralLeaderboard.length === 0 && (
                      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No referral activity found for the selected filters.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="rounded-lg border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.1),transparent_28%),linear-gradient(135deg,rgba(16,32,51,0.98),rgba(10,23,39,0.98))] shadow-sm lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Live System Activity</h3>
                  <p className="text-sm text-muted-foreground">Recent signups, payments, KYC, wallet, and completion milestones.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live feed
                </div>
              </div>

              <div className="space-y-3">
                {stats.activityItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.user}-${index}`}
                    className="flex items-start justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:border-cyan-400/25 hover:bg-white/[0.05]"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`mt-0.5 rounded-lg border p-2 ${toneClasses[item.tone] || toneClasses.blue}`}>
                        {item.type === "payment" ? (
                          <Banknote className="h-4 w-4" />
                        ) : item.type === "milestone" ? (
                          <Target className="h-4 w-4" />
                        ) : item.type === "kyc" ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : item.type === "wallet" ? (
                          <Wallet className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.user}</p>
                        <p className="text-sm text-muted-foreground">{item.action}</p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
                {stats.activityItems.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
                    No activity found for these filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-lg border-violet-400/20 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_30%),linear-gradient(135deg,rgba(16,32,51,0.98),rgba(20,18,45,0.96))] shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-foreground">Operational Performance</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-cyan-400/15 bg-cyan-400/10 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-cyan-400/15 p-2 text-cyan-200">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-muted-foreground">Average score</span>
                    </div>
                    <span className="font-semibold text-foreground">{stats.avgScore}%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-violet-400/15 bg-violet-400/10 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-violet-400/15 p-2 text-violet-200">
                        <Target className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-muted-foreground">Tasks completed</span>
                    </div>
                    <span className="font-semibold text-foreground">{stats.totalTasksCompleted.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-amber-400/15 bg-amber-400/10 p-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-amber-400/15 p-2 text-amber-200">
                        <Download className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-muted-foreground">Expiring in 7 days</span>
                    </div>
                    <span className="font-semibold text-foreground">{stats.expiringSoon.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* {!stats.letterDownloadsTracked && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                Completion uses the 12-task eligibility milestone because work-letter downloads are not currently persisted.
              </div>
            )} */}
          </div>
        </div>
      </main>
    </>
  );
}
