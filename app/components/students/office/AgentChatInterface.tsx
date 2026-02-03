"use client";
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Open_Sans } from 'next/font/google';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { AGENTS, AgentName } from './types';
import { AgentAvatar } from './AgentAvatar';
import { cn } from '@/lib/utils';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

export function AgentChatInterface() {
  const { chatMessages, sendMessage, phase,typingAgent } = useOffice();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const message = input.trim();
    setInput('');
    setIsSending(true);
    await sendMessage(message);
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAgentStyle = (agentName: AgentName) => {
    const agent = AGENTS[agentName];
    return { backgroundColor: agent.color };
  };

  const isDisabled = phase === 'lobby' || phase === 'tour';

  return (
    <div className={cn("flex flex-col h-full bg-card/50 backdrop-blur-sm", openSans.className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <MessageSquare className="text-primary" size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm"> Meeting Room</h3>
            <p className="text-xs text-muted-foreground">Professional communications only</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && !typingAgent && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center mb-3">
              <MessageSquare className="text-muted-foreground" size={24} />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isDisabled
              ? 'Complete onboarding first.'
              : 'No messages yet.'}
            </p>
            </div>
          )}
        
        {chatMessages.map((msg) => (
          <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex gap-3",
             msg.agentName ? "flex-row" : "flex-row-reverse"
        )}
        >
          {msg.agentName ? (
            <AgentAvatar agentName={msg.agentName} size="sm" />
          ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
            U
            </div>
          )}
            {/* Message bubble */}
          <div
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2.5",
             msg.agentName
             ? "bg-secondary/60 text-foreground rounded-tl-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
            )}
          >
          {msg.agentName && (
            <p
            className="text-xs font-semibold mb-1"
            style={{ color: AGENTS[msg.agentName].color }}
            >
          {msg.agentName}
          </p>
          )}
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              <p className="text-xs opacity-50 mt-2">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}
        
        {isSending && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Loader2 className="animate-spin text-muted-foreground" size={16} />
            </div>
            <div className="bg-secondary/80 rounded-2xl px-4 py-3">
              <p className="text-sm text-muted-foreground">Typing...</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? 'Complete onboarding first...' : 'Type your message...'}
            disabled={isDisabled || isSending}
            className="flex-1 bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-all"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isDisabled || isSending}
            className="w-12 h-12 rounded-xl"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
