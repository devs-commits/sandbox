"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { toast } from "sonner";

interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "recruiter" | "admin" | "enterprise";
  track?: string;
  country?: string;
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
}

// Mock users - replace with backend API
const MOCK_USERS: AuthUser[] = [
  { id: "user-001", fullName: "John Snow", email: "john@gmail.com", role: "student", track: "Digital Marketing", country: "Nigeria" },
  { id: "user-002", fullName: "Admin User", email: "admin@gmail.com", role: "admin" },
  { id: "user-003", fullName: "Recruiter One", email: "recruiter@gmail.com", role: "recruiter" },
  { id: "user-004", fullName: "Enterprise One", email: "enterprise@gmail.com", role:"enterprise"},
];

const MOCK_PASSWORD = "password123";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const simulateApiDelay = () => new Promise(resolve => setTimeout(resolve, 800));

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("wdc_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("wdc_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await simulateApiDelay();

    // Replace with: POST /api/auth/login
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    
    if (!foundUser) {
      setIsLoading(false);
      return { success: false, error: "No account found with this email and role combination" };
    }

    if (password !== MOCK_PASSWORD) {
      setIsLoading(false);
      return { success: false, error: "Incorrect password" };
    }

    setUser(foundUser);
    localStorage.setItem("wdc_user", JSON.stringify(foundUser));
    setIsLoading(false);
    return { success: true };
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await simulateApiDelay();

    // Replace with: POST /api/auth/signup
    const existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (existingUser) {
      setIsLoading(false);
      return { success: false, error: "An account with this email already exists" };
    }

    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      track: data.track,
      country: data.country,
    };

    MOCK_USERS.push(newUser);
    setUser(newUser);
    localStorage.setItem("wdc_user", JSON.stringify(newUser));
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    // Replace with: POST /api/auth/logout
    setUser(null);
    localStorage.removeItem("wdc_user");
    toast.success("Logged out successfully");
  };

  const forgotPassword = async (email: string, role: string): Promise<{ success: boolean; error?: string }> => {
    await simulateApiDelay();
    // Replace with: POST /api/auth/forgot-password
    const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    if (!foundUser) {
      return { success: false, error: "No account found with this email and role" };
    }
    return { success: true };
  };

  const resetPassword = async (newPassword: string, token?: string): Promise<{ success: boolean; error?: string }> => {
    await simulateApiDelay();
    // Replace with: POST /api/auth/reset-password
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }
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