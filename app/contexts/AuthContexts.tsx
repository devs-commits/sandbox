"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "recruiter" | "admin" | "enterprise";
  track?: string;
  experienceLevel?: string;
  country?: string;
  referralLink?: string;
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
          setUser({
            id: session.user.id,
            email: session.user.email!,
            fullName: user_metadata.fullName,
            role: user_metadata.role,
            track: user_metadata.track,
            experienceLevel: user_metadata.experienceLevel,
            country: user_metadata.country,
            referralLink: user_metadata.referralLink,
          });
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
          email: session.user.email!,
          fullName: user_metadata.fullName,
          role: user_metadata.role,
          track: user_metadata.track,
          experienceLevel: user_metadata.experienceLevel,
          country: user_metadata.country,
          referralLink: user_metadata.referralLink,
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
    // Implement Supabase reset password logic here if needed
    // await supabase.auth.resetPasswordForEmail(email)
    return { success: true };
  };

  const resetPassword = async (newPassword: string, token?: string): Promise<{ success: boolean; error?: string }> => {
    // Implement Supabase update user logic here
    // await supabase.auth.updateUser({ password: newPassword })
    return { success: true };
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