export type AgentName = 'Tolu' | 'Emem' | 'Sola' | 'Kemi';

export type UserLevel = 'Level 0' | 'Level 1' | 'Level 2';

export type TaskStatus = 'pending' | 'in-progress' | 'submitted' | 'under-review' | 'approved' | 'rejected';

export type OfficePhase = 'lobby' | 'tour' | 'team-intro' | 'working' | 'review';

export interface Agent {
  name: AgentName;
  role: string;
  avatar: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  agentName: AgentName | null;
  message: string;
  timestamp: Date;
  isTyping?: boolean;
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

export const AGENTS: Record<AgentName, Agent> = {
  Tolu: {
    name: 'Tolu',
    role: 'Onboarding Officer',
    avatar: 'T',
    color: 'hsl(187 100% 42%)',
  },
  Emem: {
    name: 'Emem',
    role: 'Project Manager',
    avatar: 'E',
    color: 'hsl(280 70% 50%)',
  },
  Sola: {
    name: 'Sola',
    role: 'Technical Supervisor',
    avatar: 'S',
    color: 'hsl(25 95% 53%)',
  },
  Kemi: {
    name: 'Kemi',
    role: 'Career Coach',
    avatar: 'K',
    color: 'hsl(142 70% 45%)',
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