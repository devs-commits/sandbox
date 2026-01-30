import wdcLogo from "../../public/image(1).png";
import actdLogo from "../../public/actd-logo-vsmzhRDR.png";
import actdLogoClean from "../../public/actd-logo.png";
import Image from "next/image";
import Link from "next/link";

interface AccreditationBadgeProps {
  variant?: "sidebar" | "full";
  className?: string;
}

export function AccreditationBadge({ variant = "sidebar", className = "" }: AccreditationBadgeProps) {
  const actdUrl = "https://actd.edu";

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Image src={wdcLogo} alt="Wild Fusion Digital Centre" className="h-8 object-contain" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Accredited by</span>
          <a 
            href={actdUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Image src={actdLogo} alt="ACTD - American Council of Training and Development" className="h-10 object-contain" />
          </a>
        </div>
      </div>
    );
  }

  // Sidebar compact variant
  return (
  <div className={`px-4 py-4 bg-background border-t border-border/50 ${className}`}>
    <div className="flex flex-col items-center gap-3 p-3 rounded-lg bg-background">

      {/* WDC Logo */}
      <Link
        href="https://wdc.ng/"
        target="_blank"
        rel="noopener noreferrer"
        title="Wild Fusion Digital Centre"
        className="group"
      >
        <Image
          src={wdcLogo}
          alt="Wild Fusion Digital Centre"
          className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
        />
      </Link>

      {/* Divider */}
      <div className="w-full h-px bg-border/50" />

      {/* ACTD Accreditation */}
      <Link
        href="https://www.actd.us/wildfusiondigitalcentre/"
        target="_blank"
        rel="noopener noreferrer"
        title="Accredited by American Council of Training and Development"
        className="inline-flex items-center gap-2 hover:opacity-90 transition"
      >
        <Image
          src={actdLogoClean}
          alt="ACTD Accreditation"
          className="h-14 w-auto object-contain"
        />

        <span className="text-[10px] font-semibold text-foreground leading-snug max-w-[180px]">
          Accredited by the American Council of Training and Development
        </span>
      </Link>

    </div>
  </div>
);
}
