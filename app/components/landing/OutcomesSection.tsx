'use client'

import { Briefcase, FileSignature, PlaneTakeoff } from "lucide-react"

export default function OutcomesSection() {
  return (
    <section id="outcomes" className="py-16 sm:py-24 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 right-10 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 relative z-10">
          <h2 className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">The Ultimate Exit Strategy</h2>
          <h3 className="text-3xl md:text-5xl font-extrabold mb-4 sm:mb-6 text-[#12263f]">What You Earn After 3 Months.</h3>
          <p className="text-base sm:text-lg text-slate-600">
            We don't just give you a generic certificate. We arm you with highly-valued physical and digital assets required to secure remote work or global tech visas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
          <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl p-8 shadow-2xl transform hover:-translate-y-2 transition-all text-white border-2 border-white/20">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6 border border-white/30">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3">Verified Digital Portfolio</h4>
            <p className="text-cyan-50 text-sm leading-relaxed font-medium">
              Stop sending empty CVs. Graduate with a live, verified link showcasing actual data models, campaigns, or security audits you executed under AI supervision.
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 shadow-2xl transform hover:-translate-y-2 transition-all text-slate-900 border-2 border-white/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black px-4 py-1.5 rounded-bl-lg tracking-wider">CRITICAL ASSET</div>
            <div className="w-14 h-14 bg-black/10 backdrop-blur rounded-xl flex items-center justify-center mb-6 border border-black/10">
              <FileSignature className="w-7 h-7 text-black" />
            </div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3">Global Recommendation</h4>
            <p className="text-slate-800 text-sm leading-relaxed font-medium">
              A highly detailed, personalized letter from Wild Fusion Digital Centre validating your 140+ hours of practical execution. Stand out with verified institutional references.
            </p>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-3xl p-8 shadow-2xl transform hover:-translate-y-2 transition-all text-white border-2 border-white/20 md:col-span-2 lg:col-span-1">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-6 border border-white/30">
              <PlaneTakeoff className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-xl sm:text-2xl font-bold mb-3">Tech Talent Visa Support</h4>
            <p className="text-fuchsia-100 text-sm leading-relaxed font-medium">
              Looking to relocate? Top performers receive an institutional support letter detailing specialized skills, designed specifically to strengthen Global Talent Visa applications.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
