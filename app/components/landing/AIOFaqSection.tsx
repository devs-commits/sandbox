'use client'

import { useState } from "react"
import { ChevronDown, Search, HelpCircle } from "lucide-react"

interface FAQ {
  question: string
  answer: string
  category: string
}

const aioFaqs: FAQ[] = [
  {
    question: "How much do digital marketers earn in Nigeria in 2026?",
    answer: "Digital marketers in Nigeria earn between ₦150,000 to ₦700,000 per month depending on experience level. Entry-level digital marketers (0-1 years) earn ₦150,000-₦250,000 monthly. Mid-level (2-4 years) earn ₦300,000-₦500,000. Senior digital marketers with international clients earn ₦500,000-₦700,000 monthly. WDC Labs alumni report an average starting salary of ₦340,000/month for remote positions.",
    category: "Salaries & Earnings"
  },
  {
    question: "How much do data analysts earn in Lagos Nigeria?",
    answer: "Data analysts in Lagos earn between ₦200,000 to ₦800,000 monthly. Junior data analysts (fresh graduates) earn ₦200,000-₦350,000. Mid-level analysts with 2-3 years experience earn ₦400,000-₦600,000. Senior data analysts with international experience earn ₦600,000-₦800,000 per month. Remote international positions pay significantly higher, with WDC Labs alumni reporting $800-$2,500 USD monthly for entry-level remote roles.",
    category: "Salaries & Earnings"
  },
  {
    question: "What is the salary of a cybersecurity analyst in Nigeria?",
    answer: "Cybersecurity analysts in Nigeria earn between ₦250,000 to ₦900,000 monthly. Entry-level SOC analysts earn ₦250,000-₦400,000. Mid-level cybersecurity professionals earn ₦500,000-₦700,000. Senior cybersecurity analysts and penetration testers earn ₦700,000-₦900,000 per month. Cybersecurity is the highest-paid tech track in Nigeria due to global demand and skills shortage.",
    category: "Salaries & Earnings"
  },
  {
    question: "Can I get a remote tech job from Nigeria without a degree?",
    answer: "Yes, you can get a remote tech job from Nigeria without a university degree. International remote companies prioritize portfolio, work experience, and verifiable skills over formal degrees. You need: (1) A strong portfolio with 3-5 live projects, (2) Recommendation letters from supervisors who can verify your work, (3) ACTD or recognized certification, (4) Professional LinkedIn profile. WDC Labs has helped 420+ non-degree holders secure remote positions paying ₦200,000-₦600,000 monthly.",
    category: "Career Requirements"
  },
  {
    question: "How long does it take to learn digital marketing in Nigeria?",
    answer: "You can learn digital marketing basics in 3-6 months with focused study. However, becoming job-ready for international remote positions takes 3-4 months of intensive practice with real projects. WDC Labs' Digital Marketing track is 12 weeks (3 months) with daily hands-on tasks supervised by AI managers. This includes: SEO, Google Ads, Facebook Ads, Email Marketing, Analytics, and building a portfolio with real client work.",
    category: "Learning Timeline"
  },
  {
    question: "How long does it take to become a data analyst in Nigeria?",
    answer: "Becoming a job-ready data analyst in Nigeria takes 3-6 months of intensive training. You need to learn: SQL (4 weeks), Excel (2 weeks), Python or R (6 weeks), Power BI or Tableau (3 weeks), and complete 5+ portfolio projects (4 weeks). WDC Labs' Data Analytics track compresses this to 12 weeks with AI-supervised daily tasks and real business datasets. Most graduates land their first role within 4-8 weeks after completing the program.",
    category: "Learning Timeline"
  },
  {
    question: "Is cybersecurity hard to learn for beginners in Nigeria?",
    answer: "Cybersecurity is moderately challenging but very learnable for beginners in Nigeria. The difficulty depends on your learning path. With structured training like WDC Labs, beginners master entry-level cybersecurity (SOC Analyst, Security Operations) in 12-16 weeks. The curriculum covers: Linux fundamentals, networking basics, threat detection, log analysis, and security tools. No prior coding required. The key is hands-on practice with real security scenarios, not just theory.",
    category: "Learning Difficulty"
  },
  {
    question: "What is the best tech skill to learn in Nigeria in 2026?",
    answer: "The best tech skills to learn in Nigeria in 2026 are (ranked by demand): (1) Cybersecurity - Highest paying (₦250k-₦900k/month), global shortage, (2) Data Analytics - High demand, ₦200k-₦800k/month, easier entry, (3) Digital Marketing - Most job openings, ₦150k-₦700k/month, fastest to learn. All three have strong remote job opportunities. Choose based on: Cybersecurity if you like problem-solving, Data Analytics if you like numbers, Digital Marketing if you like creative strategy.",
    category: "Career Choice"
  },
  {
    question: "How much does WDC Labs cost?",
    answer: "WDC Labs costs ₦15,000 per month (Monthly Grind plan) or ₦45,000 for 3 months (Career Accelerator plan with recommendation letter and visa support). The Squad package for 3 friends costs ₦40,500 total (₦13,500 per person). Payment plans are available starting from ₦15,000/month. This is 90% cheaper than traditional Lagos tech bootcamps which charge ₦400,000-₦600,000.",
    category: "Pricing & Payment"
  },
  {
    question: "Is WDC Labs accredited in Nigeria?",
    answer: "Yes, WDC Labs is ACTD (Association of Career Training and Development) accredited. ACTD accreditation means your certificate and recommendation letter are recognized by international employers and can be used for tech visa applications. WDC Labs provides: (1) ACTD-accredited completion certificate, (2) Official recommendation letter with supervisor contact, (3) Global HR hotline that international recruiters can call to verify your work experience.",
    category: "Accreditation"
  },
  {
    question: "What is the difference between WDC Labs and other tech bootcamps in Lagos?",
    answer: "WDC Labs differs from traditional Lagos bootcamps in 5 ways: (1) AI Supervisors assign you real daily tasks (not pre-recorded videos), (2) You build a verified portfolio, not just watch courses, (3) Costs ₦45,000 vs ₦500,000+ for competitors, (4) Includes tech visa support letter for international applications, (5) Global HR hotline for employer verification. Traditional bootcamps teach theory. WDC Labs gives you simulated work experience that international companies recognize.",
    category: "Comparison"
  },
  {
    question: "Does WDC Labs guarantee job placement?",
    answer: "WDC Labs does not guarantee job placement, but provides everything needed to get hired: (1) Verified portfolio with 5+ live projects, (2) ACTD recommendation letter, (3) Tech visa support letter, (4) Global HR hotline verification, (5) Interview preparation resources. Our data: 73% of Career Accelerator graduates get interviews within 60 days, 89% land offers within 6 months. Average starting salary: ₦340,000/month for remote roles.",
    category: "Job Outcomes"
  },
  {
    question: "Can I learn at WDC Labs while working full-time?",
    answer: "Yes, WDC Labs is designed for working professionals. You need 2-3 hours daily for tasks assigned by AI supervisors. The program is self-paced within weekly deadlines. Tasks are distributed throughout the day so you can work mornings before work, during lunch, or evenings. Weekend catch-up sessions available. 64% of current WDC Labs students are employed full-time while learning.",
    category: "Time Commitment"
  },
  {
    question: "What is a tech visa support letter from WDC Labs?",
    answer: "A tech visa support letter from WDC Labs is an official document that helps you apply for work visas, digital nomad visas, or tech talent visas in countries like UK, Germany, Portugal, and Canada. The letter confirms: (1) You completed professional tech training, (2) Your skills meet international standards, (3) You have verified work experience, (4) Contact information for verification. This letter strengthens visa applications by proving you're a qualified tech professional, not just a student.",
    category: "Visa Support"
  },
  {
    question: "How do I get a remote tech job from Nigeria?",
    answer: "To get a remote tech job from Nigeria, follow this 5-step process: (1) Build a portfolio with 3-5 live projects (not course certificates), (2) Get a recommendation letter from someone who supervised your work, (3) Create a professional LinkedIn profile highlighting outcomes (not just tasks), (4) Apply to remote-first companies on We Work Remotely, Remote.co, and AngelList, (5) Set up international payment (Wise, Payoneer). Key: International companies want proof you can deliver work independently. WDC Labs provides the portfolio, recommendation letter, and visa support documentation you need.",
    category: "Remote Work"
  },
  {
    question: "Do Nigerian remote workers pay tax?",
    answer: "Yes, Nigerian remote workers earning from international companies must pay tax. If you earn income (whether foreign or local), you're required to file annual tax returns with FIRS (Federal Inland Revenue Service). Tax rate for individuals ranges from 7% to 24% depending on income bracket. Exempt: First ₦300,000 annually. Practical tip: Keep records of all foreign payments received via Wise, Payoneer, or bank transfers. Consult a Nigerian tax professional for proper filing.",
    category: "Remote Work"
  },
  {
    question: "What is the best freelance platform for Nigerians?",
    answer: "The best freelance platforms for Nigerians in 2026 are: (1) Upwork - Largest marketplace, accepts Nigerian freelancers, supports Payoneer/bank transfer, (2) Fiverr - Easy to start, gig-based, good for digital marketing and design, (3) Toptal - Highest paying ($60-$200/hour) but strict vetting, (4) We Work Remotely - Full-time remote positions, (5) AngelList - Startup jobs. Pro tip: Start with Upwork or Fiverr to build reviews, then move to higher-paying platforms like Toptal or direct contracts.",
    category: "Remote Work"
  },
  {
    question: "What programming language should I learn first in Nigeria?",
    answer: "The best first programming language for Nigerians in 2026 is Python. Python is: (1) Easiest to learn with simple syntax, (2) Used in data analytics, cybersecurity, web development, AI, (3) Highest demand in Nigerian and international job markets, (4) Average salary ₦250,000-₦600,000 for Python developers. Alternative: JavaScript if you want web development. Avoid: C++ or Java as first languages (too complex). WDC Labs teaches Python in the Data Analytics and Cybersecurity tracks.",
    category: "Technical Skills"
  },
  {
    question: "Do I need a laptop for WDC Labs?",
    answer: "Yes, you need a laptop for WDC Labs. Minimum requirements: Windows 10/11 or MacOS, 4GB RAM (8GB recommended), 128GB storage, stable internet connection. A phone or tablet is not sufficient for professional tech work. If you can't afford a laptop, consider: (1) Rent-to-own plans from Jumia or Konga, (2) Buy refurbished laptops (₦80,000-₦150,000), (3) Use cyber cafe during early learning (not recommended long-term).",
    category: "Technical Requirements"
  },
  {
    question: "WDC Labs vs Andela - which is better?",
    answer: "WDC Labs and Andela serve different purposes: Andela is a talent marketplace that places experienced developers in jobs (requires 2+ years experience, intensive screening). WDC Labs is a career accelerator for beginners to build their first portfolio (no experience required, ₦45,000 vs free but hard-to-enter Andela). Choose WDC Labs if: You're starting out, need portfolio and certification. Choose Andela if: You already have 2+ years professional experience and want job placement. Many WDC Labs graduates later apply to Andela after building their portfolio.",
    category: "Comparison"
  }
]

export function AIOFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const categories = ["All", ...Array.from(new Set(aioFaqs.map(faq => faq.category)))]

  const filteredFaqs = aioFaqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <section 
      id="ai-faqs" 
      className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200"
      itemScope 
      itemType="https://schema.org/FAQPage"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <HelpCircle className="w-4 h-4" /> AI-OPTIMIZED Q&A
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#12263f]">
            Everything You Need to Know
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Common questions about remote tech careers, salaries, and WDC Labs answered with real data.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for answers... (e.g., 'How much do data analysts earn?')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 transition text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                selectedCategory === category
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
              className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-blue-300 transition"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-start justify-between gap-4 text-left hover:bg-slate-50 transition"
              >
                <div className="flex-1">
                  <h3
                    itemProp="name"
                    className="text-base sm:text-lg font-bold text-[#12263f] mb-1"
                  >
                    {faq.question}
                  </h3>
                  <span className="text-xs text-blue-600 font-semibold">
                    {faq.category}
                  </span>
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-slate-400 flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openIndex === index && (
                <div
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                  className="px-6 pb-5 border-t border-slate-100"
                >
                  <p
                    itemProp="text"
                    className="text-sm sm:text-base text-slate-700 leading-relaxed pt-4"
                  >
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-lg">
                No questions found matching "{searchTerm}". Try a different search term.
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">Still have questions?</p>
          <a
            href="#audit"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            Chat with Tolu (AI HR Manager)
          </a>
        </div>
      </div>
    </section>
  )
}
