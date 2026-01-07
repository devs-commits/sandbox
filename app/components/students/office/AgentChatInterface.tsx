"use client";
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { AGENTS, AgentName } from './types';

export function AgentChatInterface() {
  const { chatMessages, sendMessage, phase } = useOffice();
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
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm">
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
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <MessageSquare className="text-muted-foreground" size={28} />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isDisabled 
                ? 'Complete onboarding to start chatting with the team.'
                : 'No messages yet. The team will contact you when needed.'}
            </p>
          </div>
        )}
        
        {chatMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.agentName ? '' : 'flex-row-reverse'}`}
          >
            {msg.agentName ? (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0 shadow-lg"
                style={getAgentStyle(msg.agentName)}
              >
                {AGENTS[msg.agentName].avatar}
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
                U
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.agentName
                  ? 'bg-secondary/80 text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {msg.agentName && (
                <p className="text-xs font-semibold mb-1" style={{ color: AGENTS[msg.agentName].color }}>
                  {msg.agentName} • {AGENTS[msg.agentName].role}
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