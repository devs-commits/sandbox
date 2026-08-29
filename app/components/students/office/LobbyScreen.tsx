import { motion } from 'framer-motion';
import { Building2, ArrowRight } from 'lucide-react';
import { useOffice } from '../../../contexts/OfficeContext';
import { Button } from '../../../components/ui/button';
import { ToluWelcomePopup } from '../../../components/students/office/modals/ToluWelcomePopup';

export function LobbyScreen() {
  const { showToluWelcome, setShowToluWelcome, completeOnboarding, userName, chatMessages, isBioProcessing } = useOffice();

  // Get the first Tolu message (AI response from bio assessment)
  const toluMessage = chatMessages.find(msg => msg.agentName === 'Tolu');
  const aiResponse = toluMessage?.message;

  const handleToluWelcomeClose = () => {
    setShowToluWelcome(false);
    completeOnboarding();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-xl"
        >
          <Building2 className="text-primary" size={48} />
        </motion.div>

        <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to WDC HQ</h1>
        <p className="text-lg text-muted-foreground mb-2">
          The lobby is quiet. Everyone is working.
        </p>
        
        {/* 🔥 Replaced the mandatory modal trigger with a clean button to enter the office */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Button 
            onClick={() => completeOnboarding()}
            className="rounded-xl px-8 py-6 text-base font-bold bg-primary hover:bg-primary/90 flex items-center gap-2 mx-auto"
          >
            Enter the Office <ArrowRight size={20} />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            You will be asked to set up your career profile at your desk.
          </p>
        </motion.div>
      </motion.div>

      <ToluWelcomePopup
        isOpen={showToluWelcome}
        onClose={handleToluWelcomeClose}
        userName={userName}
        aiResponse={aiResponse}
        isBioProcessing={isBioProcessing}
      />
    </div>
  );
}