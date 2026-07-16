'use client'

import { ArrowRight, FileCheck, PlaneTakeoff } from "lucide-react"
import { useState } from "react"
import heroImg from "../../../public/students.jpg"
import Image from "next/image"

const billingPlans = {
  monthly: {
    label: "Monthly",
    price: "₦15,000",
    cadence: "/month",
    note: "Start today. Pay as you go.",
    badge: null,
    savings: null,
  },
  quarterly: {
    label: "3 Months",
    price: "₦40,500",
    cadence: "/3 months",
    note: "Pay once for the full experience.",
    badge: "Save 10%",
    savings: "Save ₦4,500",
  },
}

export default function HeroSection() {
  const [billingCycle, setBillingCycle] = useState<keyof typeof billingPlans>("monthly")
  const greeting = "Hello"
  const enrollmentCount = 70
  const totalCapacity = 100

  const pct = (enrollmentCount / totalCapacity) * 100
  const spots = totalCapacity - enrollmentCount
  const selectedPlan = billingPlans[billingCycle]

  return (
    <section className="relative pt-4 pb-16 lg:pb-24 overflow-hidden bg-white">
      <div className="absolute inset-0 bg-dots opacity-50 z-0" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-center text-sm text-slate-600 mb-6">
          <span className="font-bold text-[#12263f]">{greeting}!</span> Join Nigeria&apos;s fastest-growing tech career accelerator
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

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-3 leading-[1.15] text-[#12263f]">
              Get the Experience Employers Actually Want{" "}
              <span className="text-blue-600">in 3 Months</span>
            </h1>

            <p className="text-lg sm:text-xl font-semibold text-blue-600 mb-4">
              Stop watching courses.<br />
              Start doing real work.
            </p>

            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed mb-4 max-w-2xl mx-auto lg:mx-0">
              WDC Labs is an AI-powered virtual workplace where you gain hands-on experience in:
            </p>

            <div className="space-y-2 mb-4 max-w-md mx-auto lg:mx-0">
              {["Digital Marketing", "Data Analytics", "Cybersecurity"].map((track, i) => (
                <div key={i} className="flex items-center gap-3 text-sm sm:text-base text-slate-700 font-medium">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">✓</span>
                  </span>
                  {track}
                </div>
              ))}
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4 max-w-2xl mx-auto lg:mx-0">
              Complete real-world tasks, build a portfolio, and become job-ready.
            </p>

            <div className="mb-6 max-w-md mx-auto lg:mx-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-bold text-slate-600">
                {(Object.keys(billingPlans) as Array<keyof typeof billingPlans>).map((planKey) => {
                  const plan = billingPlans[planKey]
                  const isSelected = billingCycle === planKey

                  return (
                    <button
                      key={planKey}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setBillingCycle(planKey)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition-all ${
                        isSelected
                          ? "bg-[#12263f] text-white shadow-sm"
                          : "text-slate-600 hover:bg-white/70 hover:text-[#12263f]"
                      }`}
                    >
                      <span>{plan.label}</span>
                      {plan.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                            isSelected ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Starting at</p>
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#12263f]">{selectedPlan.price}</span>
                    <span className="text-sm font-semibold text-slate-500">{selectedPlan.cadence}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{selectedPlan.note}</p>
                </div>
                {selectedPlan.savings && (
                  <span className="w-max rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    {selectedPlan.savings}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-stretch sm:items-center gap-4">
              <a href="https://labs.wdc.ng/signup" className="w-full sm:w-auto px-8 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2 transform hover:-translate-y-1 text-center">
                Get Started <ArrowRight className="w-4.5 h-4.5" />
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
            <Image src={heroImg} alt="Students collaborating with laptops while building practical tech skills" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
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
