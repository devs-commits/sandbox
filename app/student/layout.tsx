import { StudentSidebar } from "../components/students/StudentSidebar";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PhoneUpdateModal } from "../components/auth/PhoneUpdateModal"; // 🔥 Added import

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      {/* 🔥 This sits invisibly at the top of the layout. 
        If the user has no phone number, it takes over the entire screen 
        with a z-[9999] overlay and forces them to update it.
      */}
      <PhoneUpdateModal />
      
      <div className="min-h-screen bg-background flex w-full relative">
        <StudentSidebar />
        <main className="flex-1 overflow-auto max-w-7xl mx-auto bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}