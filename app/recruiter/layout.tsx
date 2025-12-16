import RecuiterSidebar from "../components/recruiter/RecruiterSidebar";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export default function page({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["recruiter"]}>
      <div className="min-h-screen bg-background flex w-full">
        <RecuiterSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
