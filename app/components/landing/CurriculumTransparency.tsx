'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp, Code, Database, Shield, CheckCircle } from "lucide-react"

const tracks = [
  {
    id: "digital-marketing", 
    title: "Digital Marketing Track", 
    icon: <Code className="w-6 h-6" />, 
    color: "blue", 
    duration: "12 weeks",
    modules: [
      { week: "Weeks 1-2", title: "Foundation & Customer Journey", skills: ["Analyze local business channels & growth systems", "Map customer journeys using the 3i Principles", "Understand marketing psychology & funnels"] },
      { week: "Weeks 3-4", title: "Organic Growth & SEO", skills: ["Create Instagram content & viral hooks", "Audit websites for SEO & search intent", "Optimize page titles, meta descriptions & keywords"] },
      { week: "Weeks 5-7", title: "Paid Media & Conversion", skills: ["Set up Meta Ads campaigns & objectives", "Launch Google Ads & optimize CTR", "Design banner ads & improve landing page CTAs"] },
      { week: "Weeks 8-9", title: "Retention & Analytics", skills: ["Write 5-email onboarding sequences", "Develop push notification strategies", "Analyze GA4 reports to identify conversion leaks"] },
      { week: "Weeks 10-12", title: "Strategy & Boardroom Defense", skills: ["Build a 6-month digital marketing strategy", "Optimize underperforming campaigns for portfolio", "Defend ROAS projections in a crisis simulation with Sola"] },
    ],
  },
  {
    id: "data-analytics", 
    title: "Data Analytics Track", 
    icon: <Database className="w-6 h-6" />, 
    color: "green", 
    duration: "12 weeks",
    modules: [
      { week: "Weeks 1-4", title: "Excel Mastery & Dashboards", skills: ["Organize messy records using sorting & filters", "Clean data using IF, SUMIF, COUNTIF & TEXT", "Build sales dashboards for business owners", "Analyze retail datasets for actionable insights"] },
      { week: "Weeks 5-7", title: "SQL Analysis & Databases", skills: ["Retrieve orders using SELECT, WHERE & ORDER BY", "Find top products using GROUP BY & JOINs", "Investigate declining fintech sales using advanced SQL"] },
      { week: "Weeks 8-9", title: "Business Intelligence (Power BI)", skills: ["Import CSVs and create KPI revenue cards", "Build executive dashboards showing MoM growth", "Master data storytelling & regional performance DAX"] },
      { week: "Weeks 10-11", title: "Python for Data Science", skills: ["Load and clean missing values with Pandas", "Combine Python with real analysis workflows", "Analyze ad spend vs sales using Matplotlib"] },
      { week: "Week 12", title: "Real-World Analytics Defense", skills: ["Execute end-to-end data pipelines", "Debug broken analytics reports", "Defend technical recommendations to Sola (Tech Lead)"] },
    ],
  },
  {
    id: "cybersecurity", 
    title: "Cybersecurity Track", 
    icon: <Shield className="w-6 h-6" />, 
    color: "red", 
    duration: "12 weeks",
    modules: [
      { week: "Weeks 1-3", title: "Digital Safety & Infrastructure", skills: ["Investigate small business phishing compromises", "Navigate server files using Linux CLI (No GUI)", "Trace suspicious network activity between devices"] },
      { week: "Weeks 4-5", title: "Security & Firewalls", skills: ["Audit employee permissions & IAM", "Remove risky access levels securely", "Configure firewall rules to block insecure traffic"] },
      { week: "Weeks 6-8", title: "Threats & Protection", skills: ["Analyze logs to identify brute-force vs DDoS", "Implement MFA rules & detect bypass vulnerabilities", "Encrypt confidential files & verify hashing integrity"] },
      { week: "Weeks 9-10", title: "Operations & Crisis Response", skills: ["Run vulnerability scans & prepare risk reports", "Respond to live ransomware attacks", "Isolate infected systems & restore backups"] },
      { week: "Weeks 11-12", title: "Reporting & Boardroom Defense", skills: ["Compile vulnerability findings for security portfolios", "Present risk mitigation strategies to leadership", "Justify patch priorities to Sola under pressure"] },
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
          <a href="#pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg">
            Start Your Track Today
          </a>
        </motion.div>
      </div>
    </section>
  )
}