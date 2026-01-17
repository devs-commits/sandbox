import { motion } from 'framer-motion';

interface FeatureCardLightProps {
  image: string;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCardLight = ({ 
  image, 
  title, 
  description, 
  delay = 0 
}: FeatureCardLightProps) => {
  return (
    <motion.div
      className="feature-card-light rounded-xl overflow-hidden h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-coral mb-2">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default FeatureCardLight;