"use client";
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, BookOpen, User } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { AgentChatInterface } from '../../students/office/AgentChatInterface';
import { TaskDashboard } from '../../students/office/TaskDashboard';
import { ArchivesView } from '../../students/office/ArchivesView';
import { ProfileModal } from './modals/ProfileModal';
import { CollapsibleChat } from './CollapsibleChat';
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
    description: "This is where we talk. Professional comms only. No 'pls' or 'u'. We use full sentences here.",
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

  const deskRef = useRef<HTMLButtonElement>(null);
  const archivesRef = useRef<HTMLButtonElement>(null);

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


  const renderTourTooltip = (step: number, position: 'right' | 'bottom') => {
    if (!isTourActive || tourStep !== step) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "absolute z-[100] bg-primary text-primary-foreground rounded-xl p-4 shadow-2xl w-72",
          position === 'right' && "left-full ml-3 top-1/2 -translate-y-1/2",
          position === 'bottom' && "top-full mt-3 left-1/2 -translate-x-1/2"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs opacity-80">Step {step + 1} of {TOUR_STEPS.length}</span>
          <button onClick={handleSkipTour} className="text-xs opacity-80 hover:opacity-100 underline">
            Skip tour
          </button>
        </div>
        <h4 className="font-semibold mb-1">{TOUR_STEPS[step].title}</h4>
        <p className="text-sm opacity-90 mb-3">{TOUR_STEPS[step].description}</p>
        <button
          onClick={handleNextTourStep}
          className="w-full py-2 bg-primary-foreground text-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {step === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
        </button>
        <div className={cn(
          "absolute w-0 h-0 border-8",
          position === 'right' && "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-primary",
          position === 'bottom' && "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-primary"
        )} />
      </motion.div>
    );
  };

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
          <div className="relative">
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
            <span className="text-xs text-muted-foreground mt-1 block text-center">Desk</span>
            {renderTourTooltip(0, 'right')}
          </div>
          
          {/* Tour step for Meeting Room - positioned here but no button */}
          {isTourActive && tourStep === 1 && (
            <div className="relative mt-2">
              <div className="w-12 h-12" />
              {renderTourTooltip(1, 'right')}
            </div>
          )}
          
          <div className="relative mt-2">
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
            <span className="text-xs text-muted-foreground mt-1 block text-center">Archives</span>
            {renderTourTooltip(2, 'right')}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {renderMainContent()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden h-20 border-t border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-around shrink-0 px-4 pb-2">
        <div className="relative flex flex-col items-center">
          <Button
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
          {renderTourTooltip(0, 'bottom')}
        </div>
        
        <div className="relative flex flex-col items-center">
          <Button
            variant={activeView === 'meeting' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => handleNavClick('meeting')}
            className={cn(
              "w-12 h-12 rounded-xl",
              activeView === 'meeting' && "bg-primary text-primary-foreground"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </Button>
          <span className="text-xs text-muted-foreground mt-1">Chat</span>
          {renderTourTooltip(1, 'bottom')}
        </div>
        
        <div className="relative flex flex-col items-center">
          <Button
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
          {renderTourTooltip(2, 'bottom')}
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

      {isTourActive && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 pointer-events-none" />
      )}

    
      <CollapsibleChat />

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}