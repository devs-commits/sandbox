"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, MessageSquare, Lightbulb, Send } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { AGENTS } from '../types';

interface MockInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type InterviewType = 'behavioral' | 'technical' | 'situational';

interface InterviewQuestion {
    question: string;
    tip: string;
    evaluation?: string;
}

export function MockInterviewModal({ isOpen, onClose }: MockInterviewModalProps) {
    const [interviewType, setInterviewType] = useState<InterviewType>('behavioral');
    const [isStarted, setIsStarted] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<Array<{ question: string; answer: string; evaluation?: string }>>([]);

    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';
    const kemi = AGENTS.Kemi;

    const startInterview = async () => {
        setIsLoading(true);
        try {
            const apiUrl = `${AI_BACKEND_URL}/mock-interview`;
            if (!AI_BACKEND_URL) {
                throw new Error('AI_BACKEND_URL is not defined. Please check your environment variables.');
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interview_type: interviewType,
                    question_number: 1,
                    previous_answer: null
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentQuestion({
                    question: data.question,
                    tip: data.tip
                });
                setIsStarted(true);
            } else {
                console.error('Failed to start interview: ', response.statusText);
            }
        } catch (error) {
            console.error('Error starting interview:', error);
            alert('Failed to start the interview. Please check your network connection or contact support.');
        } finally {
            setIsLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${AI_BACKEND_URL}/mock-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    interview_type: interviewType,
                    question_number: questionNumber + 1,
                    previous_answer: answer
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Save current Q&A to history
                setHistory(prev => [...prev, {
                    question: currentQuestion?.question || '',
                    answer: answer,
                    evaluation: data.evaluation
                }]);

                // Move to next question
                setCurrentQuestion({
                    question: data.question,
                    tip: data.tip,
                    evaluation: data.evaluation
                });
                setQuestionNumber(prev => prev + 1);
                setAnswer('');
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetInterview = () => {
        setIsStarted(false);
        setQuestionNumber(1);
        setCurrentQuestion(null);
        setAnswer('');
        setHistory([]);
    };

    const handleClose = () => {
        resetInterview();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                                    style={{ backgroundColor: kemi.color }}
                                >
                                    {kemi.avatar}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">Mock Interview with Kemi</h3>
                                    <p className="text-xs text-muted-foreground">Practice for real interviews</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                                <X size={16} />
                            </Button>
                        </div>

                        {!isStarted ? (
                            /* Interview Type Selection */
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="font-medium text-foreground mb-4">Select Interview Type</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['behavioral', 'technical', 'situational'] as InterviewType[]).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setInterviewType(type)}
                                                className={`p-4 rounded-xl border transition-all ${interviewType === type
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                            >
                                                <span className="capitalize font-medium">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-secondary/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <MessageSquare className="text-primary mt-1" size={20} />
                                        <div>
                                            <p className="text-foreground text-sm">
                                                {interviewType === 'behavioral' &&
                                                    "Behavioral interviews focus on past experiences. Use the STAR method: Situation, Task, Action, Result."}
                                                {interviewType === 'technical' &&
                                                    "Technical interviews test your problem-solving skills. Think out loud and explain your approach."}
                                                {interviewType === 'situational' &&
                                                    "Situational interviews present hypothetical scenarios. Focus on demonstrating good judgment."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={startInterview}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin mr-2" size={16} />
                                            Starting Interview...
                                        </>
                                    ) : (
                                        'Start Interview'
                                    )}
                                </Button>
                            </div>
                        ) : (
                            /* Active Interview */
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Question Display */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {/* Previous evaluation if any */}
                                    {currentQuestion?.evaluation && (
                                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                                            <p className="text-sm text-foreground">{currentQuestion.evaluation}</p>
                                        </div>
                                    )}

                                    {/* Current question */}
                                    <div className="bg-secondary/40 rounded-xl p-4">
                                        <p className="text-xs text-muted-foreground mb-2">Question {questionNumber}</p>
                                        <p className="text-foreground font-medium">{currentQuestion?.question}</p>
                                    </div>

                                    {/* Tip */}
                                    <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                        <Lightbulb className="text-yellow-500 shrink-0 mt-0.5" size={16} />
                                        <p className="text-sm text-foreground">{currentQuestion?.tip}</p>
                                    </div>
                                </div>

                                {/* Answer Input */}
                                <div className="p-4 border-t border-border bg-secondary/20">
                                    <Textarea
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        placeholder="Type your answer..."
                                        className="min-h-[100px] resize-none mb-3"
                                        disabled={isLoading}
                                    />
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleClose}
                                            className="flex-1"
                                        >
                                            End Interview
                                        </Button>
                                        <Button
                                            onClick={submitAnswer}
                                            disabled={!answer.trim() || isLoading}
                                            className="flex-1"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-2" size={16} />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2" size={16} />
                                                    Submit Answer
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
