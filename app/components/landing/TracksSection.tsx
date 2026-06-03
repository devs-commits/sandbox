'use client'

import { TrendingUp, BarChart3, Shield } from "lucide-react"
import { motion } from "framer-motion"

const tracks = [
  {
    icon: TrendingUp,
    title: "Digital Marketing",
    description: "Run campaigns. Analyze performance. Build growth strategies.",
    color: "blue",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: BarChart3,
    title: "Data Analytics",
    description: "Work with Excel, SQL, Power BI, and business data.",
    color: "purple",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Shield,
    title: "Cybersecurity",
    description: "Learn how to secure systems and respond to threats.",
    color: "green",
    gradient: "from-green-500 to-emerald-500"
  }
]

const colorMap = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600" }
}

export default function TracksSection() {
  return (
    <section className="py-12 sm:py-20 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#12263f]">
            Career Paths We Offer
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Specialized tracks designed for the Nigerian tech market
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {tracks.map((track, index) => {
            const colors = colorMap[track.color as keyof typeof colorMap]
            const Icon = track.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${colors.bg} rounded-3xl p-6 sm:p-8 border-2 ${colors.border} transition-all duration-300 overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${track.gradient} opacity-10 rounded-full blur-3xl`} />
                
                <div className={`relative z-10`}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${track.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-[#12263f] mb-3">
                    {track.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {track.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
