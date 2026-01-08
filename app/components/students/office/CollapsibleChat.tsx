"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, Send} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useOffice } from '../../../contexts/OfficeContext';
import { AGENTS, AgentName } from './types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { AgentAvatar } from './AgentAvatar';
import { Loader2 } from 'lucide-react';

interface CollapsibleChatProps {
  triggerRef?: React.Ref<HTMLButtonElement>;
}

export function CollapsibleChat({ triggerRef }: CollapsibleChatProps) {
  const { chatMessages, sendMessage, phase, isExpanded, setIsExpanded, typingAgent } = useOffice();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCount = useRef(chatMessages.length);

  // Auto-expand when new messages arrive
  useEffect(() => {
    if (chatMessages.length > prevMessageCount.current && !isExpanded) {
      setIsExpanded(true);
    }
    prevMessageCount.current = chatMessages.length;
  }, [chatMessages.length, isExpanded, setIsExpanded]);

  // Scroll to bottom when messages change or typing
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isExpanded, typingAgent]);

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

  const isDisabled = phase === 'lobby' || phase === 'tour';
  const unreadCount = chatMessages.length;

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden lg:block">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-96 h-[500px] bg-card border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div
              className="p-4 border-b border-border/50 bg-secondary/30 flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(false)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="text-primary" size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Meeting Room</h3>
                  <p className="text-xs text-muted-foreground">Professional communication only</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronDown size={16} />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  {/* Avatar */}
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

                    {msg.isTyping ? (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      </div>
                    ) : (
                      <div className="text-sm break-words [&>*]:text-inherit">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}


              {isSending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" size={14} />
                  </div>
                  <div className="bg-secondary/60 rounded-2xl px-4 py-2.5">
                    <p className="text-sm text-muted-foreground">Typing...</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50 bg-secondary/20">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isDisabled ? 'Complete onboarding...' : 'Type a message...'}
                  disabled={isDisabled || isSending}
                  className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isDisabled || isSending}
                  className="w-10 h-10 rounded-xl shrink-0"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            ref ={triggerRef} 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center relative"
          >
            <MessageSquare className="text-primary-foreground" size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}