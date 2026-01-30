"use client";
import { usePathname} from "next/navigation";
import Link from "next/link";
import wdcLogo from "../../../public/wdc-logo.jpg";
import Image from "next/image";
import { 
  LayoutGrid, 
  Briefcase, 
  FolderOpen,
  Target,
  Wallet,
  Users,
  DollarSign,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

const navItems = [
  { label: "Headquarters", icon: LayoutGrid, path: "/student/headquarters" },
  { label: "My Office", icon: Briefcase, path: "/student/office", id: "office" },
  { label: "My Portfolio", icon: FolderOpen, path: "/student/portfolio" },
  { label: "Bounty Hunter", icon: Target, path: "/student/bounty" },
  { label: "Global Wallet", icon: Wallet, path: "/student/wallet" },
  { label: "Squad", icon: Users, path: "/student/squad" },
];

import { useAuth } from "../../contexts/AuthContexts";
import { AccreditationBadge } from "../Accreditation";

export const StudentSidebar = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [completedTasksCount, setCompletedTasksCount] = useState(0);

  useEffect(() => {
    const fetchCompletedTasks = async () => {
      if (!user) return;
      
      const { count, error } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user', user.id)
        .eq('completed', true);
        
      if (!error && count !== null) {
        setCompletedTasksCount(count);
      }
    };

    fetchCompletedTasks();
    
    // Optional: Subscribe to changes to update in real-time
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks',
        filter: `user=eq.${user?.id}`
      }, () => {
        fetchCompletedTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 mb-4">
        <Link href="/student/headquarters" className="flex items-center gap-2">
          <Image src={wdcLogo} alt="WDC Labs" className="h-8 h-[50px] w-[157px] sm:h-[65px] sm:w-[214px]" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          // @ts-ignore
          const badgeCount = item.id === "office" ? completedTasksCount : item.badge;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
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
        
        {/* Earn Money - Special styling */}
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

      {/* Persona Section */}
      <div className="p-2 m-4 mx-3 mb-3 bg-sidebar-accent/50 rounded-lg">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Persona</p>
        <p className="text-foreground font-semibold">Student</p>
      </div>
      <AccreditationBadge />
      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-lg text-sidebar-foreground"
      >
        <Menu size={24} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
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

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex bg-[hsla(222,47%,11%,1)] min-h-screen w-64 flex-col border-r border-sidebar-border sticky top-0 self-start">
        <SidebarContent />
      </aside>
    </>
  );
};
