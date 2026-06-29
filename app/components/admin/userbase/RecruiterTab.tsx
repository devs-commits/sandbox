import { Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContexts";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { TabsContent } from "../../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { AdminRecruiterProfileModal } from "./AdminRecruiterProfileModal";

type RecruiterProfileData = {
  companyName: string;
  industry: string;
  location: string;
  website: string;
  phone: string;
  plan: string;
  subscriptionStatus: string;
  expiration: string;
  candidatesViewed: number;
  messagesSent: number;
  companySize?: string;
};

export interface RecruiterListItem {
  id: string;
  internalId?: number | string;
  name: string;
  email: string;
  status: string;
  expiresOn: string;
  daysLeft: string;
  fullData?: RecruiterProfileData;
}

type ProfileResponse = {
  success: boolean;
  data?: RecruiterProfileData;
};

const statusClass = (status: string) =>
  status.toLowerCase() === "active"
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
    : "border-red-400/25 bg-red-400/10 text-red-100";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "RC";

export default function RecruiterTab({ paginatedData }: { paginatedData: RecruiterListItem[] }) {
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingRecruiterId, setLoadingRecruiterId] = useState<string | null>(null);
  const { authenticatedFetch } = useAuth();

  const handleViewProfile = async (recruiter: RecruiterListItem) => {
    if (!recruiter.id) {
      setSelectedRecruiter(recruiter);
      setIsModalOpen(true);
      return;
    }

    setLoadingRecruiterId(recruiter.id);

    try {
      const response = await authenticatedFetch(`/api/admin/recruiter/${recruiter.id}/full-profile`);
      const result = (await response.json()) as ProfileResponse;

      setSelectedRecruiter(result.success && result.data ? { ...recruiter, fullData: result.data } : recruiter);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch recruiter profile", error);
      setSelectedRecruiter(recruiter);
      setIsModalOpen(true);
    } finally {
      setLoadingRecruiterId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecruiter(null);
  };

  return (
    <div>
      <TabsContent value="recruiters" className="mt-0">
        <div className="overflow-x-auto rounded-lg border border-emerald-400/20 bg-[#102033]/70 shadow-sm">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-violet-500/10 hover:from-emerald-500/20 hover:via-cyan-500/10 hover:to-violet-500/10">
                <TableHead className="font-semibold text-foreground">Recruiter</TableHead>
                <TableHead className="font-semibold text-foreground">Subscription Status</TableHead>
                <TableHead className="font-semibold text-foreground">Expires On</TableHead>
                <TableHead className="font-semibold text-foreground">Days Left</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((recruiter) => (
                <TableRow key={recruiter.id || recruiter.internalId || recruiter.email} className="border-border/30 transition hover:bg-white/[0.03]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/30 to-cyan-500/30 text-xs font-semibold text-emerald-50 ring-1 ring-white/10">
                        {getInitials(recruiter.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{recruiter.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{recruiter.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClass(recruiter.status)}>
                      {recruiter.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{recruiter.expiresOn}</TableCell>
                  <TableCell className="text-muted-foreground">{recruiter.daysLeft}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProfile(recruiter)}
                      disabled={loadingRecruiterId === recruiter.id}
                      className="gap-2 text-emerald-100 hover:bg-emerald-400/10 hover:text-emerald-50"
                    >
                      {loadingRecruiterId === recruiter.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No recruiters match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <AdminRecruiterProfileModal recruiter={selectedRecruiter} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
