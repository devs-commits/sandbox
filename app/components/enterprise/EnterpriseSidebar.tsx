"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import wdcNewLogo from "../../../public/wdc_labs_logo.png";
import Image from "next/image";
import { LayoutGrid, Target, Wallet, Menu, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useState } from "react";
import LogoutButton from "../shared/LogoutButton";

const navItems = [
  { label: "White Label", path: "/enterprise/white-label", icon: LayoutGrid },
  { label: "Pre-Vetting", path: "/enterprise/pre-vetting", icon: Wallet },
  { label: "Settings", path: "/enterprise/settings", icon: Target },
];

export default function EnterpriseSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mx-3 mb-3 bg-sidebar-accent/50 rounded-lg">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Persona</p>
        <p className="text-foreground font-semibold">Enterprise</p>
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

      <aside className="hidden lg:flex bg-background min-h-screen w-64 flex-col border-r border-sidebar-border sticky top-0 self-start">
        <SidebarContent />
      </aside>
    </>
  );
}