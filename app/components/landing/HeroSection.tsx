'use client'

import { ArrowRight, Users, FileCheck, PlaneTakeoff } from "lucide-react"
import { useEffect, useState } from "react"
import heroImg from "../../../public/hero-african-team.png"
import Image from "next/image"

export default function HeroSection() {
  const [greeting, setGreeting] = useState("Hello")
  const [enrollmentCount, setEnrollmentCount] = useState(70)
  const totalCapacity = 100

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  const pct = (enrollmentCount / totalCapacity) * 100
  const spots = totalCapacity - enrollmentCount

  return (
    <section className="relative pt-4 pb-20 lg:pb-32 overflow-hidden bg-white">
      <div className="absolute inset-0 bg-dots opacity-50 z-0" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-center text-sm text-slate-600 mb-6">
          <span className="font-bold text-[#12263f]">{greeting}!</span> Join Nigeria's fastest-growing tech career accelerator
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            {/* Enrollment Counter */}
            <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-xs sm:text-sm font-bold text-red-700 uppercase tracking-wide">Cohorts, finish fast</span>
                </div>
                <span className="text-xs font-bold text-slate-600">{spots} spots left</span>
              </div>
              <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${pct}%` }}
                >
                  <span className="text-[8px] font-bold text-white drop-shadow">{enrollmentCount}/{totalCapacity}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 text-center">
                <span className="font-bold text-red-600">{pct.toFixed(0)}%</span> filled • Enrollment closes April 2nd
              </p>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.15] text-[#12263f]">
              Stop Watching Courses.<br />
              <span className="gradient-text">Start Building Experience.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
              Traditional bootcamps cost ₦500,000+ for theory. WDC Labs gives you the exact same practical experience, a verified portfolio, and{" "}
              <strong className="text-[#12263f] bg-yellow-100 px-1 whitespace-nowrap">Tech Visa Support</strong> starting at a fraction of the cost.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-stretch sm:items-center gap-4">
              <a href="#pricing" className="w-full sm:w-auto px-8 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 transform hover:-translate-y-1 text-center">
                Secure Your Desk Now <ArrowRight className="w-4.5 h-4.5" />
              </a>
              {/* Squad button hidden for future use */}
              {/* <a href="#squads" className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-center">
                <Users className="w-4 h-4" /> Form a Squad (Save 10%)
              </a> */}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-2xl w-full sm:w-max mx-auto lg:mx-0 border border-slate-100 shadow-sm">
              <div className="flex -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1657449018188-00a58de3cb21?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1723221907119-397c26c8f580?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1684337399050-0412ebed8005?auto=format&fit=crop&w=100&q=80",
                  "https://images.unsplash.com/photo-1655720348616-184ae7fad7e3?auto=format&fit=crop&w=100&q=80",
                ].map((src, i) => (
                  <img key={i} className="w-10 h-10 rounded-full border-2 border-white object-cover" src={src} alt="WDC Labs Student" />
                ))}
              </div>
              <div className="text-center sm:text-left leading-tight">
                <span className="block font-bold text-[#12263f]">2,400+ Nigerians</span>
                <span className="block text-xs text-slate-500">already learning with us</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 mt-8 lg:mt-0">
            <Image src={heroImg} alt="Young African professionals collaborating on tech projects at WDC Labs" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12263f]/90 via-[#12263f]/30 to-transparent" />
            <div className="absolute bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-6 space-y-3">
              {[
                { icon: FileCheck, title: "Recommendation Letter", desc: "ACTD Accredited Validation.", color: "blue" },
                { icon: PlaneTakeoff, title: "Tech Visa Support", desc: "Pathway to Global Remote Work.", color: "green" },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <div key={i} className={`bg-white/95 backdrop-blur rounded-xl p-3 sm:p-4 shadow-lg flex items-center gap-3 sm:gap-4 border-l-4 border-${color}-500 transform ${i % 2 ? "rotate-1" : "-rotate-1"} hover:rotate-0 transition`}>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-${color}-100 rounded-full flex items-center justify-center text-${color}-600 shrink-0`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#12263f]">{title}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
