'use client'

import { ShieldCheck } from "lucide-react"

export default function TrustBand() {
  const logos = (
    <div className="flex gap-10 md:gap-16 shrink-0 items-center">
      <div className="font-bold text-2xl sm:text-3xl text-[#1434CB] tracking-tighter italic">VISA</div>
      <div className="flex items-center gap-1 font-bold text-xl sm:text-2xl text-slate-800">
        <div className="flex -space-x-2 sm:-space-x-3"><div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#EB001B] mix-blend-multiply" /><div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#F79E1B] mix-blend-multiply" /></div>
        <span className="ml-1 tracking-tight">mastercard</span>
      </div>
      <div className="flex items-center font-bold text-xl sm:text-2xl text-[#092E40] tracking-tight">
        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#0BA4DB] rounded-sm mr-1.5 flex items-center justify-center"><div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white" /></div>paystack
      </div>
      <div className="font-bold text-xl sm:text-2xl text-[#635BFF] tracking-tighter">stripe</div>
      <div className="flex flex-col items-center justify-center"><span className="font-bold text-slate-800 text-xs sm:text-sm">CBN Regulated</span><span className="text-[8px] sm:text-[10px] text-slate-500 font-medium">Central Bank of Nigeria</span></div>
      <div className="font-black text-xl sm:text-2xl text-slate-800 tracking-tighter">NIBSS</div>
      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-800 border border-slate-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white shadow-sm whitespace-nowrap">
        <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" /> NDPR Compliant
      </div>
    </div>
  )

  return (
    <section className="py-8 sm:py-10 bg-slate-50 border-t border-slate-200 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-12 sm:w-24 h-full bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-12 sm:w-24 h-full bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-4 mb-4">
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secured Transactions & Regulatory Compliance</p>
      </div>
      <div className="animate-marquee-logos flex gap-10 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500 items-center mt-4 sm:mt-6 px-4">
        {logos}{logos}{logos}
      </div>
    </section>
  )
}
