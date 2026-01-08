import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import corporateTraining from '@/assets/corporate-training.jpg';
import Image from 'next/image';

interface CTASectionDarkProps {
  onSecureSpotClick?: () => void;
}

const CTASectionDark = ({ onSecureSpotClick }: CTASectionDarkProps) => {
  return (
    <section className="section-darker py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Image
              src={corporateTraining} 
              alt="Corporate training session"
              className="rounded-2xl shadow-2xl w-full object-cover h-64 md:h-80"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              Don't be left behind in 2025.
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Can't afford the subscription? Don't let that stop you. Send a sponsorship link to a mentor.
            </p>
            <Button 
              onClick={onSecureSpotClick}
              className="btn-coral-gradient text-foreground px-8 py-6 text-base font-semibold"
            >
              Secure your spot now
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASectionDark;