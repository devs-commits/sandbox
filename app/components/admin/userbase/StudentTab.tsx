import { Eye, Loader2, MoreHorizontal, Pencil } from "lucide-react";
import { TabsContent } from "../../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { AdminStudentProfileModal } from "./AdminStudentProfileModal";
import type { StudentProfileData } from "./AdminStudentProfileModal";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContexts";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

const statusClass = (status?: string) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("active")) return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (normalized.includes("trial")) return "bg-violet-500/15 text-violet-300 border-violet-500/30";
  if (normalized.includes("expired")) return "bg-red-500/15 text-red-300 border-red-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "ST";

export interface StudentListItem {
  id: string;
  internalId: number | string;
  name: string;
  email: string;
  course: string;
  courseLabel: string;
  enrollmentStatus: string;
  status: string;
  plan: string;
  subscriptionExpiresAt: string | null;
  startDate: string | null;
  country: string;
  phone: string;
  tasksCompleted: number;
  progress: number;
  averageScore: number;
  walletBalance: number;
  idVerified: boolean;
  fullData?: StudentProfileData;
}

type ProfileResponse = {
  success: boolean;
  data?: StudentProfileData;
};

export default function StudentTab({
  paginatedData,
  onStudentUpdated,
}: {
  paginatedData: StudentListItem[];
  onStudentUpdated?: (student: StudentProfileData) => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileMode, setProfileMode] = useState<"view" | "edit">("view");
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);
  const { authenticatedFetch } = useAuth();

  const handleOpenProfile = async (student: StudentListItem, mode: "view" | "edit") => {
    if (!student.id) return;

    setLoadingStudentId(student.id);
    setProfileMode(mode);

    try {
      const response = await authenticatedFetch(`/api/admin/student/${student.id}/full-profile`);
      const result = (await response.json()) as ProfileResponse;

      setSelectedStudent(result.success && result.data ? { ...student, fullData: result.data } : student);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch student profile", error);
      setSelectedStudent(student);
      setIsModalOpen(true);
    } finally {
      setLoadingStudentId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <div>
      <TabsContent value="students" className="mt-0">
        <div className="overflow-x-auto rounded-lg border border-cyan-400/20 bg-[#102033]/70 shadow-sm">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-emerald-500/10 hover:from-cyan-500/20 hover:via-violet-500/15 hover:to-emerald-500/10">
                <TableHead className="text-foreground font-semibold">Student</TableHead>
                <TableHead className="text-foreground font-semibold">Course</TableHead>
                <TableHead className="text-foreground font-semibold">Enrollment Status</TableHead>
                <TableHead className="text-foreground font-semibold">Progress</TableHead>
                <TableHead className="text-foreground font-semibold">Score</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((student) => (
                <TableRow key={student.id || student.internalId} className="border-border/30 transition hover:bg-white/[0.03]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/30 to-violet-500/30 text-xs font-semibold text-cyan-50 ring-1 ring-white/10">
                        {getInitials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{student.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.courseLabel || student.course}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClass(student.enrollmentStatus)}>
                      {student.enrollmentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-[120px]">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{student.tasksCompleted || 0} tasks</span>
                        <span className="text-foreground">{student.progress || 0}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                          style={{ width: `${Math.min(Number(student.progress || 0), 100)}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-100">
                      {student.averageScore || 0}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingStudentId === student.id}
                          className="h-8 w-8 p-0 text-cyan-100 hover:bg-cyan-400/10 hover:text-cyan-50"
                        >
                          {loadingStudentId === student.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleOpenProfile(student, "view")} className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenProfile(student, "edit")} className="gap-2">
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No students match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <AdminStudentProfileModal
        student={selectedStudent}
        isOpen={isModalOpen}
        mode={profileMode}
        onClose={handleCloseModal}
        onSaved={onStudentUpdated}
      />
    </div>
  );
}
