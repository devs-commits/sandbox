import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, pin } = await request.json();
    if (!userId || !pin) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const { error } = await supabaseAdmin.from('wallets').update({ transaction_pin: pin }).eq('user_id', userId);
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}