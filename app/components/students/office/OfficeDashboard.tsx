"use client";
import { useState, useRef, useEffect} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, BookOpen, User, MessageSquare} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { AgentChatInterface } from '../../students/office/AgentChatInterface';
import { TaskDashboard } from '../../students/office/TaskDashboard';
import { ArchivesView } from '../../students/office/ArchivesView';
import { ProfileModal } from './modals/ProfileModal';
import { CollapsibleChat } from './CollapsibleChat';
import { AgentAvatar } from './AgentAvatar';
import { cn } from '@/lib/utils';

const TOUR_STEPS = [
  {
    target: 'desk',
    title: 'Your Desk',
    description: "This is your Desk. Check here every morning.",
  },
  {
    target: 'meeting',
    title: 'The Meeting Room',
    description: "This is where we talk. Professional communications only. No 'pls' or 'u'. We use full sentences here.",
  },
  {
    target: 'archives',
    title: 'The Archives',
    description: "If you don't know how to do something, check the Archives before you ask your supervisor.",
  },
];

export function OfficeDashboard() {
  const { 
    phase, 
    tourStep, 
    setTourStep, 
    completeTour, 
    activeView, 
    setActiveView,
  } = useOffice();
  const [showProfile, setShowProfile] = useState(false);

  const deskRef = useRef<HTMLButtonElement | null>(null);
  const archivesRef = useRef<HTMLButtonElement | null>(null);
  const chatRef = useRef<HTMLButtonElement | null>(null);

  // Mobile refs
  const deskMobileRef = useRef<HTMLButtonElement | null>(null);
  const chatMobileRef = useRef<HTMLButtonElement | null>(null);
  const archivesMobileRef = useRef<HTMLButtonElement | null>(null);

  // Desktop chat button ref (for the collapsible chat trigger in tour)
  const desktopChatRef = useRef<HTMLButtonElement | null>(null);

  const isTourActive = phase === 'tour';

  const handleNavClick = (view: 'desk' | 'meeting' | 'archives') => {
    setActiveView(view);
  };

  const handleNextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      completeTour();
    }
  };

  const handleSkipTour = () => {
    completeTour();
  };

  // Get the position and dimensions of the target element for the current tour step
  const getTourTargetPosition = () => {
    const isMobile = window.innerWidth < 1024;
    let targetRef:
  | React.RefObject<HTMLButtonElement | null>
  | React.RefObject<HTMLDivElement | null>
  | null = null;


    switch (tourStep) {
      case 0: // Desk
        targetRef = isMobile ? deskMobileRef : deskRef;
        break;
      case 1: // Chat/Meeting
        targetRef = isMobile ? chatMobileRef : desktopChatRef;
        break;
      case 2: // Archives
        targetRef = isMobile ? archivesMobileRef : archivesRef;
        break;
    }

    if (targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };
    }
    return null;
  };

  const [targetPosition, setTargetPosition] = useState<ReturnType<typeof getTourTargetPosition>>(null);

  // Update target position when tour step changes or window resizes
  useEffect(() => {
    if (isTourActive) {
      const updatePosition = () => {
        setTargetPosition(getTourTargetPosition());
      };
      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isTourActive, tourStep]);

  const renderMainContent = () => {
    switch (activeView) {
      case 'archives':
        return <ArchivesView />;
      case 'meeting':
        // Mobile only - on desktop we use CollapsibleChat
        return (
          <div className="h-full lg:hidden">
            <AgentChatInterface />
          </div>
        );
      default:
        return <TaskDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Briefcase className="text-primary" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">WDC Office</h1>
            <p className="text-xs text-muted-foreground">Level 1 • Probation</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowProfile(true)}
          className="rounded-full"
        >
          <User size={20} />
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop (only Desk and Archives, no Chat) */}
        <nav className="hidden lg:flex flex-col w-20 border-r border-border/50 bg-card/50 items-center py-6 gap-2">
          <div className="flex flex-col items-center">
            <Button
              ref={deskRef}
              variant={activeView === 'desk' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handleNavClick('desk')}
              className={cn(
                "w-12 h-12 rounded-xl transition-all",
                activeView === 'desk' && "bg-primary text-primary-foreground shadow-lg"
              )}
            >
              <Briefcase size={20} />
            </Button>
            <span className="text-xs text-muted-foreground mt-1">Desk</span>
          </div>
          
          <div className="flex flex-col items-center mt-2">
            <Button
              ref={archivesRef}
              variant={activeView === 'archives' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => handleNavClick('archives')}
              className={cn(
                "w-12 h-12 rounded-xl transition-all",
                activeView === 'archives' && "bg-primary text-primary-foreground shadow-lg"
              )}
            >
              <BookOpen size={20} />
            </Button>
            <span className="text-xs text-muted-foreground mt-1">Archives</span>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden h-20 border-t border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-around shrink-0 px-4 pb-2">
        <div className="flex flex-col items-center">
          <Button
            ref={deskMobileRef}
            variant={activeView === 'desk' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleNavClick('desk')}
            className={cn(
              "w-12 h-12 rounded-xl",
              activeView === 'desk' && "bg-primary text-primary-foreground"
            )}
          >
            <Briefcase size={20} />
          </Button>
          <span className="text-xs text-muted-foreground mt-1">Desk</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            ref={chatMobileRef}
            variant={activeView === 'meeting' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleNavClick('meeting')}
            className={cn(
              "w-12 h-12 rounded-xl",
              activeView === 'meeting' && "bg-primary text-primary-foreground"
            )}
          >
            <MessageSquare size={20} />
          </Button>
          <span className="text-xs text-muted-foreground mt-1">Chat</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            ref={archivesMobileRef}
            variant={activeView === 'archives' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleNavClick('archives')}
            className={cn(
              "w-12 h-12 rounded-xl",
              activeView === 'archives' && "bg-primary text-primary-foreground"
            )}
          >
            <BookOpen size={20} />
          </Button>
          <span className="text-xs text-muted-foreground mt-1">Archives</span>
        </div>
        
        <div className="flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowProfile(true)}
            className="w-12 h-12 rounded-xl"
          >
            <User size={20} />
          </Button>
          <span className="text-xs text-muted-foreground mt-1">Profile</span>
        </div>
      </nav>

      {/* Tour Spotlight Overlay - Highlights the target element */}
      <AnimatePresence>
        {isTourActive && targetPosition && (
          <>
            {/* Semi-transparent overlay with cutout for target */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${targetPosition.centerX}px ${targetPosition.centerY}px, transparent 40px, rgba(0,0,0,0.7) 80px)`,
              }}
            />

            {/* Highlight ring around target */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed z-[91] pointer-events-none"
              style={{
                top: targetPosition.top - 8,
                left: targetPosition.left - 8,
                width: targetPosition.width + 16,
                height: targetPosition.height + 16,
                borderRadius: '16px',
                border: '3px solid hsl(var(--primary))',
                boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
              }}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed z-[92] bg-primary text-primary-foreground rounded-xl p-4 shadow-2xl w-80"
              style={{
                // Position tooltip based on screen size and target position
                ...(window.innerWidth < 1024
                  ? {
                      // Mobile: position above the bottom nav
                      bottom: 110,
                      left: targetPosition.centerX,
                      transform: 'translateX(-50%)',
                    }
                  : tourStep === 1
                  ? {
                      // Desktop chat button: position above it
                      bottom: 90,
                      right: 16,
                    }
                  : {
                      // Desktop sidebar: position to the right
                      top: targetPosition.centerY - 60,
                      left: targetPosition.left + targetPosition.width + 20,
                    }),
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <AgentAvatar agentName="Tolu" size="md" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Tolu</span>
                    <span className="text-xs opacity-70">Step {tourStep + 1}/{TOUR_STEPS.length}</span>
                  </div>
                  <span className="text-xs opacity-70">Onboarding Officer</span>
                </div>
              </div>
              <h4 className="font-semibold mb-1">{TOUR_STEPS[tourStep].title}</h4>
              <p className="text-sm opacity-90 mb-3">{TOUR_STEPS[tourStep].description}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNextTourStep}
                  className="flex-1 py-2 bg-primary-foreground text-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                </button>
                <button onClick={handleSkipTour} className="px-3 py-2 text-xs opacity-80 hover:opacity-100 underline">
                  Skip
                </button>
              </div>

              {/* Arrow pointing to target - dynamically positioned */}
              {window.innerWidth < 1024 ? (
                <div 
                  className="absolute top-full w-0 h-0 border-8 border-l-transparent border-r-transparent border-b-transparent border-t-primary"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                />
              ) : tourStep === 1 ? (
                <div className="absolute top-full right-6 w-0 h-0 border-8 border-l-transparent border-r-transparent border-b-transparent border-t-primary" />
              ) : (
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-t-transparent border-b-transparent border-l-transparent border-r-primary" />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Chat Reference for Tour - this is what the tour points to */}

      {/* Collapsible Chat - Desktop only (like LinkedIn) */}
      <CollapsibleChat triggerRef={desktopChatRef} />

      {/* Modals */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
