"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface Message {
  id: string;
  content: string;
  role: 'ai' | 'user';
  timestamp: Date;
}

interface ChatInterfaceProps {
  variant?: 'dark' | 'light';
  onSendMessage?: (message: string) => Promise<string>;
}

const ChatInterface = ({ variant = 'dark', onSendMessage }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "I'm scanning your profile. It looks empty. Convince me in one sentence: Why should I give you a desk at WDC Labs instead of the 10,000 other students on the waitlist?",
      role: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [turnsLeft, setTurnsLeft] = useState(3);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || turnsLeft <= 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setTurnsLeft((prev) => prev - 1);

    // Simulate AI response (this would be replaced by actual backend integration)
    setTimeout(() => {
      const aiResponses = [
        "Interesting. Your response shows potential, but I need more substance. Tell me about a project you've actually shipped.",
        "Hmm, that's what everyone says. What makes you different from the 9,999 others making the same claim?",
        "Final chance. One concrete skill that would make you indispensable to a startup. Go.",
      ];
      
      const responseIndex = Math.min(2 - turnsLeft + 1, 2);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponses[responseIndex] || "Your session has ended. Apply through the waitlist for another chance.",
        role: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const containerClass = variant === 'dark' 
    ? 'chat-interface' 
    : 'bg-card border border-border shadow-xl';

  const bubbleAiClass = variant === 'dark'
    ? 'chat-bubble-ai'
    : 'bg-secondary rounded-2xl rounded-tl-sm p-4';

  return (
    <div className={`${containerClass} rounded-2xl overflow-hidden max-w-md w-full`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center">
            <span className="text-primary-foreground font-bold">T</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Tolu (AI HR)</h3>
            <p className="text-xs text-coral">Status: JUDGING YOU</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          turnsLeft > 1 ? 'bg-teal/20 text-teal' : 'bg-coral/20 text-coral'
        }`}>
          {turnsLeft} TURNS LEFT
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={message.role === 'ai' ? bubbleAiClass : 'chat-bubble-user max-w-[85%]'}>
                {message.role === 'ai' && (
                  <p className="text-xs font-semibold text-teal mb-1">Tolu</p>
                )}
                <p className="text-sm text-foreground">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className={bubbleAiClass}>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-teal rounded-full typing-dot" />
                <span className="w-2 h-2 bg-teal rounded-full typing-dot" />
                <span className="w-2 h-2 bg-teal rounded-full typing-dot" />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your defense here..."
            disabled={turnsLeft <= 0}
            className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || turnsLeft <= 0}
            className="btn-primary-gradient text-primary-foreground px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;