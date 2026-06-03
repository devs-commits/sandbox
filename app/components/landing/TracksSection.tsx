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
  blue: { bg: "bg-blue-50", border: "border-blue-200", hover: "hover:border-blue-400", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", hover: "hover:border-purple-400", text: "text-purple-600" },
  green: { bg: "bg-green-50", border: "border-green-200", hover: "hover:border-green-400", text: "text-green-600" }
}

export default function TracksSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-[#12263f]">
            Choose Your Career Track
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Specialized paths designed for the Nigerian tech market
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
                whileHover={{ y: -8 }}
                className={`group relative ${colors.bg} rounded-3xl p-8 sm:p-10 border-2 ${colors.border} ${colors.hover} transition-all duration-300 cursor-pointer overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${track.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
                
                <div className={`relative z-10`}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${track.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-[#12263f] mb-4">
                    {track.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                    {track.description}
                  </p>
                  
                  <div className={`inline-flex items-center gap-2 ${colors.text} font-semibold text-sm group-hover:gap-3 transition-all`}>
                    <span>Learn More</span>
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
