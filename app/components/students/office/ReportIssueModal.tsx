"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

const CATEGORIES = [
  "The Task Brief / Instructions",
  "The Learning Resources (Videos/PDFs)",
  "Submission & Grading (Sola)",
  "Technical Bug"
];

const BRANCHES: Record<string, string[]> = {
  "The Task Brief / Instructions": [
    "It's too vague or unclear.",
    "The requirements contradict each other.",
    "It's for the wrong learning track."
  ],
  "The Learning Resources (Videos/PDFs)": [
    "A Video is unavailable or private.",
    "A PDF link is broken or shows a security warning.",
    "The resources don't match the task topic."
  ],
  "Submission & Grading (Sola)": [
    "Sola's feedback is inaccurate or unfair.",
    "The system says 'Connection Issue' when I submit.",
    "I passed, but the next task won't unlock."
  ],
  "Technical Bug": [
    "My task is stuck on 'Generating...'.",
    "My desk is completely empty.",
    "Other"
  ]
};

const NEEDS_CONTEXT = [
  "It's too vague or unclear.",
  "Sola's feedback is inaccurate or unfair.",
  "It's for the wrong learning track.",
  "Other"
];

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  taskId?: string;
  trackName?: string;
}

export function ReportIssueModal({ isOpen, onClose, userId, taskId = "unknown", trackName = "unknown" }: ReportModalProps) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [issueDetail, setIssueDetail] = useState("");
  const [optionalNote, setOptionalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setStep(2);
  };

  const handleDetailSelect = async (detail: string) => {
    setIssueDetail(detail);
    if (NEEDS_CONTEXT.includes(detail)) {
      setStep(3);
    } else {
      await submitReport(category, detail, ""); 
    }
  };

  const submitReport = async (selectedCat = category, selectedDetail = issueDetail, note = optionalNote) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          taskId,
          track: trackName,
          category: selectedCat,
          issueDetail: selectedDetail,
          optionalNote: note
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCategory("");
    setIssueDetail("");
    setOptionalNote("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }} 
            className="w-full max-w-sm bg-[#1A1D24] border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" />
                {step === 1 ? "Report an Issue" : step === 2 ? "What's wrong?" : "Extra Context"}
              </h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                <p className="text-green-400 font-medium text-lg">Issue Reported</p>
                <p className="text-gray-400 text-sm mt-1">The engineering team has been notified.</p>
              </div>
            ) : isSubmitting ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              </div>
            ) : (
              <>
                {step === 1 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-400 mb-2">What seems to be the problem with this task?</p>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className="text-left px-4 py-3 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg flex justify-between items-center transition-colors"
                      >
                        {cat}
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-2">
                    {BRANCHES[category].map((detail) => (
                      <button
                        key={detail}
                        onClick={() => handleDetailSelect(detail)}
                        className="text-left px-4 py-3 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {detail}
                      </button>
                    ))}
                    <button onClick={() => setStep(1)} className="text-sm text-gray-500 mt-3 hover:text-gray-300 text-left px-2">
                      ← Back
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-400">Could you tell us a bit more? (Optional)</p>
                    <textarea
                      value={optionalNote}
                      onChange={(e) => setOptionalNote(e.target.value)}
                      placeholder="Brief description..."
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none h-24"
                      maxLength={200}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-300">
                        ← Back
                      </button>
                      <button
                        onClick={() => submitReport()}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-5 py-2.5 rounded-lg font-medium transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}