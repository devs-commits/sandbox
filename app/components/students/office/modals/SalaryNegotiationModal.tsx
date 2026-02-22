"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, DollarSign, TrendingUp, Users, MapPin } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { AGENTS } from '../types';
import { AgentAvatar } from '../AgentAvatar';
import { useOffice } from '../../../../contexts/OfficeContext';
import { cn } from '@/lib/utils';

const formatTrackName = (track: string): string => {
  if (!track) return 'General';
  return track
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatUserLevel = (level: string): string => {
  if (!level) return 'Not Assessed';
  const levelMap: Record<string, string> = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate', 
    'advanced': 'Advanced',
    'level-0': 'Level 0',
    'level-1': 'Level 1',
    'level-2': 'Level 2'
  };
  
  return levelMap[level] || level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
};

interface SalaryNegotiationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NegotiationMessage {
    id: string;
    sender: 'user' | 'tolu';
    content: string;
    timestamp: Date;
    type?: 'offer' | 'counter' | 'question' | 'conclusion';
}

export function SalaryNegotiationModal({ isOpen, onClose }: SalaryNegotiationModalProps) {
    const { userLevel, trackName, sendSalaryNegotiationMessage } = useOffice();
    const [isStarted, setIsStarted] = useState(false);
    const [messages, setMessages] = useState<NegotiationMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [isNegotiationComplete, setIsNegotiationComplete] = useState(false);
    const [negotiationResult, setNegotiationResult] = useState<'success' | 'failed' | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const tolu = AGENTS.Tolu;
    const MAX_QUESTIONS = 5;

    const getNegotiationHistory = useCallback(() => {
        return messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
        }));
    }, [messages]);

    const getMessageBackgroundColor = (type?: string) => {
        switch (type) {
            case 'offer':
                return 'bg-green-500/10 border border-green-500/20 rounded-tl-sm';
            case 'counter':
                return 'bg-amber-500/10 border border-amber-500/20 rounded-tl-sm';
            case 'question':
                return 'bg-card border border-border rounded-tl-sm';
            case 'conclusion':
                return 'bg-blue-500/10 border border-blue-500/20 rounded-tl-sm';
            default:
                return 'bg-secondary/60 text-foreground rounded-tl-sm';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const addMessage = (message: Omit<NegotiationMessage, 'id' | 'timestamp'>) => {
        const newMessage: NegotiationMessage = {
            ...message,
            id: Date.now().toString(),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const startNegotiation = async () => {
        setIsStarted(true);
        setIsTyping(true);

        try {
            const response = await sendSalaryNegotiationMessage(
                `Start salary negotiation for a ${formatUserLevel(userLevel || 'Level 1')} level ${formatTrackName(trackName || 'General')} professional. Make initial offer. Keep responses concise. Maximum 5 questions total. Ask about experience, skills, market research, and expectations. No markdown formatting. Respond as HR manager.`,
                getNegotiationHistory()
            );

            addMessage({
                sender: 'tolu',
                content: response.message,
                type: 'offer'
            });
            setQuestionCount(1);
        } catch (error) {
            console.error('Failed to start negotiation:', error);
            addMessage({
                sender: 'tolu',
                content: "I'm having trouble connecting to the negotiation system. Please try again.",
                type: 'question'
            });
        } finally {
            setIsTyping(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isSending || isNegotiationComplete) return;

        const userMessage = input.trim();
        setInput('');
        setIsSending(true);

        addMessage({
            sender: 'user',
            content: userMessage
        });

        try {
            setIsTyping(true);
            const isFinalQuestion = questionCount >= MAX_QUESTIONS;
            
            const response = await sendSalaryNegotiationMessage(
                `User responded: "${userMessage}". ${isFinalQuestion ? 'This is the final response. Provide conclusion on whether negotiation was successful or failed based on their arguments. Be decisive.' : 'Respond to their counter-offer or question. Ask follow-up if needed.'} Keep responses concise. No markdown formatting. Respond as HR manager.`,
                [...getNegotiationHistory(), { role: 'user', content: userMessage }]
            );

            const messageType = isFinalQuestion ? 'conclusion' : 
                              response.message.toLowerCase().includes('offer') ? 'counter' : 'question';

            addMessage({
                sender: 'tolu',
                content: response.message,
                type: messageType
            });
            
            if (isFinalQuestion) {
                setIsNegotiationComplete(true);
                // Determine if negotiation was successful based on response
                const successKeywords = ['congratulations', 'accepted', 'approved', 'successful', 'agree', 'increase'];
                const failedKeywords = ['reject', 'unable', 'cannot', 'stick', 'final offer', 'decline'];
                
                const responseLower = response.message.toLowerCase();
                if (successKeywords.some(keyword => responseLower.includes(keyword))) {
                    setNegotiationResult('success');
                } else if (failedKeywords.some(keyword => responseLower.includes(keyword))) {
                    setNegotiationResult('failed');
                }
            } else {
                setQuestionCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            addMessage({
                sender: 'tolu',
                content: "Connection issue. Please try again.",
                type: 'question'
            });
        } finally {
            setIsTyping(false);
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetNegotiation = () => {
        setIsStarted(false);
        setMessages([]);
        setInput('');
        setIsTyping(false);
        setIsSending(false);
        setQuestionCount(0);
        setIsNegotiationComplete(false);
        setNegotiationResult(null);
    };

    const handleClose = () => {
        resetNegotiation();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                        <div className="flex items-center gap-3">
                            <AgentAvatar agentName="Tolu" size="sm" />
                            <div>
                                <h3 className="font-semibold text-foreground">Salary Negotiation with Tolu</h3>
                                <p className="text-xs text-muted-foreground">
                                    {isStarted ? 'Negotiation in progress' : 'Practice your negotiation skills'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                            <X size={16} />
                        </Button>
                    </div>

                    {/* Setup Phase */}
                    {!isStarted ? (
                        <div className="p-6 space-y-6">
                            <div className="bg-secondary/30 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <DollarSign className="text-primary mt-1" size={20} />
                                    <div>
                                        <p className="text-foreground text-sm mb-3">
                                            Tolu will act as HR manager and negotiate salary based on your:
                                        </p>
                                        <div className="space-y-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={12} />
                                                <span>Career Track: {formatTrackName(trackName || 'General')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={12} />
                                                <span>Experience Level: {formatUserLevel(userLevel || 'Level 1')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={12} />
                                                <span>Location: Lagos, Nigeria</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={startNegotiation}
                                className="w-full"
                            >
                                Start Negotiation
                            </Button>
                        </div>
                    ) : (
                        /* Negotiation Room */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-3",
                                            msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                                        )}
                                    >
                                        {msg.sender === 'user' ? (
                                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                                                U
                                            </div>
                                        ) : (
                                            <AgentAvatar agentName="Tolu" size="sm" />
                                        )}

                                        <div
                                            className={cn(
                                                "max-w-[80%] rounded-2xl px-4 py-2.5",
                                                msg.sender === 'user'
                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                    : getMessageBackgroundColor(msg.type)
                                            )}
                                        >
                                            {msg.type && msg.sender !== 'user' && (
                                                <p
                                                    className="text-xs font-semibold mb-1"
                                                    style={{ color: tolu.color }}
                                                >
                                                    {msg.type}
                                                </p>
                                            )}
                                            
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            
                                            <p className="text-xs opacity-50 mt-2">
                                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3"
                                    >
                                        <AgentAvatar agentName="Tolu" size="sm" />
                                        <div className="bg-secondary/60 rounded-2xl px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Tolu is typing</span>
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {isNegotiationComplete && negotiationResult && (
                                <div className={cn(
                                    "p-4 border-t border-border",
                                    negotiationResult === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
                                )}>
                                    <div className="text-center">
                                        <p className={cn(
                                            "font-semibold text-sm",
                                            negotiationResult === 'success' ? 'text-green-600' : 'text-red-600'
                                        )}>
                                            {negotiationResult === 'success' ? '🎉 Negotiation Successful!' : '❌ Negotiation Failed'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {negotiationResult === 'success' 
                                                ? 'You successfully negotiated a better offer!' 
                                                : 'You\'ll need to accept the original offer.'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-t border-border bg-secondary/20">
                                {isStarted && questionCount > 0 && (
                                    <div className="mb-3 text-center">
                                        <span className="text-xs text-muted-foreground">
                                            Round {Math.min(questionCount, MAX_QUESTIONS)} of {MAX_QUESTIONS}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex gap-2">
                                    <Textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isNegotiationComplete ? "Negotiation completed" : "Make your case..."}
                                        className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                                        disabled={isSending || isNegotiationComplete}
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isSending || isNegotiationComplete}
                                        className="h-[60px] px-6"
                                    >
                                        {isSending ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
