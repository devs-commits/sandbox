/**
 * WDC Labs AI Backend Service
 * Centralized API layer for all AI backend interactions
 */

const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8001';

export interface ChatContext {
    task_id?: string;
    is_submission?: boolean;
    is_first_login?: boolean;
    user_level?: string;
    track?: string;
    task_brief?: string;
    deadline?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    agent: 'Tolu' | 'Emem' | 'Sola' | 'Kemi';
    message: string;
    metadata?: Record<string, any>;
}

export interface BioAssessmentResponse {
    response_text: string;
    assessed_level: 'Level 0' | 'Level 1' | 'Level 2';
    reasoning: string;
    warmup_mode: boolean;
}

export interface SubmissionReviewResponse {
    feedback: string;
    passed: boolean;
    score?: number;
    portfolio_bullet?: string;
}

export interface PortfolioBulletResponse {
    skill_tag: string;
    bullet_point: string;
}

export interface MockInterviewResponse {
    evaluation?: string;
    question: string;
    tip: string;
}

/**
 * Send a message to the AI chat system
 */
export async function sendChatMessage(
    userId: string,
    message: string,
    context: ChatContext = {},
    chatHistory: ChatMessage[] = []
): Promise<ChatResponse> {
    const response = await fetch(`${AI_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            message,
            context,
            chat_history: chatHistory
        })
    });

    if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
    }

    return response.json();
}

/**
 * Assess a user's bio/resume (Tolu)
 */
export async function assessBio(
    userId: string,
    bioText: string,
    track: string,
    fileUrl?: string
): Promise<BioAssessmentResponse> {
    const response = await fetch(`${AI_BACKEND_URL}/assess-bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            bio_text: bioText,
            file_url: fileUrl,
            track
        })
    });

    if (!response.ok) {
        throw new Error(`Bio assessment error: ${response.status}`);
    }

    return response.json();
}

/**
 * Submit work for Sola's review
 */
export async function reviewSubmission(
    userId: string,
    taskId: string,
    taskTitle: string,
    taskBrief: string,
    fileContent: string,
    fileUrl?: string,
    chatHistory: ChatMessage[] = []
): Promise<SubmissionReviewResponse> {
    const response = await fetch(`${AI_BACKEND_URL}/review-submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            task_id: taskId,
            file_url: fileUrl,
            file_content: fileContent,
            task_title: taskTitle,
            task_brief: taskBrief,
            chat_history: chatHistory
        })
    });

    if (!response.ok) {
        throw new Error(`Submission review error: ${response.status}`);
    }

    return response.json();
}

/**
 * Translate a task to a CV bullet point (Kemi)
 */
export async function translateToCV(
    taskTitle: string,
    taskDescription: string,
    userSubmission: string
): Promise<PortfolioBulletResponse> {
    const response = await fetch(`${AI_BACKEND_URL}/translate-to-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            task_title: taskTitle,
            task_description: taskDescription,
            user_submission: userSubmission
        })
    });

    if (!response.ok) {
        throw new Error(`CV translation error: ${response.status}`);
    }

    return response.json();
}

/**
 * Generate a mid-task client interruption (Emem)
 */
export async function generateInterruption(
    currentTask: string,
    interruptionType: 'scope_change' | 'constraint_added' | 'urgent_pivot' | 'data_correction' = 'scope_change'
): Promise<{ agent: string; message: string }> {
    const response = await fetch(`${AI_BACKEND_URL}/generate-interruption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            current_task: currentTask,
            interruption_type: interruptionType
        })
    });

    if (!response.ok) {
        throw new Error(`Interruption generation error: ${response.status}`);
    }

    return response.json();
}

/**
 * Get soft skills feedback (Kemi)
 */
export async function getSoftSkillsFeedback(
    recentInteractions: Array<{ user_message: string; agent_response: string }>
): Promise<{ agent: string; feedback: string }> {
    const response = await fetch(`${AI_BACKEND_URL}/soft-skills-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recent_interactions: recentInteractions })
    });

    if (!response.ok) {
        throw new Error(`Soft skills feedback error: ${response.status}`);
    }

    return response.json();
}

/**
 * Conduct a mock interview (Kemi)
 */
export async function conductMockInterview(
    interviewType: 'behavioral' | 'technical' | 'situational' = 'behavioral',
    questionNumber: number = 1,
    previousAnswer?: string
): Promise<MockInterviewResponse> {
    const response = await fetch(`${AI_BACKEND_URL}/mock-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            interview_type: interviewType,
            question_number: questionNumber,
            previous_answer: previousAnswer
        })
    });

    if (!response.ok) {
        throw new Error(`Mock interview error: ${response.status}`);
    }

    return response.json();
}

/**
 * Health check for AI backend
 */
export async function checkHealth(): Promise<{ status: string; agents: string[] }> {
    const response = await fetch(`${AI_BACKEND_URL}/health`);
    if (!response.ok) {
        throw new Error('AI backend is not available');
    }
    return response.json();
}
