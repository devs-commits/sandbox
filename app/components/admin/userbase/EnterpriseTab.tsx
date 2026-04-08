import { Eye } from "lucide-react";
import { TabsContent } from "../../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { AdminEnterpriseProfileModal } from "./AdminEnterpriseProfileModal";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContexts";

export default function EnterpriseTab({paginatedData}:{paginatedData : any[]}){
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingEnterpriseId, setLoadingEnterpriseId] = useState<string | null>(null);
  const { authenticatedFetch } = useAuth();

  const handleViewProfile = async (enterprise: any) => {
    setLoadingEnterpriseId(enterprise.id);
    
    try {
      const response = await authenticatedFetch(`/api/admin/enterprise/${enterprise.id}/full-profile`);
      const result = await response.json();
      
      setSelectedEnterprise(result.success ? { ...enterprise, fullData: result.data } : enterprise);
      setIsModalOpen(true);
    } catch (error) {
      setSelectedEnterprise(enterprise);
      setIsModalOpen(true);
    } finally {
      setLoadingEnterpriseId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEnterprise(null);
  };

  return(
    <div>
      <TabsContent value="enterprise" className="mt-0">
        <div className="rounded-lg overflow-hidden border border-border/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-[hsla(273,96%,64%,0.3)] hover:bg-[hsla(273,96%,64%,0.3)]/20">
                <TableHead className="text-foreground font-semibold">Company Name</TableHead>
                <TableHead className="text-foreground font-semibold">Subscription Plan</TableHead>
                <TableHead className="text-foreground font-semibold">Subscription Status</TableHead>
                <TableHead className="text-foreground font-semibold">Expires On</TableHead>
                <TableHead className="text-foreground font-semibold">Days Left</TableHead>
                <TableHead className="text-foreground font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((enterprise: any, index) => (
                <TableRow key={index} className="border-border/30">
                  <TableCell className="text-foreground">{enterprise.company}</TableCell>
                  <TableCell className="text-muted-foreground">{enterprise.plan}</TableCell>
                  <TableCell>
                    <span className={enterprise.status === "Active" ? "text-emerald-400" : "text-red-400"}>
                      {enterprise.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{enterprise.expiresOn}</TableCell>
                  <TableCell className="text-muted-foreground">{enterprise.daysLeft}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleViewProfile(enterprise)}
                      disabled={loadingEnterpriseId === enterprise.id}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingEnterpriseId === enterprise.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          View
                        </>
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <AdminEnterpriseProfileModal
        enterprise={selectedEnterprise}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}