'use client'

import { ArrowRight, CheckCircle2, Target, Briefcase, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  {
    icon: Target,
    title: "Choose a Career Track",
    description: "Digital Marketing, Data Analytics, or Cybersecurity.",
    color: "blue"
  },
  {
    icon: Briefcase,
    title: "Complete Real Tasks",
    description: "Receive assignments, solve challenges, and meet deadlines.",
    color: "purple"
  },
  {
    icon: Sparkles,
    title: "Build Experience",
    description: "Create projects and a portfolio you can confidently show employers.",
    color: "green"
  }
]

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-500", iconText: "text-blue-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", iconBg: "bg-purple-500", iconText: "text-purple-500" },
  green: { bg: "bg-green-50", border: "border-green-200", iconBg: "bg-green-500", iconText: "text-green-500" }
}

export default function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#12263f]">
            How WDC Labs Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Three simple steps to launch your tech career
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {steps.map((step, index) => {
            const colors = colorMap[step.color as keyof typeof colorMap]
            const Icon = step.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${colors.bg} rounded-2xl p-6 sm:p-8 border-2 ${colors.border} hover:shadow-xl transition-all duration-300`}
              >
                <div className={`absolute -top-4 -left-4 w-12 h-12 ${colors.iconBg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {index + 1}
                </div>
                <div className={`w-14 h-14 ${colors.iconBg} rounded-xl flex items-center justify-center mb-6`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#12263f] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] transform hover:-translate-y-1"
          >
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
