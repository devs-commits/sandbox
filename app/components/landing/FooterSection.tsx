'use client'
import wdcNewLogo from "../../../public/wdc_labs_logo.png";
import {MapPin} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="bg-[#12263f] pt-12 sm:pt-16 pb-24 md:pb-8 border-t border-slate-800 text-slate-400">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 sm:mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {/* <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">W</div>
              <span className="font-bold text-xl sm:text-2xl text-white">WDC Labs</span> */}
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
            <p className="text-xs sm:text-sm max-w-sm mb-4">
              A product of Wild Fusion Digital Centre. Accredited by the American Council of Training and Development (ACTD). Building global tech talent from Nigeria.
            </p>
            <div className="text-xs mb-3">
              <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Lagos, Nigeria</p>
              <p className="mt-1"><a href="mailto:hello@wdc.ng" className="hover:text-white transition-colors">✉️ hello@wdc.ng</a></p>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Programs</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="#waitlist" className="hover:text-white transition">Digital Marketing</a></li>
              <li><a href="#waitlist" className="hover:text-white transition">Data Analytics</a></li>
              <li><a href="#waitlist" className="hover:text-white transition">Cybersecurity</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Legal & Support</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="#" className="hover:text-white transition">Visa Letter Policy</a></li>
              <li><a href="https://wdc.ng/privacy-policy/" className="hover:text-white transition">Terms of Use</a></li>
              <li><a href="https://wdc.ng/privacy-policy/" className="hover:text-white transition">Privacy Policy (NDPA)</a></li>
              <li><a href="#" className="hover:text-white transition">Recruiter Verification</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-700/50 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
          <p className="text-center md:text-left">&copy; 2026 Wild Fusion Digital Centre. All rights reserved.</p>
          <div className="flex items-center gap-4"><span className="flex items-center gap-1"><MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> Lagos, Nigeria</span></div>
        </div>
      </div>
    </footer>
  )
}
