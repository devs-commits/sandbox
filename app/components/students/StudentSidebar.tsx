"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import wdcNewLogo from "../../../public/wdc_labs_logo.png";
import Image from "next/image";
import { LayoutGrid, Briefcase, FolderOpen, Target, Wallet, Users, DollarSign, Menu, X, Lock } from "lucide-react";
import LogoutButton from "../shared/LogoutButton";
import { cn } from "../../../lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../contexts/AuthContexts";

const navItems = [
  { label: "Headquarters", icon: LayoutGrid, path: "/student/headquarters" },
  { label: "My Office", icon: Briefcase, path: "/student/office", id: "office" },
  { label: "My Portfolio", icon: FolderOpen, path: "/student/portfolio" },
  { label: "Global Wallet", icon: Wallet, path: "/student/wallet" },
  { label: "Squad", icon: Users, path: "/student/squad" },
];

export const StudentSidebar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  
  // --- ADDED: Subscription Lock State ---
  const [isOfficeLocked, setIsOfficeLocked] = useState(false);

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user) return;
      
      // 1. Fetch Task Count
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user_id)
        .eq('completed', true);
        
      if (count !== null) setCompletedTasksCount(count);

      // 2. Fetch Subscription Status for the Lock
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_status, subscription_expires_at')
        .eq('auth_id', user.id)
        .single();

      if (userData) {
        const expiresAt = new Date(userData.subscription_expires_at);
        const now = new Date();
        const isExpired = expiresAt <= now;
        const isInactive = userData.subscription_status !== 'active';
        
        setIsOfficeLocked(isExpired || isInactive);
      }
    };

    fetchSidebarData();
    
    const channel = supabase
      .channel('sidebar-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `user_id=eq.${user?.user_id}`
      }, fetchSidebarData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 mb-4 mt-5 ml-5 max-w-3xl">
        <Link href="https://labs.wdc.ng/signup" target="_blank">
          <Image
            src={wdcNewLogo}
            alt="WildFusion Digital Centre"
            width={120}
            height={40}
            className="h-8 md:h-10 object-contain contrast-50 brightness-200"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const badgeCount = item.id === "office" ? completedTasksCount : 0;
          
          // --- ADDED: Logic to visually lock "My Office" ---
         // ... inside navItems.map loop
const isItemLocked = item.id === "office" && isOfficeLocked;

if (isItemLocked) {
  return (
    <div
      key={item.path}
      className="group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-muted-foreground/40 cursor-not-allowed border border-transparent"
    >
      <div className="flex items-center gap-3">
        <item.icon size={18} className="opacity-40" />
        <span className="text-sm font-medium">{item.label}</span>
      </div>
      
      {/* The Lock Icon */}
      <Lock size={14} className="text-red-500/30 group-hover:text-red-500/60 transition-colors" />

      {/* 💡 THE HOVER NOTE (Tooltip) */}
      <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 border border-red-500/20 text-white text-[11px] rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-red-400">Subscription Expired</span>
          <span>Fund your wallet to unlock your office.</span>
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 border-l border-b border-red-500/20 rotate-45" />
      </div>
    </div>
  );
}

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                isActive ? "bg-primary/20 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span className="bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}

        <Link
          href="/student/earn"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mt-2",
            pathname === "/student/earn"
              ? "bg-green-500/20 text-green-400"
              : "text-green-400 bg-green-500/20 hover:bg-green-500/10"
          )}
        >
          <DollarSign size={18} />
          <span className="text-sm font-medium">Earn Money</span>
        </Link>
      </nav>

      <div className="p-2 m-4 mx-3 mb-3 bg-sidebar-accent/50 rounded-lg">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Persona</p>
        <p className="text-foreground font-semibold">Student</p>
      </div>

      <div className="px-3 pb-4">
        <LogoutButton variant="sidebar" onClick={() => setMobileOpen(false)} />
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground"
      >
        <Menu size={24} />
      </button>

      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "lg:hidden fixed top-0 left-0 h-full w-64 bg-background z-50 flex flex-col transform transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-sidebar-foreground"
        >
          <X size={24} />
        </button>
        <SidebarContent />
      </aside>

      <aside className="hidden lg:flex bg-[hsla(222,47%,11%,1)] min-h-screen w-64 flex-col border-r border-sidebar-border sticky top-0 self-start">
        <SidebarContent />
      </aside>
    </>
  );
};