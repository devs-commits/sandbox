'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Calculator } from "lucide-react"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)

export default function ROICalculator() {
  const [currentSalary, setCurrentSalary] = useState(100000)

  const acceleratorInvestment = 45000
  const projectedSalary = currentSalary * 2.5
  const monthlyIncrease = (projectedSalary - currentSalary) / 12
  const yearlyIncrease = projectedSalary - currentSalary
  const fiveYearEarnings = yearlyIncrease * 5
  const roi = ((fiveYearEarnings - acceleratorInvestment) / acceleratorInvestment) * 100

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-full mb-4 border border-white/20">
            <Calculator className="w-4 h-4" /> ROI CALCULATOR
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Calculate Your Career ROI</h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">See how much your career earnings could increase with WDC Labs</p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-slate-900">
            <div className="mb-8">
              <label className="block text-sm font-bold text-slate-700 mb-3">What's your current monthly income?</label>
              <div className="flex items-center gap-4">
                <input type="range" min="30000" max="500000" step="10000" value={currentSalary} onChange={(e) => setCurrentSalary(Number(e.target.value))}
                  className="flex-1 h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="bg-blue-50 px-4 py-2 rounded-lg min-w-[140px] text-center">
                  <span className="text-2xl font-extrabold text-[#12263f]">{formatCurrency(currentSalary)}</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-600 mb-2">Current Annual Earnings</p>
                <p className="text-3xl font-extrabold text-slate-900">{formatCurrency(currentSalary * 12)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <p className="text-sm font-bold text-green-700 mb-2">Projected After 6 Months</p>
                <p className="text-3xl font-extrabold text-green-700">{formatCurrency(projectedSalary * 12)}</p>
                <p className="text-xs text-green-600 mt-1 font-semibold">+{formatCurrency(monthlyIncrease)}/month increase</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-300 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-white" /></div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#12263f] text-lg mb-1">5-Year Career Earnings Projection</h3>
                  <p className="text-sm text-slate-600">Based on conservative remote work salary increases</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><p className="text-xs text-slate-600 mb-1">Total Additional Earnings</p><p className="text-2xl md:text-3xl font-extrabold text-[#12263f]">{formatCurrency(fiveYearEarnings)}</p></div>
                <div><p className="text-xs text-slate-600 mb-1">Your Investment</p><p className="text-2xl md:text-3xl font-extrabold text-slate-900">{formatCurrency(acceleratorInvestment)}</p></div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm font-bold text-slate-600 mb-1">Return on Investment (ROI)</p>
                <p className="text-4xl font-extrabold text-green-600">{roi.toFixed(0)}%</p>
                <p className="text-xs text-slate-600 mt-2">That means for every ₦1 you invest, you gain ₦{(roi / 100).toFixed(0)} over 5 years</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#waitlist" className="flex-1 px-6 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg text-center">
                Secure My Spot for ₦{acceleratorInvestment.toLocaleString()}
              </a>
              <a href="#pricing" className="px-6 py-4 bg-white border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all text-center">View All Plans</a>
            </div>
            <p className="text-xs text-slate-500 text-center mt-4">* Projections based on average salary increases for Nigerian tech professionals transitioning to remote work.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
