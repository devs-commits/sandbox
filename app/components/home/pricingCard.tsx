import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Check, Share2 } from 'lucide-react';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  isFeatured?: boolean;
}

interface PricingCardProps extends PricingPlan {
  variant?: 'dark' | 'light';
  delay?: number;
  onPayYourselfClick?: () => void;
  onAskSponsorClick?: () => void;
}

const PricingCard = ({ 
  name, 
  price, 
  period, 
  features, 
  isFeatured = false,
  variant = 'dark',
  delay = 0,
  onPayYourselfClick,
  onAskSponsorClick,
}: PricingCardProps) => {
  const cardClass = variant === 'dark'
    ? `pricing-card ${isFeatured ? 'pricing-card-featured' : ''}`
    : `pricing-card-light ${isFeatured ? 'pricing-card-featured-light' : ''}`;

  return (
    <motion.div
      className={`${cardClass} rounded-2xl p-6 relative`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-teal text-primary-foreground text-xs font-semibold px-4 py-1 rounded-full">
            BEST VALUE
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-semibold text-foreground mb-2">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-bold text-foreground">₦{price}</span>
        </div>
        <p className="text-xs text-coral font-medium mt-1">{period}</p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground/90">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <Button 
          onClick={onPayYourselfClick}
          className={`w-full ${
            variant === 'dark' 
              ? 'btn-coral-gradient text-foreground' 
              : 'bg-coral hover:bg-coral-dark text-foreground'
          } py-5 font-semibold`}
        >
          Pay Yourself
        </Button>
        <Button 
          onClick={onAskSponsorClick}
          variant="outline"
          className={`w-full py-5 font-medium ${
            variant === 'dark'
              ? 'border-border text-foreground hover:bg-secondary'
              : 'border-border text-foreground hover:bg-secondary'
          }`}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Ask Sponsor to Pay
        </Button>
      </div>
    </motion.div>
  );
};

export default PricingCard;