import EnterpriseSidebar from "../components/enterprise/EnterpriseSidebar";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export default function page({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["enterprise"]}>
      <div className="min-h-screen bg-background flex w-full">
        <EnterpriseSidebar />
        <main className="flex-1 overflow-auto max-w-7xl mx-auto bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
