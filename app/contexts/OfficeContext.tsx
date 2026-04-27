import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OfficeState, OfficePhase, ChatMessage, Task, UserLevel, AgentName, UserPortfolio, PerformanceMetrics, Bounty, ArchiveItem } from "../components/students/office/types"
import { useAuth } from './AuthContexts';
import { supabase } from '../../lib/supabase';

interface PersistedState {
  hasCompletedOnboarding: boolean;
  hasCompletedTour: boolean;
  userLevel: UserLevel | null;
  isFirstTask: boolean;
}

interface OfficeContextType extends OfficeState {
  subscription: { daysLeft: number; status: string; expiresAt: string | null } | null;
  // --- ADDED: activateSubscription interface ---
  activateSubscription: (planType: string) => Promise<void>; 
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
  isLoadingTasks: boolean;
  isLoadingOnboarding: boolean;
  activeView: 'desk' | 'meeting' | 'archives' | 'bounty';
  setActiveView: (view: 'desk' | 'meeting' | 'archives' | 'bounty') => void;
  submitBio: (bio: string, file?: File) => Promise<void>;
  submitWork: (taskId: string, file: File, notes: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendInterviewMessage: (message: string, interviewType: string, interviewHistory?: Array<{role: string, content: string}>) => Promise<{agent: AgentName, message: string}>;
  sendSalaryNegotiationMessage: (message: string, negotiationHistory?: Array<{role: string, content: string}>) => Promise<{agent: AgentName, message: string}>;
  showToluWelcome: boolean;
  setShowToluWelcome: (show: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isFirstTask: boolean;
  userName: string;
  trackName: string;
  typingAgent: AgentName | null;
  acceptBounty: (bounty: Bounty) => Promise<void>;
}

const OfficeContext = createContext<OfficeContextType | null>(null);

const defaultState: PersistedState = {
  hasCompletedOnboarding: false,
  hasCompletedTour: false,
  userLevel: null,
  isFirstTask: true
};

export function OfficeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [phase, setPhaseState] = useState<OfficePhase>('lobby');
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]); 
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasRestoredChat, setHasRestoredChat] = useState(false);
  const [portfolio, setPortfolio] = useState<UserPortfolio[]>([]);
  const [tourStep, setTourStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const [activeView, setActiveView] = useState<'desk' | 'meeting' | 'archives' | 'bounty'>('desk');
  const [showToluWelcome, setShowToluWelcome] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFirstTask, setIsFirstTask] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  const [subscription, setSubscription] = useState<{ daysLeft: number; status: string; expiresAt: string | null } | null>(null);

  const userName = user?.fullName || 'New Intern';
  const trackName = user?.track || 'General';
  const userId = user?.id || null;
  
  const mapResources = (resources?: string): ArchiveItem[] => {
  if (!resources || typeof resources !== 'string') return [];

  return resources
    .split(',')
    .map((r, i) => ({
      id: `res-${i}`,
      title: `Learning Resource ${i + 1}`,
      url: r.trim(),
      type: r.includes("youtube") ? "video" : "web",
      category: r.includes("youtube")
        ? "Video Resources"
        : "Reference Links",
      description: "Supporting material for this task",
    }));
};
const getDailyChatKey = () => {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];
  return `office-chat-${userId}-${today}`;
};

useEffect(() => {
  if (typeof window === 'undefined') return;

  const key = getDailyChatKey();
  if (!key) return;

  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);

      const restored = parsed.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));

      setChatMessages(restored);
    } catch (err) {
      console.error("Failed to restore chat history:", err);
    }
  }

  setHasRestoredChat(true);
}, [userId]);

useEffect(() => {
  if (typeof window === 'undefined') return;
  if (!hasRestoredChat) return;

  const key = getDailyChatKey();
  if (!key) return;

  localStorage.setItem(key, JSON.stringify(chatMessages));
}, [chatMessages, hasRestoredChat]);


  useEffect(() => {
    const fetchBounties = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('bounties')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching bounties:", error);
        } else if (data) {
          const mappedBounties: Bounty[] = data.map((b: any) => ({
            ...b,
            instructions: typeof b.instructions === 'string' ? JSON.parse(b.instructions) : b.instructions,
            deliverables: typeof b.deliverables === 'string' ? JSON.parse(b.deliverables) : b.deliverables,
          }));
          setBounties(mappedBounties);
        }
      } catch (error) {
        console.error("Error fetching bounties:", error);
      }
    };

    fetchBounties();
  }, [userId]);

  useEffect(() => {
    const fetchOnboardingState = async () => {
      if (!userId) {
        setIsLoadingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('has_completed_onboarding, has_completed_tour, user_level, experience_level, is_first_task, subscription_status, subscription_expires_at')
          .eq('auth_id', userId)
          .single();

        if (error) {
          console.error('Error fetching onboarding state:', error);
          if (error.code === 'PGRST116') {
            console.log('User not found in public table for auth_id:', userId);
            window.location.href = '/login';
            return;
          }
        } else if (data) {
          let days = 0;
          if (data.subscription_expires_at) {
            const expiryDate = new Date(data.subscription_expires_at);
            const today = new Date();
            const diffTime = expiryDate.getTime() - today.getTime();
            days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          }

          setSubscription({
            daysLeft: days,
            status: data.subscription_status || 'inactive',
            expiresAt: data.subscription_expires_at
          });

          setHasCompletedOnboarding(data.has_completed_onboarding || false);
          setHasCompletedTour(data.has_completed_tour || false);
          setUserLevel(data.experience_level || data.user_level || null);
          setIsFirstTask(data.is_first_task !== false);

          if (data.has_completed_onboarding && data.has_completed_tour) {
            setPhaseState('working');
          } else if (data.has_completed_onboarding) {
            setPhaseState('tour');
          } else {
            setPhaseState('lobby');
          }
        } else {
          console.log('No user data found for auth_id:', userId);
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        console.error('Error fetching onboarding state:', error);
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    const fetchPerformanceMetrics = async () => {
      if (!userId) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('performance_reports')
          .select('*')
          .eq('user_id', userId)
          .order('assessment_date', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { 
            console.error('Error fetching performance metrics:', error);
          }
        } else if (data) {
          setPerformanceMetrics({
            technicalAccuracy: data.technical_accuracy || 0,
            deliverySpeed: data.reliability_speed || 0,
            communication: data.communication_score || 0,
            overallRating: data.current_level || 'Junior Intern',
          });
        }
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      }
    };

    fetchOnboardingState();
    fetchPerformanceMetrics();
  }, [userId]);

  const persistState = useCallback(async (state: Partial<PersistedState>) => {
    if (!userId) {
      console.warn('persistState: No userId available, skipping update');
      return;
    }

    try {
      const updateData: Record<string, any> = {};
      if (state.hasCompletedOnboarding !== undefined) updateData.has_completed_onboarding = state.hasCompletedOnboarding;
      if (state.hasCompletedTour !== undefined) updateData.has_completed_tour = state.hasCompletedTour;
      if (state.userLevel !== undefined) updateData.user_level = state.userLevel;
      if (state.isFirstTask !== undefined) updateData.is_first_task = state.isFirstTask;

      console.log('persistState: Updating user', userId, 'with data:', updateData);

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('auth_id', userId)
        .select();

      if (error) {
        console.error('persistState: Supabase error:', error);
      } else {
        console.log('persistState: Update successful, returned:', data);
      }
    } catch (error) {
      console.error('persistState: Exception:', error);
    }
  }, [userId]);

  // --- ADDED: Dynamic Activation Function ---
  const activateSubscription = useCallback(async (planType: string) => {
    if (!userId) return;

    const daysToAdd = planType === 'quarterly' ? 90 : 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_plan: planType,
          subscription_expires_at: expiryDate.toISOString(),
          last_payment_date: new Date().toISOString()
        })
        .eq('auth_id', userId);

      if (!error) {
        setSubscription({
          daysLeft: daysToAdd,
          status: 'active',
          expiresAt: expiryDate.toISOString()
        });
      }
    } catch (err) {
      console.error("Activation Error:", err);
    }
  }, [userId]);

  const setPhase = useCallback((newPhase: OfficePhase) => {
    setPhaseState(newPhase);
  }, []);

  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    try {
      const isCompleted = status === 'approved';
      await supabase
        .from('tasks')
        .update({ completed: isCompleted })
        .eq('id', parseInt(taskId));
    } catch (error) {
      console.error('Error updating task status in database:', error);
    }
  }, []);

  const acceptBounty = useCallback(async (bounty: Bounty) => {
    if (!userId) return;

    try {
      const { data: submission, error: subError } = await supabase
        .from('bounty_submissions')
        .insert({
          bounty_id: bounty.id,
          user_id: userId,
          status: 'pending' 
        })
        .select()
        .single();

      if (subError) throw subError;

      const newTaskData = {
        user: userId,
        title: bounty.title,
        brief_content: bounty.description,
        task_track: bounty.type || 'General',
        difficulty: 'Bounty',
        completed: false,
        resources: [], 
      };

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert(newTaskData)
        .select()
        .single();

      if (taskError) throw taskError;

        const newTask: Task = {
          id: taskData.id.toString(),
          title: taskData.title,
          description: taskData.brief_content,
          type: taskData.task_track || trackName,
          deadline: 'Flexible',
          status: 'pending',
          attachments: [],
          clientConstraints: undefined,
          resources: taskData.resources || [],
        };

      setTasks(prev => [newTask, ...prev]);
      setCurrentTask(newTask);
      setActiveView('desk'); 

      addChatMessage({
        id: Date.now().toString(),
        agentName: 'Emem',
        message: `You've accepted the bounty "${bounty.title}". It's on your desk. Get started.`,
        timestamp: new Date()
      });

    } catch (error) {
      console.error("Error accepting bounty:", error);
    }
  }, [userId, addChatMessage]);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    persistState({ hasCompletedOnboarding: true, hasCompletedTour: false });
    setPhaseState('tour');
  }, [persistState]);

  const [shouldTriggerTeamIntro, setShouldTriggerTeamIntro] = useState(false);

  const completeTour = useCallback(() => {
    setHasCompletedTour(true);
    persistState({ hasCompletedTour: true });
    setPhaseState('working');
    setShouldTriggerTeamIntro(true);
  }, [persistState]);

  const addPortfolioItem = useCallback((item: UserPortfolio) => {
    setPortfolio(prev => [...prev, item]);
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) {
        setIsLoadingTasks(false);
        return;
      }

      setIsLoadingTasks(true);
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user', userId)
          .order('id', { ascending: true });

        if (error) {
          console.error("Error fetching tasks:", error);
        } else if (data && data.length > 0) {
          const mappedTasks: Task[] = data.map((t: any) => ({
            id: t.id.toString(),
            title: t.title,
            description: t.brief_content,
            type: t.task_track || trackName,
            deadline: t.ai_persona_config?.deadline_display || 'Flexible',
            status: t.completed ? 'approved' : 'pending',
            attachments: [],
            clientConstraints: undefined,
            resources: t.resources || [],
            difficulty: t.difficulty,
          }));
          setTasks(mappedTasks);
          
          console.log("--------------------All is sent MWUAHAHAHAHAHAHHAH--------------------", tasks)

          const activeTask = mappedTasks.find(t => t.status === 'pending') || mappedTasks[mappedTasks.length - 1];
          if (activeTask) {
            setCurrentTask(activeTask);
          }

          if (mappedTasks.length > 0 && isFirstTask) {
            setIsFirstTask(false);
            persistState({ isFirstTask: false });
          }
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [userId, trackName, isFirstTask, persistState]);

  useEffect(() => {
    if (!currentTask && tasks.length > 0) {
      const activeTask = tasks.find(t => t.status === 'pending') || tasks[tasks.length - 1];
      if (activeTask) {
        console.log("Auto-selecting current task:", activeTask.id);
        setCurrentTask(activeTask);
      }
    }
  }, [tasks, currentTask]);

  const generateTask = useCallback(async () => {
    setIsGeneratingTask(true);
    setIsExpanded(true); 
    setMessageCount(0); 

    if (isFirstTask) {
      const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

      await new Promise(r => setTimeout(r, 1000));

      try {
        const response = await fetch(`${AI_BACKEND_URL}/onboarding-intro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            user_name: userName,
            track: trackName,
            user_level: userLevel,
            bio_summary: null 
          })
        });

        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || [];

          let lastDelay = 0;
          for (const msg of messages) {
            const typingDelay = msg.typing_delay_ms - lastDelay;

            const typingId = `typing-${Date.now()}`;
            addChatMessage({
              id: typingId,
              agentName: msg.agent as AgentName,
              message: '',
              timestamp: new Date(),
              isTyping: true,
            });

            await new Promise(r => setTimeout(r, Math.min(typingDelay, 5000)));

            setChatMessages(prev => prev.filter(m => m.id !== typingId));
            addChatMessage({
              id: `${Date.now()}-${msg.agent}`,
              agentName: msg.agent as AgentName,
              message: msg.message,
              timestamp: new Date(),
            });

            await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
            lastDelay = msg.typing_delay_ms;
          }
        } else {
          throw new Error('AI response not ok');
        }
      } catch (error) {
        console.error('Onboarding intro failed, using fallback:', error);
        const fallbackMessages: { agent: AgentName; message: string; delay: number }[] = [
          { agent: 'Tolu', message: "Alright, let me patch in the team. These are the people who will determine if you get a recommendation letter or not.", delay: 12000 },
          { agent: 'Tolu', message: `Team, this is the new intern, ${userName}. Assigned to the ${trackName} unit.`, delay: 12000 },
          { agent: 'Kemi', message: `Hi ${userName}! I'm Kemi, your career coach. I'll be translating your work here into a portfolio that gets you hired.`, delay: 18000 },
          { agent: 'Kemi', message: "You do the work, I'll build the career. Even starting from zero, in 12 months, you'll look like a pro on paper.", delay: 16000 },
          { agent: 'Emem', message: `Welcome ${userName}. I don't care about your background, I care about deadlines. Your first brief is coming in few minutes.`, delay: 14000 },
          { agent: 'Sola', message: `Hi ${userName}. I'm Sola. I review all technical output. I reject about 60% of first drafts. Don't take it personally.`, delay: 12000 },
        ];

        for (const msg of fallbackMessages) {
          const typingId = `typing-${Date.now()}`;
          addChatMessage({
            id: typingId,
            agentName: msg.agent,
            message: '',
            timestamp: new Date(),
            isTyping: true,
          });

          await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

          setChatMessages(prev => prev.filter(m => m.id !== typingId));
          addChatMessage({
            id: `${Date.now()}-${msg.agent}`,
            agentName: msg.agent,
            message: msg.message,
            timestamp: new Date(),
          });

          await new Promise(r => setTimeout(r, 400));
        }
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    addChatMessage({
      id: Date.now().toString(),
      agentName: 'Emem',
      message: isFirstTask
        ? "Here's your first task. Read the brief carefully. Deadline is non‑negotiable."
        : "New task assigned. Check your desk.",
      timestamp: new Date(),  
    });

    try {
      const response = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_name: user?.fullName,
          track: trackName,
          deadline_display: "", 
          experience_level: "",
          difficulty: "intermediate",
          task_number: 1,
          user_city: "Lagos",
          include_ethical_trap: false,
          model: "",
          include_video_brief: true
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
            deadline: generatedTask.deadline, 
            status: 'pending',
            attachments: generatedTask.attachments || [],
            clientConstraints: generatedTask.client_constraints,
            resources: mapResources(generatedTask.resources)
          };

          setTasks(prev => [...prev, newTask]);

          const formattedResources =
            newTask.resources && newTask.resources.length > 0
              ? newTask.resources
                  .map((res: any, index: number) => `${index + 1}. ${res.link}`)
                  .join('\n')
              : 'No resources provided.';

          addChatMessage({
            id: (Date.now() + 1).toString(),
            agentName: 'Emem',
            message: `Task: "${newTask.title}"
            Deadline: ${newTask.deadline}
            Ensure to submit on or before the deadine elapses.
            There are some reference materials that could assist you during this task, they are given below your task brief in desk.`,
              timestamp: new Date(),
          });

        }
      } else {
        const fallbackTaskData = {
          user: userId,
          title: 'Data Cleansing: Lagos Tech Hub Sales',
          brief_content: 'Find and fix 3 anomalies in the sales data. Calculate real ROAS.',
          task_track: trackName || 'General',
          difficulty: 'intermediate',
          completed: false,
          resources: [],
        };

        let fallbackId = Date.now().toString();
        try {
          if (userId) {
            const { data: inserted, error: insertError } = await supabase
              .from('tasks')
              .insert(fallbackTaskData)
              .select('id')
              .single();

            if (!insertError && inserted?.id) {
              fallbackId = inserted.id.toString();
            }
          }
        } catch (persistErr) {
          console.error('Failed to persist fallback task:', persistErr);
        }

        const mockTask: Task = {
          id: fallbackId,
          title: fallbackTaskData.title,
          description: fallbackTaskData.brief_content,
          type: fallbackTaskData.task_track,
          deadline: 'Due in 24 hrs',
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

      const fallbackTaskData = {
        user: userId,
        title: 'Offline Task Assignment',
        brief_content: 'Connection issue. Please refresh.',
        task_track: trackName || 'General',
        difficulty: 'intermediate',
        completed: false,
        resources: [],
      };

      let fallbackId = Date.now().toString();
      try {
        if (userId) {
          const { data: inserted, error: insertError } = await supabase
            .from('tasks')
            .insert(fallbackTaskData)
            .select('id')
            .single();

          if (!insertError && inserted?.id) {
            fallbackId = inserted.id.toString();
          }
        }
      } catch (persistErr) {
        console.error('Failed to persist fallback task:', persistErr);
      }

      const mockTask: Task = {
        id: fallbackId,
        title: fallbackTaskData.title,
        description: fallbackTaskData.brief_content,
        type: fallbackTaskData.task_track,
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
  }, [addChatMessage, isFirstTask, userName, trackName, userLevel, userId, persistState, setChatMessages]);

  useEffect(() => {
    if (shouldTriggerTeamIntro && !isGeneratingTask && tasks.length === 0) {
      setShouldTriggerTeamIntro(false);
      setIsExpanded(true); 
      generateTask();
    }
  }, [shouldTriggerTeamIntro, isGeneratingTask, tasks.length]);

  const submitBio = useCallback(async (bio: string, file?: File) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';
    let cvUrl: string | null = null;

    if (file && userId) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cv-uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('CV upload error:', uploadError);
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('cv-uploads')
            .getPublicUrl(uploadData.path);
          cvUrl = urlData?.publicUrl || null;
          console.log('CV uploaded to:', cvUrl);

          const { error: updateError } = await supabase
            .from('users')
            .update({ cv_url: cvUrl })
            .eq('auth_id', userId);

          if (updateError) {
            console.error('Error saving CV URL to user:', updateError);
          }
        }
      } catch (uploadErr) {
        console.error('CV upload exception:', uploadErr);
      }
    }

    try {
      const response = await fetch(`${AI_BACKEND_URL}/assess-bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, 
          bio_text: bio,
          track: trackName,
          cv_url: cvUrl 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserLevel(data.assessed_level as UserLevel);
        persistState({ userLevel: data.assessed_level });
        addChatMessage({
          id: Date.now().toString(),
          agentName: 'Tolu',
          message: data.response_text,
          timestamp: new Date(),
        });
      } else {
        setUserLevel('Level 1');
      }
    } catch (error) {
      console.error('Bio assessment failed:', error);
      setUserLevel('Level 1');
    }

    setShowToluWelcome(true);
  }, [trackName, addChatMessage, userId, persistState]);

  const handleToluWelcomeClose = useCallback(() => {
    setShowToluWelcome(false);
    completeOnboarding();
  }, [completeOnboarding]);

  const submitWork = useCallback(async (taskId: string, file: File, notes: string) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    updateTaskStatus(taskId, 'submitted');
    setIsExpanded(true);

    addChatMessage({
      id: Date.now().toString(),
      agentName: 'Sola',
      message: "I've received your submission. Let me review it carefully...",
      timestamp: new Date(),
    });

    try {
      let fileUrl: string | null = null;
      if (file && userId) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}/tasks/${taskId}/${Date.now()}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('submissions') 
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Submission upload error:', uploadError);
          } else if (uploadData) {
            const { data: urlData } = supabase.storage
              .from('submissions')
              .getPublicUrl(uploadData.path);
            fileUrl = urlData.publicUrl;
          }
        } catch (err) {
          console.error('Submission upload exception:', err);
        }
      }

      const task = tasks.find(t => t.id === taskId);

      const response = await fetch(`${AI_BACKEND_URL}/review-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          task_id: taskId,
          file_url: fileUrl || file.name, 
          file_content: notes,
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

        addChatMessage({
          id: (Date.now() + 1).toString(),
          agentName: 'Sola',
          message: data.feedback,
          timestamp: new Date(),
        });

        if (data.passed) {
          updateTaskStatus(taskId, 'approved');

          if (data.technical_accuracy !== undefined) {
            const newMetrics = {
              technicalAccuracy: data.technical_accuracy,
              deliverySpeed: data.reliability_speed,
              communication: data.communication_score,
              overallRating: userLevel || 'Level 1'
            };
            setPerformanceMetrics(newMetrics); 

            try {
              await supabase.from('performance_reports').insert({
                user_id: userId,
                technical_accuracy: data.technical_accuracy,
                reliability_speed: data.reliability_speed,
                communication_score: data.communication_score,
                current_level: userLevel || 'Level 1',
                assessment_date: new Date().toISOString()
              });
            } catch (err) {
              console.error('Error saving performance report:', err);
            }
          }

          if (data.portfolio_bullet) {
            await new Promise(r => setTimeout(r, 2000));
            addChatMessage({
              id: (Date.now() + 2).toString(),
              agentName: 'Kemi',
              message: `Great work! I've added this to your portfolio:\n\n"${data.portfolio_bullet}"`,
              timestamp: new Date(),
            });

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

  const sendMessage = useCallback(async (message: string) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    if (messageCount >= 5) {
      addChatMessage({
        id: Date.now().toString(),
        agentName: null, 
        message: "SYSTEM: You have reached the question limit (5) for this task. Please submit your work to proceed.",
        timestamp: new Date(),
      });
      return;
    }

    setMessageCount(prev => prev + 1);

    addChatMessage({
      id: Date.now().toString(),
      agentName: null,
      message,
      timestamp: new Date(),
    });

    try {
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
  }, [addChatMessage, tasks, userLevel, trackName, chatMessages, messageCount]);

  const sendInterviewMessage = useCallback(async (message: string, interviewType: string, interviewHistory: Array<{role: string, content: string}> = []) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    try {
      const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message,
          context: {
            is_mock_interview: true,
            interview_type: interviewType,
            user_level: userLevel,
            track: trackName,
            is_submission: false,
            is_first_login: false
          },
          chat_history: interviewHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          agent: 'Kemi' as AgentName,
          message: data.message
        };
      } else {
        return {
          agent: 'Kemi' as AgentName,
          message: "I'm having trouble connecting to the interview system. Please try again."
        };
      }
    } catch (error) {
      console.error('Interview message failed:', error);
      return {
        agent: 'Kemi' as AgentName,
        message: "Connection issue. Please check if the AI backend is running."
      };
    }
  }, [userId, userLevel, trackName]);

  const sendSalaryNegotiationMessage = useCallback(async (message: string, negotiationHistory: Array<{role: string, content: string}> = []) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    try {
      const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message,
          context: {
            is_salary_negotiation: true,
            user_level: userLevel,
            track: trackName,
            is_submission: false,
            is_first_login: false
          },
          chat_history: negotiationHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          agent: 'Tolu' as AgentName,
          message: data.message
        };
      } else {
        return {
          agent: 'Tolu' as AgentName,
          message: "I'm having trouble connecting to the negotiation system. Please try again."
        };
      }
    } catch (error) {
      console.error('Salary negotiation message failed:', error);
      return {
        agent: 'Tolu' as AgentName,
        message: "Connection issue. Please check if the AI backend is running."
      };
    }
  }, [userId, userLevel, trackName]);

  return (
    <OfficeContext.Provider
      value={{
        phase,
        userLevel,
        currentTask,
        tasks,
        subscription, 
        // --- ADDED: Expose activateSubscription ---
        activateSubscription, 
        bounties, 
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
        isLoadingTasks,
        isLoadingOnboarding,

        activeView,
        setActiveView,
        submitBio,
        submitWork,
        sendMessage,
        sendInterviewMessage,
        sendSalaryNegotiationMessage,
        showToluWelcome,
        performanceMetrics,
        setShowToluWelcome,
        isExpanded,
        setIsExpanded,
        isFirstTask,
        userName,
        trackName,
        typingAgent: null,
        acceptBounty, 
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