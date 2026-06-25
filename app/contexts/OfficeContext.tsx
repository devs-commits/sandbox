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
  generationStatusText: string; 
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
  isBioProcessing: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isFirstTask: boolean;
  userName: string;
  trackName: string;
  typingAgent: AgentName | null;
  acceptBounty: (bounty: Bounty) => Promise<void>;
  
  currentWeek: number;
  currentIdentity: string;
  weekStatus: 'in_progress' | 'passed_waiting';
  nextUnlockDate: string | null;
  unlockedBadges: Array<{ badge_name: string; earned_in_week: number; unlocked_at: string }>;
}

const OfficeContext = createContext<OfficeContextType | null>(null);

export function OfficeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter(); 

  const [phase, setPhaseState] = useState<OfficePhase>('lobby');
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]); 
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasRestoredChat, setHasRestoredChat] = useState(false);
  const [restoredUserId, setRestoredUserId] = useState<string | null>(null); 
  const [portfolio, setPortfolio] = useState<UserPortfolio[]>([]);
  const [tourStep, setTourStep] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [generationStatusText, setGenerationStatusText] = useState("Fetch Missing Task");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  
  const [activeView, setActiveView] = useState<'desk' | 'meeting' | 'archives' | 'bounty'>('desk');
  const [showToluWelcome, setShowToluWelcome] = useState(false);
  const [isBioProcessing, setIsBioProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFirstTask, setIsFirstTask] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  const [subscription, setSubscription] = useState<{ daysLeft: number; status: string; expiresAt: string | null } | null>(null);
  const [shouldTriggerTeamIntro, setShouldTriggerTeamIntro] = useState(false);

  const userName = user?.fullName || 'New Intern';
  const userId = user?.id || null;
  
  const [trackName, setTrackName] = useState<string>('General');

  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [currentIdentity, setCurrentIdentity] = useState<string>('Intern');
  const [weekStatus, setWeekStatus] = useState<'in_progress' | 'passed_waiting'>('in_progress');
  const [nextUnlockDate, setNextUnlockDate] = useState<string | null>(null);
  const [unlockedBadges, setUnlockedBadges] = useState<any[]>([]);

  // ==========================================
  // GLOBALLY SCOPED FUNCTIONS
  // ==========================================
  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  const mapResources = useCallback((resources?: any): ArchiveItem[] => {
    if (!resources) return [];

    let parsedResources = resources;

    if (typeof resources === 'string') {
      try {
        parsedResources = JSON.parse(resources);
      } catch (e) {
        return resources.split(',').filter(r => r.trim().length > 0).map((r, i) => ({
          id: `res-str-${i}`,
          title: `Learning Resource ${i + 1}`,
          url: r.trim(),
          type: r.includes("youtube") || r.includes("youtu.be") ? "video" : "web",
          category: "Reference Links",
          description: "Supporting material",
        }));
      }
    }

    if (Array.isArray(parsedResources)) {
      return parsedResources.map((r, i) => {
        const normalizedUrl = r.url || r.link || '';
        return {
          id: r.id || `res-${i}`,
          title: r.title || `Learning Resource ${i + 1}`,
          url: normalizedUrl,
          type: r.type ? r.type : (normalizedUrl.includes("youtube") || normalizedUrl.includes("youtu.be") ? "video" : "web"),
          category: r.category || "Reference Links",
          description: r.description || "Supporting material",
        };
      });
    }

    return [];
  }, []);

  // ==========================================
  // CHAT PERSISTENCE & GHOST CLEANUP
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!userId) {
      setChatMessages([]);
      setHasRestoredChat(false);
      setRestoredUserId(null);
      return;
    }

    const key = `office-chat-${userId}-${new Date().toISOString().split('T')[0]}`;
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
    } else {
        setChatMessages([]);
    }

    setHasRestoredChat(true);
    setRestoredUserId(userId);
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !hasRestoredChat || !userId || userId !== restoredUserId) return;
    const key = `office-chat-${userId}-${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(key, JSON.stringify(chatMessages));
  }, [chatMessages, hasRestoredChat, userId, restoredUserId]);


  // ==========================================
  // DATA FETCHING
  // ==========================================
  useEffect(() => {
    const fetchGamificationData = async () => {
      if (!userId) return;

      try {
        const { data: progData, error: progError } = await supabase
          .from('user_progression')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(); 

        if (!progError && progData) {
          setCurrentWeek(progData.current_week);
          setCurrentIdentity(progData.current_identity);
          setWeekStatus(progData.week_status);
          setNextUnlockDate(progData.next_unlock_date);
        }

        const { data: badgeData, error: badgeError } = await supabase
          .from('user_badges')
          .select('*')
          .eq('user_id', userId)
          .order('unlocked_at', { ascending: false });

        if (!badgeError && badgeData) {
          setUnlockedBadges(badgeData);
        }
      } catch (err) {
        console.error("Error fetching gamification data:", err);
      }
    };
    fetchGamificationData();
  }, [userId]);

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

  // 🔥 CORE FIX: Extracted fetchTasks so we can trigger it manually!
  const fetchTasks = useCallback(async () => {
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
      } else if (data) {
        const mappedTasks: Task[] = data.map((t: any) => ({
          id: t.id.toString(),
          title: t.title,
          description: t.brief_content,
          type: t.task_track || trackName,
          deadline: t.ai_persona_config?.deadline_display || t.deadline_display || t.deadline || 'Flexible',
          created_at: t.created_at,
          file_url: t.file_url,
          status: t.completed ? 'approved' : t.status || 'pending',
          attachments: t.attachments || [],
          clientConstraints: t.client_constraints || undefined,
          resources: mapResources(t.resources),
          difficulty: t.difficulty,
          week: t.task_number || t.week 
        }));

        setTasks(mappedTasks);
        if (mappedTasks.length > 0) {
          const activeTask = mappedTasks.find(t => t.status !== 'approved' && (t.status as string) !== 'passed') || mappedTasks[mappedTasks.length - 1];
          if (activeTask) setCurrentTask(activeTask);
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [userId, trackName, mapResources]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ==========================================
  // REALTIME TASK LISTENER (SUPABASE)
  // ==========================================
  useEffect(() => {
    if (!userId) return;

    const taskSubscription = supabase
      .channel('realtime-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const t = payload.new;
            const newTask: Task = {
              id: t.id.toString(),
              title: t.title,
              description: t.brief_content,
              type: t.task_track || trackName,
              deadline: t.ai_persona_config?.deadline_display || t.deadline_display || t.deadline || 'Flexible',
              created_at: t.created_at,
              status: t.completed ? 'approved' : t.status || 'pending',
              attachments: t.attachments || [],
              clientConstraints: t.client_constraints || undefined,
              resources: mapResources(t.resources),
              difficulty: t.difficulty,
              week: t.task_number || t.week 
            };

            setTasks(prev => {
              if (prev.some(task => task.id === newTask.id)) return prev;
              return [...prev, newTask];
            });
            setCurrentTask(newTask);

            // Successfully received via Realtime
            setIsGeneratingTask(false);
            setGenerationStatusText("Fetch Missing Task");

            addChatMessage({
              id: Date.now().toString(),
              agentName: 'Emem',
              message: `Task: "${newTask.title}"\nDeadline: ${newTask.deadline}\nCheck your desk. The resources have been prepared for you.`,
              timestamp: new Date()
            });

          } else if (payload.eventType === 'UPDATE') {
            setTasks(prevTasks => prevTasks.map(task => {
              if (task.id === payload.new.id.toString()) {
                return {
                  ...task,
                  resources: mapResources(payload.new.resources), 
                  completed: payload.new.completed,
                  status: payload.new.completed ? 'approved' : task.status
                };
              }
              return task;
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskSubscription);
    };
  }, [userId, mapResources, trackName, addChatMessage]);

  useEffect(() => {
    if (!currentTask && tasks.length > 0) {
      const activeTask = tasks.find(t => t.status !== 'approved' && (t.status as string) !== 'passed') || tasks[tasks.length - 1];
      if (activeTask) {
        setCurrentTask(activeTask);
      }
    }
  }, [tasks, currentTask]);

  useEffect(() => {
    const fetchOnboardingState = async () => {
      if (!userId) {
        setIsLoadingOnboarding(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('has_completed_onboarding, has_completed_tour, user_level, experience_level, is_first_task, subscription_status, subscription_expires_at, track')
          .eq('auth_id', userId)
          .maybeSingle(); 

        if (error) {
          console.error('Error fetching onboarding state:', error);
          if (error.code === 'PGRST116') {
            router.push('/login'); 
            return;
          }
        } else if (data) {
          const databaseTrack = data.track || 'General';
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
          setTrackName(databaseTrack);

          if (data.has_completed_onboarding && data.has_completed_tour) {
            setPhaseState('working');
          } else if (data.has_completed_onboarding) {
            setPhaseState('tour');
          } else {
            setPhaseState('lobby');
          }
        }
      } catch (error) {
        console.error('Error fetching onboarding state:', error);
      } finally {
        setIsLoadingOnboarding(false);
      }
    };

    const fetchPerformanceMetrics = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('performance_reports')
          .select('*')
          .eq('user_id', userId)
          .order('assessment_date', { ascending: false })
          .limit(1)
          .maybeSingle(); 

        if (error) {
          if (error.code !== 'PGRST116') console.error('Error fetching performance metrics:', error);
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

    const fetchPortfolio = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
        
        if (data) {
          const mappedPortfolio: UserPortfolio[] = data.map((item: any) => ({
            skillTag: item.skill_tag || item.task_track || 'General',
            bulletPoint: item.bullet_point || item.description,
            verifiedBy: item.verified_by || 'Sola'
          }));
          setPortfolio(mappedPortfolio);
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
      }
    };

    fetchOnboardingState();
    fetchPerformanceMetrics();
    fetchPortfolio(); 
  }, [userId, router]);

  const persistState = useCallback(async (state: Partial<PersistedState>) => {
    if (!userId) return;
    try {
      const updateData: Record<string, any> = {};
      if (state.hasCompletedOnboarding !== undefined) updateData.has_completed_onboarding = state.hasCompletedOnboarding;
      if (state.hasCompletedTour !== undefined) updateData.has_completed_tour = state.hasCompletedTour;
      if (state.userLevel !== undefined) updateData.user_level = state.userLevel;
      if (state.isFirstTask !== undefined) updateData.is_first_task = state.isFirstTask;

      await supabase.from('users').update(updateData).eq('auth_id', userId);
    } catch (error) {
      console.error('persistState: Exception:', error);
    }
  }, [userId]);

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

  const setPhase = useCallback((newPhase: OfficePhase) => setPhaseState(newPhase), []);

  const updateTaskStatus = useCallback(async (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      const isCompleted = status === 'approved' || (status as string) === 'passed';
      await supabase.from('tasks').update({ completed: isCompleted }).eq('id', taskId);
      
      if (isCompleted && userId) {
        setWeekStatus('passed_waiting');
        await supabase
          .from('user_progression')
          .update({ week_status: 'passed_waiting' })
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error updating task status in database:', error);
    }
  }, [userId]);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    persistState({ hasCompletedOnboarding: true, hasCompletedTour: false });
    setPhaseState('tour');
  }, [persistState]);

  const completeTour = useCallback(() => {
    setHasCompletedTour(true);
    persistState({ hasCompletedTour: true });
    setPhaseState('working');
    setShouldTriggerTeamIntro(true);
  }, [persistState]);

  const addPortfolioItem = useCallback((item: UserPortfolio) => {
    setPortfolio(prev => [...prev, item]);
  }, []);

  const acceptBounty = useCallback(async (bounty: Bounty) => {
    if (!userId) return;
    try {
      const { error: subError } = await supabase
        .from('bounty_submissions')
        .insert({ bounty_id: bounty.id, user_id: userId, status: 'pending' })
        .select()
        .single();

      if (subError) throw subError;

      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert({
          user: userId,
          title: bounty.title,
          brief_content: bounty.description,
          task_track: bounty.type || 'General',
          difficulty: 'Bounty',
          completed: false,
          resources: [], 
        })
        .select()
        .single();

      if (taskError) throw taskError;

      const newTask: Task = {
        id: taskData.id.toString(),
        title: taskData.title,
        description: taskData.brief_content,
        type: taskData.task_track || trackName,
        deadline: 'Flexible',
        created_at: taskData.created_at,
        status: 'pending',
        attachments: [],
        clientConstraints: undefined,
        resources: mapResources(taskData.resources),
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
  }, [userId, addChatMessage, trackName, mapResources]);

  const submitBio = useCallback(async (bio: string, file?: File) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';
    setIsBioProcessing(true);
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
          track: trackName.toLowerCase().replace(/[- ]/g, "_"),
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
        
        if (userId) {
          await supabase.from('user_progression').upsert({
            user_id: userId,
            current_week: 1,
            current_identity: 'Intern',
            week_status: 'in_progress'
          }, { onConflict: 'user_id' });
        }

      } else {
        setUserLevel('Level 1');
      }
    } catch (error) {
      console.error('Bio assessment failed:', error);
      setUserLevel('Level 1');
    } finally {
      setIsBioProcessing(false);
    }

    setShowToluWelcome(true);
  }, [trackName, addChatMessage, userId, persistState]);

  // ==========================================
  // GENERATE TASK (ASYNC QUEUE POLLING SYSTEM)
  // ==========================================
  const generateTask = useCallback(async () => {
    const hasActiveTask = tasks.some(t => 
      t.difficulty !== 'Bounty' && 
      !['approved', 'passed'].includes(t.status as string)
    );

    if (hasActiveTask && !isFirstTask) {
      addChatMessage({
        id: Date.now().toString(),
        agentName: 'Emem',
        message: "You already have an active task on your desk. Focus on completing it before requesting a new one.",
        timestamp: new Date(),
      });
      setIsExpanded(true);
      return; 
    }

    // 🔥 Capture current task count before requesting the new one
    const initialTaskCount = tasks.length;

    setIsGeneratingTask(true);
    setIsExpanded(true); 
    setMessageCount(0); 

    if (isFirstTask) {
      await new Promise(r => setTimeout(r, 1000));

      const introductionMessages: { agent: AgentName; message: string; delay: number }[] = [
        { agent: 'Tolu', message: "Alright, let me patch in the team. These are the people who will determine if you get a recommendation letter or not.", delay: 12000 },
        { agent: 'Tolu', message: `Team, this is the new intern, ${userName}. Assigned to the ${trackName} unit.`, delay: 12000 },
        { agent: 'Kemi', message: `Hi ${userName}! I'm Kemi, your career coach. I'll be translating your work here into a portfolio that gets you hired.`, delay: 18000 },
        { agent: 'Kemi', message: "You do the work, I'll build the career. Even starting from zero, in 12 months, you'll look like a pro on paper.", delay: 16000 },
        { agent: 'Emem', message: `Welcome ${userName}. I don't care about your background, I care about deadlines. Your first brief is coming in few minutes.`, delay: 14000 },
        { agent: 'Sola', message: `Hi ${userName}. I'm Sola. I review all technical output. I reject about 60% of first drafts. Don't take it personally.`, delay: 12000 },
      ];

      for (const msg of introductionMessages) {
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

      await new Promise(r => setTimeout(r, 2000));
    }

    addChatMessage({
      id: Date.now().toString(),
      agentName: 'Emem',
      message: isFirstTask
        ? "Your first task is on the way. Read the brief carefully. Deadline is non‑negotiable."
        : "New task assigned. Check your desk.",
      timestamp: new Date(),  
    });

    setGenerationStatusText("Pinging Emem...");
    const statusCycle = [
      "Reviewing your curriculum...",
      "Emem is drafting the brief...",
      "Preparing task resources...",
      "Finalizing your dashboard..."
    ];
    
    let cycleIndex = 0;
    const loadingInterval = setInterval(() => {
      if (cycleIndex < statusCycle.length) {
        setGenerationStatusText(statusCycle[cycleIndex]);
        cycleIndex++;
      }
    }, 2500);

    try {
      const response = await fetch('/api/tasks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_name: user?.fullName,
          track: trackName.toLowerCase().replace(/[- ]/g, "_"),
          task_number: currentWeek, 
          difficulty: "intermediate",
          include_video_brief: true
        })
      });

      if (!response.ok) throw new Error("API Failure");

      // 🔥 THE 60-SECOND POLLING ENGINE:
      let attempts = 0;
      let taskFound = false;

      while (attempts < 18 && !taskFound) { 
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const { data } = await supabase
          .from('tasks')
          .select('id')
          .eq('user', userId);

        if (data && data.length > initialTaskCount) {
          taskFound = true;
          await fetchTasks(); 
        }
        attempts++;
      }

      clearInterval(loadingInterval);
      setIsGeneratingTask(false);
      setGenerationStatusText("Fetch Missing Task");

    } catch (error) {
      console.error('Task queue failed:', error);
      clearInterval(loadingInterval);
      setIsGeneratingTask(false);
      setGenerationStatusText("Fetch Missing Task"); 
      
      addChatMessage({
        id: Date.now().toString(),
        agentName: 'Emem',
        message: "Connection issue. The system couldn't reach the queue. Please try again.",
        timestamp: new Date()
      });
    }

    if (isFirstTask) {
      setIsFirstTask(false);
      persistState({ hasCompletedOnboarding: true, hasCompletedTour: true, userLevel: userLevel, isFirstTask: false });
    }
  }, [tasks, addChatMessage, isFirstTask, userName, trackName, userLevel, userId, persistState, currentWeek, user?.fullName, fetchTasks]);

  useEffect(() => {
    if (shouldTriggerTeamIntro && phase === 'working' && !isGeneratingTask && tasks.length === 0) {
      setShouldTriggerTeamIntro(false);
      setIsExpanded(true); 
      generateTask();
    }
  }, [shouldTriggerTeamIntro, phase, isGeneratingTask, tasks.length, generateTask]);

  const handleToluWelcomeClose = useCallback(() => {
    setShowToluWelcome(false);
    completeOnboarding();
  }, [completeOnboarding]);

  // ==========================================
  // SUBMIT WORK (FORTIFIED 3-STRIKE SYSTEM)
  // ==========================================
  const submitWork = useCallback(async (taskId: string, file: File, notes: string) => {
    
    // 1. 🔥 THE 3-STRIKE DAILY LOCKOUT ENGINE 🔥
    const today = new Date().toISOString().split('T')[0];
    const attemptKey = `wdc-attempts-${userId}-${taskId}-${today}`;
    const currentAttempts = parseInt(localStorage.getItem(attemptKey) || '0', 10);

    if (currentAttempts >= 3) {
      addChatMessage({
        id: Date.now().toString(),
        agentName: 'Sola',
        message: "⚠️ **Daily Limit Reached.** You have already failed 3 attempts today. Review my feedback carefully, study your resources, and come back tomorrow to try again.",
        timestamp: new Date(),
      });
      setIsExpanded(true);
      return; // Stops the submission dead in its tracks
    }

    const nextAttemptNumber = currentAttempts + 1;

    setIsExpanded(true);
    updateTaskStatus(taskId, 'submitted');

    addChatMessage({
      id: Date.now().toString(),
      agentName: 'Sola',
      message: `I've received your submission (Attempt ${nextAttemptNumber}/3 for today). Validating your work now...`,
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
            .upload(fileName, file, { cacheControl: '3600', upsert: true });

          if (uploadError) {
            console.error('Submission upload error:', uploadError);
          } else if (uploadData) {
            const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(uploadData.path);
            fileUrl = urlData.publicUrl;
          }
        } catch (err) {
          console.error('Submission upload exception:', err);
        }
      }

      const task = tasks.find(t => t.id === taskId);

      const response = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          task_id: taskId,
          file_url: fileUrl || (file ? file.name : ''), 
          fileName: file ? file.name : 'submission',
          file_content: notes, 
          task_title: task?.title || 'Unknown Task',
          task_brief: task?.description || '',
          chat_history: chatMessages.slice(-5).map(m => ({
            role: m.agentName ? 'assistant' : 'user',
            content: m.message
          })),
          userLevel: userLevel, 
          attempt_number: nextAttemptNumber // Passes exact attempt logic to Sola's Brain
        })
      });

      const data = await response.json();

      if (response.status === 429) {
         addChatMessage({
            id: Date.now().toString(),
            agentName: 'Sola',
            message: data.message,
            timestamp: new Date(),
         });
         updateTaskStatus(taskId, 'pending');
         return;
      }

      if (response.ok) {
        
        // 🔥 Successfully processed by backend, log the attempt!
        localStorage.setItem(attemptKey, nextAttemptNumber.toString());

        addChatMessage({
          id: (Date.now() + 1).toString(),
          agentName: 'Sola',
          message: data.message || data.feedback,
          timestamp: new Date(),
        });

        if (data.completed || data.passed) {
          updateTaskStatus(taskId, 'approved');

          if (data.technical_accuracy !== undefined) {
            setPerformanceMetrics({
              technicalAccuracy: data.technical_accuracy,
              deliverySpeed: data.reliability_speed || 0,
              communication: data.communication_score || 0,
              overallRating: userLevel || 'Level 1'
            }); 
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
        throw new Error("API Failure: " + (data.message || response.statusText));
      }
    } catch (error) {
      console.error('Submission review failed:', error);
      addChatMessage({
        id: (Date.now() + 1).toString(), 
        agentName: 'Sola', 
        message: "Connection issue. Please check if the system is running and resubmit.", 
        timestamp: new Date(),
      });
      updateTaskStatus(taskId, 'pending');
    }
  }, [updateTaskStatus, addChatMessage, tasks, chatMessages, addPortfolioItem, userId, userLevel, setIsExpanded]);

  const sendMessage = useCallback(async (message: string) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

    if (messageCount >= 5) {
      addChatMessage({
        id: Date.now().toString(), agentName: null, message: "SYSTEM: You have reached the question limit (5) for this task. Please submit your work to proceed.", timestamp: new Date(),
      });
      return;
    }

    setMessageCount(prev => prev + 1);
    addChatMessage({ id: Date.now().toString(), agentName: null, message, timestamp: new Date() });

    try {
      const currentTaskInfo = tasks.find(t => t.status !== 'approved' && (t.status as string) !== 'passed');
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
            track: trackName.toLowerCase().replace(/[- ]/g, "_"),
            task_brief: currentTaskInfo?.description,
            deadline: currentTaskInfo?.deadline,
            current_identity: currentIdentity, 
            current_week: currentWeek 
          },
          chat_history: chatMessages.slice(-10).map(m => ({ role: m.agentName ? 'assistant' : 'user', content: m.message }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        addChatMessage({ id: (Date.now() + 1).toString(), agentName: data.agent as AgentName, message: data.message, timestamp: new Date() });
      } else {
        addChatMessage({ id: (Date.now() + 1).toString(), agentName: 'Sola', message: "I'm having trouble connecting. Please try again.", timestamp: new Date() });
      }
    } catch (error) {
      console.error('Chat failed:', error);
      addChatMessage({ id: (Date.now() + 1).toString(), agentName: 'Sola', message: "Connection issue. Please check if the AI backend is running.", timestamp: new Date() });
    }
  }, [addChatMessage, tasks, userLevel, trackName, chatMessages, messageCount, userId, currentIdentity, currentWeek]);

  const sendInterviewMessage = useCallback(async (message: string, interviewType: string, interviewHistory: Array<{role: string, content: string}> = []) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';
    try {
      const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, message,
          context: { is_mock_interview: true, interview_type: interviewType, user_level: userLevel, track: trackName.toLowerCase().replace(/[- ]/g, "_"), is_submission: false, is_first_login: false },
          chat_history: interviewHistory
        })
      });
      if (response.ok) {
        const data = await response.json();
        return { agent: 'Kemi' as AgentName, message: data.message };
      } else {
        return { agent: 'Kemi' as AgentName, message: "I'm having trouble connecting to the interview system. Please try again." };
      }
    } catch (error) {
      console.error('Interview message failed:', error);
      return { agent: 'Kemi' as AgentName, message: "Connection issue. Please check if the AI backend is running." };
    }
  }, [userId, userLevel, trackName]);

  const sendSalaryNegotiationMessage = useCallback(async (message: string, negotiationHistory: Array<{role: string, content: string}> = []) => {
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';
    try {
      const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, message,
          context: { is_salary_negotiation: true, user_level: userLevel, track: trackName.toLowerCase().replace(/[- ]/g, "_"), is_submission: false, is_first_login: false },
          chat_history: negotiationHistory
        })
      });
      if (response.ok) {
        const data = await response.json();
        return { agent: 'Tolu' as AgentName, message: data.message };
      } else {
        return { agent: 'Tolu' as AgentName, message: "I'm having trouble connecting to the negotiation system. Please try again." };
      }
    } catch (error) {
      console.error('Salary negotiation message failed:', error);
      return { agent: 'Tolu' as AgentName, message: "Connection issue. Please check if the AI backend is running." };
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
        generationStatusText, 
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
        isBioProcessing,
        isExpanded,
        setIsExpanded,
        isFirstTask,
        userName,
        trackName,
        typingAgent: null,
        acceptBounty, 
        
        currentWeek,
        currentIdentity,
        weekStatus,
        nextUnlockDate,
        unlockedBadges
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