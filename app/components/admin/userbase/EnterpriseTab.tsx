import { Building2, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContexts";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { TabsContent } from "../../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { AdminEnterpriseProfileModal } from "./AdminEnterpriseProfileModal";

type EnterpriseProfileData = {
  companyName: string;
  industry: string;
  companySize: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  plan: string;
  subscriptionStatus: string;
  expiration: string;
  activeUsers: number;
  storageUsed: string;
  apiCalls: number;
  founded?: string;
};

export interface EnterpriseListItem {
  id?: string;
  company: string;
  plan: string;
  status: string;
  expiresOn: string;
  daysLeft: string;
  fullData?: EnterpriseProfileData;
}

type EnterpriseModalItem = EnterpriseListItem & { id: string };

type ProfileResponse = {
  success: boolean;
  data?: EnterpriseProfileData;
};

const statusClass = (status: string) =>
  status.toLowerCase() === "active"
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
    : "border-red-400/25 bg-red-400/10 text-red-100";

export default function EnterpriseTab({ paginatedData }: { paginatedData: EnterpriseListItem[] }) {
  const [selectedEnterprise, setSelectedEnterprise] = useState<EnterpriseModalItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingEnterpriseId, setLoadingEnterpriseId] = useState<string | null>(null);
  const { authenticatedFetch } = useAuth();

  const handleViewProfile = async (enterprise: EnterpriseListItem) => {
    const modalEnterprise = { ...enterprise, id: enterprise.id || enterprise.company };

    if (!enterprise.id) {
      setSelectedEnterprise(modalEnterprise);
      setIsModalOpen(true);
      return;
    }

    setLoadingEnterpriseId(enterprise.id);

    try {
      const response = await authenticatedFetch(`/api/admin/enterprise/${enterprise.id}/full-profile`);
      const result = (await response.json()) as ProfileResponse;

      setSelectedEnterprise(result.success && result.data ? { ...modalEnterprise, fullData: result.data } : modalEnterprise);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch enterprise profile", error);
      setSelectedEnterprise(modalEnterprise);
      setIsModalOpen(true);
    } finally {
      setLoadingEnterpriseId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEnterprise(null);
  };

  return (
    <div>
      <TabsContent value="enterprise" className="mt-0">
        <div className="overflow-x-auto rounded-lg border border-amber-400/20 bg-[#102033]/70 shadow-sm">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-amber-500/20 via-violet-500/10 to-cyan-500/10 hover:from-amber-500/20 hover:via-violet-500/10 hover:to-cyan-500/10">
                <TableHead className="font-semibold text-foreground">Company</TableHead>
                <TableHead className="font-semibold text-foreground">Subscription Plan</TableHead>
                <TableHead className="font-semibold text-foreground">Subscription Status</TableHead>
                <TableHead className="font-semibold text-foreground">Expires On</TableHead>
                <TableHead className="font-semibold text-foreground">Days Left</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((enterprise) => (
                <TableRow key={enterprise.id || enterprise.company} className="border-border/30 transition hover:bg-white/[0.03]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/30 to-violet-500/30 text-amber-50 ring-1 ring-white/10">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <p className="font-medium text-foreground">{enterprise.company}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{enterprise.plan}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClass(enterprise.status)}>
                      {enterprise.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{enterprise.expiresOn}</TableCell>
                  <TableCell className="text-muted-foreground">{enterprise.daysLeft}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProfile(enterprise)}
                      disabled={loadingEnterpriseId === enterprise.id}
                      className="gap-2 text-amber-100 hover:bg-amber-400/10 hover:text-amber-50"
                    >
                      {loadingEnterpriseId === enterprise.id ? (
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
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No enterprise accounts match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <AdminEnterpriseProfileModal enterprise={selectedEnterprise} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
