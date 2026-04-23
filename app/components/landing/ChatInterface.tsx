'use client'

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const avatarTolu = "/tolu.jpg";

interface Message {
  id: string;
  content: string;
  role: 'ai' | 'user';
  timestamp: Date;
}

interface ChatInterfaceProps {
  variant?: 'v3';
  onJoinClick?: () => void;
}

const screeningSteps = [
  {
    id: 1,
    ai: `Hello.\nI'm Tolu, HR at WDC Labs.\nI review hundreds of CVs every week and most people fail before the first interview.\nLet's test something quickly.\nDo you currently have real work experience in tech?`,
    options: ['Yes', "I'm learning", 'Not yet'],
  },
  {
    id: 2,
    ai: `Interesting.\nLet me ask you something honestly.\nIf a recruiter asked you to show real work you've done, could you show them a project today?`,
    options: ['Yes', 'Not really', 'Only certificates'],
  },
];

const finalAIMessage = `Thanks for answering honestly.\nThe biggest problem most graduates face is this:\nYou can't get a job without experience.\nAnd you can't get experience without a job.\nThat's exactly why we built WDC Labs.\nInside WDC Labs you enter a virtual office where supervisors like me assign real work tasks, review your output, and simulate a real job environment.\nSome people quit on Day 1.\nBut those who stay leave with real experience recruiters respect.`;

const ChatInterface = ({ variant = 'v3', onJoinClick }: ChatInterfaceProps) => {
  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: screeningSteps[0].ai,
      role: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    if (!isInitialMount) {
      scrollToBottom();
    }
    setIsInitialMount(false);
  }, [messages]);

  const renderLines = (text: string) =>
    text.split('\n').map((line, idx) => (
      <p key={idx} className="text-sm text-[#1a2744] mb-1 font-inter">
        {line}
      </p>
    ));

  const progressLabel = `${Math.round((step / 3) * 100)}% Complete`;

  const handleOptionSelect = (option: string) => {
    if (step >= 3) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: option,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      if (step === 1) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: screeningSteps[1].ai,
          role: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setStep(2);
        return;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: finalAIMessage,
        role: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setStep(3);
    }, 1100);
  };

  if (variant === 'v3') {
    const currentStep = screeningSteps[step - 1];
    const options = currentStep?.options ?? [];

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl overflow-hidden w-full shadow-xl">
          <div className="p-4 bg-[hsla(205,98%,16%,1)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={avatarTolu}
                    alt="Tolu - AI HR Manager"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/80 font-inter">Tolu HR Screening</p>
                  <h3 className="text-lg font-bold text-white font-inter">Step {step} of 3</h3>
                </div>
              </div>
              <div className="text-xs font-semibold text-white/80 font-inter">{progressLabel}</div>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-[#ff6b35] transition-all"
                style={{ width: `${Math.round((step / 3) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-4 border-b border-white/10">
            <h4 className="text-sm font-semibold text-[#1a2744] font-inter">Can You Pass Tolu's HR Screening?</h4>
            <p className="text-base text-[#4a5568] max-w-2xl mx-auto font-inter">Most applicants fail this in under 60 seconds.</p>
          </div>

          <div className="min-h-96 max-h-96 overflow-y-auto p-4 space-y-4 bg-white">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'ai' ? (
                    <div className="flex items-start gap-3 max-w-[90%]">
                      <div className="w-9 h-9 rounded-full overflow-hidden">
                        <img
                          src={avatarTolu}
                          alt="Tolu - AI HR Manager"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1a2744] mb-2 font-inter">Tolu</p>
                        <div className="bg-[#e8eaed] rounded-2xl p-4">
                          {renderLines(message.content)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1a2744] text-white rounded-2xl p-4 max-w-[85%]">
                      <p className="text-sm font-inter text-white">{message.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="max-w-[90%]">
                  <p className="text-sm font-bold text-[#1a2744] mb-2">Tolu</p>
                  <div className="bg-[#e8eaed] rounded-2xl p-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-[#1a2744] rounded-full animate-pulse" />
                      <span className="w-2 h-2 bg-[#1a2744] rounded-full animate-pulse delay-100" />
                      <span className="w-2 h-2 bg-[#1a2744] rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {options.length > 0 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <div className="max-w-[85%]">
                  <div className="bg-gradient-to-r from-[#1a2744] to-[#2a3744] rounded-2xl p-3 shadow-lg">
                    <p className="text-xs text-white/80 mb-3 font-inter">Choose your response:</p>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option, idx) => (
                        <motion.button
                          key={option}
                          onClick={() => handleOptionSelect(option)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white/10 backdrop-blur-sm text-white py-2 px-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-all duration-200 border border-white/20 whitespace-nowrap font-inter"
                        >
                          {option}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex justify-center mt-4"
              >
                <div className="max-w-[85%]">
                  <motion.button
                    onClick={() => {
                      const pricingSection = document.getElementById('pricing');
                      if (pricingSection) {
                        pricingSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-[#ff6b35] to-[#ff5722] text-white px-6 py-3 rounded-2xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 font-inter relative overflow-hidden group"
                  >
                    <span className="relative z-10">Enter WDC Virtual Office</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5722] to-[#ff6b35] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChatInterface;
