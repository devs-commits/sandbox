import { NextRequest, NextResponse } from 'next/server';

// 🔥 CRITICAL FIX: Forces Vercel to keep the connection open for the AI to finish
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const AI_BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'https://wdc-labs-ai.onrender.com';

    const pythonResponse = await fetch(`${AI_BACKEND_URL}/regenerate-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await pythonResponse.json();

    if (!pythonResponse.ok) {
        return NextResponse.json(
            { error: data.detail || data.error || "Failed to regenerate task" }, 
            { status: pythonResponse.status }
        );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}