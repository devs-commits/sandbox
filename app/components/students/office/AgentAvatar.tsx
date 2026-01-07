import { AGENTS, AgentName } from './types';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AgentAvatarProps {
  agentName: AgentName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AgentAvatar({ agentName, size = 'md', className }: AgentAvatarProps) {
  const agent = AGENTS[agentName];
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden shrink-0 ring-2 ring-background shadow-md",
        sizeClasses[size],
        className
      )}
    >
      {agent.image ? (
        <Image
          src={agent.image}
          alt={agent.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: agent.color }}
        >
          {agent.avatar}
        </div>
      )}
    </div>
  );
}