"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";

interface AuthUser {
  id: string; // The UUID (auth_id)
  user_id: number; // The numeric DB ID
  fullName: string;
  email: string;
  role: "student" | "recruiter" | "admin" | "enterprise";
  track?: string;
  experienceLevel?: string;
  country?: string;
  referralLink?: string;
  created_at?: string;
  // 🔥 Unified Intelligence Variables
  tasksCompleted?: number;
  subscriptionStatus?: string;
  currentWeek?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string; requiresFirstShift?: boolean }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string; user?: any }>;
  logout: () => void;
  forgotPassword: (email: string, role: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string, token?: string) => Promise<{ success: boolean; error?: string }>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
  refreshUserStats: () => Promise<void>; // 🔥 Trigger this to re-sync stats across Sidebar/Headquarters
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  role: "student" | "recruiter";
  country: string;
  track?: string;
  experienceLevel?: string;
  referralLink?: string;
  squadSlug?: string; 
  subscriptionPlan?: string; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Helper function to silently fetch and patch the user state with DB stats
  const fetchUserStats = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('track, tasks_completed, subscription_status')
        .eq('auth_id', userId)
        .single();
        
      if (!error && data) {
        setUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            track: data.track || prev.track,
            tasksCompleted: data.tasks_completed || 0,
            subscriptionStatus: data.subscription_status || "inactive",
            currentWeek: (data.tasks_completed || 0) + 1,
          };
        });
      }
    } catch (err) {
      console.error("Failed to sync DB stats:", err);
    }
  }, []);

  const refreshUserStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserStats(session.user.id);
    }
  };

  useEffect(() => {
    const recordStudentActivity = async (accessToken?: string) => {
      if (!accessToken) return;
      try {
        await fetch('/api/users/activity', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (error) {
        console.warn('Unable to record user activity', error);
      }
    };

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { user_metadata } = session.user;
          // 🔥 Modified to pull the extra unified variables on initial load
          const { error, data } = await supabase
            .from('users')
            .select('id, track, tasks_completed, subscription_status')
            .eq('auth_id', session.user.id)
            .single();
            
          if (!error && data) {
            setUser({
              id: session.user.id,
              user_id: data.id,
              email: session.user.email!,
              fullName: user_metadata.fullName,
              role: user_metadata.role,
              track: data.track || user_metadata.track,
              experienceLevel: user_metadata.experienceLevel,
              country: user_metadata.country,
              referralLink: user_metadata.referralLink,
              created_at: session.user.created_at,
              // Map our new DB stats:
              tasksCompleted: data.tasks_completed || 0,
              subscriptionStatus: data.subscription_status || "inactive",
              currentWeek: (data.tasks_completed || 0) + 1,
            });
            void recordStudentActivity(session.access_token);
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const { user_metadata } = session.user;
        
        setUser((prev) => {
          if (prev?.id === session.user.id) return prev;
          
          // 🔥 Return synchronous state instantly so the app doesn't crash/redirect
          return {
            id: session.user.id,
            user_id: user_metadata.id, 
            email: session.user.email!,
            fullName: user_metadata.fullName,
            role: user_metadata.role,
            track: user_metadata.track,
            experienceLevel: user_metadata.experienceLevel,
            country: user_metadata.country,
            referralLink: user_metadata.referralLink,
            created_at: session.user.created_at,
            tasksCompleted: 0,
            subscriptionStatus: "inactive",
            currentWeek: 1
          };
        });
        
        // 🔥 Then fetch the updated DB stats silently in the background
        fetchUserStats(session.user.id);
        void recordStudentActivity(session.access_token);
      } else {
        setUser(null);
      }
      setIsLoading(false); // Can safely fire immediately now!
    });

    return () => subscription.unsubscribe();
  }, [fetchUserStats]);

  const login = async (email: string, password: string, role: string): Promise<{ success: boolean; error?: string; requiresFirstShift?: boolean }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!data.success) {
        setIsLoading(false);
        return { success: false, error: data.error };
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      return { success: true, requiresFirstShift: data.requiresFirstShift === true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: "Authentication failed" };
    }
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string; user?: any }> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setIsLoading(false);
        return { success: false, error: result.error };
      }

      if (result.session) {
        await supabase.auth.setSession(result.session);
      }

      const newAuthId = result.user?.id || result.data?.user?.id;
      
      if (data.referralLink && newAuthId) {
        try {
          const { data: newUserDB } = await supabase.from('users').select('id').eq('auth_id', newAuthId).single();
          const { data: referrerDB } = await supabase.from('users').select('id').eq('referral_code', data.referralLink.toLowerCase().trim()).maybeSingle();

          if (newUserDB && referrerDB) {
            await supabase.from('referrals').insert({ referrer_id: referrerDB.id, referred_user_id: newUserDB.id, status: 'pending' });
          }
        } catch (refError) {}
      }

      if (data.squadSlug && newAuthId) {
        try {
          await fetch('/api/squad/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: newAuthId, slug: data.squadSlug }) });
        } catch (squadErr) {}
      }

      return { success: true, user: result.user }; 
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: "Signup process failed" };
    }
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      localStorage.removeItem("supabase.auth.token"); 
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    await supabase.auth.signOut();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = '/login';
    }
  };

  const forgotPassword = async (email: string, role: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl}/reset-password` });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (newPassword: string, token?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { ...(options.headers as Record<string, string>), 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, forgotPassword, resetPassword, authenticatedFetch, refreshUserStats }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};