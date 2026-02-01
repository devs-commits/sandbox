import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';

interface SalaryNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SalaryNegotiationModal({ isOpen, onClose }: SalaryNegotiationModalProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const startNegotiation = () => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentScenario('You are offered a salary of $50,000, but you believe your skills and experience justify $60,000. How would you negotiate?');
      setIsStarted(true);
      setIsLoading(false);
    }, 1000);
  };

  const submitResponse = () => {
    console.log('User response:', response);
    setResponse('');
    setIsStarted(false);
    setCurrentScenario(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
              <h3 className="font-semibold text-foreground">Salary Negotiation Practice</h3>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X size={16} />
              </Button>
            </div>

            {!isStarted ? (
              <div className="p-6 space-y-6">
                <p className="text-sm text-muted-foreground">
                  Practice salary negotiation scenarios to improve your confidence and skills.
                </p>
                <Button
                  onClick={startNegotiation}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Starting...
                    </>
                  ) : (
                    'Start Practice'
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-secondary/40 rounded-xl p-4">
                  <p className="text-sm text-foreground">{currentScenario}</p>
                </div>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response..."
                  className="min-h-[100px] resize-none"
                />
                <Button
                  onClick={submitResponse}
                  disabled={!response.trim()}
                  className="w-full"
                >
                  <Send className="mr-2" size={16} />
                  Submit Response
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}