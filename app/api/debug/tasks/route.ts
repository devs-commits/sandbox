import { supabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Try to fetch one task to see structure
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .limit(1);

    const keys = data && data.length > 0 ? Object.keys(data[0]) : [];

    return NextResponse.json({
      success: !error,
      keys,
      data,
      error,
      env: {
        hasAdmin: !!supabaseAdmin
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
