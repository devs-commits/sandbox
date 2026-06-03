'use client'

import { XCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function ProblemSection() {
  return (
    <section id="problem" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white border-y border-slate-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] aspect-video lg:aspect-[4/3] order-2 lg:order-1"
          >
            <img src="https://images.unsplash.com/photo-1655720348616-184ae7fad7e3?auto=format&fit=crop&w=800&q=80" alt="Frustrated job seeker with certificates" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12263f]/60 to-transparent" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 space-y-6"
          >
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs sm:text-sm font-bold px-4 py-2 rounded-full border border-red-200">
              <AlertCircle className="w-4 h-4" />
              THE HIRING GAP
            </div>
            
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#12263f] leading-tight">
              Why Most People Struggle to Get Hired
            </h3>
            
            <div className="space-y-3">
              <p className="text-lg sm:text-xl font-semibold text-blue-600 leading-relaxed">
                You don't need another certificate.
              </p>
              <p className="text-lg sm:text-xl font-bold text-[#12263f] leading-relaxed">
                You need experience.
              </p>
            </div>
            
            <div className="space-y-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              <p>Most courses teach theory.</p>
              <p>Employers want proof that you can actually do the work.</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-5 rounded-r-xl">
              <p className="text-sm sm:text-base font-semibold text-[#12263f] mb-2">
                That's where WDC Labs is different.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                Instead of watching videos, you complete real tasks in a simulated workplace environment.
              </p>
            </div>
            
            <div className="inline-flex items-center text-slate-700 bg-white border-2 border-red-200 shadow-sm px-5 py-4 rounded-xl text-sm sm:text-base font-medium w-full sm:w-auto hover:border-red-300 transition-colors">
              <XCircle className="w-5 h-5 text-red-500 mr-3 shrink-0" />
              <span className="font-semibold">Theory alone won't get you hired.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
