import { NextResponse } from 'next/server';

/**
 * POST /api/onboarding/bio - Bio Assessment Endpoint
 * Tolu assesses the user's bio/resume and assigns a skill level
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, bioText, fileUrl, track } = body;

        if (!bioText && !fileUrl) {
            return NextResponse.json(
                { error: 'Either bioText or fileUrl is required' },
                { status: 400 }
            );
        }

        const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8001';

        const response = await fetch(`${AI_BACKEND_URL}/assess-bio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId || 'anonymous',
                bio_text: bioText,
                file_url: fileUrl,
                track: track || 'General'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Backend Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            responseText: data.response_text,
            assessedLevel: data.assessed_level,
            reasoning: data.reasoning,
            warmupMode: data.warmup_mode
        });

    } catch (error: any) {
        console.error('Bio Assessment API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
