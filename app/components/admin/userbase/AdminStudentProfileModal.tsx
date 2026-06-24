"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Award,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle,
  CreditCard,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useAuth } from "../../../contexts/AuthContexts";
import { toast } from "sonner";

interface PortfolioItem {
  id?: string | number;
  skillTag: string;
  bulletPoint: string;
  verifiedBy: string;
  createdAt?: string | null;
  url?: string | null;
}

interface StudentBadge {
  id?: string | number;
  name: string;
  earnedInWeek?: number | null;
  unlockedAt?: string | null;
}

export interface StudentProfileData {
  authId: string;
  internalId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  occupation?: string | null;
  nationality?: string | null;
  course?: string | null;
  joinDate?: string | null;
  createdAt?: string | null;
  lastActive?: string | null;
  averageScore: number;
  tasksCompleted: number;
  progressPercentage: number;
  walletBalance: number;
  currentStreak: number;
  skills: string[];
  cvUrl?: string | null;
  referralCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  idVerified: boolean;
  bvn?: string | null;
  nin?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPlan?: string | null;
  subscriptionExpiresAt?: string | null;
  startDate?: string | null;
  hasCompletedOnboarding: boolean;
  hasCompletedTour: boolean;
  hasCompletedHeadquartersTour: boolean;
  workLetterEligible: boolean;
  publicPortfolioUrl?: string | null;
  portfolioItems: PortfolioItem[];
  badges: StudentBadge[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  enrollmentStatus?: string;
  fullData?: StudentProfileData;
}

interface AdminStudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  mode: "view" | "edit";
  onClose: () => void;
  onSaved?: (student: StudentProfileData) => void;
}

const emptyForm = {
  fullName: "",
  phone: "",
  country: "",
  address: "",
  dateOfBirth: "",
  occupation: "",
  nationality: "",
  course: "",
  skills: "",
  averageScore: "0",
  tasksCompleted: "0",
  progressPercentage: "0",
  walletBalance: "0",
  currentStreak: "0",
  cvUrl: "",
  referralCode: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  idVerified: "false",
  bvn: "",
  nin: "",
  subscriptionStatus: "",
  subscriptionPlan: "",
  subscriptionExpiresAt: "",
  startDate: "",
};

const formatCourseName = (course?: string | null) => {
  if (!course) return "N/A";
  return course
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const metricThemes = [
  "from-cyan-500/25 to-blue-500/10 border-cyan-400/30 text-cyan-200",
  "from-emerald-500/25 to-teal-500/10 border-emerald-400/30 text-emerald-200",
  "from-violet-500/25 to-fuchsia-500/10 border-violet-400/30 text-violet-200",
  "from-amber-500/25 to-orange-500/10 border-amber-400/30 text-amber-200",
  "from-rose-500/25 to-pink-500/10 border-rose-400/30 text-rose-200",
];

const infoThemes = [
  "bg-cyan-500/15 text-cyan-300",
  "bg-emerald-500/15 text-emerald-300",
  "bg-violet-500/15 text-violet-300",
  "bg-amber-500/15 text-amber-300",
  "bg-rose-500/15 text-rose-300",
  "bg-blue-500/15 text-blue-300",
];

const buildForm = (profile: StudentProfileData | undefined, student: Student | null) => ({
  ...emptyForm,
  fullName: profile?.fullName || student?.name || "",
  phone: profile?.phone || "",
  country: profile?.country || "",
  address: profile?.address || "",
  dateOfBirth: formatDateInput(profile?.dateOfBirth),
  occupation: profile?.occupation || "",
  nationality: profile?.nationality || "",
  course: profile?.course || (student?.course && student.course !== "N/A" ? student.course : "digital-marketing"),
  skills: profile?.skills?.join(", ") || "",
  averageScore: String(profile?.averageScore || 0),
  tasksCompleted: String(profile?.tasksCompleted || 0),
  progressPercentage: String(profile?.progressPercentage || 0),
  walletBalance: String(profile?.walletBalance || 0),
  currentStreak: String(profile?.currentStreak || 0),
  cvUrl: profile?.cvUrl || "",
  referralCode: profile?.referralCode || "",
  bankName: profile?.bankName || "",
  accountNumber: profile?.accountNumber || "",
  accountName: profile?.accountName || "",
  idVerified: String(Boolean(profile?.idVerified)),
  bvn: profile?.bvn || "",
  nin: profile?.nin || "",
  subscriptionStatus: profile?.subscriptionStatus || "inactive",
  subscriptionPlan: profile?.subscriptionPlan || "monthly",
  subscriptionExpiresAt: formatDateInput(profile?.subscriptionExpiresAt),
  startDate: formatDateInput(profile?.startDate),
});

function MetricCard({
  icon: Icon,
  label,
  value,
  theme,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  theme: string;
}) {
  return (
    <div className={`rounded-lg border bg-gradient-to-br p-4 shadow-sm ${theme}`}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  theme = infoThemes[0],
}: {
  icon: ElementType;
  label: string;
  value?: string | number | null;
  theme?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/35 p-3 transition hover:border-white/20 hover:bg-background/50">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${theme}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{value || "N/A"}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-border/40 bg-background/50"
      />
    </label>
  );
}

export function AdminStudentProfileModal({
  student,
  isOpen,
  mode,
  onClose,
  onSaved,
}: AdminStudentProfileModalProps) {
  const [profile, setProfile] = useState<StudentProfileData | undefined>(student?.fullData);
  const [activeMode, setActiveMode] = useState<"view" | "edit">(mode);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    const nextProfile = student?.fullData;
    setProfile(nextProfile);
    setActiveMode(mode);
    setForm(buildForm(nextProfile, student));
  }, [student, mode, isOpen]);

  const isEditing = activeMode === "edit";

  const publicPortfolioUrl = useMemo(() => {
    if (!profile?.publicPortfolioUrl) return null;
    if (typeof window === "undefined") return profile.publicPortfolioUrl;
    return profile.publicPortfolioUrl.startsWith("http")
      ? profile.publicPortfolioUrl
      : `${window.location.origin}${profile.publicPortfolioUrl}`;
  }, [profile?.publicPortfolioUrl]);

  if (!student) return null;

  const updateField = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCancelEdit = () => {
    setForm(buildForm(profile, student));
    setActiveMode("view");
  };

  const handleSave = async () => {
    if (!student.id) return;
    setSaving(true);

    try {
      const payload = {
        ...form,
        averageScore: Number(form.averageScore || 0),
        tasksCompleted: Number(form.tasksCompleted || 0),
        progressPercentage: Number(form.progressPercentage || 0),
        walletBalance: Number(form.walletBalance || 0),
        currentStreak: Number(form.currentStreak || 0),
        idVerified: form.idVerified === "true",
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      };

      const response = await authenticatedFetch(`/api/admin/student/${student.id}/full-profile`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update student profile");
      }

      setProfile(result.data);
      setForm(buildForm(result.data, student));
      setActiveMode("view");
      onSaved?.(result.data);
      toast.success("Student profile updated");
    } catch (error: unknown) {
      console.error("Failed to update student profile", error);
      toast.error(error instanceof Error ? error.message : "Failed to update student profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-5xl gap-0 overflow-y-auto border-border bg-card p-0 sm:w-full">
        <DialogHeader className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_28%)] p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-lg font-bold text-white shadow-lg shadow-cyan-950/30">
                {(profile?.fullName || student.name || "S").slice(0, 1).toUpperCase()}
              </div>
              <DialogTitle className="text-2xl font-semibold text-foreground">
                {profile?.fullName || student.name}
              </DialogTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2 break-all text-sm text-muted-foreground">
                <span className="break-all">{student.email}</span>
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                  {formatCourseName(profile?.course || student.course)}
                </Badge>
                <Badge variant="outline" className={profile?.workLetterEligible ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-slate-500/30 bg-slate-500/10 text-slate-300"}>
                  {profile?.workLetterEligible ? "Work letter ready" : "In progress"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pr-8 sm:pr-8">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </>
              ) : (
                <Button onClick={() => setActiveMode("edit")} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {!profile ? (
          <div className="p-6">
            <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No additional profile information available for this student.
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <MetricCard icon={Award} label="Average score" value={`${profile.averageScore || 0}%`} theme={metricThemes[0]} />
              <MetricCard icon={Briefcase} label="Tasks" value={profile.tasksCompleted || 0} theme={metricThemes[1]} />
              <MetricCard icon={TrendingUp} label="Progress" value={`${profile.progressPercentage || 0}%`} theme={metricThemes[2]} />
              <MetricCard icon={Calendar} label="Streak" value={`${profile.currentStreak || 0} days`} theme={metricThemes[3]} />
              <MetricCard icon={Wallet} label="Wallet" value={formatCurrency(profile.walletBalance)} theme={metricThemes[4]} />
            </div>

            {isEditing ? (
              <div className="rounded-lg border border-violet-400/20 bg-gradient-to-br from-[#102033] to-violet-950/20 p-4 sm:p-5">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Edit Student Profile</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Full name" value={form.fullName} onChange={(value) => updateField("fullName", value)} />
                  <Field label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} />
                  <Field label="Country" value={form.country} onChange={(value) => updateField("country", value)} />
                  <Field label="Nationality" value={form.nationality} onChange={(value) => updateField("nationality", value)} />
                  <Field label="Date of birth" value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} type="date" />
                  <Field label="Occupation" value={form.occupation} onChange={(value) => updateField("occupation", value)} />
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Course</span>
                    <Select value={form.course || "digital-marketing"} onValueChange={(value) => updateField("course", value)}>
                      <SelectTrigger className="border-border/40 bg-background/50">
                        <SelectValue placeholder="Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                        <SelectItem value="data-analytics">Data Analytics</SelectItem>
                        <SelectItem value="cyber-security">Cyber Security</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Subscription status</span>
                    <Select value={form.subscriptionStatus || "inactive"} onValueChange={(value) => updateField("subscriptionStatus", value)}>
                      <SelectTrigger className="border-border/40 bg-background/50">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Subscription plan</span>
                    <Select value={form.subscriptionPlan || "monthly"} onValueChange={(value) => updateField("subscriptionPlan", value)}>
                      <SelectTrigger className="border-border/40 bg-background/50">
                        <SelectValue placeholder="Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Free trial</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <Field label="Start date" value={form.startDate} onChange={(value) => updateField("startDate", value)} type="date" />
                  <Field label="Expires at" value={form.subscriptionExpiresAt} onChange={(value) => updateField("subscriptionExpiresAt", value)} type="date" />
                  <Field label="Tasks completed" value={form.tasksCompleted} onChange={(value) => updateField("tasksCompleted", value)} type="number" />
                  <Field label="Progress percentage" value={form.progressPercentage} onChange={(value) => updateField("progressPercentage", value)} type="number" />
                  <Field label="Average score" value={form.averageScore} onChange={(value) => updateField("averageScore", value)} type="number" />
                  <Field label="Current streak" value={form.currentStreak} onChange={(value) => updateField("currentStreak", value)} type="number" />
                  <Field label="Wallet balance" value={form.walletBalance} onChange={(value) => updateField("walletBalance", value)} type="number" />
                  <Field label="Referral code" value={form.referralCode} onChange={(value) => updateField("referralCode", value)} />
                  <Field label="CV URL" value={form.cvUrl} onChange={(value) => updateField("cvUrl", value)} />
                  <Field label="Bank name" value={form.bankName} onChange={(value) => updateField("bankName", value)} />
                  <Field label="Account number" value={form.accountNumber} onChange={(value) => updateField("accountNumber", value)} />
                  <Field label="Account name" value={form.accountName} onChange={(value) => updateField("accountName", value)} />
                  <label className="space-y-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">ID verified</span>
                    <Select value={form.idVerified} onValueChange={(value) => updateField("idVerified", value)}>
                      <SelectTrigger className="border-border/40 bg-background/50">
                        <SelectValue placeholder="ID status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Verified</SelectItem>
                        <SelectItem value="false">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <Field label="BVN" value={form.bvn} onChange={(value) => updateField("bvn", value)} />
                  <Field label="NIN" value={form.nin} onChange={(value) => updateField("nin", value)} />
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Skills</span>
                    <Input
                      value={form.skills}
                      onChange={(event) => updateField("skills", event.target.value)}
                      className="border-border/40 bg-background/50"
                      placeholder="Comma separated skills"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">Address</span>
                    <Textarea
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      className="border-border/40 bg-background/50"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">Personal Information</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoItem icon={Mail} label="Email" value={profile.email} theme={infoThemes[0]} />
                    <InfoItem icon={Phone} label="Phone" value={profile.phone} theme={infoThemes[1]} />
                    <InfoItem icon={MapPin} label="Country" value={profile.country} theme={infoThemes[2]} />
                    <InfoItem icon={User} label="Nationality" value={profile.nationality} theme={infoThemes[3]} />
                    <InfoItem icon={Calendar} label="Date of birth" value={formatDate(profile.dateOfBirth)} theme={infoThemes[4]} />
                    <InfoItem icon={Briefcase} label="Occupation" value={profile.occupation} theme={infoThemes[5]} />
                    <InfoItem icon={MapPin} label="Address" value={profile.address} theme={infoThemes[0]} />
                    <InfoItem icon={FileText} label="Referral code" value={profile.referralCode} theme={infoThemes[2]} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">Enrollment and Performance</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <InfoItem icon={Briefcase} label="Course" value={formatCourseName(profile.course)} theme={infoThemes[2]} />
                    <InfoItem icon={CheckCircle} label="Subscription status" value={profile.subscriptionStatus} theme={infoThemes[1]} />
                    <InfoItem icon={CreditCard} label="Subscription plan" value={profile.subscriptionPlan} theme={infoThemes[3]} />
                    <InfoItem icon={Calendar} label="Start date" value={formatDate(profile.startDate)} theme={infoThemes[0]} />
                    <InfoItem icon={Calendar} label="Expires at" value={formatDate(profile.subscriptionExpiresAt)} theme={infoThemes[4]} />
                    <InfoItem icon={TrendingUp} label="Last active" value={profile.lastActive} theme={infoThemes[5]} />
                  </div>
                  {profile.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-cyan-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">Portfolio Links</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {publicPortfolioUrl && (
                      <a
                        href={publicPortfolioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-cyan-400/30 bg-gradient-to-r from-cyan-500/15 to-blue-500/10 p-3 text-sm text-foreground transition hover:border-cyan-300/50"
                      >
                        <span className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-cyan-300" />
                          Public portfolio
                        </span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                    {profile.cvUrl && (
                      <a
                        href={profile.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-violet-400/30 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 p-3 text-sm text-foreground transition hover:border-violet-300/50"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-cyan-300" />
                          Uploaded CV
                        </span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                  <div className="mt-3 space-y-3">
                    {profile.portfolioItems?.map((item, index) => (
                      <div key={item.id || index} className="rounded-lg border border-violet-400/20 bg-gradient-to-br from-background/60 to-violet-950/20 p-4 shadow-sm">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-200">
                            {item.skillTag}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Verified by {item.verifiedBy}</span>
                        </div>
                        <p className="text-sm leading-6 text-foreground">{item.bulletPoint || "No portfolio note available."}</p>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200">
                            Open portfolio item
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                    {(!profile.portfolioItems || profile.portfolioItems.length === 0) && (
                      <div className="rounded-lg border border-dashed border-border/50 p-5 text-sm text-muted-foreground">
                        No portfolio items have been generated yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-foreground">Badges Earned</h3>
                    <div className="space-y-2">
                      {profile.badges?.map((badge, index) => (
                        <div key={badge.id || index} className="flex flex-col gap-3 rounded-lg border border-amber-400/25 bg-gradient-to-r from-amber-500/15 to-orange-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-200">
                              <Award className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{badge.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {badge.earnedInWeek ? `Week ${badge.earnedInWeek}` : "Milestone badge"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-amber-100/80">{formatDate(badge.unlockedAt)}</span>
                        </div>
                      ))}
                      {(!profile.badges || profile.badges.length === 0) && (
                        <div className="rounded-lg border border-dashed border-border/50 p-5 text-sm text-muted-foreground">
                          No badges earned yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-foreground">KYC and Banking</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <InfoItem icon={ShieldCheck} label="ID verification" value={profile.idVerified ? "Verified" : "Unverified"} theme={profile.idVerified ? infoThemes[1] : infoThemes[4]} />
                      <InfoItem icon={Banknote} label="Bank name" value={profile.bankName} theme={infoThemes[1]} />
                      <InfoItem icon={CreditCard} label="Account number" value={profile.accountNumber} theme={infoThemes[0]} />
                      <InfoItem icon={User} label="Account name" value={profile.accountName} theme={infoThemes[2]} />
                      <InfoItem icon={CreditCard} label="BVN" value={profile.bvn} theme={infoThemes[3]} />
                      <InfoItem icon={CreditCard} label="NIN" value={profile.nin} theme={infoThemes[5]} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
