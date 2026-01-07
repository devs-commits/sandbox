"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { AGENTS } from '../types';
import { AgentAvatar } from '../AgentAvatar';

interface ToluWelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

type MessageStep = 'initial' | 'processing' | 'final';

export function ToluWelcomePopup({ isOpen, onClose, userName = 'Intern' }: ToluWelcomePopupProps) {
  const [step, setStep] = useState<MessageStep>('initial');
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setCanClose(false);
      return;
    }

    // Step 1: Show initial message for 2s, then processing
    const timer1 = setTimeout(() => {
      setStep('processing');
    }, 2000);

    // Step 2: Processing for 3s, then final message
    const timer2 = setTimeout(() => {
      setStep('final');
      setCanClose(true);
    }, 15000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-secondary/30">
              <div className="flex items-center gap-3">
                <AgentAvatar agentName="Tolu" size="md" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Tolu</h3>
                  <p className="text-xs text-muted-foreground">{AGENTS.Tolu.role}</p>
                </div>
              </div>
              {canClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 rounded-lg"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="p-4 space-y-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              {/* Initial Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <AgentAvatar agentName="Tolu" size="sm" />
                <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-foreground">
                    Received your document. I'm Tolu, the Onboarding Officer. I'm scanning your background now...
                  </p>
                </div>
              </motion.div>

              {/* Processing Animation */}
              {(step === 'processing' || step === 'final') && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 shrink-0" />
                  <div className="bg-secondary/40 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary animate-pulse" />
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: step === 'processing' ? Infinity : 0, duration: 0.6, delay: 0 }}
                          className="w-2 h-2 rounded-full bg-primary/60"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: step === 'processing' ? Infinity : 0, duration: 0.6, delay: 0.2 }}
                          className="w-2 h-2 rounded-full bg-primary/60"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: step === 'processing' ? Infinity : 0, duration: 0.6, delay: 0.4 }}
                          className="w-2 h-2 rounded-full bg-primary/60"
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {step === 'processing' ? 'Processing document...' : 'Document processed'}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Final Message */}
              {step === 'final' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <AgentAvatar agentName="Tolu" size="sm" />
                  <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-foreground leading-relaxed">
                      Okay, I've read it. Whether you have a Master's degree or this is your first time typing on a laptop, the rule here is the same: <strong>Output is everything.</strong> I am setting your starting capacity based on this upload. If you are uneducated in this field, we start you at the Foundation. If you are a pro, we start you at the Deep End. Do not fake it - Sola will catch you.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer - only show when can close */}
            {canClose && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 border-t border-border/50 bg-secondary/20"
              >
                <Button onClick={handleClose} className="w-full">
                  Continue to Office Tour
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}