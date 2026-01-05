import { motion, AnimatePresence } from 'framer-motion';

interface FeatureTooltipProps {
  isVisible: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  targetRef?: React.RefObject<HTMLElement>;
}

export function FeatureTooltip({
  isVisible,
  position,
  title,
  description,
  step,
  totalSteps,
  onNext,
  onSkip,
}: FeatureTooltipProps) {
  const positionClasses = {
    top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-3 left-1/2 -translate-x-1/2',
    left: 'right-full mr-3 top-1/2 -translate-y-1/2',
    right: 'left-full ml-3 top-1/2 -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-primary',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-primary',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-primary',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-primary',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`absolute z-50 ${positionClasses[position]}`}
        >
          <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-xl min-w-[250px] max-w-[300px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-80">
                Step {step} of {totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="text-xs opacity-80 hover:opacity-100 underline"
              >
                Skip tour
              </button>
            </div>
            <h4 className="font-semibold mb-1">{title}</h4>
            <p className="text-sm opacity-90 mb-3">{description}</p>
            <button
              onClick={onNext}
              className="w-full py-2 bg-primary-foreground text-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {step === totalSteps ? 'Get Started' : 'Next'}
            </button>
          </div>
          <div
            className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}