import { motion } from 'framer-motion';
import FeatureCardDark from './FeatureCardDark';
import { Building2, FileText, Briefcase, Users } from 'lucide-react';
import FeatureCardLight from './FeatureCardLight';
import virtualOffice from '../../../public/virtual-office.jpg';
import recommendationLetter from '../../../public/recommendation-letter.png';
import livePortfolio from '../../../public/portfolio.png';
import teamMeeting from '../../../public/team-meeting.jpg';

interface ArsenalSectionProps {
  variant?: 'dark' | 'light';
}

const ArsenalSection = ({ variant = 'dark' }: ArsenalSectionProps) => {
  const features = [
    {
      icon: <Building2 className="w-8 h-8" />,
      title: 'The Virtual Office',
      description: 'Access to the WDC HQ Dashboard. Daily tasks, strict deadlines, and an AI boss who fires you if you slack.',
      image: virtualOffice,
      accentColor: 'teal' as const,
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Recommendation Letter',
      description: 'A verified, signed letter of recommendation generated automatically upon graduation. Use it for Visa apps.',
      image: recommendationLetter,
      accentColor: 'coral' as const,
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: 'Live Portfolio',
      description: 'We convert your chaotic tasks into sleek case studies. Send one link to recruiters, not a zip file.',
      image: livePortfolio,
      accentColor: 'teal' as const,
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'The Alumni Network',
      description: 'Join the "Japa Squad". Exclusive job postings from foreign startups looking for WDC grads.',
      image: teamMeeting,
      accentColor: 'yellow' as const,
    },
  ];

  if (variant === 'light') {
    return (
      <section className="py-16 md:py-24 bg-secondary" id="arsenal">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              The ₦15k Arsenal
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Most courses give you videos. We give you assets that get you hired. This is what your subscription actually buys.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCardLight
                key={feature.title}
                image={feature.image.src}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section-dark py-16 md:py-24" id="arsenal">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            The ₦15k Arsenal
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Most courses give you videos. We give you assets that get you hired. This is what your subscription actually buys.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCardDark
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              accentColor={feature.accentColor}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArsenalSection;