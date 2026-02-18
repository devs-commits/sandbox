"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, MessageSquare, Lightbulb, Send, TrendingUp, Target, Award, ChevronRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Progress } from '../../../../components/ui/progress';
import { AGENTS } from '../types';
import { useOffice } from '../../../../contexts/OfficeContext';
import { cn } from '@/lib/utils';

interface MockInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type InterviewType = 'behavioral' | 'technical' | 'situational';
type CompanyType = 'startup' | 'mid-size' | 'enterprise' | 'faang';
type ExperienceLevel = 'junior' | 'mid' | 'senior';

interface InterviewQuestion {
    question: string;
    tip: string;
    evaluation?: string;
    personalizedContext?: string;
}

interface InterviewSetup {
    targetRole: string;
    companyType: CompanyType;
    experienceLevel: ExperienceLevel;
    focusAreas: string[];
}

interface CoachingMetrics {
    clarity: number;
    relevance: number;
    completeness: number;
}

interface SessionAnalytics {
    overallScore: number;
    skillBreakdown: {
        behavioral: number;
        technical: number;
        situational: number;
    };
    improvementAreas: string[];
    readinessScore: number;
}

export function MockInterviewModal({ isOpen, onClose }: MockInterviewModalProps) {
    const { userLevel, portfolio, performanceMetrics } = useOffice();
    const [currentPhase, setCurrentPhase] = useState<'setup' | 'interview' | 'summary'>('setup');
    const [interviewType, setInterviewType] = useState<InterviewType>('behavioral');
    const [isStarted, setIsStarted] = useState(false);
    const [questionNumber, setQuestionNumber] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(5);
    const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<Array<{ question: string; answer: string; evaluation?: string; score?: number }>>([]);
    const [setup, setSetup] = useState<InterviewSetup>({
        targetRole: '',
        companyType: 'mid-size',
        experienceLevel: userLevel === 'Level 1' ? 'junior' : userLevel === 'Level 2' ? 'mid' : 'senior',
        focusAreas: []
    });
    const [coachingMetrics, setCoachingMetrics] = useState<CoachingMetrics>({
        clarity: 0,
        relevance: 0,
        completeness: 0
    });
    const [showCoaching, setShowCoaching] = useState(true);
    const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);

    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';
    const kemi = AGENTS.Kemi;

    // Real-time coaching metrics update
    useEffect(() => {
        if (answer.length > 0) {
            const words = answer.trim().split(/\s+/).length;
            const clarity = Math.min(100, (words / 50) * 100); // Target ~50 words
            const relevance = Math.min(100, (answer.length / 200) * 100); // Target ~200 chars
            const completeness = Math.min(100, (words / 30) * 100); // Minimum 30 words
            
            setCoachingMetrics({
                clarity: Math.round(clarity),
                relevance: Math.round(relevance),
                completeness: Math.round(completeness)
            });
        } else {
            setCoachingMetrics({ clarity: 0, relevance: 0, completeness: 0 });
        }
    }, [answer]);

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
                    previous_answer: null,
                    setup: {
                        target_role: setup.targetRole,
                        company_type: setup.companyType,
                        experience_level: setup.experienceLevel,
                        focus_areas: setup.focusAreas,
                        user_portfolio: portfolio,
                        performance_metrics: performanceMetrics,
                        user_level: userLevel
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentQuestion({
                    question: data.question,
                    tip: data.tip,
                    personalizedContext: data.personalized_context
                });
                setIsStarted(true);
                setCurrentPhase('interview');
            } else {
                console.error('Failed to start interview: ', response.statusText);
            }
        } catch (error) {
            console.error('Error starting interview:', error);
            alert('Failed to start interview. Please check your network connection or contact support.');
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
                    previous_answer: answer,
                    setup: {
                        target_role: setup.targetRole,
                        company_type: setup.companyType,
                        experience_level: setup.experienceLevel,
                        focus_areas: setup.focusAreas,
                        user_portfolio: portfolio,
                        performance_metrics: performanceMetrics,
                        user_level: userLevel
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();

                // Save current Q&A to history
                setHistory(prev => [...prev, {
                    question: currentQuestion?.question || '',
                    answer: answer,
                    evaluation: data.evaluation,
                    score: data.score
                }]);

                // Check if interview is complete
                if (questionNumber >= totalQuestions) {
                    setCurrentPhase('summary');
                    setSessionAnalytics({
                        overallScore: data.overall_score || 0,
                        skillBreakdown: {
                            behavioral: data.skill_breakdown?.behavioral || 0,
                            technical: data.skill_breakdown?.technical || 0,
                            situational: data.skill_breakdown?.situational || 0
                        },
                        improvementAreas: data.improvement_areas || [],
                        readinessScore: data.readiness_score || 0
                    });
                    return;
                }

                // Move to next question
                setCurrentQuestion({
                    question: data.question,
                    tip: data.tip,
                    evaluation: data.evaluation,
                    personalizedContext: data.personalized_context
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
        setCurrentPhase('setup');
        setIsStarted(false);
        setQuestionNumber(1);
        setCurrentQuestion(null);
        setAnswer('');
        setHistory([]);
        setSessionAnalytics(null);
        setCoachingMetrics({ clarity: 0, relevance: 0, completeness: 0 });
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
                        className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
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

                        {/* Setup Phase */}
                        {currentPhase === 'setup' && (
                            <div className="p-6 space-y-6 overflow-y-auto">
                                <div>
                                    <h4 className="font-medium text-foreground mb-4">Interview Setup</h4>
                                    
                                    {/* Target Role */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-foreground mb-2">Target Role</label>
                                        <input
                                            type="text"
                                            value={setup.targetRole}
                                            onChange={(e) => setSetup(prev => ({ ...prev, targetRole: e.target.value }))}
                                            placeholder="e.g. Frontend Developer, Data Analyst"
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>

                                    {/* Company Type */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-foreground mb-2">Company Type</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {(['startup', 'mid-size', 'enterprise', 'faang'] as CompanyType[]).map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSetup(prev => ({ ...prev, companyType: type }))}
                                                    className={`p-3 rounded-lg border transition-all capitalize ${
                                                        setup.companyType === type
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border hover:border-primary/50'
                                                    }`}
                                                >
                                                    {type === 'faang' ? 'FAANG' : type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Experience Level */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-foreground mb-2">Experience Level</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['junior', 'mid', 'senior'] as ExperienceLevel[]).map((level) => (
                                                <button
                                                    key={level}
                                                    onClick={() => setSetup(prev => ({ ...prev, experienceLevel: level }))}
                                                    className={`p-3 rounded-lg border transition-all capitalize ${
                                                        setup.experienceLevel === level
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border hover:border-primary/50'
                                                    }`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Interview Type */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-foreground mb-2">Interview Type</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {(['behavioral', 'technical', 'situational'] as InterviewType[]).map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setInterviewType(type)}
                                                    className={`p-4 rounded-lg border transition-all ${
                                                        interviewType === type
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border hover:border-primary/50'
                                                    }`}
                                                >
                                                    <span className="capitalize font-medium">{type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Focus Areas from Portfolio */}
                                    {portfolio.length > 0 && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-foreground mb-2">Focus Areas (from your portfolio)</label>
                                            <div className="space-y-2">
                                                {portfolio.map((item, index) => (
                                                    <label key={index} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-secondary/30 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={setup.focusAreas.includes(item.skillTag)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSetup(prev => ({ ...prev, focusAreas: [...prev.focusAreas, item.skillTag] }));
                                                                } else {
                                                                    setSetup(prev => ({ ...prev, focusAreas: prev.focusAreas.filter(area => area !== item.skillTag) }));
                                                                }
                                                            }}
                                                            className="rounded border-border"
                                                        />
                                                        <span className="text-sm text-foreground">{item.skillTag}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-secondary/30 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <MessageSquare className="text-primary mt-1" size={20} />
                                            <div>
                                                <p className="text-foreground text-sm">
                                                    {interviewType === 'behavioral' &&
                                                        "Behavioral interviews focus on past experiences. Use STAR method: Situation, Task, Action, Result."}
                                                    {interviewType === 'technical' &&
                                                        "Technical interviews test your problem-solving skills. Think out loud and explain your approach."}
                                                    {interviewType === 'situational' &&
                                                        "Situational interviews present hypothetical scenarios. Focus on demonstrating good judgment."}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={startInterview}
                                    disabled={isLoading || !setup.targetRole.trim()}
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
                        )}

                        {/* Interview Phase */}
                        {currentPhase === 'interview' && (
                            <div className="flex-1 flex overflow-hidden">
                                {/* Main Content */}
                                <div className="flex-1 flex flex-col">
                                    {/* Progress Bar */}
                                    <div className="p-4 border-b border-border bg-secondary/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-foreground">Progress</span>
                                            <span className="text-sm text-muted-foreground">{questionNumber}/{totalQuestions}</span>
                                        </div>
                                        <Progress value={(questionNumber / totalQuestions) * 100} className="h-2" />
                                    </div>

                                    {/* Question Display */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {/* Previous evaluation if any */}
                                        {currentQuestion?.evaluation && (
                                            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                                                <p className="text-sm text-foreground">{currentQuestion.evaluation}</p>
                                            </div>
                                        )}

                                        {/* Personalized Context */}
                                        {currentQuestion?.personalizedContext && (
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                                <div className="flex items-start gap-2">
                                                    <Target className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                                    <div>
                                                        <p className="text-xs font-medium text-blue-500 mb-1">Personalized Context</p>
                                                        <p className="text-sm text-foreground">{currentQuestion.personalizedContext}</p>
                                                    </div>
                                                </div>
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
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-foreground">Your Answer</span>
                                                <span className="text-xs text-muted-foreground">{answer.length} characters</span>
                                            </div>
                                            <Textarea
                                                value={answer}
                                                onChange={(e) => setAnswer(e.target.value)}
                                                placeholder="Type your answer..."
                                                className="min-h-[120px] resize-none"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setCurrentPhase('summary')}
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

                                {/* Coaching Panel */}
                                {showCoaching && (
                                    <div className="w-80 border-l border-border bg-secondary/10 p-4 overflow-y-auto">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-medium text-foreground">Real-Time Coaching</h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowCoaching(false)}
                                                className="h-6 w-6 p-0"
                                            >
                                                <X size={14} />
                                            </Button>
                                        </div>

                                        {/* Coaching Metrics */}
                                        <div className="space-y-3 mb-6">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-foreground">Clarity</span>
                                                    <span className="text-xs text-muted-foreground">{coachingMetrics.clarity}%</span>
                                                </div>
                                                <Progress value={coachingMetrics.clarity} className="h-1" />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-foreground">Relevance</span>
                                                    <span className="text-xs text-muted-foreground">{coachingMetrics.relevance}%</span>
                                                </div>
                                                <Progress value={coachingMetrics.relevance} className="h-1" />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-foreground">Completeness</span>
                                                    <span className="text-xs text-muted-foreground">{coachingMetrics.completeness}%</span>
                                                </div>
                                                <Progress value={coachingMetrics.completeness} className="h-1" />
                                            </div>
                                        </div>

                                        {/* Coaching Tips */}
                                        <div className="space-y-3">
                                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                                <p className="text-xs font-medium text-green-500 mb-1">Strength</p>
                                                <p className="text-xs text-foreground">
                                                    {coachingMetrics.clarity > 70 && "Clear structure and good articulation"}
                                                    {coachingMetrics.relevance > 70 && "Answer addresses the question directly"}
                                                    {coachingMetrics.completeness > 70 && "Comprehensive response with good examples"}
                                                </p>
                                            </div>
                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                                <p className="text-xs font-medium text-orange-500 mb-1">Suggestion</p>
                                                <p className="text-xs text-foreground">
                                                    {coachingMetrics.clarity < 50 && "Try to structure your answer more clearly"}
                                                    {coachingMetrics.relevance < 50 && "Make sure your answer directly addresses the question"}
                                                    {coachingMetrics.completeness < 50 && "Add more specific examples to support your points"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Toggle Coaching Button (when coaching is hidden) */}
                                {!showCoaching && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowCoaching(true)}
                                        className="fixed bottom-6 right-6 z-10"
                                    >
                                        <Lightbulb size={14} className="mr-2" />
                                        Show Coaching
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Summary Phase */}
                        {currentPhase === 'summary' && sessionAnalytics && (
                            <div className="p-6 overflow-y-auto">
                                <h4 className="font-medium text-foreground mb-6">Interview Summary</h4>
                                
                                {/* Overall Score */}
                                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <Award className="text-primary" size={24} />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Overall Score</p>
                                            <p className="text-2xl font-bold text-foreground">{sessionAnalytics.overallScore}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Skill Breakdown */}
                                <div className="mb-6">
                                    <h5 className="font-medium text-foreground mb-3">Skill Breakdown</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-card border border-border rounded-lg p-3">
                                            <p className="text-xs text-muted-foreground mb-1">Behavioral</p>
                                            <p className="text-lg font-semibold text-foreground">{sessionAnalytics.skillBreakdown.behavioral}%</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-lg p-3">
                                            <p className="text-xs text-muted-foreground mb-1">Technical</p>
                                            <p className="text-lg font-semibold text-foreground">{sessionAnalytics.skillBreakdown.technical}%</p>
                                        </div>
                                        <div className="bg-card border border-border rounded-lg p-3">
                                            <p className="text-xs text-muted-foreground mb-1">Situational</p>
                                            <p className="text-lg font-semibold text-foreground">{sessionAnalytics.skillBreakdown.situational}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Readiness Score */}
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="text-green-500" size={24} />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Interview Readiness</p>
                                            <p className="text-2xl font-bold text-foreground">{sessionAnalytics.readinessScore}%</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Improvement Areas */}
                                {sessionAnalytics.improvementAreas.length > 0 && (
                                    <div className="mb-6">
                                        <h5 className="font-medium text-foreground mb-3">Areas for Improvement</h5>
                                        <div className="space-y-2">
                                            {sessionAnalytics.improvementAreas.map((area, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                                    <ChevronRight className="text-orange-500" size={16} />
                                                    <span className="text-sm text-foreground">{area}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={resetInterview}
                                        className="flex-1"
                                    >
                                        Practice Again
                                    </Button>
                                    <Button
                                        onClick={handleClose}
                                        className="flex-1"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
