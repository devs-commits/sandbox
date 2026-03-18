import { useState, useEffect } from "react";
import wdcLogo from "../../public/wdc-logo.jpg";
import actdLogo from "../../public/actd-logos.png";
import Image from "next/image";
const Navbar = () => {
  const [, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsla(207,36%,95%,1)] backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <a href="https://wdc.ng/" target="_blank" rel="noopener noreferrer">
          <Image src={wdcLogo} alt="Wild Fusion Digital Centre" className="h-8 md:h-10 object-contain" />
        </a>
        <a href="https://www.actd.us/wildfusiondigitalcentre/" target="_blank" rel="noopener noreferrer">
          <Image src={actdLogo} alt="ACTD Accreditation" className="h-8 md:h-10 object-contain" />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;