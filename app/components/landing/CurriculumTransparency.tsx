'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp, Code, Database, Shield, CheckCircle } from "lucide-react"

const tracks = [
  {
    id: "digital-marketing", title: "Digital Marketing Track", icon: <Code className="w-6 h-6" />, color: "blue", duration: "12 weeks",
    modules: [
      { week: "Weeks 1-2", title: "Marketing Fundamentals & Strategy", skills: ["Marketing frameworks (AIDA, 4Ps)", "Buyer personas & customer journey mapping", "Campaign planning & budgeting", "Analytics foundations"] },
      { week: "Weeks 3-5", title: "SEO & Content Marketing", skills: ["On-page & technical SEO", "Keyword research & competitor analysis", "Content creation & copywriting", "Google Analytics & Search Console"] },
      { week: "Weeks 6-8", title: "Paid Advertising (Google & Meta)", skills: ["Google Ads campaigns (Search, Display)", "Facebook & Instagram ads", "Ad copy & creative optimization", "Conversion tracking & ROI analysis"] },
      { week: "Weeks 9-10", title: "Email & Social Media Marketing", skills: ["Email automation workflows", "Social media strategy & scheduling", "Community management", "Influencer collaboration"] },
      { week: "Weeks 11-12", title: "Portfolio & Capstone Campaign", skills: ["Launch multi-channel campaign", "Create marketing dashboard", "Present ROI findings", "Build portfolio website"] },
    ],
  },
  {
    id: "data-analytics", title: "Data Analytics Track", icon: <Database className="w-6 h-6" />, color: "green", duration: "12 weeks",
    modules: [
      { week: "Weeks 1-2", title: "Data Fundamentals & Excel Mastery", skills: ["Data types & structures", "Advanced Excel formulas (VLOOKUP, INDEX-MATCH)", "Pivot tables & data visualization", "Data cleaning techniques"] },
      { week: "Weeks 3-5", title: "SQL for Data Analysis", skills: ["Database design & relationships", "SELECT, JOIN, GROUP BY queries", "Subqueries & CTEs", "Data aggregation & filtering"] },
      { week: "Weeks 6-8", title: "Python for Data Science", skills: ["Python basics & Pandas library", "Data manipulation & cleaning", "Data visualization (Matplotlib, Seaborn)", "Statistical analysis"] },
      { week: "Weeks 9-10", title: "Business Intelligence & Dashboards", skills: ["Power BI / Tableau fundamentals", "Interactive dashboard design", "KPI tracking & metrics", "Data storytelling"] },
      { week: "Weeks 11-12", title: "Capstone Analytics Project", skills: ["End-to-end data pipeline", "Predictive modeling basics", "Present insights to stakeholders", "Deploy production dashboard"] },
    ],
  },
  {
    id: "cybersecurity", title: "Cybersecurity Track", icon: <Shield className="w-6 h-6" />, color: "red", duration: "12 weeks",
    modules: [
      { week: "Weeks 1-2", title: "Security Fundamentals & Linux", skills: ["Cybersecurity principles & frameworks", "Linux command line essentials", "Network protocols & architecture", "Security policies & compliance"] },
      { week: "Weeks 3-5", title: "Threat Detection & Analysis", skills: ["Common attack vectors & vulnerabilities", "Security monitoring tools (Wireshark, Snort)", "Log analysis & SIEM basics", "Incident identification"] },
      { week: "Weeks 6-8", title: "Security Operations & Response", skills: ["Incident response procedures", "Malware analysis fundamentals", "Digital forensics basics", "Security automation scripts"] },
      { week: "Weeks 9-10", title: "Penetration Testing & Hardening", skills: ["Vulnerability scanning & assessment", "Ethical hacking techniques", "System hardening & patching", "Security configuration"] },
      { week: "Weeks 11-12", title: "SOC Simulation & Portfolio", skills: ["Simulate real security incidents", "Document response procedures", "Create security audit report", "Build professional security portfolio"] },
    ],
  },
]

const colorMap: Record<string, { bg: string; border: string; text: string; hover: string; iconBg: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", hover: "hover:border-blue-400", iconBg: "bg-blue-100" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", hover: "hover:border-green-400", iconBg: "bg-green-100" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", hover: "hover:border-red-400", iconBg: "bg-red-100" },
}

export default function CurriculumTransparency() {
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null)

  return (
    <section id="solution" className="py-16 sm:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#12263f]">Full Curriculum Transparency</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">No hidden lessons. No vague promises. See exactly what you'll learn, week by week.</p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-4">
          {tracks.map((track, index) => {
            const isExpanded = expandedTrack === track.id
            const colors = colorMap[track.color]

            return (
              <motion.div key={track.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                className={`border-2 rounded-2xl overflow-hidden transition-all ${colors.border} ${colors.hover} ${isExpanded ? "shadow-xl" : "shadow-sm"}`}>
                <button onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                  className={`w-full px-6 py-5 flex items-center justify-between ${colors.bg} hover:opacity-90 transition-opacity`}>
                  <div className="flex items-center gap-4">
                    <div className={`${colors.iconBg} p-3 rounded-xl ${colors.text}`}>{track.icon}</div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-[#12263f]">{track.title}</h3>
                      <p className="text-sm text-slate-600 font-medium">{track.duration} • Week-by-week breakdown</p>
                    </div>
                  </div>
                  <div className={colors.text}>{isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}</div>
                </button>

                {isExpanded && (
                  <div className="bg-white px-6 py-6 space-y-6">
                    {track.modules.map((module, idx) => (
                      <div key={idx} className="border-l-4 border-slate-200 pl-6 py-2">
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-bold ${colors.text} ${colors.bg} px-3 py-1 rounded-full`}>{module.week}</span>
                          <h4 className="font-bold text-slate-900">{module.title}</h4>
                        </div>
                        <ul className="space-y-2">
                          {module.skills.map((skill, si) => (
                            <li key={si} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />{skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className={`${colors.bg} rounded-xl p-4 mt-6`}>
                      <p className="text-sm font-bold text-[#12263f] mb-2">✨ Upon Completion:</p>
                      <ul className="text-sm text-slate-700 space-y-1">
                        <li>• Verified portfolio with 3-5 real projects</li>
                        <li>• ACTD-accredited recommendation letter</li>
                        <li>• Ready for {track.title.replace(" Track", "")} junior roles</li>
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <a href="#waitlist" className="inline-flex items-center gap-2 px-8 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg">
            Start Learning Today
          </a>
        </motion.div>
      </div>
    </section>
  )
}
