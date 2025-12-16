import AdminSidebar from "../components/admin/AdminSidebar";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export default function page({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background flex w-full">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
