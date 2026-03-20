"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import wdcLogo from "../../public/wdc-logo copy.jpg";
import actdLogo from "../../public/actd-logos.png";
import ndpcLogo from "../../public/ndpc.png";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-md"
          : "bg-[hsla(207,36%,95%,1)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center justify-between py-3">

          {/* LEFT: Logo */}
          <Link href="https://wdc.ng/" target="_blank">
            <Image
              src={wdcLogo}
              alt="WildFusion Digital Centre"
              width={120}
              height={40}
              className="h-8 md:h-10 object-contain"
              priority
            />
          </Link>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Sign In */}
            <Link
              href="https://labs.wdc.ng/login"
              className="text-xs sm:text-sm font-semibold text-[#12263f] px-3 py-2 rounded-lg hover:bg-[#12263f]/10 transition"
            >
              Sign In
            </Link>

            {/* Sign Up (Primary CTA) */}
            <Link
              href="https://labs.wdc.ng/signup"
              className="text-xs sm:text-sm font-bold bg-[#12263f] text-white px-4 sm:px-6 py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm"
            >
              Get Started
            </Link>

            {/* Desktop ONLY: Trust badges */}
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-slate-200">
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
                  className="h-8 object-contain"
                />
              </Link>
              <Link
                href="https://ndpc.gov.ng/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-90 transition"
              >
                <Image
                  src={ndpcLogo}
                  alt="NDPC Compliance"
                  width={120}
                  height={40}
                  className="h-8 object-contain"
                />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}