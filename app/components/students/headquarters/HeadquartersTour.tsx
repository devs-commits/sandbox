"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useHeadquarters } from '@/app/contexts/HeadquartersContext';
import { AgentAvatar } from '../office/AgentAvatar';
import { cn } from '@/lib/utils';

const TOUR_STEPS = [
  {
    target: 'sidebar-office',
    title: 'Your Office',
    description: 'This is where the magic happens. Generate tasks, receive assignments, and complete work. Your desk is your command center where you check in every morning.',
  },
  {
    target: 'sidebar-portfolio',
    title: 'Your Portfolio',
    description: 'Showcase your completed work to recruiters. Every task you finish gets feedback and appears here to build your professional profile and attract opportunities.',
  },
  {
    target: 'sidebar-wallet',
    title: 'Global Wallet',
    description: 'Track your earnings, manage bank accounts, and withdraw your money. Every completed task and referral bonus earns you real cash here.',
  },
  {
    target: 'sidebar-squad',
    title: 'Squad',
    description: 'Collaborate with other interns, join teams, and leverage community support. You grow faster together with your squad.',
  },
  {
    target: 'sidebar-earn',
    title: 'Earn Money',
    description: 'Unlock additional income streams through referrals and bonus opportunities. Share your progress with friends and earn more.',
  },
  {
    target: 'hq-stats',
    title: 'Your Progress Hub',
    description: 'Track your key metrics: completed tasks, daily streaks, recruiter views, and profile stats. Stay motivated as you grow.',
  },
  {
    target: 'hq-letters',
    title: 'Reference Letters',
    description: 'Maintain your streak to unlock work and visa reference letters. These are powerful credentials for immigration and job applications.',
  },
];

// Configuration constants
const TOUR_CONFIG = {
  TOOLTIP_WIDTH: 320,
  TOOLTIP_HEIGHT: 220,
  MOBILE_BREAKPOINT: 1024,
  SIDEBAR_OFFSET: 16,
  CONTENT_OFFSET: 20,
  PADDING: 8,
  DRAWER_OPEN_DELAY: 100,
  DRAWER_CLOSE_DELAY: 100,
  SCROLL_DELAY: 50,
  EXTERNAL_EVENTS_LOCKOUT: 100,
  VIGNETTE_COLOR: 'rgba(0, 0, 0, 0.75)',
  VIGNETTE_RADIUS: 9999,
} as const;

const isVisible = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  
  const isHidden =
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0';

  const isInViewport =
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0 &&
    rect.left < window.innerWidth &&
    rect.right > 0;

  return !isHidden && isInViewport;
};

const findVisibleTarget = (selector: string): HTMLElement | null => {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return elements.find(isVisible) || null;
};

const dispatchSidebarEvent = (event: 'open' | 'close') => {
  window.dispatchEvent(new Event(`student-sidebar:${event}`));
};

const calculateTooltipPosition = (
  rect: DOMRect,
  isSidebarStep: boolean,
  tooltipWidth: number,
  tooltipHeight: number,
): { pos: { top: number; left: number }; placement: 'right' | 'bottom' | 'top' } => {
  let placement: 'right' | 'bottom' | 'top' = 'right';
  let pos: { top: number; left: number };

  if (isSidebarStep) {
    const rightSpace = window.innerWidth - rect.right;
    
    if (rightSpace > tooltipWidth + TOUR_CONFIG.SIDEBAR_OFFSET) {
      placement = 'right';
      pos = {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: rect.right + TOUR_CONFIG.SIDEBAR_OFFSET,
      };
    } else {
      placement = 'bottom';
      pos = {
        top: rect.bottom + TOUR_CONFIG.SIDEBAR_OFFSET,
        left: Math.max(
          TOUR_CONFIG.PADDING,
          Math.min(
            rect.left + rect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - TOUR_CONFIG.PADDING
          )
        ),
      };
    }
  } else {
    const bottomSpace = window.innerHeight - rect.bottom;
    
    if (bottomSpace > tooltipHeight + TOUR_CONFIG.CONTENT_OFFSET) {
      placement = 'bottom';
      pos = {
        top: rect.bottom + TOUR_CONFIG.CONTENT_OFFSET,
        left: Math.max(
          TOUR_CONFIG.PADDING,
          Math.min(
            rect.left + rect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - TOUR_CONFIG.PADDING
          )
        ),
      };
    } else {
      placement = 'top';
      pos = {
        top: rect.top - tooltipHeight - TOUR_CONFIG.CONTENT_OFFSET,
        left: Math.max(
          TOUR_CONFIG.PADDING,
          Math.min(
            rect.left + rect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - TOUR_CONFIG.PADDING
          )
        ),
      };
    }
  }

  return { pos, placement };
};

export function HeadquartersTour() {
  const router = useRouter();
  const { tourStep, setTourStep, completeTour, cancelTour, isTourActive } = useHeadquarters();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [placement, setPlacement] = useState<'right' | 'bottom' | 'top'>('right');
  
  const isSidebarStep = tourStep < 5;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < TOUR_CONFIG.MOBILE_BREAKPOINT;
  
  const isMeasuringRef = useRef(false);
  const skipExternalEventsRef = useRef(false);
  const skipExternalEventsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const measureTarget = async () => {
    if (isMeasuringRef.current) return;
    isMeasuringRef.current = true;
    skipExternalEventsRef.current = true;

    try {
      const currentStep = TOUR_STEPS[tourStep];
      let element = findVisibleTarget(`[data-tour="${currentStep.target}"]`);
      
      if (!element && isSidebarStep && isMobile) {
        dispatchSidebarEvent('open');
        await new Promise(resolve => setTimeout(resolve, TOUR_CONFIG.DRAWER_OPEN_DELAY));
        element = findVisibleTarget(`[data-tour="${currentStep.target}"]`);
      }
      
      if (!isSidebarStep && isMobile) {
        dispatchSidebarEvent('close');
        await new Promise(resolve => setTimeout(resolve, TOUR_CONFIG.DRAWER_CLOSE_DELAY));
      }
      
      if (!element) {
        setTargetRect(null);
        setTooltipPos(null);
        return;
      }

      try {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        await new Promise(resolve => setTimeout(resolve, TOUR_CONFIG.SCROLL_DELAY));
      } catch {
        // Continue even if scroll fails
      }

      const rect = element.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) {
        setTargetRect(null);
        setTooltipPos(null);
        return;
      }

      setTargetRect(rect);

      const { pos, placement: newPlacement } = calculateTooltipPosition(
        rect,
        isSidebarStep,
        TOUR_CONFIG.TOOLTIP_WIDTH,
        TOUR_CONFIG.TOOLTIP_HEIGHT,
      );

      setTooltipPos(pos);
      setPlacement(newPlacement);
    } finally {
      isMeasuringRef.current = false;
      skipExternalEventsTimeoutRef.current = setTimeout(() => {
        skipExternalEventsRef.current = false;
      }, TOUR_CONFIG.EXTERNAL_EVENTS_LOCKOUT);
    }
  };

  useEffect(() => {
    if (!isTourActive) {
      dispatchSidebarEvent('close');
      return;
    }
    measureTarget();
  }, [isTourActive, tourStep]);

  useEffect(() => {
    if (!isTourActive) return;

    const createCheckedHandler = (handler: () => void) => () => {
      if (!skipExternalEventsRef.current) {
        handler();
      }
    };

    const handleResize = createCheckedHandler(() => measureTarget());
    const handleScroll = createCheckedHandler(() => measureTarget());
    const handleSidebarChange = createCheckedHandler(() => {
      setTimeout(measureTarget, 320);
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('student-sidebar:open', handleSidebarChange);
    window.addEventListener('student-sidebar:close', handleSidebarChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('student-sidebar:open', handleSidebarChange);
      window.removeEventListener('student-sidebar:close', handleSidebarChange);
      if (skipExternalEventsTimeoutRef.current) {
        clearTimeout(skipExternalEventsTimeoutRef.current);
      }
    };
  }, [isTourActive]);

  const handleNextStep = async () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      dispatchSidebarEvent('close');
      await new Promise(resolve => setTimeout(resolve, 500));
      completeTour();
      router.push('/student/office');
    }
  };

  const handleSkip = () => {
    dispatchSidebarEvent('close');
    cancelTour();
  };

  const currentStep = TOUR_STEPS[tourStep];

  return (
    <AnimatePresence>
      {isTourActive && targetRect && (
        <>
          <motion.div
            key="highlight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              'fixed z-[91] pointer-events-none border-2 rounded-lg',
              isSidebarStep ? 'border-primary bg-primary/10' : 'border-white/50'
            )}
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: `0 0 0 ${TOUR_CONFIG.VIGNETTE_RADIUS}px ${TOUR_CONFIG.VIGNETTE_COLOR}`,
            }}
          />

          {tooltipPos && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed z-[92] bg-card border border-border rounded-xl p-5 shadow-2xl max-w-sm"
              style={{
                top: tooltipPos.top,
                left: tooltipPos.left,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AgentAvatar agentName="Tolu" size="sm" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Tolu</span>
                        <span className="text-xs text-muted-foreground">Step {tourStep + 1}/{TOUR_STEPS.length}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Onboarding Officer</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{currentStep.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>
                <button
                  onClick={handleSkip}
                  aria-label="Close tour"
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={handleNextStep}
                  className="flex-1 gap-1"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                </Button>
                <button onClick={handleSkip} className="px-3 py-2 text-xs text-muted-foreground hover:text-foreground underline">
                  Skip
                </button>
              </div>

              {tourStep === TOUR_STEPS.length - 1 && (
                <p className="text-xs text-muted-foreground mt-3 italic">
                  After the tour, head to your Office to check your Desk and start your first task!
                </p>
              )}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
