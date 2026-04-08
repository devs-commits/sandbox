import { Eye } from "lucide-react";
import { TabsContent } from "../../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { AdminRecruiterProfileModal } from "./AdminRecruiterProfileModal";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContexts";

export default function RecruiterTab({paginatedData}: {paginatedData: any[]}){
  const [selectedRecruiter, setSelectedRecruiter] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingRecruiterId, setLoadingRecruiterId] = useState<string | null>(null);
  const { authenticatedFetch } = useAuth();

  const handleViewProfile = async (recruiter: any) => {
    setLoadingRecruiterId(recruiter.id);
    
    try {
      const response = await authenticatedFetch(`/api/admin/recruiter/${recruiter.id}/full-profile`);
      const result = await response.json();
      
      setSelectedRecruiter(result.success ? { ...recruiter, fullData: result.data } : recruiter);
      setIsModalOpen(true);
    } catch (error) {
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

  return(
    <div>
      <TabsContent value="recruiters" className="mt-0">
        <div className="rounded-lg overflow-hidden border border-border/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-[hsla(273,96%,64%,0.3)] hover:bg-[hsla(273,96%,64%,0.3)]/20">
                <TableHead className="text-foreground font-semibold">Recruiters Name</TableHead>
                <TableHead className="text-foreground font-semibold">Email</TableHead>
                <TableHead className="text-foreground font-semibold">Subscription Status</TableHead>
                <TableHead className="text-foreground font-semibold">Expires On</TableHead>
                <TableHead className="text-foreground font-semibold">Days Left</TableHead>
                <TableHead className="text-foreground font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((recruiter: any, index) => (
                <TableRow key={index} className="border-border/30">
                  <TableCell className="text-foreground">{recruiter.name}</TableCell>
                  <TableCell className="text-muted-foreground">{recruiter.email}</TableCell>
                  <TableCell>
                    <span className={recruiter.status === "Active" ? "text-emerald-400" : "text-red-400"}>
                      {recruiter.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{recruiter.expiresOn}</TableCell>
                  <TableCell className="text-muted-foreground">{recruiter.daysLeft}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleViewProfile(recruiter)}
                      disabled={loadingRecruiterId === recruiter.id}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingRecruiterId === recruiter.id ? (
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
      <AdminRecruiterProfileModal
        recruiter={selectedRecruiter}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}