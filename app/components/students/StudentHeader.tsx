"use client";
import { useAuth } from "../../contexts/AuthContexts";
import Link from "next/link";
import Image from "next/image";
import wdc from "../../../public/image.png";
import actdLogoClean from "../../../public/actd-logo.png";

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
        <div className="flex items-center justify-between">
          <Link
            href="https://wdc.ng/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-90 transition md:mr-5 sm:mr-5"
          >
          <Image
            src={wdc}
            alt="WildFusion Digital Centre"
            className="h-8 w-auto object-contain"
          />
          </Link>
          <Link
            href="https://www.actd.us/wildfusiondigitalcentre/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-90 transition mr-2 sm:mr-5"
          >
          <Image
            src={actdLogoClean}
            alt="ACTD Accreditation"
            className="h-8 w-auto sm:h-12 object-contain"
          />
          <span className="text-[3px] sm:text-[8px] font-semibold text-foreground leading-snug max-w-[100px] sm:max-w-[100px]">
          Accredited by the American Council of Training and Development
          </span>
      </Link>
    </div>
      </div>
    </header>
  );
};
