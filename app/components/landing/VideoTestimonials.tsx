'use client'

import { motion } from 'framer-motion'
import { TrendingUp, MapPin, Briefcase } from 'lucide-react'

const testimonials = [
  {
    id: "1", name: "Chioma Okafor", role: "Digital Marketing Manager",
    image: "https://images.unsplash.com/photo-1657449018188-00a58de3cb21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    salaryBefore: "₦80,000/mo", salaryAfter: "₦320,000/mo", increase: "300%",
    quote: "WDC gave me real portfolio projects that got me hired. My salary quadrupled in 6 months.",
  },
  {
    id: "2", name: "Ibrahim Musa", role: "Data Analyst",
    image: "https://images.unsplash.com/photo-1684337399050-0412ebed8005?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    salaryBefore: "₦60,000/mo", salaryAfter: "₦450,000/mo", increase: "650%",
    quote: "The AI supervisors prepared me for real work pressure. Now I work remotely making 7x my old salary.",
  },
  {
    id: "3", name: "Blessing Adeyemi", role: "Cybersecurity Analyst",
    image: "https://images.unsplash.com/photo-1723221907119-397c26c8f580?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    salaryBefore: "₦50,000/mo", salaryAfter: "₦380,000/mo", increase: "660%",
    quote: "From unemployed graduate to a security team in 4 months. The recommendation letter was key.",
  },
]

export default function VideoTestimonials() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#12263f]">Real Results. Real Salaries.</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Hear from Nigerian professionals who transformed their careers with WDC</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl transition-all group">
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img src={t.image} alt={`${t.name} - ${t.role}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />+{t.increase}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-100" />
                  <div className="flex-1">
                    <h3 className="font-bold text-[#12263f] text-lg leading-tight">{t.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5"><Briefcase className="w-3 h-3" /><span>{t.role}</span></div>
                  </div>
                </div>
                <p className="text-sm text-slate-700 italic mb-4 leading-relaxed">"{t.quote}"</p>
                <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold">Before</p><p className="text-sm font-bold text-red-600 line-through">{t.salaryBefore}</p></div>
                    <div className="text-slate-400">→</div>
                    <div><p className="text-[10px] text-slate-500 uppercase font-bold">After WDC</p><p className="text-lg font-extrabold text-green-600">{t.salaryAfter}</p></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <p className="text-slate-600 mb-4">Join <span className="font-bold text-[#12263f]">1,247+ Nigerians</span> who've transformed their careers</p>
          <a href="#pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg">Start Your Transformation</a>
        </motion.div>
      </div>
    </section>
  )
}
