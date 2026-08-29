"use client";

import { AdminHeader } from "../../components/admin/AdminHeader";
import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import {
  Award,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  Gift,
  Search,
  Share2,
  SlidersHorizontal,
  UserCheck,
  Users,
} from "lucide-react";
import StudentTab, { type StudentListItem } from "../../components/admin/userbase/StudentTab";
import RecruiterTab from "@/app/components/admin/userbase/RecruiterTab";
import EnterpriseTab from "@/app/components/admin/userbase/EnterpriseTab";
import { useAuth } from "../../contexts/AuthContexts";
import type { StudentProfileData } from "../../components/admin/userbase/AdminStudentProfileModal";

type EnrollmentSource = {
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
  has_ever_paid?: boolean | null;
};

type RawStudentRecord = EnrollmentSource & {
  id?: number | string;
  auth_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  track?: string | null;
  start_date?: string | null;
  created_at?: string | null;
  country?: string | null;
  phone?: string | null;
  address?: string | null;
  date_of_birth?: string | null;
  occupation?: string | null;
  nationality?: string | null;
  referral_code?: string | null;
  last_activity_date?: string | null;
  last_activity_at?: string | null;
  tasks_completed?: number | string | null;
  average_score?: number | string | null;
  wallet_balance?: number | string | null;
  id_verified?: boolean | null;
  is_first_task?: boolean | null;
};

type RawRecruiterRecord = {
  id?: number | string;
  auth_id?: string | null;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  created_at?: string | null;
  subscription_status?: string | null;
  subscription_expires_at?: string | null;
};

type RecruiterListItem = {
  id: string;
  internalId: number | string;
  name: string;
  email: string;
  createdAt: string | null;
  status: string;
  expiresOn: string;
  daysLeft: string;
};

type EnterpriseListItem = {
  company: string;
  plan: string;
  status: string;
  expiresOn: string;
  daysLeft: string;
};

type UserBaseRow = StudentListItem | RecruiterListItem | EnterpriseListItem;

type AdminUsersResponse<T> = {
  success: boolean;
  data?: T[];
  error?: string;
};

const enterpriseData = [
  { company: "Wild Fusion", plan: "Monthly", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { company: "Access Bank", plan: "Yearly", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { company: "University of Lagos", plan: "Quartile", status: "Active", expiresOn: "Apr 30, 2025", daysLeft: "18 days" },
  { company: "GTBank", plan: "Monthly", status: "Expired", expiresOn: "Mar 15, 2025", daysLeft: "0 days" },
  { company: "Dangote Group", plan: "Yearly", status: "Active", expiresOn: "Dec 31, 2025", daysLeft: "280 days" },
];

const toDateInput = (date: Date) => date.toISOString().split("T")[0];

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getDateBoundary = (value: string, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isWithinDateRange = (value: string | null | undefined, startDate: string, endDate: string) => {
  if (!startDate && !endDate) return true;
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const startBoundary = getDateBoundary(startDate);
  const endBoundary = getDateBoundary(endDate, true);

  if (startBoundary && date < startBoundary) return false;
  if (endBoundary && date > endBoundary) return false;
  return true;
};

const formatCourseName = (course?: string | null) => {
  if (!course) return "N/A";
  return course
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const isExpired = (date?: string | null) => {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
};

const isActiveSubscription = (student: EnrollmentSource) =>
  String(student.subscription_status || "").toLowerCase() === "active" && !isExpired(student.subscription_expires_at);

const ACTIVITY_WINDOW_DAYS = 30;

const isRecentlyActive = (value?: string | null) => {
  if (!value) return false;
  const lastActivity = new Date(value);
  if (Number.isNaN(lastActivity.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ACTIVITY_WINDOW_DAYS);
  return lastActivity >= cutoff;
};

const isPaidPlan = (plan?: string | null) => {
  const normalizedPlan = String(plan || "").trim().toLowerCase();
  return normalizedPlan === "monthly" || normalizedPlan === "quarterly";
};

const deriveEnrollmentStatus = (student: EnrollmentSource) => {
  const plan = String(student.subscription_plan || "").toLowerCase();

  if (plan.startsWith("trial") && !student.has_ever_paid) return "Free trial";
  if (isPaidPlan(plan) && isActiveSubscription(student)) return "Paid";
  if (isPaidPlan(plan)) return "Expired";
  return "Not started";
};

const mapStudentRecord = (s: RawStudentRecord): StudentListItem => {
  const tasksCompleted = Number(s.tasks_completed || 0);
  const progress = Math.min(Math.round((tasksCompleted / 24) * 100), 100);
  
  return {
    id: String(s.auth_id || ""),
    internalId: s.id || "",
    name: s.full_name || "Unknown",
    email: s.email || "N/A",
    course: s.track || "N/A",
    courseLabel: formatCourseName(s.track),
    enrollmentStatus: deriveEnrollmentStatus(s),
    status: s.subscription_status || "inactive",
    accountStatus: isRecentlyActive(s.last_activity_at) ? "Active" : "Inactive",
    lastActivityDate: s.last_activity_at || null,
    hasEverPaid: Boolean(s.has_ever_paid) || isPaidPlan(s.subscription_plan),
    plan: s.subscription_plan || "N/A",
    subscriptionExpiresAt: s.subscription_expires_at || null,
    // The Userbase date filter/export is about when the account joined, not
    // when a subscription was activated. created_at is the canonical join date.
    startDate: s.created_at || s.start_date || null,
    country: s.country || "N/A",
    phone: s.phone || "",
    address: s.address || "",
    dateOfBirth: s.date_of_birth || null,
    occupation: s.occupation || "",
    nationality: s.nationality || "",
    referralCode: s.referral_code || "",
    tasksCompleted,
    progress,
    averageScore: Number(s.average_score || 0),
    walletBalance: Number(s.wallet_balance || 0),
    idVerified: Boolean(s.id_verified),
    hasReceivedFirstTask: s.is_first_task === false,
  };
};

export default function UserBase() {
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");
  const [rowsToShow, setRowsToShow] = useState("10");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState("all");
  const [accountStatusFilter, setAccountStatusFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [taskReceivedFilter, setTaskReceivedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, recruitersRes] = await Promise.all([
          authenticatedFetch("/api/admin/users?type=student"),
          authenticatedFetch("/api/admin/users?type=recruiter"),
        ]);

        const [studentsJson, recruitersJson] = await Promise.all([
          studentsRes.json() as Promise<AdminUsersResponse<RawStudentRecord>>,
          recruitersRes.json() as Promise<AdminUsersResponse<RawRecruiterRecord>>,
        ]);

        if (studentsJson.success && studentsJson.data) {
          setStudents(studentsJson.data.map(mapStudentRecord));
        }

        if (recruitersJson.success && recruitersJson.data) {
          setRecruiters(recruitersJson.data.map((r) => {
            let daysLeft = "N/A";
            if (r.subscription_expires_at) {
              const diffDays = Math.ceil((new Date(r.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              daysLeft = diffDays > 0 ? `${diffDays} days` : "0 days";
            }

            return {
              id: String(r.auth_id || ""),
              internalId: r.id || "",
              name: r.full_name || r.company_name || "Unknown",
              email: r.email || "N/A",
              createdAt: r.created_at || null,
              status: r.subscription_status || "Active",
              expiresOn: r.subscription_expires_at ? new Date(r.subscription_expires_at).toLocaleDateString() : "N/A",
              daysLeft,
            };
          }));
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authenticatedFetch]);

  const setQuickRange = (days: number) => {
    const end = new Date();
    setEndDate(toDateInput(end));
    setStartDate(toDateInput(addDays(end, -(days - 1))));
    setCurrentPage(1);
  };

  const filteredData = useMemo<UserBaseRow[]>(() => {
    const query = search.trim().toLowerCase();

    if (activeTab === "students") {
      return students.filter((student) => {
        const searchable = [
          student.name,
          student.email,
          student.id,
          student.internalId,
          student.courseLabel,
          student.country,
          student.phone,
          student.plan,
          student.enrollmentStatus,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchable.includes(query);
        const matchesDate = isWithinDateRange(student.startDate, startDate, endDate);
        const matchesCourse = courseFilter === "all" || student.course === courseFilter;
        const matchesEnrollment =
          enrollmentFilter === "all" ||
          (enrollmentFilter === "trial" && student.enrollmentStatus === "Free trial") ||
          (enrollmentFilter === "paid" && student.enrollmentStatus === "Paid") ||
          (enrollmentFilter === "expired" && student.enrollmentStatus === "Expired");
        const matchesAccountStatus =
          accountStatusFilter === "all" ||
          student.accountStatus.toLowerCase() === accountStatusFilter;
        const matchesProgress =
          progressFilter === "all" ||
          (progressFilter === "not-started" && student.tasksCompleted === 0) ||
          (progressFilter === "in-progress" && student.tasksCompleted > 0 && student.tasksCompleted < 12) ||
          (progressFilter === "letter-ready" && student.tasksCompleted >= 12) ||
          (progressFilter === "high-score" && student.averageScore >= 80);
        const matchesVerification =
          verificationFilter === "all" ||
          (verificationFilter === "verified" && student.idVerified) ||
          (verificationFilter === "unverified" && !student.idVerified);
        const matchesTaskReceived =
          taskReceivedFilter === "all" ||
          (taskReceivedFilter === "received" && student.hasReceivedFirstTask === true) ||
          (taskReceivedFilter === "not-received" && student.hasReceivedFirstTask === false);

        return matchesSearch && matchesDate && matchesCourse && matchesEnrollment && matchesAccountStatus && matchesProgress && matchesVerification && matchesTaskReceived;
      });
    }

    if (activeTab === "recruiters") {
      return recruiters.filter((recruiter) => {
        const matchesSearch =
          !query ||
          recruiter.name.toLowerCase().includes(query) ||
          recruiter.email.toLowerCase().includes(query);
        const matchesFilter =
          filterBy === "all" || recruiter.status.toLowerCase() === filterBy;
        const matchesDate = isWithinDateRange(recruiter.createdAt, startDate, endDate);
        return matchesSearch && matchesFilter && matchesDate;
      });
    }

    return enterpriseData.filter((enterprise) => {
      const matchesSearch =
        !query ||
        enterprise.company.toLowerCase().includes(query) ||
        enterprise.plan.toLowerCase().includes(query);
      const matchesFilter =
        filterBy === "all" || enterprise.status.toLowerCase() === filterBy;
      const matchesDate = isWithinDateRange(enterprise.expiresOn, startDate, endDate);
      return matchesSearch && matchesFilter && matchesDate;
    });
  }, [activeTab, search, filterBy, students, recruiters, courseFilter, enrollmentFilter, accountStatusFilter, progressFilter, verificationFilter, taskReceivedFilter, startDate, endDate]);

  const studentSummary = useMemo(() => {
    const scopedStudents = activeTab === "students" ? (filteredData as StudentListItem[]) : students;
    const active = scopedStudents.filter((student) => student.accountStatus === "Active").length;
    const trial = scopedStudents.filter((student) => student.enrollmentStatus === "Free trial").length;
    const ready = scopedStudents.filter((student) => student.tasksCompleted >= 12).length;
    return { active, trial, ready };
  }, [activeTab, filteredData, students]);

  const itemsPerPage = parseInt(rowsToShow);
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = useMemo<UserBaseRow[]>(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const resetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setFilterBy("all");
    setCourseFilter("all");
    setEnrollmentFilter("all");
    setAccountStatusFilter("all");
    setProgressFilter("all");
    setVerificationFilter("all");
    setTaskReceivedFilter("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    const escapeCsvField = (value: unknown) => {
      const stringValue = String(value ?? "");
      const csvSafeValue = /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : stringValue;
      return `"${csvSafeValue.replace(/"/g, '""')}"`;
    };
    const rows = (filteredData as UserBaseRow[]).filter((row): row is StudentListItem => activeTab === "students" && "enrollmentStatus" in row);
    const headers = ["Student", "Email", "Phone", "Country", "Nationality", "Date of Birth", "Occupation", "Address", "Referral Code", "Course", "Enrollment Status", "Account Status", "Last Active", "Plan", "Joined Date", "Subscription Expires", "ID Verification", "Tasks Completed", "Progress", "Average Score"];
    const csvRows = rows.map((student) => [
      student.name,
      student.email,
      student.phone,
      student.country,
      student.nationality,
      student.dateOfBirth,
      student.occupation,
      student.address,
      student.referralCode,
      student.courseLabel || student.course,
      student.enrollmentStatus,
      student.accountStatus,
      student.lastActivityDate,
      student.plan,
      student.startDate,
      student.subscriptionExpiresAt,
      student.idVerified ? "Verified" : "Unverified",
      student.tasksCompleted,
      `${student.progress}%`,
      `${student.averageScore}%`,
    ]);
    const csvContent = [headers, ...csvRows].map((row) => row.map(escapeCsvField).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `admin_userbase_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetFilters();
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 3;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 2) {
      pages.push(1, 2, 3);
    } else if (currentPage >= totalPages - 1) {
      pages.push(totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(currentPage - 1, currentPage, currentPage + 1);
    }

    return pages;
  };

  const handleStudentUpdated = (profile: StudentProfileData) => {
    setStudents((current) =>
      current.map((student) =>
        student.id === profile.authId
          ? {
              ...student,
              name: profile.fullName || student.name,
              email: profile.email || student.email,
              course: profile.course || student.course,
              courseLabel: formatCourseName(profile.course || student.course),
              enrollmentStatus: deriveEnrollmentStatus({
                subscription_plan: profile.subscriptionPlan,
                subscription_status: profile.subscriptionStatus,
                subscription_expires_at: profile.subscriptionExpiresAt,
                has_ever_paid: student.hasEverPaid,
              }),
              status: profile.subscriptionStatus || student.status,
              accountStatus: isRecentlyActive(student.lastActivityDate) ? "Active" : "Inactive",
              plan: profile.subscriptionPlan || student.plan,
              subscriptionExpiresAt: profile.subscriptionExpiresAt || student.subscriptionExpiresAt,
              country: profile.country || student.country,
              phone: profile.phone || student.phone,
              address: profile.address || student.address,
              dateOfBirth: profile.dateOfBirth || student.dateOfBirth,
              occupation: profile.occupation || student.occupation,
              nationality: profile.nationality || student.nationality,
              referralCode: profile.referralCode || student.referralCode,
              tasksCompleted: Number(profile.tasksCompleted ?? student.tasksCompleted),
              progress: Math.min(Math.round((Number(profile.tasksCompleted ?? student.tasksCompleted) / 24) * 100), 100),
              averageScore: Number(profile.averageScore ?? student.averageScore),
              walletBalance: Number(profile.walletBalance ?? student.walletBalance),
              idVerified: Boolean(profile.idVerified),
            }
          : student,
      ),
    );
  };

  const studentPaginatedData = activeTab === "students" ? (paginatedData as StudentListItem[]) : [];
  const recruiterPaginatedData = activeTab === "recruiters" ? (paginatedData as RecruiterListItem[]) : [];
  const enterprisePaginatedData = activeTab === "enterprise" ? (paginatedData as EnterpriseListItem[]) : [];

  return (
    <>
      <AdminHeader title="User Base" subtitle="Search, segment, view, and manage every platform account" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-5 rounded-lg border border-violet-400/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_30%),linear-gradient(135deg,rgba(16,32,51,0.98),rgba(9,20,35,0.94))] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-100">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Account intelligence hub
              </div>
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Userbase Control Center</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Segment learners, recruiters, and enterprise accounts with fast filters and direct profile actions.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[460px]">
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-cyan-100">
                  <Users className="h-4 w-4" />
                  Students
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{students.length}</p>
              </div>
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-100">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Recruiters
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{recruiters.length}</p>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-amber-100">
                  <Building2 className="h-4 w-4" />
                  Enterprise
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{enterpriseData.length}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-2 rounded-lg border border-border/30 bg-[#102033]/80 p-1 sm:grid-cols-3">
            <TabsTrigger value="students" className="h-11 gap-2 rounded-md data-[state=active]:border data-[state=active]:border-cyan-400/25 data-[state=active]:bg-cyan-400/15 data-[state=active]:text-cyan-100">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="recruiters" className="h-11 gap-2 rounded-md data-[state=active]:border data-[state=active]:border-emerald-400/25 data-[state=active]:bg-emerald-400/15 data-[state=active]:text-emerald-100">
              <BriefcaseBusiness className="h-4 w-4" />
              Recruiters
            </TabsTrigger>
            <TabsTrigger value="enterprise" className="h-11 gap-2 rounded-md data-[state=active]:border data-[state=active]:border-amber-400/25 data-[state=active]:bg-amber-400/15 data-[state=active]:text-amber-100">
              <Building2 className="h-4 w-4" />
              Enterprise
            </TabsTrigger>
          </TabsList>

          {activeTab === "students" && (
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(16,32,51,0.96))] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-emerald-100">Active students</p>
                  <UserCheck className="h-5 w-5 text-emerald-200" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{studentSummary.active}</p>
              </div>
              <div className="rounded-lg border border-violet-400/20 bg-[linear-gradient(135deg,rgba(139,92,246,0.18),rgba(16,32,51,0.96))] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-violet-100">Free trials</p>
                  <Gift className="h-5 w-5 text-violet-200" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{studentSummary.trial}</p>
              </div>
              <div className="rounded-lg border border-amber-400/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(16,32,51,0.96))] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-amber-100">Letter ready</p>
                  <Award className="h-5 w-5 text-amber-200" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">{studentSummary.ready}</p>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-lg border border-border/30 bg-[linear-gradient(135deg,rgba(16,32,51,0.96),rgba(12,24,40,0.94))] p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Refine userbase</p>
                  <p className="text-xs text-muted-foreground">Use search and filters together for precise segments.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="self-start text-muted-foreground hover:text-foreground sm:self-auto" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(240px,0.8fr)_minmax(360px,1.2fr)]">
                <div>
                <p className="mb-2 text-sm text-muted-foreground">Search</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={activeTab === "students" ? "Name, email, DB ID, course, country, phone" : "Search by name or email"}
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="border-border/30 bg-[#102033] pl-10"
                  />
                </div>
              </div>

                <div className="rounded-lg border border-cyan-400/10 bg-white/[0.03] p-3">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "students" ? "Joined date" : activeTab === "recruiters" ? "Created date" : "Expiry date"}
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                      {[
                        { label: "7D", days: 7 },
                        { label: "30D", days: 30 },
                        { label: "90D", days: 90 },
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
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                          setCurrentPage(1);
                        }}
                        className="rounded-md border border-border/30 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground transition hover:border-violet-400/40 hover:text-violet-200"
                      >
                        All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                      <Input
                        type="date"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={(event) => {
                          setStartDate(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="border-border/30 bg-[#102033] pl-10"
                      />
                    </label>
                    <label className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
                      <Input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => {
                          setEndDate(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="border-border/30 bg-[#102033] pl-10"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                <p className="mb-2 text-sm text-muted-foreground">Show</p>
                <Select
                  value={rowsToShow}
                  onValueChange={(value) => {
                    setRowsToShow(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="border-border/30 bg-[#102033]">
                    <SelectValue placeholder="10 rows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 rows</SelectItem>
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="25">25 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            {activeTab === "students" ? (
              <>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Course</p>
                  <Select value={courseFilter} onValueChange={(value) => { setCourseFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="border-border/30 bg-[#102033]">
                      <SelectValue placeholder="All courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All courses</SelectItem>
                      <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                      <SelectItem value="data-analytics">Data Analytics</SelectItem>
                      <SelectItem value="cyber-security">Cyber Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Enrollment</p>
                  <Select value={enrollmentFilter} onValueChange={(value) => { setEnrollmentFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="border-border/30 bg-[#102033]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="trial">Free trial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Account Status</p>
                  <Select value={accountStatusFilter} onValueChange={(value) => { setAccountStatusFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="border-border/30 bg-[#102033]">
                      <SelectValue placeholder="All account statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All account statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Progress</p>
                  <Select value={progressFilter} onValueChange={(value) => { setProgressFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="border-border/30 bg-[#102033]">
                      <SelectValue placeholder="All progress" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All progress</SelectItem>
                      <SelectItem value="not-started">Not started</SelectItem>
                      <SelectItem value="in-progress">In progress</SelectItem>
                      <SelectItem value="letter-ready">Letter ready</SelectItem>
                      <SelectItem value="high-score">80+ score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">First Task</p>
                  <Select value={taskReceivedFilter} onValueChange={(value) => { setTaskReceivedFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="border-border/30 bg-[#102033]">
                      <SelectValue placeholder="All tasks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tasks</SelectItem>
                      <SelectItem value="received">Task received</SelectItem>
                      <SelectItem value="not-received">No task yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">ID</p>
                  <Select value={verificationFilter} onValueChange={(value) => { setVerificationFilter(value); setCurrentPage(1); }}>
                    <SelectTrigger className="border-border/30 bg-[#102033]">
                      <SelectValue placeholder="All IDs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All IDs</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Status</p>
                <Select value={filterBy} onValueChange={(value) => { setFilterBy(value); setCurrentPage(1); }}>
                  <SelectTrigger className="border-border/30 bg-[#102033]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
              </div>
            </div>
            {activeTab === "students" && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="gap-2 border-violet-400/30 bg-violet-400/10 text-violet-100 hover:bg-violet-400/15" onClick={handleExport}>
                  <Share2 className="h-4 w-4" />
                  Export
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-border/30 bg-[#102033]">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <>
              <StudentTab paginatedData={studentPaginatedData} onStudentUpdated={handleStudentUpdated} />
              <RecruiterTab paginatedData={recruiterPaginatedData} />
              <EnterpriseTab paginatedData={enterprisePaginatedData} />
            </>
          )}

          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-lg border border-border/30 bg-[#102033]/70 p-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              Showing {startItem}-{endItem} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  className={currentPage === page ? "bg-primary" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </Tabs>
      </main>
    </>
  );
}
