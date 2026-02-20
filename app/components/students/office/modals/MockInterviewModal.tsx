"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { AGENTS } from '../types';
import { AgentAvatar } from '../AgentAvatar';
import { useOffice } from '../../../../contexts/OfficeContext';
import { cn } from '@/lib/utils';

// Format track names: "data-analytics" -> "Data Analytics"
const formatTrackName = (track: string): string => {
  if (!track) return 'General';
  return track
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format user level: "level-1" -> "Level 1"
const formatUserLevel = (level: string): string => {
  if (!level) return 'Not Assessed';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
};

// Format interview type: "behavioral" -> "Behavioral"
const formatInterviewType = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

interface MockInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type InterviewType = 'behavioral' | 'technical' | 'situational';

interface InterviewMessage {
    id: string;
    sender: 'user' | 'kemi';
    content: string;
    timestamp: Date;
    type?: 'question' | 'evaluation' | 'tip' | 'setup';
}

export function MockInterviewModal({ isOpen, onClose }: MockInterviewModalProps) {
    const { userLevel, trackName, sendInterviewMessage } = useOffice();
    const [isStarted, setIsStarted] = useState(false);
    const [messages, setMessages] = useState<InterviewMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [isInterviewComplete, setIsInterviewComplete] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const kemi = AGENTS.Kemi;
    const MAX_QUESTIONS = 3;
    
    // Define question type rotation
    const questionTypes: InterviewType[] = ['behavioral', 'technical', 'situational'];
    const currentQuestionType = questionTypes[questionCount % 3] || 'behavioral';

    // Memoize interview history to avoid recalculating
    const getInterviewHistory = useCallback(() => {
        return messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
        }));
    }, [messages]);

    // Helper function to get message background color
    const getMessageBackgroundColor = (type?: string) => {
        switch (type) {
            case 'question':
                return 'bg-card border border-border rounded-tl-sm';
            case 'tip':
                return 'bg-yellow-500/10 border border-yellow-500/20 rounded-tl-sm';
            case 'evaluation':
                return 'bg-green-500/10 border border-green-500/20 rounded-tl-sm';
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

    const addMessage = (message: Omit<InterviewMessage, 'id' | 'timestamp'>) => {
        const newMessage: InterviewMessage = {
            ...message,
            id: Date.now().toString(),
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const startInterview = async () => {
        setIsStarted(true);
        setIsTyping(true);

        try {
            const response = await sendInterviewMessage(
                `Start a ${formatInterviewType(currentQuestionType)} mock interview for a ${formatUserLevel(userLevel || 'Not Assessed')} level ${formatTrackName(trackName || 'General')} student. Ask first question. Keep responses concise. Maximum 3 questions total. Evaluations should be 2-3 sentences max. Do not use markdown formatting, asterisks, or special characters. Respond in natural conversational tone.`,
                currentQuestionType,
                getInterviewHistory()
            );

            addMessage({
                sender: 'kemi',
                content: response.message,
                type: 'question'
            });
            setQuestionCount(1); // First question asked
        } catch (error) {
            console.error('Failed to start interview:', error);
            addMessage({
                sender: 'kemi',
                content: "I'm having trouble connecting to the interview system. Please try again.",
                type: 'setup'
            });
        } finally {
            setIsTyping(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isSending) return;

        const userMessage = input.trim();
        setInput('');
        setIsSending(true);

        addMessage({
            sender: 'user',
            content: userMessage
        });

        try {
            setIsTyping(true);
            const response = await sendInterviewMessage(
                `User answered: "${userMessage}". Evaluate in 2-3 sentences maximum. Provide one strength and one improvement point. ${questionCount >= MAX_QUESTIONS ? 'This is the final question - provide feedback only without asking another question.' : `Then ask next question (${questionCount + 1} of 3).`} Keep all responses concise. Do not use markdown formatting, asterisks, or special characters. Respond in natural conversational tone.`,
                currentQuestionType,
                [...getInterviewHistory(), { role: 'user', content: userMessage }]
            );

            addMessage({
                sender: 'kemi',
                content: response.message,
                type: 'evaluation'
            });
            
            // Check if response contains a question and increment counter
            if (response.message.includes('?')) {
                const newCount = questionCount + 1;
                setQuestionCount(newCount);
                
                // End interview after 5 questions (but only after user answers the 5th)
                if (newCount >= MAX_QUESTIONS) {
                    // Don't end immediately - wait for user to answer 5th question
                }
            } else if (questionCount >= MAX_QUESTIONS) {
                // User has answered 5th question, now end interview
                setIsInterviewComplete(true);
                addMessage({
                    sender: 'kemi',
                    content: `Interview complete! You've answered all ${MAX_QUESTIONS} questions. Great practice! Your responses showed strong analytical thinking and good communication skills.`,
                    type: 'setup'
                });
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            addMessage({
                sender: 'kemi',
                content: "Connection issue. Please check if the AI backend is running.",
                type: 'evaluation'
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

    const resetInterview = () => {
        setIsStarted(false);
        setMessages([]);
        setInput('');
        setIsTyping(false);
        setIsSending(false);
        setQuestionCount(0);
        setIsInterviewComplete(false);
    };

    const handleClose = () => {
        resetInterview();
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
                            <AgentAvatar agentName="Kemi" size="sm" />
                            <div>
                                <h3 className="font-semibold text-foreground">Mock Interview with Kemi</h3>
                                <p className="text-xs text-muted-foreground">
                                    {isStarted ? 'Interview in progress' : 'Practice for real interviews'}
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
                                    <MessageSquare className="text-primary mt-1" size={20} />
                                    <div>
                                        <p className="text-foreground text-sm">
                                            Kemi will ask questions across behavioral, technical, and situational interview types to give you comprehensive practice.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={startInterview}
                                className="w-full"
                            >
                                Start Interview
                            </Button>
                        </div>
                    ) : (
                        /* Interview Room */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Messages */}
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
                                        {/* Avatar */}
                                        {msg.sender === 'user' ? (
                                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                                                U
                                            </div>
                                        ) : (
                                            <AgentAvatar agentName="Kemi" size="sm" />
                                        )}

                                        {/* Message bubble */}
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
                                                    style={{ color: kemi.color }}
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

                                {/* Typing indicator */}
                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-3"
                                    >
                                        <AgentAvatar agentName="Kemi" size="sm" />
                                        <div className="bg-secondary/60 rounded-2xl px-4 py-2.5">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-border bg-secondary/20">
                                {/* Question Progress */}
                                {isStarted && questionCount > 0 && (
                                    <div className="mb-3 text-center">
                                        <span className="text-xs text-muted-foreground">
                                            Question {Math.min(questionCount, MAX_QUESTIONS)} of {MAX_QUESTIONS}
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex gap-2">
                                    <Textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isInterviewComplete ? "Interview completed" : "Type your response..."}
                                        className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                                        disabled={isSending || isInterviewComplete}
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!input.trim() || isSending || isInterviewComplete}
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
