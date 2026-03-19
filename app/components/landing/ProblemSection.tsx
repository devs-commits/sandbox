'use client'

import { XCircle } from "lucide-react"

export default function ProblemSection() {
  return (
    <section id="problem" className="py-16 sm:py-20 bg-[#f1f5f9] border-y border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] aspect-video lg:aspect-[4/3] order-2 lg:order-1">
            <img src="https://images.unsplash.com/photo-1655720348616-184ae7fad7e3?auto=format&fit=crop&w=800&q=80" alt="Nigerian job seeker frustrated with certificates" className="object-cover w-full h-full" />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-xs sm:text-sm font-bold text-amber-600 uppercase tracking-widest mb-3">The Experience Trap</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold mb-6 text-[#12263f] leading-tight">You can't get a global job without experience.</h3>
            <blockquote className="text-lg sm:text-xl text-blue-700 font-medium mb-6 border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r-lg">
              "But you can't get experience without a job."
            </blockquote>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              Millions of Nigerian graduates are stuck in this cycle. Traditional online courses give you videos and a PDF certificate, but global recruiters don't care about theory. They hire candidates who have executed practical, messy, real-world tasks and have references to prove it.
            </p>
            <div className="inline-flex items-center text-slate-700 bg-white border border-slate-200 shadow-sm px-4 py-3 rounded-lg text-sm font-medium w-full sm:w-auto">
              <XCircle className="w-5 h-5 text-red-500 mr-3 shrink-0" />
              <span>Theory is no longer enough to get hired or emigrate.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
