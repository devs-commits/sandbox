'use client'

import { motion } from "framer-motion"
import { Clock, Zap, X, CheckCircle } from "lucide-react"

const comparisons = [
  { category: "Time to Job Ready", traditional: "3-5 years (University + Job search)", wdcLabs: "6 months with portfolio" },
  { category: "Total Investment", traditional: "₦2M - ₦5M (Tuition + living)", wdcLabs: "₦45,000 - ₦150,000" },
  { category: "Practical Experience", traditional: "Internship after graduation (if lucky)", wdcLabs: "Day 1 - Real projects with AI managers" },
  { category: "Portfolio", traditional: "None or basic school projects", wdcLabs: "Verified professional portfolio" },
  { category: "Global Opportunities", traditional: "Limited - no international credentials", wdcLabs: "Tech visa support + recommendation letters" },
  { category: "Career Earnings (5 years)", traditional: "₦12M - ₦18M average", wdcLabs: "₦47M+ average (remote work)" },
]

export default function CareerComparisonMatrix() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-4 border border-blue-200">
            <Zap className="w-4 h-4" /> ACCELERATED PATH
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#12263f]">Traditional Path vs. WDC Labs</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Why spend 5 years when you can be job-ready in 6 months?</p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-600 uppercase tracking-wide">Category</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-red-600 uppercase tracking-wide bg-red-50">
                    <div className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" />Traditional Path</div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-green-600 uppercase tracking-wide bg-green-50">
                    <div className="flex items-center justify-center gap-2"><Zap className="w-4 h-4" />WDC Labs</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {comparisons.map((item, i) => (
                  <motion.tr key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-900 text-sm">{item.category}</td>
                    <td className="px-6 py-5 text-center text-slate-600 text-sm bg-red-50/30">
                      <div className="flex items-center justify-center gap-2"><X className="w-4 h-4 text-red-500 shrink-0" />{item.traditional}</div>
                    </td>
                    <td className="px-6 py-5 text-center font-semibold text-slate-900 text-sm bg-green-50/30">
                      <div className="flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" />{item.wdcLabs}</div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {comparisons.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200"><h4 className="font-bold text-sm text-slate-900">{item.category}</h4></div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2 bg-red-50 p-3 rounded-lg">
                    <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div><p className="text-xs font-bold text-red-700 mb-1">Traditional Path</p><p className="text-sm text-slate-700">{item.traditional}</p></div>
                  </div>
                  <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <div><p className="text-xs font-bold text-green-700 mb-1">WDC Labs</p><p className="text-sm font-semibold text-slate-900">{item.wdcLabs}</p></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Lifetime Value */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
            className="mt-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-center text-white shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-4">Lifetime Value: Career Earnings Increase</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6">
              <div className="text-center"><p className="text-sm opacity-80 mb-1">Traditional Graduate (5 years)</p><p className="text-3xl md:text-4xl font-extrabold">₦12M - ₦18M</p></div>
              <div className="text-3xl font-bold hidden md:block">→</div>
              <div className="text-center"><p className="text-sm opacity-80 mb-1">WDC Labs Graduate (5 years)</p><p className="text-4xl md:text-5xl font-extrabold text-yellow-300">₦47M+</p></div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 inline-block">
              <p className="text-lg md:text-xl font-bold">Average Career Earnings Increase: <span className="text-yellow-300">₦35M over 5 years</span></p>
              <p className="text-sm opacity-90 mt-2">That's a <span className="font-bold text-yellow-300">194% ROI</span> on your ₦45,000 investment</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
