import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import CountdownTimer from './CountDownTimer';
import WarningBanner from './WarningBanner';
import { Lock, Gift } from 'lucide-react';

interface HeroSectionDarkProps {
  onSecureSpotClick?: () => void;
  onMentorPayClick?: () => void;
}

const HeroSectionDark = ({ onSecureSpotClick, onMentorPayClick }: HeroSectionDarkProps) => {
  const targetDate = new Date('2026-01-30T00:00:00');

  return (
    <section className="hero-gradient-bg min-h-[90vh] flex flex-col">
      <WarningBanner />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1 
            className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Experience is the New Currency.
            <br />
            <span className="text-gradient-teal">Secure Your Future Now.</span>
          </motion.h1>

          <motion.p 
            className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            By 2026, "Entry Level" jobs will require 2 years of experience. <span className="text-foreground font-medium">WDC Labs</span> gives you that experience in 3 months. Don't gamble with your career. Get the cheat code.
          </motion.p>

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-xs md:text-sm text-gradient-yellow font-semibold tracking-wider mb-4">
              LAUNCH DEADLINE: JAN 30, 2026
            </p>
            <div className="flex justify-center">
              <CountdownTimer targetDate={targetDate} variant="dark" />
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-3 justify-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button 
              onClick={onSecureSpotClick}
              className="btn-primary-gradient text-primary-foreground px-8 py-6 text-base font-semibold"
            >
              <Lock className="w-4 h-4 mr-2" />
              SECURE MY SPOT
            </Button>
            <Button 
              onClick={onMentorPayClick}
              variant="outline"
              className="btn-outline-light px-8 py-6 text-base"
            >
              <Gift className="w-4 h-4 mr-2" />
              ASK MENTOR TO PAY
            </Button>
          </motion.div>

          <motion.p 
            className="text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            No credit card required for waitlist. Verify via LinkedIn.
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionDark;