import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { useOffice } from '../../../contexts/OfficeContext';
import { CVUploadModal } from '../../../components/students/office/modals/CvUploadModal';
import { ToluWelcomePopup } from '../../../components/students/office/modals/ToluWelcomePopup';

export function LobbyScreen() {
  const { phase, showToluWelcome, setShowToluWelcome, completeOnboarding, userName } = useOffice();
  const showCVModal = phase === 'lobby' && !showToluWelcome;

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
        <p className="text-muted-foreground">
          Before you can enter the office, we need to know who you are.
        </p>
      </motion.div>

      <CVUploadModal isOpen={showCVModal} />
      
      <ToluWelcomePopup 
        isOpen={showToluWelcome} 
        onClose={handleToluWelcomeClose}
        userName={userName}
      />
    </div>
  );
}