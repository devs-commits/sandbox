import { Eye } from "lucide-react";
import { TabsContent } from "../../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { AdminStudentProfileModal } from "./AdminStudentProfileModal";
import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContexts";

export default function StudentTab({ paginatedData }: { paginatedData: any[] }) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);
  const { authenticatedFetch } = useAuth();

  const handleViewProfile = async (student: any) => {
    setLoadingStudentId(student.id);
    
    try {
      const response = await authenticatedFetch(`/api/admin/student/${student.id}/full-profile`);
      const result = await response.json();
      
      setSelectedStudent(result.success ? { ...student, fullData: result.data } : student);
      setIsModalOpen(true);
    } catch (error) {
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
        <div className="rounded-lg overflow-hidden border border-border/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-[hsla(273,96%,64%,0.3)] hover:bg-[hsla(273,96%,64%,0.3)]/20">
                <TableHead className="text-foreground font-semibold">Name</TableHead>
                <TableHead className="text-foreground font-semibold">Email</TableHead>
                <TableHead className="text-foreground font-semibold">Course</TableHead>
                <TableHead className="text-foreground font-semibold">Subscription Expiration</TableHead>
                <TableHead className="text-foreground font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((student: any, index) => (
                <TableRow key={index} className="border-border/30">
                  <TableCell className="text-foreground">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                  <TableCell className="text-muted-foreground">{student.course}</TableCell>
                  <TableCell className="text-muted-foreground">{student.expiration}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleViewProfile(student)}
                      disabled={loadingStudentId === student.id}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingStudentId === student.id ? (
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
      <AdminStudentProfileModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}