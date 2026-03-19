'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"

const questions = [
  {
    question: "What kind of problems excite you most?",
    options: [
      { text: "Creating campaigns that drive customer engagement", scores: { marketing: 3, data: 1, cybersecurity: 0 } },
      { text: "Finding patterns and insights in data", scores: { marketing: 0, data: 3, cybersecurity: 1 } },
      { text: "Protecting systems from threats and vulnerabilities", scores: { marketing: 0, data: 1, cybersecurity: 3 } },
    ],
  },
  {
    question: "Which skill would you rather master?",
    options: [
      { text: "Persuasive writing and social media strategy", scores: { marketing: 3, data: 0, cybersecurity: 0 } },
      { text: "SQL, Python, and data visualization", scores: { marketing: 0, data: 3, cybersecurity: 1 } },
      { text: "Network security and ethical hacking", scores: { marketing: 0, data: 1, cybersecurity: 3 } },
    ],
  },
  {
    question: "Your ideal work environment is:",
    options: [
      { text: "Creative and fast-paced, with customer interaction", scores: { marketing: 3, data: 1, cybersecurity: 0 } },
      { text: "Analytical and data-driven, solving business problems", scores: { marketing: 1, data: 3, cybersecurity: 1 } },
      { text: "Structured and detail-oriented, ensuring system integrity", scores: { marketing: 0, data: 1, cybersecurity: 3 } },
    ],
  },
]

const recommendations = {
  marketing: {
    track: "Digital Marketing", icon: "📱",
    description: "You're creative, people-focused, and love driving engagement. Perfect for marketing!",
    salary: "₦200,000 - ₦500,000/mo",
    skills: ["SEO & Content", "Paid Ads", "Analytics", "Social Media"],
  },
  data: {
    track: "Data Analytics", icon: "📊",
    description: "You love patterns, problem-solving, and making data-driven decisions. Data is your calling!",
    salary: "₦250,000 - ₦600,000/mo",
    skills: ["SQL & Python", "Data Visualization", "Excel Mastery", "Business Intelligence"],
  },
  cybersecurity: {
    track: "Cybersecurity", icon: "🛡️",
    description: "You're detail-oriented, systematic, and passionate about protecting systems. Security is your strength!",
    salary: "₦300,000 - ₦700,000/mo",
    skills: ["Linux & Networking", "Threat Detection", "Security Operations", "Incident Response"],
  },
}

export default function CareerPathQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [scores, setScores] = useState({ marketing: 0, data: 0, cybersecurity: 0 })
  const [showResults, setShowResults] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleAnswer = (optionIndex: number) => {
    const option = questions[currentQuestion].options[optionIndex]
    setSelectedOption(optionIndex)

    setTimeout(() => {
      const newScores = {
        marketing: scores.marketing + option.scores.marketing,
        data: scores.data + option.scores.data,
        cybersecurity: scores.cybersecurity + option.scores.cybersecurity,
      }
      setScores(newScores)

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedOption(null)
      } else {
        setShowResults(true)
      }
    }, 300)
  }

  const getRecommendation = () => {
    const max = Math.max(scores.marketing, scores.data, scores.cybersecurity)
    if (scores.marketing === max) return recommendations.marketing
    if (scores.data === max) return recommendations.data
    return recommendations.cybersecurity
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setScores({ marketing: 0, data: 0, cybersecurity: 0 })
    setShowResults(false)
    setSelectedOption(null)
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100
  const recommendation = showResults ? getRecommendation() : null

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-xs font-bold px-4 py-2 rounded-full mb-4 border border-purple-200">
            <Sparkles className="w-4 h-4" /> PERSONALIZED RECOMMENDATION
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#12263f]">Find Your Perfect Career Track</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Take our 60-second quiz to discover which track matches your strengths</p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-slate-100 h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                </div>
                <div className="p-8 md:p-12">
                  <p className="text-sm font-bold text-slate-500 mb-3">Question {currentQuestion + 1} of {questions.length}</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-[#12263f] mb-8">{questions[currentQuestion].question}</h3>
                  <div className="space-y-4">
                    {questions[currentQuestion].options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        className={`w-full p-5 text-left rounded-xl border-2 transition-all ${
                          selectedOption === index ? "border-blue-500 bg-blue-50 shadow-lg scale-[0.98]" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedOption === index ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                            {selectedOption === index && <CheckCircle className="w-5 h-5 text-white" />}
                          </div>
                          <span className="text-slate-900 font-medium">{option.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {currentQuestion > 0 && (
                    <button onClick={() => { setCurrentQuestion(currentQuestion - 1); setSelectedOption(null) }} className="mt-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold">
                      <ArrowLeft className="w-4 h-4" /> Previous Question
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white">
                  <div className="text-6xl mb-4">{recommendation?.icon}</div>
                  <h3 className="text-3xl font-extrabold mb-2">Perfect Match!</h3>
                  <p className="text-blue-100">Based on your answers, we recommend:</p>
                </div>
                <div className="p-8 md:p-12">
                  <div className="text-center mb-8">
                    <h4 className="text-4xl font-extrabold text-[#12263f] mb-3">{recommendation?.track} Track</h4>
                    <p className="text-lg text-slate-600 mb-4">{recommendation?.description}</p>
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-bold">
                      💰 Average Salary: {recommendation?.salary}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-6 mb-8">
                    <h5 className="font-bold text-slate-900 mb-4">You'll master these skills:</h5>
                    <div className="grid grid-cols-2 gap-3">
                      {recommendation?.skills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="#waitlist" className="flex-1 px-6 py-4 bg-[#12263f] text-white font-bold rounded-xl hover:bg-blue-600 transition-all text-center flex items-center justify-center gap-2">
                      Start This Track <ArrowRight className="w-4 h-4" />
                    </a>
                    <button onClick={resetQuiz} className="px-6 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
                      Retake Quiz
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
