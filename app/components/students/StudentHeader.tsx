"use client";
import { useAuth } from "../../contexts/AuthContexts";

interface StudentHeaderProps {
  title: string;
  subtitle?: string;
}

export const StudentHeader = ({ title, subtitle }: StudentHeaderProps) => {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTrack = (track?: string) => {
    if (!track) return "Student";
    return track
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <header className="px-4 lg:px-6 py-4 flex items-center justify-between border-b border-border">
      {/* Left side - Title */}
      <div className="lg:ml-0 ml-12">
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Right side - User info */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">
            {formatTrack(user?.track)}
          </p>
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">INTERN</span>
        </div>
        <div className="flex items-center gap-2 bg-primary/20 text-primary-foreground px-3 py-1.5 rounded-full">
          <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.fullName ? getInitials(user.fullName) : "U"}
          </div>
          <span className="text-sm font-medium hidden sm:inline text-foreground">
            {user?.fullName || "User"}
          </span>
        </div>
      </div>
    </header>
  );
};
