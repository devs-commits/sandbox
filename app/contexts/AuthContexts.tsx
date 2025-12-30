"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect, use } from "react";
import { supabase } from "../../lib/supabase";

interface AuthUser {
  id: string;
  user_id: number;
  fullName: string;
  email: string;
  role: "student" | "recruiter" | "admin" | "enterprise";
  track?: string;
  experienceLevel?: string;
  country?: string;
  referralLink?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  forgotPassword: (email: string, role: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string, token?: string) => Promise<{ success: boolean; error?: string }>;
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



    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { user_metadata } = session.user;
          //query the user profile from your users table now to get the user_id and other info
          const { error, data } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', session.user.id)
            .single();
          console.log("Fetched user profile data:", data);
          if (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
            return;
          }

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
          console.log("User session found:", user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { user_metadata } = session.user;
        setUser({
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
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
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

      // Sync session with client-side Supabase instance
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
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

      // If signup automatically logs in (Supabase default behavior if email confirm is off), sync session
      if (result.session) {
        await supabase.auth.setSession(result.session);
      }

      return { success: true };
    } catch (err) {
      setIsLoading(false);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await supabase.auth.signOut(); // Also clear client side
    setUser(null);
    localStorage.removeItem("wdc_user");
  };

  const forgotPassword = async (email: string, role: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Use configured site URL or fallback to current origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      console.log("Using site URL for password reset:", siteUrl);

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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, forgotPassword, resetPassword }}>
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