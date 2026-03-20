'use client'

import { CheckCircle, X, Users, Gift, Share2, Clock } from "lucide-react"

export default function PricingSection() {
  const shareLink = () => {
    const text = `Good day Ma/Sir/Mentor. I have found a career accelerator called WDC Labs that guarantees work experience for global remote jobs. It is not just a course; it is a virtual internship. I need to secure my spot for 2026. The Career Accelerator Bundle is ₦45000. Can you please sponsor my future? Here is the payment link: https://wdc.ng/labs/pay/45000?ref=student`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert("Message copied to clipboard! \n\nNow open WhatsApp and paste it to your Mentor, Uncle, or Sponsor.")
      })
    }
  }

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white border-t border-slate-200 relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#12263f]">Invest in Practical Experience.</h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">Traditional tech bootcamps charge ₦500,000+ for theory. We charge a fraction of that for verified, global work experience.</p>
          <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-2xl px-6 py-4 shadow-lg">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Flexible Payment Options</p>
              <p className="text-lg font-extrabold text-[#12263f]">Start from ₦15,000/month • No upfront fees required</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto mb-10 items-stretch">
          <div className="bg-[#f8fafc] p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">The Monthly Grind</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 line-through mb-1">Traditional Value: ₦150,000</p>
              <div className="flex items-baseline gap-1"><span className="text-3xl sm:text-4xl font-extrabold text-[#12263f]">₦15,000</span><span className="text-slate-500 font-medium text-xs sm:text-sm">/mo</span></div>
            </div>
            <ul className="space-y-3 mb-8 text-slate-600 text-sm font-medium flex-grow">
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Full Access to Reality Engine</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Daily Tasks from AI Managers</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Verified Digital Portfolio</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Standard Recommendation Letter</li>
              <li className="flex items-start gap-3 opacity-40"><X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> No Global HR Hotline Access</li>
            </ul>
            <a href="https://labs.wdc.ng/signup" target="_blank" rel="noopener noreferrer" className="block w-full py-3.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition text-sm border border-slate-300 text-center shadow-sm mt-auto">Start Monthly Plan</a>
          </div>

          <div className="bg-[#12263f] p-6 sm:p-8 rounded-3xl border-2 border-blue-500 shadow-2xl flex flex-col relative transform lg:-translate-y-4 h-full">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-bl-lg tracking-wide uppercase shadow-sm">The Japa Package</div>
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-1">Career Accelerator</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 line-through mb-1">Traditional Value: ₦500,000</p>
              <div className="flex items-baseline gap-1"><span className="text-3xl sm:text-4xl font-extrabold text-white">₦45,000</span><span className="text-slate-400 font-medium text-xs sm:text-sm">/ 3 months</span></div>
            </div>
            <ul className="space-y-3 mb-8 text-slate-200 text-sm font-medium flex-grow">
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> Everything in Monthly</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> <strong className="text-white">Global Recommendation Letter</strong></li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> <strong className="text-white">Tech Visa Support Letter</strong></li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" /> <strong className="text-blue-300">Global Hotline HR Verification</strong></li>
            </ul>
            <a href="https://labs.wdc.ng/signup" target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition shadow-[0_0_20px_rgba(37,99,235,0.5)] text-sm sm:text-base text-center mt-auto">Secure Letters & Access</a>
          </div>

          <div className="bg-[#f8fafc] p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full md:col-span-2 lg:col-span-1 relative">
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-amber-200">
              <Clock className="w-3 h-3" /> COMING SOON
            </div>
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">The Squad</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 line-through mb-1">Traditional Value: ₦135,000</p>
              <div className="flex items-baseline gap-1"><span className="text-3xl sm:text-4xl font-extrabold text-[#12263f]">₦40,500</span><span className="text-slate-500 font-medium text-xs sm:text-sm">/ 3 months</span></div>
              <p className="text-xs text-blue-600 font-semibold mt-2">For 3 friends • ₦13,500/person</p>
            </div>
            <ul className="space-y-3 mb-8 text-slate-600 text-sm font-medium flex-grow opacity-60">
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Everything in Career Accelerator</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> 10% Group Discount for Each Member</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Shared Squad Progress Dashboard</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> Group Accountability Challenges</li>
            </ul>
            <span className="block w-full py-3.5 bg-slate-200 text-slate-500 font-bold rounded-xl text-sm text-center shadow-sm mt-auto cursor-not-allowed">Squad Feature Coming Soon</span>
          </div>
        </div>

        <div id="squads" className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition relative">
            <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-amber-200">
              <Clock className="w-3 h-3" /> COMING SOON
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-blue-200"><Users className="w-3 h-3" /> MULTIPLAYER MODE</div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#12263f] mb-2">Form a "Squad" & Save.</h3>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">Interning alone is hard. Bring 2 friends to form a 'Squad'. You all get an automatic <strong className="text-blue-600 bg-white px-1">10% off your subscriptions</strong>.</p>
            </div>
            <span className="block w-full px-6 py-4 bg-slate-200 text-slate-500 font-bold rounded-xl text-sm text-center shadow-sm cursor-not-allowed">
              <Users className="w-4 h-4 inline mr-2" /> Coming Soon
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-amber-200"><Gift className="w-3 h-3" /> SPONSOR A FUTURE</div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#12263f] mb-2">Ask a Mentor to Pay.</h3>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">Copy our pre-written WhatsApp message, send it to a mentor, uncle, or sponsor. Let them invest in your career future.</p>
            </div>
            <button onClick={shareLink} className="w-full px-6 py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors text-sm text-center shadow-sm flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Copy Message for Sponsor
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
