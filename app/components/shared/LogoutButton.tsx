"use client";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContexts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";

interface LogoutButtonProps {
  variant?: "sidebar" | "mobile";
  className?: string;
  onClick?: () => void;
}

export default function LogoutButton({ variant = "sidebar", className, onClick }: LogoutButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      onClick?.();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const baseClasses = variant === "sidebar" 
    ? "flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
    : "flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className={`${baseClasses} ${className || ""}`}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log out</span>
            </>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Confirm Logout</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to log out? You'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Logging out...
              </>
            ) : (
              "Log out"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
