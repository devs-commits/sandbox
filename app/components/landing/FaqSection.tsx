'use client'

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  { q: "Do I need a degree to get a remote tech job in Nigeria?", a: "No. Global recruiters prioritize practical experience and verifiable portfolios over theoretical degrees. WDC Labs simulates real work experience so you can prove your competence without needing a prior job or university degree." },
  { q: "What is a WDC Squad and how does the discount work?", a: 'We believe in peer accountability. A "Squad" is a group of 3 friends who join WDC Labs together. When you form a Squad, all three members receive an automatic 10% discount on their subscriptions. You will tackle the simulator together, ensuring nobody drops out when the AI Managers get tough.' },
  { q: "What is the difference between the Recommendation Letter in the Monthly plan vs the Career Accelerator?", a: "While the Monthly Grind gives you a Standard Recommendation Letter detailing your tasks, the Career Accelerator unlocks the Global HR Hotline. This means when you apply for a job, your prospective employer can call a dedicated +1 (USA) or +44 (UK) phone number where our AI HR Manager will instantly verify your exact skills and portfolio to the recruiter." },
  { q: "How do I get the Tech Talent Visa Support Letter?", a: "You must enroll in the 3-month Career Accelerator (₦45,000) and successfully pass all AI evaluations. Upon verifying your 140 practical hours, Wild Fusion Digital Centre issues an official institutional support letter designed to strengthen Global Talent Visa applications (e.g., UK Tech Nation)." },
  { q: "What happens if I fail a task assigned by the AI Supervisor?", a: 'Our AI Tech Lead (Sola) operates on a "3-Strike Rule." If your submission is substandard, Sola will reject it and provide harsh, realistic feedback. You must fix the errors and resubmit. This rigor ensures you are truly job-ready by the end of the internship.' },
  { q: "What is Wild Fusion Digital Centre?", a: "Wild Fusion Digital Centre is a leading, ACTD-accredited tech education institute based in Lagos, Nigeria. WDC Labs is our proprietary AI-powered career simulator built to bridge the gap between theoretical knowledge and practical, global work experience." },
]

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#12263f] mb-4 text-center">Frequently Asked Questions</h2>
        <p className="text-center text-sm sm:text-base text-slate-500 mb-10 sm:mb-12 max-w-2xl mx-auto">Everything you need to know about getting remote tech jobs in Nigeria through the WDC Simulator.</p>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl bg-[#f1f5f9] overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex justify-between items-center text-[#12263f] font-bold focus:outline-none hover:bg-slate-200 transition text-sm sm:text-base">
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600 transition-transform duration-200 shrink-0 ml-4 ${openIdx === idx ? "rotate-180" : ""}`} />
              </button>
              {openIdx === idx && (
                <div className="px-5 sm:px-6 pb-4 sm:pb-5 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-200 pt-3 sm:pt-4 font-medium">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
