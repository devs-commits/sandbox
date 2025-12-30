"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Option = {
  label: string;
  value: string;
};

type Question = {
  id: number;
  question: string;
  options: Option[];
};

const questions: Question[] = [
  {
    id: 1,
    question: "What best describes you?",
    options: [
      { label: "Student", value: "student" },
      { label: "Recent Graduate", value: "graduate" },
      { label: "NYSC / Corper", value: "corper" },
      { label: "Working Professional", value: "professional" },
      { label: "Career Switcher", value: "switcher" },
    ],
  },
  {
    id: 2,
    question: "What do you hope to achieve from this internship?",
    options: [
      { label: "Gain real-world experience", value: "experience" },
      { label: "Build a strong portfolio", value: "portfolio" },
      { label: "Improve my technical skills", value: "skills" },
      { label: "Prepare for a job role", value: "job" },
      { label: "Explore a new career path", value: "explore" },
    ],
  },
  {
    id: 3,
    question: "Which internship track are you joining?",
    options: [
      { label: "Cybersecurity", value: "cybersecurity" },
      { label: "Data Analytics", value: "data_analytics" },
      { label: "Digital Marketing", value: "digital_marketing" },
    ],
  },
  {
    id: 4,
    question: "How would you rate your current skill level?",
    options: [
      { label: "Beginner", value: "beginner" },
      { label: "Intermediate", value: "intermediate" },
      { label: "Advanced", value: "advanced" },
    ],
  },
  {
    id: 5,
    question: "Do you have any prior experience related to this field?",
    options: [
      { label: "Academic coursework", value: "academic" },
      { label: "Online courses / bootcamps", value: "online" },
      { label: "Personal projects", value: "projects" },
      { label: "Internship or job experience", value: "work" },
      { label: "No prior experience", value: "none" },
    ],
  },
  {
    id: 6,
    question: "How do you learn best?",
    options: [
      { label: "Step-by-step guidance", value: "guided" },
      { label: "Hands-on tasks", value: "hands_on" },
      { label: "Real-world challenges", value: "challenges" },
      { label: "Visual explanations", value: "visual" },
      { label: "Reading & research", value: "reading" },
    ],
  },
  {
    id: 7,
    question: "How many hours per week can you commit?",
    options: [
      { label: "5–10 hours", value: "5-10" },
      { label: "10–20 hours", value: "10-20" },
      { label: "20–30 hours", value: "20-30" },
      { label: "30+ hours", value: "30+" },
    ],
  },
  {
    id: 8,
    question: "When facing a difficult task, you usually:",
    options: [
      { label: "Need guidance before starting", value: "guided" },
      { label: "Try first, then ask for help", value: "trial" },
      { label: "Enjoy the challenge", value: "challenge" },
      { label: "Prefer examples before attempting", value: "examples" },
    ],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [questions[current].id]: value });
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent((prev) => prev + 1);
      } else {
        setCurrent(questions.length);
      }
    }, 300);
  };

  const handleComplete = () => {
    // TODO: Send answers to backend API
    console.log("Onboarding answers:", answers);
    router.push("/student/headquarters");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl rounded-2xl p-8 bg-[hsla(216,36%,18%,1)]">
        <div className="mb-6">
          <div className="h-2 w-full bg-foreground rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(current / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {current < questions.length && questions[current] && (
            <motion.div
              key={questions[current].id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                {questions[current].question}
              </h2>
              <div className="grid gap-4">
                {questions[current].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 text-left text-foreground font-medium transition-all bg-background"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {current >= questions.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-foreground mb-2">
              You're all set 🎉
            </h2>
            <p className="text-foreground mb-6">
              Our AI is preparing your personalized internship experience.
            </p>
            <button
              onClick={handleComplete}
              className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/50 transition-colors"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};