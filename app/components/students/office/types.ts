export type AgentName = 'Tolu' | 'Emem' | 'Sola' | 'Kemi';

export type UserLevel = 'Level 0' | 'Level 1' | 'Level 2';

export type TaskStatus = 'pending' | 'in-progress' | 'submitted' | 'under-review' | 'approved' | 'rejected';

export type OfficePhase = 'lobby' | 'tour' | 'team-intro' | 'working' | 'review';

export interface Agent {
  name: AgentName;
  role: string;
  avatar: string;
  color: string;
  image?: StaticImageData;
}

export interface ChatMessage {
  id: string;
  agentName: AgentName | null;
  message: string;
  timestamp: Date;
  isTyping?: boolean;
  isSystemMessage?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  deadline: string;
  status: TaskStatus;
  attachments: string[];
  clientConstraints?: string;
  score?: number;
  feedback?: string;
  resources?: ArchiveItem[]; // AI generated resources specific to this task
  difficulty?: string;
}

export interface Bounty {
  id: number;
  created_at: string;
  recruiter_id: number;
  title: string;
  description: string;
  type: string;
  duration: string;
  reward: number;
  slots_total: number;
  slots_filled: number;
  instructions: string[];
  deliverables: string[];
  status: string;
}

export interface UserPortfolio {
  skillTag: string;
  bulletPoint: string;
  verifiedBy: AgentName;
}

export interface OfficeState {
  phase: OfficePhase;
  userLevel: UserLevel | null;
  currentTask: Task | null;
  tasks: Task[];
  bounties: Bounty[];
  chatMessages: ChatMessage[];
  portfolio: UserPortfolio[];

  tourStep: number;

  hasCompletedOnboarding: boolean;
  performanceMetrics: PerformanceMetrics | null;
}

export interface ArchiveItem {
  id: string;
  title: string;
  category: string;
  description: string;
  link?: string;
  content?: string; // Markdown content
}

export interface PerformanceMetrics {
  technicalAccuracy: number;
  deliverySpeed: number;
  communication: number;
  overallRating: string;
}
import { StaticImageData } from 'next/image';
import toluImage from '../../../../public/tolu.jpg';
import solaImage from '../../../../public/sola.jpg';
import kemiImage from '../../../../public/kemi.jpg';
import ememImage from '../../../../public/emem.jpg';

export const AGENTS: Record<AgentName, Agent> = {
  Tolu: {
    name: 'Tolu',
    role: 'Onboarding Officer',
    avatar: 'T',
    color: 'hsl(187 100% 42%)',
    image: toluImage,
  },
  Emem: {
    name: 'Emem',
    role: 'Project Manager',
    avatar: 'E',
    color: 'hsl(280 70% 50%)',
    image: ememImage,
  },
  Sola: {
    name: 'Sola',
    role: 'Technical Supervisor',
    avatar: 'S',
    color: 'hsl(25 95% 53%)',
    image: solaImage,
  },
  Kemi: {
    name: 'Kemi',
    role: 'Career Coach',
    avatar: 'K',
    color: 'hsl(142 70% 45%)',
    image: kemiImage,
  },
};

