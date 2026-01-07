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
  chatMessages: ChatMessage[];
  portfolio: UserPortfolio[];
  tourStep: number;
  hasCompletedOnboarding: boolean;
}

export interface ArchiveItem {
  id: string;
  title: string;
  category: string;
  description: string;
  link?: string;
}

import { StaticImageData } from 'next/image';

import toluImage from '../../../../public/agents/tolu.png';
import ememImage from '../../../../public/agents/emem.png';
import solaImage from '../../../../public/agents/sola.png';
import kemiImage from '../../../../public/agents/kemi.png';

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

export const MOCK_ARCHIVES: ArchiveItem[] = [
  {
    id: '1',
    title: 'Data Cleaning Best Practices',
    category: 'Data Analytics',
    description: 'Guidelines for handling missing values, outliers, and data validation.',
  },
  {
    id: '2',
    title: 'SEO Audit Checklist',
    category: 'Digital Marketing',
    description: 'Complete checklist for technical and on-page SEO audits.',
  },
  {
    id: '3',
    title: 'Network Security Fundamentals',
    category: 'Cybersecurity',
    description: 'Core concepts for understanding network vulnerabilities.',
  },
];