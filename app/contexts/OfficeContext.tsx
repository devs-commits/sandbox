"use client";
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { OfficeState, OfficePhase, ChatMessage, Task, UserLevel, AgentName, UserPortfolio } from "../components/students/office/types"
import { useAuth } from './AuthContexts';
import { supabase } from '../../lib/supabase';

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
  const { user } = useAuth();
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

  // Get user data from auth context
  const userName = user?.fullName || 'New Intern';
  const trackName = user?.track || 'General';
  const userId = user?.id || null;

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

  // Fetch tasks from Supabase when user is available
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user', userId)
          .order('id', { ascending: true });

        if (error) {
          console.error("Error fetching tasks:", error);
        } else if (data && data.length > 0) {
          // Map Supabase tasks to our Task type
          const mappedTasks: Task[] = data.map((t: any) => ({
            id: t.id.toString(),
            title: t.title,
            description: t.brief_content,
            type: t.task_track || trackName,
            deadline: 'In 2 days', // Could parse from ai_persona_config
            status: t.completed ? 'approved' : 'pending',
            attachments: [],
            clientConstraints: undefined,
          }));
          setTasks(mappedTasks);

          // If we have existing tasks, skip first task intro
          if (mappedTasks.length > 0 && isFirstTask) {
            setIsFirstTask(false);
            persistState({ hasCompletedOnboarding, hasCompletedTour, userLevel, isFirstTask: false });
          }
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, [userId, trackName, hasCompletedOnboarding, hasCompletedTour, userLevel, isFirstTask]);

  // Generate task with team intro for first task
  const generateTask = useCallback(async () => {
    setIsGeneratingTask(true);
    setIsExpanded(true); // Auto-expand chat

    if (isFirstTask) {
      // First task - full team introduction
      const introMessages: { agent: AgentName; message: string; delay: number }[] = [
        { agent: 'Tolu', message: "Alright, let me patch in the team. These are the people who will determine if you get a recommendation letter or not.", delay: 0 },
        { agent: 'Tolu', message: `Team, this is the new intern, ${userName}. Assigned to the ${trackName} unit.`, delay: 2000 },
        { agent: 'Kemi', message: `Hi ${userName}! I'm Kemi. I want to jump in first. I've seen your upload. I know it might feel intimidating if you're starting with no experience, or maybe you feel overqualified. Relax.`, delay: 4000 },
        { agent: 'Kemi', message: "My job is simple: I take whatever work you do here and I translate it into a portfolio that gets you hired. Even if you're starting from zero today, in 12 months, I will make sure you look like a pro on paper. You do the work, I'll build the career.", delay: 6000 },
        { agent: 'Emem', message: `Thanks Kemi. ${userName}, welcome. I don't care about your background, I care about deadlines. We have client deliverables due Thursday. I'll send your first brief in 5 mins.`, delay: 8500 },
        { agent: 'Sola', message: `Hi ${userName}. I'm Sola. I review all technical output. A heads up: I reject about 60% of first drafts. Don't take it personally, just fix it. Accuracy over speed, please.`, delay: 10500 },
        { agent: 'Tolu', message: `${userName}, you have the floor. Any questions before I sign off?`, delay: 12500 },
      ];

      // Add system message about team joining
      addChatMessage({
        id: Date.now().toString(),
        agentName: null,
        message: '📢 Emem, Sola, and Coach Kemi joined the channel',
        timestamp: new Date(),
        isTyping: false,
      });

      // Queue intro messages with delays
      for (const msg of introMessages) {
        await new Promise(r => setTimeout(r, msg.delay === 0 ? 500 : msg.delay - (introMessages[introMessages.indexOf(msg) - 1]?.delay || 0)));
        addChatMessage({
          id: `${Date.now()}-${msg.agent}`,
          agentName: msg.agent,
          message: msg.message,
          timestamp: new Date(),
        });
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    // Generate the task
    addChatMessage({
      id: Date.now().toString(),
      agentName: 'Emem',
      message: isFirstTask
        ? "Here's your first task. Read the brief carefully. Deadline is non-negotiable."
        : "New task assigned. Check your desk.",
      timestamp: new Date(),
    });

    try {
      // Call the real task generation API
      const response = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId, // From auth context
          track: trackName,
          experienceLevel: userLevel || 'Level 1',
          location: {
            city: 'Lagos', // TODO: Get from user profile
            country: 'Nigeria'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tasks && data.tasks.length > 0) {
          const generatedTask = data.tasks[0];
          const newTask: Task = {
            id: generatedTask.id?.toString() || Date.now().toString(),
            title: generatedTask.title,
            description: generatedTask.brief_content,
            type: trackName,
            deadline: 'In 2 days', // TODO: Calculate from ai_persona_config
            status: 'pending',
            attachments: generatedTask.attachments || [],
            clientConstraints: generatedTask.client_constraints,
          };

          setTasks(prev => [...prev, newTask]);

          addChatMessage({
            id: (Date.now() + 1).toString(),
            agentName: 'Emem',
            message: `Task: "${newTask.title}"\nDeadline: ${newTask.deadline}\n\nGet it done.`,
            timestamp: new Date(),
          });
        }
      } else {
        // Fallback to mock task if API fails
        const mockTask: Task = {
          id: Date.now().toString(),
          title: 'Data Cleansing: Lagos Tech Hub Sales',
          description: 'Find and fix 3 anomalies in the sales data. Calculate real ROAS.',
          type: 'Data Analytics',
          deadline: 'In 2 days',
          status: 'pending',
          attachments: ['sales_data.csv'],
          clientConstraints: 'Must use Python. No external libraries except pandas.',
        };
        setTasks(prev => [...prev, mockTask]);
        addChatMessage({
          id: (Date.now() + 1).toString(),
          agentName: 'Emem',
          message: `Task: "${mockTask.title}"\nDeadline: ${mockTask.deadline}\n\nGet it done.`,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Task generation failed:', error);
      // Fallback to mock
      const mockTask: Task = {
        id: Date.now().toString(),
        title: 'Offline Task Assignment',
        description: 'Connection issue. Please refresh.',
        type: 'General',
        deadline: 'TBD',
        status: 'pending',
        attachments: [],
      };
      setTasks(prev => [...prev, mockTask]);
    }

    if (isFirstTask) {
      setIsFirstTask(false);
      persistState({ hasCompletedOnboarding: true, hasCompletedTour: true, userLevel: userLevel, isFirstTask: false });
    }

    setIsGeneratingTask(false);
  }, [addChatMessage, isFirstTask, userName, trackName, userLevel]);

  // Submit bio/CV - calls AI backend for assessment
  const submitBio = useCallback(async (bio: string, file?: File) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    try {
      const response = await fetch(`${AI_BACKEND_URL}/assess-bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, // From auth context
          bio_text: bio,
          track: trackName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserLevel(data.assessed_level as UserLevel);
        // Store Tolu's response for the welcome popup
        addChatMessage({
          id: Date.now().toString(),
          agentName: 'Tolu',
          message: data.response_text,
          timestamp: new Date(),
        });
      } else {
        // Fallback if AI backend is down
        setUserLevel('Level 1');
      }
    } catch (error) {
      console.error('Bio assessment failed:', error);
      setUserLevel('Level 1');
    }

    setShowToluWelcome(true);
  }, [trackName, addChatMessage]);

  // Called when Tolu welcome popup is closed
  const handleToluWelcomeClose = useCallback(() => {
    setShowToluWelcome(false);
    completeOnboarding();
  }, [completeOnboarding]);

  // Submit work - calls AI backend for Sola's review
  const submitWork = useCallback(async (taskId: string, file: File, notes: string) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    updateTaskStatus(taskId, 'submitted');
    setIsExpanded(true);

    // Show initial "received" message
    addChatMessage({
      id: Date.now().toString(),
      agentName: 'Sola',
      message: "I've received your submission. Let me review it carefully...",
      timestamp: new Date(),
    });

    try {
      // Get the task details
      const task = tasks.find(t => t.id === taskId);

      // For now, we'll send the file name and notes as content
      // In production, you'd upload the file and extract content
      const response = await fetch(`${AI_BACKEND_URL}/review-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          task_id: taskId,
          file_url: file.name,
          file_content: notes || `[Submitted file: ${file.name}]`,
          task_title: task?.title || 'Unknown Task',
          task_brief: task?.description || '',
          chat_history: chatMessages.slice(-5).map(m => ({
            role: m.agentName ? 'assistant' : 'user',
            content: m.message
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Sola's review response
        addChatMessage({
          id: (Date.now() + 1).toString(),
          agentName: 'Sola',
          message: data.feedback,
          timestamp: new Date(),
        });

        if (data.passed) {
          updateTaskStatus(taskId, 'approved');

          // If passed, Kemi adds the portfolio bullet
          if (data.portfolio_bullet) {
            await new Promise(r => setTimeout(r, 2000));
            addChatMessage({
              id: (Date.now() + 2).toString(),
              agentName: 'Kemi',
              message: `Great work! I've added this to your portfolio:\n\n"${data.portfolio_bullet}"`,
              timestamp: new Date(),
            });

            // Add to portfolio
            addPortfolioItem({
              skillTag: task?.type || 'General',
              bulletPoint: data.portfolio_bullet,
              verifiedBy: 'Sola'
            });
          }
        } else {
          updateTaskStatus(taskId, 'rejected');
        }
      } else {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          agentName: 'Sola',
          message: "I'm having trouble processing your submission. Please try again.",
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Submission review failed:', error);
      addChatMessage({
        id: (Date.now() + 1).toString(),
        agentName: 'Sola',
        message: "Connection issue. Please check if the system is running and resubmit.",
        timestamp: new Date(),
      });
    }
  }, [updateTaskStatus, addChatMessage, tasks, chatMessages, addPortfolioItem]);

  // Send message - calls AI backend for agent routing
  const sendMessage = useCallback(async (message: string) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    // Add user message immediately
    addChatMessage({
      id: Date.now().toString(),
      agentName: null,
      message,
      timestamp: new Date(),
    });

    try {
      // Get the current task info for context
      const currentTaskInfo = tasks.find(t => t.status === 'pending' || t.status === 'in-progress');

      const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message,
          context: {
            task_id: currentTaskInfo?.id,
            is_submission: false,
            is_first_login: false,
            user_level: userLevel,
            track: trackName,
            task_brief: currentTaskInfo?.description,
            deadline: currentTaskInfo?.deadline
          },
          chat_history: chatMessages.slice(-10).map(m => ({
            role: m.agentName ? 'assistant' : 'user',
            content: m.message
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        addChatMessage({
          id: (Date.now() + 1).toString(),
          agentName: data.agent as AgentName,
          message: data.message,
          timestamp: new Date(),
        });
      } else {
        // Fallback to local routing if AI backend is down
        let responder: AgentName = 'Sola';
        let fallbackResponse = "I'm having trouble connecting. Please try again.";

        addChatMessage({
          id: (Date.now() + 1).toString(),
          agentName: responder,
          message: fallbackResponse,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Chat failed:', error);
      addChatMessage({
        id: (Date.now() + 1).toString(),
        agentName: 'Sola',
        message: "Connection issue. Please check if the AI backend is running.",
        timestamp: new Date(),
      });
    }
  }, [addChatMessage, tasks, userLevel, trackName, chatMessages]);

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