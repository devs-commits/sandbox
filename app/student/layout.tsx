import { StudentSidebar } from "../components/students/StudentSidebar";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <div className="min-h-screen bg-background flex w-full">
        <StudentSidebar />
        <main className="flex-1 overflow-auto max-w-7xl mx-auto p-4 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
