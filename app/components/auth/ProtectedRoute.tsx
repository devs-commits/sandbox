"use client";

import { useAuth } from "../../contexts/AuthContexts";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/login?from=${encodeURIComponent(pathname)}`);
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard if they are in the wrong place
        const roleRedirects: Record<string, string> = {
          student: "/student/headquarters",
          recruiter: "/recruiter/talent-market",
          admin: "/admin/dashboard",
          enterprise: "/enterprise/white-label",
        };
        router.push(roleRedirects[user.role] || "/");
      }
    }
  }, [isLoading, isAuthenticated, router, pathname, allowedRoles, user]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect
  }

  return <>{children}</>;
};
