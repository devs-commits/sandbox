import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Star } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { AGENTS } from '../types';

interface CareerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: {
    taskTitle: string;
    cvBulletPoint: string;
    encouragement: string;
    skillsGained: string[];
  };
}

export function CareerFeedbackModal({ isOpen, onClose, feedback }: CareerFeedbackModalProps) {
  const kemi = AGENTS.Kemi;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-r border-border shadow-2xl"
          >
            <div className="h-full flex flex-col p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: kemi.color }}
                  >
                    {kemi.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Coach Kemi</h3>
                    <p className="text-sm text-muted-foreground">{kemi.role}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="text-primary" size={16} />
                    <span className="text-sm font-medium text-primary">Career Update</span>
                  </div>
                  <p className="text-foreground">{feedback.encouragement}</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Added to your WDC CV:
                  </h4>
                  <p className="text-foreground font-medium">"{feedback.cvBulletPoint}"</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    From: {feedback.taskTitle}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Skills Demonstrated:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {feedback.skillsGained.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        <Star size={12} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={onClose} className="mt-6">
                Thanks, Kemi!
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}