"use client";
import { useState, useEffect } from "react";
import wdcLogo from "../../public/wdc-logo copy.jpg";
import actdLogo from "../../public/actd-logos.png";
import Link from "next/link";
import Image from "next/image";
const Navbar = () => {
  const [, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[hsla(207,36%,95%,1)] backdrop-blur-md border-b border-border/50 shadow-sm z-50">
      <div className="flex items-center justify-between px-5 py-3">
        <Link
          href="https://wdc.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <Image
            src={wdcLogo}
            alt="WildFusion Digital Centre"
            width={120}
            height={40}
            className="h-8 md:h-10 object-contain"
          />
        </Link>

        <Link
          href="https://www.actd.us/wildfusiondigitalcentre/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 hover:opacity-90 transition"
        >
          <Image
            src={actdLogo}
            alt="ACTD Accreditation"
            width={120}
            height={40}
            className="object-contain h-8 md:h-10 object-contain"
        />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;