"use client";
import { usePathname} from "next/navigation";
import Link from "next/link";
import wdcLogo from "../../../public/wdc-logo.jpg";
import Image from "next/image";
import {
  LayoutGrid, 
  SlidersHorizontal,
  Target,
  Wallet,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Talent Markets", path: "/recruiter/talent-market", icon: LayoutGrid },
  { label: "Recruiter Wallet", path: "/recruiter/wallet", icon: Wallet },
  { label: "Bounty Hunter", path: "/recruiter/bounty", icon: Target },
  { label: "Hiring Preferences", path: "/recruiter/preferences", icon: SlidersHorizontal },
];


export default function Page(){
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 mb-4">
        <Link href="/student/headquarters" className="flex items-center gap-2">
          <Image src={wdcLogo} alt="WDC Labs" className="h-8 h-[50px] w-[120px] sm:h-[55px] sm:w-[200px]" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
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
            </Link>
          );
        })}
        
      </nav>

      {/* Persona Section */}
      <div className="p-4 mx-3 mb-3 bg-sidebar-accent/50 rounded-lg">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Persona</p>
        <p className="text-foreground font-semibold">Recruiter</p>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4">
        <Link
          href="/login"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log out</span>
        </Link>
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
      <aside className="hidden lg:flex bg-background min-h-screen w-64 flex-col border-r border-sidebar-border sticky top-0 self-start">
        <SidebarContent />
      </aside>
    </>
  );
};
