import { NextResponse } from 'next/server';

/**
 * POST /api/chat - Proxy to AI Backend
 * Routes user messages to the appropriate AI agent
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, message, context, chatHistory } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8001';

        const response = await fetch(`${AI_BACKEND_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId || 'anonymous',
                message,
                context: context || {},
                chat_history: chatHistory || []
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Backend Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            agent: data.agent,
            message: data.message,
            metadata: data.metadata
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
