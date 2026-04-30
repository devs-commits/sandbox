"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
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
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string; user?: any }>;
  logout: () => void;
  forgotPassword: (email: string, role: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string, token?: string) => Promise<{ success: boolean; error?: string }>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { user_metadata } = session.user;
          const { error, data } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', session.user.id)
            .single();
            
          if (!error && data) {
            setUser({
              id: session.user.id,
              user_id: data.id,
              email: session.user.email!,
              fullName: user_metadata.fullName,
              role: user_metadata.role,
              track: user_metadata.track,
              experienceLevel: user_metadata.experienceLevel,
              country: user_metadata.country,
              referralLink: user_metadata.referralLink,
              created_at: session.user.created_at,
            });
          }
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // 2. 🔥 STABILIZED AUTH LISTENER
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { user_metadata } = session.user;
        
        // Use functional update to check if we actually need to change state
        setUser((prev) => {
          // If the ID is the same, do NOT update state to prevent re-render loops
          if (prev?.id === session.user.id) return prev;

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
          };
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: string): Promise<{ success: boolean; error?: string }> => {
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

      return { success: true };
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

      return { success: true, user: result.user }; 
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: "Signup process failed" };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await supabase.auth.signOut();
    setUser(null);
  };

  const forgotPassword = async (email: string, role: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });
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
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, forgotPassword, resetPassword, authenticatedFetch }}>
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