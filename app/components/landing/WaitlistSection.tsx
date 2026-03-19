'use client'

import { BellRing, ArrowRight, ShieldCheck } from "lucide-react"

export default function WaitlistSection() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("You've joined the waitlist! We'll send updates to your email.")
  }

  return (
    <section id="waitlist" className="py-16 bg-white relative overflow-hidden border-t border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#12263f] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-30 pointer-events-none" />

          <div className="lg:w-5/12 text-center lg:text-left relative z-10 w-full">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full mb-4 shadow-sm">
              <BellRing className="w-3 h-3" /> JOIN WAITLIST
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-white">Stay in the Loop.</h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
              If you're not ready to start yet, you can join our waitlist. We'll share updates, opportunities, and notify you when new spots open up. No pressure. Just stay informed until you're ready.
            </p>
          </div>

          <div className="lg:w-7/12 w-full relative z-10">
            <form className="bg-white/10 p-5 sm:p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input type="text" required className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium" placeholder="First Name *" />
                <input type="text" required className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium" placeholder="Surname *" />
                <input type="email" required className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium" placeholder="Email Address *" />
                <input type="tel" required className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium" placeholder="WhatsApp Number *" />
                <input type="url" className="w-full bg-slate-900/50 border border-slate-600 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400 text-sm font-medium sm:col-span-2" placeholder="LinkedIn Profile URL (optional)" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] text-sm flex justify-center items-center gap-2 tracking-wide uppercase">
                Join the Waitlist <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-4 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Your data is protected under NDPA standards.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
