"use client";
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { OfficeState, OfficePhase, ChatMessage, Task, UserLevel, AgentName, UserPortfolio } from "../components/students/office/types";

const STORAGE_KEY = 'wdc_office_state';

interface PersistedState {
  hasCompletedOnboarding: boolean;
  hasCompletedTour: boolean;
  userLevel: UserLevel | null;
  isFirstTask: boolean;
}

interface OfficeContextType extends OfficeState {
  setPhase: (phase: OfficePhase) => void;
  setUserLevel: (level: UserLevel) => void;
  addChatMessage: (message: ChatMessage) => void;
  setCurrentTask: (task: Task | null) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  setTourStep: (step: number) => void;
  completeOnboarding: () => void;
  completeTour: () => void;
  addPortfolioItem: (item: UserPortfolio) => void;
  generateTask: () => Promise<void>;
  isGeneratingTask: boolean;
  activeView: 'desk' | 'meeting' | 'archives';
  setActiveView: (view: 'desk' | 'meeting' | 'archives') => void;
  submitBio: (bio: string, file?: File) => Promise<void>;
  submitWork: (taskId: string, file: File, notes: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  showToluWelcome: boolean;
  setShowToluWelcome: (show: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isFirstTask: boolean;
  userName: string;
  trackName: string;
  typingAgent: AgentName | null;
}

const OfficeContext = createContext<OfficeContextType | null>(null);

function getPersistedState(): PersistedState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load office state:', e);
  }
  return { hasCompletedOnboarding: false, hasCompletedTour: false, userLevel: null, isFirstTask: true };
}

function persistState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save office state:', e);
  }
}

export function OfficeProvider({ children }: { children: ReactNode }) {
  const persisted = getPersistedState();
  
  const [phase, setPhaseState] = useState<OfficePhase>(() => {
    if (persisted.hasCompletedOnboarding && persisted.hasCompletedTour) return 'working';
    if (persisted.hasCompletedOnboarding) return 'tour';
    return 'lobby';
  });
  const [userLevel, setUserLevel] = useState<UserLevel | null>(persisted.userLevel);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [portfolio, setPortfolio] = useState<UserPortfolio[]>([]);
  const [tourStep, setTourStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(persisted.hasCompletedOnboarding);
  const [hasCompletedTour, setHasCompletedTour] = useState(persisted.hasCompletedTour);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [activeView, setActiveView] = useState<'desk' | 'meeting' | 'archives'>('desk');
  const [showToluWelcome, setShowToluWelcome] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFirstTask, setIsFirstTask] = useState(persisted.isFirstTask);
  const [typingAgent, setTypingAgent] = useState<AgentName | null>(null);

  // Mock user data - will come from API
  const userName = 'John Snow';
  const trackName = 'Data Analytics';

  const setPhase = useCallback((newPhase: OfficePhase) => {
    setPhaseState(newPhase);
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    persistState({ hasCompletedOnboarding: true, hasCompletedTour: false, userLevel: userLevel, isFirstTask });
    setPhaseState('tour');
  }, [userLevel, isFirstTask]);

  const completeTour = useCallback(() => {
    setHasCompletedTour(true);
    persistState({ hasCompletedOnboarding: true, hasCompletedTour: true, userLevel: userLevel, isFirstTask });
    setPhaseState('working');
  }, [userLevel, isFirstTask]);

  const addPortfolioItem = useCallback((item: UserPortfolio) => {
    setPortfolio(prev => [...prev, item]);
  }, []);

  // Helper to add message with typing indicator
  const addMessageWithTyping = useCallback(async (agent: AgentName, message: string, typingDuration: number = 2000) => {
    setTypingAgent(agent);
    await new Promise(r => setTimeout(r, typingDuration));
    setTypingAgent(null);
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${agent}-${Math.random()}`,
      agentName: agent,
      message,
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  }, []);

  // Generate task with team intro for first task
  const generateTask = useCallback(async () => {
    setIsGeneratingTask(true);
    setIsExpanded(true); // Auto-expand chat

    if (isFirstTask) {
      // First message from Tolu
      await addMessageWithTyping('Tolu', "Alright, let me patch in the team. These are the people who will determine if you get a recommendation letter or not.", 2500);

      await new Promise(r => setTimeout(r, 1000));

      // System messages for each agent joining - one by one
      const joinMessages = ['Emem', 'Sola', 'Coach Kemi'];
      for (const name of joinMessages) {
        await new Promise(r => setTimeout(r, 800));
        addChatMessage({
          id: `join-${Date.now()}-${name}`,
          agentName: null,
          message: `${name} joined the channel`,
          timestamp: new Date(),
          isSystemMessage: true,
        });
      }

      await new Promise(r => setTimeout(r, 1500));

      // Tolu introduces the intern
      await addMessageWithTyping('Tolu', `Team, this is the new intern, ${userName}. Assigned to the ${trackName} unit.`, 2000);

      await new Promise(r => setTimeout(r, 1200));

      // Kemi's messages
      await addMessageWithTyping('Kemi', `Hi ${userName}! I'm Kemi. I want to jump in first. I've seen your upload. I know it might feel intimidating if you're starting with no experience, or maybe you feel overqualified. Relax.`, 3500);

      await new Promise(r => setTimeout(r, 800));

      await addMessageWithTyping('Kemi', "My job is simple: I take whatever work you do here and I translate it into a portfolio that gets you hired. Even if you're starting from zero today, in 12 months, I will make sure you look like a pro on paper. You do the work, I'll build the career.", 4000);

      await new Promise(r => setTimeout(r, 1000));

      // Emem
      await addMessageWithTyping('Emem', `Thanks Kemi. ${userName}, welcome. I don't care about your background, I care about deadlines. We have client deliverables due Thursday. I'll send your first brief in 5 mins.`, 3000);

      await new Promise(r => setTimeout(r, 1200));

      // Sola
      await addMessageWithTyping('Sola', `Hi ${userName}. I'm Sola. I review all technical output. A heads up: I reject about 60% of first drafts. Don't take it personally, just fix it. Accuracy over speed, please.`, 3500);

      await new Promise(r => setTimeout(r, 1000));

      // Tolu signs off
      await addMessageWithTyping('Tolu', `${userName}, you have the floor. Any questions before I sign off?`, 2000);

      await new Promise(r => setTimeout(r, 2500));
    }

    // Generate the task message
    await addMessageWithTyping(
      'Emem',
      isFirstTask 
        ? "Here's your first task. Read the brief carefully. Deadline is non-negotiable."
        : "New task assigned. Check your desk.",
      2500
    );

    await new Promise(r => setTimeout(r, 1000));
    
    // TODO: POST to /api/tasks/generate
    const mockTask: Task = {
      id: Date.now().toString(),
      title: 'Data Cleansing: Lagos Tech Hub Sales',
      description: 'Here is a CSV file containing sales data for Lagos Tech Hub for Nov 2025. There are 3 anomalies in the Revenue column caused by a currency conversion error. Find them and calculate the real ROAS.',
      type: 'Data Analytics',
      deadline: 'Jan 5, 2026',
      status: 'pending',
      attachments: ['lagos_tech_hub_sales.csv'],
      clientConstraints: 'Must use Python. No external libraries except pandas.',
    };

    setTasks(prev => [...prev, mockTask]);
    
    await addMessageWithTyping('Emem', `Task: "${mockTask.title}"\nDeadline: ${mockTask.deadline}\n\nGet it done.`, 2000);

    if (isFirstTask) {
      setIsFirstTask(false);
      persistState({ hasCompletedOnboarding: true, hasCompletedTour: true, userLevel: userLevel, isFirstTask: false });
    }

    setIsGeneratingTask(false);
  }, [addChatMessage, addMessageWithTyping, isFirstTask, userName, trackName, userLevel]);

  // Submit bio/CV - now triggers the welcome popup
  const submitBio = useCallback(async (bio: string, file?: File) => {
    // TODO: POST to /api/onboarding/bio
    await new Promise(r => setTimeout(r, 500));
    setUserLevel('Level 1');
    setShowToluWelcome(true);
  }, []);

  // Submit work
  const submitWork = useCallback(async (taskId: string, file: File, notes: string) => {
    // TODO: POST to /api/tasks/{taskId}/submit
    updateTaskStatus(taskId, 'submitted');
    setIsExpanded(true);
    
    await addMessageWithTyping('Sola', "I've received your submission. Let me review it carefully...", 2000);
  }, [updateTaskStatus, addMessageWithTyping]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    // TODO: POST to /api/chat
    addChatMessage({
      id: Date.now().toString(),
      agentName: null,
      message,
      timestamp: new Date(),
    });

    let responder: AgentName = 'Sola';
    let response = "I'm reviewing your query. Please be more specific about what you need help with.";
    
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('help') || lowerMsg.includes('worried') || lowerMsg.includes('resume')) {
      responder = 'Kemi';
      response = "I can see you might be feeling a bit overwhelmed. That's completely normal! Remember, every expert was once a beginner. Let's break this down together.";
    } else if (lowerMsg.includes('deadline') || lowerMsg.includes('brief') || lowerMsg.includes('client')) {
      responder = 'Emem';
      response = "The deadline is firm. Check the task dashboard for details. I need the output, I don't have time to explain the basics.";
    } else if (lowerMsg.includes('salary') || lowerMsg.includes('contract') || lowerMsg.includes('hours')) {
      responder = 'Tolu';
      response = "All administrative matters are handled after you complete your probation period. Focus on the work for now.";
    }

    await addMessageWithTyping(responder, response, 2000);
  }, [addChatMessage, addMessageWithTyping]);

  return (
    <OfficeContext.Provider
      value={{
        phase,
        userLevel,
        currentTask,
        tasks,
        chatMessages,
        portfolio,
        tourStep,
        hasCompletedOnboarding,
        setPhase,
        setUserLevel,
        addChatMessage,
        setCurrentTask,
        updateTaskStatus,
        setTourStep,
        completeOnboarding,
        completeTour,
        addPortfolioItem,
        generateTask,
        isGeneratingTask,
        activeView,
        setActiveView,
        submitBio,
        submitWork,
        sendMessage,
        showToluWelcome,
        setShowToluWelcome,
        isExpanded,
        setIsExpanded,
        isFirstTask,
        userName,
        trackName,
        typingAgent,
      }}
    >
      {children}
    </OfficeContext.Provider>
  );
}

export function useOffice() {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error('useOffice must be used within OfficeProvider');
  }
  return context;
}