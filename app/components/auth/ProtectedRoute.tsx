"use client";

import { useAuth } from "../../contexts/AuthContexts";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const IDLE_LOGOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const lastActivityRef = useRef(0);

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

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    let timeoutId: number | undefined;
    let lastTimerRefresh = 0;
    let isLoggingOut = false;

    const clearIdleTimer = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };

    const expireSession = async () => {
      if (isLoggingOut) return;

      isLoggingOut = true;
      clearIdleTimer();
      await logout();
    };

    const scheduleIdleTimer = () => {
      clearIdleTimer();

      const idleFor = Date.now() - lastActivityRef.current;
      const timeRemaining = IDLE_LOGOUT_MS - idleFor;

      if (timeRemaining <= 0) {
        void expireSession();
        return;
      }

      timeoutId = window.setTimeout(expireSession, timeRemaining);
    };

    const recordActivity = () => {
      if (document.visibilityState === "hidden") return;

      const now = Date.now();
      lastActivityRef.current = now;

      if (now - lastTimerRefresh < 1000) return;

      lastTimerRefresh = now;
      scheduleIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      if (Date.now() - lastActivityRef.current >= IDLE_LOGOUT_MS) {
        void expireSession();
        return;
      }

      recordActivity();
    };

    lastActivityRef.current = Date.now();
    scheduleIdleTimer();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoading, isAuthenticated, logout]);

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
